import { Injectable } from '@nestjs/common';
import { TermTaxonomyService } from 'src/shared/term-taxonomy/term_taxonomy.service';
import { TermService } from 'src/shared/term/term.service';
import { StudioListView, StudioView } from 'src/types/data.type';

@Injectable()
export class StudiosService {
  constructor(
    private readonly termService: TermService,

    private readonly termTaxonomyService: TermTaxonomyService
  ) {}

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

  async getStudioDetail(id: string): Promise<StudioView | null> {
    const term = await this.termService.getTermBySlug(id);
    const taxonomy = await this.termTaxonomyService.getgetTaxonomyByTermAndLabel(term.id, 'studio');
    if (!taxonomy) null;

    return {
      id: term.slug,
      title: term.name,
      preview: 'https://placekitten.com/200/300',
      description: taxonomy.description,
    };
  }
}
