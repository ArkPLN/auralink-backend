// src/auth/auth.service.ts
import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    private jwtService: JwtService,
  ) {}

  // 注册逻辑
  async register(email: string, pass: string) {
    const userExists = await this.usersService.findOneBySchoolId(email);
    if (userExists) throw new BadRequestException('该学校账号已被注册');

    // 盐强度 10，生成不可逆的哈希密码
    const hashedPassword = await bcrypt.hash(pass, 10);
    const newUser = await this.usersService.create({
      schoolId: email,
      password: hashedPassword,
    });

    return { message: '注册成功', id: newUser.id };
  }

  // 登录逻辑
  async login(schoolId: string, pass: string) {
    const user = await this.usersService.findOneBySchoolId(schoolId);
    if (!user) throw new UnauthorizedException('学校账号或密码错误');

    // 比对明文密码和数据库里的哈希值
    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) throw new UnauthorizedException('学校账号或密码错误');

    // 签发 JWT 令牌
    const payload = { sub: user.id, schoolId: user.schoolId };  
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}