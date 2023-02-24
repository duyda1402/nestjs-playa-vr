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
import { convertTimeToSeconds } from 'src/helper';
import { PopularScoresEntity } from 'src/entities/popular_scores.entity';
import { OpenSearchService } from '../open-search/opensearch.service';
import { CommonService } from './../common/common.service';
import { UserService } from '../user/user.service';

@Injectable()
export class VideoService {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
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
      query.order === 'popularity' ? 'popularity' : query.order === 'release_date' ? 'post.postDate' : 'post.postName';
    console.log(query.page, query.perPage);
    const queryVideo = this.postRepository
      .createQueryBuilder('post')
      .innerJoin(TermRelationShipsBasicEntity, 'tr', 'post.id = tr.objectId')
      //=================  lọc điều kiện video
      .where('post.postType = "post" AND post.postStatus = "publish"')
      .andWhere('tr.termId = :termRelationId', { termRelationId: 251 });
    if (paramTitle) {
      queryVideo.andWhere('post.postTitle LIKE :videoName', { videoName: `%${paramTitle}%` });
    }
    //======== Lấy studio gán subtitle
    queryVideo
      .innerJoin(TermRelationShipsBasicEntity, 'trStudio', 'post.id = trStudio.objectId')
      .leftJoin(TermEntity, 'termStudio', 'termStudio.id = trStudio.termId')
      .leftJoin(TermTaxonomyEntity, 'taxoStudio', 'taxoStudio.termId = termStudio.id')
      .andWhere('taxoStudio.taxonomy = "studio"');
    //======== Lọc theo studio
    if (paramStudio) {
      queryVideo.andWhere('termStudio.name LIKE :charNameStudio', { charNameStudio: `%${paramStudio}%` });
    }
    //==== Lọc theo actor
    if (paramActor) {
      queryVideo
        .innerJoin(TermRelationShipsBasicEntity, 'trActor', 'post.id = trActor.objectId')
        .leftJoin(TermEntity, 'termActor', 'termActor.id = trActor.termId')
        .leftJoin(TermTaxonomyEntity, 'taxoActoer', 'taxoActoer.termId = termActor.id')
        .andWhere('taxoActoer.taxonomy = "porn_star_name"')
        .andWhere('termActor.name LIKE :charNameActor', { charNameActor: `%${paramActor}%` });
    }
    //=============== Lấy ảnh
    queryVideo.leftJoinAndSelect(PostMetaEntity, 'pm', 'post.id = pm.postId AND pm.metaKey = :metaThumbKey', {
      metaThumbKey: '_thumbnail_id',
    });
    //====================== Tìm thời gian phát video trailer
    queryVideo
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
        'pm.metaValue as thumbnail_id',
        'termStudio.name as subtitle',
        'post.id as id',
        'post.postName as postName',
        'post.postTitle as postTitle',
        'post.postDate as postDate',
        'pm_attach_trailer.metaValue as infoTrailer',
        'pm_attach_full.metaValue as infoFull',
      ]);

    const dataPromis = queryVideo
      .addSelect((subQuery) => {
        const query = subQuery
          .select('SUM(pp.premiumPopularScore)', 'result')
          .from(PopularScoresEntity, 'pp')
          .where('pp.postId = post.id');
        return query;
      }, 'popularity')
      .limit(query.perPage)
      .orderBy(order, direction)
      .offset((query.page - 1) * query.perPage)
      .getRawMany();
    const countPromise = await queryVideo.getCount();
    const [data, count] = await Promise.all([dataPromis, countPromise]);
    const thumbnailIds = data.map((v) => Number(v.thumbnail_id));
    const paths = await this.commonService.convert2CdnUrl(thumbnailIds);
    const content = data.map((video: any) => {
      return {
        id: video?.id,
        title: video?.postTitle,
        subtitle: video?.subtitle,
        preview_image: paths[video?.thumbnail_id],
        release_date: new Date(video?.postDate).getTime(),
        details: this.getInfoDetailsVideo({
          infoTrailer: video?.infoTrailer || null,
          infoFull: video?.infoFull || null,
        }),
      };
    });
    const result = {
      page_index: query.page,
      item_count: query.perPage,
      page_total: Math.ceil(count / query.perPage),
      item_total: count,
      content: content,
    };
    return result;
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

    const [studio, categories, actors, views] = await Promise.all([
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
      views: views,
      details: this.getVideoDetailsInfoWithLinks(result.id, {
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

  getVideoDetailsInfoWithLinks(videoId: number, data: { infoTrailer: string | null; infoFull: string | null }) {
    const details = [];
    const trailer = data.infoTrailer ? unserialize(data.infoTrailer) : null;
    const timeTrailer = trailer
      ? trailer?.length
        ? Number(trailer?.length)
        : trailer?.length_formatted
        ? convertTimeToSeconds(trailer?.length_formatted)
        : null
      : null;

    const userLevel = 0; //Dựa vào token để xác định
    const videoData = this.commonService.loadVideosData(videoId);

    if (timeTrailer)
      details.push({
        type: 'trailer',
        duration_seconds: timeTrailer,
        links: this.commonService.buildVideoLinks('trailer', videoData, userLevel),
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
        links: this.commonService.buildVideoLinks('full', videoData, userLevel),
      });
    return details;
  }
}
