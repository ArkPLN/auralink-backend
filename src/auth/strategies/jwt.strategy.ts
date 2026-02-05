import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'ACCESS_TOKEN_SECRET', 
    });
  }

  // Payload 是我们在 AuthService.getTokens 里签进去的数据
  async validate(payload: any) {
    // 返回值会自动挂载到 request.user
    return { 
      userId: payload.sub, 
      schoolId: payload.schoolId, 
      role: payload.role 
    };
  }
}