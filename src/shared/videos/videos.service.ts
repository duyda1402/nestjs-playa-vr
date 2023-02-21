import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostEntity } from 'src/entities/post.entity';
import { PostMetaEntity } from 'src/entities/post_meta.entity';
import { TermRelationShipsBasicEntity } from 'src/entities/term_relationships_basic.entity';
import { DataNotFoundException } from 'src/exceptions/data.exception';

import { IFPage, IFVideoListView } from 'src/types';
import { IFVideoView } from 'src/types/index';
import { Repository } from 'typeorm';
import { As3cfItemsEntity } from 'src/entities/as3cf_items.entity';
import { TermEntity } from 'src/entities/term.entity';
import { TermTaxonomyEntity } from 'src/entities/term_taxonomy.entity';

@Injectable()
export class VideoService {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
    @InjectRepository(TermEntity)
    private readonly termRepository: Repository<TermEntity>
  ) {}

  async getVideoList(query: {
    page?: number;
    perPage?: number;
    order?: string;
    direction?: string;
    title?: string;
    studio?: string;
    actor?: string;
    includedCategories?: string[];
    excludedCategories?: string[];
  }): Promise<IFPage<IFVideoListView[] | any>> {
    const direction = query.direction === 'desc' ? 'DESC' : 'ASC';
    const order =
      query.order === 'popularity'
        ? 'post.postTitle'
        : query.order === 'release_date'
        ? 'post.postDate'
        : 'post.postTitle';
    const queryVideo = this.postRepository
      .createQueryBuilder('post')
      .innerJoin(TermRelationShipsBasicEntity, 'tr', 'post.id = tr.objectId')
      .leftJoinAndSelect(PostMetaEntity, 'pm', 'post.id = pm.postId')
      .leftJoinAndSelect(As3cfItemsEntity, 'ai', 'ai.sourceId = pm.metaValue')
      .leftJoinAndSelect(PostEntity, 'p', 'p.id = pm.metaValue')
      .where('post.postType = :postType AND tr.termId = :termId', { postType: 'post', termId: 251 })
      .andWhere('post.postTitle LIKE :videoName', { videoName: `%${query.title}%` })
      .andWhere('post.postStatus = :postStatus', { postStatus: 'publish' })
      .andWhere('pm.metaKey = :metaKey', { metaKey: '_thumbnail_id' })

      .innerJoin(TermRelationShipsBasicEntity, 'trs', 'post.id = trs.objectId')
      .leftJoinAndSelect(TermTaxonomyEntity, 'ttStudio', 'trs.termId = ttStudio.termId')
      .leftJoinAndSelect(TermEntity, 'termStudio', 'termStudio.id = ttStudio.termId')
      .andWhere('ttStudio.taxonomy = :taxonomy', { taxonomy: 'studio' })
      .andWhere('termStudio.name LIKE :studioName', { studioName: `%${query.studio}%` })

      .innerJoin(TermRelationShipsBasicEntity, 'trActor', 'post.id = trActor.objectId')
      .leftJoinAndSelect(TermTaxonomyEntity, 'ttActor', 'trActor.termId = ttActor.termId')
      .leftJoinAndSelect(TermEntity, 'termActor', 'termActor.id = ttActor.termId')
      .andWhere('ttActor.taxonomy = :taxonomyActor', { taxonomyActor: 'porn_star_name' })
      .andWhere('termActor.name LIKE :actorName', { actorName: `%${query.actor}%` });

    const dataPromis = queryVideo
      .select([
        'termStudio.name as subtitle',
        'post.id as id',
        'post.postName as postName',
        'post.postTitle as postTitle',
        'post.postContent as postContent',
        'post.postDate as postDate',
        'pm.metaValue as value',
        'ai.path as path',
        'p.guid as path_guid',
      ])
      .limit(query.perPage)
      .orderBy(order, direction)
      .offset((query.page - 1) * query.perPage)
      .getRawMany();

    const countPromise = queryVideo.getCount();
    const [data, count] = await Promise.all([dataPromis, countPromise]);

    const content = data.map((video: any) => ({
      id: video?.id,
      title: video?.postTitle,
      subtitle: video?.subtitle,
      preview_image: video?.path ? `https://mcdn.vrporn.com/${video?.path}` : video?.path_guid,
      release_date: new Date(video?.postDate).getTime(),
      details: [
        {
          type: 'trailer',
          duration_seconds: 90,
        },
      ],
    }));

    const result = {
      page_index: query.page,
      item_count: query.perPage,
      page_total: Math.ceil(count / query.perPage),
      item_total: count,
      content: content,
    };
    return result;
  }
  async getVideoDetail(postId: string): Promise<IFVideoView | null> {
    const result = await this.postRepository
      .createQueryBuilder('post')
      .leftJoin(TermRelationShipsBasicEntity, 'tr', 'post.id = tr.objectId')
      .leftJoin(PostMetaEntity, 'pm', 'post.id = pm.postId')
      .leftJoin(As3cfItemsEntity, 'ai', 'ai.sourceId = pm.metaValue')
      .leftJoin(PostEntity, 'p', 'p.id = pm.metaValue')
      .andWhere('post.postType = :postType', { postType: 'post' })
      .andWhere('post.postStatus = :postStatus', { postStatus: 'publish' })
      .where('post.id = :postId', { postId: postId })
      .andWhere('tr.termId = :termId', { termId: 251 })
      .andWhere('pm.metaKey = :metaKey', { metaKey: '_thumbnail_id' })
      .innerJoin(TermRelationShipsBasicEntity, 'trs', 'post.id = trs.objectId')
      .leftJoinAndSelect(TermTaxonomyEntity, 'ttStudio', 'trs.termId = ttStudio.termId')
      .leftJoinAndSelect(TermEntity, 'termStudio', 'termStudio.id = ttStudio.termId')
      .andWhere('ttStudio.taxonomy = :taxonomy', { taxonomy: 'studio' })
      .select([
        'termStudio.name as subtitle',
        'post.id as id',
        'post.postName as postName',
        'post.postTitle as postTitle',
        'post.postContent as postContent',
        'post.postDate as postDate',
        'ai.path as path',
        'p.guid as path_guid',
      ])
      .getRawOne();
    if (!result) throw new DataNotFoundException('Studio not found');
    const studioPromise = this.termRepository
      .createQueryBuilder('term')
      .innerJoin(TermTaxonomyEntity, 'tt', 'tt.termId = term.id')
      .leftJoinAndSelect(TermRelationShipsBasicEntity, 'tr', 'tr.termId = term.id')
      .where('tt.taxonomy = :taxonomy', { taxonomy: 'studio' })
      .andWhere('tr.objectId = :objectId', { objectId: result.id })
      .select(['term.slug as id', 'term.name as title'])
      .getRawOne();
    const categoriesPromise = this.termRepository
      .createQueryBuilder('term')
      .innerJoin(TermTaxonomyEntity, 'tt', 'tt.termId = term.id')
      .leftJoinAndSelect(TermRelationShipsBasicEntity, 'tr', 'tr.termId = term.id')
      .where('tt.taxonomy = :taxonomy', { taxonomy: 'post_tag' })
      .andWhere('tr.objectId = :objectId', { objectId: result.id })
      .select(['term.slug as id', 'term.name as title'])
      .getRawMany();
    const actorsPromise = await this.termRepository
      .createQueryBuilder('term')
      .innerJoin(TermTaxonomyEntity, 'tt', 'tt.termId = term.id')
      .leftJoinAndSelect(TermRelationShipsBasicEntity, 'tr', 'tr.termId = term.id')
      .where('tt.taxonomy = :taxonomy', { taxonomy: 'porn_star_name' })
      .andWhere('tr.objectId = :objectId', { objectId: result.id })
      .select(['term.slug as id', 'term.name as title'])
      .getRawMany();
    const [studio, categories, actors] = await Promise.all([studioPromise, categoriesPromise, actorsPromise]);
    return {
      id: result?.id.toString(),
      title: result?.postTitle.toString(),
      subtitle: result?.subtitle,
      description: result?.postContent.toString(),
      preview_image: result?.path ? `https://mcdn.vrporn.com/${result?.path}` : result?.path_guid,
      release_date: result?.postDate,
      studio: studio,
      categories: categories,
      actors: actors,
      views: 500,
      details: [],
    };
  }
}
