import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { ConfigModule } from './config/config.module';
import { VersionModule } from './version/version.module';
import { StudiosListViewModule } from './studios/studios.module';

@Module({
  imports: [ConfigModule, VersionModule, UserModule, StudiosListViewModule],
  controllers: [],
  providers: [],
})
export class SharedModule {}
