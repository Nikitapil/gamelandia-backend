import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface StarfallGameContextValue {
  gameId: string;
  playerId: string;
}

export const StarfallGameContext = createParamDecorator(
  (_data: unknown, context: ExecutionContext): StarfallGameContextValue => {
    const request = context.switchToHttp().getRequest();
    return {
      gameId: request.params.gameId,
      playerId: String(request.user.id)
    };
  }
);
