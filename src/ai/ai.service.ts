import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  generateText,
  Output,
  NoObjectGeneratedError,
  LanguageModel,
} from 'ai';
import { createZhipu } from 'zhipu-ai-provider';
import { z } from 'zod';
import { Quiz, QuizSchema } from './dto/quiz.dto';

export class QuizGenerationError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
    public readonly rawText?: string,
  ) {
    super(message);
    this.name = 'QuizGenerationError';
  }
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly model: LanguageModel | null = null;
  private readonly isConfigured: boolean;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('ZHIPU_API_KEY');
    const baseURL = this.configService.get<string>(
      'ZHIPU_BASE_URL',
      'https://open.bigmodel.cn/api/paas/v4',
    );

    this.isConfigured = !!apiKey;

    if (apiKey) {
      const zhipuProvider = createZhipu({
        apiKey,
        baseURL,
      });
      this.model = zhipuProvider('glm-4.7');
      this.logger.log('智谱AI服务已配置');
    } else {
      this.logger.warn(
        'ZHIPU_API_KEY 未配置，AI功能将不可用。请在环境变量中设置 ZHIPU_API_KEY',
      );
    }
  }

  async generateQuiz(inputText: string): Promise<Quiz> {
    if (!this.isConfigured || !this.model) {
      throw new QuizGenerationError(
        'AI服务未配置，请设置 ZHIPU_API_KEY 环境变量',
      );
    }

    this.logger.log('开始生成测验题目...');

    if (!inputText || inputText.trim().length === 0) {
      throw new QuizGenerationError('输入文本不能为空');
    }

    const prompt = this.buildPrompt(inputText);

    try {
      const result = await generateText({
        model: this.model,
        output: Output.object({
          name: 'Quiz',
          description: '基于输入文本生成的测验题目',
          schema: QuizSchema,
        }),
        prompt,
      });

      this.logger.log('测验题目生成成功');
      return result.output;
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        this.logger.error(`生成结构化数据失败: ${error.message}`);
        throw new QuizGenerationError(
          'AI无法生成有效的测验题目，请检查输入文本内容',
          error.cause,
          error.text,
        );
      }

      this.logger.error(`生成测验题目时发生错误: ${error}`);
      throw new QuizGenerationError('生成测验题目失败，请稍后重试', error);
    }
  }

  private buildPrompt(inputText: string): string {
    return `# 角色定义
你是一位资深的教育测评专家，拥有丰富的试题编写经验。你擅长根据文本材料设计高质量、有区分度的选择题。

# 任务目标
根据提供的文本内容，生成一套完整的测验题目，包含5道单项选择题。

# 输出要求
你必须严格按照以下JSON Schema格式输出：

## 测验结构
- title: 测验标题，简洁概括文本主题（10-20字）
- questions: 包含恰好5道题目的数组

## 题目结构（每道题）
- questionText: 题目文字，表述清晰无歧义，避免双重否定
- correctAnswer: 正确答案标签（A/B/C/D）
- correctExplanation: 正确答案解析，需引用原文依据
- options: 4个选项数组，按A→B→C→D顺序排列

## 选项结构（每个选项）
- label: 选项标签（A/B/C/D）
- content: 选项内容，简洁明了
- isCorrect: 布尔值，每个题目仅一个为true
- explanation: 解析说明

# 出题原则
1. **知识点覆盖**: 5道题目应覆盖文本的核心知识点，避免重复
2. **难度梯度**: 包含简单题（直接考查）、中等题（理解应用）、较难题（综合分析）
3. **干扰项设计**: 错误选项应具有迷惑性，基于常见误解设计
4. **解析质量**: 
   - 正确答案解析需引用原文具体内容
   - 错误答案解析需指出错误原因和可能的认知误区
5. **表述规范**: 题目和选项表述准确、无歧义，避免使用"以上都对"等模糊表述

# 待分析文本
---
${inputText}
---

# 开始生成
请严格按照上述要求生成测验题目，确保JSON格式完全符合Schema定义：`;
  }
}
