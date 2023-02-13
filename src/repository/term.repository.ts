import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TermEntity } from 'src/entities/term.entity';
import { TermRelationShipsBasicEntity } from 'src/entities/term_relationships_basic.entity';
import { TermTaxonomyEntity } from 'src/entities/term_taxonomy.entity';
import { Repository } from 'typeorm';
import { TermMetaEntity } from 'src/entities/term_meta.entity';

type OrderType = {
  taxonomy?: {
    count?: 'DESC' | 'ASC';
  };
  name?: 'DESC' | 'ASC';
};

@Injectable()
export class TermRepository {
  constructor(
    @InjectRepository(TermEntity)
    private readonly termRepository: Repository<TermEntity>,
    @InjectRepository(TermMetaEntity)
    private readonly termMetaRepository: Repository<TermMetaEntity>,
    @InjectRepository(TermRelationShipsBasicEntity)
    private readonly termRelationShipsBasicEntity: Repository<TermRelationShipsBasicEntity>
  ) {}

  async getStudioForActor(actorId: any): Promise<any> {
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
      .where('tt.taxonomy = :taxonomy', { taxonomy: 'porn_star_name' })
      .andWhere('term.slug = :slug', { slug: slug })
      .getOne();
    if (!actor) return null;
    const properties = await this.termMetaRepository
      .createQueryBuilder('tm')
      .select(['tm.metaKey as name', 'tm.metaValue as value'])
      .where('tm.termId = :termId', { termId: actor.id })
      .andWhere('tm.metaKey IN (:...metaKey)', { metaKey: keys })
      .getRawMany();
    const studios = await this.getStudioForActor(actor.id);
    return { ...actor, properties, studios };
  }

  async getStudioBySlug(slug: string): Promise<any> {
    const term = await this.termRepository
      .createQueryBuilder('term')
      .innerJoin(TermTaxonomyEntity, 'tt', 'term.id = tt.termId')
      .where('tt.taxonomy = :taxonomy', { taxonomy: 'studio' })
      .andWhere('term.slug = :slug', { slug: slug })
      .getOne();
    if (!term) return null;
    const termMeta = await this.termMetaRepository
      .createQueryBuilder('tm')
      .where('tm.termId = :termId', { termId: term.id })
      .andWhere('tm.metaKey = :metaKey', { metaKey: 'display_description' })
      .getOne();
    return { ...term, description: termMeta.metaValue };
  }

  async getTermsByLabel(query: {
    page?: number;
    perPage?: number;
    where?: any;
    order?: string;
    title?: string;
    direction?: string;
    label: string;
  }): Promise<{ itemTotal: number; data: any }> {
    const direction = query.direction === 'desc' ? 'DESC' : 'ASC';
    const order = query.order === 'popularity' ? 'term.name' : 'term.name';
    const data = await this.termRepository
      .createQueryBuilder('term')
      .innerJoinAndSelect(TermTaxonomyEntity, 'tt', 'term.id = tt.termId')
      .where('tt.taxonomy = :taxonomy', { taxonomy: query.label })
      .andWhere('term.name LIKE :title', { title: `%${query.title}%` })
      .limit(query.perPage)
      .orderBy(order, direction)
      .offset((query.page - 1) * query.perPage)
      .getMany();

    const itemTotal = await this.termRepository
      .createQueryBuilder('term')
      .innerJoin(TermTaxonomyEntity, 'tt', 'tt.termId = term.id')
      .where('tt.taxonomy = :taxonomy', { taxonomy: query.label })
      .andWhere('term.name LIKE :title', { title: `%${query.title}%` })
      .getCount();

    return { itemTotal, data };
  }
}
