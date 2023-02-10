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
    page?: number;
    perPage?: number;
    where?: any;
    order?: any;
  }): Promise<TermTaxonomyEntity[]> {
    const order = payload.order || { taxonomy: 'ASC' };
    return await this.termTexonomyRepository.find({
      skip: (payload.page - 1) * payload.perPage,
      take: payload.perPage, // limit to 20 records
      where: payload.where, // filter
      order: order, //sort
      relations: {
        termId: true,
      },
    });
  }
}
