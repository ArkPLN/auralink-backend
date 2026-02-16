import { Module, forwardRef } from '@nestjs/common';
import { AdminlogService } from './adminlog.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AdminLog } from './entities/adminlog.entity';
import { User } from 'src/user/entities/user.entity';
import { AdminlogController } from './adminlog.controller';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([AdminLog, User]),
    forwardRef(() => UserModule),
  ],
  controllers: [AdminlogController],
  providers: [AdminlogService],
  exports: [AdminlogService],
})
export class AdminlogModule {}
