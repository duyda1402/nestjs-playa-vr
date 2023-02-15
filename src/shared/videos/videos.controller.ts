import { Controller, Get, Param, Query } from '@nestjs/common';
import { IFRsp, IFPage, IFVideoListView } from 'src/types';
import { VideoService } from './videos.service';
import { IFVideoView } from 'src/types/index';

@Controller('')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Get('/videos')
  async getActors(@Query() query: any): Promise<IFRsp<IFPage<IFVideoListView[]>>> {
    const page = Number(query['page-index']) || 1;
    const perPage = Number(query['page-size']) || 20;
    const order = query['order'] || '';
    const direction = query['direction'] || 'asc';
    const title = query['title'] || '';
    const result = await this.videoService.getVideoList({
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
  @Get('/video/:id')
  async getStudiDetail(@Param('id') id: string): Promise<IFRsp<IFVideoView>> {
    const result = await this.videoService.getVideoDetail(id);
    return { status: { code: 1, message: 'okey' }, data: result };
  }
}