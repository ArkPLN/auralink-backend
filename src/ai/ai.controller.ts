import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiBody,
} from '@nestjs/swagger';
import { AiService, QuizGenerationError } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  GenerateQuizDto,
  QuizResponseDto,
  AIProvider,
  type Quiz,
} from './dto/quiz.dto';

@ApiTags('AI模块')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('quiz')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({
    summary: '生成测验题目',
    description: `
根据输入的文本内容，使用 AI 自动生成指定数量的选择题。

**支持的 AI 提供商：**
- \`zhipu\` (默认): 智谱 AI，使用 glm-4.7 模型
- \`openai\`: OpenAI，使用 gpt-4o-mini 模型
- \`deepseek\`: DeepSeek，使用 deepseek-chat 模型

**API Key 优先级：**
1. 请求中提供的 \`apiKey\` 字段（用户自定义）
2. 服务端环境变量配置的默认 Key

**注意事项：**
- 输入文本至少 50 个字符
- 题目数量范围：1-5 道，默认 5 道
    `,
  })
  @ApiBody({
    description: '生成测验题目请求体',
    type: GenerateQuizDto,
    examples: {
      default: {
        summary: '使用默认配置',
        value: {
          inputText: 'TypeScript 是 JavaScript 的超集，增加了静态类型检查...',
          quizNums: 5,
        },
      },
      withCustomProvider: {
        summary: '指定 AI 提供商',
        value: {
          inputText: 'TypeScript 是 JavaScript 的超集，增加了静态类型检查...',
          quizNums: 5,
          provider: AIProvider.OPENAI,
        },
      },
      withCustomApiKey: {
        summary: '使用自定义 API Key',
        value: {
          inputText: 'TypeScript 是 JavaScript 的超集，增加了静态类型检查...',
          quizNums: 5,
          provider: AIProvider.DEEPSEEK,
          apiKey: 'sk-xxxxxxxxxxxxxxxx',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '测验题目生成成功',
    type: QuizResponseDto,
  })
  @ApiBadRequestResponse({
    description: '请求参数错误',
    schema: {
      examples: {
        emptyText: {
          summary: '输入文本为空',
          value: {
            statusCode: 400,
            message: '输入文本不能为空',
            error: 'Bad Request',
          },
        },
        invalidProvider: {
          summary: '不支持的提供商',
          value: {
            statusCode: 400,
            message: '不支持的 AI 提供商',
            error: 'Bad Request',
          },
        },
        providerNotConfigured: {
          summary: '提供商未配置',
          value: {
            statusCode: 400,
            message:
              'openai 服务未配置。请提供服务端配置 (OPENAI_API_KEY) 或在请求中提供自定义 apiKey',
            error: 'Bad Request',
          },
        },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'AI 服务内部错误',
    schema: {
      example: {
        statusCode: 500,
        message: '生成测验题目失败，请稍后重试',
        error: 'Internal Server Error',
      },
    },
  })
  async generateQuiz(@Body() dto: GenerateQuizDto): Promise<Quiz> {
    try {
      return await this.aiService.generateQuiz(dto);
    } catch (error) {
      if (error instanceof QuizGenerationError) {
        throw error;
      }
      throw error;
    }
  }
}
