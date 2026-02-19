import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  RegisterResponseDto,
  LoginResponseDto,
  RefreshDto,
  RefreshResponseDto,
  ChangePasswordDto,
  ChangePasswordResponseDto,
} from './auth.dto';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('认证模块')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: '用户注册',
    description:
      '使用学号和密码注册新用户账号。学号必须为8位数字，密码将被加密存储。',
  })
  @ApiResponse({
    status: 201,
    description: '用户注册成功，返回JWT令牌和用户基础信息',
    type: RegisterResponseDto,
  })
  @ApiBadRequestResponse({
    description: '请求参数错误',
    schema: {
      example: {
        statusCode: 400,
        message: '该学号已被注册',
        error: 'BadRequest',
      },
    },
  })
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<RegisterResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({
    summary: '用户登录',
    description: '使用学号和密码登录系统，成功后返回JWT访问令牌和刷新令牌。',
  })
  @ApiResponse({
    status: 200,
    description: '登录成功，返回JWT令牌和用户基础信息',
    type: LoginResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: '学号或密码错误',
    schema: {
      example: {
        statusCode: 401,
        message: '学号或密码错误',
        error: 'Unauthorized',
      },
    },
  })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @ApiOperation({
    summary: '刷新JWT令牌',
    description:
      '使用刷新令牌获取新的访问令牌和刷新令牌。刷新令牌需要在请求体中传递，访问令牌有效期为7天，刷新令牌有效期为21天。',
  })
  @ApiResponse({
    status: 200,
    description: '刷新成功，返回新的JWT令牌',
    type: RefreshResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: '刷新令牌无效或已过期',
    schema: {
      example: {
        statusCode: 401,
        message: '刷新令牌已过期，请重新登录',
        error: 'Unauthorized',
      },
    },
  })
  @ApiForbiddenResponse({
    description: '刷新令牌不匹配或已被撤销',
    schema: {
      example: {
        statusCode: 403,
        message: 'Access Denied',
        error: 'Forbidden',
      },
    },
  })
  @ApiBody({
    type: RefreshDto,
    description: '刷新令牌（从登录或注册接口获取）',
  })
  async refresh(@Body() refreshDto: RefreshDto): Promise<RefreshResponseDto> {
    const { refreshToken } = refreshDto;
    return this.authService.refreshTokens(refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('password')
  @ApiOperation({
    summary: '修改用户密码',
    description:
      '修改当前登录用户的密码。需要提供旧密码进行验证，新密码必须满足复杂度要求（至少8位，包含字母和数字）。',
  })
  @ApiResponse({
    status: 200,
    description: '密码修改成功',
    type: ChangePasswordResponseDto,
  })
  @ApiBadRequestResponse({
    description: '请求参数验证失败',
    schema: {
      examples: {
        passwordMismatch: {
          summary: '密码不一致',
          value: {
            statusCode: 400,
            message: '新密码与确认密码不一致',
            error: 'BadRequest',
          },
        },
        samePassword: {
          summary: '新旧密码相同',
          value: {
            statusCode: 400,
            message: '新密码不能与旧密码相同',
            error: 'BadRequest',
          },
        },
        weakPassword: {
          summary: '密码复杂度不足',
          value: {
            statusCode: 400,
            message: '新密码必须同时包含字母和数字',
            error: 'BadRequest',
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: '旧密码错误或用户不存在',
    schema: {
      example: {
        statusCode: 401,
        message: '旧密码错误',
        error: 'Unauthorized',
      },
    },
  })
  @ApiBody({
    type: ChangePasswordDto,
    description: '密码修改信息（旧密码、新密码、确认新密码）',
  })
  async changePassword(
    @Req() req: Request,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<ChangePasswordResponseDto> {
    const user = req['user'] as { sub: number };
    const userId = user.sub;
    return this.authService.changePassword(userId, changePasswordDto);
  }
}
