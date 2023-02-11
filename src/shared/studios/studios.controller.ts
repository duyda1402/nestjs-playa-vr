import { Controller, Get, Param, Query } from '@nestjs/common';
import { IFStudioListView, IFStudioView, IFRsp, IFPage } from 'src/types';
import { StudiosService } from './studios.service';

@Controller('')
export class StudiosViewController {
  constructor(private readonly studiosService: StudiosService) {}

  @Get('/studios')
  async getStudios(@Query() query: any): Promise<IFRsp<IFPage<IFStudioListView[]>>> {
    const page = Number(query['page-index']) || 1;
    const perPage = Number(query['page-size']) || 20;
    const order = query['order'] || 'taxonomy';
    const direction = query['direction'] || 'asc';
    const title = query['title'] || '';
    const result = await this.studiosService.getStudioList({
      page,
      perPage,
      direction,
      title,
      order,
    });
    return {
      status: { code: 1, message: 'okey' },
      data: result,
    };
  }

  @Get('/studio/:id')
  async getStudiDetail(@Param('id') id: string): Promise<IFRsp<IFStudioView>> {
    const result = await this.studiosService.getStudioDetail(id);
    return { status: { code: 1, message: 'okey' }, data: result };
  }
}
