import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    AuthModule,
    SharedModule,
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'reader.staging.db.vrporn.com',
      port: 3306,
      username: 'playaapi',
      password: 'R73eGnbwEh42ah9gFV',
      database: 'vrporn_staging',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      autoLoadEntities: true,
      synchronize: false,
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
