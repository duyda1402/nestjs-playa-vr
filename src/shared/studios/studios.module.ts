import { Module } from '@nestjs/common';
import { StudiosViewController } from './studios.controller';
import { StudiosService } from './studios.service';
import { RepositoryModule } from 'src/repository/repository.module';

@Module({
  imports: [RepositoryModule],
  controllers: [StudiosViewController],
  providers: [StudiosService],
})
export class StudiosListViewModule {}
