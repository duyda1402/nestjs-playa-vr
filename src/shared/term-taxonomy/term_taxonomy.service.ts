import { TermTaxonomyEntity } from '../../entities/term_taxonomy.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

@Injectable()
export class TermTaxonomyService {
  constructor(
    @InjectRepository(TermTaxonomyEntity)
    private readonly termTexonomyRepository: Repository<TermTaxonomyEntity>
  ) {}

  async getTermTaxonomyList(payload: {
    pageIndex?: number;
    pageSize?: number;
    where?: any;
    order?: any;
  }): Promise<TermTaxonomyEntity[]> {
    const index = payload.pageIndex || 1;
    const limit = payload.pageSize || 20;
    const order = payload.order || { taxonomy: 'ASC' };
    return await this.termTexonomyRepository.find({
      skip: (index - 1) * 10,
      take: limit, // limit to 20 records
      where: payload.where, // filter
      order: order, //sort
    });
  }
}
