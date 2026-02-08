import { Injectable } from '@nestjs/common';

/**
 * 应用服务
 */
@Injectable()
export class AppService {
  /**
   * 获取Hello World消息
   * @returns Hello World消息字符串
   */
  getHello(): string {
    return 'Hello World!';
  }
}
