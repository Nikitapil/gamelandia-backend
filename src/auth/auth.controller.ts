import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Res
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Response } from 'express';
import { COOKIE_EXPIRE_TIME } from './constants/auth-constants';
import { LoginUserDto } from './dto/login-user.dto';
import { Cookies } from '../decorators/Cookies.decorator';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthResponseDto } from './dto/auth-response.dto';
import { GetRestoreKeyDto } from './dto/get-restore-key.dto';
import { RestorePasswordDto } from './dto/restore-password.dto';
import { SuccessMessageDto } from '../dto/success-message.dto';

@ApiTags('Authorization')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: 'Sign up' })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  @Post('/signup')
  async signup(
    @Body() dto: CreateUserDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<AuthResponseDto> {
    const { user, refreshToken, accessToken } = await this.authService.signup(
      dto
    );

    res.cookie('refreshToken', refreshToken, {
      maxAge: COOKIE_EXPIRE_TIME,
      httpOnly: true,
      sameSite: 'none',
      secure: true
    });

    return { user, accessToken };
  }

  @ApiOperation({ summary: 'Sign in' })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  @HttpCode(HttpStatus.OK)
  @Post('/signin')
  async signin(
    @Body() dto: LoginUserDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<AuthResponseDto> {
    const { user, refreshToken, accessToken } = await this.authService.signin(
      dto
    );

    res.cookie('refreshToken', refreshToken, {
      maxAge: COOKIE_EXPIRE_TIME,
      httpOnly: true,
      sameSite: 'none',
      secure: true
    });

    return { user, accessToken };
  }

  @ApiOperation({ summary: 'Refresh tokens' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @Get('/refresh')
  async refresh(
    @Cookies('refreshToken') token: string,
    @Res({ passthrough: true }) res: Response
  ): Promise<AuthResponseDto> {
    const { user, refreshToken, accessToken } = await this.authService.refresh(
      token
    );

    res.cookie('refreshToken', refreshToken, {
      maxAge: COOKIE_EXPIRE_TIME,
      httpOnly: true,
      sameSite: 'none',
      secure: true
    });

    return { user, accessToken };
  }

  @ApiOperation({ summary: 'Logout' })
  @ApiResponse({ status: 200, type: SuccessMessageDto })
  @Get('/logout')
  logout(
    @Cookies('refreshToken') token: string,
    @Res({ passthrough: true }) res: Response
  ): Promise<SuccessMessageDto> {
    res.clearCookie('refreshToken', { sameSite: 'none', secure: true });
    return this.authService.logout(token);
  }

  @ApiOperation({ summary: 'Get restore password key to email' })
  @ApiResponse({ status: 201, type: SuccessMessageDto })
  @Post('/get_restore_password_key')
  getRestorePasswordKey(
    @Body() dto: GetRestoreKeyDto
  ): Promise<SuccessMessageDto> {
    return this.authService.getRestorePasswordKey(dto.email);
  }

  @ApiOperation({ summary: 'Restore password' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @Put('/restore_password')
  async restorePassword(
    @Body() dto: RestorePasswordDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<AuthResponseDto> {
    const { user, refreshToken, accessToken } =
      await this.authService.restorePassword(dto);

    res.cookie('refreshToken', refreshToken, {
      maxAge: COOKIE_EXPIRE_TIME,
      httpOnly: true,
      sameSite: 'none',
      secure: true
    });

    return { user, accessToken };
  }
}
