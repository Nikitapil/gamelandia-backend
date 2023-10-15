import {
  BadRequestException,
  Injectable,
  NotAcceptableException,
  NotFoundException
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EditUserDto } from './dto/edit-user.dto';
import * as bcrypt from 'bcryptjs';
import { UserReturnDto } from '../auth/dto/user-return.dto';
import { ReturnUserDto } from './dto/return-user.dto';
import { SuccessMessageDto } from '../dto/success-message.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async editUser(dto: EditUserDto, userId: number): Promise<UserReturnDto> {
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
      email: updatedUser.email,
      role: updatedUser.role
    };
  }

  async deleteUser(
    userId: number,
    currentUser: ReturnUserDto
  ): Promise<SuccessMessageDto> {
    if (userId !== currentUser.id && currentUser.role !== 'Admin') {
      throw new NotAcceptableException('Not allowed to delete an account');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('user not found');
    }

    await this.prisma.user.delete({ where: { id: userId } });
    await this.prisma.token.deleteMany({ where: { userId } });

    return { message: 'success' };
  }
}
