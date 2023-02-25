import { Controller, Get, Param, Query } from '@nestjs/common';
import { IFStudioListView, IFStudioView, IFRsp, IFPage } from 'src/types';
import { StudiosService } from './studios.service';
import {parseNumber} from "../../helper";

@Controller('')
export class StudiosViewController {
  constructor(private readonly studiosService: StudiosService) {}

  @Get('/studios')
  async getStudios(@Query() query: any): Promise<IFRsp<IFPage<IFStudioListView[]>>> {
    const page = parseNumber(query['page-index'], 1);
    const perPage = parseNumber(query['page-size'], 20);
    const order = query['order'] && ["title", "popularity"].indexOf(query['order']) !== -1 ? query['order'] : "title";
    const direction = query['direction'] || 'asc';
    const title = query['title'] || '';

    //validate
    if(perPage > 1000) {
      return {status: {code: 0, message: 'Page size is too large'}};
    }

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
