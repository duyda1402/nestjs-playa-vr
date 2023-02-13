import { Module } from '@nestjs/common';
import { ActorsViewController } from './actor.controller';
import { ActorService } from './actor.service';
import { RepositoryModule } from 'src/repository/repository.module';

@Module({
  imports: [RepositoryModule],
  controllers: [ActorsViewController],
  providers: [ActorService],
})
export class ActorsModule {}
