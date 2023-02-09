import { Module } from '@nestjs/common';
import { TermService } from './term.service';

import { EntitiesModule } from 'src/entities/entities.module';

@Module({
  imports: [EntitiesModule],
  controllers: [],
  providers: [TermService],
  exports: [TermService],
})
export class TermModule {}
