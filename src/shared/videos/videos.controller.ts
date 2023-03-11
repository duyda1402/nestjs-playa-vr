import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { IFRsp, IFPage, IFVideoListView } from 'src/types';
import { VideoService } from './videos.service';
import { IFVideoView } from 'src/types/index';
import { parseNumber } from '../../helper';
import { Request } from 'express';
import { JwtUserGuard } from './../../auth/auth.guard';

@Controller('')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Get('/videos')
  async getActors(@Query() query: any): Promise<IFRsp<IFPage<IFVideoListView[]>>> {
    const page = parseNumber(query['page-index'], 0);
    const perPage = parseNumber(query['page-size'], 20);
    const order =
      query['order'] && ['title', 'release_date', 'popularity'].indexOf(query['order']) !== -1
        ? query['order']
        : 'title';
    const direction = query['direction'] || 'asc';
    const title = query['title'] || null;
    const studio = query['studio'] || null;
    const actor = query['actor'] || null;
    const includedCategories = query['included-categories'] ? query['included-categories'].split(',') : [];
    const excludedCategories = query['excluded-categories'] ? query['excluded-categories'].split(',') : [];

    //validate
    if (perPage > 1000) {
      return { status: { code: 0, message: 'Page size is too large' } };
    }

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
  @UseGuards(JwtUserGuard)
  async getStudiDetail(@Param('id') postId: string, @Req() request: Request): Promise<IFRsp<IFVideoView>> {
    let result = null;
    if (request.user) {
      result = await this.videoService.getVideoDetail(postId, request.user['sub']);
    } else {
      result = await this.videoService.getVideoDetail(postId);
    }

    return { status: { code: 1, message: 'okey' }, data: result };
  }
}
