import { Controller, Get, Param, Query } from '@nestjs/common';
import { IFActorListView, IFRsp, IFPage } from 'src/types';
import { ActorService } from './actor.service';
import { IFActorView } from './../../types/data.type';
import {parseNumber} from "../../helper";

@Controller('')
export class ActorsViewController {
  constructor(private readonly actorService: ActorService) {}

  @Get('/actors')
  async getActors(@Query() query: any): Promise<IFRsp<IFPage<IFActorListView[]>>> {
    const page = parseNumber(query['page-index'], 1);
    const perPage = parseNumber(query['page-size'], 20);
    const order = query['order'] && ["title", "popularity"].indexOf(query['order']) !== -1 ? query['order'] : "title";
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
  async getActorDetail(@Param('id') id: string): Promise<IFRsp<IFActorView>> {
    const result = await this.actorService.getActorDetail(id);
    return { status: { code: 1, message: 'okey' }, data: result };
  }
}
