import { Controller, Get, Param, Query } from '@nestjs/common';
import { IFRsp, IFPage, IFVideoListView } from 'src/types';
import { VideoService } from './videos.service';
import { IFVideoView } from 'src/types/index';
import { OpenSearchService } from '../open-search/opensearch.service';
import { CommonService } from '../common/common.service';

@Controller('')
export class VideoController {
  constructor(
    private readonly videoService: VideoService,
    private readonly opensearchService: OpenSearchService,
    private readonly commonService: CommonService
  ) {}

  @Get('/test')
  async getView() {
    const view = await this.opensearchService.getTermViews(632);
    return view;
  }
  @Get('/test2')
  async getView2() {
    const view = await this.commonService.convert2CdnUrl([1503396, 1503395, 1503394, 679289]);
    return view;
  }

  @Get('/videos')
  async getActors(@Query() query: any): Promise<IFRsp<IFPage<IFVideoListView[]>>> {
    const page = Number(query['page-index']) || 1;
    const perPage = Number(query['page-size']) || 20;
    const order = query['order'] || '';
    const direction = query['direction'] || 'asc';
    const title = query['title'] || '';
    const studio = query['studio'] || null;
    const actor = query['actor'] || null;
    const includedCategories = query['included-categories'] ? query['included-categories'].split(',') : [];
    const excludedCategories = query['excluded-categories'] ? query['excluded-categories'].split(',') : [];

    const result = await this.videoService.getVideoList({
      page,
      perPage,
      direction,
      title,
      order,
      studio,
      actor,
      includedCategories,
      excludedCategories,
    });
    return {
      status: { code: 1, message: 'okey' },
      data: result,
    };
  }
  @Get('/video/:id')
  async getStudiDetail(@Param('id') id: string): Promise<IFRsp<IFVideoView>> {
    const result = await this.videoService.getVideoDetail(id);
    return { status: { code: 1, message: 'okey' }, data: result };
  }
}
