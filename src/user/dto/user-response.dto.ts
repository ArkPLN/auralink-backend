import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

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

export class MeResponseDto {
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
  @ApiProperty({ description: '是否激活', example: true })
  isActive: boolean;

  @Expose()
  @ApiProperty({
    description: '用户角色',
    example: 'user',
    enum: ['user', 'admin', 'root'],
  })
  userRole: string;
}

export class AdminUserResponseDto {
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
  @ApiProperty({ description: '是否激活', example: true })
  isActive: boolean;

  @Expose()
  @ApiProperty({
    description: '用户角色',
    example: 'user',
    enum: ['user', 'admin', 'root'],
  })
  userRole: string;

  @Expose()
  @ApiProperty({ description: '创建时间', example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @Expose()
  @ApiProperty({ description: '更新时间', example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;
}

export class UserListResponseDto {
  users: PublicUserDto[];
  total: number;
}
