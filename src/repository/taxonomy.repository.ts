import { TermTaxonomyEntity } from '../entities/term_taxonomy.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { FindOneOptions, Repository } from 'typeorm';

@Injectable()
export class TaxonomyRepository {
  constructor(
    @InjectRepository(TermTaxonomyEntity)
    private readonly texonomyRepository: Repository<TermTaxonomyEntity>
  ) {}

  async getTaxonomyOne(where: any): Promise<TermTaxonomyEntity> {
    const options: FindOneOptions<TermTaxonomyEntity> = {
      where: where,
    };
    const term = await this.texonomyRepository.findOne(options);
    return term;
  }
  async getTaxonomys(payload: {
    page?: number;
    perPage?: number;
    where?: any;
    order?: any;
  }): Promise<{ itemTotal: number; data: TermTaxonomyEntity[] }> {
    const itemTotal = await this.texonomyRepository.count();
    const data = await this.texonomyRepository.find({
      skip: (payload.page - 1) * payload.perPage || 1,
      take: payload.perPage || 10, // limit to 20 records
      where: payload.where, // filter
      order: payload.order, //sort
    });
    return { itemTotal, data };
  }
}
