import { Injectable, Logger } from '@nestjs/common';
import { Namespace } from 'socket.io';
import { GameEntity } from './entities/game.entity';

export const gameRoom = (gameId: string) => `game:${gameId}`;

@Injectable()
export class StarfallRealtimeService {
  private server?: Namespace;
  private readonly logger = new Logger(StarfallRealtimeService.name);

  bind(server: Namespace) {
    this.server = server;
  }

  async publish(game: GameEntity) {
    if (!this.server) return;
    try {
      const sockets = await this.server.in(gameRoom(game.id)).fetchSockets();
      const views = new Map(
        game.players.map((player) => [player.id, game.getViewFor(player.id)])
      );
      for (const socket of sockets) {
        const view = views.get(socket.data.playerId);
        if (view && socket.data.expiresAt > Date.now()) {
          socket.emit('game:state', view);
        }
      }
    } catch (error) {
      // Delivery failures must not turn a committed command into an HTTP error.
      this.logger.error('Unable to publish Starfall state', error);
      this.server.in(gameRoom(game.id)).disconnectSockets(true);
    }
  }
}
