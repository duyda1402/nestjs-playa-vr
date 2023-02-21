// import { Injectable } from '@nestjs/common';
// import { Client } from 'elasticsearch';
// import { ConfigService } from '@nestjs/config';

// @Injectable()
// export class ElasticsearchService {
//   private readonly client: Client;

//   constructor(private readonly configService: ConfigService) {
//     this.client = new Client({
//       node: this.configService.get<string>('OPENSEARCH_ENDPOINT'),
//     });
//   }

//   async searchIndex(index: string, query: string) {
//     const result = await this.client.search({
//       index: index,
//       body: {
//         query: {
//           multi_match: {
//             query: query,
//             fields: ['title', 'description'],
//           },
//         },
//       },
//     });
//     return result.hits.hits;
//   }
// }
