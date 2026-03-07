import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class RosterUserDto {
  @Expose()
  @ApiProperty({ description: '用户 ID', example: 1 })
  id!: number;

  @Expose()
  @ApiProperty({ description: '学号', example: '2023001001' })
  schoolId!: string;

  @Expose()
  @ApiProperty({ description: '姓名', example: '张三' })
  name?: string;

  @Expose()
  @ApiProperty({ description: '电话号码', example: '13800138000' })
  phone?: string;

  @Expose()
  @ApiProperty({ description: '电子邮箱', example: 'user@example.com' })
  email?: string;

  @Expose()
  @ApiProperty({ description: '用户职位', example: '部员', nullable: true })
  position?: string;

  @Expose()
  @ApiProperty({ description: 'QQ 号', example: '123456789', nullable: true })
  qqNumber?: string;
}

export class RosterResponseDto {
  @Expose()
  @ApiProperty({ description: '总用户数', example: 100 })
  total: number = 0;

  @ApiProperty({ description: '花名册数据，以部门名称为键' })
  roster: Record<string, RosterUserDto[]> = {};
}
