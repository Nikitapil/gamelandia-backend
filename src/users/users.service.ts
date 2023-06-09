import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EditUserDto } from './dto/edit-user.dto';
import * as bcrypt from 'bcryptjs';
import { IReturnUser } from '../auth/types/auth-types';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async editUser(dto: EditUserDto, userId: number): Promise<IReturnUser> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId
      }
    });

    if (dto.email) {
      const userByEmail = await this.prisma.user.findUnique({
        where: {
          email: dto.email
        }
      });
      if (userByEmail && userByEmail.id !== user.id) {
        throw new BadRequestException('This email already exist');
      }
    }

    if (!user) {
      throw new NotFoundException('user not found');
    }

    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 5);
    }

    const updatedUser = await this.prisma.user.update({
      where: {
        id: userId
      },
      data: dto
    });

    return {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email
    };
  }
}
