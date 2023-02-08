import { Controller, Get } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async findAll(): Promise<any> {
    const result = await this.userService.findAll();
    return { status: { code: 1, message: 'ok' }, data: result };
  }
}
