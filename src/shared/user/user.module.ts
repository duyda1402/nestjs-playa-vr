import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { EntitiesModule } from 'src/entities/entities.module';

@Module({
  imports: [EntitiesModule],
  providers: [UserService],
  controllers: [],
  exports: [UserService],
})
export class UserModule {}
