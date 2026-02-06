import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEmail,
  MaxLength,
  MinLength,
  IsEnum,
} from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    description: '用户真实姓名',
    example: '张三',
    required: false,
    maxLength: 50,
  })
  @IsOptional()
  @IsString({ message: '姓名必须为字符串' })
  @MaxLength(50, { message: '姓名长度不能超过50个字符' })
  name?: string;

  @ApiProperty({
    description: '用户手机号',
    example: '13800138000',
    required: false,
    pattern: '^1[3-9]\\d{9}$',
  })
  @IsOptional()
  @IsString({ message: '手机号必须为字符串' })
  phone?: string;

  @ApiProperty({
    description: '用户邮箱地址',
    example: 'user@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string;

  @ApiProperty({
    description: '用户所属部门',
    example: '技术部',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '部门必须为字符串' })
  department?: string;
}
