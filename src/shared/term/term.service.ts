import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TermEntity } from 'src/entities/term.entity';
import { FindOneOptions, Repository } from 'typeorm';

@Injectable()
export class TermService {
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
}
