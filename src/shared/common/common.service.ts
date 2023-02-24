import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {InjectDataSource} from "@nestjs/typeorm";
import {getTableWithPrefix} from "../../helper";
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
    rows.forEach((v) => {itemMap[v.id] = v.path});


    const mIds = ids.filter(v => !itemMap[v]);

    if(mIds.length) {//Load from amazonS3_info meta key
      const postMetaTable = getTableWithPrefix('postmeta');
      const metaRows = await this.execQuery(`SELECT post_id as id, meta_value as value FROM ${postMetaTable} WHERE meta_key = 'amazonS3_info' AND post_id IN(?)`, [mIds]);
      metaRows.forEach((v) => {
          const mv = unserialize(v.value);
          if(mv['key']) {
            itemMap[v.id] = mv['key'];
          }
      });
    }

    return itemMap;
  }
}
