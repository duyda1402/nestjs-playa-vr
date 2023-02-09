import { Controller, Get } from '@nestjs/common';
import { StudioListView } from 'src/types/data.type';

import { Rsp } from 'src/types/response.type';
import { StudioListViewService } from './studio_list_view.service';

@Controller('/studios')
export class StudioListViewController {
  constructor(private readonly studioListViewService: StudioListViewService) {}
  @Get('')
  async getStudiosView(): Promise<Rsp<StudioListView[]>> {
    const result = await this.studioListViewService.getStudioList();
    return { status: { code: 1, message: 'okey' }, data: result };
  }
}
