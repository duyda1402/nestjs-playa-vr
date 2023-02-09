import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { Rsp } from 'src/types/response.type';
import { UserProfile } from 'src/types/auth.type';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/profile')
  @UseGuards(AuthGuard('jwt'))
  async getUserProfile(@Req() req: Request): Promise<Rsp<UserProfile>> {
    const accessToken = req.headers.authorization.split(' ')[1];
    const result = await this.userService.getUserProfile(accessToken);
    return { status: { code: 1, message: 'ok' }, data: result };
  }
  // async findAll(): Promise<any> {
  //   const result = await this.userService.findAll();
  //   return { status: { code: 1, message: 'ok' }, data: result };
  // }
}
