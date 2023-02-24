import { Module } from '@nestjs/common';
import { ActorsViewController } from './actor.controller';
import { ActorService } from './actor.service';
import { EntitiesModule } from 'src/entities/entities.module';
import { MyOpensearchModule } from '../open-search/opensearch.module';

@Module({
  imports: [EntitiesModule, MyOpensearchModule],
  controllers: [ActorsViewController],
  providers: [ActorService],
})
export class ActorsModule {}
