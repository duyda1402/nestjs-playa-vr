import { Controller, Get } from '@nestjs/common';

import { IFConfig, IFRsp } from 'src/types/response.type';

import { ConfigService } from './config.service';

@Controller('/config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  async getConfig(): Promise<IFRsp<IFConfig>> {
    const result = await this.configService.getConfig();
    return result;
  }
}
