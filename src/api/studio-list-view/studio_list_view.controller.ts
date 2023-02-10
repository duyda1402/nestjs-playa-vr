import { Controller, Get, Query } from '@nestjs/common';
import { StudioListView } from 'src/types/data.type';

import { Rsp } from 'src/types/response.type';
import { StudioListViewService } from './studio_list_view.service';

@Controller('/studios')
export class StudioListViewController {
  constructor(private readonly studioListViewService: StudioListViewService) {}
  @Get('')
  async getStudiosView(@Query() query: any): Promise<Rsp<StudioListView[]>> {
    const page = Number(query['page-index']) || 1;
    const perPage = Number(query['page-size']) || 20;
    const result = await this.studioListViewService.getStudioList({ page, perPage });
    return { status: { code: 1, message: 'okey' }, page, perPage, data: result };
  }
}
