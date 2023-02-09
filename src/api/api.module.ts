import { Module } from '@nestjs/common';
import { StudiosListViewModule } from './studio-list-view/studio_list_view.module';

@Module({
  imports: [StudiosListViewModule],
  controllers: [],
  providers: [],
})
export class ApiModule {}
