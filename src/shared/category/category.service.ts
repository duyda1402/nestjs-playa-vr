import { Injectable } from '@nestjs/common';
import { TermRepository } from 'src/repository';
import { IFCategoryListView, IFPage } from 'src/types';

@Injectable()
export class CategoryService {
  constructor(private readonly termRepository: TermRepository) {}

  async getCategoryList(query: {
    page?: number;
    perPage?: number;
    order?: string;
    direction?: string;
    title?: string;
  }): Promise<IFPage<IFCategoryListView[]>> {
    const { itemTotal, data } = await this.termRepository.getTermsByLabel({ ...query, label: 'post_tag' });
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
}
