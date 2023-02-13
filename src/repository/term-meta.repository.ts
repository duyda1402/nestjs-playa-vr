import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TermMetaEntity } from 'src/entities/term_meta.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TermMetaRepository {
  constructor(
    @InjectRepository(TermMetaEntity)
    private readonly termMetaRepository: Repository<TermMetaEntity>
  ) {}

  async getListTermMetaByTermId(termId: number): Promise<TermMetaEntity> {
    const termMeta = await this.termMetaRepository
      .createQueryBuilder('tm')
      .where('tm.termId = :termId', { termId: termId })
      .getOne();

    return termMeta;
  }

  async getTermMetaByTermIdAndKey(termId: number, metaKey: string): Promise<TermMetaEntity> {
    const term = await this.termMetaRepository
      .createQueryBuilder('tm')
      .where('tm.termId = :termId', { termId: termId })
      .andWhere('tm.metaKey =:key', { key: metaKey })
      .getOne();

    return term;
  }
}
