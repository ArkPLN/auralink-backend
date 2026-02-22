import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('应用测试模块')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * 获取Hello World消息
   * @returns Hello World消息字符串
   */
  @ApiOperation({ summary: '获取Hello World消息' })
  @ApiResponse({ status: 200, description: '返回Hello World消息' })
  @Get('/hi')
  getHello(): string {
    return this.appService.getHello();
  }

  /**
   * 获取测试消息
   * @returns 测试消息字符串`If you see this, you have passed the guard!`
   */
  @ApiOperation({ summary: '获取测试消息' })
  @ApiResponse({ status: 200, description: '返回测试消息' })
  @ApiBearerAuth()
  @Get('/guard')
  @UseGuards(JwtAuthGuard)
  getTest(): string {
    return 'If you see this, you have passed the guard!';
  }
}
