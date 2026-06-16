import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AI_PROVIDER, AIProvider, NoteLike } from './ai-provider.interface';
import { GenerateCardsDto, GenerateQuizDto, SummarizeDto, SearchDto } from './dto/ai.dto';

/**
 * Orchestrates the stubbed AI endpoints: loads note context from the DB and
 * delegates to the swappable AIProvider. Every response carries source:'stub'.
 */
@Injectable()
export class AiFacadeService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(AI_PROVIDER) private readonly ai: AIProvider,
  ) {}

  async generateCards(userId: string, dto: GenerateCardsDto) {
    const note = await this.loadNote(userId, dto.noteId);
    const result = await this.ai.generateCards(note, dto.count);
    return { cards: result.data, source: result.source };
  }

  async generateQuiz(userId: string, dto: GenerateQuizDto) {
    const notes = await this.loadNotes(userId, dto.noteId, dto.domain);
    const result = await this.ai.generateQuiz(notes, dto.questionCount ?? 5, dto.types ?? []);
    return { questions: result.data, source: result.source };
  }

  async summarize(userId: string, dto: SummarizeDto) {
    const note = await this.loadNote(userId, dto.noteId);
    const result = await this.ai.summarize(note);
    return { summary: result.data, source: result.source };
  }

  async search(userId: string, dto: SearchDto) {
    const notes = await this.loadNotes(userId);
    const result = await this.ai.search(dto.query, notes);
    return {
      results: result.data.map((n) => ({ id: n.id, title: n.title, domain: n.domain })),
      mode: dto.mode ?? 'keyword',
      source: result.source,
    };
  }

  async dailyInsight(userId: string) {
    const notes = await this.loadNotes(userId);
    if (notes.length < 2) {
      return { insight: 'Add a few more notes from different domains to unlock daily insights.', source: 'stub' as const };
    }
    const a = notes[Math.floor(Math.random() * notes.length)];
    const different = notes.filter((n) => n.domain !== a.domain && n.id !== a.id);
    const b = (different.length ? different : notes.filter((n) => n.id !== a.id))[0];
    const result = await this.ai.dailyInsight(a, b);
    return { insight: result.data, a: { id: a.id, title: a.title }, b: { id: b.id, title: b.title }, source: result.source };
  }

  private async loadNote(userId: string, noteId: string): Promise<NoteLike> {
    const note = await this.prisma.note.findFirst({
      where: { id: noteId, userId, deletedAt: null },
      include: { domain: true },
    });
    if (!note) throw new NotFoundException('Note not found');
    return { id: note.id, title: note.title, content: note.content, domain: note.domain.key };
  }

  private async loadNotes(userId: string, noteId?: string, domain?: string): Promise<NoteLike[]> {
    const notes = await this.prisma.note.findMany({
      where: {
        userId,
        deletedAt: null,
        ...(noteId ? { id: noteId } : {}),
        ...(domain ? { domain: { key: domain } } : {}),
      },
      include: { domain: true },
      take: 200,
    });
    return notes.map((n) => ({ id: n.id, title: n.title, content: n.content, domain: n.domain.key }));
  }
}
