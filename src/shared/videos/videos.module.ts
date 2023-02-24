import { Module } from '@nestjs/common';
import { VideoController } from './videos.controller';
import { VideoService } from './videos.service';
import { EntitiesModule } from 'src/entities/entities.module';
import { MyOpensearchModule } from './../open-search/opensearch.module';
import { CommonModule } from './../common/common.module';
import { UserModule } from 'src/shared/user/user.module';

@Module({
  imports: [EntitiesModule, MyOpensearchModule, CommonModule, UserModule],
  controllers: [VideoController],
  providers: [VideoService],
})
export class VideoModule {}
