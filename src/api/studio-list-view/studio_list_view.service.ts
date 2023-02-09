import { Injectable } from '@nestjs/common';
import { TermTaxonomyService } from 'src/shared/term-taxonomy/term_taxonomy.service';
import { TermService } from 'src/shared/term/term.service';
import { StudioListView } from 'src/types/data.type';

@Injectable()
export class StudioListViewService {
  constructor(private readonly termService: TermService, private readonly termTaxonomyService: TermTaxonomyService) {}

  async getStudioList(): Promise<StudioListView[]> {
    const result = [];
    const studiosTaxonomy = await this.termTaxonomyService.getTermTaxonomyList({ where: { taxonomy: 'studio' } });
    for (const item of studiosTaxonomy) {
      const term = await this.termService.getTermById(item.termId);
      console.log(term, item.termId);
      result.push({
        id: term.slug,
        title: term.name,
        preview: 'https://placekitten.com/200/300',
      });
    }
    return result;
  }
}
