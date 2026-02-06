import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {
  RegisterDto,
  LoginDto,
  RegisterResponseDto,
  LoginResponseDto,
  RefreshResponseDto,
} from './auth.dto';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async getTokens(
    userId: number,
    schoolId: string,
    userRole: string,
    isActive: boolean,
  ) {
    const payload = {
      sub: userId,
      schoolId: schoolId,
      role: userRole,
      userRole: userRole,
      isActive: isActive,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: 'ACCESS_TOKEN_SECRET',
        expiresIn: '1d',
      }),
      this.jwtService.signAsync(payload, {
        secret: 'REFRESH_TOKEN_SECRET',
        expiresIn: '14d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  async register(registerDto: RegisterDto): Promise<RegisterResponseDto> {
    const userExists = await this.userService.findOneBySchoolId(
      registerDto.schoolId,
    );
    if (userExists) throw new BadRequestException('该学号已被注册');

    if (!/^\d{8}$/.test(registerDto.schoolId)) {
      throw new BadRequestException('学号必须为8位数字');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const newUser = await this.userService.create({
      ...registerDto,
      password: hashedPassword,
    });

    const tokens = await this.getTokens(
      newUser.id,
      newUser.schoolId,
      newUser.userRole,
      newUser.isActive,
    );
    await this.updateRefreshToken(newUser.id, tokens.refreshToken);

    const user = (await this.userService.findOneBySchoolId(
      newUser.schoolId,
    )) as User;

    const registerResponse = new RegisterResponseDto();
    registerResponse.id = user.id;
    registerResponse.schoolId = user.schoolId;
    registerResponse.userRole = user.userRole;
    registerResponse.accessToken = tokens.accessToken;
    registerResponse.refreshToken = tokens.refreshToken;

    return registerResponse;
  }

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.userService.findOneBySchoolId(loginDto.schoolId);
    if (!user) throw new UnauthorizedException('学号或密码错误');

    const isMatch = await bcrypt.compare(loginDto.password, user.password);
    if (!isMatch) throw new UnauthorizedException('学号或密码错误');

    const tokens = await this.getTokens(
      user.id,
      user.schoolId,
      user.userRole,
      user.isActive,
    );
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    const loginResponse = new LoginResponseDto();
    loginResponse.id = user.id;
    loginResponse.schoolId = user.schoolId;
    loginResponse.userRole = user.userRole;
    loginResponse.accessToken = tokens.accessToken;
    loginResponse.refreshToken = tokens.refreshToken;

    return loginResponse;
  }

  async updateRefreshToken(userId: number, refreshToken: string) {
    const hashedToken = await bcrypt.hash(refreshToken, 10);
    await this.userService.update(userId, { hashedRefreshToken: hashedToken });
  }

  async refreshTokens(refreshToken: string): Promise<RefreshResponseDto> {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: 'REFRESH_TOKEN_SECRET',
      });

      const userId = payload.sub;

      const userWithToken = await this.userService['usersRepository'].findOne({
        where: { id: userId },
        select: [
          'id',
          'schoolId',
          'userRole',
          'hashedRefreshToken',
          'isActive',
        ],
      });

      if (!userWithToken || !userWithToken.hashedRefreshToken) {
        throw new ForbiddenException('Access Denied');
      }

      if (!userWithToken.isActive) {
        throw new ForbiddenException('用户已被禁用');
      }

      const isMatch = await bcrypt.compare(
        refreshToken,
        userWithToken.hashedRefreshToken,
      );
      if (!isMatch) throw new ForbiddenException('Invalid Refresh Token');

      const tokens = await this.getTokens(
        userWithToken.id,
        userWithToken.schoolId,
        userWithToken.userRole,
        userWithToken.isActive,
      );
      await this.updateRefreshToken(userWithToken.id, tokens.refreshToken);

      const refreshResponse = new RefreshResponseDto();
      refreshResponse.accessToken = tokens.accessToken;
      refreshResponse.refreshToken = tokens.refreshToken;

      return refreshResponse;
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('无效的刷新令牌');
      }
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('刷新令牌已过期，请重新登录');
      }
      throw error;
    }
  }
}
