import { Module } from '@nestjs/common';
import { LoggingController } from './logging.controller';
import { LoggingService } from './logging.service';
import { EntitiesModule } from 'src/entities/entities.module';
import { UserModule } from '../user/user.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [EntitiesModule, CommonModule, UserModule],
  controllers: [LoggingController],
  providers: [LoggingService],
})
export class LoggingModule {}
