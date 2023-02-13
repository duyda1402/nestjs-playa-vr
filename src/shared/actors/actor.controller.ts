import { Controller, Get, Param, Query } from '@nestjs/common';
import { IFActorListView, IFStudioView, IFRsp, IFPage } from 'src/types';
import { ActorService } from './actor.service';

@Controller('')
export class ActorsViewController {
  constructor(private readonly actorService: ActorService) {}

  @Get('/actors')
  async getActors(@Query() query: any): Promise<IFRsp<IFPage<IFActorListView[]>>> {
    const page = Number(query['page-index']) || 1;
    const perPage = Number(query['page-size']) || 20;
    const order = query['order'] || '';
    const direction = query['direction'] || 'asc';
    const title = query['title'] || '';
    const result = await this.actorService.getActorList({
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

  @Get('/actor/:id')
  async getActorDetail(@Param('id') id: string): Promise<IFRsp<IFStudioView>> {
    const result = await this.actorService.getActorDetail(id);
    return { status: { code: 1, message: 'okey' }, data: result };
  }
}
