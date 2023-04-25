import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { GamesService } from './games.service';
import { JwtGuard } from '../Guards/auth/jwt.guard';
import { User } from '../decorators/User.decorator';
import { CreateScoreDto } from './dto/create-score.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ScoreReturnDto } from './dto/score-return.dto';

@ApiTags('Games')
@Controller('games')
export class GamesController {
  constructor(private gamesService: GamesService) {}

  @ApiOperation({ summary: 'add score' })
  @ApiResponse({ status: 201, type: [ScoreReturnDto] })
  @UseGuards(JwtGuard)
  @Post('/score')
  addScore(@Body() dto: CreateScoreDto, @User('id') userId: number) {
    return this.gamesService.addScore(dto, userId);
  }

  @ApiOperation({ summary: 'get score' })
  @ApiResponse({ status: 200, type: [ScoreReturnDto] })
  @Get('/score/:name')
  getScoresByGameName(@Param('name') name: string) {
    return this.gamesService.getScoresByGameName(name);
  }
}
