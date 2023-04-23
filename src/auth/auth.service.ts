import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';
import { IReturnUser } from './types/auth-types';
import { JwtService } from '@nestjs/jwt';
import * as process from 'process';
import {
  ACCESS_TOKEN_EXPIRE_TIME,
  REFRESH_TOKEN_EXPIRE_TIME
} from './constants/auth-constants';
import { LoginUserDto } from './dto/login-user.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  async signup(dto: CreateUserDto) {
    const candidate = await this.prisma.user.findFirst({
      where: {
        email: dto.email
      }
    });
    if (candidate) {
      throw new ForbiddenException('user_already_exist');
    }

    const password = await bcrypt.hash(dto.password, 5);

    const user = await this.prisma.user.create({
      data: {
        ...dto,
        password
      },
      select: {
        id: true,
        email: true,
        username: true
      }
    });
    const userData = await this.generateUserDataWithTokens(user);

    return userData;
  }

  async signin(dto: LoginUserDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email
      }
    });

    if (!user) {
      throw new NotFoundException('user_not_found');
    }

    const pwMatches = await bcrypt.compare(dto.password, user.password);
    if (!pwMatches) {
      throw new NotFoundException('user_not_found');
    }

    const userPayload: IReturnUser = {
      id: user.id,
      email: user.email,
      username: user.username
    };

    const userData = await this.generateUserDataWithTokens(userPayload);

    return userData;
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Unauthorized');
    }
    try {
      const user = await this.jwtService.verify(refreshToken, {
        secret: process.env.REFRESH_SECRET
      });
      const tokenFromDb = await this.prisma.token.findFirst({
        where: {
          userId: user.id
        }
      });
      if (!user || !tokenFromDb) {
        throw new UnauthorizedException('Unauthorized');
      }

      const userData = await this.generateUserDataWithTokens({
        id: user.id,
        email: user.email,
        username: user.username
      });

      return userData;
    } catch (e) {
      console.log(e);
      throw new UnauthorizedException('Unauthorized');
    }
  }

  async logout(refreshToken: string) {
    try {
      await this.prisma.token.deleteMany({
        where: {
          token: refreshToken
        }
      });
      return { message: 'success' };
    } catch (e) {
      throw new UnauthorizedException('Unauthorized');
    }
  }

  private async updateRefreshToken(user: IReturnUser) {
    const refreshToken = this.jwtService.sign(user, {
      secret: process.env.REFRESH_SECRET,
      expiresIn: REFRESH_TOKEN_EXPIRE_TIME
    });

    const refreshTokenCandidate = await this.prisma.token.findFirst({
      where: {
        userId: user.id
      }
    });

    if (refreshTokenCandidate) {
      await this.prisma.token.update({
        where: {
          id: refreshTokenCandidate.id
        },
        data: {
          userId: user.id,
          token: refreshToken
        }
      });
    } else {
      await this.prisma.token.create({
        data: {
          userId: user.id,
          token: refreshToken
        }
      });
    }
    return refreshToken;
  }

  private async generateUserDataWithTokens(user: IReturnUser) {
    const accessToken = this.jwtService.sign(user, {
      secret: process.env.ACCESS_SECRET,
      expiresIn: ACCESS_TOKEN_EXPIRE_TIME
    });

    const refreshToken = await this.updateRefreshToken(user);

    return {
      accessToken,
      refreshToken,
      user
    };
  }
}