import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TermEntity } from 'src/entities/term.entity';
import { TermRelationShipsBasicEntity } from 'src/entities/term_relationships_basic.entity';
import { TermTaxonomyEntity } from 'src/entities/term_taxonomy.entity';
import { Repository } from 'typeorm';
import { TermMetaEntity } from 'src/entities/term_meta.entity';
import { As3cfItemsEntity } from 'src/entities/as3cf_items.entity';

@Injectable()
export class TermRepository {
  constructor(
    @InjectRepository(TermEntity)
    private readonly termRepository: Repository<TermEntity>,
    @InjectRepository(TermMetaEntity)
    private readonly termMetaRepository: Repository<TermMetaEntity>,
    @InjectRepository(TermRelationShipsBasicEntity)
    private readonly termRelationShipsBasicEntity: Repository<TermRelationShipsBasicEntity>,
    @InjectRepository(As3cfItemsEntity)
    private readonly as3cfItemsEntity: Repository<As3cfItemsEntity>
  ) {}

  async getPrivew(sourceId: number) {
    const record = await this.as3cfItemsEntity.findOne({
      where: {
        sourceId: sourceId,
      },
    });
    if (!record) return null;
    return record.path;
  }

  async getStudiosForActor(actorId: any): Promise<any> {
    const listObj = await this.termRelationShipsBasicEntity
      .createQueryBuilder('tr')
      .select('tr.objectId as objectId')
      .where('tr.termId = :termId', { termId: actorId })
      .getRawMany();
    const studios = await this.termRepository
      .createQueryBuilder('t')
      .innerJoin('TermTaxonomyEntity', 'tt', 't.id = tt.termId')
      .innerJoin('TermRelationShipsBasicEntity', 'tr', 't.id = tr.termId')
      .select(['t.slug as id', 't.name as title'])
      .where('tt.taxonomy = :taxonomy', { taxonomy: 'studio' })
      .andWhere('tr.objectId IN (:...objectIds)', {
        objectIds: listObj.map((item) => item.objectId),
      })
      .getRawMany();
    return studios;
  }

  async getActorBySlug(slug: string): Promise<any> {
    const keys = [
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
    const actor = await this.termRepository
      .createQueryBuilder('term')
      .innerJoin(TermTaxonomyEntity, 'tt', 'term.id = tt.termId')
      .leftJoinAndSelect(TermMetaEntity, 'tm', 'tm.termId = term.id')
      .where('tt.taxonomy = :taxonomy', { taxonomy: 'porn_star_name' })
      .andWhere('tm.metaKey = :metaKey', { metaKey: 'profile_image' })
      .andWhere('term.slug = :slug', { slug: slug })
      .leftJoinAndSelect(As3cfItemsEntity, 'ai', 'ai.sourceId = tm.metaValue')
      .select(['term.id as id', 'term.slug as slug', 'term.name as name', 'ai.path as preview'])
      .getRawOne();
    if (!actor) return null;
    const properties = await this.termMetaRepository
      .createQueryBuilder('tm')
      .select(['tm.metaKey as name', 'tm.metaValue as value'])
      .where('tm.termId = :termId', { termId: actor.id })
      .andWhere('tm.metaKey IN (:...metaKey)', { metaKey: keys })
      .getRawMany();
    const studios = await this.getStudiosForActor(actor.id);
    return { ...actor, properties, studios };
  }

  async getStudioBySlug(slug: string): Promise<any> {
    const term = await this.termRepository
      .createQueryBuilder('term')
      .innerJoin(TermTaxonomyEntity, 'tt', 'term.id = tt.termId')
      .leftJoinAndSelect(TermMetaEntity, 'tm', 'tm.termId = term.id')
      .where('tt.taxonomy = :taxonomy', { taxonomy: 'studio' })
      .andWhere('tm.metaKey = :metaKey', { metaKey: 'logo_single_post' })
      .andWhere('term.slug = :slug', { slug: slug })
      .select(['term.id as id', 'term.slug as slug', 'term.name as name', 'tm.metaValue as meta'])
      .getRawOne();
    const metaValue = JSON.parse(term?.meta);
    console.log(metaValue);
    const preview = await this.getPrivew(metaValue['original_image']);
    if (!term) return null;
    const termMeta = await this.termMetaRepository
      .createQueryBuilder('tm')
      .where('tm.termId = :termId', { termId: term.id })
      .andWhere('tm.metaKey = :metaKey', { metaKey: 'display_description' })
      .getOne();
    return { ...term, description: termMeta.metaValue, preview };
  }

  async getStudioList(query: {
    page?: number;
    perPage?: number;
    where?: any;
    order?: string;
    title?: string;
    direction?: string;
  }): Promise<{ itemTotal: number; data: any }> {
    const direction = query.direction === 'desc' ? 'DESC' : 'ASC';
    const order = query.order === 'popularity' ? 'term.name' : 'term.name';
    const data = await this.termRepository
      .createQueryBuilder('term')
      .leftJoinAndSelect(TermTaxonomyEntity, 'tt', 'tt.termId = term.id')
      .leftJoinAndSelect(TermMetaEntity, 'tm', 'tm.termId = term.id')
      .where('tt.taxonomy = :taxonomy', { taxonomy: 'studio' })
      .andWhere('term.name LIKE :title', { title: `%${query.title}%` })
      .andWhere('tm.metaKey = :metaKey', { metaKey: 'logo_single_post' })
      .select(['term.id as id', 'term.slug as slug', 'term.name as name', 'tm.metaValue as meta'])
      .limit(query.perPage)
      .orderBy(order, direction)
      .offset((query.page - 1) * query.perPage)
      .getRawMany();
    const itemTotal = await this.termRepository
      .createQueryBuilder('term')
      .innerJoin(TermTaxonomyEntity, 'tt', 'tt.termId = term.id')
      .where('tt.taxonomy = :taxonomy', { taxonomy: 'studio' })
      .andWhere('term.name LIKE :title', { title: `%${query.title}%` })
      .getCount();

    return { itemTotal, data };
  }
  async getActorList(query: {
    page?: number;
    perPage?: number;
    where?: any;
    order?: string;
    title?: string;
    direction?: string;
  }): Promise<{ itemTotal: number; data: any }> {
    const direction = query.direction === 'desc' ? 'DESC' : 'ASC';
    const order = query.order === 'popularity' ? 'term.name' : 'term.name';
    const data = await this.termRepository
      .createQueryBuilder('term')
      .leftJoinAndSelect(TermTaxonomyEntity, 'tt', 'tt.termId = term.id')
      .leftJoinAndSelect(TermMetaEntity, 'tm', 'tm.termId = term.id')
      .where('tt.taxonomy = :taxonomy', { taxonomy: 'porn_star_name' })
      .andWhere('term.name LIKE :title', { title: `%${query.title}%` })
      .andWhere('tm.metaKey = :metaKey', { metaKey: 'profile_image' })
      .leftJoinAndSelect(As3cfItemsEntity, 'ai', 'ai.sourceId = tm.metaValue')
      .select(['term.id as id', 'term.slug as slug', 'term.name as name', 'tm.metaValue as meta', 'ai.path as preview'])
      .limit(query.perPage)
      .orderBy(order, direction)
      .offset((query.page - 1) * query.perPage)
      .getRawMany();
    const itemTotal = await this.termRepository
      .createQueryBuilder('term')
      .innerJoin(TermTaxonomyEntity, 'tt', 'tt.termId = term.id')
      .where('tt.taxonomy = :taxonomy', { taxonomy: 'porn_star_name' })
      .andWhere('term.name LIKE :title', { title: `%${query.title}%` })
      .getCount();

    return { itemTotal, data };
  }
}
