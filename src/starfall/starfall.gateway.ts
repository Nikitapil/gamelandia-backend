import { HttpException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayInit,
  WebSocketGateway
} from '@nestjs/websockets';
import { Namespace, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { StarfallService } from './starfall.service';
import { gameRoom, StarfallRealtimeService } from './starfall-realtime.service';

@WebSocketGateway({
  namespace: '/starfall',
  transports: ['websocket'],
  cors: { origin: process.env.CLIENT_URL, credentials: true }
})
export class StarfallGateway implements OnGatewayInit, OnGatewayConnection {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly games: StarfallService,
    private readonly realtime: StarfallRealtimeService
  ) {}

  afterInit(server: Namespace) {
    this.realtime.bind(server);
    server.use(async (socket, next) => {
      let status = 401;
      try {
        const { token, gameId } = socket.handshake.auth;
        if (typeof token !== 'string') throw new Error('Missing token');
        const payload = await this.jwt.verifyAsync<{ id: number; exp: number }>(
          token,
          {
            secret: process.env.ACCESS_SECRET
          }
        );
        if (
          !Number.isSafeInteger(payload.id) ||
          !Number.isFinite(payload.exp)
        ) {
          throw new Error('Invalid token');
        }
        const user = await this.prisma.user.findUnique({
          where: { id: payload.id },
          select: { id: true }
        });
        if (!user) throw new Error('Unknown user');
        status = 400;
        if (typeof gameId !== 'string' || !gameId || gameId.length > 128) {
          throw new Error('Invalid game id');
        }
        status = 503;
        await this.games.getGameView(gameId, String(user.id));
        socket.data = {
          playerId: String(user.id),
          gameId,
          expiresAt: payload.exp * 1000
        };
        next();
      } catch (error) {
        next(
          Object.assign(new Error('Unable to connect to game'), {
            data: {
              status:
                error instanceof HttpException ? error.getStatus() : status
            }
          })
        );
      }
    });
  }

  async handleConnection(socket: Socket) {
    const { gameId, playerId, expiresAt } = socket.data;
    const expiry = setTimeout(() => {
      socket.emit('game:error', { status: 401 });
      socket.disconnect(true);
    }, Math.min(Math.max(0, expiresAt - Date.now()), 2147483647));
    expiry.unref();
    socket.once('disconnect', () => clearTimeout(expiry));
    try {
      await socket.join(gameRoom(gameId));
      // Read after joining so concurrent broadcasts cannot fall into a gap.
      const view = await this.games.getGameView(gameId, playerId);
      if (socket.connected && expiresAt > Date.now())
        socket.emit('game:state', view);
    } catch (error) {
      socket.emit('game:error', {
        status: error instanceof HttpException ? error.getStatus() : 503
      });
      socket.disconnect(true);
    }
  }
}
