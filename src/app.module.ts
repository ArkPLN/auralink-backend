import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { defineConfig, PostgreSqlDriver } from '@mikro-orm/postgresql';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { AdminlogModule } from './adminlog/adminlog.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { S3Module } from './s3/s3.module';
import { AiModule } from './ai/ai.module';
import { ScheduleModule } from './schedule/schedule.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    MikroOrmModule.forRootAsync({
      inject: [ConfigService],
      // 【修复关键】：driver 必须放在这里，作为 forRootAsync 的直接属性！
      driver: PostgreSqlDriver,
      useFactory: (configService: ConfigService) => {
        // defineConfig 内部不再需要写 driver，它会自动推断
        return defineConfig({
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 5432),
          user: configService.get<string>('DB_USERNAME', 'postgres'),
          password: configService.get<string>('DB_PASSWORD', 'pgsql'),
          dbName: configService.get<string>('DB_DATABASE', 'postgres'),
          entities: ['dist/**/*.entity.js'],
          entitiesTs: ['src/**/*.entity.ts'],
          debug: configService.get<string>('DB_LOGGING') === 'true',
        });
      },
    }),
    UserModule,
    AuthModule,
    AdminlogModule,
    S3Module,
    AiModule,
    ScheduleModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
  ],
})
export class AppModule {}
