import { Controller, Post, Body, UseGuards, Get, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Rsp } from 'src/types/response.type';
import { Token } from 'src/types/auth.type';
import { Request } from 'express';
import { JwtAuthGuard, RefreshAuthGuard } from './auth.guard';
import { UnauthorizedException } from 'src/exceptions/auth.exception';

@Controller('/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/sign-in-password')
  async signInPassword(@Body() loginDto: LoginDto): Promise<Rsp<Token>> {
    const result = await this.authService.login(loginDto);
    return result;
  }

  @Get('/refresh')
  @UseGuards(RefreshAuthGuard)
  async refreshToken(@Req() req: Request): Promise<Rsp<Token>> {
    const user = req.user;
    console.log(user);
    const newAccessToken = await this.authService.refreshToken(user['sub']);
    return { status: { code: 1, message: 'ok' }, data: newAccessToken };
  }

  @Get('sign-out')
  @UseGuards(JwtAuthGuard)
  async logout(): Promise<Rsp<any>> {
    try {
      // const newAccessToken = await this.authService.refreshToken(req.headers.authorization.split(' ')[1]);
      return { status: { code: 1, message: 'ok' } };
    } catch (error) {
      throw new UnauthorizedException();
    }
  }
}
