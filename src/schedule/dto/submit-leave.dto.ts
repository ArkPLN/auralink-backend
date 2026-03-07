import { IsString, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitLeaveDto {
  @ApiProperty({ description: '请假原因', example: '临时有事，无法参加' })
  @IsString()
  reason!: string;
}
