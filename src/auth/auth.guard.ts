import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { UnauthorizedException } from 'src/exceptions/auth.exception';

@Injectable()
export class JwtAuthGuard extends AuthGuard('access') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  handleRequest(err: any, user: any, info: any, context: any) {
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}

@Injectable()
export class RefreshAuthGuard extends AuthGuard('refresh') implements CanActivate {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext): any {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!roles) {
      return super.canActivate(context);
    }
    const request = context.switchToHttp().getRequest();
    request.user = { roles };
    return super.canActivate(context);
  }
}

@Injectable()
export class JwtUserGuard extends AuthGuard('jwt') {
  constructor(private jwtService: JwtService) {
    super();
  }

  async canActivate(context: any): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      return true;
    }
    try {
      const payload = await this.jwtService.verifyAsync(token, { secret: 'at-secret' });
      if (!payload) {
        // request.user = null;
        throw new UnauthorizedException();
      }

      request.user = payload;
    } catch {
      throw new UnauthorizedException();
    }

    return true;
  }

  private extractToken(request: any) {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    return authHeader.substring(7);
  }
}
