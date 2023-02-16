import { Injectable } from '@nestjs/common';
import { DataNotFoundException } from 'src/exceptions/data.exception';
import { IFActorListView, IFPage } from 'src/types';
import { IFActorView } from './../../types/data.type';
import { TermEntity } from 'src/entities/term.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TermTaxonomyEntity } from 'src/entities/term_taxonomy.entity';
import { TermMetaEntity } from 'src/entities/term_meta.entity';
import { TermRelationShipsBasicEntity } from 'src/entities/term_relationships_basic.entity';
import { As3cfItemsEntity } from 'src/entities/as3cf_items.entity';
import { PostEntity } from 'src/entities/post.entity';

@Injectable()
export class ActorService {
  constructor(
    @InjectRepository(TermEntity)
    private readonly termRepository: Repository<TermEntity>
  ) {}

  async getActorList(query: {
    page?: number;
    perPage?: number;
    order?: string;
    direction?: string;
    title?: string;
  }): Promise<IFPage<IFActorListView[]>> {
    const direction = query.direction === 'desc' ? 'DESC' : 'ASC';
    const order = query.order === 'popularity' ? 'term.name' : 'term.name';
    const data = await this.termRepository
      .createQueryBuilder('term')
      .leftJoinAndSelect(TermTaxonomyEntity, 'tt', 'tt.termId = term.id')
      .leftJoinAndSelect(TermMetaEntity, 'tm', 'tm.termId = term.id')
      .leftJoinAndSelect(PostEntity, 'post', 'post.id = tm.metaValue')
      .leftJoinAndSelect(As3cfItemsEntity, 'ai', 'ai.sourceId = tm.metaValue')
      .where('tt.taxonomy = :taxonomy', { taxonomy: 'porn_star_name' })
      .andWhere('term.name LIKE :title', { title: `%${query.title}%` })
      .andWhere('tm.metaKey = :metaKey', { metaKey: 'profile_image' })
      .select([
        'term.id as id',
        'term.slug as slug',
        'term.name as name',
        'post.guid as path_guid',
        'tm.metaKey as tm_meta_key',
        'tm.metaValue as tm_meta_value',
        'ai.id as aiId',
        'ai.path as path',
      ])
      .limit(query.perPage)
      .orderBy(order, direction)
      .offset((query.page - 1) * query.perPage)
      .getRawMany();

    console.log(data);
    const itemTotal = await this.termRepository
      .createQueryBuilder('term')
      .innerJoin(TermTaxonomyEntity, 'tt', 'tt.termId = term.id')
      .where('term.name LIKE :title', { title: `%${query.title}%` })
      .andWhere('tt.taxonomy = :taxonomy', {
        taxonomy: 'porn_star_name',
      })
      .getCount();

    const content = data.map((item: any) => ({
      id: item.slug,
      title: item.name,
      preview: item?.path ? `https://mcdn.vrporn.com/${item?.path}` : 'https://mcdn.vrporn.com/200/300',
    }));
    const result = {
      page_index: query.page,
      item_count: query.perPage,
      page_total: Math.ceil(itemTotal / query.perPage),
      item_total: itemTotal,
      content: content,
    };
    return result;
  }

  async getActorDetail(id: string): Promise<IFActorView | null> {
    const result = null;
    // await this.termRepository.getActorBySlug(id);
    if (!result) throw new DataNotFoundException('Actor not found');
    return {
      id: result?.slug,
      title: result?.name,
      preview: result?.preview ? `https://mcdn.vrporn.com/${result?.preview}` : 'https://mcdn.vrporn.com/200/300',
      studios: result?.studios,
      properties: result?.properties,
      aliases: ['Felix Argyle', 'Blue Knight', 'Ferri-chan'],
      views: 500,
      banner: null,
    };
  }
}
