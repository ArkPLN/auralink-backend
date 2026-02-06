import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  RegisterResponseDto,
  LoginResponseDto,
  RefreshDto,
  RefreshResponseDto,
} from './auth.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';

@ApiTags('认证模块')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: '用户注册' })
  @ApiResponse({
    status: 201,
    description: '用户注册成功',
    type: RegisterResponseDto,
  })
  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<RegisterResponseDto> {
    return this.authService.register(registerDto);
  }

  @ApiOperation({ summary: '用户登录' })
  @ApiResponse({
    status: 200,
    description: '用户登录成功，返回 JWT 令牌',
    type: LoginResponseDto,
  })
  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @ApiOperation({
    summary: '刷新 JWT 令牌',
    description:
      '使用刷新令牌获取新的访问令牌和刷新令牌。刷新令牌需要在请求体中传递。',
  })
  @ApiResponse({
    status: 200,
    description: '刷新成功，返回新的 JWT 令牌',
    type: RefreshResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '刷新令牌无效或已过期',
  })
  @ApiResponse({
    status: 403,
    description: '刷新令牌不匹配或已被撤销',
  })
  @ApiBody({
    type: RefreshDto,
    description: '刷新令牌（从登录或注册接口获取）',
  })
  @Post('refresh')
  async refresh(@Body() refreshDto: RefreshDto): Promise<RefreshResponseDto> {
    const { refreshToken } = refreshDto;
    return this.authService.refreshTokens(refreshToken);
  }
}
