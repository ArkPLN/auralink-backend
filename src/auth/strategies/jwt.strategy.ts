import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from './jwt.d';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'ACCESS_TOKEN_SECRET',
    });
  }

  validate(payload: JwtPayload) {
    return {
      sub: payload.sub,
      schoolId: payload.schoolId,
      role: payload.role,
      userRole: payload.userRole,
      isActive: payload.isActive,
    };
  }
}
