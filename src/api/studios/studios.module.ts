import { Module } from '@nestjs/common';
import { StudiosViewController } from './studios.controller';
import { TermModule } from 'src/shared/term/term.module';
import { TermTaxonomyModule } from 'src/shared/term-taxonomy/term_taxonomy.module';
import { StudiosService } from './studios.service';
import { TermMetaModule } from 'src/shared/term-meta/term-meta.module';

@Module({
  imports: [TermModule, TermTaxonomyModule, TermMetaModule],
  controllers: [StudiosViewController],
  providers: [StudiosService],
})
export class StudiosListViewModule {}
