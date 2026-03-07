import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '../../entities/schedule-notification.entity';

export class NotificationResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  recipientId!: number;

  @ApiProperty({ enum: NotificationType })
  type!: NotificationType;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  content!: string;

  @ApiPropertyOptional()
  relatedScheduleId?: number;

  @ApiProperty()
  isRead!: boolean;

  @ApiProperty()
  createdAt!: Date;
}

export class NotificationListResponseDto {
  @ApiProperty()
  total!: number;

  @ApiProperty({ type: [NotificationResponseDto] })
  notifications!: NotificationResponseDto[];

  @ApiProperty()
  unreadCount!: number;
}
