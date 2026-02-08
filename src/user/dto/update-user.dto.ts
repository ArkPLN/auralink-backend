import { OmitType, PartialType } from '@nestjs/swagger';
import { User } from '../entities/user.entity';

/**
 * 更新用户 DTO
 * 排除 id, isActive, userRole 等不允许用户自行修改的字段
 */
export class UpdateUserDto extends OmitType(PartialType(User), [
  'id',
  'schoolId',
  'password',
  'isActive',
  'userRole',
  'hashedRefreshToken',
  'createdAt',
  'updatedAt',
] as const) {}
