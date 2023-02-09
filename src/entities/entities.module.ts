import { Module } from '@nestjs/common';
import { UserEntity } from './user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserMetaEntity } from './user_meta.entity';
import { TermMetaEntity } from './term_meta.entity';
import { TermEntity } from './term.entity';
import { TermTexonomyEntity } from './term_texonomy.entity';
import { PostEntity } from './post.entity';
import { PostMetaEntity } from './post_meta.entity';
import { TermRelationShipsBasicEntity } from './term_relationships_basic.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      UserMetaEntity,
      PostEntity,
      PostMetaEntity,
      TermEntity,
      TermMetaEntity,
      TermTexonomyEntity,
      TermRelationShipsBasicEntity,
    ]),
  ],
  providers: [],
  controllers: [],
})
export class EntitiesModule {}
