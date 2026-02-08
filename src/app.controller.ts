import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * 获取Hello World消息
   * @returns Hello World消息字符串
   */
  @Get('/hi')
  getHello(): string {
    return this.appService.getHello();
  }

  /**
   * 获取测试消息
   * @returns 测试消息字符串
   */
  @Get('/guard')
  @UseGuards(JwtAuthGuard)
  getTest(): string {
    return 'If you see this, you have passed the guard!';
  }
}
