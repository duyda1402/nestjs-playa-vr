import { Injectable } from '@nestjs/common';

import { IFConfig, IFRsp } from 'src/types/response.type';

@Injectable()
export class ConfigService {
  async getConfig(): Promise<IFRsp<IFConfig>> {
    // Kiểm tra thông tin version
    const config = {
      site_name: 'VR Cats',
      site_logo: 'https://placekitten.com/200/300',
      actors: true,
      categories: true,
      studios: true,
    };
    return { status: { code: 1, message: 'ok' }, data: config };
  }
}
