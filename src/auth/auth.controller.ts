import { Controller, Post, Body } from '@nestjs/common';
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
}
