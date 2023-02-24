import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TermEntity } from 'src/entities/term.entity';
import { TermMetaEntity } from 'src/entities/term_meta.entity';
import { TermTaxonomyEntity } from 'src/entities/term_taxonomy.entity';
import { Brackets, Repository } from 'typeorm';
import { CommonService } from '../common/common.service';
import * as uslParse from 'url-parse';
@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(TermEntity)
    private readonly termRepository: Repository<TermEntity>,
    @InjectRepository(TermEntity)
    private readonly optionsRepository: Repository<TermEntity>,
    private readonly commonService: CommonService
  ) {}

  async getCategoryList(): Promise<any> {
    // const data = await this.termRepository
    //   .createQueryBuilder('term')
    //   .leftJoinAndSelect(TermTaxonomyEntity, 'tt', 'tt.termId = term.id')
    //   .leftJoinAndSelect(TermMetaEntity, 'tm', 'tm.termId = term.id')
    //   .where('tt.taxonomy = :taxonomy', { taxonomy: 'post_tag' })
    //   // .andWhere('term.name LIKE :title', { title: `%${query.title}%` })
    //   .andWhere('tm.metaKey = :metaKey', { metaKey: 'color_background' })
    //   .select(['term.id as id', 'term.slug as slug', 'term.name as name', 'tm.metaValue as meta'])
    //   .getRawMany();
    const result = await this.optionsRepository
      .createQueryBuilder('o')
      .select("SUBSTRING_INDEX(REPLACE('o.option_name', 'o.options_categories_display_', ''), '_', -1)", 'name')
      .addSelect('o.option_value', 'value')
      .addSelect(
        "CONVERT(SUBSTRING_INDEX(REPLACE('o.option_name', 'o.options_categories_display_', ''), '_', 1), UNSIGNED INTEGER)",
        'idx'
      )
      .where("o.option_name LIKE 'options_categories_display_%'")
      .andWhere(
        new Brackets((qb) => {
          qb.where("$wpdb.option_name LIKE '%_name'")
            .orWhere("$wpdb.option_name LIKE '%_url'")
            .orWhere("$wpdb.option_name LIKE '%_image'");
        })
      )
      .orderBy('idx')
      .getRawMany();
    const thumbnailIds = result.map((v) => Number(v?.idx));
    const paths = await this.commonService.convert2CdnUrl(thumbnailIds);

    const content = result.map((item: any) => {
      const parts = item.url.split('/');
      const slug = parts[parts.length - 2]; // "8k"
      return {
        id: slug,
        title: item.name,
        preview: paths[item.idx],
      };
    });

    return content;
  }
}
