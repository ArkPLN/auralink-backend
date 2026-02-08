import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsNumber,
  IsString,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PublicUserDto } from './user-response.dto';

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
  @ApiProperty({ description: '用户列表', type: [PublicUserDto] })
  users: PublicUserDto[];

  @ApiProperty({ description: '查询到的用户数量', example: 5 })
  count: number;

  @ApiProperty({ description: '请求的数量限制', example: 10 })
  limit: number;
}
