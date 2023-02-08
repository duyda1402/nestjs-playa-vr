import { Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module';
import { ConfigModule } from './shared/configuaration/config.module';
import { VersionModule } from './shared/version/version.module';

@Module({
  imports: [AuthModule, ConfigModule, VersionModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
