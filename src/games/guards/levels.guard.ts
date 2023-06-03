import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { GAMES_LEVELS } from '../constants';

@Injectable()
export class LevelsGuard implements CanActivate {
  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const { gameName, level = '' } = request.body;
    if (level) {
      if (!GAMES_LEVELS[gameName] || !GAMES_LEVELS[gameName].includes(level)) {
        throw new BadRequestException('level does not exist');
      }
    }
    if (GAMES_LEVELS[gameName] && !level) {
      throw new BadRequestException('level not specified');
    }
    return true;
  }
}
