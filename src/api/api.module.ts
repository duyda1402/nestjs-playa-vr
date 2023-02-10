import { Module } from '@nestjs/common';
import { StudiosListViewModule } from './studios/studios.module';

@Module({
  imports: [StudiosListViewModule],
  controllers: [],
  providers: [],
})
export class ApiModule {}
