import { Injectable } from '@nestjs/common';

import { IFSemVersion, IFRsp } from 'src/types/response.type';

@Injectable()
export class VersionService {
  async getVersion(): Promise<IFRsp<IFSemVersion>> {
    // Kiểm tra thông tin version
    const version = '2.0.0';
    return { status: { code: 1, message: 'ok' }, data: version };
  }
}
