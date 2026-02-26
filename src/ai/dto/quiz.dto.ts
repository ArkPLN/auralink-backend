import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import z from 'zod';

// 支持的 AI 提供商枚举
export enum AIProvider {
  ZHIPU = 'zhipu',
  OPENAI = 'openai',
  DEEPSEEK = 'deepseek',
}

// 提供商到默认模型的映射
export const PROVIDER_DEFAULT_MODELS: Record<AIProvider, string> = {
  [AIProvider.ZHIPU]: 'glm-4.7',
  [AIProvider.OPENAI]: 'gpt-4o-mini',
  [AIProvider.DEEPSEEK]: 'deepseek-chat',
};

// 提供商到 API 基础 URL 的映射
export const PROVIDER_BASE_URLS: Record<AIProvider, string> = {
  [AIProvider.ZHIPU]: 'https://open.bigmodel.cn/api/paas/v4',
  [AIProvider.OPENAI]: 'https://api.openai.com/v1',
  [AIProvider.DEEPSEEK]: 'https://api.deepseek.com',
};

// 选项结构（每个选项）
const OptionSchema = z.object({
  label: z
    .enum(['A', 'B', 'C', 'D'])
    .describe('选项标签，必须是A、B、C、D中的一个'),
  content: z.string().describe('选项的具体文字内容，简洁明了'),
  isCorrect: z
    .boolean()
    .describe('该选项是否为正确答案，每个题目有且仅有一个正确答案'),
  explanation: z
    .string()
    .describe(
      '该选项的解析说明：正确答案说明为什么正确，错误答案说明为什么错误以及常见误解',
    ),
});

// 题目结构（每道题）
const QuestionSchema = z.object({
  questionText: z.string().describe('题目的完整文字内容，表述清晰、无歧义'),
  correctAnswer: z.enum(['A', 'B', 'C', 'D']).describe('正确答案的选项标签'),
  correctExplanation: z
    .string()
    .describe('正确答案的详细解析，解释为什么这个答案正确，引用原文依据'),
  options: z
    .array(OptionSchema)
    .length(4)
    .describe('四个选项，按A、B、C、D顺序排列'),
});

// 测验结构（整体）
export const QuizSchema = (quizNums: number) =>
  z.object({
    title: z.string().describe('测验标题，简洁概括文本主题'),
    questions: z
      .array(QuestionSchema)
      .length(quizNums ?? 5)
      .describe(`${quizNums ?? 5}道选择题，覆盖文本核心知识点`),
  });

// 导出类型声明
export type QuizOption = z.infer<typeof OptionSchema>;
export type QuizQuestion = z.infer<typeof QuestionSchema>;
export type Quiz = z.infer<ReturnType<typeof QuizSchema>>;

// 生成测验请求体
export class GenerateQuizDto {
  @ApiProperty({
    description: '输入文本内容，AI 将基于此生成测验题目',
    example: 'TypeScript 是 JavaScript 的超集，增加了静态类型检查...',
    minLength: 50,
    maxLength: 50000,
  })
  @IsString()
  @MinLength(50, { message: '输入文本至少需要 50 个字符' })
  @MaxLength(50000, { message: '输入文本不能超过 50000 个字符' })
  inputText: string;

  @ApiPropertyOptional({
    description: '生成的题目数量，默认为 5 道',
    default: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1, { message: '题目数量至少为 1' })
  @Max(5, { message: '题目数量最多为 5' })
  quizNums?: number;

  @ApiPropertyOptional({
    description: 'AI 模型提供商',
    enum: AIProvider,
    default: AIProvider.ZHIPU,
    example: AIProvider.ZHIPU,
  })
  @IsOptional()
  @IsEnum(AIProvider, { message: '不支持的 AI 提供商' })
  provider?: AIProvider;

  @ApiPropertyOptional({
    description: '自定义 API Key，如不提供则使用服务端配置的默认 Key',
    example: 'sk-xxxxxxxxxxxxxxxx',
  })
  @IsOptional()
  @IsString()
  apiKey?: string;
}

// 测验响应体
export class QuizResponseDto {
  @ApiProperty({ description: '测验标题' })
  title: string;

  @ApiProperty({
    description: '题目列表',
    type: 'array',
    example: [
      {
        questionText: 'TypeScript 相比 JavaScript 的主要特点是什么？',
        correctAnswer: 'A',
        correctExplanation:
          'TypeScript 是 JavaScript 的超集，增加了静态类型检查。',
        options: [
          {
            label: 'A',
            content: '增加了静态类型检查',
            isCorrect: true,
            explanation: '正确，静态类型检查是 TypeScript 的核心特性',
          },
          {
            label: 'B',
            content: '减少了代码量',
            isCorrect: false,
            explanation: '错误，TypeScript 通常会增加类型定义代码',
          },
          {
            label: 'C',
            content: '只能在浏览器运行',
            isCorrect: false,
            explanation: '错误，TypeScript 编译后可运行在任何 JavaScript 环境',
          },
          {
            label: 'D',
            content: '不需要编译',
            isCorrect: false,
            explanation: '错误，TypeScript 需要编译为 JavaScript 才能运行',
          },
        ],
      },
    ],
  })
  questions: Array<{
    questionText: string;
    correctAnswer: 'A' | 'B' | 'C' | 'D';
    correctExplanation: string;
    options: Array<{
      label: 'A' | 'B' | 'C' | 'D';
      content: string;
      isCorrect: boolean;
      explanation: string;
    }>;
  }>;
}
