import {
  Entity,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

@Entity({ tableName: 'users' })
export class User {
  @ApiProperty({
    description: '用户唯一标识ID',
    example: 1,
  })
  @PrimaryKey()
  id!: number;

  @ApiProperty({
    description: '学校学号，用于登录',
    example: '2023001001',
    uniqueItems: true,
  })
  @Unique()
  @Property({ nullable: false })
  schoolId!: string;

  @ApiProperty({
    description: '用户密码（已加密的哈希值）',
    example: '$2b$10$...',
    writeOnly: true,
  })
  @Exclude()
  @Property()
  password!: string;

  @ApiProperty({
    description: '用户真实姓名',
    example: '张三',
    required: false,
  })
  @Property({ nullable: true })
  name?: string;

  @ApiProperty({
    description: '用户手机号',
    example: '13800138000',
    required: false,
  })
  @Property({ nullable: true })
  phone?: string;

  @ApiProperty({
    description: '用户邮箱地址',
    example: 'user@example.com',
    required: false,
    uniqueItems: true,
  })
  @Unique()
  @Property({ nullable: true })
  email?: string;

  @ApiProperty({
    description: '用户所属部门',
    example: '技术部',
    enum: ['internMember', 'member', 'admin'],
    default: 'internMember',
  })
  @Property({ default: 'internMember' })
  department: string = 'internMember';

  @ApiProperty({
    description: '用户是否处于激活状态',
    example: true,
    default: true,
  })
  @Property({ default: true })
  isActive: boolean = true;

  @ApiProperty({
    description: '用户角色权限',
    example: 'user',
    enum: ['user', 'admin', 'root'],
    default: 'user',
  })
  @Property({ default: 'user' })
  userRole: string = 'user';

  @ApiProperty({
    description: '刷新令牌的哈希值',
    example: '$2b$10$...',
    required: false,
    writeOnly: true,
  })
  @Exclude()
  @Property({ nullable: true })
  hashedRefreshToken?: string;

  @ApiProperty({
    description: '用户创建时间',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Property({ defaultRaw: 'CURRENT_TIMESTAMP' })
  createdAt: Date = new Date();

  @ApiProperty({
    description: '用户最后更新时间',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Property({
    defaultRaw: 'CURRENT_TIMESTAMP',
    onUpdate: () => new Date(),
  })
  updatedAt: Date = new Date();
}
