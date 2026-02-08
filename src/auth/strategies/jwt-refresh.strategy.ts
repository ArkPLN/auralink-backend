import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from './jwt.d';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'REFRESH_TOKEN_SECRET',
    });
  }

  validate(payload: JwtPayload) {
    return {
      sub: payload.sub,
      schoolId: payload.schoolId,
      role: payload.role,
      userRole: payload.role,
      isActive: true,
    };
  }
}
