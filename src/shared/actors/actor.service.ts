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
import { TopPornstarsEntity } from 'src/entities/top_pornstar.entity';

@Injectable()
export class ActorService {
  constructor(
    @InjectRepository(TermEntity)
    private readonly termRepository: Repository<TermEntity>,
    @InjectRepository(TermMetaEntity)
    private readonly termMetaRepository: Repository<TermMetaEntity>
  ) {}

  async getActorList(query: QueryBody): Promise<IFPage<IFActorListView[]>> {
    const direction = query.direction === 'desc' ? 'DESC' : 'ASC';
    const order = query.order === 'popularity' ? 'tp.score' : 'term.name';
    const dataPromise = this.termRepository
      .createQueryBuilder('term')
      .leftJoinAndSelect(TermTaxonomyEntity, 'tt', 'tt.termId = term.id')
      .leftJoinAndSelect(TopPornstarsEntity, 'tp', 'tp.termId = term.id')
      .leftJoinAndSelect(TermMetaEntity, 'tm', 'tm.termId = term.id')
      .leftJoinAndSelect(PostEntity, 'post', 'post.id = tm.metaValue')
      .leftJoinAndSelect(As3cfItemsEntity, 'ai', 'ai.sourceId = tm.metaValue')
      .where('tt.taxonomy = :taxonomy', { taxonomy: 'porn_star_name' })
      .andWhere('term.name LIKE :title', { title: `%${query.title}%` })
      .andWhere('tm.metaKey = :metaKey', { metaKey: 'profile_image' })
      .select(['term.slug as slug', 'term.name as name', 'post.guid as path_guid', 'ai.path as path'])
      .limit(query.perPage)
      .orderBy(order, direction)
      .offset((query.page - 1) * query.perPage)
      .getRawMany();

    const countPromise = this.termRepository
      .createQueryBuilder('term')
      .innerJoin(TermTaxonomyEntity, 'tt', 'tt.termId = term.id')
      .where('term.name LIKE :title', { title: `%${query.title}%` })
      .andWhere('tt.taxonomy = :taxonomy', {
        taxonomy: 'porn_star_name',
      })
      .getCount();
    const [data, count] = await Promise.all([dataPromise, countPromise]);
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
      .innerJoin(TermTaxonomyEntity, 'tt', 'tt.termId = term.id')
      .leftJoinAndSelect(TermMetaEntity, 'tm', 'tm.termId = term.id')
      .leftJoinAndSelect(PostEntity, 'post', 'post.id = tm.metaValue')
      .leftJoinAndSelect(As3cfItemsEntity, 'ai', 'ai.sourceId = tm.metaValue')
      .where('term.slug = :slug', { slug })
      .andWhere('tt.taxonomy = :taxonomy', { taxonomy: 'porn_star_name' })
      .andWhere('tm.metaKey = :metaKey', { metaKey: 'profile_image' })
      .select(['term.slug as slug', 'term.name as name', 'post.guid as path_guid', 'ai.path as path'])
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
      .leftJoinAndSelect(TermRelationShipsBasicEntity, 'tr', 'term.id = tr.termId')
      .select(['term.slug as id', 'term.name as title'])
      .where('tt.taxonomy = :taxonomy', { taxonomy: 'studio' })
      .andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('tr.objectId')
          .from(TermRelationShipsBasicEntity, 'tr')
          .where('tr.termId = :termId', { termId: actor.id })
          .getQuery();
        return `tr.objectId IN (${subQuery})`;
      })
      .getRawMany();
    const [properties, studios, actorInfo] = await Promise.all([propertiesPromise, studiosPromise, actorPromise]);
    return {
      id: actorInfo?.slug,
      title: actorInfo?.name,
      preview: actorInfo?.path ? `https://mcdn.vrporn.com/${actorInfo?.path}` : actorInfo?.path_guid,
      studios: studios,
      properties: properties,
      aliases: ['Felix Argyle', 'Blue Knight', 'Ferri-chan'],
      views: 500,
      banner: null,
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
    'webpage',
    'twitter',
    'facebook',
    'ethnicity',
    'country_of_origin',
  ];
}
