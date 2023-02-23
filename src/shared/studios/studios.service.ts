import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { As3cfItemsEntity } from 'src/entities/as3cf_items.entity';
import { PopularScoresEntity } from 'src/entities/popular_scores.entity';
import { PostEntity } from 'src/entities/post.entity';
import { TermEntity } from 'src/entities/term.entity';
import { TermMetaEntity } from 'src/entities/term_meta.entity';
import { TermRelationShipsBasicEntity } from 'src/entities/term_relationships_basic.entity';
import { TermTaxonomyEntity } from 'src/entities/term_taxonomy.entity';
import { DataNotFoundException } from 'src/exceptions/data.exception';
import { IFStudioListView, IFStudioView, IFPage, QueryBody } from 'src/types';
import { Repository } from 'typeorm';

@Injectable()
export class StudiosService {
  constructor(
    @InjectRepository(TermEntity)
    private readonly termRepository: Repository<TermEntity>,
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>
  ) {}

  async getStudioList(query: QueryBody): Promise<IFPage<IFStudioListView[]>> {
    const direction = query.direction === 'desc' ? 'DESC' : 'ASC';
    let data = [];
    let count = 0;
    if (query.order === 'popularity') {
      const studioQuery = this.termRepository
        .createQueryBuilder('term')
        .innerJoin(TermTaxonomyEntity, 'tt', 'term.id = tt.termId')
        .where('tt.taxonomy = :taxonomy', { taxonomy: 'studio' })
        .leftJoin(TermMetaEntity, 'tm', 'tm.termId = term.id')
        .leftJoinAndSelect(PostEntity, 'post', `post.id = ${this.strQuery} `)
        .leftJoinAndSelect(As3cfItemsEntity, 'ai', `ai.sourceId = ${this.strQuery}`)
        .andWhere('term.name LIKE :title', { title: `%${query.title}%` })
        .andWhere('tm.metaKey = :metaKey', { metaKey: 'logo_single_post' });

      const dataPromise = studioQuery
        .select([
          'term.id as id',
          'term.slug as slug',
          'term.name as name',
          'ai.path as path_as3',
          'tm.metaValue as metaValue',
          'post.guid as path_guid',
        ])
        .addSelect((subQuery) => {
          const query = subQuery
            .select('SUM(pp.premiumPopularScore)', 'result')
            .from(PopularScoresEntity, 'pp')
            .innerJoin(TermRelationShipsBasicEntity, 'tr', 'tr.objectId = pp.postId')
            .where('tr.termId = term.id');
          return query;
        }, 'popularity')
        .limit(query.perPage)
        .orderBy('popularity', direction)
        .offset((query.page - 1) * query.perPage)
        .getRawMany();
      const countPromise = studioQuery.getCount();
      [data, count] = await Promise.all([dataPromise, countPromise]);
    } else {
      const dataPromise = this.termRepository
        .createQueryBuilder('term')
        .innerJoin(TermTaxonomyEntity, 'tt', 'tt.termId = term.id')
        .leftJoin(TermMetaEntity, 'tm', 'tm.termId = term.id')
        .leftJoinAndSelect(PostEntity, 'post', `post.id = ${this.strQuery} `)
        .leftJoinAndSelect(As3cfItemsEntity, 'ai', `ai.sourceId = ${this.strQuery}`)
        .where('tt.taxonomy = :taxonomy', { taxonomy: 'studio' })
        .andWhere('term.name LIKE :title', { title: `%${query.title}%` })
        .andWhere('tm.metaKey = :metaKey', { metaKey: 'logo_single_post' })
        .select([
          'term.id as id',
          'term.slug as slug',
          'term.name as name',
          'ai.path as path_as3',
          'tm.metaValue as metaValue',
          'post.guid as path_guid',
        ])
        .limit(query.perPage)
        .orderBy('term.name', direction)
        .offset((query.page - 1) * query.perPage)
        .getRawMany();
      const countPromise = this.termRepository
        .createQueryBuilder('term')
        .innerJoin(TermTaxonomyEntity, 'tt', 'tt.termId = term.id')
        .where('tt.taxonomy = :taxonomy', { taxonomy: 'studio' })
        .andWhere('term.name LIKE :title', { title: `%${query.title}%` })
        .getCount();
      [data, count] = await Promise.all([dataPromise, countPromise]);
    }

    const content =
      data &&
      data[0] &&
      data.map((studio: any) => ({
        id: studio.slug,
        title: studio.name,
        preview: studio?.path_as3 ? `https://mcdn.vrporn.com/${studio?.path_as3}` : studio?.path_guid,
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

  async getStudioDetail(slug: string): Promise<IFStudioView | null> {
    const studio = await this.termRepository
      .createQueryBuilder('term')
      .innerJoin(TermTaxonomyEntity, 'tt', 'tt.termId = term.id')
      .leftJoinAndSelect(TermMetaEntity, 'tm', 'tm.termId = term.id')
      .leftJoinAndSelect(PostEntity, 'post', `post.id = ${this.strQuery} `)
      .leftJoinAndSelect(As3cfItemsEntity, 'ai', `ai.sourceId = ${this.strQuery}`)
      .where('term.slug = :slug', { slug })
      .andWhere('tt.taxonomy = :taxonomy', { taxonomy: 'studio' })
      .andWhere('tm.metaKey = :metaKey', { metaKey: 'logo_single_post' })
      .select([
        'term.id as id',
        'term.slug as slug',
        'term.name as name',
        'ai.path as path_as3',
        'post.postTitle as description',
        'post.guid as path_guid',
      ])
      .getRawOne();
    if (!studio) throw new DataNotFoundException('Studio not found');
    const posts = await this.postRepository
      .createQueryBuilder('post')
      .innerJoin(TermRelationShipsBasicEntity, 'tr', 'tr.objectId = post.id')
      .where('tr.termId = :termId', { termId: studio.id })
      .getMany();
    const arrPostId = posts ? posts.map((item) => Number(item.id)) : [];
    // count view
    return {
      id: studio?.slug,
      title: studio?.name,
      preview: studio?.path_as3 ? `https://mcdn.vrporn.com/${studio?.path_as3}` : studio?.path_guid,
      description: studio?.description,
      views: 100,
    };
  }
  private strQuery = `IF(tm.metaValue REGEXP '^[0-9]+$', tm.metaValue, IF(JSON_VALID(tm.metaValue), JSON_UNQUOTE(JSON_EXTRACT(CAST(tm.metaValue AS CHAR), '$.original_image')), ''))`;
}
