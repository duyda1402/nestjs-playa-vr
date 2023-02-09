import { Module } from '@nestjs/common';
import { UserEntity } from './user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserMetaEntity } from './user_meta.entity';
import { TermMetaEntity } from './term_meta.entity';
import { TermEntity } from './term.entity';
import { TermTexonomyEntity } from './term_texonomy.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, UserMetaEntity, TermEntity, TermMetaEntity, TermTexonomyEntity])],
  providers: [],
  controllers: [],
})
export class EntitiesModule {}
