import { Controller, Post, Body, UseGuards, Get, Req } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { IFRsp, IFToken, IFUserProfile } from 'src/types';
import { JwtAuthGuard } from './auth.guard';
import { UnauthorizedException } from 'src/exceptions/auth.exception';
import { UserService } from 'src/shared/user/user.service';

@Controller('')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly userService: UserService) {}

  @Post('/auth/sign-in-password')
  async signInPassword(@Body() loginDto: LoginDto): Promise<IFRsp<IFToken>> {
    const result = await this.authService.login(loginDto);
    return result;
  }

  @Post('/auth/refresh')
  // @UseGuards(RefreshAuthGuard)
  async refreshToken(@Body('refresh_token') token: string): Promise<IFRsp<IFToken>> {
    const newAccessToken = await this.authService.refreshToken(token);
    return { status: { code: 1, message: 'ok' }, data: newAccessToken };
  }

  @Post('/auth/sign-out')
  // @UseGuards(JwtAuthGuard)
  async logout(@Body('refresh_token') token: string): Promise<IFRsp<any>> {
    try {
      await this.authService.refreshToken(token);
      return { status: { code: 1, message: 'ok' } };
    } catch (error) {
      throw new UnauthorizedException();
    }
  }

  @Get('user/profile')
  @UseGuards(JwtAuthGuard)
  async getUserProfile(@Req() req: Request): Promise<IFRsp<IFUserProfile>> {
    const user = req.user;
    const result = await this.userService.getUserProfile(user['sub']);
    return { status: { code: 1, message: 'ok' }, data: result };
  }
}
