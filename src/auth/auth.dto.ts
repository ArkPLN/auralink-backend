import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/user/entities/user.entity';

export class RegisterDto {
  @ApiProperty({ description: '学校学号', example: '2023001001' })
  schoolId: string;

  @ApiProperty({ description: '登录密码', example: 'password123' })
  password: string;

  @ApiProperty({ description: '真实姓名', example: '张三', required: false })
  name?: string;

  @ApiProperty({
    description: '联系电话',
    example: '13800138000',
    required: false,
  })
  phone?: string;

  @ApiProperty({
    description: '所属部门',
    example: '技术部',
    default: 'internMember',
    required: false,
  })
  department?: string;
}

export class LoginDto {
  @ApiProperty({ description: '学校学号', example: '2023001001' })
  schoolId: string;

  @ApiProperty({ description: '登录密码', example: 'password123' })
  password: string;
}

export class RefreshDto {
  @ApiProperty({
    description: '刷新令牌',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;
}

export class RegisterResponseDto {
  @ApiProperty({ description: '访问令牌', example: 'access_token_here' })
  accessToken: string;

  @ApiProperty({ description: '刷新令牌', example: 'refresh_token_here' })
  refreshToken: string;

  @ApiProperty({ description: '用户ID', example: 1 })
  id: number;

  @ApiProperty({ description: '学校学号', example: '2023001001' })
  schoolId: string;

  @ApiProperty({ description: '用户角色', example: 'user' })
  userRole: string;
}

export class LoginResponseDto {
  @ApiProperty({ description: '访问令牌', example: 'access_token_here' })
  accessToken: string;

  @ApiProperty({ description: '刷新令牌', example: 'refresh_token_here' })
  refreshToken: string;

  @ApiProperty({ description: '用户ID', example: 1 })
  id: number;

  @ApiProperty({ description: '学校学号', example: '2023001001' })
  schoolId: string;

  @ApiProperty({ description: '用户角色', example: 'user' })
  userRole: string;
}

export class RefreshResponseDto {
  @ApiProperty({
    description: '新的访问令牌',
    example: 'new_access_token_here',
  })
  accessToken: string;

  @ApiProperty({
    description: '新的刷新令牌',
    example: 'new_refresh_token_here',
  })
  refreshToken: string;
}
