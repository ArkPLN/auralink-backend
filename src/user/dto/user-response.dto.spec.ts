import { plainToInstance } from 'class-transformer';
import {
  PublicUserDto,
  MeResponseDto,
  AdminUserResponseDto,
} from './user-response.dto';
import { User } from '../entities/user.entity';

describe('User Response DTOs', () => {
  const mockUser: User = {
    id: 1,
    schoolId: '20230001',
    password: 'hashed_password',
    name: '张三',
    phone: '13800138000',
    email: 'zhangsan@example.com',
    department: '技术部',
    isActive: true,
    userRole: 'user',
    hashedRefreshToken: 'hashed_refresh_token',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
  } as User;

  describe('PublicUserDto', () => {
    it('应该正确转换并暴露指定字段', () => {
      const result = plainToInstance(PublicUserDto, mockUser, {
        excludeExtraneousValues: true,
      });

      // 验证字段存在
      expect(result.id).toBe(1);
      expect(result.schoolId).toBe('20230001');
      expect(result.name).toBe('张三');
      expect(result.phone).toBe('13800138000');
      expect(result.email).toBe('zhangsan@example.com');
      expect(result.department).toBe('技术部');
      expect(result.isActive).toBe(true);
      expect(result.userRole).toBe('user');

      // 验证敏感字段被排除
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('hashedRefreshToken');
      expect(result).not.toHaveProperty('createdAt');
      expect(result).not.toHaveProperty('updatedAt');
    });

    it('不应该返回空对象', () => {
      const result = plainToInstance(PublicUserDto, mockUser, {
        excludeExtraneousValues: true,
      });

      // 关键测试：确保不是空对象
      expect(Object.keys(result)).not.toHaveLength(0);
      expect(Object.keys(result)).toHaveLength(8);
    });
  });

  describe('MeResponseDto', () => {
    it('应该正确转换并暴露指定字段', () => {
      const result = plainToInstance(MeResponseDto, mockUser, {
        excludeExtraneousValues: true,
      });

      // 验证字段存在
      expect(result.id).toBe(1);
      expect(result.schoolId).toBe('20230001');
      expect(result.name).toBe('张三');
      expect(result.phone).toBe('13800138000');
      expect(result.email).toBe('zhangsan@example.com');
      expect(result.department).toBe('技术部');
      expect(result.isActive).toBe(true);
      expect(result.userRole).toBe('user');

      // 验证敏感字段和时间戳被排除
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('hashedRefreshToken');
      expect(result).not.toHaveProperty('createdAt');
      expect(result).not.toHaveProperty('updatedAt');
    });

    it('不应该返回空对象', () => {
      const result = plainToInstance(MeResponseDto, mockUser, {
        excludeExtraneousValues: true,
      });

      expect(Object.keys(result)).not.toHaveLength(0);
      expect(Object.keys(result)).toHaveLength(8);
    });
  });

  describe('AdminUserResponseDto', () => {
    it('应该正确转换并暴露指定字段', () => {
      const result = plainToInstance(AdminUserResponseDto, mockUser, {
        excludeExtraneousValues: true,
      });

      // 验证字段存在（包括时间戳）
      expect(result.id).toBe(1);
      expect(result.schoolId).toBe('20230001');
      expect(result.name).toBe('张三');
      expect(result.phone).toBe('13800138000');
      expect(result.email).toBe('zhangsan@example.com');
      expect(result.department).toBe('技术部');
      expect(result.isActive).toBe(true);
      expect(result.userRole).toBe('user');
      expect(result.createdAt).toEqual(new Date('2024-01-01'));
      expect(result.updatedAt).toEqual(new Date('2024-01-02'));

      // 验证敏感字段被排除
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('hashedRefreshToken');
    });

    it('不应该返回空对象', () => {
      const result = plainToInstance(AdminUserResponseDto, mockUser, {
        excludeExtraneousValues: true,
      });

      expect(Object.keys(result)).not.toHaveLength(0);
      expect(Object.keys(result)).toHaveLength(10);
    });
  });

  describe('批量转换测试', () => {
    it('应该正确处理用户数组', () => {
      const mockUsers = [mockUser, { ...mockUser, id: 2, name: '李四' }];

      const results = plainToInstance(PublicUserDto, mockUsers, {
        excludeExtraneousValues: true,
      });

      expect(results).toHaveLength(2);
      expect(results[0].name).toBe('张三');
      expect(results[1].name).toBe('李四');

      // 确保每个对象都不是空的
      results.forEach((user) => {
        expect(Object.keys(user)).not.toHaveLength(0);
      });
    });
  });
});
