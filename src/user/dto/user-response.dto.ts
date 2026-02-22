import { ApiProperty, OmitType, PickType } from '@nestjs/swagger';
import { User } from '../entities/user.entity';

export class MeResponseDto extends OmitType(User, [
  'password',
  'hashedRefreshToken',
  'createdAt',
  'updatedAt',
] as const) {}

export class UserResponseDto extends OmitType(User, [
  'password',
  'hashedRefreshToken',
] as const) {}

export class UserListResponseDto {
  @ApiProperty({ description: '用户列表', type: [UserResponseDto] })
  users: UserResponseDto[];

  @ApiProperty({ description: '总数', example: 10 })
  total: number;
}
