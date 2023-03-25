import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { ConfigModule } from './config/config.module';
import { VersionModule } from './version/version.module';
import { StudiosListViewModule } from './studios/studios.module';
import { ActorsModule } from './actors/actor.module';
import { CategoryModule } from './category/category.module';
import { VideoModule } from './videos/videos.module';
import { LoggingModule } from './logging/logging.module';
import { MyOpensearchModule } from './open-search/opensearch.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    ConfigModule,
    VersionModule,
    UserModule,
    StudiosListViewModule,
    ActorsModule,
    CategoryModule,
    VideoModule,
    LoggingModule,
    MyOpensearchModule,
    CommonModule,
  ],
  controllers: [],
  providers: [],
})
export class SharedModule {}
