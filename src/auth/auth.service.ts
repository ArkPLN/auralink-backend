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
  ChangePasswordDto,
  ChangePasswordResponseDto,
} from './auth.dto';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}
  /**
   * 获取用户令牌
   * @param userId 用户ID
   * @param schoolId 学校ID
   * @param userRole 用户角色
   * @param isActive 用户是否激活
   * @returns 包含访问令牌和刷新令牌的对象
   */
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
  /**
   * 注册用户
   * @param registerDto 注册数据传输对象
   * @returns 注册响应数据传输对象
   */
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

    // 使用对象展开构造响应，更简洁
    return {
      ...tokens,
      id: newUser.id,
      schoolId: newUser.schoolId,
      userRole: newUser.userRole,
    };
  }

  /**
   * 用户登录
   * @param loginDto 登录数据传输对象
   * @returns 登录响应数据传输对象
   */
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

    // 使用对象展开构造响应
    return {
      ...tokens,
      id: user.id,
      schoolId: user.schoolId,
      userRole: user.userRole,
    };
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

      // 直接返回 tokens，符合 RefreshResponseDto 结构
      return tokens;
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

  async changePassword(
    userId: number,
    changePasswordDto: ChangePasswordDto,
  ): Promise<ChangePasswordResponseDto> {
    const { oldPassword, newPassword, confirmPassword } = changePasswordDto;

    if (newPassword !== confirmPassword) {
      throw new BadRequestException({
        statusCode: 400,
        message: '新密码与确认密码不一致',
        error: 'BadRequest',
      });
    }

    if (oldPassword === newPassword) {
      throw new BadRequestException({
        statusCode: 400,
        message: '新密码不能与旧密码相同',
        error: 'BadRequest',
      });
    }

    if (newPassword.length < 8) {
      throw new BadRequestException({
        statusCode: 400,
        message: '新密码长度至少为8位',
        error: 'BadRequest',
      });
    }

    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    if (!hasLetter || !hasNumber) {
      throw new BadRequestException({
        statusCode: 400,
        message: '新密码必须同时包含字母和数字',
        error: 'BadRequest',
      });
    }

    const user = await this.userService.findOneById(userId);
    if (!user) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: '用户不存在',
        error: 'Unauthorized',
      });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: '旧密码错误',
        error: 'Unauthorized',
      });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await this.userService.update(userId, { password: hashedNewPassword });

    return {
      message: '密码修改成功',
      success: true,
    };
  }
}
