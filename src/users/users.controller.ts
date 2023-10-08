import {
  Body,
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Put,
  UseGuards
} from '@nestjs/common';
import { JwtGuard } from '../guards/auth/jwt.guard';
import { UsersService } from './users.service';
import { EditUserDto } from './dto/edit-user.dto';
import { User } from '../decorators/User.decorator';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReturnUserDto } from './dto/return-user.dto';
import { SuccessMessageDto } from '../dto/success-message.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @ApiOperation({ summary: 'Edit user' })
  @ApiResponse({ status: 200, type: ReturnUserDto })
  @UseGuards(JwtGuard)
  @Put('/edit')
  editUser(@Body() dto: EditUserDto, @User('id') userId: number) {
    return this.usersService.editUser(dto, userId);
  }

  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 200, type: SuccessMessageDto })
  @UseGuards(JwtGuard)
  @Delete('/delete/:id')
  deleteUser(
    @Param('id', ParseIntPipe) userId: number,
    @User() currentUser: ReturnUserDto
  ) {
    return this.usersService.deleteUser(userId, currentUser);
  }
}
