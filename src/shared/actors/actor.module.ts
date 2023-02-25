import { Module } from '@nestjs/common';
import { ActorsViewController } from './actor.controller';
import { ActorService } from './actor.service';
import { EntitiesModule } from 'src/entities/entities.module';
import { MyOpensearchModule } from '../open-search/opensearch.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [EntitiesModule, MyOpensearchModule, CommonModule],
  controllers: [ActorsViewController],
  providers: [ActorService],
})
export class ActorsModule {}
