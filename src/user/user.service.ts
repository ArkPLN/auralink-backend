import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { User } from './entities/user.entity';
import { RegisterDto } from '../auth/auth.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly em: EntityManager) {}

  async findOneBySchoolId(schoolId: string): Promise<User | undefined> {
    const user = await this.em.findOne(User, { schoolId });
    return user ?? undefined;
  }

  async findOneById(id: number): Promise<User | undefined> {
    const user = await this.em.findOne(User, { id });
    return user ?? undefined;
  }

  async findOneWithRefreshToken(id: number): Promise<User | undefined> {
    const user = await this.em.findOne(User, { id });
    return user ?? undefined;
  }

  async create(registerDto: RegisterDto): Promise<User> {
    const user = new User();
    user.schoolId = registerDto.schoolId;
    user.password = registerDto.password;
    user.name = registerDto.name;
    user.phone = registerDto.phone;
    user.department = registerDto.department ?? 'internMember';
    user.isActive = true;
    user.userRole = 'user';
    await this.em.persistAndFlush(user);
    return user;
  }

  async update(id: number, updateData: Partial<User>) {
    const user = await this.em.findOne(User, { id });
    if (user) {
      this.em.assign(user, updateData);
      await this.em.flush();
    }
  }

  async findActiveUsers(limit: number = 10): Promise<User[]> {
    return this.em.find(
      User,
      { isActive: true },
      {
        orderBy: { createdAt: 'ASC' },
        limit,
      },
    );
  }

  async findActiveAdminUsers(limit: number = 10): Promise<User[]> {
    return this.em.find(
      User,
      { isActive: true, userRole: 'admin' },
      {
        orderBy: { createdAt: 'ASC' },
        limit,
      },
    );
  }

  async updateUser(
    userId: number,
    updateUserDto: UpdateUserDto,
    currentUserId: number,
  ): Promise<User> {
    const user = await this.em.findOne(User, { id: userId });

    if (!user) {
      throw new NotFoundException({
        statusCode: 404,
        message: '用户不存在',
        error: 'NotFound',
      });
    }

    if (user.id !== currentUserId) {
      throw new ForbiddenException({
        statusCode: 403,
        message: '权限不足，只能更新自己的信息',
        error: 'Forbidden',
      });
    }

    this.em.assign(user, updateUserDto);
    user.updatedAt = new Date();
    await this.em.flush();

    return user;
  }
}
