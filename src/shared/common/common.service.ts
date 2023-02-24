import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { appendCdnDomain, getTableWithPrefix } from '../../helper';
import { unserialize } from 'php-serialize';
import { As3cfItemsEntity } from './../../entities/as3cf_items.entity';
import { PostMetaEntity } from './../../entities/post_meta.entity';

@Injectable()
export class CommonService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(As3cfItemsEntity)
    private readonly as3cfItemRepository: Repository<As3cfItemsEntity>,
    @InjectRepository(PostMetaEntity)
    private readonly postMetaRepository: Repository<PostMetaEntity>
  ) {}

  async execQuery(query: string, params?: any): Promise<any> {
    return await this.dataSource.query(query, params);
  }

  async convert2CdnUrl(ids: number[]): Promise<any> {
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
        .andWhere('postMeta.postId IN (:mIds)', { mIds: mIds })
        .getRawMany();

      metaRows.forEach((v) => {
        const mv = unserialize(v.value);
        if (mv['key']) {
          itemMap[v.id] = appendCdnDomain(mv['key']);
        }
      });
    }

    return itemMap;
  }

  async loadVideosData(ids: number[], userLevel: 0 | 1 | 2): Promise<any> {
    //User Level: 0: Non-Login, 1: Logged-in, 2: Premium
    const videoDataMap = {};
    const videoFields: string[] = [
      'video',
      'full_size_video_file_paid_sd',
      'smartphone_sample',
      'smartphone_paid',
      'oculus_sample',
      'oculus_paid',
      'vive_sample',
      'vive_paid',
      'gear_vr_sample',
      'gear_vr_paid',
      'daydream_vr_sample',
      'daydream_vr_paid',
      'psvr_sample',
      'psvr_paid',
      'short_video',
      'full_size_video_file',
      'free_4k_streaming',
      'full_size_video_file_paid',
      'paid_4k_streaming',
      'original_free',
      'original_paid',
      'free_embed_video_2d_sd',
      'free_embed_video_2d_hd',
      'free_embed_video_2d_4k',
      'free_embed_video_2d_5k',
      'free_embed_video_Original',
      'paid_embed_video_2d_sd',
      'paid_embed_video_2d_hd',
      'paid_embed_video_2d_4k',
      'paid_embed_video_2d_5k',
      'paid_embed_video_original',
      'free_embed_video_5k',
      'paid_embed_video_5k',
      'free_5k_download',
      'paid_5k_download',
    ];

    return videoDataMap;
  }
}
