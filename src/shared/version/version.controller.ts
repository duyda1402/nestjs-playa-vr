import { Controller, Get } from '@nestjs/common';

import { IFSemVersion, IFRsp } from 'src/types';

import { VersionService } from './version.service';

@Controller('/version')
export class VersionController {
  constructor(private readonly versionService: VersionService) {}

  @Get('')
  async getVersion(): Promise<IFRsp<IFSemVersion>> {
    const result = await this.versionService.getVersion();
    return result;
  }
}
