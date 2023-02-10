import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('access') implements CanActivate {
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
