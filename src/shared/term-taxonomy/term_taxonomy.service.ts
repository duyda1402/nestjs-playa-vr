import { TermTaxonomyEntity } from '../../entities/term_taxonomy.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { FindOneOptions, Repository } from 'typeorm';

@Injectable()
export class TermTaxonomyService {
  constructor(
    @InjectRepository(TermTaxonomyEntity)
    private readonly termTexonomyRepository: Repository<TermTaxonomyEntity>
  ) {}
  async getgetTaxonomyByTermAndLabel(termId: number, label: string): Promise<TermTaxonomyEntity> {
    const options: FindOneOptions<TermTaxonomyEntity> = {
      where: {
        termId: { id: termId },
        taxonomy: label,
      },
    };
    const term = await this.termTexonomyRepository.findOne(options);
    return term;
  }
  async getTaxonomyOne(where: any): Promise<TermTaxonomyEntity> {
    const options: FindOneOptions<TermTaxonomyEntity> = {
      where: where,
      relations: {
        termId: true,
      },
    };
    const term = await this.termTexonomyRepository.findOne(options);
    return term;
  }
  async getTermTaxonomyList(payload: {
    page?: number;
    perPage?: number;
    where?: any;
    order?: any;
  }): Promise<TermTaxonomyEntity[]> {
    const order = payload.order || { taxonomy: 'ASC' };
    return await this.termTexonomyRepository.find({
      skip: (payload.page - 1) * payload.perPage || 1,
      take: payload.perPage || 10, // limit to 20 records
      where: payload.where, // filter
      order: order, //sort
      relations: {
        termId: true,
      },
    });
  }
}
