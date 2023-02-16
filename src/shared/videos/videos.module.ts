import { Module } from '@nestjs/common';
import { VideoController } from './videos.controller';
import { VideoService } from './videos.service';
import { EntitiesModule } from 'src/entities/entities.module';

@Module({
  imports: [EntitiesModule],
  controllers: [VideoController],
  providers: [VideoService],
})
export class VideoModule {}
