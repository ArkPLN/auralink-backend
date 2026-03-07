import { IsString, IsOptional, IsArray, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class InviteMembersDto {
  @ApiPropertyOptional({ description: '要邀请的成员 ID 列表', type: [Number] })
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  userIds?: number[];

  @ApiPropertyOptional({
    description: '按部门邀请',
    example: ['技术部', '宣传部'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  departments?: string[];

  @ApiPropertyOptional({ description: '是否邀请全体成员', example: false })
  @IsOptional()
  inviteAll?: boolean;
}
