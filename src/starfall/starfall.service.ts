import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { randomInt, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { cards } from './domain/constants';
import { CardFromDb } from './domain/dbTypes';
import { CreateStarfallGameDto } from './dto/create-starfall-game.dto';
import { JoinStarfallGameDto } from './dto/join-starfall-game.dto';
import { GetStarfallGamesQueryDto } from './dto/get-starfall-games-query.dto';
import { StarfallGameListItemDto } from './dto/starfall-game-list-item.dto';
import {
  StarfallCommandDto,
  TypedStarfallCommandDto
} from './dto/starfall-command.dto';
import { GameEntity } from './entities/game.entity';
import { getStarfallGamesPlayersSelect } from './db-helpers';
import { Prisma } from '@prisma/client';
import { StarfallRealtimeService } from './starfall-realtime.service';

interface GameRequest<T> {
  gameId: string;
  dto: T;
  playerId: string;
}

interface ApplyCommandParams {
  game: GameEntity;
  dto: TypedStarfallCommandDto;
  playerId: string;
}

interface SaveGameParams {
  game: GameEntity;
  expectedVersion: number;
  playerIdToConnect?: string;
}

@Injectable()
export class StarfallService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: StarfallRealtimeService
  ) {}

  async createGame(dto: CreateStarfallGameDto, playerId: string) {
    const initialCards: CardFromDb[] = cards.flatMap((definition) =>
      Array.from({ length: definition.count }, () => ({
        id: randomUUID(),
        name: definition.name,
        isPlayed: false,
        deck:
          definition.deck === 'trade'
            ? ('unused-deck' as const)
            : definition.deck === 'explorer'
            ? ('explorers' as const)
            : ('starter-cards' as const)
      }))
    );
    const game = new GameEntity({
      startingHp: dto.startingHp,
      players: [
        {
          id: playerId,
          cards: [],
          hp: dto.startingHp,
          money: 0,
          attack: 0,
          discardCardsCount: 0,
          isWinner: false
        }
      ],
      gameCards: initialCards,
      currentPlayerId: playerId,
      status: 'waiting'
    });
    game.initNewGame(initialCards);
    const record = await this.prisma.starfallGame.create({
      data: {
        id: game.id,
        version: game.version,
        status: game.status,
        state: game.toSnapshot(),
        players: {
          connect: { id: this.userId(playerId) }
        }
      },
      select: getStarfallGamesPlayersSelect()
    });
    game.setPlayerNames(record.players);
    return this.privateView(game, playerId);
  }

  async getGames(
    dto: GetStarfallGamesQueryDto,
    userId: string
  ): Promise<StarfallGameListItemDto[]> {
    const onlyNotStarted = dto.notStarted === true || dto.notStarted === 'true';
    const isMy = dto.my === true || dto.my === 'true';

    const where: Prisma.StarfallGameWhereInput = {};

    if (onlyNotStarted) {
      where.status = 'waiting';
    }

    if (isMy) {
      where.players = {
        some: {
          id: this.userId(userId)
        }
      };
    }

    const games = await this.prisma.starfallGame.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        players: {
          select: { username: true }
        }
      }
    });

    return games.map((game) => ({
      id: game.id,
      createdAt: game.createdAt,
      players: game.players.map((player) => player.username)
    }));
  }

  async joinGame({ gameId, dto, playerId }: GameRequest<JoinStarfallGameDto>) {
    const game = await this.getGame(gameId);
    if (game.players.some((player) => player.id === playerId))
      return this.privateView(game, playerId);
    try {
      game.executeCommand({
        commandId: `join:${playerId}:${dto.expectedVersion}`,
        expectedVersion: dto.expectedVersion,
        command: () => {
          game.addPlayer(playerId);
          game.startGame(game.players[randomInt(game.players.length)].id);
        }
      });
      await this.saveWithOptimisticLock({
        game,
        expectedVersion: dto.expectedVersion,
        playerIdToConnect: playerId
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.startsWith('State version conflict')
      ) {
        throw new ConflictException(error.message);
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Unable to join game'
      );
    }
    await this.realtime.publish(game);
    return this.privateView(game, playerId);
  }

  async getGameView(gameId: string, playerId: string) {
    return this.privateView(await this.getGame(gameId), playerId);
  }

  async execute({ gameId, dto, playerId }: GameRequest<StarfallCommandDto>) {
    const game = await this.getGame(gameId);
    this.assertParticipant(game, playerId);
    if (game.processedCommandIds.has(dto.commandId)) {
      return this.privateView(game, playerId);
    }

    try {
      game.executeCommand({
        commandId: dto.commandId,
        expectedVersion: dto.expectedVersion,
        command: () =>
          this.applyCommand({
            game,
            dto: dto as TypedStarfallCommandDto,
            playerId
          })
      });
      await this.saveWithOptimisticLock({
        game,
        expectedVersion: dto.expectedVersion
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.startsWith('State version conflict')
      ) {
        throw new ConflictException(error.message);
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid Starfall command'
      );
    }

    await this.realtime.publish(game);
    return this.privateView(game, playerId);
  }

  async getLobby(gameId: string) {
    const game = await this.getGame(gameId);
    return {
      id: game.id,
      status: game.status,
      version: game.version,
      startingHp: game.startingHp,
      players: game.playerNames
    };
  }

  private assertParticipant(game: GameEntity, playerId: string) {
    if (!game.players.some((player) => player.id === playerId)) {
      throw new ForbiddenException('You are not a participant in this game');
    }
  }

  private privateView(game: GameEntity, playerId: string) {
    this.assertParticipant(game, playerId);
    return game.getViewFor(playerId);
  }

  private applyCommand({ game, dto, playerId }: ApplyCommandParams) {
    switch (dto.type) {
      case 'play_card':
        return game.playCard(playerId, dto.payload.cardId);
      case 'buy_card':
        return game.buyCard(playerId, dto.payload.cardId);
      case 'use_ability':
        return game.useCardAbility({
          playerId,
          cardId: dto.payload.cardId,
          abilityId: dto.payload.abilityId
        });
      case 'resolve_pending':
        return game.resolvePendingAction(playerId, dto.payload);
      case 'cancel_pending':
        return game.cancelPendingAction(playerId);
      case 'attack_base':
        return game.attackBase(playerId, dto.payload.cardId);
      case 'attack_player':
        return game.attackPlayer(playerId, dto.payload.amount);
      case 'end_turn':
        return game.endTurn(playerId);
    }
  }

  private async getGame(gameId: string) {
    const record = await this.prisma.starfallGame.findUnique({
      where: { id: gameId },
      select: {
        state: true,
        ...getStarfallGamesPlayersSelect()
      }
    });
    if (!record) throw new NotFoundException('Starfall game not found');
    const game = GameEntity.fromSnapshot(record.state);
    game.setPlayerNames(record.players);
    return game;
  }

  private async saveWithOptimisticLock({
    game,
    expectedVersion,
    playerIdToConnect
  }: SaveGameParams) {
    const snapshot = game.toSnapshot();
    try {
      const record = await this.prisma.starfallGame.update({
        where: {
          id_version: {
            id: game.id,
            version: expectedVersion
          }
        },
        data: {
          version: snapshot.version,
          status: snapshot.status,
          state: snapshot,
          ...(playerIdToConnect
            ? {
                players: {
                  connect: { id: this.userId(playerIdToConnect) }
                }
              }
            : {})
        },
        select: {
          id: true,
          ...(playerIdToConnect ? getStarfallGamesPlayersSelect() : false)
        }
      });
      if (playerIdToConnect && record.players) {
        game.setPlayerNames(record.players);
      }
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2025'
      ) {
        throw new Error(
          `State version conflict: expected ${expectedVersion}, persisted state changed`
        );
      }
      throw error;
    }
  }

  private userId(value: string) {
    const id = Number(value);
    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new Error(`Invalid user id: ${value}`);
    }
    return id;
  }
}
