import { Injectable } from '@nestjs/common';
import { DataNotFoundException } from 'src/exceptions/data.exception';
import { TermRepository } from 'src/repository';
import { IFStudioListView, IFStudioView, IFPage } from 'src/types';

@Injectable()
export class StudiosService {
  constructor(private readonly termRepository: TermRepository) {}

  async getStudioList(query: {
    page?: number;
    perPage?: number;
    order?: string;
    direction?: string;
    title?: string;
  }): Promise<IFPage<IFStudioListView[]>> {
    const { itemTotal, data } = await this.termRepository.getStudioList({ ...query });
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

  async getStudioDetail(id: string): Promise<IFStudioView | null> {
    const result = await this.termRepository.getStudioBySlug(id);
    if (!result) throw new DataNotFoundException('Studio not found');
    return {
      id: result?.slug,
      title: result?.name,
      preview: result?.preview ? `https://placekitten.com/${result?.preview}` : 'https://placekitten.com/200/300',
      description: result?.description,
      views: 100,
    };
  }
}
