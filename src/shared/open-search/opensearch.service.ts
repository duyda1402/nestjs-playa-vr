import { Injectable } from '@nestjs/common';
import { OpensearchClient, InjectOpensearchClient } from 'nestjs-opensearch';

@Injectable()
export class OpenSearchService {
  constructor(
    @InjectOpensearchClient()
    private readonly opensearchService: OpensearchClient
  ) {}

  async countByQuery(pids: number[], condQuery?: any[], env?: string): Promise<number> {
    const query = {
      size: 0,
      query: {
        bool: {
          must: [
            {
              terms: {
                id: pids,
              },
            },
          ],
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
    if (Array.isArray(condQuery) && condQuery.length) {
      condQuery.forEach((cond) => {
        query.query.bool.must.push(cond);
      });
    }
    const prefix = env === 'production' ? 'prod' : 'staging';
    const { body } = await this.opensearchService.search({
      index: `${prefix}-analytics-report`,
      body: query,
    });
    //     if (body?.aggregations?.stats?.value) return body?.aggregations?.stats?.value;
    console.log(body);
    return body?.aggregations?.stats?.value || 0;
  }
}
