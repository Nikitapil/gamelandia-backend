import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as process from 'process';
import { IReturnUser } from '../types/auth-types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.ACCESS_SECRET
    });
  }

  async validate(payload: IReturnUser) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.id
      }
    });
    if (user) {
      return payload;
    }
    return user;
  }
}
