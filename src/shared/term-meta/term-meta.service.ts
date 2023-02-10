import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { TermMetaEntity } from 'src/entities/term_meta.entity';
import { FindOneOptions, Repository } from 'typeorm';
import { TermEntity } from './../../entities/term.entity';

@Injectable()
export class TermMetaService {
  constructor(
    @InjectRepository(TermMetaEntity)
    private readonly termMetaRepository: Repository<TermMetaEntity>
  ) {}

  async getListTermMetaByTermId(termId: number): Promise<TermMetaEntity[]> {
    const termMeta = await this.termMetaRepository.find({
      where: {
        term: { id: termId },
      },
    });
    return termMeta;
  }

  async getTermMetaByTermIdAndKey(termId: number, metaKey: string): Promise<TermMetaEntity> {
    const options: FindOneOptions<TermMetaEntity> = {
      where: {
        term: { id: termId },
        metaKey,
      },
    };
    const term = await this.termMetaRepository.findOne(options);
    return term;
  }
}
