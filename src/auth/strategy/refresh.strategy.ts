import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { AuthService } from './../auth.service';
import { UnauthorizedException } from 'src/exceptions/auth.exception';
import { JwtPayload } from 'jsonwebtoken';
import { Request } from 'express';

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'refresh') {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      passReqToCallback: true,
      secretOrKey: 'rt-secret',
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    const strAuthorization = req.get('Authorization');
    const refreshToken = strAuthorization.split(' ')[1].trim();
    const user = await this.authService.validateUser(Number(payload.sub));
    if (!user) {
      throw new UnauthorizedException();
    }
    return { ...payload, token: refreshToken };
  }
}
