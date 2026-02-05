import { Injectable, BadRequestException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto, LoginDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  // 1. 生成双 Token (Payload 中加入 role)
  async getTokens(userId: number, schoolId: string, role: string) {
    const payload = { 
      sub: userId, 
      schoolId: schoolId, 
      role: role // 把角色放入 Token，前端解析后可以直接判断权限
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: 'ACCESS_TOKEN_SECRET', // 记得放入 .env
        expiresIn: '1d',
      }),
      this.jwtService.signAsync(payload, {
        secret: 'REFRESH_TOKEN_SECRET', // 记得放入 .env
        expiresIn: '14d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  // 2. 注册逻辑
  async register(registerDto: RegisterDto) {
    // 检查学号是否已存在
    const userExists = await this.userService.findOneBySchoolId(registerDto.schoolId);
    if (userExists) throw new BadRequestException('该学号已被注册');

    // 检查学号是否为8位数字
    if (!/^\d{8}$/.test(registerDto.schoolId)) {
      throw new BadRequestException('学号必须为8位数字');
    }

    // 密码加密
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    
    // 保存用户
    const newUser = await this.userService.create({
      ...registerDto,
      password: hashedPassword,
    });

    // 注册后直接颁发 Token (实现自动登录)
    const tokens = await this.getTokens(newUser.id, newUser.schoolId, newUser.userRole);
    await this.updateRefreshToken(newUser.id, tokens.refreshToken);
    
    return tokens;
  }
  
  // 3. 登录逻辑
  async login(loginDto: LoginDto) {
    const user = await this.userService.findOneBySchoolId(loginDto.schoolId);
    if (!user) throw new UnauthorizedException('学号或密码错误');

    const isMatch = await bcrypt.compare(loginDto.password, user.password);
    if (!isMatch) throw new UnauthorizedException('学号或密码错误');

    const tokens = await this.getTokens(user.id, user.schoolId, user.userRole);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    
    return tokens;
  }

  // 4. 更新 RefreshToken 哈希
  async updateRefreshToken(userId: number, refreshToken: string) {
    const hashedToken = await bcrypt.hash(refreshToken, 10);
    await this.userService.update(userId, { hashedRefreshToken: hashedToken });
  }

  // 5. 刷新 Token 逻辑
  async refreshTokens(userId: number, refreshToken: string) {
    const user = await this.userService.findOneById(userId);
    // 这里要注意：因为 user.entity.ts 里我们设置了 hashedRefreshToken select: false (可选优化)，
    // 如果上面 findOne 没查出来，可能需要显式 addSelect。
    // 如果没设置 select: false，则不需要改动。
    
    // 为了保险起见，显式查一次带 token 的数据：
    const userWithToken = await this.userService['usersRepository'].findOne({
        where: { id: userId },
        select: ['id', 'schoolId', 'userRole', 'hashedRefreshToken'] 
    });

    if (!userWithToken || !userWithToken.hashedRefreshToken) 
        throw new ForbiddenException('Access Denied');

    const isMatch = await bcrypt.compare(refreshToken, userWithToken.hashedRefreshToken);
    if (!isMatch) throw new ForbiddenException('Invalid Refresh Token');

    const tokens = await this.getTokens(userWithToken.id, userWithToken.schoolId, userWithToken.userRole);
    await this.updateRefreshToken(userWithToken.id, tokens.refreshToken);
    
    return tokens;
  }
}