import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OptionsEntity } from 'src/entities/options.entity';

import { IFConfig, IFRsp } from 'src/types/response.type';
import { Repository } from 'typeorm';

@Injectable()
export class ConfigService {
  constructor(
    @InjectRepository(OptionsEntity)
    private readonly optionsRepository: Repository<OptionsEntity>
  ) {}
  async getConfig(): Promise<IFRsp<IFConfig>> {
    const siteName = await this.optionsRepository.findOne({ where: { name: 'blogname' } });
    // Kiểm tra thông tin version
    const config = {
      site_name: siteName.value,
      site_logo: 'https://mcdn.vrporn.com/files/20230202082613/logo-removebg.png',
      actors: true,
      categories: true,
      studios: true,
    };
    return { status: { code: 1, message: 'ok' }, data: config };
  }
}
