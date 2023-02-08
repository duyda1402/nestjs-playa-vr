import { Injectable } from '@nestjs/common';

import { SemVersion, Rsp } from 'src/types/response.type';

@Injectable()
export class VersionService {
  async getVersion(): Promise<Rsp<SemVersion>> {
    // Kiểm tra thông tin version
    const version = '1.0.0';
    return { status: { code: 1, message: 'ok' }, data: version };
  }
}
