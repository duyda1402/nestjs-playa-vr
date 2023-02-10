import { Module } from '@nestjs/common';
import { TermMetaService } from './term-meta.service';
import { EntitiesModule } from 'src/entities/entities.module';

@Module({
  imports: [EntitiesModule],
  controllers: [],
  providers: [TermMetaService],
  exports: [TermMetaService],
})
export class TermMetaModule {}
