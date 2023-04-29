import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateScoreDto } from './dto/create-score.dto';
import { PrismaService } from '../prisma/prisma.service';
import { GAMES_LEVELS } from './constants';

@Injectable()
export class GamesService {
  constructor(private prisma: PrismaService) {}

  async addScore(dto: CreateScoreDto, userId: number) {
    if (dto.level) {
      if (
        !GAMES_LEVELS[dto.gameName] ||
        !GAMES_LEVELS[dto.gameName].includes(dto.level)
      ) {
        throw new BadRequestException('level does not exist');
      }
    }
    if (GAMES_LEVELS[dto.gameName] && !dto.level) {
      throw new BadRequestException('level not specified');
    }
    await this.prisma.score.create({
      data: {
        ...dto,
        userId
      }
    });
    const scores = await this.getScoresByGameName(dto.gameName);
    return scores;
  }

  async getScoresByGameName(gameName: string) {
    const gameLevels = GAMES_LEVELS[gameName];
    if (gameLevels) {
      const scores = await Promise.all(
        gameLevels.map((level) =>
          this.getScoresByGameNameAndLevel(gameName, level)
        )
      );
      return {
        scores: scores.flat(),
        withLevels: true
      };
    }

    const scores = await this.prisma.score.findMany({
      where: {
        gameName
      },
      orderBy: {
        value: 'desc'
      },
      include: {
        User: {
          select: {
            username: true,
            id: true
          }
        }
      },
      take: 10
    });

    return {
      scores,
      withLevels: false
    };
  }

  private async getScoresByGameNameAndLevel(gameName: string, level: string) {
    return this.prisma.score.findMany({
      where: {
        gameName,
        level
      },
      orderBy: {
        value: 'desc'
      },
      include: {
        User: {
          select: {
            username: true,
            id: true
          }
        }
      },
      take: 10
    });
  }
}
