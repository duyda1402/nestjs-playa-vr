import { Controller, Get, Param, Query } from '@nestjs/common';
import { StudioListView, StudioView } from 'src/types/data.type';

import { Rsp } from 'src/types/response.type';
import { StudiosService } from './studios.service';

@Controller('')
export class StudiosViewController {
  constructor(private readonly studiosService: StudiosService) {}

  @Get('/studios')
  async getStudios(@Query() query: any): Promise<Rsp<StudioListView[]>> {
    const page = Number(query['page-index']) || 1;
    const perPage = Number(query['page-size']) || 20;
    const result = await this.studiosService.getStudioList({ page, perPage });
    return { status: { code: 1, message: 'okey' }, page, perPage, data: result };
  }
  @Get('/studio/:id')
  async getStudiDetail(@Param('id') id: string): Promise<Rsp<StudioView>> {
    const result = await this.studiosService.getStudioDetail(id);
    return { status: { code: 1, message: 'okey' }, data: result };
  }
}
