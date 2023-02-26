import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { As3cfItemsEntity } from 'src/entities/as3cf_items.entity';
import { PopularScoresEntity } from 'src/entities/popular_scores.entity';
import { PostEntity } from 'src/entities/post.entity';
import { TermEntity } from 'src/entities/term.entity';
import { TermMetaEntity } from 'src/entities/term_meta.entity';
import { TermRelationShipsBasicEntity } from 'src/entities/term_relationships_basic.entity';
import { TermTaxonomyEntity } from 'src/entities/term_taxonomy.entity';
import { DataNotFoundException } from 'src/exceptions/data.exception';
import { IFStudioListView, IFStudioView, IFPage, QueryBody } from 'src/types';
import { Repository } from 'typeorm';
import { OpenSearchService } from './../open-search/opensearch.service';
import { CommonService } from './../common/common.service';
import {parseNumber, promiseEmpty} from "../../helper";

@Injectable()
export class StudiosService {
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

  async getStudioList(query: QueryBody): Promise<IFPage<IFStudioListView[]>> {
    const direction = query.direction === 'desc' ? 'DESC' : 'ASC';
    const order = query.order === 'popularity' ? 'popularity' : 'term.name';

      //Cache here: cache_key = `studio_list_data:${md5(queryObject)}`, cache_data = {content, count}

    const actorQuery = this.termRepository
      .createQueryBuilder('term')
      .innerJoin(TermTaxonomyEntity, 'tt', 'tt.termId = term.id')
      .innerJoin(TermMetaEntity, 'tm', 'tm.termId = term.id AND tm.metaKey = :metaKey', { metaKey: 'logo_single_post' })
      .where('tt.taxonomy = :taxonomy', { taxonomy: 'studio' });

    if(query.title) {
      actorQuery.andWhere('term.name LIKE :title', { title: `%${query.title}%` });
    }

    actorQuery.select(['term.slug as id', 'term.name as name', 'tm.metaValue as image']);

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

    let content = [];
    const imageIds = [], imageStudioMap: any = {};
    if(Array.isArray(data) && data.length) {
        data.forEach((item) => {
          if(item.image) {
              let imageId = 0;
              if(parseNumber(item.image)) {
                  imageId = parseNumber(item.image);
              } else {
                  try {
                      const imageData = JSON.parse(item.image);

                      if(imageData.cropped_image) imageId = parseNumber(imageData.cropped_image);
                  } catch (e: any) {}
              }

              if(imageId) {
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
               preview: imageStudioMap[v.id] ? (imageMap[imageStudioMap[v.id]] || null) : null
           };
        });
    }

    return  {
      page_index: query.page,
      item_count: query.perPage,
      page_total: Math.ceil(count / query.perPage),
      item_total: count,
      content: content,
    };
  }

  async getStudioDetail(slug: string): Promise<IFStudioView | null> {
      //Cache here: cache_key = `studio_detail_data:${slug}`, cache_data = {responseData}

    const studio = await this.termRepository
      .createQueryBuilder('term')
      .innerJoin(TermTaxonomyEntity, 'tt', 'tt.termId = term.id AND tt.taxonomy = :taxonomy', { taxonomy: 'studio' })
      .leftJoinAndSelect(TermMetaEntity, 'tm', 'tm.termId = term.id AND tm.metaKey = :metaKey', { metaKey: 'logo_single_post' })
      .where('term.slug = :slug', { slug })
      .select([
        'term.id as id',
        'term.slug as sid',
        'term.name as name',
        'tm.metaValue as image',
      ])
      .getRawOne();

    if (!studio) throw new DataNotFoundException('Studio not found');

    let imageId = 0;
    if(studio.image) {
        if(parseNumber(studio.image)) {
            imageId = parseNumber(studio.image);
        } else {
            try {
                const imageData = JSON.parse(studio.image);

                if(imageData.cropped_image) imageId = parseNumber(imageData.cropped_image);
            } catch (e: any) {}
        }
    }

    const imagePromise = imageId ? this.commonService.getImagesUrl([imageId]) : promiseEmpty();

    const metaDataPromise = this.termMetaRepository.createQueryBuilder('tm')
      .where('tm.termId = :termId', {termId: studio.id})
      .andWhere('tm.metaKey = "footer_text"')
      .select(['tm.metaValue as value'])
      .getRawOne();

    const viewsPromise = await this.openSearchService.getTermViews(studio.id);

    const [imageMap, metaData, views] = await Promise.all([imagePromise, metaDataPromise, viewsPromise]);

    return {
      id: studio?.slug,
      title: studio?.name,
      preview: imageId ? (imageMap[imageId] || null) : null,
      description: metaData?.value || null,
      views: views,
    };
  }
}
