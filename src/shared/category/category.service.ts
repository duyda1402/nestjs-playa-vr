import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TermEntity } from 'src/entities/term.entity';
import { TermMetaEntity } from 'src/entities/term_meta.entity';
import { OptionsEntity } from 'src/entities/options.entity';
import { Brackets, Repository } from 'typeorm';
import { CommonService } from '../common/common.service';
import * as uslParse from 'url-parse';
import {parseNumber} from "../../helper";
@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(TermEntity)
    private readonly termRepository: Repository<TermEntity>,
    @InjectRepository(OptionsEntity)
    private readonly optionsRepository: Repository<OptionsEntity>,
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

    //Cache here: cache_key = `categories_data`, cache_data = {content}

    const result = await this.optionsRepository
      .createQueryBuilder('o')
      .select(["SUBSTRING_INDEX(REPLACE(o.name, 'options_categories_display_', ''), '_', -1) as name"])
      .addSelect('o.option_value', 'value')
      .addSelect(
        "CONVERT(SUBSTRING_INDEX(REPLACE(o.name, 'options_categories_display_', ''), '_', 1), UNSIGNED INTEGER)",
        'idx'
      )
      .where("o.name LIKE 'options_categories_display_%'")
      .andWhere(
        new Brackets((qb) => {
          qb.where("o.name LIKE '%_name'")
            .orWhere("o.name LIKE '%_url'")
            .orWhere("o.name LIKE '%_image'");
        })
      )
      .orderBy('idx')
      .getRawMany();

    const items = [];
    if(Array.isArray(result) && result.length) {
      result.forEach((row) => {
        const currentRow: any = items[row.idx] || {};

        currentRow[row.name] = row.value;

        items[row.idx] = currentRow;
      });
    }

    const thumbnailIds = items.map((v) => parseNumber(v.image));
    const paths = await this.commonService.getImagesUrl(thumbnailIds);

    const content = items.map((item: any) => {
      const parts = item.url.split('/');
      const slug = parts[parts.length - 2]; // "8k"
      return {
        id: slug,
        title: item.name,
        preview: item.image ? (paths[item.image] || null) : null,
      };
    });

    return content;
  }
}
