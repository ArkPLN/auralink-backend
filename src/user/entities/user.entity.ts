import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users') // 映射到数据库中的 users 表
export class User {
    // 主键，自增
    @PrimaryGeneratedColumn()
    id: number;
    // 学校账号，唯一
    @Column({ unique: true, nullable: false }) // 学校账号不能为空，必须唯一
    schoolId: string;
    // 密码
    @Column()
    password: string; // 存储的是加密后的哈希值
    // 姓名
    @Column({ nullable: true }) // 姓名可以为空
    name: string;
    // 手机号
    @Column({ nullable: true }) // 手机号可以为空
    phone: string;
    // 邮箱
    @Column({ unique: true, nullable: true }) // 邮箱可以为空，必须唯一
    email: string;
    // 部门
    @Column({ default: 'internMember' })
    department: string;
    // 是否激活
    @Column({ default: true })
    isActive: boolean;
    // 用户角色
    @Column({ default: 'user' })
    userRole: string;
    // 刷新令牌的哈希值
    @Column({ nullable: true })
    hashedRefreshToken?: string;
    //创建时间
    @Column({ default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;
    // 更新时间
    @Column({ default: () => 'CURRENT_TIMESTAMP' })
    updatedAt: Date;
}