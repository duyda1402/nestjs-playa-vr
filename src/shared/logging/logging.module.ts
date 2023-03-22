import { Module } from '@nestjs/common';
import { LoggingController } from './logging.controller';
import { LoggingService } from './logging.service';
import { EntitiesModule } from 'src/entities/entities.module';
import {VideoModule} from "../videos/videos.module";
import {UserModule} from "../user/user.module";
import {JwtModule} from "@nestjs/jwt";
import {VideoService} from "../videos/videos.service";

@Module({
  imports: [EntitiesModule, VideoModule, UserModule, JwtModule.register({})],
  controllers: [LoggingController],
  providers: [LoggingService, VideoService],
})
export class LoggingModule {}
