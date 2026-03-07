import { Entity, PrimaryKey, Property, ManyToOne, Enum } from '@mikro-orm/core';
import { User } from '../../user/entities/user.entity';

export enum NotificationType {
  INVITATION = 'invitation',
  REMINDER = 'reminder',
  LEAVE = 'leave',
  CANCELLATION = 'cancellation',
  UPDATE = 'update',
}

@Entity({ tableName: 'schedule_notifications' })
export class ScheduleNotification {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => User)
  recipient!: User;

  @Enum({ items: () => NotificationType })
  type!: NotificationType;

  @Property()
  title!: string;

  @Property({ columnType: 'text' })
  content!: string;

  @Property({ nullable: true })
  relatedScheduleId?: number;

  @Property()
  isRead: boolean = false;

  @Property()
  createdAt: Date = new Date();
}
