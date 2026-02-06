import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('users')
export class User {
  @ApiProperty({
    description: '用户唯一标识ID',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: '学校学号，用于登录',
    example: '2023001001',
    uniqueItems: true,
  })
  @Column({ unique: true, nullable: false })
  schoolId: string;

  @ApiProperty({
    description: '用户密码（已加密的哈希值）',
    example: '$2b$10$...',
    writeOnly: true,
  })
  @Column()
  password: string;

  @ApiProperty({
    description: '用户真实姓名',
    example: '张三',
    required: false,
  })
  @Column({ nullable: true })
  name: string;

  @ApiProperty({
    description: '用户手机号',
    example: '13800138000',
    required: false,
  })
  @Column({ nullable: true })
  phone: string;

  @ApiProperty({
    description: '用户邮箱地址',
    example: 'user@example.com',
    required: false,
    uniqueItems: true,
  })
  @Column({ unique: true, nullable: true })
  email: string;

  @ApiProperty({
    description: '用户所属部门',
    example: '技术部',
    enum: ['internMember', 'member', 'admin'],
    default: 'internMember',
  })
  @Column({ default: 'internMember' })
  department: string;

  @ApiProperty({
    description: '用户是否处于激活状态',
    example: true,
    default: true,
  })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({
    description: '用户角色权限',
    example: 'user',
    enum: ['user', 'admin'],
    default: 'user',
  })
  @Column({ default: 'user' })
  userRole: string;

  @ApiProperty({
    description: '刷新令牌的哈希值',
    example: '$2b$10$...',
    required: false,
    writeOnly: true,
  })
  @Column({ nullable: true })
  hashedRefreshToken?: string;

  @ApiProperty({
    description: '用户创建时间',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ApiProperty({
    description: '用户最后更新时间',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
