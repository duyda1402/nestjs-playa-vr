import { Module } from '@nestjs/common';
import { UserEntity } from './user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserMetaEntity } from './user_meta.entity';
import { TermMetaEntity } from './term_meta.entity';
import { TermEntity } from './term.entity';
import { TermTaxonomyEntity } from './term_taxonomy.entity';
import { PostEntity } from './post.entity';
import { PostMetaEntity } from './post_meta.entity';
import { TermRelationShipsBasicEntity } from './term_relationships_basic.entity';
import { TopPornstarsEntity } from './top_pornstar.entity';
import { As3cfItemsEntity } from './as3cf_items.entity';
import { SubscriptionEntity } from './subscriptions.entity';
import { PopularScoresEntity } from './popular_scores.entity';
import { OptionsEntity } from './options.entity';
import { VideoTrackingEntity } from './video_tracking.entity';
import { AvgStreamTimesEntity } from './avg_stream_times.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      UserMetaEntity,
      PostEntity,
      PostMetaEntity,
      TermEntity,
      TermMetaEntity,
      TermTaxonomyEntity,
      TermRelationShipsBasicEntity,
      TopPornstarsEntity,
      As3cfItemsEntity,
      SubscriptionEntity,
      PopularScoresEntity,
      OptionsEntity,
      VideoTrackingEntity,
      AvgStreamTimesEntity,
    ]),
  ],
  exports: [
    TypeOrmModule.forFeature([
      UserEntity,
      UserMetaEntity,
      PostEntity,
      PostMetaEntity,
      TermEntity,
      TermMetaEntity,
      TermTaxonomyEntity,
      TermRelationShipsBasicEntity,
      TopPornstarsEntity,
      As3cfItemsEntity,
      SubscriptionEntity,
      PopularScoresEntity,
      OptionsEntity,
      VideoTrackingEntity,
      AvgStreamTimesEntity,
    ]),
  ],
})
export class EntitiesModule {}
