import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { GamesService } from './games.service';
import { JwtGuard } from '../guards/auth/jwt.guard';
import { User } from '../decorators/User.decorator';
import { CreateScoreDto } from './dto/score/create-score.dto';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  getSchemaPath
} from '@nestjs/swagger';
import { ScoreReturnDto } from './dto/score/score-return.dto';
import { UpdateWinsCountDto } from './dto/win-count/update-wins-count.dto';
import { LevelsGuard } from './guards/levels.guard';

@ApiTags('Games')
@Controller('games')
export class GamesController {
  constructor(private gamesService: GamesService) {}

  @ApiOperation({ summary: 'add score' })
  @ApiResponse({ status: 201, type: [ScoreReturnDto] })
  @UseGuards(JwtGuard)
  @UseGuards(LevelsGuard)
  @Post('/score')
  addScore(@Body() dto: CreateScoreDto, @User('id') userId: number) {
    return this.gamesService.addScore(dto, userId);
  }

  @ApiOperation({ summary: 'get score' })
  @ApiResponse({
    status: 200,
    schema: {
      properties: {
        scores: {
          type: 'array',
          items: {
            allOf: [{ $ref: getSchemaPath(ScoreReturnDto) }]
          }
        },
        withLevels: {
          type: 'boolean'
        }
      }
    }
  })
  @Get('/score/:name')
  getScoresByGameName(@Param('name') name: string) {
    return this.gamesService.getScoresByGameName(name);
  }

  @ApiOperation({ summary: 'add winCount' })
  @ApiResponse({ status: 201, type: [ScoreReturnDto] })
  @UseGuards(JwtGuard)
  @UseGuards(LevelsGuard)
  @Post('/win')
  updateWinsCount(@Body() dto: UpdateWinsCountDto, @User('id') userId: number) {
    return this.gamesService.updateWinsCount(dto, userId);
  }

  @ApiOperation({ summary: 'get winCount by game name' })
  @ApiResponse({ status: 200, type: [ScoreReturnDto] })
  @Get('/win/:name')
  getWinnersByGameName(@Param('name') name: string) {
    return this.gamesService.getWinnersByGameName(name);
  }
}
