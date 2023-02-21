import { Module } from '@nestjs/common';
import { EntitiesModule } from 'src/entities/entities.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OpensearchModule } from 'nestjs-opensearch';
import { OpenSearchService } from './opensearch.service';

@Module({
  imports: [
    EntitiesModule,
    OpensearchModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        node: configService.get<string>('OPENSEARCH_ENDPOINT'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [],
  providers: [OpenSearchService],
  exports: [OpenSearchService],
})
export class MyOpensearchModule {}
