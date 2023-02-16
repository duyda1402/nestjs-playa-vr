import { Module } from '@nestjs/common';
import { StudiosViewController } from './studios.controller';
import { StudiosService } from './studios.service';
import { EntitiesModule } from 'src/entities/entities.module';

@Module({
  imports: [EntitiesModule],
  controllers: [StudiosViewController],
  providers: [StudiosService],
})
export class StudiosListViewModule {}
