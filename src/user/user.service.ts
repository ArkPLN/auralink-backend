import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { User } from './entities/user.entity';
import { RegisterDto } from '../auth/auth.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { S3Service } from '../s3/s3.service';
import { AvatarUploadResponseDto } from './dto/avatar.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly em: EntityManager,
    private readonly s3Service: S3Service,
  ) {}

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

  async uploadAvatar(
    userId: number,
    file: Express.Multer.File,
  ): Promise<AvatarUploadResponseDto> {
    const user = await this.em.findOne(User, { id: userId });

    if (!user) {
      throw new NotFoundException({
        statusCode: 404,
        message: '用户不存在',
        error: 'NotFound',
      });
    }

    if (!file) {
      throw new BadRequestException({
        statusCode: 400,
        message: '请选择要上传的文件',
        error: 'BadRequest',
      });
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException({
        statusCode: 400,
        message: '仅支持 JPG 或 PNG 格式的图片',
        error: 'BadRequest',
      });
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException({
        statusCode: 400,
        message: '文件大小不能超过 5MB',
        error: 'BadRequest',
      });
    }

    try {
      if (user.avatarUrl) {
        this.logger.log(`正在删除用户 ${userId} 的旧头像...`);
        await this.s3Service.deleteAvatar(user.avatarUrl);
      }

      const avatarUrl = await this.s3Service.uploadAvatar(userId, file);

      user.avatarUrl = avatarUrl;
      user.updatedAt = new Date();
      await this.em.flush();

      this.logger.log(`用户 ${userId} 头像上传成功`);

      return {
        status: 'success',
        avatarUrl,
        message: '头像上传成功',
        fileSize: file.size,
        mimeType: file.mimetype,
      };
    } catch (error) {
      this.logger.error(`用户 ${userId} 头像上传失败: ${error.message}`);
      throw new BadRequestException({
        statusCode: 400,
        message: '头像上传失败，请稍后重试',
        error: 'BadRequest',
      });
    }
  }

  async findAllActiveUsers(): Promise<User[]> {
    return this.em.find(User, { isActive: true });
  }
}
