import { Module } from '@nestjs/common';
import { ActorsViewController } from './actor.controller';
import { ActorService } from './actor.service';
import { RepositoryModule } from 'src/repository/repository.module';
import { EntitiesModule } from 'src/entities/entities.module';

@Module({
  imports: [RepositoryModule, EntitiesModule],
  controllers: [ActorsViewController],
  providers: [ActorService],
})
export class ActorsModule {}
