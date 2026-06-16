import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatAiService } from '../ai/chat-ai.service';
import { GenerateQuizDto } from './dto/generate-quiz.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';

function quizToDto(quiz: any) {
  return {
    id: quiz.id,
    title: quiz.title,
    domain: quiz.domain,
    topic: quiz.topic,
    difficulty: quiz.difficulty,
    lastScore: quiz.lastScore,
    attempts: quiz.attempts,
    questionCount: quiz.questions?.length ?? 0,
    questions: (quiz.questions ?? []).map((q: any) => ({
      id: q.id,
      type: q.type,
      prompt: q.prompt,
      options: q.options,
      answer: q.answer,
      explanation: q.explanation,
    })),
  };
}

@Injectable()
export class QuizzesService {
  constructor(
    private prisma: PrismaService,
    private ai: ChatAiService,
  ) {}

  async list(userId: string) {
    const quizzes = await this.prisma.quiz.findMany({
      where: { userId },
      include: { questions: { orderBy: { order: 'asc' } } },
      orderBy: { id: 'desc' },
    });
    return quizzes.map(quizToDto);
  }

  async findById(userId: string, id: string) {
    const quiz = await this.prisma.quiz.findFirst({
      where: { id, userId },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
    if (!quiz) throw new NotFoundException('Quiz not found');
    return quizToDto(quiz);
  }

  async generate(userId: string, dto: GenerateQuizDto) {
    let content = '';
    let title = 'Generated Quiz';
    let domain = dto.domain ?? 'General';
    let topic = dto.topic ?? '';

    if (dto.noteId) {
      const note = await this.prisma.note.findFirst({ where: { id: dto.noteId, userId }, include: { domain: true } });
      if (!note) throw new NotFoundException('Note not found');
      content = `${note.title}\n\n${note.content}`;
      title = `Quiz: ${note.title}`;
      domain = note.domain.name;
      topic = note.topic;
    } else if (dto.domain) {
      const notes = await this.prisma.note.findMany({
        where: { userId, domain: { key: dto.domain } },
        take: 5,
      });
      content = notes.map((n) => `${n.title}\n${n.content.slice(0, 500)}`).join('\n\n---\n\n');
      title = `Quiz: ${dto.domain}${dto.topic ? ' — ' + dto.topic : ''}`;
    }

    if (!content) {
      content = 'General knowledge quiz covering key concepts in the subject area.';
    }

    const types = dto.types ?? ['mc', 'tf', 'fill'];
    const rawQuestions = await this.ai.generateQuiz(content, dto.questionCount, types);

    const quiz = await this.prisma.quiz.create({
      data: {
        userId,
        title,
        domain,
        topic,
        difficulty: 'Mixed',
        questions: {
          create: rawQuestions.map((q, i) => ({
            type: q.type as any,
            prompt: q.prompt,
            options: q.options,
            answer: q.answer,
            explanation: q.explanation,
            order: i,
          })),
        },
      },
      include: { questions: { orderBy: { order: 'asc' } } },
    });

    return quizToDto(quiz);
  }

  async submit(userId: string, quizId: string, dto: SubmitQuizDto) {
    const quiz = await this.prisma.quiz.findFirst({
      where: { id: quizId, userId },
      include: { questions: true },
    });
    if (!quiz) throw new NotFoundException('Quiz not found');

    const questionMap = new Map(quiz.questions.map((q) => [q.id, q]));
    let correct = 0;

    const responses = dto.answers.map((a) => {
      const question = questionMap.get(a.questionId);
      if (!question) return null;
      const isCorrect = this.checkAnswer(question.type, question.answer, a.answer);
      if (isCorrect) correct++;
      return { questionId: a.questionId, answer: a.answer, correct: isCorrect };
    }).filter(Boolean);

    const score = Math.round((correct / quiz.questions.length) * 100);

    const attempt = await this.prisma.quizAttempt.create({
      data: {
        userId,
        quizId,
        score,
        responses: { create: responses as any },
      },
      include: { responses: true },
    });

    await this.prisma.quiz.update({
      where: { id: quizId },
      data: { lastScore: score, attempts: { increment: 1 } },
    });

    return {
      attemptId: attempt.id,
      score,
      correct,
      total: quiz.questions.length,
      results: quiz.questions.map((q) => {
        const userAnswer = dto.answers.find((a) => a.questionId === q.id);
        const isCorrect = userAnswer ? this.checkAnswer(q.type, q.answer, userAnswer.answer) : false;
        return {
          questionId: q.id,
          prompt: q.prompt,
          correctAnswer: q.answer,
          userAnswer: userAnswer?.answer ?? '',
          correct: isCorrect,
          explanation: q.explanation,
        };
      }),
    };
  }

  async delete(userId: string, quizId: string) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) throw new NotFoundException('Quiz not found');
    if (quiz.userId !== userId) throw new ForbiddenException();
    await this.prisma.quiz.delete({ where: { id: quizId } });
  }

  private checkAnswer(type: string, correct: string, given: string): boolean {
    if (type === 'mc' || type === 'tf') {
      return correct.toLowerCase().trim() === given.toLowerCase().trim();
    }
    const c = correct.toLowerCase().trim();
    const g = given.toLowerCase().trim();
    if (c === g) return true;
    if (g.includes(c) || c.includes(g)) return true;
    return false;
  }
}
