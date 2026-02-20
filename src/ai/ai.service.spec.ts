import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AiService, QuizGenerationError } from './ai.service';

describe('AiService', () => {
  let service: AiService;

  const mockConfigService = {
    getOrThrow: jest.fn().mockReturnValue('test-api-key'),
    get: jest.fn().mockReturnValue('https://open.bigmodel.cn/api/paas/v4'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateQuiz', () => {
    it('should throw QuizGenerationError when input text is empty', async () => {
      await expect(service.generateQuiz('')).rejects.toThrow(
        QuizGenerationError,
      );
      await expect(service.generateQuiz('')).rejects.toThrow(
        '输入文本不能为空',
      );
    });

    it('should throw QuizGenerationError when input text is only whitespace', async () => {
      await expect(service.generateQuiz('   ')).rejects.toThrow(
        QuizGenerationError,
      );
      await expect(service.generateQuiz('   ')).rejects.toThrow(
        '输入文本不能为空',
      );
    });
  });

  describe('buildPrompt', () => {
    it('should include input text in prompt', () => {
      const inputText = '这是一段测试文本';
      const prompt = (service as any).buildPrompt(inputText);

      expect(prompt).toContain(inputText);
      expect(prompt).toContain('5道');
      expect(prompt).toContain('A、B、C、D');
    });
  });
});
