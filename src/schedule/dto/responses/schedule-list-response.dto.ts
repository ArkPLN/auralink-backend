import { ApiProperty } from '@nestjs/swagger';
import { ScheduleResponseDto } from './schedule-response.dto';

export class ScheduleListResponseDto {
  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;

  @ApiProperty({ type: [ScheduleResponseDto] })
  items!: ScheduleResponseDto[];
}
