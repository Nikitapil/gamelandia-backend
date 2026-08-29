import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  getSchemaPath
} from '@nestjs/swagger';
import { User } from '../decorators/User.decorator';
import { JwtGuard } from '../guards/auth/jwt.guard';
import { CreateStarfallGameDto } from './dto/create-starfall-game.dto';
import { JoinStarfallGameDto } from './dto/join-starfall-game.dto';
import { StartStarfallGameDto } from './dto/start-starfall-game.dto';
import { StarfallCommandDto } from './dto/starfall-command.dto';
import { StarfallGameViewDto } from './dto/starfall-game-view.dto';
import { GetStarfallGamesQueryDto } from './dto/get-starfall-games-query.dto';
import { StarfallGameListItemDto } from './dto/starfall-game-list-item.dto';
import { STARFALL_COMMAND_SWAGGER_MODELS } from './dto/starfall-command.swagger.dto';
import { StarfallService } from './starfall.service';
import {
  StarfallGameContext,
  StarfallGameContextValue
} from './starfall-game-context.decorator';

@ApiTags('Starfall')
@ApiBearerAuth()
@ApiExtraModels(...STARFALL_COMMAND_SWAGGER_MODELS)
@Controller('starfall')
@UseGuards(JwtGuard)
export class StarfallController {
  constructor(private readonly starfallService: StarfallService) {}

  @Post('games')
  @ApiOperation({
    summary: 'Create a Starfall game',
    operationId: 'createStarfallGame'
  })
  @ApiResponse({ status: 201, type: StarfallGameViewDto })
  createGame(@Body() dto: CreateStarfallGameDto, @User('id') userId: number) {
    return this.starfallService.createGame(dto, String(userId));
  }

  @Get('games')
  @ApiOperation({
    summary: 'Get Starfall games ordered from newest to oldest',
    operationId: 'getStarfallGames'
  })
  @ApiResponse({ status: 200, type: [StarfallGameListItemDto] })
  getGames(@Query() dto: GetStarfallGamesQueryDto) {
    return this.starfallService.getGames(dto);
  }

  @Get('games/:gameId')
  @ApiOperation({
    summary: 'Get private Starfall game state',
    operationId: 'getStarfallGame'
  })
  @ApiParam({ name: 'gameId', type: String })
  @ApiResponse({ status: 200, type: StarfallGameViewDto })
  getGame(@StarfallGameContext() context: StarfallGameContextValue) {
    return this.starfallService.getGameView(context.gameId, context.playerId);
  }

  @Post('games/:gameId/join')
  @ApiOperation({
    summary: 'Join a waiting Starfall game',
    operationId: 'joinStarfallGame'
  })
  @ApiParam({ name: 'gameId', type: String })
  @ApiResponse({ status: 201, type: StarfallGameViewDto })
  joinGame(
    @Body() dto: JoinStarfallGameDto,
    @StarfallGameContext() context: StarfallGameContextValue
  ) {
    return this.starfallService.joinGame({
      gameId: context.gameId,
      dto,
      playerId: context.playerId
    });
  }

  @Post('games/:gameId/start')
  @ApiOperation({
    summary: 'Start a Starfall game',
    operationId: 'startStarfallGame'
  })
  @ApiParam({ name: 'gameId', type: String })
  @ApiResponse({ status: 201, type: StarfallGameViewDto })
  startGame(
    @Body() dto: StartStarfallGameDto,
    @StarfallGameContext() context: StarfallGameContextValue
  ) {
    return this.starfallService.startGame({
      gameId: context.gameId,
      dto,
      playerId: context.playerId
    });
  }

  @Post('games/:gameId/commands')
  @ApiOperation({
    summary: 'Execute a Starfall game command',
    operationId: 'executeStarfallCommand'
  })
  @ApiParam({ name: 'gameId', type: String })
  @ApiBody({
    schema: {
      oneOf: STARFALL_COMMAND_SWAGGER_MODELS.map((model) => ({
        $ref: getSchemaPath(model)
      })),
      discriminator: { propertyName: 'type' }
    }
  })
  @ApiResponse({ status: 201, type: StarfallGameViewDto })
  @ApiResponse({ status: 400, description: 'Invalid command' })
  @ApiResponse({ status: 409, description: 'Game state version conflict' })
  executeCommand(
    @Body() dto: StarfallCommandDto,
    @StarfallGameContext() context: StarfallGameContextValue
  ) {
    return this.starfallService.execute({
      gameId: context.gameId,
      dto,
      playerId: context.playerId
    });
  }
}
