import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { EntitiesModule } from 'src/entities/entities.module';
import { JwtModule } from '@nestjs/jwt';
@Module({
  imports: [EntitiesModule, JwtModule.register({})],
  providers: [UserService],
  controllers: [],
  exports: [UserService],
})
export class UserModule {}
