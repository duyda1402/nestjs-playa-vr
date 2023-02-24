import { Module } from '@nestjs/common';
import { StudiosViewController } from './studios.controller';
import { StudiosService } from './studios.service';
import { EntitiesModule } from 'src/entities/entities.module';
import { MyOpensearchModule } from '../open-search/opensearch.module';

@Module({
  imports: [EntitiesModule, MyOpensearchModule],
  controllers: [StudiosViewController],
  providers: [StudiosService],
})
export class StudiosListViewModule {}
