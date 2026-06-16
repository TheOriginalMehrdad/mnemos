import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  computeUrgency,
  interleave,
  AdaptiveWeights,
  ScorableCard,
  QueueCard,
} from '@eruditio/shared';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type CardWithDomain = Prisma.CardGetPayload<{ include: { domain: true } }>;

export interface QueueOptions {
  limit?: number;
  domain?: string;
  language?: string;
}

/**
 * Builds the adaptive review session: fetches due + fresh-new cards, scores
 * each by urgency, interleaves by note/domain, caps the session and persists
 * the urgency score for fast subsequent ordering.
 */
@Injectable()
export class AdaptiveQueueService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /** Resolve scoring weights from configuration. */
  weights(): AdaptiveWeights {
    return {
      overdueWeight: this.config.get<number>('adaptive.overdueWeight') ?? 2.0,
      mistakeWeight: this.config.get<number>('adaptive.mistakeWeight') ?? 1.5,
      newCardWeight: this.config.get<number>('adaptive.newCardWeight') ?? 0.8,
      streakBonusWeight: this.config.get<number>('adaptive.streakBonusWeight') ?? 0.1,
    };
  }

  /**
   * Build an ordered review queue for the user.
   * @returns Cards ordered by urgency then interleaved, each with reason & scores.
   */
  async buildQueue(userId: string, opts: QueueOptions = {}): Promise<QueueCard[]> {
    const now = new Date();
    const limit = opts.limit ?? this.config.get<number>('adaptive.sessionCardLimit') ?? 50;
    const newLimit = this.config.get<number>('adaptive.newCardsPerSession') ?? 10;
    const weights = this.weights();

    const baseWhere: Prisma.CardWhereInput = {
      userId,
      suspended: false,
      note: { deletedAt: null },
      ...(opts.domain ? { domain: { key: opts.domain } } : {}),
      ...(opts.language ? { language: opts.language } : {}),
    };

    const dueCards = await this.prisma.card.findMany({
      where: { ...baseWhere, reviews: { gt: 0 }, due: { lte: now } },
      include: { domain: true },
      orderBy: { due: 'asc' },
    });

    const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000);
    const newCards = await this.prisma.card.findMany({
      where: { ...baseWhere, reviews: 0, note: { deletedAt: null, updatedAt: { gte: sevenDaysAgo } } },
      include: { domain: true },
      orderBy: { createdAt: 'asc' },
      take: newLimit,
    });

    const scored = [...dueCards, ...newCards].map((card) => {
      const { urgencyScore, reason } = computeUrgency(this.toScorable(card), weights, now);
      return { card, urgencyScore, reason };
    });

    scored.sort((a, b) => b.urgencyScore - a.urgencyScore);

    const ordered = interleave(
      scored.map((s) => ({ ...s, noteId: s.card.noteId, domain: s.card.domain.key })),
    ).slice(0, limit);

    await this.persistUrgency(ordered.map((s) => ({ id: s.card.id, urgencyScore: s.urgencyScore })));

    return ordered.map((s) => this.toQueueCard(s.card, s.urgencyScore, s.reason));
  }

  private toScorable(card: CardWithDomain): ScorableCard {
    return {
      id: card.id,
      noteId: card.noteId,
      domain: card.domain.key,
      stability: card.stability,
      nextReview: card.due,
      reviewCount: card.reviews,
      mistakeCount: card.mistakeCount,
      lastMistakeAt: card.lastMistakeAt,
      correctStreak: card.correctStreak,
      priorityBoost: card.priorityBoost,
    };
  }

  private toQueueCard(card: CardWithDomain, urgencyScore: number, reason: QueueCard['reason']): QueueCard {
    return {
      id: card.id,
      noteId: card.noteId,
      domain: card.domain.key,
      topic: card.topic,
      type: card.type,
      front: card.front,
      back: card.back,
      language: card.language,
      urgencyScore: Number(urgencyScore.toFixed(4)),
      reason,
      nextReview: card.due ? card.due.toISOString() : null,
      memoryScore: Math.round(card.memory),
    };
  }

  private async persistUrgency(rows: Array<{ id: string; urgencyScore: number }>): Promise<void> {
    if (rows.length === 0) return;
    await this.prisma.$transaction(
      rows.map((r) =>
        this.prisma.card.update({ where: { id: r.id }, data: { urgencyScore: r.urgencyScore } }),
      ),
    );
  }
}
