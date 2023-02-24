import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { EntitiesModule } from 'src/entities/entities.module';
@Module({
  imports: [EntitiesModule],
  controllers: [],
  providers: [CommonService],
  exports: [CommonService],
})
export class CommonModule {}
