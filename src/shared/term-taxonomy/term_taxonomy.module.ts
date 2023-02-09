import { Module } from '@nestjs/common';

import { EntitiesModule } from 'src/entities/entities.module';
import { TermTaxonomyService } from './term_taxonomy.service';

@Module({
  imports: [EntitiesModule],
  controllers: [],
  providers: [TermTaxonomyService],
  exports: [TermTaxonomyService],
})
export class TermTaxonomyModule {}
