import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  Min,
} from 'class-validator';
import { AdminActionType } from '../entities/adminlog.entity';

export class CreateAdminLogDto {
  @ApiProperty({ description: '操作人ID' })
  @IsNumber()
  operatorId: number;

  @ApiProperty({ description: '被操作用户ID', required: false })
  @IsNumber()
  @IsOptional()
  targetId?: number;

  @ApiProperty({ description: '操作类型', enum: AdminActionType })
  @IsEnum(AdminActionType)
  actionType: AdminActionType;

  @ApiProperty({ description: '被修改的字段名', required: false })
  @IsString()
  @IsOptional()
  fieldName?: string;

  @ApiProperty({ description: '修改前的值', required: false })
  @IsString()
  @IsOptional()
  oldValue?: string;

  @ApiProperty({ description: '修改后的值', required: false })
  @IsString()
  @IsOptional()
  newValue?: string;

  @ApiProperty({ description: '详情/备注', required: false })
  @IsString()
  @IsOptional()
  details?: string;

  @ApiProperty({ description: '操作IP地址' })
  @IsString()
  ipAddress: string;
}

export class QueryAdminLogDto {
  @ApiProperty({
    description: '操作类型',
    enum: AdminActionType,
    required: false,
  })
  @IsEnum(AdminActionType)
  @IsOptional()
  actionType?: AdminActionType;

  @ApiProperty({ description: '开始时间 (ISO格式)', required: false })
  @IsDateString()
  @IsOptional()
  startTime?: string;

  @ApiProperty({ description: '结束时间 (ISO格式)', required: false })
  @IsDateString()
  @IsOptional()
  endTime?: string;

  @ApiProperty({ description: '操作用户ID', required: false })
  @IsNumber()
  @IsOptional()
  operatorId?: number;

  @ApiProperty({ description: '被操作用户ID', required: false })
  @IsNumber()
  @IsOptional()
  targetId?: number;

  @ApiProperty({ description: '页码', default: 1, required: false })
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiProperty({ description: '每页条数', default: 10, required: false })
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number;
}

export class AdminLogResponseDto {
  @ApiProperty({ description: '日志ID' })
  id: number;

  @ApiProperty({ description: '操作人ID' })
  operatorId: number;

  @ApiProperty({ description: '操作人学号' })
  operatorSchoolId: string;

  @ApiProperty({ description: '操作人姓名' })
  operatorName: string;

  @ApiProperty({ description: '被操作用户ID', required: false })
  targetId?: number;

  @ApiProperty({ description: '被操作用户学号', required: false })
  targetSchoolId?: string;

  @ApiProperty({ description: '被操作用户姓名', required: false })
  targetName?: string;

  @ApiProperty({ description: '操作类型', enum: AdminActionType })
  actionType: AdminActionType;

  @ApiProperty({ description: '被修改的字段名', required: false })
  fieldName?: string;

  @ApiProperty({ description: '修改前的值', required: false })
  oldValue?: string;

  @ApiProperty({ description: '修改后的值', required: false })
  newValue?: string;

  @ApiProperty({ description: '详情/备注', required: false })
  details?: string;

  @ApiProperty({ description: '操作IP地址' })
  ipAddress: string;

  @ApiProperty({ description: '操作时间' })
  createdAt: Date;
}

export class AdminLogListResponseDto {
  @ApiProperty({ description: '日志列表', type: [AdminLogResponseDto] })
  logs: AdminLogResponseDto[];

  @ApiProperty({ description: '总数' })
  total: number;

  @ApiProperty({ description: '当前页码' })
  page: number;

  @ApiProperty({ description: '每页条数' })
  limit: number;
}
