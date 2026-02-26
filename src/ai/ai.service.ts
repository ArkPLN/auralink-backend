import {
  Injectable,
  Logger,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateText, Output, NoObjectGeneratedError } from 'ai';
import type { LanguageModel } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createZhipu } from 'zhipu-ai-provider';
import z from 'zod';
import {
  GenerateQuizDto,
  Quiz,
  QuizSchema,
  AIProvider,
  PROVIDER_DEFAULT_MODELS,
  PROVIDER_BASE_URLS,
} from './dto/quiz.dto';

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

// 提供商能力配置
const PROVIDER_CAPABILITIES: Record<
  AIProvider,
  { supportsStructuredOutput: boolean }
> = {
  [AIProvider.ZHIPU]: { supportsStructuredOutput: true },
  [AIProvider.OPENAI]: { supportsStructuredOutput: true },
  [AIProvider.DEEPSEEK]: { supportsStructuredOutput: false }, // DeepSeek 不支持 json_schema
};

@Injectable()
export class AiService implements OnModuleInit {
  private readonly logger = new Logger(AiService.name);
  // 存储默认配置的模型实例
  private readonly defaultModels: Map<AIProvider, LanguageModel> = new Map();
  private readonly isConfigured: Map<AIProvider, boolean> = new Map();

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.initializeDefaultProviders();
  }

  /**
   * 初始化默认配置的 AI 提供商
   */
  private initializeDefaultProviders(): void {
    this.logger.log('开始初始化 AI 提供商...');

    // 初始化智谱 AI
    const zhipuApiKey = this.configService.get<string>('ZHIPU_API_KEY');
    if (zhipuApiKey) {
      const zhipu = createZhipu({
        apiKey: zhipuApiKey,
        baseURL: this.configService.get<string>(
          'ZHIPU_BASE_URL',
          PROVIDER_BASE_URLS[AIProvider.ZHIPU],
        ),
      });
      this.defaultModels.set(
        AIProvider.ZHIPU,
        zhipu(PROVIDER_DEFAULT_MODELS[AIProvider.ZHIPU]),
      );
      this.isConfigured.set(AIProvider.ZHIPU, true);
      this.logger.log(
        `[初始化] 智谱AI服务已配置 (模型: ${PROVIDER_DEFAULT_MODELS[AIProvider.ZHIPU]}, 结构化输出: 支持)`,
      );
    } else {
      this.isConfigured.set(AIProvider.ZHIPU, false);
      this.logger.warn('[初始化] ZHIPU_API_KEY 未配置');
    }

    // 初始化 OpenAI
    const openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (openaiApiKey) {
      const openai = createOpenAI({
        apiKey: openaiApiKey,
        baseURL: this.configService.get<string>('OPENAI_BASE_URL'),
      });
      this.defaultModels.set(
        AIProvider.OPENAI,
        openai(PROVIDER_DEFAULT_MODELS[AIProvider.OPENAI]),
      );
      this.isConfigured.set(AIProvider.OPENAI, true);
      this.logger.log(
        `[初始化] OpenAI服务已配置 (模型: ${PROVIDER_DEFAULT_MODELS[AIProvider.OPENAI]}, 结构化输出: 支持)`,
      );
    } else {
      this.isConfigured.set(AIProvider.OPENAI, false);
      this.logger.debug('[初始化] OPENAI_API_KEY 未配置');
    }

    // 初始化 DeepSeek (使用 OpenAI 兼容接口 - Chat Completions API)
    const deepseekApiKey = this.configService.get<string>('DEEPSEEK_API_KEY');
    if (deepseekApiKey) {
      const deepseek = createOpenAI({
        apiKey: deepseekApiKey,
        baseURL: this.configService.get<string>(
          'DEEPSEEK_BASE_URL',
          PROVIDER_BASE_URLS[AIProvider.DEEPSEEK],
        ),
      });
      this.defaultModels.set(
        AIProvider.DEEPSEEK,
        deepseek.chat(PROVIDER_DEFAULT_MODELS[AIProvider.DEEPSEEK]),
      );
      this.isConfigured.set(AIProvider.DEEPSEEK, true);
      this.logger.log(
        `[初始化] DeepSeek服务已配置 (模型: ${PROVIDER_DEFAULT_MODELS[AIProvider.DEEPSEEK]}, 结构化输出: 不支持, 使用JSON模式)`,
      );
    } else {
      this.isConfigured.set(AIProvider.DEEPSEEK, false);
      this.logger.debug('[初始化] DEEPSEEK_API_KEY 未配置');
    }

    this.logger.log(
      `[初始化] AI 提供商初始化完成，已配置: ${
        Array.from(this.isConfigured.entries())
          .filter(([, v]) => v)
          .map(([k]) => k)
          .join(', ') || '无'
      }`,
    );
  }

  /**
   * 获取或创建模型实例
   * 如果用户提供了自定义 API Key，则创建临时实例；否则使用默认配置
   */
  private getModel(dto: GenerateQuizDto): LanguageModel {
    const provider = dto.provider ?? AIProvider.ZHIPU;
    const customApiKey = dto.apiKey;

    // 用户提供了自定义 API Key，创建临时模型实例
    if (customApiKey) {
      this.logger.log(
        `[模型选择] 使用用户提供的 API Key 创建 ${provider} 模型实例`,
      );
      return this.createModelWithApiKey(provider, customApiKey);
    }

    // 使用默认配置的模型
    const defaultModel = this.defaultModels.get(provider);
    if (!defaultModel || !this.isConfigured.get(provider)) {
      const envKeyName = this.getEnvKeyName(provider);
      this.logger.warn(`[模型选择] ${provider} 服务未配置 (${envKeyName})`);
      throw new BadRequestException(
        `${provider} 服务未配置。请提供服务端配置 (${envKeyName}) 或在请求中提供自定义 apiKey`,
      );
    }

    this.logger.log(`[模型选择] 使用默认配置的 ${provider} 模型`);
    return defaultModel;
  }

  /**
   * 使用自定义 API Key 创建模型实例
   */
  private createModelWithApiKey(
    provider: AIProvider,
    apiKey: string,
  ): LanguageModel {
    const maskedKey = `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`;
    this.logger.debug(
      `[模型创建] 为 ${provider} 创建临时模型实例 (API Key: ${maskedKey})`,
    );

    switch (provider) {
      case AIProvider.ZHIPU: {
        const zhipu = createZhipu({
          apiKey,
          baseURL: PROVIDER_BASE_URLS[AIProvider.ZHIPU],
        });
        return zhipu(PROVIDER_DEFAULT_MODELS[AIProvider.ZHIPU]);
      }

      case AIProvider.OPENAI: {
        const openai = createOpenAI({
          apiKey,
        });
        return openai(PROVIDER_DEFAULT_MODELS[AIProvider.OPENAI]);
      }

      case AIProvider.DEEPSEEK: {
        const deepseek = createOpenAI({
          apiKey,
          baseURL: PROVIDER_BASE_URLS[AIProvider.DEEPSEEK],
        });
        return deepseek.chat(PROVIDER_DEFAULT_MODELS[AIProvider.DEEPSEEK]);
      }

      default:
        throw new BadRequestException(`不支持的 AI 提供商: ${provider}`);
    }
  }

  /**
   * 获取环境变量名称提示
   */
  private getEnvKeyName(provider: AIProvider): string {
    const envKeyMap: Record<AIProvider, string> = {
      [AIProvider.ZHIPU]: 'ZHIPU_API_KEY',
      [AIProvider.OPENAI]: 'OPENAI_API_KEY',
      [AIProvider.DEEPSEEK]: 'DEEPSEEK_API_KEY',
    };
    return envKeyMap[provider];
  }

  /**
   * 检查提供商是否支持结构化输出
   */
  private supportsStructuredOutput(provider: AIProvider): boolean {
    return PROVIDER_CAPABILITIES[provider]?.supportsStructuredOutput ?? false;
  }

  async generateQuiz(dto: GenerateQuizDto): Promise<Quiz> {
    const { inputText, quizNums } = dto;
    const provider = dto.provider ?? AIProvider.ZHIPU;
    const quizCount = quizNums ?? 5;
    const startTime = Date.now();

    this.logger.log(
      `[请求开始] 提供商: ${provider}, 题目数: ${quizCount}, 输入文本长度: ${inputText.length} 字符, 使用自定义Key: ${dto.apiKey ? '是' : '否'}`,
    );

    if (!inputText || inputText.trim().length === 0) {
      this.logger.warn('[请求失败] 输入文本为空');
      throw new BadRequestException('输入文本不能为空');
    }

    const model = this.getModel(dto);
    const schema = QuizSchema(quizCount);
    const useStructuredOutput = this.supportsStructuredOutput(provider);

    this.logger.log(
      `[生成策略] ${provider} ${useStructuredOutput ? '支持结构化输出 (JSON Schema)' : '使用 JSON 模式 (手动解析)'}`,
    );

    try {
      let result: Quiz;

      if (useStructuredOutput) {
        result = await this.generateWithStructuredOutput(
          model,
          schema,
          inputText,
          quizCount,
          provider,
        );
      } else {
        result = await this.generateWithJsonMode(
          model,
          schema,
          inputText,
          quizCount,
          provider,
        );
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `[请求成功] 提供商: ${provider}, 题目数: ${result.questions?.length || quizCount}, 耗时: ${duration}ms`,
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      if (NoObjectGeneratedError.isInstance(error)) {
        this.logger.error(
          `[请求失败] 结构化数据生成失败 - 提供商: ${provider}, 耗时: ${duration}ms, 错误: ${error.message}`,
        );
        throw new QuizGenerationError(
          'AI无法生成有效的测验题目，请检查输入文本内容',
          error.cause,
          error.text,
        );
      }

      this.logger.error(
        `[请求失败] 提供商: ${provider}, 耗时: ${duration}ms, 错误类型: ${error?.constructor?.name || 'Unknown'}, 错误信息: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new QuizGenerationError('生成测验题目失败，请稍后重试', error);
    }
  }

  /**
   * 使用结构化输出（JSON Schema）生成测验
   * 适用于: Zhipu, OpenAI
   */
  private async generateWithStructuredOutput(
    model: LanguageModel,
    schema: z.ZodType<Quiz>,
    inputText: string,
    quizCount: number,
    provider: AIProvider,
  ): Promise<Quiz> {
    const startTime = Date.now();
    this.logger.debug(`[API调用] ${provider} - 开始结构化输出请求`);

    const prompt = this.buildPrompt(inputText, quizCount);
    this.logger.debug(
      `[API调用] ${provider} - Prompt长度: ${prompt.length} 字符`,
    );

    const result = await generateText({
      model,
      output: Output.object({
        name: 'Quiz',
        description: '基于输入文本生成的测验题目',
        schema,
      }),
      prompt,
    });

    this.logger.debug(
      `[API调用] ${provider} - 结构化输出请求完成, 耗时: ${Date.now() - startTime}ms`,
    );

    return result.output as Quiz;
  }

  /**
   * 使用 JSON 模式生成测验（手动解析 + 验证）
   * 适用于: DeepSeek（不支持 json_schema，但支持 json_object）
   */
  private async generateWithJsonMode(
    model: LanguageModel,
    schema: z.ZodType<Quiz>,
    inputText: string,
    quizCount: number,
    provider: AIProvider,
  ): Promise<Quiz> {
    const startTime = Date.now();
    this.logger.debug(`[API调用] ${provider} - 开始 JSON 模式请求`);

    const jsonSchemaDescription = this.buildJsonSchemaDescription(quizCount);
    const prompt = this.buildPromptForJsonMode(
      inputText,
      quizCount,
      jsonSchemaDescription,
    );
    this.logger.debug(
      `[API调用] ${provider} - Prompt长度: ${prompt.length} 字符`,
    );

    const result = await generateText({
      model,
      prompt,
    });

    this.logger.debug(
      `[API调用] ${provider} - API请求完成, 耗时: ${Date.now() - startTime}ms, 响应长度: ${result.text.length} 字符`,
    );

    // 解析 JSON
    let parsed: unknown;
    try {
      // 清理可能的 markdown 代码块标记
      let text = result.text.trim();
      this.logger.debug(
        `[JSON解析] ${provider} - 原始响应前100字符: ${text.slice(0, 100)}...`,
      );

      if (text.startsWith('```json')) {
        text = text.slice(7);
      } else if (text.startsWith('```')) {
        text = text.slice(3);
      }
      if (text.endsWith('```')) {
        text = text.slice(0, -3);
      }
      text = text.trim();

      parsed = JSON.parse(text);
      this.logger.debug(`[JSON解析] ${provider} - JSON解析成功`);
    } catch (parseError) {
      this.logger.error(
        `[JSON解析] ${provider} - JSON解析失败: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
      );
      throw new QuizGenerationError(
        'AI 返回的数据格式无效，请重试',
        parseError,
        result.text,
      );
    }

    // Zod 验证
    const validationResult = schema.safeParse(parsed);
    if (!validationResult.success) {
      const errorDetails = validationResult.error.issues
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join('; ');
      this.logger.error(
        `[Zod验证] ${provider} - 数据验证失败: ${errorDetails}`,
      );
      throw new QuizGenerationError(
        `AI 返回的数据结构不符合要求: ${errorDetails}`,
        validationResult.error,
        result.text,
      );
    }

    this.logger.debug(`[Zod验证] ${provider} - 数据验证通过`);
    return validationResult.data;
  }

  /**
   * 构建 JSON Schema 描述（用于不支持结构化输出的提供商）
   */
  private buildJsonSchemaDescription(quizCount: number): string {
    return JSON.stringify(
      {
        type: 'object',
        required: ['title', 'questions'],
        properties: {
          title: { type: 'string', description: '测验标题，简洁概括文本主题' },
          questions: {
            type: 'array',
            minItems: quizCount,
            maxItems: quizCount,
            items: {
              type: 'object',
              required: [
                'questionText',
                'correctAnswer',
                'correctExplanation',
                'options',
              ],
              properties: {
                questionText: {
                  type: 'string',
                  description: '题目的完整文字内容',
                },
                correctAnswer: {
                  type: 'string',
                  enum: ['A', 'B', 'C', 'D'],
                  description: '正确答案的选项标签',
                },
                correctExplanation: {
                  type: 'string',
                  description: '正确答案的详细解析',
                },
                options: {
                  type: 'array',
                  minItems: 4,
                  maxItems: 4,
                  items: {
                    type: 'object',
                    required: ['label', 'content', 'isCorrect', 'explanation'],
                    properties: {
                      label: { type: 'string', enum: ['A', 'B', 'C', 'D'] },
                      content: { type: 'string' },
                      isCorrect: { type: 'boolean' },
                      explanation: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      null,
      2,
    );
  }

  /**
   * 为 JSON 模式构建 prompt
   */
  private buildPromptForJsonMode(
    inputText: string,
    quizCount: number,
    schema: string,
  ): string {
    return `你是一位资深的教育测评专家。请根据提供的文本内容，生成 ${quizCount} 道单项选择题。

## 输出格式要求
你必须严格按照以下 JSON 格式输出，不要包含任何其他文字、代码块标记或解释：

\`\`\`json
${schema}
\`\`\`

## 出题原则
1. 知识点覆盖: ${quizCount} 道题目应覆盖文本的核心知识点
2. 难度梯度: 包含简单题、中等题、较难题
3. 干扰项设计: 错误选项应具有迷惑性
4. 解析质量: 解析需引用原文依据

## 待分析文本
---
${inputText}
---

## 输出要求
请直接输出 JSON，不要包含任何其他内容。确保：
1. 输出是有效的 JSON 格式
2. 包含恰好 ${quizCount} 道题目
3. 每道题目恰好 4 个选项（A、B、C、D）
4. 每道题目只有一个正确答案`;
  }

  /**
   * 为结构化输出构建 prompt
   */
  private buildPrompt(inputText: string, quizNums?: number): string {
    return `# 角色定义
你是一位资深的教育测评专家，拥有丰富的试题编写经验。你擅长根据文本材料设计高质量、有区分度的选择题。

# 任务目标
根据提供的文本内容，生成一套完整的测验题目，包含${quizNums ?? 5}道单项选择题。

# 输出要求
你必须严格按照以下JSON Schema格式输出：

## 测验结构
- title: 测验标题，简洁概括文本主题（10-20字）
- questions: 包含恰好${quizNums ?? 5}道题目的数组

## 题目结构（每道题）
- questionText: 题目文字，表述清晰无歧义，避免双重否定
- correctAnswer: 正确答案标签（A/B/C/D）
- correctExplanation: 正确答案解析，需引用原文依据
- options: 4个选项数组，按A→B→C→D顺序排列

## 选项结构（每个选项）
- label: 选项标签（A/B/C/D）
- content: 选项内容，简洁明了
- isCorrect: 布尔值，每个题目仅一个为true
- explanation: 解析说明，需引用原文依据

# 出题原则
1. **知识点覆盖**: ${quizNums ?? 5}道题目应覆盖文本的核心知识点，避免重复
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
