import { Module } from '@nestjs/common';
import { LoggingController } from './logging.controller';
import { LoggingService } from './logging.service';
import { EntitiesModule } from 'src/entities/entities.module';
import {VideoModule} from "../videos/videos.module";
import {UserModule} from "../user/user.module";

@Module({
  imports: [EntitiesModule, VideoModule, UserModule],
  controllers: [LoggingController],
  providers: [LoggingService],
})
export class LoggingModule {}
