import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { RegisterDto } from '../auth/auth.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // 核心变更：通过学号查找用户
  async findOneBySchoolId(schoolId: string): Promise<User | undefined> {
    const user = await this.usersRepository.findOne({ where: { schoolId } });
    return user === null ? undefined : user;
  }

  // 通过 ID 查找（用于刷新 Token 或 JWT 策略）
  async findOneById(id: number): Promise<User | undefined> {
    const user = await this.usersRepository.findOne({ where: { id } });
    return user === null ? undefined : user;
  }

  // 创建用户
  async create(registerDto: RegisterDto): Promise<User> {
    const user = this.usersRepository.create(registerDto);
    return this.usersRepository.save(user);
  }

  // 更新 RefreshToken
  async update(id: number, updateData: Partial<User>) {
    await this.usersRepository.update(id, updateData);
  }
}
