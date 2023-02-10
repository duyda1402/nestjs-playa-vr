import { Injectable } from '@nestjs/common';
import { TermTaxonomyService } from 'src/shared/term-taxonomy/term_taxonomy.service';
import { StudioListView } from 'src/types/data.type';

@Injectable()
export class StudioListViewService {
  constructor(private readonly termTaxonomyService: TermTaxonomyService) {}

  async getStudioList(input: { page?: number; perPage?: number; order?: any; where?: any }): Promise<StudioListView[]> {
    const order = { ...input.order } || { count: 'DESC' };
    const taxonomyStudios = await this.termTaxonomyService.getTermTaxonomyList({
      page: input.page,
      perPage: input.perPage,
      where: { taxonomy: 'studio', ...input.where },
      order: order,
    });
    // Lọc lấy dũ liệu
    const result = taxonomyStudios.map((item) => ({
      id: item.termId.slug,
      title: item.termId.name,
      preview: 'https://placekitten.com/200/300',
    }));
    return result;
  }
}
