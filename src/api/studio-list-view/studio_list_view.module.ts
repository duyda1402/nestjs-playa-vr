import { Module } from '@nestjs/common';
import { StudioListViewController } from './studio_list_view.controller';
import { TermModule } from 'src/shared/term/term.module';
import { TermTaxonomyModule } from 'src/shared/term-taxonomy/term_taxonomy.module';
import { StudioListViewService } from './studio_list_view.service';

@Module({
  imports: [TermModule, TermTaxonomyModule],
  controllers: [StudioListViewController],
  providers: [StudioListViewService],
})
export class StudiosListViewModule {}
