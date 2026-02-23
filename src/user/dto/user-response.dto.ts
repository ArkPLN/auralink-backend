import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class MeResponseDto {
  @Expose()
  @ApiProperty({ description: '用户唯一标识ID', example: 1 })
  id: number;

  @Expose()
  @ApiProperty({ description: '学校学号', example: '2023001001' })
  schoolId: string;

  @Expose()
  @ApiProperty({
    description: '用户真实姓名',
    example: '张三',
    required: false,
  })
  name?: string;

  @Expose()
  @ApiProperty({
    description: '用户手机号',
    example: '13800138000',
    required: false,
  })
  phone?: string;

  @Expose()
  @ApiProperty({
    description: '用户邮箱地址',
    example: 'user@example.com',
    required: false,
  })
  email?: string;

  @Expose()
  @ApiProperty({
    description: '用户所属部门',
    example: '技术部',
    default: '实习生',
  })
  department: string;

  @Expose()
  @ApiProperty({
    description: '用户是否处于激活状态',
    example: true,
    default: true,
  })
  isActive: boolean;

  @Expose()
  @ApiProperty({
    description: '用户角色权限',
    example: 'user',
    default: 'user',
  })
  userRole: string;

  @Expose()
  @ApiProperty({
    description: '用户头像URL',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  avatarUrl?: string;
}

@Exclude()
export class UserResponseDto {
  @Expose()
  @ApiProperty({ description: '用户唯一标识ID', example: 1 })
  id: number;

  @Expose()
  @ApiProperty({ description: '学校学号', example: '2023001001' })
  schoolId: string;

  @Expose()
  @ApiProperty({
    description: '用户真实姓名',
    example: '张三',
    required: false,
  })
  name?: string;

  @Expose()
  @ApiProperty({
    description: '用户手机号',
    example: '13800138000',
    required: false,
  })
  phone?: string;

  @Expose()
  @ApiProperty({
    description: '用户邮箱地址',
    example: 'user@example.com',
    required: false,
  })
  email?: string;

  @Expose()
  @ApiProperty({
    description: '用户所属部门',
    example: '技术部',
    default: '实习生',
  })
  department: string;

  @Expose()
  @ApiProperty({
    description: '用户是否处于激活状态',
    example: true,
    default: true,
  })
  isActive: boolean;

  @Expose()
  @ApiProperty({
    description: '用户角色权限',
    example: 'user',
    default: 'user',
  })
  userRole: string;

  @Expose()
  @ApiProperty({
    description: '用户头像URL',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  avatarUrl?: string;

  @Expose()
  @ApiProperty({
    description: '用户创建时间',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @Expose()
  @ApiProperty({
    description: '用户最后更新时间',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}

export class UserListResponseDto {
  @ApiProperty({ description: '用户列表', type: [UserResponseDto] })
  users: UserResponseDto[];

  @ApiProperty({ description: '总数', example: 10 })
  total: number;
}
