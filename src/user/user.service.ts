// src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // 根据学校账号查找用户（登录和注册查重时使用）
  async findOneBySchoolId(schoolId: string): Promise<User | undefined> {
// src/users/users.service.ts
    const user = await this.usersRepository.findOne({ where: { schoolId } });
    return user ?? undefined;
  }

  // 创建新用户（注册时使用）
  async create(userData: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(userData);
    return this.usersRepository.save(user);
  }
}