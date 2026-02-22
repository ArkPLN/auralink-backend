import z from 'zod';

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
export const QuizSchema = (quizNums: number) => z.object({
  title: z.string().describe('测验标题，简洁概括文本主题'),
  questions: z
    .array(QuestionSchema)
    .length(quizNums ?? 5)
    .describe(`${quizNums ?? 5}道选择题，覆盖文本核心知识点`),
});

// 导出类型声明
export type QuizOption = z.infer<typeof OptionSchema>;
export type QuizQuestion = z.infer<typeof QuestionSchema>;
export type Quiz = z.infer<typeof QuizSchema >;

// 生成测验请求体
export class GenerateQuizDto {
  inputText: string;
  quizNums?: number;
}

// 测验响应体
export class QuizResponseDto {
  title: string;
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
