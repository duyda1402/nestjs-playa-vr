import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {InjectDataSource} from "@nestjs/typeorm";
import {appendCdnDomain, getTableWithPrefix} from "../../helper";
import {unserialize} from "php-serialize";

@Injectable()
export class CommonService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource
  ) {}

  async execQuery(query: string, params?: any): Promise<any> {
    return await this.dataSource.query(query, params);
  }

  async convert2CdnUrl(ids: number[]):Promise<any> {
    //Load from s3 table by source;
    const s3Table = getTableWithPrefix('as3cf_items');
    const rows = await this.execQuery(`SELECT source_id as id, path FROM ${s3Table} WHERE source_id IN(?)`, [ids]);

    let itemMap = {};
    rows.forEach((v) => {itemMap[v.id] = appendCdnDomain(v.path)});


    const mIds = ids.filter(v => !itemMap[v]);

    if(mIds.length) {//Load from amazonS3_info meta key
      const postMetaTable = getTableWithPrefix('postmeta');
      const metaRows = await this.execQuery(`SELECT post_id as id, meta_value as value FROM ${postMetaTable} WHERE meta_key = 'amazonS3_info' AND post_id IN(?)`, [mIds]);
      metaRows.forEach((v) => {
          const mv = unserialize(v.value);
          if(mv['key']) {
            itemMap[v.id] = appendCdnDomain(mv['key']);
          }
      });
    }

    return itemMap;
  }

  async loadVideosData(ids: number[], userLevel: 0 | 1 | 2): Promise<any> {//User Level: 0: Non-Login, 1: Logged-in, 2: Premium
    let videoDataMap = {};
    let videoFields: string[] = [
      'video', 'full_size_video_file_paid_sd', 'smartphone_sample', 'smartphone_paid', 'oculus_sample', 'oculus_paid',
      'vive_sample', 'vive_paid', 'gear_vr_sample', 'gear_vr_paid', 'daydream_vr_sample', 'daydream_vr_paid', 'psvr_sample', 'psvr_paid', 'short_video',
      'full_size_video_file', 'free_4k_streaming', 'full_size_video_file_paid', 'paid_4k_streaming', 'original_free', 'original_paid',
      'free_embed_video_2d_sd', 'free_embed_video_2d_hd', 'free_embed_video_2d_4k', 'free_embed_video_2d_5k', 'free_embed_video_Original',
      'paid_embed_video_2d_sd', 'paid_embed_video_2d_hd', 'paid_embed_video_2d_4k', 'paid_embed_video_2d_5k', 'paid_embed_video_original',
      'free_embed_video_5k', 'paid_embed_video_5k', 'free_5k_download', 'paid_5k_download'
    ];


    return videoDataMap;
  }
}
