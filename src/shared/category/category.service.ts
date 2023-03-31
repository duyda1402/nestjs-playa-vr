import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OptionsEntity } from 'src/entities/options.entity';
import { Brackets, Repository } from 'typeorm';
import { CommonService } from '../common/common.service';
import { generateKeyCache, parseNumber, validatedKeyCache, CACHE_TTL } from '../../helper';
import { TermEntity } from './../../entities/term.entity';
import { TermTaxonomyEntity } from 'src/entities/term_taxonomy.entity';
import { TermRelationShipsBasicEntity } from './../../entities/term_relationships_basic.entity';
import { PostEntity } from './../../entities/post.entity';

@Injectable()
export class CategoryService {
  private cache: Map<string, { data: any; expiresAt: number }> = new Map<string, { data: any; expiresAt: number }>();
  constructor(
    @InjectRepository(OptionsEntity)
    private readonly optionsRepository: Repository<OptionsEntity>,
    @InjectRepository(TermEntity)
    private readonly termRepository: Repository<TermEntity>,
    private readonly commonService: CommonService
  ) {}

  async getCategoryList(): Promise<any> {
    //Cache here: cache_key = `categories_data`, cache_data = {content}
    const keyCache = generateKeyCache('categories_data', {});
    const cachedActor = this.cache.get(keyCache);
    if (cachedActor && cachedActor.expiresAt > Date.now() && validatedKeyCache(keyCache, {})) {
      return cachedActor.data.content;
    }
    const options = await this.optionsRepository
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
          qb.where("o.name LIKE '%_name'").orWhere("o.name LIKE '%_url'").orWhere("o.name LIKE '%_image'");
        })
      )
      .orderBy('idx')
      .getRawMany();

    const items = [];
    if (Array.isArray(options) && options.length) {
      options.forEach((row) => {
        const currentRow: any = items[row.idx] || {};

        currentRow[row.name] = row.value;

        items[row.idx] = currentRow;
      });
    }
    const thumbnailIds = items.map((v) => parseNumber(v.image));
    const paths = await this.commonService.getImagesUrl(thumbnailIds);
    const categoryImage = items.map((item: any) => {
      const parts = item.url.split('/');
      const slug = parts[parts.length - 2]; // "8k"
      return {
        id: slug,
        title: item.name,
        preview: item.image ? paths[item.image] || null : null,
      };
    });
    const categoryAll = await this.termRepository
      .createQueryBuilder('term')
      .distinct()
      .select(['term.slug as id', 'term.name as title'])
      .innerJoin(TermTaxonomyEntity, 'tt', 'tt.termId = term.id')
      .where('tt.taxonomy = :taxonomy', { taxonomy: 'post_tag' })
      .innerJoin(TermRelationShipsBasicEntity, 'trs', 'trs.termId = term.id')
      .innerJoin(PostEntity, 'post', 'post.id =  trs.objectId')
      .innerJoin(TermRelationShipsBasicEntity, 'tr', 'post.id = tr.objectId')
      .andWhere('tr.termId = :termRelationId', { termRelationId: 251 })
      .andWhere('term.slug != "none"')
      .getRawMany();

    const arrCategoryAll = categoryAll.map((v) => ({
      id: v.id,
      title: v.title,
      preview: null,
    }));
    const B_not_in_A = arrCategoryAll.filter((itemB) => !categoryImage.some((itemA) => itemA.id === itemB.id));
    const content = categoryImage.concat(B_not_in_A);
    this.cache.set(keyCache, { data: { content }, expiresAt: Date.now() + CACHE_TTL });
    return content;
  }
}
