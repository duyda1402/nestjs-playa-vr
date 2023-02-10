import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RefreshStrategy } from './strategy/refresh.strategy';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from 'src/shared/user/user.module';
import { AccessStrategy } from './strategy/access.strategy';
import { PassportModule } from '@nestjs/passport';
@Module({
  imports: [PassportModule, JwtModule.register({}), UserModule],
  controllers: [AuthController],
  providers: [AuthService, RefreshStrategy, AccessStrategy],
  exports: [AuthService, RefreshStrategy, AccessStrategy],
})
export class AuthModule {}
