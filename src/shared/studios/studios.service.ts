import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PopularScoresEntity } from 'src/entities/popular_scores.entity';
import { TermEntity } from 'src/entities/term.entity';
import { TermMetaEntity } from 'src/entities/term_meta.entity';
import { TermRelationShipsBasicEntity } from 'src/entities/term_relationships_basic.entity';
import { TermTaxonomyEntity } from 'src/entities/term_taxonomy.entity';
import { DataNotFoundException } from 'src/exceptions/data.exception';
import { IFStudioListView, IFStudioView, IFPage, QueryBody } from 'src/types';
import { Repository } from 'typeorm';
import { OpenSearchService } from './../open-search/opensearch.service';
import { CommonService } from './../common/common.service';
import { generateKeyCache, parseNumber, promiseEmpty, validatedKeyCache } from '../../helper';
import { PostEntity } from 'src/entities/post.entity';

@Injectable()
export class StudiosService {
  private cache: Map<string, { data: any; expiresAt: number }> = new Map<string, { data: any; expiresAt: number }>();
  constructor(
    @InjectRepository(TermEntity)
    private readonly termRepository: Repository<TermEntity>,
    @InjectRepository(TermMetaEntity)
    private readonly termMetaRepository: Repository<TermMetaEntity>,
    private readonly openSearchService: OpenSearchService,
    private readonly commonService: CommonService
  ) {}

  async getStudioList(query: QueryBody): Promise<IFPage<IFStudioListView[]>> {
    const direction = query.direction === 'desc' ? 'DESC' : 'ASC';
    const order = query.order === 'popularity' ? 'popularity' : 'term.name';

    //Cache here: cache_key = `studio_list_data:${md5(queryObject)}`, cache_data = {content, count}
    const keyCache = generateKeyCache('studio_list_data', query);
    const cachedStudios = this.cache.get(keyCache);
    if (cachedStudios && cachedStudios.expiresAt > Date.now() && validatedKeyCache(keyCache, query)) {
      return {
        page_index: query.page,
        page_size: query.perPage,
        page_total: cachedStudios.data.count > 0 ? Math.ceil(cachedStudios.data.count / query.perPage) : 1,
        item_total: cachedStudios.data.count,
        content: cachedStudios.data.content,
      };
    }
    const studioQuery = this.termRepository
      .createQueryBuilder('term')
      .innerJoin(TermTaxonomyEntity, 'tt', 'tt.termId = term.id')
      .innerJoin(TermMetaEntity, 'tm', 'tm.termId = term.id AND tm.metaKey = :metaKey', { metaKey: 'logo_single_post' })
      .where('tt.taxonomy = :taxonomy', { taxonomy: 'studio' });

    if (query.title) {
      studioQuery.andWhere('term.name LIKE :title', { title: `%${query.title}%` });
    }

    studioQuery.select(['term.slug as id', 'term.name as name', 'tm.metaValue as image']);
    studioQuery.addSelect((subQuery) => {
      return subQuery
        .select('COUNT(postForStudio.id)', 'totalvideos')
        .from(PostEntity, 'postForStudio')
        .where('postForStudio.postType = :postType', { postType: 'post' })
        .andWhere('postForStudio.postStatus = :postStatus', { postStatus: 'publish' })
        .leftJoin(TermRelationShipsBasicEntity, 'trStudioPost', 'trStudioPost.objectId = postForStudio.id')
        .andWhere('trStudioPost.termId = term.id')
        .leftJoin(TermRelationShipsBasicEntity, 'termRelationPost', 'postForStudio.id = termRelationPost.objectId')
        .andWhere('termRelationPost.termId = :termPostId', { termPostId: 251 })
        .andWhere((qb) => {
          const subQuery = qb
            .subQuery()
            .select('termPostExist.objectId')
            .from(TermRelationShipsBasicEntity, 'termPostExist')
            .where(`termPostExist.termId IN (:...termIds)`, { termIds: [4244, 5685] })
            .getQuery();
          return `postForStudio.id NOT IN (${subQuery})`;
        });
    }, 'totalvideos');

    if (query.order === 'popularity') {
      studioQuery.addSelect((subQuery) => {
        return subQuery
          .select('SUM(pp.premiumPopularScore)', 'result')
          .from(PopularScoresEntity, 'pp')
          .innerJoin(TermRelationShipsBasicEntity, 'tr', 'tr.objectId = pp.postId')
          .where('tr.termId = term.id');
      }, 'popularity');
    }
    // .groupBy('term.id')

    const dataPromise = studioQuery
      .having('totalvideos > 0')
      .limit(query.perPage)
      .orderBy(order, direction)
      .offset(query.page * query.perPage)
      .getRawMany();

    const countPromise = studioQuery.having('totalvideos > 0').getCount();
    const [data, count] = await Promise.all([dataPromise, countPromise]);
    console.log(data);
    let content = [];
    const imageIds = [],
      imageStudioMap: any = {};
    if (Array.isArray(data) && data.length) {
      data.forEach((item) => {
        if (item.image) {
          let imageId = 0;
          if (parseNumber(item.image)) {
            imageId = parseNumber(item.image);
          } else {
            try {
              const imageData = JSON.parse(item.image);

              if (imageData.cropped_image) imageId = parseNumber(imageData.cropped_image);
            } catch (e: any) {}
          }

          if (imageId) {
            imageIds.push(imageId);
            imageStudioMap[item.id] = imageId;
          }
        }
      });

      const imageMap = imageIds.length ? await this.commonService.getImagesUrl(imageIds) : {};

      content = data.map((v) => {
        return {
          id: v.id,
          title: v.name,
          preview: imageStudioMap[v.id] ? imageMap[imageStudioMap[v.id]] || null : null,
        };
      });
    }
    this.cache.set(keyCache, { data: { content, count }, expiresAt: Date.now() + 3 * 60 * 60 * 1000 });
    return {
      page_index: query.page,
      page_size: query.perPage,
      page_total: count > 0 ? Math.ceil(count / query.perPage) : 1,
      item_total: count,
      content: content,
    };
  }

  async getStudioDetail(slug: string): Promise<IFStudioView | null> {
    //Cache here: cache_key = `studio_detail_data:${slug}`, cache_data = {responseData}
    const keyCache = generateKeyCache('studio_detail_data', { slug });
    const cachedStudio = this.cache.get(keyCache);
    if (cachedStudio && cachedStudio.expiresAt > Date.now() && validatedKeyCache(keyCache, { slug })) {
      return cachedStudio.data.responseData;
    }
    const studio = await this.termRepository
      .createQueryBuilder('term')
      .innerJoin(TermTaxonomyEntity, 'tt', 'tt.termId = term.id AND tt.taxonomy = :taxonomy', { taxonomy: 'studio' })
      .leftJoinAndSelect(TermMetaEntity, 'tm', 'tm.termId = term.id AND tm.metaKey = :metaKey', {
        metaKey: 'logo_single_post',
      })
      .where('term.slug = :slug', { slug })
      .select(['term.id as id', 'term.slug as sid', 'term.name as name', 'tm.metaValue as image'])
      .getRawOne();

    if (!studio) throw new DataNotFoundException('Studio not found');

    let imageId = 0;
    if (studio.image) {
      if (parseNumber(studio.image)) {
        imageId = parseNumber(studio.image);
      } else {
        try {
          const imageData = JSON.parse(studio.image);

          if (imageData.cropped_image) imageId = parseNumber(imageData.cropped_image);
        } catch (e: any) {}
      }
    }

    const imagePromise = imageId ? this.commonService.getImagesUrl([imageId]) : promiseEmpty();

    const metaDataPromise = this.termMetaRepository
      .createQueryBuilder('tm')
      .where('tm.termId = :termId', { termId: studio.id })
      .andWhere('tm.metaKey = "footer_text"')
      .select(['tm.metaValue as value'])
      .getRawOne();

    const viewsPromise = await this.openSearchService.getTermViews(studio.id);

    const [imageMap, metaData, views] = await Promise.all([imagePromise, metaDataPromise, viewsPromise]);
    const responseData = {
      id: studio?.slug,
      title: studio?.name,
      preview: imageId ? imageMap[imageId] || null : null,
      description: metaData?.value || null,
      views: views,
    };
    this.cache.set(keyCache, { data: { responseData }, expiresAt: Date.now() + 3 * 60 * 60 * 1000 });
    return responseData;
  }
}
