import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class RosterUserDto {
  @Expose()
  @ApiProperty({ description: '学号', example: '2023001001' })
  schoolId: string;

  @Expose()
  @ApiProperty({ description: '姓名', example: '张三' })
  name?: string;

  @Expose()
  @ApiProperty({ description: '电话号码', example: '13800138000' })
  phone?: string;

  @Expose()
  @ApiProperty({ description: '电子邮箱', example: 'user@example.com' })
  email?: string;
}

export class RosterResponseDto {
  @ApiProperty({ description: '花名册数据，以部门名称为键' })
  roster: Record<string, RosterUserDto[]>;
}
