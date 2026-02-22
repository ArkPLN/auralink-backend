import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { User } from './entities/user.entity';
import { AdminlogModule } from '../adminlog/adminlog.module';
import { S3Module } from '../s3/s3.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([User]),
    forwardRef(() => AdminlogModule),
    S3Module,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
