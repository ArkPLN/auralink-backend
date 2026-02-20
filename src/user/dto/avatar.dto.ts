import { ApiProperty } from '@nestjs/swagger';

export class AvatarUploadResponseDto {
  @ApiProperty({
    description: '操作结果状态',
    example: 'success',
  })
  status: string;

  @ApiProperty({
    description: '新头像URL',
    example: 'https://example.com/avatars/1_1234567890_abc123.jpg',
  })
  avatarUrl: string;

  @ApiProperty({
    description: '响应消息',
    example: '头像上传成功',
  })
  message: string;

  @ApiProperty({
    description: '文件大小（字节）',
    example: 102400,
  })
  fileSize: number;

  @ApiProperty({
    description: '文件类型',
    example: 'image/jpeg',
  })
  mimeType: string;
}
