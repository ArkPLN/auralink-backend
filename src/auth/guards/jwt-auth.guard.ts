import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { JwtPayload } from '../strategies/jwt';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = JwtPayload>(
    err: any,
    user: any,
    info: any,
    context: any,
    status?: any,
  ): TUser {
    if (err || !user) {
      if (info instanceof TokenExpiredError) {
        throw new UnauthorizedException({
          statusCode: 401,
          message: '令牌已过期',
          error: 'TokenExpired',
        });
      }

      if (info instanceof JsonWebTokenError) {
        throw new UnauthorizedException({
          statusCode: 401,
          message: '令牌无效或格式错误',
          error: 'TokenInvalid',
        });
      }

      if (!info) {
        throw new UnauthorizedException({
          statusCode: 401,
          message: '未提供认证令牌',
          error: 'TokenMissing',
        });
      }

      throw (
        err ||
        new UnauthorizedException({
          statusCode: 401,
          message: '身份验证失败',
          error: 'Unauthorized',
        })
      );
    }

    return user;
  }
}
