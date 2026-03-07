import { Module } from '@nestjs/common';

import { ScheduleController } from './schedule.controller';
import { ScheduleService } from './schedule.service';
import { UserModule } from '../user/user.module';
import { S3Module } from '../s3/s3.module';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Schedule, ScheduleParticipant } from './entities/schedule.entity';
import { ScheduleNotification } from './entities/schedule-notification.entity';
import { ScheduleAttachment } from './entities/schedule-attachment.entity';

@Module({
  imports: [
    UserModule,
    S3Module,
    MikroOrmModule.forFeature([
      Schedule,
      ScheduleNotification,
      ScheduleAttachment,
      ScheduleParticipant,
    ]),
  ],
  controllers: [ScheduleController],
  providers: [ScheduleService],
  exports: [ScheduleService],
})
export class ScheduleModule {}
