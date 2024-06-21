import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { GamesService } from './games.service';
import { JwtGuard } from '../guards/auth/jwt.guard';
import { User } from '../decorators/User.decorator';
import { CreateScoreDto } from './dto/score/create-score.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateWinsCountDto } from './dto/win-count/update-wins-count.dto';
import { LevelsGuard } from './guards/levels.guard';
import { ReturnStatisticDto } from './dto/statistic/return-statistic.dto';
import { AddScoreReturnDto } from './dto/AddScoreReturnDto';
import { WinCountReturnDto } from './dto/win-count/win-count-return.dto';

@ApiTags('Games')
@Controller('games')
export class GamesController {
  constructor(private gamesService: GamesService) {}

  @ApiOperation({ summary: 'add score', operationId: 'addScore' })
  @ApiResponse({ status: 201, type: AddScoreReturnDto })
  @UseGuards(JwtGuard)
  @UseGuards(LevelsGuard)
  @Post('/score')
  addScore(
    @Body() dto: CreateScoreDto,
    @User('id') userId: number
  ): Promise<AddScoreReturnDto> {
    return this.gamesService.addScore(dto, userId);
  }

  @ApiOperation({ summary: 'get score', operationId: 'getScoresByGameName' })
  @ApiResponse({ status: 200, type: AddScoreReturnDto })
  @Get('/score/:name')
  getScoresByGameName(@Param('name') name: string): Promise<AddScoreReturnDto> {
    return this.gamesService.getScoresByGameName(name);
  }

  @ApiOperation({ summary: 'add winCount', operationId: 'updateWinsCount' })
  @ApiResponse({ status: 201, type: [WinCountReturnDto] })
  @UseGuards(JwtGuard)
  @UseGuards(LevelsGuard)
  @Post('/win')
  updateWinsCount(
    @Body() dto: UpdateWinsCountDto,
    @User('id') userId: number
  ): Promise<WinCountReturnDto[]> {
    return this.gamesService.updateWinsCount(dto, userId);
  }

  @ApiOperation({
    summary: 'get winCount by game name',
    operationId: 'getWinnersByGameName'
  })
  @ApiResponse({ status: 200, type: [WinCountReturnDto] })
  @Get('/win/:name')
  getWinnersByGameName(
    @Param('name') name: string
  ): Promise<WinCountReturnDto[]> {
    return this.gamesService.getWinnersByGameName(name);
  }

  @ApiOperation({
    summary: 'get user game statistics',
    operationId: 'getMyStatistics'
  })
  @ApiResponse({ status: 200, type: [ReturnStatisticDto] })
  @UseGuards(JwtGuard)
  @Get('/my_statistics')
  getMyStatistics(@User('id') userId: number): Promise<ReturnStatisticDto[]> {
    return this.gamesService.getMyStatistic(userId);
  }
}
