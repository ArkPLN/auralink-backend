import { PickType, OmitType } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { User } from '../entities/user.entity';

/**
 * 基础用户信息 DTO
 * 用于公开列表展示，包含用户主要信息
 */
export class PublicUserDto {
  @Expose()
  @ApiProperty({ description: '用户ID', example: 1 })
  id: number;

  @Expose()
  @ApiProperty({ description: '学校学号', example: '20230001' })
  schoolId: string;

  @Expose()
  @ApiProperty({ description: '真实姓名', example: '张三', required: false })
  name: string;

  @Expose()
  @ApiProperty({
    description: '用户手机号',
    example: '13800138000',
    required: false,
  })
  phone: string;

  @Expose()
  @ApiProperty({
    description: '邮箱地址',
    example: 'user@example.com',
    required: false,
  })
  email: string;

  @Expose()
  @ApiProperty({ description: '所属部门', example: '技术部' })
  department: string;

  @Expose()
  @ApiProperty({
    description: '用户角色',
    example: 'user',
    enum: ['user', 'admin'],
  })
  userRole: string;

  @Expose()
  @ApiProperty({ description: '是否激活', example: true })
  isActive: boolean;
}

/**
 * 当前用户信息 DTO
 * 用于个人中心，包含角色和状态，但排除敏感信息和时间戳
 */
export class MeResponseDto extends OmitType(User, [
  'password',
  'hashedRefreshToken',
  'createdAt',
  'updatedAt',
] as const) {
  @Expose()
  id: number;

  @Expose()
  schoolId: string;

  @Expose()
  name: string;

  @Expose()
  phone: string;

  @Expose()
  email: string;

  @Expose()
  department: string;

  @Expose()
  isActive: boolean;

  @Expose()
  userRole: string;
}

/**
 * 管理员查看用户 DTO
 * 用于管理员接口，可以看到所有字段（除了敏感信息）
 */
export class AdminUserResponseDto extends OmitType(User, [
  'password',
  'hashedRefreshToken',
] as const) {
  @Expose()
  id: number;

  @Expose()
  schoolId: string;

  @Expose()
  name: string;

  @Expose()
  phone: string;

  @Expose()
  email: string;

  @Expose()
  department: string;

  @Expose()
  isActive: boolean;

  @Expose()
  userRole: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}

/**
 * 用户列表响应 DTO
 */
export class UserListResponseDto {
  users: PublicUserDto[];
  total: number;
}
