import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserResponseDto } from '../../../user/dto/user-response.dto';
import { ScheduleStatus, ParticipantStatus } from '../../entities/schedule.entity';

export class AttachmentResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  fileName!: string;

  @ApiProperty()
  fileUrl!: string;

  @ApiProperty()
  fileSize!: number;

  @ApiPropertyOptional()
  fileType?: string;
}

export class ParticipantResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  user!: UserResponseDto;

  @ApiProperty({ enum: ParticipantStatus })
  status!: ParticipantStatus;

  @ApiPropertyOptional()
  leaveReason?: string;

  @ApiPropertyOptional()
  leaveTime?: Date;

  @ApiProperty()
  invitedAt!: Date;
}

export class ScheduleResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  location?: string;

  @ApiProperty()
  startTime!: Date;

  @ApiProperty()
  endTime!: Date;

  @ApiProperty()
  creator!: UserResponseDto;

  @ApiProperty({ enum: ScheduleStatus })
  status!: ScheduleStatus;

  @ApiPropertyOptional()
  maxParticipants?: number;

  @ApiProperty()
  currentParticipants!: number;

  @ApiProperty({ type: [AttachmentResponseDto] })
  attachments!: AttachmentResponseDto[];

  @ApiProperty({ type: [ParticipantResponseDto] })
  participants!: ParticipantResponseDto[];

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
