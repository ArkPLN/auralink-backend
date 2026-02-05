// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    UserModule,
    JwtModule.register({
      secret: 'SECRET_KEY', // 实际开发请放在 .env 环境变量中
      signOptions: { expiresIn: '1d' }, // 令牌有效期 1 天
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}