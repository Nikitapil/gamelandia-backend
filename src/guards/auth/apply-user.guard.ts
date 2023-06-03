import { AuthGuard } from '@nestjs/passport';

export class ApplyUserGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    if (user) {
      return user;
    }
    return null;
  }
}
