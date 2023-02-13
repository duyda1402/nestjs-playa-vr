import { Injectable } from '@nestjs/common';
import { DataNotFoundException } from 'src/exceptions/data.exception';
import { TermRepository } from 'src/repository';
import { IFActorListView, IFStudioView, IFPage } from 'src/types';
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
    const term = await this.termRepository.getTermBySlug(id, '');
    if (!term) throw new DataNotFoundException('Actor not found');
    return {
      id: term.slug,
      title: term.name,
      preview: 'https://static.wikia.nocookie.net/rezero/images/6/6f/Catboyqt.jpg',
      studios: [{ id: 'cat-pictures-fox', title: 'Cat Pictures Fox' }],
      properties: [
        { name: 'Birthdate', value: '16 Jan' },
        { name: 'Birthplace', value: 'Kararagi, Kingdom of Lugnica' },
      ],
      aliases: ['Felix Argyle', 'Blue Knight', 'Ferri-chan'],
      views: 500,
      banner: null,
    };
  }
}
