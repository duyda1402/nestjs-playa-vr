import { Module } from '@nestjs/common';
import { LoggingController } from './logging.controller';
import { LoggingService } from './logging.service';
import { EntitiesModule } from 'src/entities/entities.module';
import {VideoModule} from "../videos/videos.module";
import {UserModule} from "../user/user.module";
import {JwtModule} from "@nestjs/jwt";
import {VideoService} from "../videos/videos.service";
import {MyOpensearchModule} from "../open-search/opensearch.module";
import {CommonModule} from "../common/common.module";
import {OpenSearchService} from "../open-search/opensearch.service";

@Module({
  imports: [EntitiesModule, MyOpensearchModule, CommonModule, VideoModule, UserModule, JwtModule.register({})],
  controllers: [LoggingController],
  providers: [LoggingService, OpenSearchService, VideoService],
})
export class LoggingModule {}
