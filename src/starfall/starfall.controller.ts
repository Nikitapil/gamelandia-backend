import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { User } from '../decorators/User.decorator';
import { JwtGuard } from '../guards/auth/jwt.guard';
import { CreateStarfallGameDto } from './dto/create-starfall-game.dto';
import { JoinStarfallGameDto } from './dto/join-starfall-game.dto';
import { StartStarfallGameDto } from './dto/start-starfall-game.dto';
import { StarfallCommandDto } from './dto/starfall-command.dto';
import { StarfallService } from './starfall.service';

@Controller('starfall')
@UseGuards(JwtGuard)
export class StarfallController {
  constructor(private readonly starfallService: StarfallService) {}

  @Post('games')
  createGame(@Body() dto: CreateStarfallGameDto, @User('id') userId: number) {
    return this.starfallService.createGame(dto, String(userId));
  }

  @Get('games/:gameId')
  getGame(@Param('gameId') gameId: string, @User('id') userId: number) {
    return this.starfallService.getGameView(gameId, String(userId));
  }

  @Post('games/:gameId/join')
  joinGame(
    @Param('gameId') gameId: string,
    @Body() dto: JoinStarfallGameDto,
    @User('id') userId: number
  ) {
    return this.starfallService.joinGame(gameId, dto, String(userId));
  }

  @Post('games/:gameId/start')
  startGame(
    @Param('gameId') gameId: string,
    @Body() dto: StartStarfallGameDto,
    @User('id') userId: number
  ) {
    return this.starfallService.startGame(gameId, dto, String(userId));
  }

  @Post('games/:gameId/commands')
  executeCommand(
    @Param('gameId') gameId: string,
    @Body() dto: StarfallCommandDto,
    @User('id') userId: number
  ) {
    return this.starfallService.execute(gameId, dto, String(userId));
  }
}
