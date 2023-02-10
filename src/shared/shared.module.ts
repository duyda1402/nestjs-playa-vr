import { TermModule } from './term/term.module';
import { TermMetaModule } from './term-meta/term-meta.module';
import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { ConfigModule } from './configuaration/config.module';
import { VersionModule } from './version/version.module';

@Module({
  imports: [ConfigModule, VersionModule, UserModule, TermModule, TermMetaModule],
  controllers: [],
  providers: [],
})
export class SharedModule {}
