import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class SimpleUserDto {
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
  @ApiProperty({ description: '部门', example: '开发部' })
  department!: string;

  @Expose()
  @ApiProperty({ description: '职位', example: '部员', nullable: true })
  position?: string;
}

export class AllUsersResponseDto {
  @ApiProperty({ description: '用户总数', example: 50 })
  total!: number;

  @ApiProperty({ description: '用户列表', type: [SimpleUserDto] })
  users!: SimpleUserDto[];
}
