import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TermEntity } from 'src/entities/term.entity';
import { Like, Repository } from 'typeorm';
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
    private readonly termRepository: Repository<TermEntity>
  ) {}

  async getTermBySlug(slug: string, label: string): Promise<TermEntity> {
    const term = await this.termRepository.findOne({
      relations: {
        taxonomy: true,
        metas: true,
      },
      where: {
        slug: slug,
        taxonomy: {
          taxonomy: Like(`%${label}%`),
        },
      },
    });
    console.log(term);
    return term;
  }

  async getTermsByLabel(query: {
    page?: number;
    perPage?: number;
    where?: any;
    order?: string;
    title?: string;
    direction?: string;
    label: string;
  }): Promise<{ itemTotal: number; data: TermEntity[] }> {
    const direction = query.direction === 'desc' ? 'DESC' : 'ASC';
    const order: OrderType =
      query.order === 'popularity' ? { taxonomy: { count: direction || 'ASC' } } : { name: direction || 'ASC' };
    const data = await this.termRepository.find({
      skip: (query.page - 1) * query.perPage,
      take: query.perPage,
      relations: {
        taxonomy: true,
        // metas: true,
      },
      select: {
        taxonomy: {
          id: true,
          taxonomy: true,
          count: true,
        },
      },
      where: {
        taxonomy: { taxonomy: query.label },
        name: Like(`%${query.title}%`),
      },
      order: order,
    });
    const itemTotal = await this.termRepository.count({
      relations: ['taxonomy'],
      where: {
        taxonomy: { taxonomy: query.label },
        name: Like(`%${query.title}%`),
      },
      order: order,
    });
    return { itemTotal, data };
  }
}
