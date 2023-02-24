import { Injectable } from '@nestjs/common';
import { DataNotFoundException } from 'src/exceptions/data.exception';
import { IFActorListView, IFPage, QueryBody } from 'src/types';
import { IFActorView } from './../../types/data.type';
import { TermEntity } from 'src/entities/term.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TermTaxonomyEntity } from 'src/entities/term_taxonomy.entity';
import { TermMetaEntity } from 'src/entities/term_meta.entity';
import { As3cfItemsEntity } from 'src/entities/as3cf_items.entity';
import { PostEntity } from 'src/entities/post.entity';
import { TermRelationShipsBasicEntity } from 'src/entities/term_relationships_basic.entity';
import { PopularScoresEntity } from 'src/entities/popular_scores.entity';
import { OpenSearchService } from './../open-search/opensearch.service';

@Injectable()
export class ActorService {
  constructor(
    @InjectRepository(TermEntity)
    private readonly termRepository: Repository<TermEntity>,
    @InjectRepository(TermMetaEntity)
    private readonly termMetaRepository: Repository<TermMetaEntity>,
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
    private readonly spenSearchService: OpenSearchService
  ) {}

  async getActorList(query: QueryBody): Promise<IFPage<IFActorListView[]>> {
    const direction = query.direction === 'desc' ? 'DESC' : 'ASC';
    const order = query.order === 'popularity' ? 'popularity' : 'term.name';
    const actorQuery = this.termRepository
      .createQueryBuilder('term')
      .leftJoinAndSelect(TermTaxonomyEntity, 'tt', 'tt.termId = term.id')
      .leftJoinAndSelect(TermMetaEntity, 'tm', 'tm.termId = term.id')
      .leftJoinAndSelect(PostEntity, 'post', 'post.id = tm.metaValue')
      .leftJoinAndSelect(As3cfItemsEntity, 'ai', 'ai.sourceId = tm.metaValue')
      .where('tt.taxonomy = :taxonomy', { taxonomy: 'porn_star_name' })
      .andWhere('term.name LIKE :title', { title: `%${query.title}%` })
      .andWhere('tm.metaKey = :metaKey', { metaKey: 'profile_image' });

    const dataPromise = actorQuery
      .select(['term.slug as slug', 'term.name as name', 'post.guid as path_guid', 'ai.path as path'])
      .addSelect((subQuery) => {
        const query = subQuery
          .select('SUM(pp.premiumPopularScore)', 'result')
          .from(PopularScoresEntity, 'pp')
          .innerJoin(TermRelationShipsBasicEntity, 'tr', 'tr.objectId = pp.postId')
          .where('tr.termId = term.id');
        return query;
      }, 'popularity')
      .limit(query.perPage)
      .orderBy(order, direction)
      .offset((query.page - 1) * query.perPage)
      .getRawMany();
    const countPromise = actorQuery.getCount();
    const [data, count] = await Promise.all([dataPromise, countPromise]);
    console.log(data);
    const content = data.map((item: any) => ({
      id: item.slug,
      title: item.name,
      preview: item?.path ? `https://mcdn.vrporn.com/${item?.path}` : item?.path_guid,
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

  async getActorDetail(slug: string): Promise<IFActorView | null> {
    const actor = await this.termRepository
      .createQueryBuilder('term')
      .innerJoin(TermTaxonomyEntity, 'tt', 'tt.termId = term.id')
      .where('term.slug = :slug', { slug })
      .andWhere('tt.taxonomy = :taxonomy', { taxonomy: 'porn_star_name' })
      .getOne();
    if (!actor) throw new DataNotFoundException('Actor not found');
    const actorPromise = this.termRepository
      .createQueryBuilder('term')
      .where('term.id = :termImageId', { termImageId: actor.id })
      //profile_image
      .leftJoin(TermMetaEntity, 'tm', 'tm.termId = term.id AND tm.metaKey = :avatarMetaKey', {
        avatarMetaKey: 'profile_image',
      })
      .leftJoin(As3cfItemsEntity, 'ai', 'ai.sourceId = tm.metaValue')
      .leftJoin(PostEntity, 'post', 'post.id = tm.metaValue')
      //top_banner_background
      .leftJoin(TermMetaEntity, 'tmTow', 'tmTow.termId = term.id AND tmTow.metaKey = :bannerMetaKey', {
        bannerMetaKey: 'top_banner_background',
      })
      .leftJoin(As3cfItemsEntity, 'aiBanner', 'aiBanner.sourceId = tmTow.metaValue')
      .leftJoin(PostEntity, 'postBanner', 'postBanner.id = tmTow.metaValue')
      .select([
        'term.slug as slug',
        'term.name as name',
        'post.guid as path_avatar_post',
        'ai.path as path_avatar',
        'postBanner.guid as path_banner_post',
        'aiBanner.path as path_banner',
      ])
      .getRawOne();
    const propertiesPromise = this.termMetaRepository
      .createQueryBuilder('tm')
      .select(['tm.metaKey as name', 'tm.metaValue as value'])
      .where('tm.termId = :termId', { termId: actor.id })
      .andWhere('tm.metaKey IN (:...metaKey)', { metaKey: this.keys })
      .getRawMany();
    const studiosPromise = this.termRepository
      .createQueryBuilder('term')
      .innerJoin(TermTaxonomyEntity, 'tt', 'term.id = tt.termId')
      .where('tt.taxonomy = :taxonomy', { taxonomy: 'studio' })
      .leftJoinAndSelect(TermRelationShipsBasicEntity, 'tr', 'term.id = tr.termId')
      .andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .from(TermRelationShipsBasicEntity, 'termRela')
          .where('termRela.termId = :termRelaId', { termRelaId: actor.id })
          .select('termRela.objectId')
          .getQuery();
        return `tr.objectId IN (${subQuery})`;
      })
      .select(['term.slug as id', 'term.name as title'])
      .getRawMany();
    const postsPromise = this.postRepository
      .createQueryBuilder('post')
      .innerJoin(TermRelationShipsBasicEntity, 'tr', 'tr.objectId = post.id')
      .where('tr.termId = :termId', { termId: actor.id })
      .getMany();
    const [properties, studios, actorInfo] = await Promise.all([
      propertiesPromise,
      studiosPromise,
      actorPromise,
      postsPromise,
    ]);

    // count_view;
    const views = await this.spenSearchService.getTermViews(actor.id);
    return {
      id: actorInfo?.slug,
      title: actorInfo?.name,
      preview: actorInfo?.path_avatar
        ? `https://mcdn.vrporn.com/${actorInfo?.path_avatar}`
        : actorInfo?.path_avatar_post,
      studios: studios,
      properties: properties,
      aliases: ['Felix Argyle', 'Blue Knight', 'Ferri-chan'],
      views: views,
      banner: actorInfo?.path_banner
        ? `https://mcdn.vrporn.com/${actorInfo?.path_banner}`
        : actorInfo?.path_banner_post,
    };
  }

  private keys = [
    'birthdate',
    'birthplate',
    'height',
    'weight',
    'breast_size',
    'hair_color',
    'eyecolor',
    // 'webpage',
    // 'twitter',
    // 'facebook',
    'ethnicity',
    'country_of_origin',
  ];
}
