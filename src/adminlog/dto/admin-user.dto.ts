import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsArray,
  IsEnum,
  Min,
  Max,
} from 'class-validator';

export class UpdateUserByAdminDto {
  @ApiProperty({ description: '用户真实姓名', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: '用户手机号', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ description: '用户邮箱地址', required: false })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: '用户所属部门',
    enum: ['internMember', 'member', 'admin'],
    required: false,
  })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiProperty({ description: '用户是否激活', required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: '用户角色权限',
    enum: ['user', 'admin', 'root'],
    required: false,
  })
  @IsString()
  @IsOptional()
  userRole?: string;
}

export class BatchUpdateUserDto {
  @ApiProperty({ description: '用户ID' })
  @IsNumber()
  id: number;

  @ApiProperty({ description: '更新内容' })
  updates: UpdateUserByAdminDto;
}

export class BatchUpdateDto {
  @ApiProperty({ description: '批量更新用户列表', type: [BatchUpdateUserDto] })
  @IsArray()
  users: BatchUpdateUserDto[];
}

export class BatchDeleteDto {
  @ApiProperty({ description: '要删除的用户ID列表', type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];
}

export class CreateAdminDto {
  @ApiProperty({ description: '学校学号' })
  @IsString()
  schoolId: string;

  @ApiProperty({ description: '密码' })
  @IsString()
  password: string;

  @ApiProperty({ description: '用户真实姓名', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: '用户手机号', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ description: '用户邮箱地址', required: false })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: '用户所属部门',
    enum: ['internMember', 'member', 'admin'],
    default: 'admin',
    required: false,
  })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiProperty({
    description: '管理员角色',
    enum: ['admin', 'root'],
    default: 'admin',
    required: false,
  })
  @IsString()
  @IsOptional()
  userRole?: string;
}

export class UpdateAdminDto {
  @ApiProperty({ description: '管理员ID' })
  @IsNumber()
  id: number;

  @ApiProperty({ description: '更新内容', type: UpdateUserByAdminDto })
  updates: UpdateUserByAdminDto;
}

export class DeleteAdminDto {
  @ApiProperty({ description: '要删除的管理员ID' })
  @IsNumber()
  id: number;
}

export class AdminResponseDto {
  @ApiProperty({ description: '用户ID' })
  id: number;

  @ApiProperty({ description: '学校学号' })
  schoolId: string;

  @ApiProperty({ description: '用户真实姓名' })
  name: string;

  @ApiProperty({ description: '用户手机号' })
  phone: string;

  @ApiProperty({ description: '用户邮箱地址' })
  email: string;

  @ApiProperty({ description: '用户所属部门' })
  department: string;

  @ApiProperty({ description: '用户角色权限' })
  userRole: string;

  @ApiProperty({ description: '用户是否激活' })
  isActive: boolean;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;
}

export class AdminListResponseDto {
  @ApiProperty({ description: '管理员列表', type: [AdminResponseDto] })
  admins: AdminResponseDto[];

  @ApiProperty({ description: '总数' })
  total: number;
}

export class BatchOperationResultDto {
  @ApiProperty({ description: '成功数量' })
  success: number;

  @ApiProperty({ description: '失败数量' })
  failed: number;

  @ApiProperty({ description: '失败详情', type: [Object], required: false })
  failures?: { id: number; reason: string }[];
}
