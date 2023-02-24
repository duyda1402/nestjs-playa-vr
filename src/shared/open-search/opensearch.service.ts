import { Injectable } from '@nestjs/common';
import { OpensearchClient, InjectOpensearchClient } from 'nestjs-opensearch';
import {TermRelationShipsBasicEntity} from "../../entities/term_relationships_basic.entity";
import {Repository} from "typeorm";
import {PostEntity} from "../../entities/post.entity";
import {count} from "rxjs";
import {isProduction} from "../../helper";

@Injectable()
export class MyOpenSearchService {
  constructor(
    @InjectOpensearchClient()
    private readonly opensearchService: OpensearchClient,

    private readonly postRepository: Repository<PostEntity>,
  ) {}


  async countByQuery(condQuery: any[]): Promise<number> {
    const query = {
      size: 0,
      query: {
        bool: {
          must: [],
        },
      },
      aggs: {
        stats: {
          sum: {
            field: 'count',
          },
        },
      },
    };

    condQuery.forEach((cond) => {
      query.query.bool.must.push(cond);
    });

    const prefix = isProduction() ? 'prod' : 'staging';
    const { body } = await this.opensearchService.search({
      index: `${prefix}-analytics-report`,
      body: query,
    });

    console.log(body);
    return body?.aggregations?.stats?.value || 0;
  }

  async getPostViews(pid: number): Promise<number> {
      return 0;
  }
  async getTermViews(tid: number): Promise<number> {
    const rows = await this.postRepository
        .createQueryBuilder('post')
        .innerJoin(TermRelationShipsBasicEntity, 'tr', 'tr.objectId = post.ID')
        .innerJoin(TermRelationShipsBasicEntity, 'tr2', 'tr2.objectId = post.ID')
        .andWhere('post.postStatus = :postStatus', { postStatus: 'publish' })
        .andWhere('tr2.termId = :termId', { termId: 251 })
        .andWhere('tr.termId = :termId', { termId: tid })
        .select(['post.ID as id'])
        .getRawMany();

    let pids = [];
    if(Array.isArray(rows)) {
      rows.forEach((v) => {
        pids.push(v.id);
      });
    }

    return await this.countByQuery([{
          terms: {
            id: pids
          }
        }]);
  }
}
