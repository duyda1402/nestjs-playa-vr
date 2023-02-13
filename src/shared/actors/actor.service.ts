import { Injectable } from '@nestjs/common';
import { DataNotFoundException } from 'src/exceptions/data.exception';
import { TermRepository } from 'src/repository';
import { IFActorListView, IFPage } from 'src/types';
import { IFActorView } from './../../types/data.type';

@Injectable()
export class ActorService {
  constructor(private readonly termRepository: TermRepository) {}

  async getActorList(query: {
    page?: number;
    perPage?: number;
    order?: string;
    direction?: string;
    title?: string;
  }): Promise<IFPage<IFActorListView[]>> {
    const { itemTotal, data } = await this.termRepository.getTermsByLabel({ ...query, label: 'porn_star_name' });
    const content = data.map((item) => ({
      id: item.slug,
      title: item.name,
      preview: 'https://placekitten.com/200/300',
    }));
    const result = {
      page_index: query.page,
      item_count: query.perPage,
      page_total: Math.ceil(itemTotal / query.perPage),
      item_total: itemTotal,
      content: content,
    };
    return result;
  }

  async getActorDetail(id: string): Promise<IFActorView | null> {
    const result = await this.termRepository.getActorBySlug(id);
    if (!result) throw new DataNotFoundException('Actor not found');
    return {
      id: result?.slug,
      title: result?.name,
      preview: 'https://static.wikia.nocookie.net/rezero/images/6/6f/Catboyqt.jpg',
      studios: result?.studios,
      properties: result?.properties,
      aliases: ['Felix Argyle', 'Blue Knight', 'Ferri-chan'],
      views: 500,
      banner: null,
    };
  }
}
