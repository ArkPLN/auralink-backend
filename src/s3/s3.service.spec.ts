import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { S3Service } from './s3.service';

jest.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: jest.fn().mockImplementation(() => ({
      send: jest.fn().mockResolvedValue({}),
      config: {
        endpoint: 'https://test-account.r2.cloudflarestorage.com',
      },
    })),
    PutObjectCommand: jest.fn(),
  };
});

describe('S3Service', () => {
  let service: S3Service;
  let mockS3Client: jest.Mocked<S3Client>;

  const mockConfigService = {
    getOrThrow: jest.fn((key: string) => {
      const config: Record<string, string> = {
        R2_ENDPOINT: 'https://test-account.r2.cloudflarestorage.com',
        R2_ACCESS_KEY_ID: 'test-access-key-id',
        R2_SECRET_ACCESS_KEY: 'test-secret-access-key',
        R2_BUCKET_NAME: 'test-bucket',
      };
      const value = config[key];
      if (!value) {
        throw new Error(`Missing required config: ${key}`);
      }
      return value;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3Service,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<S3Service>(S3Service);
    mockS3Client = (S3Client as jest.Mock).mock.results[0].value;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize S3 client with correct config', () => {
    expect(mockConfigService.getOrThrow).toHaveBeenCalledWith('R2_ENDPOINT');
    expect(mockConfigService.getOrThrow).toHaveBeenCalledWith('R2_ACCESS_KEY_ID');
    expect(mockConfigService.getOrThrow).toHaveBeenCalledWith('R2_SECRET_ACCESS_KEY');
    expect(mockConfigService.getOrThrow).toHaveBeenCalledWith('R2_BUCKET_NAME');
  });

  it('should create S3Client with correct configuration', () => {
    expect(S3Client).toHaveBeenCalledWith({
      region: 'auto',
      endpoint: 'https://test-account.r2.cloudflarestorage.com',
      credentials: {
        accessKeyId: 'test-access-key-id',
        secretAccessKey: 'test-secret-access-key',
      },
    });
  });

  describe('uploadAvatar', () => {
    it('should throw error when file is null', async () => {
      await expect(service.uploadAvatar(1, null as any)).rejects.toThrow('文件不能为空');
    });

    it('should throw error when file is undefined', async () => {
      await expect(service.uploadAvatar(1, undefined as any)).rejects.toThrow('文件不能为空');
    });

    it('should throw error for unsupported file type', async () => {
      const mockFile = {
        buffer: Buffer.from('test'),
        mimetype: 'image/gif',
        originalname: 'test.gif',
      } as Express.Multer.File;

      await expect(service.uploadAvatar(1, mockFile)).rejects.toThrow('仅支持 JPEG 和 PNG 格式');
    });

    it('should upload JPEG file successfully', async () => {
      const mockFile = {
        buffer: Buffer.from('test jpeg content'),
        mimetype: 'image/jpeg',
        originalname: 'avatar.jpg',
        size: 1024,
      } as Express.Multer.File;

      const result = await service.uploadAvatar(123, mockFile);

      expect(mockS3Client.send).toHaveBeenCalled();
      expect(PutObjectCommand).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: 'avatars/123.jpeg',
        Body: mockFile.buffer,
        ContentType: 'image/jpeg',
      });
      expect(result).toContain('avatars/123.jpeg');
    });

    it('should upload PNG file successfully', async () => {
      const mockFile = {
        buffer: Buffer.from('test png content'),
        mimetype: 'image/png',
        originalname: 'avatar.png',
        size: 2048,
      } as Express.Multer.File;

      const result = await service.uploadAvatar(456, mockFile);

      expect(mockS3Client.send).toHaveBeenCalled();
      expect(PutObjectCommand).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: 'avatars/456.png',
        Body: mockFile.buffer,
        ContentType: 'image/png',
      });
      expect(result).toContain('avatars/456.png');
    });
  });
});
