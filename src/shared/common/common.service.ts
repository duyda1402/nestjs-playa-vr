import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {InjectDataSource} from "@nestjs/typeorm";
import {arrayPluck, getTableWithPrefix} from "../../helper";

@Injectable()
export class CommonService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource
  ) {}

  async exec(query: string, params?: any): Promise<any> {
    return await this.dataSource.query(query, params);
  }

  async convert2CdnUrl(items: {id: number, link: string}[]):Promise<any> {
    const ids = arrayPluck(items, 'id');

    if(!ids.length) return items;

    //Load from s3 table by source;
    const s3Table = getTableWithPrefix('as3cf_items');
    const rows = await this.exec("SELECT `source_id`, `path` FROM :tbl WHERE `source_id` IN(:ids)", {tbl: s3Table, ids: ids});
    console.log(rows);
  }
}
