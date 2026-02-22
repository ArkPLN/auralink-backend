import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3: S3Client;
  private readonly bucketName: string;
  private readonly publicUrl: string;
  // 从环境变量中获取 R2 配置
  constructor(private readonly configService: ConfigService) {
    // 对象存储配置
    const endpoint = this.configService.getOrThrow<string>('R2_ENDPOINT');
    // 访问密钥配置
    const accessKeyId =
      this.configService.getOrThrow<string>('R2_ACCESS_KEY_ID');
    // 密钥配置
    const secretAccessKey = this.configService.getOrThrow<string>(
      'R2_SECRET_ACCESS_KEY',
    );
    // 存储桶配置
    this.bucketName = this.configService.getOrThrow<string>('R2_BUCKET_NAME');
    // 公开 URL 配置
    this.publicUrl = this.configService.get<string>('R2_PUBLIC_URL', endpoint);
    // S3 客户端配置
    this.s3 = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  /**
   * 上传用户头像到 R2 存储桶
   * @param userId 用户 ID
   * @param file 上传的文件
   * @returns 公开 URL
   */
  async uploadAvatar(userId: number, file: Express.Multer.File) {
    if (!file) {
      throw new Error('文件不能为空');
    }

    if (file.mimetype !== 'image/jpeg' && file.mimetype !== 'image/png') {
      throw new Error('仅支持 JPEG 和 PNG 格式');
    }

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = file.mimetype.split('/')[1];
    const key = `avatars/${userId}_${timestamp}_${randomStr}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await this.s3.send(command);
    this.logger.log(`用户 ${userId} 头像上传成功: ${key}`);

    return `${this.publicUrl}/${key}`;
  }

  async deleteAvatar(avatarUrl: string): Promise<void> {
    if (!avatarUrl) {
      return;
    }

    try {
      const urlParts = avatarUrl.split('/');
      const key = urlParts.slice(urlParts.indexOf('avatars')).join('/');

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3.send(command);
      this.logger.log(`旧头像删除成功: ${key}`);
    } catch (error) {
      this.logger.error(`删除旧头像失败: ${error.message}`);
    }
  }
}
