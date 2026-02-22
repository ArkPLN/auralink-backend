import { Entity, PrimaryKey, Property, ManyToOne, Enum } from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../user/entities/user.entity';

// 操作类型枚举
export enum AdminActionType {
  UPDATE_INFO = 'update_info', // 修改基础信息
  CHANGE_ROLE = 'change_role', // 角色/权限变更
  TOGGLE_STATUS = 'toggle_status', // 启用/禁用账号
  BATCH_UPDATE = 'batch_update', // 批量操作
  RESET_PASSWORD = 'reset_password', // 重置密码
}

@Entity({ tableName: 'admin_logs' })
export class AdminLog {
  @PrimaryKey()
  id!: number;

  // 关联操作人
  @ApiProperty({ description: '操作人ID' })
  @ManyToOne(() => User)
  operator!: User;

  // 关联被操作人 (批量时可能为空，通过details查询)
  @ApiProperty({ description: '被操作用户ID', required: false })
  @ManyToOne(() => User, { nullable: true })
  target?: User;

  @ApiProperty({ description: '操作类型', enum: AdminActionType })
  @Enum({ items: () => AdminActionType })
  actionType!: AdminActionType;

  @ApiProperty({ description: '被修改的字段名', example: 'userRole' })
  @Property({ nullable: true })
  fieldName?: string;

  @ApiProperty({ description: '修改前的值', example: 'user' })
  @Property({ type: 'text', nullable: true })
  oldValue?: string;

  @ApiProperty({ description: '修改后的值', example: 'admin' })
  @Property({ type: 'text', nullable: true })
  newValue?: string;

  @ApiProperty({ description: '详情/备注，如批量操作ID列表', required: false })
  @Property({ type: 'text', nullable: true })
  details?: string;

  @ApiProperty({ description: '操作IP地址' })
  @Property({ length: 45 })
  ipAddress!: string;

  @ApiProperty({ description: '操作时间' })
  @Property({ defaultRaw: 'CURRENT_TIMESTAMP' })
  createdAt: Date = new Date();
}
