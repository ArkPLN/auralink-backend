import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsNumber,
  IsString,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FindUsersQueryDto {
  @ApiProperty({
    description: '返回用户数量限制',
    example: 10,
    required: false,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'n 必须为整数' })
  @Min(1, { message: 'n 必须大于等于 1' })
  @Max(100, { message: 'n 不能超过 100' })
  n?: number;
}

export class FindUsersBodyDto {
  @ApiProperty({
    description: '用户ID（必须与JWT中的sub一致）',
    example: 1,
  })
  @IsNumber({}, { message: 'id 必须为数字' })
  id: number;

  @ApiProperty({
    description: '用户角色（必须与JWT中的role一致）',
    example: 'admin',
    enum: ['user', 'admin'],
  })
  @IsString({ message: 'userRole 必须为字符串' })
  @IsEnum(['user', 'admin'], {
    message: 'userRole 必须为 user 或 admin',
  })
  userRole: string;
}

export class FindUsersResponseDto {
  @ApiProperty({ description: '用户列表', type: [Object] })
  users: UserInfoDto[];

  @ApiProperty({ description: '查询到的用户数量', example: 5 })
  count: number;

  @ApiProperty({ description: '请求的数量限制', example: 10 })
  limit: number;
}

export class UserInfoDto {
  @ApiProperty({ description: '用户ID', example: 1 })
  id: number;

  @ApiProperty({ description: '学校学号', example: '2023001001' })
  schoolId: string;

  @ApiProperty({ description: '姓名', example: '张三', required: false })
  name?: string;

  @ApiProperty({
    description: '手机号',
    example: '13800138000',
    required: false,
  })
  phone?: string;

  @ApiProperty({
    description: '邮箱',
    example: 'user@example.com',
    required: false,
  })
  email?: string;

  @ApiProperty({ description: '部门', example: '技术部' })
  department: string;

  @ApiProperty({ description: '是否激活', example: true })
  isActive: boolean;

  @ApiProperty({ description: '用户角色', example: 'admin' })
  userRole: string;

  @ApiProperty({ description: '创建时间', example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;
}
