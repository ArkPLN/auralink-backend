import { IsString, IsOptional, IsDateString, IsInt, Min, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateScheduleDto {
  @ApiProperty({ description: '活动标题', example: '社团例会' })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ description: '活动详情', example: '讨论下个月的活动安排' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '活动地点', example: '学生活动中心 301' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ description: '开始时间', example: '2026-03-10T14:00:00Z' })
  @IsDateString()
  startTime!: string;

  @ApiProperty({ description: '结束时间', example: '2026-03-10T16:00:00Z' })
  @IsDateString()
  endTime!: string;

  @ApiPropertyOptional({ description: '最大参与人数', example: 50 })
  @IsInt()
  @Min(1)
  @IsOptional()
  maxParticipants?: number;

  @ApiPropertyOptional({ description: '邀请的成员 ID 列表', type: [Number] })
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  inviteeIds?: number[];

  @ApiPropertyOptional({ description: '附件 ID 列表', type: [Number] })
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  attachmentIds?: number[];
}
