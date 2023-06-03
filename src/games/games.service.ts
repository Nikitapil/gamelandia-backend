import { Injectable } from '@nestjs/common';
import { CreateScoreDto } from './dto/score/create-score.dto';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateWinsCountDto } from './dto/win-count/update-wins-count.dto';
import { GAMES_LEVELS } from './constants';

@Injectable()
export class GamesService {
  constructor(private prisma: PrismaService) {}

  async addScore(dto: CreateScoreDto, userId: number) {
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
            username: true
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
            username: true
          }
        }
      },
      take: 10
    });
  }

  async updateWinsCount(dto: UpdateWinsCountDto, userId: number) {
    const { gameName, level = 'default' } = dto;
    const scores = await this.prisma.winCount.upsert({
      where: {
        uniq_combination: { gameName, level, userId }
      },
      create: {
        gameName,
        level,
        userId,
        value: 1
      },
      update: {
        value: { increment: 1 }
      }
    });

    return this.getWinnersByGameName(dto.gameName);
  }

  async getWinnersByGameName(gameName: string) {
    return this.prisma.winCount.findMany({
      where: {
        gameName
      },
      orderBy: {
        value: 'desc'
      },
      include: {
        User: {
          select: {
            username: true
          }
        }
      },
      take: 10
    });
  }
}
