import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Rsp } from 'src/types/response.type';
import { Token } from 'src/types/auth.type';

@Controller('/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/sign-in-password')
  async signInPassword(@Body() loginDto: LoginDto): Promise<Rsp<Token>> {
    const result = await this.authService.login(loginDto);
    return result;
  }

  @Post('/refresh')
  @UseGuards(AuthGuard('jwt'))
  async refreshToken(@Request() req: any): Promise<Rsp<Token>> {
    const token = await this.authService.refreshToken(req.headers.authorization.split(' ')[1]);
    return { status: { code: 1, message: 'ok' }, data: token };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('sign-out')
  async logout(): Promise<Rsp<any>> {
    // xử lý logout logic tại đây, ví dụ như xóa access token trong database.
    return { status: { code: 1, message: 'ok' } };
  }
}
