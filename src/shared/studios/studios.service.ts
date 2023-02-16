import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { As3cfItemsEntity } from 'src/entities/as3cf_items.entity';
import { PostEntity } from 'src/entities/post.entity';
import { TermEntity } from 'src/entities/term.entity';
import { TermMetaEntity } from 'src/entities/term_meta.entity';
import { TermTaxonomyEntity } from 'src/entities/term_taxonomy.entity';
import { DataNotFoundException } from 'src/exceptions/data.exception';
import { IFStudioListView, IFStudioView, IFPage, QueryBody } from 'src/types';
import { Repository } from 'typeorm';

@Injectable()
export class StudiosService {
  constructor(
    @InjectRepository(TermEntity)
    private readonly termRepository: Repository<TermEntity>
  ) {}

  async getStudioList(query: QueryBody): Promise<IFPage<IFStudioListView[]>> {
    const direction = query.direction === 'desc' ? 'DESC' : 'ASC';
    const order = query.order === 'popularity' ? 'term.name' : 'term.name';
    const dataPromise = this.termRepository
      .createQueryBuilder('term')
      .innerJoin(TermTaxonomyEntity, 'tt', 'tt.termId = term.id')
      .leftJoin(TermMetaEntity, 'tm', 'tm.termId = term.id')
      .leftJoinAndSelect(PostEntity, 'post', `post.id = ${this.strQuery} `)
      .leftJoinAndSelect(As3cfItemsEntity, 'ai', `ai.sourceId = ${this.strQuery}`)
      .where('tt.taxonomy = :taxonomy', { taxonomy: 'studio' })
      .andWhere('tm.metaKey = :metaKey', { metaKey: 'logo_single_post' })
      .select([
        'term.id as id',
        'term.slug as slug',
        'term.name as name',
        'ai.path as path_as3',
        'tm.metaValue as metaValue',
        'post.guid as path_guid',
      ])
      .addSelect(``, 'check')
      .limit(query.perPage)
      .orderBy(order, direction)
      .offset((query.page - 1) * query.perPage)
      .getRawMany();

    const countPromise = this.termRepository
      .createQueryBuilder('term')
      .innerJoin(TermTaxonomyEntity, 'tt', 'tt.termId = term.id')
      .where('tt.taxonomy = :taxonomy', { taxonomy: 'studio' })
      .andWhere('term.name LIKE :title', { title: `%${query.title}%` })
      .getCount();
    const [data, count] = await Promise.all([dataPromise, countPromise]);
    console.log(data);
    const content = data.map((studio: any) => ({
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
