import { Entity, PrimaryKey, Property, ManyToOne } from '@mikro-orm/core';
import { Schedule } from './schedule.entity';

@Entity({ tableName: 'schedule_attachments' })
export class ScheduleAttachment {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Schedule)
  schedule!: Schedule;

  @Property()
  fileName!: string;

  @Property()
  fileUrl!: string;

  @Property()
  fileSize!: number;

  @Property({ nullable: true })
  fileType?: string;

  @Property()
  uploadedAt: Date = new Date();
}
