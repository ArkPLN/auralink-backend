import { ApiProperty, PickType, IntersectionType } from '@nestjs/swagger';
import { User } from 'src/user/entities/user.entity';

// ==================== 基础 DTO ====================

/**
 * 认证基础字段（学号、密码）
 * 用于登录和注册的共同字段
 */
export class AuthCredentialsDto extends PickType(User, [
  'schoolId',
  'password',
] as const) {}

// ==================== 请求 DTO ====================

/**
 * 用户注册 DTO
 * 基于认证基础字段，添加可选的个人信息字段
 */
export class RegisterDto extends PickType(User, [
  'schoolId',
  'password',
  'name',
  'phone',
  'department',
] as const) {}

/**
 * 用户登录 DTO
 * 只需要学号和密码
 */
export class LoginDto extends AuthCredentialsDto {}

/**
 * 刷新令牌 DTO
 */
export class RefreshDto {
  @ApiProperty({
    description: '刷新令牌',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;
}

/**
 * 修改密码 DTO
 */
export class ChangePasswordDto {
  @ApiProperty({
    description: '旧密码',
    example: 'oldPassword123',
  })
  oldPassword: string;

  @ApiProperty({
    description: '新密码，长度至少8位，必须包含字母和数字',
    example: 'newPassword456',
    minLength: 8,
  })
  newPassword: string;

  @ApiProperty({
    description: '确认新密码，必须与新密码一致',
    example: 'newPassword456',
  })
  confirmPassword: string;
}

// ==================== 响应 DTO ====================

/**
 * 令牌信息 DTO
 */
export class TokenResponseDto {
  @ApiProperty({ description: '访问令牌', example: 'access_token_here' })
  accessToken: string;

  @ApiProperty({ description: '刷新令牌', example: 'refresh_token_here' })
  refreshToken: string;
}

/**
 * 用户基础信息 DTO（用于认证响应）
 */
export class AuthUserInfoDto extends PickType(User, [
  'id',
  'schoolId',
  'userRole',
] as const) {}

/**
 * 注册响应 DTO
 * 组合令牌信息和用户信息
 */
export class RegisterResponseDto extends IntersectionType(
  TokenResponseDto,
  AuthUserInfoDto,
) {}

/**
 * 登录响应 DTO
 * 与注册响应相同，组合令牌信息和用户信息
 */
export class LoginResponseDto extends IntersectionType(
  TokenResponseDto,
  AuthUserInfoDto,
) {}

/**
 * 刷新令牌响应 DTO
 * 只返回新的令牌
 */
export class RefreshResponseDto extends TokenResponseDto {}

/**
 * 修改密码响应 DTO
 */
export class ChangePasswordResponseDto {
  @ApiProperty({
    description: '密码修改结果消息',
    example: '密码修改成功',
  })
  message: string;

  @ApiProperty({
    description: '操作是否成功',
    example: true,
  })
  success: boolean;
}
