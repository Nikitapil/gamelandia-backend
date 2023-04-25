import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { GamesService } from './games.service';
import { JwtGuard } from '../Guards/auth/jwt.guard';
import { User } from '../decorators/User.decorator';
import { CreateScoreDto } from './dto/create-score.dto';

@Controller('games')
export class GamesController {
  constructor(private gamesService: GamesService) {}

  @UseGuards(JwtGuard)
  @Post('/score')
  addScore(@Body() dto: CreateScoreDto, @User('id') userId: number) {
    return this.gamesService.addScore(dto, userId);
  }

  @Get('/score/:name')
  getScoresByGameName(@Param('name') name: string) {
    return this.gamesService.getScoresByGameName(name);
  }
}
