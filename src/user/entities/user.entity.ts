import { Entity, PrimaryKey, Property, Unique } from '@mikro-orm/core';
import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';

@Entity({ tableName: 'users' })
export class User {
  @Expose()
  @ApiProperty({
    description: '用户唯一标识ID',
    example: 1,
  })
  @PrimaryKey()
  id!: number;

  @Expose()
  @ApiProperty({
    description: '学校学号，用于登录',
    example: '2023001001',
    uniqueItems: true,
  })
  @Unique()
  @Property({ nullable: false })
  schoolId!: string;

  @Exclude()
  @Property()
  password!: string;

  @Expose()
  @ApiProperty({
    description: '用户真实姓名',
    example: '张三',
    required: false,
  })
  @Property({ nullable: true })
  name?: string;

  @Expose()
  @ApiProperty({
    description: '用户手机号',
    example: '13800138000',
    required: false,
  })
  @Property({ nullable: true })
  phone?: string;

  @Expose()
  @ApiProperty({
    description: '用户邮箱地址',
    example: 'user@example.com',
    required: false,
    uniqueItems: true,
  })
  @Unique()
  @Property({ nullable: true })
  email?: string;

  @Expose()
  @ApiProperty({
    description: '用户所属部门',
    example: '技术部',
    enum: ['实习生', '开发部', '摄影部', '设计部', '部长'],
    default: 'internMember',
  })
  @Property({ default: '实习生' })
  department: string = '实习生';

  @Expose()
  @ApiProperty({
    description: '用户是否处于激活状态',
    example: true,
    default: true,
  })
  @Property({ default: true })
  isActive: boolean = true;

  @Expose()
  @ApiProperty({
    description: '用户角色权限',
    example: 'user',
    enum: ['user', 'admin', 'root'],
    default: 'user',
  })
  @Property({ default: 'user' })
  userRole: string = 'user';

  @Exclude()
  @Property({ nullable: true })
  hashedRefreshToken?: string;

  @Expose()
  @ApiProperty({
    description: '用户头像URL',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  @Property({ nullable: true })
  avatarUrl?: string;

  @Expose()
  @ApiProperty({
    description: '用户创建时间',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Property({ defaultRaw: 'CURRENT_TIMESTAMP' })
  createdAt: Date = new Date();

  @Expose()
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

export class UserResponseDto extends OmitType(User, [
  'password',
  'hashedRefreshToken',
] as const) {}

export class PublicUserDto extends OmitType(User, [
  'password',
  'hashedRefreshToken',
  'avatarUrl',
  'createdAt',
  'updatedAt',
] as const) {}
