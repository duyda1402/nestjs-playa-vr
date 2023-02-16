import { Module } from '@nestjs/common';
import { ActorsViewController } from './actor.controller';
import { ActorService } from './actor.service';
import { EntitiesModule } from 'src/entities/entities.module';

@Module({
  imports: [EntitiesModule],
  controllers: [ActorsViewController],
  providers: [ActorService],
})
export class ActorsModule {}
