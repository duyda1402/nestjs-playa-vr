import { Injectable, Query } from '@nestjs/common';
import { TaxonomyRepository, TermRepository } from 'src/repository';
import { IFStudioListView, IFStudioView, IFPage } from 'src/types';

@Injectable()
export class StudiosService {
  constructor(
    private readonly termRepository: TermRepository,
    private readonly taxonomyRepository: TaxonomyRepository
  ) {}

  async getStudioList(query: {
    page?: number;
    perPage?: number;
    order?: string;
    direction?: string;
    title?: string;
  }): Promise<IFPage<IFStudioListView[]>> {
    const { itemTotal, data } = await this.termRepository.getTermsStudio({
      page: query.page,
      perPage: query.perPage,
      title: query.title,
      order: query.order,
      direction: query.direction,
    });
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
    const term = await this.termRepository.getTermBySlug(id);
    const taxonomy = await this.taxonomyRepository.getgetTaxonomyByTermAndLabel(term.id, 'studio');
    if (!taxonomy) null;

    return {
      id: term.slug,
      title: term.name,
      preview: 'https://placekitten.com/200/300',
      description: taxonomy.description,
    };
  }
}
