import { Controller, Get } from '@nestjs/common';

import { Configuration, Rsp } from 'src/types/response.type';

import { ConfigService } from './config.service';

@Controller('/config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get('')
  async getConfig(): Promise<Rsp<Configuration>> {
    const result = await this.configService.getConfig();
    return result;
  }
}
