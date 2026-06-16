import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatAiService } from '../ai/chat-ai.service';
import { FsrsService, FsrsState } from './fsrs.service';
import { CreateCardDto } from './dto/create-card.dto';
import { RateCardDto } from './dto/rate-card.dto';

function cardToDto(card: any) {
  return {
    id: card.id,
    noteId: card.noteId,
    domainId: card.domainId,
    domain: card.domain?.name ?? '',
    topic: card.topic,
    type: card.type,
    front: card.front,
    back: card.back,
    language: card.language,
    stability: card.stability,
    difficulty: card.difficulty,
    retrievability: card.retrievability,
    due: card.due,
    interval: card.interval,
    ease: card.ease,
    reviews: card.reviews,
    lapses: card.lapses,
    memory: card.memory,
    state: card.state,
    suspended: card.suspended,
    createdAt: card.createdAt,
  };
}

@Injectable()
export class CardsService {
  constructor(
    private prisma: PrismaService,
    private fsrs: FsrsService,
    private aiService: ChatAiService,
  ) {}

  async list(
    userId: string,
    filters: { due?: boolean; suspended?: boolean; noteId?: string; domain?: string; type?: string; language?: string },
  ) {
    const where: any = { userId };
    where.suspended = filters.suspended ?? false;
    if (filters.due) where.due = { lte: new Date() };
    if (filters.noteId) where.noteId = filters.noteId;
    if (filters.domain) where.domain = { key: filters.domain };
    if (filters.type) where.type = filters.type;
    if (filters.language) where.language = filters.language;

    const cards = await this.prisma.card.findMany({
      where,
      include: { domain: true },
      orderBy: { due: 'asc' },
    });
    return cards.map(cardToDto);
  }

  /** Update editable fields of a card. */
  async update(userId: string, cardId: string, dto: import('./dto/update-card.dto').UpdateCardDto) {
    await this.assertOwnership(userId, cardId);
    const card = await this.prisma.card.update({
      where: { id: cardId },
      data: { ...dto },
      include: { domain: true },
    });
    return cardToDto(card);
  }

  /** Suspend or unsuspend a card. */
  async setSuspended(userId: string, cardId: string, suspended: boolean) {
    await this.assertOwnership(userId, cardId);
    const card = await this.prisma.card.update({
      where: { id: cardId },
      data: { suspended },
      include: { domain: true },
    });
    return cardToDto(card);
  }

  /**
   * Import cards from Anki-compatible CSV/TSV (front,back[,tags] per row),
   * attaching them to a note.
   * @returns The created cards.
   */
  async importCsv(userId: string, noteId: string, csv: string) {
    const note = await this.prisma.note.findFirst({ where: { id: noteId, userId, deletedAt: null } });
    if (!note) throw new NotFoundException('Note not found');

    const rows = this.parseDelimited(csv);
    const cards = rows
      .filter((cols) => cols[0] && cols[1])
      .map((cols) => ({
        noteId,
        domainId: note.domainId,
        type: 'basic',
        front: cols[0],
        back: cols[1],
        topic: note.topic,
        language: note.language,
      }));
    return this.bulkCreate(userId, cards);
  }

  private parseDelimited(input: string): string[][] {
    return input
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#'))
      .map((line) => (line.includes('\t') ? line.split('\t') : line.split(',')).map((c) => c.trim().replace(/^"|"$/g, '')));
  }

  private async assertOwnership(userId: string, cardId: string): Promise<void> {
    const card = await this.prisma.card.findUnique({ where: { id: cardId }, select: { userId: true } });
    if (!card) throw new NotFoundException('Card not found');
    if (card.userId !== userId) throw new ForbiddenException();
  }

  async getSession(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const limit = user.dailyNewCards * 3; // rough session cap

    const dueCards = await this.prisma.card.findMany({
      where: { userId, suspended: false, due: { lte: new Date() } },
      include: { domain: true },
      orderBy: { due: 'asc' },
      take: limit,
    });

    if (!user.interleaving) return dueCards.map(cardToDto);

    // Interleave: max 2 consecutive from same domain
    const interleaved: typeof dueCards = [];
    const byDomain: Record<string, typeof dueCards> = {};
    for (const c of dueCards) {
      const key = c.domainId;
      if (!byDomain[key]) byDomain[key] = [];
      byDomain[key].push(c);
    }
    const queues = Object.values(byDomain);
    let qi = 0;
    while (interleaved.length < dueCards.length) {
      let added = false;
      for (let i = 0; i < queues.length; i++) {
        const q = queues[(qi + i) % queues.length];
        if (q.length > 0) {
          interleaved.push(q.shift()!);
          qi = (qi + i + 1) % queues.length;
          added = true;
          break;
        }
      }
      if (!added) break;
    }

    return interleaved.map(cardToDto);
  }

  async create(userId: string, dto: CreateCardDto) {
    const card = await this.prisma.card.create({
      data: {
        userId,
        noteId: dto.noteId,
        domainId: dto.domainId,
        type: dto.type ?? 'basic',
        topic: dto.topic ?? '',
        front: dto.front,
        back: dto.back,
        language: dto.language ?? 'en',
        due: new Date(),
      },
      include: { domain: true },
    });
    return cardToDto(card);
  }

  async rate(userId: string, cardId: string, dto: RateCardDto) {
    const card = await this.prisma.card.findUnique({ where: { id: cardId } });
    if (!card) throw new NotFoundException('Card not found');
    if (card.userId !== userId) throw new ForbiddenException();

    const now = new Date();
    const actualElapsed = Math.max(
      0,
      card.reviews === 0
        ? 0
        : (now.getTime() - (card.updatedAt?.getTime() ?? now.getTime())) / 86400000,
    );

    const currentState: FsrsState = {
      stability: card.stability,
      difficulty: card.difficulty,
      retrievability: card.retrievability,
      interval: card.interval,
      reviews: card.reviews,
      lapses: card.lapses,
      state: card.state as FsrsState['state'],
      due: card.due,
    };

    const fsrsRating = this.fsrs.mapFrontendRating(dto.rating);
    const newState = this.fsrs.schedule(currentState, fsrsRating, actualElapsed);
    const newMemory = Math.round(newState.retrievability * 100);

    await this.prisma.reviewLog.create({
      data: {
        userId,
        cardId,
        rating: dto.rating,
        durationMs: dto.durationMs ?? 0,
        stabilityBefore: card.stability,
        difficultyBefore: card.difficulty,
        retrievability: currentState.retrievability,
        intervalBefore: card.interval,
        intervalAfter: newState.interval,
      },
    });

    const updated = await this.prisma.card.update({
      where: { id: cardId },
      data: {
        stability: newState.stability,
        difficulty: newState.difficulty,
        retrievability: newState.retrievability,
        interval: newState.interval,
        reviews: newState.reviews,
        lapses: newState.lapses,
        state: newState.state,
        due: newState.due,
        memory: newMemory,
        ease: Math.min(3.0, Math.max(1.3, card.ease + (0.1 - (5 - dto.rating) * (0.08 + (5 - dto.rating) * 0.02)))),
      },
      include: { domain: true },
    });

    await this.updateDailyStats(userId, dto.rating);

    return cardToDto(updated);
  }

  async delete(userId: string, cardId: string) {
    const card = await this.prisma.card.findUnique({ where: { id: cardId } });
    if (!card) throw new NotFoundException('Card not found');
    if (card.userId !== userId) throw new ForbiddenException();
    await this.prisma.card.delete({ where: { id: cardId } });
  }

  async generateFromNote(userId: string, noteId: string, count = 6) {
    const note = await this.prisma.note.findUnique({ where: { id: noteId } });
    if (!note) throw new NotFoundException('Note not found');
    if (note.userId !== userId) throw new ForbiddenException();

    const cards = await this.aiService.generateCards(note.title, note.content, count);
    return cards.map((c) => ({
      type: c.type,
      front: c.front,
      back: c.back,
      noteId,
      domainId: note.domainId,
      topic: note.topic,
      language: note.language,
    }));
  }

  async bulkCreate(userId: string, cards: Array<{ noteId: string; domainId: string; type: string; front: string; back: string; topic?: string; language?: string }>) {
    const created = await this.prisma.$transaction(
      cards.map((c) =>
        this.prisma.card.create({
          data: { userId, ...c, due: new Date(), type: c.type as any },
          include: { domain: true },
        }),
      ),
    );
    return created.map(cardToDto);
  }

  private async updateDailyStats(userId: string, rating: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const correct = rating >= 3 ? 1 : 0;

    await this.prisma.dailyStat.upsert({
      where: { userId_date: { userId, date: today } },
      create: { userId, date: today, cardsReviewed: 1, newCards: 0, accuracy: correct, studyMinutes: 0 },
      update: {
        cardsReviewed: { increment: 1 },
        accuracy: { increment: correct },
      },
    });

    const streak = await this.prisma.streak.findUnique({ where: { userId } });
    if (!streak) return;

    const lastDate = streak.lastStudyDate ? new Date(streak.lastStudyDate) : null;
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let newCurrent = streak.current;
    if (!lastDate || lastDate < yesterday) {
      newCurrent = 1;
    } else if (lastDate.toDateString() !== today.toDateString()) {
      newCurrent += 1;
    }

    await this.prisma.streak.update({
      where: { userId },
      data: {
        current: newCurrent,
        longest: Math.max(streak.longest, newCurrent),
        lastStudyDate: today,
      },
    });
  }
}
