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
}
