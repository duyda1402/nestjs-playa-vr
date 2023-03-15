import { Injectable, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostEntity } from 'src/entities/post.entity';
import { PostMetaEntity } from 'src/entities/post_meta.entity';
import { TermRelationShipsBasicEntity } from 'src/entities/term_relationships_basic.entity';
import { DataNotFoundException } from 'src/exceptions/data.exception';
import { unserialize } from 'php-serialize';
import { IFPage, IFVideoListView } from 'src/types';
import { IFVideoView } from 'src/types/index';
import { Repository } from 'typeorm';
import { TermEntity } from 'src/entities/term.entity';
import { TermTaxonomyEntity } from 'src/entities/term_taxonomy.entity';
import { convertTimeToSeconds, generateKeyCache, parseNumber, promiseEmpty, validatedKeyCache } from 'src/helper';
import { PopularScoresEntity } from 'src/entities/popular_scores.entity';
import { OpenSearchService } from '../open-search/opensearch.service';
import { CommonService } from './../common/common.service';
import { UserService } from '../user/user.service';
import * as SqlString from 'sqlstring';

@Injectable()
export class VideoService {
  private cache: Map<string, { data: any; expiresAt: number }> = new Map<string, { data: any; expiresAt: number }>();
  constructor(
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
    @InjectRepository(PostMetaEntity)
    private readonly postMetaRepository: Repository<PostMetaEntity>,
    @InjectRepository(TermEntity)
    private readonly termRepository: Repository<TermEntity>,
    private readonly opensearchService: OpenSearchService,
    private readonly commonService: CommonService,
    private readonly userService: UserService
  ) {}

  async getVideoList(query: {
    page?: number;
    perPage?: number;
    order?: string;
    direction?: string;
    title?: string;
    studio?: string;
    actor?: string;
    includedCategories?: string[];
    excludedCategories?: string[];
  }): Promise<IFPage<IFVideoListView[] | any>> {
    const paramActor = query.actor ? query.actor : null;
    const paramStudio = query.studio ? query.studio : null;
    const paramTitle = query.title ? query.title : null;
    const direction = query.direction === 'desc' ? 'DESC' : 'ASC';
    const order =
      query.order === 'popularity'
        ? 'pp.premiumPopularScore'
        : query.order === 'release_date'
        ? 'release_date'
        : 'nametranform';
    // Cache here: cache_key = `video_list_data:${md5(queryObject)}`, cache_data = {content}
    const keyCache = generateKeyCache('video_list_data', query);
    const cachedVideos = this.cache.get(keyCache);
    if (cachedVideos && cachedVideos.expiresAt > Date.now() && validatedKeyCache(keyCache, query)) {
      return {
        page_index: query.page,
        page_size: query.perPage,
        page_total: cachedVideos.data.count > 0 ? Math.ceil(cachedVideos.data.count / query.perPage) : 1,
        item_total: cachedVideos.data.count,
        content: cachedVideos.data.content,
      };
    }

    const queryVideo = this.postRepository
      .createQueryBuilder('post')
      .innerJoin(TermRelationShipsBasicEntity, 'tr', 'post.id = tr.objectId')
      .leftJoin(PopularScoresEntity, 'pp', 'pp.postId = post.id')
      //=================  lọc điều kiện video
      .where('post.postType = "post" AND post.postStatus = "publish"')
      .andWhere('tr.termId = :termRelationId', { termRelationId: 251 });

    if (paramTitle) {
      queryVideo.andWhere('post.postTitle LIKE :videoName', { videoName: `%${paramTitle}%` });
    }
    //======== Lấy studio gán subtitle
    queryVideo
      .innerJoin(TermRelationShipsBasicEntity, 'trStudio', 'post.id = trStudio.objectId')
      .innerJoin(TermEntity, 'termStudio', 'termStudio.id = trStudio.termId')
      .innerJoin(TermTaxonomyEntity, 'taxoStudio', 'taxoStudio.termId = termStudio.id')
      .andWhere('taxoStudio.taxonomy = "studio"');

    //======== Lọc theo studio
    if (paramStudio) {
      queryVideo.andWhere('termStudio.slug = :studioId', { studioId: paramStudio });
    }
    //==== Lọc theo actor
    if (paramActor) {
      queryVideo.andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('trActor.objectId')
          .from(TermEntity, 'termActor')
          .innerJoin(TermRelationShipsBasicEntity, 'trActor', 'trActor.termId = termActor.id')
          .leftJoin(TermTaxonomyEntity, 'ttActor', 'ttActor.termId = termActor.id')
          .where('ttActor.taxonomy = :actorTaxonomy', {
            actorTaxonomy: 'porn_star_name',
          })
          .andWhere('termActor.slug = :actorId', { actorId: paramActor })
          .getQuery();
        return `post.id IN (${subQuery})`;
      });
    }

    if (Array.isArray(query.includedCategories) && query.includedCategories.length) {
      query.includedCategories.forEach((term, index) => {
        term.trim() &&
          queryVideo
            .innerJoin(TermRelationShipsBasicEntity, `trin${index}`, `trin${index}.objectId = post.id`)
            .leftJoin(
              TermTaxonomyEntity,
              `ttin${index}`,
              `ttin${index}.termId = trin${index}.termId AND ttin${index}.taxonomy = 'post_tag' `
            )
            .leftJoin(TermEntity, `termin${index}`, `termin${index}.id = ttin${index}.termId`)
            .andWhere(`termin${index}.slug = :slugin${index}`, {
              [`slugin${index}`]: term,
            });
      });
    }

    if (Array.isArray(query.excludedCategories) && query.excludedCategories.length) {
      const subQuery3 = this.termRepository
        .createQueryBuilder('t')
        .innerJoin(TermRelationShipsBasicEntity, 'tr', 'tr.termId = t.id')
        .innerJoin(TermTaxonomyEntity, 'tt', 'tt.termId = t.id AND tt.taxonomy = "post_tag"')
        .where(`t.slug IN(:...slugs)`, { slugs: query.excludedCategories })
        .select(['tr.objectId as pid'])
        .getQueryAndParameters();
      queryVideo.andWhere(`post.id NOT IN(${SqlString.format(subQuery3[0], subQuery3[1])})`);
    }

    queryVideo
      .select([
        'post.id as id',
        'post.postName as postName',
        'termStudio.name as subtitle',
        'post.postTitle as postTitle',
        'IFNULL(pp.ppdate, post.postDate) as `release_date`',
      ])
      .addSelect(this.queryReplace, 'nametranform');

    const dataPromis = queryVideo
      .limit(query.perPage)
      .orderBy(order, direction)
      .offset(query.page * query.perPage)
      .getRawMany();

    const countPromise = await queryVideo.getCount();
    const [data, count] = await Promise.all([dataPromis, countPromise]);
    console.log(data);
    let content = [];

    if (Array.isArray(data) && data.length) {
      const videoIds = data.map((v) => v.id);

      const metaRows = await this.postMetaRepository
        .createQueryBuilder('pm')
        .where('pm.metaKey IN(:...metaKeys)', { metaKeys: ['_thumbnail_id', 'video', 'full_size_video_file_paid_sd'] })
        .andWhere('pm.postId IN(:...ids)', { ids: videoIds })
        .select(['pm.postId as id', 'pm.metaKey as mk', 'pm.metaValue as mv'])
        .getRawMany();

      const imageIds = [];
      const attachmentIds = [];
      const metaMap = {};

      metaRows.forEach((v) => {
        if (!metaMap[v.id]) metaMap[v.id] = {};

        const attachmentId = parseNumber(v.mv);

        if (v.mk === '_thumbnail_id') {
          metaMap[v.id].image_id = attachmentId;

          if (attachmentId) imageIds.push(attachmentId);
        } else {
          if (attachmentId) attachmentIds.push(attachmentId);

          metaMap[v.id][v.mk === 'video' ? 'trailer_id' : 'full_id'] = attachmentId;
        }
      });

      //Load preview images
      const imagesPromise = imageIds.length ? this.commonService.getImagesUrl(imageIds) : promiseEmpty({});
      //Load attachment meta data;
      const attachementDataPromise = attachmentIds.length
        ? this.postMetaRepository
            .createQueryBuilder('pm')
            .where('pm.metaKey = "_wp_attachment_metadata"')
            .andWhere('pm.postId IN(:...ids)', { ids: attachmentIds })
            .select(['pm.postId as id', 'pm.metaValue as value'])
            .getRawMany()
        : promiseEmpty([]);

      const [imagesMap, attachementDataRows] = await Promise.all([imagesPromise, attachementDataPromise]);

      const attachmentDataMap = {};
      attachementDataRows.forEach((v) => {
        attachmentDataMap[v.id] = v.value;
      });

      content = data.map((video: any) => {
        const metaData = metaMap[video.id] || {};

        return {
          id: video?.id,
          title: video?.postTitle,
          subtitle: video?.subtitle,
          preview_image: metaData.image_id ? imagesMap[metaData.image_id] || null : null,
          release_date: video.release_date ? Math.round(new Date(video.release_date).getTime() / 1000) : 0,
          details: this.getInfoDetailsVideo({
            infoTrailer: metaData.trailer_id ? attachmentDataMap[metaData.trailer_id] || null : null,
            infoFull: metaData.full_id ? attachmentDataMap[metaData.full_id] || null : null,
          }),
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

  async getVideoDetail(postId: string, userId?: any): Promise<IFVideoView | null> {
    const userLevel = await this.userService.getUserLevel(userId);
    //Cache here: cache_key = `video_detail_data:${postId}`, cache_data = {result, studio, categories, actors, view, imagesMap, attachmentDataMap}
    const keyCache = generateKeyCache('video_detail_data', { postId });
    const cachedVideo = this.cache.get(keyCache);
    if (cachedVideo && cachedVideo.expiresAt > Date.now() && validatedKeyCache(keyCache, { postId })) {
      return {
        id: cachedVideo.data.result?.id.toString(),
        title: cachedVideo.data.result?.postTitle.toString(),
        subtitle: cachedVideo.data.studio?.title,
        description: cachedVideo.data.result?.postContent.toString(),
        preview_image: cachedVideo.data.metaMap?.image_id
          ? cachedVideo.data.imagesMap[cachedVideo.data.metaMap.image_id] || null
          : null,
        release_date: cachedVideo.data.result.release_date
          ? Math.round(new Date(cachedVideo.data.result.release_date).getTime() / 1000)
          : 0,
        views: cachedVideo.data.view,
        studio: cachedVideo.data.studio,
        categories: cachedVideo.data.categories,
        actors: cachedVideo.data.actors,
        details: await this.getVideoDetailsInfoWithLinks(cachedVideo.data.result.id, userLevel, {
          infoTrailer: cachedVideo.data.metaMap.trailer_id
            ? cachedVideo.data.attachmentDataMap[cachedVideo.data.metaMap.trailer_id] || null
            : null,
          infoFull: cachedVideo.data.metaMap.full_id
            ? cachedVideo.data.attachmentDataMap[cachedVideo.data.metaMap.full_id] || null
            : null,
          atlasFull: cachedVideo.data.metaMap.full_atlas
            ? cachedVideo.data.imagesMap[cachedVideo.data.metaMap.full_atlas] || null
            : null,
          atlasTrailer: cachedVideo.data.metaMap.trailer_atlas
            ? cachedVideo.data.imagesMap[cachedVideo.data.metaMap.trailer_atlas] || null
            : null,
        }),
      };
    }
    const result = await this.postRepository
      .createQueryBuilder('post')
      .innerJoin(TermRelationShipsBasicEntity, 'tr', 'post.id = tr.objectId')
      .leftJoin(PopularScoresEntity, 'pp', 'pp.postId = post.id')
      .where('post.id = :postId', { postId: postId })
      .andWhere('post.postType = :postType', { postType: 'post' })
      .andWhere('post.postStatus = :postStatus', { postStatus: 'publish' })
      .andWhere('tr.termId = :termId', { termId: 251 })
      .select([
        'post.id as id',
        'post.postName as postName',
        'post.postTitle as postTitle',
        'post.postContent as postContent',
        'IFNULL(pp.ppdate, post.postDate) as `release_date`',
      ])
      .getRawOne();

    if (!result) throw new DataNotFoundException('Video not found');

    const videoId = Number(result.id);

    const studioPromise = this.termRepository
      .createQueryBuilder('term')
      .innerJoin(TermTaxonomyEntity, 'tt', 'tt.termId = term.id')
      .leftJoinAndSelect(TermRelationShipsBasicEntity, 'tr', 'tr.termId = term.id')
      .where('tt.taxonomy = :taxonomy', { taxonomy: 'studio' })
      .andWhere('tr.objectId = :objectId', { objectId: result.id })
      .select(['term.slug as id', 'term.name as title'])
      .getRawOne();

    const categoriesPromise = this.termRepository
      .createQueryBuilder('term')
      .innerJoin(TermTaxonomyEntity, 'tt', 'tt.termId = term.id')
      .leftJoinAndSelect(TermRelationShipsBasicEntity, 'tr', 'tr.termId = term.id')
      .where('tt.taxonomy = :taxonomy', { taxonomy: 'post_tag' })
      .andWhere('tr.objectId = :objectId', { objectId: result.id })
      .select(['term.slug as id', 'term.name as title'])
      .getRawMany();

    const actorsPromise = await this.termRepository
      .createQueryBuilder('term')
      .innerJoin(TermTaxonomyEntity, 'tt', 'tt.termId = term.id')
      .leftJoinAndSelect(TermRelationShipsBasicEntity, 'tr', 'tr.termId = term.id')
      .where('tt.taxonomy = :taxonomy', { taxonomy: 'porn_star_name' })
      .andWhere('tr.objectId = :objectId', { objectId: result.id })
      .select(['term.slug as id', 'term.name as title'])
      .getRawMany();

    const viewsPromise = this.opensearchService.getPostViews(Number(result?.id));

    const metaRows = await this.postMetaRepository
      .createQueryBuilder('pm')
      .where('pm.metaKey IN(:...metaKeys)', {
        metaKeys: [
          '_thumbnail_id',
          'video',
          'full_size_video_file_paid_sd',
          'video_thumbnails_detail_tube',
          'video_paid_thumbnails_detail_tube',
        ],
      })
      .andWhere('pm.postId = :id', { id: videoId })
      .select(['pm.postId as id', 'pm.metaKey as mk', 'pm.metaValue as mv'])
      .getRawMany();

    const metaMap: any = {};
    metaRows.forEach((v) => {
      const attachmentId = parseNumber(v.mv);

      if (v.mk === '_thumbnail_id') {
        metaMap.image_id = attachmentId;
      } else if (v.mk === 'video_thumbnails_detail_tube') {
        metaMap.trailer_atlas = attachmentId;
      } else if (v.mk === 'video_paid_thumbnails_detail_tube') {
        metaMap.full_atlas = attachmentId;
      } else {
        metaMap[v.mk === 'video' ? 'trailer_id' : 'full_id'] = attachmentId;
      }
    });

    //Load preview images
    const imagesPromise = metaMap.image_id
      ? this.commonService.getImagesUrl([metaMap.image_id, metaMap.trailer_atlas, metaMap.full_atlas])
      : promiseEmpty({});
    //Load attachment meta data;
    const attachementDataPromise = this.postMetaRepository
      .createQueryBuilder('pm')
      .where('pm.metaKey = "_wp_attachment_metadata"')
      .andWhere('pm.postId IN(:...ids)', { ids: [metaMap.trailer_id, metaMap.full_id] })
      .select(['pm.postId as id', 'pm.metaValue as value'])
      .getRawMany();

    const [studio, categories, actors, views, imagesMap, attachementDataRows] = await Promise.all([
      studioPromise,
      categoriesPromise,
      actorsPromise,
      viewsPromise,
      imagesPromise,
      attachementDataPromise,
    ]);

    const attachmentDataMap = {};
    attachementDataRows.forEach((v) => {
      attachmentDataMap[v.id] = v.value;
    });
    this.cache.set(keyCache, {
      data: { result, studio, categories, views, actors, imagesMap, metaMap, attachmentDataMap },
      expiresAt: Date.now() + 3 * 60 * 60 * 1000,
    });
    return {
      id: result?.id.toString(),
      title: result?.postTitle.toString(),
      subtitle: studio?.title,
      description: result?.postContent.toString(),
      preview_image: metaMap.image_id ? imagesMap[metaMap.image_id] || null : null,
      views: views,
      release_date: result.release_date ? Math.round(new Date(result.release_date).getTime() / 1000) : 0,
      studio: studio,
      categories: categories,
      actors: actors,
      details: await this.getVideoDetailsInfoWithLinks(result.id, userLevel, {
        infoTrailer: metaMap.trailer_id ? attachmentDataMap[metaMap.trailer_id] || null : null,
        infoFull: metaMap.full_id ? attachmentDataMap[metaMap.full_id] || null : null,
        atlasFull: metaMap.full_atlas ? imagesMap[metaMap.full_atlas] || null : null,
        atlasTrailer: metaMap.trailer_atlas ? imagesMap[metaMap.trailer_atlas] || null : null,
      }),
    };
  }

  getInfoDetailsVideo(data: { infoTrailer: string | null; infoFull: string | null }) {
    const details = [];
    const trailer = data.infoTrailer ? unserialize(data.infoTrailer) : null;
    const timeTrailer = trailer
      ? trailer?.length
        ? Number(trailer?.length)
        : trailer?.length_formatted
        ? convertTimeToSeconds(trailer?.length_formatted)
        : null
      : null;
    if (timeTrailer)
      details.push({
        type: 'trailer',
        duration_seconds: timeTrailer,
      });
    const full = data.infoFull ? unserialize(data.infoFull) : null;
    const timeFull = full
      ? full?.length
        ? Number(full?.length)
        : full?.length_formatted
        ? convertTimeToSeconds(full?.length_formatted)
        : null
      : null;
    if (timeFull)
      details.push({
        type: 'full',
        duration_seconds: timeFull,
      });
    return details;
  }

  async getVideoDetailsInfoWithLinks(
    videoId: number,
    userLevel: number,
    data: { infoTrailer: string | null; infoFull: string | null; atlasTrailer: string | null; atlasFull: string | null }
  ) {
    const details = [];
    const trailer = data.infoTrailer ? unserialize(data.infoTrailer) : null;
    const timeTrailer = trailer
      ? trailer?.length
        ? Number(trailer?.length)
        : trailer?.length_formatted
        ? convertTimeToSeconds(trailer?.length_formatted)
        : null
      : null;
    const videoData = await this.commonService.loadVideosData(videoId);

    if (timeTrailer)
      details.push({
        type: 'trailer',
        duration_seconds: timeTrailer,
        // timeline_atlas: { version: 1, url: data.atlasTrailer },
        links: await this.commonService.buildVideoLinks('trailer', videoData, userLevel),
      });
    if (userLevel !== 0) {
      const full = data.infoFull ? unserialize(data.infoFull) : null;
      const timeFull = full
        ? full?.length
          ? Number(full?.length)
          : full?.length_formatted
          ? convertTimeToSeconds(full?.length_formatted)
          : null
        : null;
      if (timeFull)
        details.push({
          type: 'full',
          duration_seconds: timeFull,
          //Here Fix Time Atlas
          // timeline_atlas: { version: 1, url: data.atlasFull },
          links: await this.commonService.buildVideoLinks('full', videoData, userLevel),
        });
    }
    return details;
  }

  private query01 = `REPLACE(post.postTitle, '\\"', '')`;
  private query02 = `REPLACE(${this.query01}, "\\'", '')`;
  private query03 = `REPLACE(${this.query02}, "#", '')`;
  private query04 = `REPLACE(${this.query03}, "1", '')`;
  private query05 = `REPLACE(${this.query04}, "2", '')`;
  private query06 = `REPLACE(${this.query05}, "3", '')`;
  private query07 = `REPLACE(${this.query06}, "4", '')`;
  private query08 = `REPLACE(${this.query07}, "5", '')`;
  private query09 = `REPLACE(${this.query08}, "6", '')`;
  private query10 = `REPLACE(${this.query09}, "7", '')`;
  private query11 = `REPLACE(${this.query10}, "8'", '')`;
  private query12 = `REPLACE(${this.query11}, "9'", '')`;
  private query13 = `REPLACE(${this.query12}, "0'", '')`;
  private query14 = `REPLACE(${this.query13}, "\\(", '')`;
  private query15 = `REPLACE(${this.query14}, "@", '')`;
  private query16 = `REPLACE(${this.query15}, "!", '')`;
  private query17 = `REPLACE(${this.query16}, "\\)", '')`;
  private query18 = `REPLACE(${this.query17}, "[", '')`;
  private query19 = `REPLACE(${this.query18}, "]", '')`;
  private query20 = `REPLACE(${this.query19}, "{", '')`;
  private query21 = `REPLACE(${this.query20}, "}", '')`;
  private query22 = `REPLACE(${this.query21}, ":", '')`;
  private queryReplace = this.query22;
}
