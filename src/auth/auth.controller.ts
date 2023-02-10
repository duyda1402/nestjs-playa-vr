import { Controller, Post, Body, UseGuards, Get, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Rsp } from 'src/types/response.type';
import { Token, UserProfile } from 'src/types/auth.type';
import { Request } from 'express';
import { JwtAuthGuard, RefreshAuthGuard } from './auth.guard';
import { UnauthorizedException } from 'src/exceptions/auth.exception';
import { UserService } from 'src/shared/user/user.service';

@Controller('')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly userService: UserService) {}

  @Post('/auth/sign-in-password')
  async signInPassword(@Body() loginDto: LoginDto): Promise<Rsp<Token>> {
    const result = await this.authService.login(loginDto);
    return result;
  }

  @Get('/auth/refresh')
  @UseGuards(RefreshAuthGuard)
  async refreshToken(@Req() req: Request): Promise<Rsp<Token>> {
    const user = req.user;
    const newAccessToken = await this.authService.refreshToken(user['sub']);
    return { status: { code: 1, message: 'ok' }, data: newAccessToken };
  }

  @Get('/auth/sign-out')
  @UseGuards(JwtAuthGuard)
  async logout(): Promise<Rsp<any>> {
    try {
      return { status: { code: 1, message: 'ok' } };
    } catch (error) {
      throw new UnauthorizedException();
    }
  }

  @Get('user/profile')
  @UseGuards(JwtAuthGuard)
  async getUserProfile(@Req() req: Request): Promise<Rsp<UserProfile>> {
    const user = req.user;
    const result = await this.userService.getUserProfile(user['sub']);
    return { status: { code: 1, message: 'ok' }, data: result };
  }
}
