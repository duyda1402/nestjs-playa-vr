import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostEntity } from 'src/entities/post.entity';
import { PostMetaEntity } from 'src/entities/post_meta.entity';
import { TermRelationShipsBasicEntity } from 'src/entities/term_relationships_basic.entity';
import { DataNotFoundException } from 'src/exceptions/data.exception';
import { unserialize } from 'php-serialize';
import { IFPage, IFVideoListView } from 'src/types';
import { IFVideoView } from 'src/types/index';
import { Repository } from 'typeorm';
import { As3cfItemsEntity } from 'src/entities/as3cf_items.entity';
import { TermEntity } from 'src/entities/term.entity';
import { TermTaxonomyEntity } from 'src/entities/term_taxonomy.entity';
import {convertTimeToSeconds, parseNumber, promiseEmpty} from 'src/helper';
import { PopularScoresEntity } from 'src/entities/popular_scores.entity';
import { OpenSearchService } from '../open-search/opensearch.service';
import { CommonService } from './../common/common.service';
import { UserService } from '../user/user.service';
import * as SqlString from "sqlstring";

@Injectable()
export class VideoService {
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
    const order = query.order === 'popularity' ? 'pp.premiumPopularScore' : (query.order === 'release_date' ? 'release_date' : 'post.postName');

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
      queryVideo.andWhere('termStudio.name LIKE :charNameStudio', { charNameStudio: `%${paramStudio}%` });
    }
    //==== Lọc theo actor
    if (paramActor) {
      const subQuery = this.termRepository.createQueryBuilder('t')
          .innerJoin(TermRelationShipsBasicEntity, 'tr', 'tr.termId = t.id')
          .innerJoin(TermTaxonomyEntity, 'tt', 'tt.termId = t.id AND tt.taxonomy = "porn_star_name"')
          .where(`t.name LIKE :actorLike`, {actorLike: `%${paramActor}%`})
          .select(['tr.objectId as pid']).getQueryAndParameters();

        queryVideo.andWhere(`post.id IN(${SqlString.format(subQuery[0], subQuery[1])})`);
    }

    if(Array.isArray(query.includedCategories) && query.includedCategories.length) {
      const subQuery2 = this.termRepository.createQueryBuilder('t')
          .innerJoin(TermRelationShipsBasicEntity, 'tr', 'tr.termId = t.id')
          .innerJoin(TermTaxonomyEntity, 'tt', 'tt.termId = t.id AND tt.taxonomy = "post_tag"')
          .where(`t.slug IN(:...slugs)`, {slugs: query.includedCategories})
          .select(['tr.objectId as pid']).getQueryAndParameters();

      queryVideo.andWhere(`post.id IN(${SqlString.format(subQuery2[0], subQuery2[1])})`);
    }

    if(Array.isArray(query.excludedCategories) && query.excludedCategories.length) {
      const subQuery3 = this.termRepository.createQueryBuilder('t')
          .innerJoin(TermRelationShipsBasicEntity, 'tr', 'tr.termId = t.id')
          .innerJoin(TermTaxonomyEntity, 'tt', 'tt.termId = t.id AND tt.taxonomy = "post_tag"')
          .where(`t.slug IN(:...slugs)`, {slugs: query.excludedCategories})
          .select(['tr.objectId as pid']).getQueryAndParameters();

      queryVideo.andWhere(`post.id NOT IN(${SqlString.format(subQuery3[0], subQuery3[1])})`);
    }
    queryVideo.select([
        'post.id as id',
        'post.postName as postName',
        'termStudio.name as subtitle',
        'post.postTitle as postTitle',
        'IFNULL(pp.ppdate, post.postDate) as `release_date`',
      ]);

    const dataPromis = queryVideo
      .limit(query.perPage)
      .orderBy(order, direction)
      .offset((query.page - 1) * query.perPage)
      .getRawMany();

    const countPromise = await queryVideo.getCount();
    const [data, count] = await Promise.all([dataPromis, countPromise]);

    let content = [];

    if(Array.isArray(data) && data.length) {
      const videoIds = data.map((v) => v.id);

      const metaRows = await this.postMetaRepository.createQueryBuilder('pm')
          .where('pm.metaKey IN(:...metaKeys)', {metaKeys: ['_thumbnail_id', 'video', 'full_size_video_file_paid_sd']})
          .andWhere('pm.postId IN(:...ids)', {ids: videoIds})
          .select(['pm.postId as id', 'pm.metaKey as mk', 'pm.metaValue as mv'])
          .getRawMany();

      const imageIds = [];
      const attachmentIds = [];
      const metaMap = {};

      metaRows.forEach((v) => {
        if(!metaMap[v.id]) metaMap[v.id] = {};

        const attachmentId = parseNumber(v.mv);

        if(v.mk === '_thumbnail_id') {
          metaMap[v.id].image_id = attachmentId;

          if(attachmentId) imageIds.push(attachmentId);

        } else {
          if(attachmentId) attachmentIds.push(attachmentId);

          metaMap[v.id][v.mk === 'video' ? 'trailer_id' : 'full_id'] = attachmentId;
        }
      });

      //Load preview images
      const imagesPromise = imageIds.length ? this.commonService.getImagesUrl(imageIds) : promiseEmpty({});
      //Load attachment meta data;
      const attachementDataPromise = attachmentIds.length ? this.postMetaRepository.createQueryBuilder('pm')
          .where('pm.metaKey = "_wp_attachment_metadata"')
          .andWhere('pm.postId IN(:...ids)', {ids: attachmentIds})
          .select(['pm.postId as id', 'pm.metaValue as value'])
          .getRawMany() : promiseEmpty([]);

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
          preview_image: metaData.image_id ? (imagesMap[metaData.image_id] || null) : null,
          release_date: video.release_date ? Math.round(new Date(video.release_date).getTime() / 1000) : 0,
          details: this.getInfoDetailsVideo({
            infoTrailer: metaData.trailer_id ? (attachmentDataMap[metaData.trailer_id] || null) : null,
            infoFull: metaData.full_id ? (attachmentDataMap[metaData.full_id] || null) : null,
          }),
        };
      });
    }

    return {
      page_index: query.page,
      item_count: query.perPage,
      page_total: Math.ceil(count / query.perPage),
      item_total: count,
      content: content,
    };
  }

  async getVideoDetail(postId: string, token: string): Promise<IFVideoView | null> {
    const userLevel = await this.userService.getUserLevel(token);
    console.log(userLevel);
    const result = await this.postRepository
      .createQueryBuilder('post')
      .leftJoin(TermRelationShipsBasicEntity, 'tr', 'post.id = tr.objectId')
      .leftJoin(PostMetaEntity, 'pm', 'post.id = pm.postId')
      .leftJoin(As3cfItemsEntity, 'ai', 'ai.sourceId = pm.metaValue')
      .leftJoin(PostEntity, 'p', 'p.id = pm.metaValue')
      .andWhere('post.postType = :postType', { postType: 'post' })
      .andWhere('post.postStatus = :postStatus', { postStatus: 'publish' })
      .where('post.id = :postId', { postId: postId })
      .andWhere('tr.termId = :termId', { termId: 251 })
      .andWhere('pm.metaKey = :metaKey', { metaKey: '_thumbnail_id' })
      .innerJoin(TermRelationShipsBasicEntity, 'trs', 'post.id = trs.objectId')
      .leftJoinAndSelect(TermTaxonomyEntity, 'ttStudio', 'trs.termId = ttStudio.termId')
      .leftJoinAndSelect(TermEntity, 'termStudio', 'termStudio.id = ttStudio.termId')
      .andWhere('ttStudio.taxonomy = :taxonomy', { taxonomy: 'studio' })
      //====================== Tìm thời gian phát video trailer
      .leftJoin(PostMetaEntity, 'pm_trailer', 'post.id = pm_trailer.postId AND pm_trailer.metaKey = :trailerKey', {
        trailerKey: 'video',
      })
      .leftJoin(
        PostMetaEntity,
        'pm_attach_trailer',
        'pm_attach_trailer.postId = pm_trailer.metaValue AND pm_attach_trailer.metaKey = :trailerAttachKey',
        {
          trailerAttachKey: '_wp_attachment_metadata',
        }
      )
      //====================== Tìm thời gian phát video full
      .leftJoin(PostMetaEntity, 'pm_full', 'post.id = pm_full.postId AND pm_full.metaKey = :fullKey', {
        fullKey: 'full_size_video_file_paid_sd',
      })
      .leftJoin(
        PostMetaEntity,
        'pm_attach_full',
        'pm_attach_full.postId = pm_full.metaValue AND pm_attach_full.metaKey = :fullAttachKey',
        {
          fullAttachKey: '_wp_attachment_metadata',
        }
      )
      .select([
        'termStudio.name as subtitle',
        'post.id as id',
        'post.postName as postName',
        'post.postTitle as postTitle',
        'post.postContent as postContent',
        'post.postDate as postDate',
        'ai.path as path',
        'p.guid as path_guid',
        'pm_attach_trailer.metaValue as infoTrailer',
        'pm_attach_full.metaValue as infoFull',
      ])
      .getRawOne();
    if (!result) throw new DataNotFoundException('Studio not found');

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
    const viewsPromise = this.opensearchService.getPostViews(Number(postId));

    const [studio, categories, actors, view] = await Promise.all([
      studioPromise,
      categoriesPromise,
      actorsPromise,
      viewsPromise,
    ]);

    return {
      id: result?.id.toString(),
      title: result?.postTitle.toString(),
      subtitle: result?.subtitle,
      description: result?.postContent.toString(),
      preview_image: result?.path ? `https://mcdn.vrporn.com/${result?.path}` : result?.path_guid,
      release_date: result?.postDate,
      studio: studio,
      categories: categories,
      actors: actors,
      views: view,
      details: await this.getVideoDetailsInfoWithLinks(result.id, userLevel, {
        infoTrailer: result?.infoTrailer || null,
        infoFull: result?.infoFull || null,
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
    data: { infoTrailer: string | null; infoFull: string | null }
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
        links: await this.commonService.buildVideoLinks('trailer', videoData, userLevel),
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
        links: await this.commonService.buildVideoLinks('full', videoData, userLevel),
      });
    return details;
  }
}
