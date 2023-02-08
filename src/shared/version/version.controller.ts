import { Controller, Get } from '@nestjs/common';

import { SemVersion, Rsp } from 'src/types/response.type';

import { VersionService } from './version.service';

@Controller('/version')
export class VersionController {
  constructor(private readonly versionService: VersionService) {}

  @Get('')
  async getVersion(): Promise<Rsp<SemVersion>> {
    const result = await this.versionService.getVersion();
    return result;
  }
}
