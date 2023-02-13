import { Module } from '@nestjs/common';
import { TermMetaRepository } from './term-meta.repository';
import { TaxonomyRepository } from './taxonomy.repository';
import { EntitiesModule } from 'src/entities/entities.module';
import { TermRepository } from './term.repository';
import { PostRepository } from './post.repository';

@Module({
  imports: [EntitiesModule],
  providers: [TermRepository, TermMetaRepository, TaxonomyRepository, PostRepository],
  exports: [TermRepository, TermMetaRepository, TaxonomyRepository, PostRepository],
})
export class RepositoryModule {}
