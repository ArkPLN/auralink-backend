import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
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
import { Quiz } from './dto/quiz.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GenerateQuizDto, QuizResponseDto } from './dto/quiz.dto';

@ApiTags('AI模块')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('quiz')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '生成测验题目',
    description:
      '根据输入的文本内容，使用AI自动生成指定数量（默认5道）选择题，每题包含正确答案和详细解析。',
  })
  @ApiBody({
    description: '生成测验题目请求体',
    type: GenerateQuizDto,
  })
  @ApiResponse({
    status: 200,
    description: '测验题目生成成功',
    type: QuizResponseDto,
  })
  @ApiBadRequestResponse({
    description: '请求参数错误',
    schema: {
      example: {
        statusCode: 400,
        message: '输入文本不能为空',
        error: 'Bad Request',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'AI服务内部错误',
    schema: {
      example: {
        statusCode: 500,
        message: '生成测验题目失败，请稍后重试',
        error: 'Internal Server Error',
      },
    },
  })
  async generateQuiz(@Body() dto: GenerateQuizDto): Promise<Quiz> {
    return this.aiService.generateQuiz(dto);
  }
}
