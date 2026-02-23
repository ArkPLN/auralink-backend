import { Entity, PrimaryKey, Property, Unique } from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

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
  @ApiProperty({
    description: '用户密码（哈希存储）',
    example: 'hashedPassword123',
  })
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

  @Expose()
  @ApiProperty({
    description: '用户职位',
    example: '部员',
    enum: ['部员', '部长', '实习部员'],
    default: '部员',
  })
  @Property({ default: '部员' })
  position?: string = '部员';

  @Expose()
  @ApiProperty({ description: 'QQ号', example: '123456789', nullable: true })
  @Property({ nullable: true })
  qqNumber?: string = '123456789';

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

@Exclude()
export class PublicUserDto {
  @Expose()
  @ApiProperty({ description: '用户唯一标识ID', example: 1 })
  id: number;

  @Expose()
  @ApiProperty({ description: '学校学号', example: '2023001001' })
  schoolId: string;

  @Expose()
  @ApiProperty({
    description: '用户真实姓名',
    example: '张三',
    required: false,
  })
  name?: string;

  @Expose()
  @ApiProperty({
    description: '用户手机号',
    example: '13800138000',
    required: false,
  })
  phone?: string;

  @Expose()
  @ApiProperty({
    description: '用户邮箱地址',
    example: 'user@example.com',
    required: false,
  })
  email?: string;

  @Expose()
  @ApiProperty({
    description: '用户所属部门',
    example: '技术部',
    default: '实习生',
  })
  department: string;

  @Expose()
  @ApiProperty({
    description: '用户职位',
    example: '部员',
    enum: ['部员', '部长', '实习部员'],
    default: '部员',
  })
  @Property({ default: '部员' })
  position?: string = '部员';

  @Expose()
  @ApiProperty({ description: 'QQ号', example: '123456789', nullable: true })
  @Property({ nullable: true })
  qqNumber?: string = '123456789';

  @Expose()
  @ApiProperty({ description: '用户是否处于激活状态', example: true })
  isActive: boolean;

  @Expose()
  @ApiProperty({
    description: '用户角色权限',
    example: 'user',
    default: 'user',
  })
  userRole: string;
}
