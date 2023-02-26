import { Injectable } from '@nestjs/common';
import { DataNotFoundException } from 'src/exceptions/data.exception';
import { IFActorListView, IFPage, QueryBody } from 'src/types';
import { IFActorView } from './../../types/data.type';
import { TermEntity } from 'src/entities/term.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TermTaxonomyEntity } from 'src/entities/term_taxonomy.entity';
import { TermMetaEntity } from 'src/entities/term_meta.entity';
import { As3cfItemsEntity } from 'src/entities/as3cf_items.entity';
import { PostEntity } from 'src/entities/post.entity';
import { TermRelationShipsBasicEntity } from 'src/entities/term_relationships_basic.entity';
import { PopularScoresEntity } from 'src/entities/popular_scores.entity';
import { OpenSearchService } from './../open-search/opensearch.service';
import { CommonService } from './../common/common.service';
import {parseNumber, promiseEmpty} from "../../helper";

@Injectable()
export class ActorService {
  constructor(
    @InjectRepository(TermEntity)
    private readonly termRepository: Repository<TermEntity>,
    @InjectRepository(TermMetaEntity)
    private readonly termMetaRepository: Repository<TermMetaEntity>,
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
    private readonly openSearchService: OpenSearchService,
    private readonly commonService: CommonService,
  ) {}

  async getActorList(query: QueryBody): Promise<IFPage<IFActorListView[]>> {
    const direction = query.direction === 'desc' ? 'DESC' : 'ASC';
    const order = query.order === 'popularity' ? 'popularity' : 'term.name';

    //Cache here: cache_key = `actor_list_data:${md5(queryObject)}`, cache_data = {count, content}

    const actorQuery = this.termRepository
      .createQueryBuilder('term')
      .innerJoin(TermTaxonomyEntity, 'tt', 'tt.termId = term.id')
      .innerJoin(TermMetaEntity, 'tm', 'tm.termId = term.id AND tm.metaKey = :metaKey', { metaKey: 'profile_image' })
      .where('tt.taxonomy = :taxonomy', { taxonomy: 'porn_star_name' });

    if(query.title) {
      actorQuery.andWhere('term.name LIKE :title', { title: `%${query.title}%` });
    }

    actorQuery.select(['term.slug as slug', 'term.name as name', 'tm.metaValue as image_id']);

    if(query.order === 'popularity') {
      actorQuery.addSelect((subQuery) => {
        return subQuery.select('SUM(pp.premiumPopularScore)', 'result')
            .from(PopularScoresEntity, 'pp')
            .innerJoin(TermRelationShipsBasicEntity, 'tr', 'tr.objectId = pp.postId')
            .where('tr.termId = term.id');
      }, 'popularity');
    }

    const dataPromise = actorQuery.limit(query.perPage)
      .orderBy(order, direction)
      .offset((query.page - 1) * query.perPage)
      .getRawMany();

    const countPromise = actorQuery.getCount();
    const [data, count] = await Promise.all([dataPromise, countPromise]);

    const imageIds = [];
    data.forEach((item) => {
      if(item.image_id && !isNaN(Number(item.image_id))) {
        imageIds.push(Number(item.image_id));
      }
    });

    const imageMap = imageIds.length ? await this.commonService.getImagesUrl(imageIds) : {};

    const content = data.map((item: any) => ({
      id: item.slug,
      title: item.name,
      preview: item.image_id ? (imageMap[item.image_id] || null) : null,
    }));

    const result = {
      page_index: query.page,
      item_count: query.perPage,
      page_total: Math.ceil(count / query.perPage),
      item_total: count,
      content: content,
    };
    return result;
  }

  async getActorDetail(slug: string): Promise<IFActorView | null> {
    //Cache here: cache_key = `actor_detail_data:${slug}`, cache_data = {responseData}

    const actor = await this.termRepository
      .createQueryBuilder('term')
      .innerJoin(TermTaxonomyEntity, 'tt', 'tt.termId = term.id')
      .where('term.slug = :slug', { slug })
      .andWhere('tt.taxonomy = :taxonomy', { taxonomy: 'porn_star_name' })
      .getOne();

    if (!actor) throw new DataNotFoundException('Actor not found');

    //Load term meta
    const metaDataPromise = this.termMetaRepository.createQueryBuilder('tm')
        .where('tm.termId = :termId', {termId: actor.id})
        .andWhere('tm.metaKey IN(:...metaKeys)', {metaKeys: this.metaKeys})
        .select(['tm.metaKey as name', 'tm.metaValue as value'])
        .getRawMany();

    const studiosPromise = this.termRepository
      .createQueryBuilder('term')
      .innerJoin(TermTaxonomyEntity, 'tt', 'term.id = tt.termId')
      .where('tt.taxonomy = :taxonomy', { taxonomy: 'studio' })
      .leftJoinAndSelect(TermRelationShipsBasicEntity, 'tr', 'term.id = tr.termId')
      .andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .from(TermRelationShipsBasicEntity, 'termRela')
          .where('termRela.termId = :termRelaId', { termRelaId: actor.id })
          .select('termRela.objectId')
          .getQuery();
        return `tr.objectId IN (${subQuery})`;
      })
      .select(['term.slug as id', 'term.name as title'])
      .getRawMany();

    const [metaRows, studios] = await Promise.all([
      metaDataPromise,
      studiosPromise,
    ]);

    let imageIds = [], aliasGroup = -1, properties: any[] = [], imageIdMap: any = {};
    metaRows.forEach((row) => {
        if(row.name === 'top_banner_background' || row.name === 'profile_image') {
          const imageId = parseNumber(row.value);
          if(imageId) {
            imageIdMap[row.name] = imageId;
            imageIds.push(imageId);
          }
        } else if(row.name === 'alias_group') {
          aliasGroup = parseNumber(row.value, -1);
        } else {
          properties.push(row);
        }
    });

    const imagesPromise = imageIds.length ? this.commonService.getImagesUrl(imageIds) : promiseEmpty();

    //Get alias rows
    const aliasFields = [];
    if(aliasGroup > 0) {
      for(let i = 0; i < aliasGroup; i++) {
        aliasFields.push(`alias_group_${i}_alias_item`);
      }
    }

    const aliasGroupPromise = !aliasFields.length ? promiseEmpty() : this.termMetaRepository.createQueryBuilder('tm')
        .where('tm.termId = :termId', {termId: actor.id})
        .andWhere('tm.metaKey IN(:...metaKeys)', {metaKeys: aliasFields})
        .select(['tm.metaValue as value'])
        .getRawMany();

    const countViewPromise = this.openSearchService.getTermViews(actor.id);

    const [imageMap, aliasItems, views] = await Promise.all([
      imagesPromise,
      aliasGroupPromise,
      countViewPromise,
    ]);

    return {
      id: actor.slug,
      title: actor.name,
      preview: imageIdMap.profile_image ? (imageMap[imageIdMap.profile_image] || null) : null,
      studios: studios,
      properties: properties,
      aliases: aliasItems.map(v => v.value),
      views: views,
      banner: imageIdMap.profile_image ? (imageMap[imageIdMap.top_banner_background] || null) : null,
    };
  }

  private metaKeys = [
    'birthdate',
    'birthplate',
    'height',
    'weight',
    'breast_size',
    'hair_color',
    'eyecolor',
    // 'webpage',
    // 'twitter',
    // 'facebook',
    'ethnicity',
    'country_of_origin',
    'alias_group',
    'profile_image',
    'top_banner_background',
  ];
}
