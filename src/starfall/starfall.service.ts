import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { cards } from './domain/constants';
import { CardFromDb } from './domain/dbTypes';
import { CreateStarfallGameDto } from './dto/create-starfall-game.dto';
import { JoinStarfallGameDto } from './dto/join-starfall-game.dto';
import { StartStarfallGameDto } from './dto/start-starfall-game.dto';
import {
  StarfallCommandDto,
  TypedStarfallCommandDto
} from './dto/starfall-command.dto';
import { GameEntity } from './entities/game.entity';

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
  constructor(private readonly prisma: PrismaService) {}

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
    await this.prisma.starfallGame.create({
      data: {
        id: game.id,
        version: game.version,
        state: game.toSnapshot(),
        players: {
          connect: { id: this.userId(playerId) }
        }
      }
    });
    return game.getViewFor(playerId);
  }

  async joinGame({ gameId, dto, playerId }: GameRequest<JoinStarfallGameDto>) {
    const game = await this.getGame(gameId);
    try {
      game.executeCommand({
        commandId: `join:${playerId}:${dto.expectedVersion}`,
        expectedVersion: dto.expectedVersion,
        command: () => game.addPlayer(playerId)
      });
      await this.saveWithOptimisticLock({
        game,
        expectedVersion: dto.expectedVersion,
        playerIdToConnect: playerId
      });
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Unable to join game'
      );
    }
    return game.getViewFor(playerId);
  }

  async startGame({
    gameId,
    dto,
    playerId
  }: GameRequest<StartStarfallGameDto>) {
    const game = await this.getGame(gameId);
    try {
      game.executeCommand({
        commandId: dto.commandId,
        expectedVersion: dto.expectedVersion,
        command: () => game.startGame(playerId)
      });
      await this.saveWithOptimisticLock({
        game,
        expectedVersion: dto.expectedVersion
      });
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Unable to start game'
      );
    }
    return game.getViewFor(playerId);
  }

  async getGameView(gameId: string, playerId: string) {
    return (await this.getGame(gameId)).getViewFor(playerId);
  }

  async execute({ gameId, dto, playerId }: GameRequest<StarfallCommandDto>) {
    const game = await this.getGame(gameId);
    if (game.processedCommandIds.has(dto.commandId)) {
      return game.getViewFor(playerId);
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
      where: { id: gameId }
    });
    if (!record) throw new NotFoundException('Starfall game not found');
    return GameEntity.fromSnapshot(record.state);
  }

  private async saveWithOptimisticLock({
    game,
    expectedVersion,
    playerIdToConnect
  }: SaveGameParams) {
    const snapshot = game.toSnapshot();
    try {
      await this.prisma.starfallGame.update({
        where: {
          id_version: {
            id: game.id,
            version: expectedVersion
          }
        },
        data: {
          version: snapshot.version,
          state: snapshot,
          ...(playerIdToConnect
            ? {
                players: {
                  connect: { id: this.userId(playerIdToConnect) }
                }
              }
            : {})
        }
      });
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
