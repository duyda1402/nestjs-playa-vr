import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {
  appendCdnDomain,
  cdnReplaceDomain,
  generateKeyCache,
  getDownloadId,
  signCdnUrl,
  validatedKeyCache,
} from '../../helper';
import { unserialize } from 'php-serialize';
import { As3cfItemsEntity } from './../../entities/as3cf_items.entity';
import { PostMetaEntity } from './../../entities/post_meta.entity';
import { PostEntity } from './../../entities/post.entity';
import { IFVideoLink } from './../../types/data.type';
import { TermRelationShipsBasicEntity } from '../../entities/term_relationships_basic.entity';
import { TermEntity } from '../../entities/term.entity';
import { TermTaxonomyEntity } from '../../entities/term_taxonomy.entity';

@Injectable()
export class CommonService {
  private cache: Map<string, { data: any; expiresAt: number }> = new Map<string, { data: any; expiresAt: number }>();
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(As3cfItemsEntity)
    private readonly as3cfItemRepository: Repository<As3cfItemsEntity>,
    @InjectRepository(PostMetaEntity)
    private readonly postMetaRepository: Repository<PostMetaEntity>,

    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,

    @InjectRepository(TermRelationShipsBasicEntity)
    private readonly termRelationRepository: Repository<TermRelationShipsBasicEntity>,

    @InjectRepository(TermEntity)
    private readonly termRepository: Repository<TermEntity>
  ) {}

  async execQuery(query: string, params?: any): Promise<any> {
    return await this.dataSource.query(query, params);
  }

  async getImagesUrl(ids: number[]): Promise<any> {
    const rows = await this.as3cfItemRepository
      .createQueryBuilder('as3cf')
      .select(['as3cf.sourceId as sourceId, as3cf.path as sourcekey'])
      .where('as3cf.sourceId IN (:...sourceId)', { sourceId: ids })
      .getRawMany();
    const itemMap = {};
    //conver ary to obj
    rows.forEach((v: any) => {
      itemMap[v.sourceId] = appendCdnDomain(v.sourcekey);
    });
    const mIds = ids.filter((v) => !itemMap[v]);
    if (mIds.length) {
      const metaRows = await this.postMetaRepository
        .createQueryBuilder('postMeta')
        .select(['postMeta.postId as id', 'postMeta.metaValue as value'])
        .where('postMeta.metaKey = "amazonS3_info"')
        .andWhere('postMeta.postId IN (:...mIds)', { mIds: mIds })
        .getRawMany();

      metaRows.forEach((v) => {
        const mv = unserialize(v.value);
        if (mv['key']) {
          itemMap[v.id] = appendCdnDomain(mv['key']);
        }
      });
    }

    const m2Ids = ids.filter((v) => !itemMap[v]);
    if (m2Ids.length) {
      const postRows = await this.postRepository
        .createQueryBuilder('post')
        .where('post.postType = "attachment"')
        .select(['post.id as id', 'post.guid as value'])
        .andWhere('post.id IN (:...m2Ids)', { m2Ids: m2Ids })
        .getRawMany();

      postRows.forEach((v) => {
        itemMap[v.id] = appendCdnDomain(v?.value);
      });
    }

    return itemMap;
  }

  async loadVideosData(videoId: number): Promise<any> {
    //Cache here: cache_key = `video_data_cache:${videoId}`, cache_data = {videoData}
    const keyCache = generateKeyCache('video_data_cache', { videoId });
    const cachedVideoData = this.cache.get(keyCache);
    if (cachedVideoData && cachedVideoData.expiresAt > Date.now() && validatedKeyCache(keyCache, { videoId })) {
      return cachedVideoData.data.videoData;
    }
    const videoData: any = { id: videoId, four_k_paid_source: '', sd_source: '' };

    const videoFields: string[] = [
      'video',
      'smartphone_sample',
      'oculus_sample',
      'free_4k_streaming',
      'free_embed_video_5k',
      'original_free',
      'full_size_video_file_paid_sd',
      'smartphone_paid',
      'oculus_paid',
      'full_size_video_file_paid',
      'paid_4k_streaming',
      'original_paid',
      'paid_embed_video_5k',
      'full_size_video_file',
      'newts',
      'video_link',
      'vr_file_format',
      'vr_sd_file_format',
      'has_4k_download',
    ];

    //Load data for list fields
    const metaRows = await this.postMetaRepository
      .createQueryBuilder('pm')
      .select(['pm.metaKey as k', 'pm.metaValue as v'])
      .where('pm.postId = :postId', { postId: videoId })
      .andWhere('pm.metaKey IN (:...metaKeys)', { metaKeys: videoFields })
      .getRawMany();

    const fieldsMap: any = {};

    metaRows[0] &&
      metaRows.forEach((row) => {
        fieldsMap[row.k] = row.v;
      });

    videoData.hd_file_format = fieldsMap.vr_file_format || 'STEREO_180_LR';
    videoData.sd_file_format = fieldsMap.vr_sd_file_format || videoData.hd_file_format;

    if (!fieldsMap?.video) {
      if (!fieldsMap.video_link) {
        return null;
      }

      videoData.sd_source = cdnReplaceDomain(fieldsMap.video_link);
      videoData.sd_stream = videoData.sd_source;
    } else {
      const videoId = fieldsMap.video;
      const childVideos = await this.postRepository
        .createQueryBuilder('p')
        .innerJoin(PostMetaEntity, 'pm', 'pm.postId = p.id AND pm.metaKey = :metaKey', { metaKey: 'amazonS3_info' })
        .where('p.postType = :postType', { postType: 'attachment' })
        .andWhere('p.postParent = :parentId', { parentId: videoId })
        .select(['p.id', 'p.postTitle as title', 'pm.metaValue as s3Info'])
        .getRawMany();

      childVideos.forEach((row) => {
        if (row.title.indexOf('480p H.264') !== -1) {
          const s3Info = unserialize(row.s3Info);

          if (s3Info.key) {
            videoData.sd_source = cdnReplaceDomain(s3Info.key);
            videoData.sd_stream = videoData.sd_source;
          }
        }
      });

      if (!videoData.sd_source) {
        videoData.sd_source = await this.getS3MetaInfoKey(videoId);
        videoData.sd_stream = videoData.sd_source;
      }

      //Free HD
      if (fieldsMap.smartphone_sample) {
        videoData.hd_source = await this.getDownloadUrl(fieldsMap.smartphone_sample);
        videoData.hd_stream = videoData.hd_source;
      }

      //Paid SD
      if (fieldsMap.full_size_video_file_paid_sd) {
        videoData.sd_paid_source = await this.getS3MetaInfoKey(fieldsMap.full_size_video_file_paid_sd);
        videoData.sd_paid_stream = videoData.sd_paid_source;
      }

      //Paid HD
      if (fieldsMap.smartphone_paid) {
        videoData.hd_paid_source = await this.getDownloadUrl(fieldsMap.smartphone_paid);
        videoData.hd_paid_stream = videoData.hd_paid_source;
      }

      //Free 4K
      if (fieldsMap.oculus_sample) {
        videoData.four_k_source = await this.getDownloadUrl(fieldsMap.oculus_sample);
        videoData.four_k_stream = videoData.four_k_source;
      }

      //Paid 4K
      if (fieldsMap.oculus_paid) {
        videoData.four_k_paid_source = await this.getDownloadUrl(fieldsMap.oculus_paid);
        videoData.four_k_paid_stream = videoData.four_k_paid_source;
      }

      //Free 5K
      if (fieldsMap.free_embed_video_5k) {
        videoData.five_k_source = await this.getS3MetaInfoKey(fieldsMap.free_embed_video_5k);
        videoData.five_k_stream = videoData.five_k_source;
      }

      //Paid 5K
      if (fieldsMap.paid_embed_video_5k) {
        videoData.five_k_paid_source = await this.getS3MetaInfoKey(fieldsMap.paid_embed_video_5k);
        videoData.five_k_paid_stream = videoData.five_k_paid_source;
      }

      //Free Original
      if (fieldsMap.original_free) {
        videoData.original_source = await this.getDownloadUrl(fieldsMap.original_free);
      }

      //Paid Original
      if (fieldsMap.original_paid) {
        videoData.original_paid_source = await this.getDownloadUrl(fieldsMap.original_paid);
      }

      //Check for newts
      if (fieldsMap.newts) {
        //Free HD link reload
        if (fieldsMap.full_size_video_file && !isNaN(Number(fieldsMap.smartphone_sample))) {
          videoData.hd_stream = await this.getS3MetaInfoKey(fieldsMap.full_size_video_file);
        }

        //Paid HD link reload
        if (fieldsMap.full_size_video_file_paid && !isNaN(Number(fieldsMap.smartphone_paid))) {
          videoData.hd_paid_stream = await this.getS3MetaInfoKey(fieldsMap.full_size_video_file_paid);
        }

        //Free 4k link reload
        if (fieldsMap.has_4k_download && fieldsMap.free_4k_streaming) {
          videoData.four_k_stream = await this.getS3MetaInfoKey(fieldsMap.free_4k_streaming);
        }

        //Paid 4k link reload
        if (fieldsMap.has_4k_download && fieldsMap.paid_4k_streaming) {
          videoData.four_k_paid_stream = await this.getS3MetaInfoKey(fieldsMap.paid_4k_streaming);
        }
      }
    }
    this.cache.set(keyCache, { data: { videoData }, expiresAt: Date.now() + 3 * 60 * 60 * 1000 });
    return videoData;
  }

  async buildVideoLinks(type: string, videoData: any, userLevel: number): Promise<IFVideoLink[]> {
    //User Level: 0: Non-Login, 1: Logged-in, 2: Premium
    const videoLinks: IFVideoLink[] = [];

    if (!videoData) {
      return videoLinks;
    }

    const types: any[] = [
      { quality: 'SD', f: 'sd', stream: 1, download: 1, ord: 5, ul: 0 },
      { quality: 'HD', f: 'hd', stream: 1, download: 1, ord: 15, ul: 0 },
      { quality: '4K', f: 'four_k', stream: 1, download: 1, ord: 45, ul: 1 },
      { quality: '5K', f: 'five_k', stream: 1, download: 1, ord: 55, ul: 2 },
    ];

    const maxQuality = await this.getVideoMaxQuality(videoData.id);

    if (maxQuality && maxQuality > 4) {
      types.push({
        quality: `Max Quality ${maxQuality}K`,
        f: 'original',
        stream: 0,
        download: 1,
        ord: maxQuality * 10 + (maxQuality === 5 ? 6 : 5),
        ul: 2,
      });
    }

    const formatParts = videoData.hd_file_format.split('_');
    const projection = formatParts[1];
    const stereo = formatParts[2];
    const fieldMiddle = type === 'full' ? '_paid' : '';

    types.forEach((v) => {
      if (userLevel === 2) {
        if (v.stream && videoData[`${v.f}${fieldMiddle}_stream`]) {
          videoLinks.push({
            is_stream: true,
            is_download: false,
            url: this.streamLink(videoData[`${v.f}${fieldMiddle}_stream`] || null),
            unavailable_reason: null,
            projection: projection,
            stereo: stereo,
            quality_name: v.quality,
            quality_order: v.ord,
          });
        }

        if (v.download && videoData[`${v.f}${fieldMiddle}_source`]) {
          videoLinks.push({
            is_stream: false,
            is_download: true,
            url: this.downloadLink(videoData[`${v.f}${fieldMiddle}_source`] || null),
            unavailable_reason: null,
            projection: projection,
            stereo: stereo,
            quality_name: v.quality,
            quality_order: v.ord,
          });
        }
      } else {
        let reason = null;
        if (type === 'full') {
          reason = 'premium';
        } else if (v.ul > userLevel) {
          reason = userLevel == 1 ? 'premium' : 'login';
        }

        if (v.stream) {
          videoLinks.push({
            is_stream: true,
            is_download: false,
            url:
              userLevel < v.ul || type === 'full'
                ? null
                : this.streamLink(videoData[`${v.f}${fieldMiddle}_stream`] || null),
            unavailable_reason: reason,
            projection: projection,
            stereo: stereo,
            quality_name: v.quality,
            quality_order: v.ord,
          });
        }

        if (v.download) {
          const downloadItem = {
            is_stream: false,
            is_download: true,
            url:
              userLevel < v.ul || type === 'full'
                ? null
                : this.downloadLink(videoData[`${v.f}${fieldMiddle}_source`] || null),
            unavailable_reason: reason,
            projection: projection,
            stereo: stereo,
            quality_name: v.quality,
            quality_order: v.ord,
          };

          if (userLevel === 0) {
            downloadItem.url = null;
            downloadItem.unavailable_reason = 'login';
          }

          videoLinks.push(downloadItem);
        }
      }
    });

    return videoLinks;
  }

  downloadLink(url: string | null): string {
    if (url) {
      let link = cdnReplaceDomain(url, 'https://mcdnd.vrporn.com');

      if (link) {
        link += `?cd=attachment`;

        return signCdnUrl(link);
      }
    }

    return url;
  }
  streamLink(url: string | null): string {
    if (url) {
      const link = cdnReplaceDomain(url, 'https://mcdne.vrporn.com');

      if (link) {
        return signCdnUrl(link);
      }
    }

    return url;
  }

  async getVideoMaxQuality(videoId: number): Promise<number> {
    const rows: any[] = await this.termRelationRepository
      .createQueryBuilder('tr')
      .innerJoin(TermEntity, 't', 't.id = tr.termId')
      .where('tr.objectId = :videoId', { videoId: videoId })
      .andWhere('LOWER(t.name) IN(:slugs)', { slugs: ['4k', '5k', '6k', '7k', '8k'] })
      .orderBy('t.name', 'DESC')
      .select(['t.name as name'])
      .getRawMany();

    let maxQuality = 0;
    for (let i = 0; i < rows.length; i++) {
      const quality = Number(rows[i].name.toLowerCase().replace('k', ''));

      if (!isNaN(quality) && quality > maxQuality) {
        maxQuality = quality;
      }
    }

    return maxQuality;
  }

  async getDownloadUrl(downloadValue: string): Promise<any> {
    const isDownloadVersion = String(downloadValue).indexOf('download') !== -1;
    const downloadId = getDownloadId(downloadValue);
    let downloadUrl = '';

    if (!isDownloadVersion) {
      const metaValue: any = await this.getPostMeta(downloadId, '_wp_attached_file');

      if (metaValue) {
        downloadUrl = cdnReplaceDomain(metaValue);
      }
    } else {
      const childs: any[] = await this.postRepository
        .createQueryBuilder('p')
        .innerJoin(PostMetaEntity, 'pm', 'pm.postId = p.id AND pm.metaKey = :metaKey', { metaKey: '_files' })
        .where('p.postType = :postType', { postType: 'dlm_download_version' })
        .andWhere('p.postParent = :parentId', { parentId: downloadId })
        .select(['p.id', 'pm.metaValue as _files'])
        .getRawMany();

      childs.forEach((child) => {
        try {
          const _files = child._files ? JSON.parse(child._files) : [];
          if (Array.isArray(_files) && _files.length) {
            downloadUrl = _files[0];
          }
        } catch (e: any) {}
      });
    }

    return downloadUrl;
  }

  async getPostMeta(postId: number | string, metaKey: string): Promise<any> {
    const metaData: any = await this.postMetaRepository
      .createQueryBuilder('pm')
      .where('pm.metaKey = :metaKey', { metaKey: metaKey })
      .andWhere('pm.postId = :postId', { postId: postId })
      .select(['pm.metaValue as value'])
      .getRawOne();

    return metaData?.value;
  }

  async hasPremiumContent(videoId: number): Promise<boolean> {
    const rlRow = await this.termRelationRepository
      .createQueryBuilder('tr')
      .where('tr.objectId = :videoId', { videoId: videoId })
      .andWhere('tr.termId = 5210')
      .select(['tr.objectId as pid'])
      .getRawOne();

    return rlRow && rlRow.pid;
  }

  async getTheTerm(postId: number, taxonomy: string): Promise<TermEntity | null> {
    const terms = await this.getTheTerms(postId, taxonomy);

    if (terms && terms.length) return terms[0];

    return null;
  }

  async getTheTerms(postId: number, taxonomy: string): Promise<TermEntity[] | null> {
    return await this.termRepository
      .createQueryBuilder('t')
      .innerJoin(TermRelationShipsBasicEntity, 'tr', 'tr.termId = t.id')
      .innerJoin(TermTaxonomyEntity, 'tt', 'tt.termId = t.id')
      .where('tr.objectId = :postId', { postId: postId })
      .andWhere('tt.taxonomy = :taxonomy', { taxonomy: taxonomy })
      .getMany();
  }

  async getS3MetaInfoKey(postId: number): Promise<string> {
    let metaValue: any | null = await this.getPostMeta(postId, 'amazonS3_info');

    if (metaValue) {
      metaValue = unserialize(metaValue);

      if (metaValue?.key) {
        return metaValue.key;
      }
    }

    return '';
  }
}
