import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  /**
   * @param err 内部错误
   * @param user 验证成功后的用户对象 (如果成功)
   * @param info 验证失败时的具体错误信息 (Error 对象)
   */
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // 1. 如果有系统级错误或用户未找到
    if (err || !user) {
      // 2. 判断 info 的具体类型来定制错误信息
      
      // 情况 A: Token 过期
      if (info instanceof TokenExpiredError) {
        throw new UnauthorizedException({
          statusCode: 401,
          message: '令牌已过期',
          error: 'TokenExpired',
        });
      }

      // 情况 B: Token 无效 (格式错误、被篡改、密钥不匹配)
      if (info instanceof JsonWebTokenError) {
        throw new UnauthorizedException({
          statusCode: 401,
          message: '令牌无效或格式错误',
          error: 'TokenInvalid',
        });
      }

      // 情况 C: 未携带 Token (info 通常是 Error: No auth token)
      if (!info) {
         throw new UnauthorizedException({
          statusCode: 401,
          message: '未提供认证令牌',
          error: 'TokenMissing',
        });
      }

      // 其他未知鉴权错误
      throw err || new UnauthorizedException({
          statusCode: 401,
          message: '身份验证失败',
          error: 'Unauthorized',
      });
    }

    // 验证通过，返回 user 对象，它会被自动挂载到 req.user 上
    return user;
  }
}