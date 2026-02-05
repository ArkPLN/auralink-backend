import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ description: '学校学号', example: '2023001001' })
  schoolId: string;

  @ApiProperty({ description: '登录密码', example: 'password123' })
  password: string;

  @ApiProperty({ description: '真实姓名', example: '张三', required: false })
  name?: string;

  @ApiProperty({ description: '联系电话', example: '13800138000', required: false })
  phone?: string;

  @ApiProperty({ description: '所属部门', example: '技术部', default: 'internMember', required: false })
  department?: string;
}

export class LoginDto {
  @ApiProperty({ description: '学校学号', example: '2023001001' })
  schoolId: string;

  @ApiProperty({ description: '登录密码', example: 'password123' })
  password: string;
}