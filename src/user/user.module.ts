import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { User } from './entities/user.entity';
import { AdminlogModule } from '../adminlog/adminlog.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([User]),
    forwardRef(() => AdminlogModule),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
