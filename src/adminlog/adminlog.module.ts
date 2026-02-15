import { Module } from '@nestjs/common';
import { AdminlogService } from './adminlog.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AdminLog } from './entities/adminlog.entity';
import { User } from 'src/user/entities/user.entity';
import { AdminlogController, AdminUserController } from './adminlog.controller';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [MikroOrmModule.forFeature([AdminLog, User]), UserModule],
  controllers: [AdminlogController, AdminUserController],
  providers: [AdminlogService],
  exports: [AdminlogService],
})
export class AdminlogModule {}
