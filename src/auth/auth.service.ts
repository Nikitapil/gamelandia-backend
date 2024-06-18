import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import {
  ACCESS_TOKEN_EXPIRE_TIME,
  REFRESH_TOKEN_EXPIRE_TIME
} from './constants/auth-constants';
import { LoginUserDto } from './dto/login-user.dto';
import { MailingService } from '../mailing/mailing.service';
import { v4 } from 'uuid';
import { getRestorePasswordTemplate } from './helpers/mail-templates';
import { RestorePasswordDto } from './dto/restore-password.dto';
import { UserReturnDto } from './dto/user-return.dto';
import { SuccessMessageDto } from '../dto/success-message.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailingService: MailingService
  ) {}

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
        username: true,
        role: true
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

    const userPayload: UserReturnDto = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role
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

      const userFromDb = await this.prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          username: true,
          role: true
        }
      });

      if (!userFromDb) {
        throw new UnauthorizedException('Unauthorized');
      }

      const userData = await this.generateUserDataWithTokens({
        id: userFromDb.id,
        email: userFromDb.email,
        username: userFromDb.username,
        role: userFromDb.role
      });

      return userData;
    } catch (e) {
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
      return new SuccessMessageDto();
    } catch (e) {
      throw new UnauthorizedException('Unauthorized');
    }
  }

  private async updateRefreshToken(user: UserReturnDto) {
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

  private async generateUserDataWithTokens(user: UserReturnDto) {
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

  async getRestorePasswordKey(email: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        email
      }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const restoreKey = v4();
    const clientUrl = process.env.CLIENT_URL;

    await this.prisma.user.update({
      where: {
        email
      },
      data: {
        restoreKey
      }
    });

    await this.mailingService.sendMail({
      to: email,
      subject: 'Restore password',
      html: getRestorePasswordTemplate(restoreKey, clientUrl)
    });

    return new SuccessMessageDto();
  }

  async restorePassword(dto: RestorePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        restoreKey: dto.key
      }
    });

    if (!user) {
      throw new BadRequestException('Invalid secret key');
    }

    const password = await bcrypt.hash(dto.password, 5);

    const updatedUser = await this.prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        password,
        restoreKey: null
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true
      }
    });

    const userData = await this.generateUserDataWithTokens(updatedUser);

    return userData;
  }
}
