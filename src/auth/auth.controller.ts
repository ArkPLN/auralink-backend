import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './auth.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('认证模块')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: '用户注册' })
  @ApiResponse({ status: 201, description: '用户注册成功' })
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @ApiOperation({ summary: '用户登录' })
  @ApiResponse({ status: 200, description: '用户登录成功，返回 JWT 令牌' })
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @ApiOperation({ summary: '刷新 JWT 令牌' })
  @ApiResponse({ status: 200, description: '刷新成功，返回新的 JWT 令牌' })
  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  refresh(@Request() req) {
    const userId = req.user['sub']; // 注意：Strategy返回对象里key是sub
    const refreshToken = req.user['refreshToken'];
    return this.authService.refreshTokens(userId, refreshToken);
  }
}