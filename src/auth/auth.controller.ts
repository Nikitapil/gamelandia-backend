import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Response } from 'express';
import { COOKIE_EXPIRE_TIME } from './constants/auth-constants';
import { LoginUserDto } from './dto/login-user.dto';
import { Cookies } from '../decorators/Cookies.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
  async signup(
    @Body() dto: CreateUserDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const { user, refreshToken, accessToken } = await this.authService.signup(
      dto
    );

    res.cookie('refreshToken', refreshToken, {
      maxAge: COOKIE_EXPIRE_TIME,
      httpOnly: true
    });

    return { user, accessToken };
  }

  @Post('/signin')
  async signin(
    @Body() dto: LoginUserDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const { user, refreshToken, accessToken } = await this.authService.signin(
      dto
    );

    res.cookie('refreshToken', refreshToken, {
      maxAge: COOKIE_EXPIRE_TIME,
      httpOnly: true
    });

    return { user, accessToken };
  }

  @Get('/refresh')
  async refresh(
    @Cookies('refreshToken') token: string,
    @Res({ passthrough: true }) res: Response
  ) {
    const { user, refreshToken, accessToken } = await this.authService.refresh(
      token
    );

    res.cookie('refreshToken', refreshToken, {
      maxAge: COOKIE_EXPIRE_TIME,
      httpOnly: true
    });

    return { user, accessToken };
  }

  @Get('/logout')
  logout(
    @Cookies('refreshToken') token: string,
    @Res({ passthrough: true }) res: Response
  ) {
    res.clearCookie('refreshToken');
    return this.authService.logout(token);
  }
}
