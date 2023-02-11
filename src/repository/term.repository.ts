import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TermEntity } from 'src/entities/term.entity';
import { FindOneOptions, Repository } from 'typeorm';

@Injectable()
export class TermRepository {
  constructor(
    @InjectRepository(TermEntity)
    private readonly termRepository: Repository<TermEntity>
  ) {}

  async getTermBySlug(slug: string): Promise<TermEntity> {
    const options: FindOneOptions<TermEntity> = {
      where: { slug },
    };
    const term = await this.termRepository.findOne(options);
    return term;
  }

  async getTermsStudio(query: {
    page?: number;
    perPage?: number;
    where?: any;
    order?: string;
    title?: string;
    direction?: string;
  }): Promise<{ itemTotal: number; data: TermEntity[] }> {
    const direction = query.direction === 'desc' ? 'DESC' : 'ASC';
    const orderFiend = query.order === 'popularity' ? 'popularity' : 'name';
    const data = await this.termRepository
      .createQueryBuilder('term')
      .innerJoin('term.taxonomy', 'taxonomy')
      .where('taxonomy.taxonomy = :taxonomy', { taxonomy: 'studio' })
      .andWhere('term.name like :title', { title: `%${query.title}%` })
      .orderBy(`term.${orderFiend}`, direction)
      .skip((query.page - 1) * query.perPage)
      .take(query.perPage)
      .getMany();

    const itemTotal = await this.termRepository
      .createQueryBuilder('term')
      .innerJoin('term.taxonomy', 'taxonomy')
      .where('taxonomy.taxonomy = :taxonomy', { taxonomy: 'studio' })
      .andWhere('term.name like :name', { name: `%${query.title}%` })
      .orderBy(`term.${orderFiend}`, direction)
      .getCount();
    return { itemTotal, data };
  }
}
