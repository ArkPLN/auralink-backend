import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  Enum,
  OneToMany,
  Collection,
  Unique,
} from '@mikro-orm/core';
import { User } from '../../user/entities/user.entity';
import type { ScheduleAttachment } from './schedule-attachment.entity';

export enum ScheduleStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

@Entity({ tableName: 'schedules' })
export class Schedule {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @Property({ columnType: 'text', nullable: true })
  description?: string;

  @Property({ nullable: true })
  location?: string;

  @Property()
  startTime!: Date;

  @Property()
  endTime!: Date;

  @ManyToOne(() => User)
  creator!: User;

  @Enum({ items: () => ScheduleStatus })
  status: ScheduleStatus = ScheduleStatus.ACTIVE;

  @Property({ nullable: true })
  maxParticipants?: number;

  @OneToMany(() => ScheduleParticipant, (participant) => participant.schedule)
  participants = new Collection<ScheduleParticipant>(this);

  @OneToMany('ScheduleAttachment', (attachment: any) => attachment.schedule)
  attachments = new Collection<ScheduleAttachment>(this);

  @Property()
  createdAt: Date = new Date();

  @Property()
  updatedAt: Date = new Date();
}

@Entity({ tableName: 'schedule_participants' })
export class ScheduleParticipant {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Schedule)
  schedule!: Schedule;

  @ManyToOne(() => User)
  user!: User;

  @Enum({ items: () => ParticipantStatus })
  status: ParticipantStatus = ParticipantStatus.INVITED;

  @Property({ columnType: 'text', nullable: true })
  leaveReason?: string;

  @Property({ nullable: true })
  leaveTime?: Date;

  @Property()
  invitedAt: Date = new Date();

  @Unique({ properties: ['schedule', 'user'] })
  __uniqueConstraintMarker?: any;
}

export enum ParticipantStatus {
  INVITED = 'invited',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  LEAVE = 'leave',
}
