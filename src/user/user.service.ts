import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { RegisterDto } from '../auth/auth.dto';
import { UserInfoDto } from './dto/find-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findOneBySchoolId(schoolId: string): Promise<User | undefined> {
    const user = await this.usersRepository.findOne({ where: { schoolId } });
    return user === null ? undefined : user;
  }

  async findOneById(id: number): Promise<User | undefined> {
    const user = await this.usersRepository.findOne({ where: { id } });
    return user === null ? undefined : user;
  }

  async create(registerDto: RegisterDto): Promise<User> {
    const user = this.usersRepository.create(registerDto);
    return this.usersRepository.save(user);
  }

  async update(id: number, updateData: Partial<User>) {
    await this.usersRepository.update(id, updateData);
  }

  async findActiveUsers(limit: number = 10): Promise<UserInfoDto[]> {
    const users = await this.usersRepository.find({
      where: {
        isActive: true,
      },
      order: {
        createdAt: 'ASC',
      },
      take: limit,
    });

    return users.map((user) => ({
      id: user.id,
      schoolId: user.schoolId,
      name: user.name,
      phone: user.phone,
      email: user.email,
      department: user.department,
      isActive: user.isActive,
      userRole: user.userRole,
      createdAt: user.createdAt,
    }));
  }

  async findActiveAdminUsers(limit: number = 10): Promise<UserInfoDto[]> {
    const users = await this.usersRepository.find({
      where: {
        isActive: true,
        userRole: 'admin',
      },
      order: {
        createdAt: 'ASC',
      },
      take: limit,
    });

    return users.map((user) => ({
      id: user.id,
      schoolId: user.schoolId,
      name: user.name,
      phone: user.phone,
      email: user.email,
      department: user.department,
      isActive: user.isActive,
      userRole: user.userRole,
      createdAt: user.createdAt,
    }));
  }

  async updateUser(
    userId: number,
    updateUserDto: UpdateUserDto,
    currentUserId: number,
  ): Promise<UserInfoDto> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

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

    Object.assign(user, updateUserDto);
    user.updatedAt = new Date();

    const updatedUser = await this.usersRepository.save(user);

    return {
      id: updatedUser.id,
      schoolId: updatedUser.schoolId,
      name: updatedUser.name,
      phone: updatedUser.phone,
      email: updatedUser.email,
      department: updatedUser.department,
      isActive: updatedUser.isActive,
      userRole: updatedUser.userRole,
      createdAt: updatedUser.createdAt,
    };
  }
}
