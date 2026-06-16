import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  scheduleReview,
  computeUrgency,
  memoryScore,
  FSRSCard,
  FsrsRating,
  RateResult,
} from '@eruditio/shared';
import { PrismaService } from '../prisma/prisma.service';
import { EruditioGateway } from '../realtime/eruditio.gateway';
import { AdaptiveQueueService } from './adaptive-queue.service';
import { RateCardDto } from '../cards/dto/rate-card.dto';

const MS_PER_DAY = 86_400_000;
const MAX_PRIORITY_BOOST = 3.0;
const MISTAKE_BOOST_STEP = 0.5;
const RECOVERY_DECAY = 0.2;

/**
 * Handles rating a card: FSRS rescheduling, adaptive mistake/streak signals,
 * urgency recomputation, note memory/status rollup and daily stats.
 */
@Injectable()
export class ReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly gateway: EruditioGateway,
    private readonly queue: AdaptiveQueueService,
  ) {}

  /**
   * Rate a card and reschedule it.
   * @returns The new schedule, FSRS state, urgency score and current streak day.
   */
  async rate(userId: string, cardId: string, dto: RateCardDto): Promise<RateResult> {
    const card = await this.prisma.card.findUnique({ where: { id: cardId }, include: { domain: true } });
    if (!card) throw new NotFoundException('Card not found');
    if (card.userId !== userId) throw new ForbiddenException();

    const now = new Date();
    const rating = dto.rating as FsrsRating;
    const lastReview = card.reviews > 0 ? card.updatedAt : null;

    const fsrsCard: FSRSCard = {
      stability: card.stability,
      difficulty: card.difficulty,
      retrievability: card.retrievability,
      reviewCount: card.reviews,
      lastReview,
      nextReview: card.due,
      easeFactor: card.ease,
    };
    const result = scheduleReview(fsrsCard, rating, now);

    // ── Adaptive mistake amplification / streak recovery ──────────────────
    let { mistakeCount, correctStreak, priorityBoost } = card;
    let lastMistakeAt = card.lastMistakeAt;
    if (rating <= 2) {
      mistakeCount += 1;
      lastMistakeAt = now;
      priorityBoost = Math.min(priorityBoost + MISTAKE_BOOST_STEP, MAX_PRIORITY_BOOST);
      correctStreak = 0;
    } else if (rating >= 4) {
      correctStreak += 1;
      priorityBoost = Math.max(priorityBoost - RECOVERY_DECAY, 0);
    }

    const newMemory = Math.round(result.retrievability * 100);
    const { urgencyScore } = computeUrgency(
      {
        id: card.id,
        noteId: card.noteId,
        domain: card.domain.key,
        stability: result.stability,
        nextReview: result.nextReview,
        reviewCount: card.reviews + 1,
        mistakeCount,
        lastMistakeAt,
        correctStreak,
        priorityBoost,
      },
      this.queue.weights(),
      now,
    );

    await this.prisma.reviewLog.create({
      data: {
        userId,
        cardId,
        rating: dto.rating,
        durationMs: dto.durationMs ?? 0,
        stabilityBefore: card.stability,
        difficultyBefore: card.difficulty,
        retrievability: result.retrievability,
        intervalBefore: card.interval,
        intervalAfter: result.interval,
      },
    });

    await this.prisma.card.update({
      where: { id: cardId },
      data: {
        stability: result.stability,
        difficulty: result.difficulty,
        retrievability: result.retrievability,
        due: result.nextReview,
        interval: result.interval,
        reviews: { increment: 1 },
        lapses: rating <= 2 ? { increment: 1 } : undefined,
        memory: newMemory,
        state: card.reviews === 0 ? 'Review' : card.state,
        mistakeCount,
        correctStreak,
        priorityBoost,
        lastMistakeAt,
        urgencyScore,
      },
    });

    await this.recomputeNote(card.noteId);
    const streakDay = await this.updateDailyStatsAndStreak(userId, dto.rating, dto.durationMs ?? 0);

    this.gateway.emit('review:rated', {
      cardId,
      rating: dto.rating as 1 | 2 | 3 | 4 | 5,
      nextReview: result.nextReview.toISOString(),
      newUrgencyScore: Number(urgencyScore.toFixed(4)),
    });

    return {
      nextReview: result.nextReview.toISOString(),
      newStability: result.stability,
      newDifficulty: result.difficulty,
      newRetrievability: result.retrievability,
      newUrgencyScore: Number(urgencyScore.toFixed(4)),
      streakDay,
    };
  }

  /** Today's review statistics. */
  async statsToday(userId: string): Promise<{
    reviewed: number;
    correct: number;
    missed: number;
    accuracy: number;
    minutesStudied: number;
    streakDay: number;
    newCards: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [stat, streak, newCards] = await Promise.all([
      this.prisma.dailyStat.findUnique({ where: { userId_date: { userId, date: today } } }),
      this.prisma.streak.findUnique({ where: { userId } }),
      this.prisma.card.count({ where: { userId, createdAt: { gte: today } } }),
    ]);
    const reviewed = stat?.cardsReviewed ?? 0;
    const correct = Math.round(stat?.accuracy ?? 0);
    return {
      reviewed,
      correct,
      missed: Math.max(0, reviewed - correct),
      accuracy: reviewed > 0 ? Number((correct / reviewed).toFixed(3)) : 0,
      minutesStudied: stat?.studyMinutes ?? 0,
      streakDay: streak?.current ?? 0,
      newCards,
    };
  }

  /** Daily stats across a date range (inclusive). */
  async statsRange(userId: string, from: Date, to: Date) {
    return this.prisma.dailyStat.findMany({
      where: { userId, date: { gte: from, lte: to } },
      orderBy: { date: 'asc' },
    });
  }

  /** Recompute a note's memory score and status from its non-suspended cards. */
  private async recomputeNote(noteId: string): Promise<void> {
    const cards = await this.prisma.card.findMany({
      where: { noteId, suspended: false },
      select: { stability: true, updatedAt: true, reviews: true },
    });
    if (cards.length === 0) return;

    const now = new Date();
    const avgR =
      cards.reduce((sum, c) => sum + memoryScore({ stability: c.stability, lastReview: c.reviews > 0 ? c.updatedAt : null }, now), 0) /
      cards.length;
    const memory = Math.round(avgR);
    const status = memory >= 90 ? 'mastered' : memory >= 50 ? 'review_ready' : 'draft';

    await this.prisma.note.update({
      where: { id: noteId },
      data: { memory, status: status as never, lastReviewed: now },
    });
  }

  /** Update today's DailyStat and the streak; @returns the current streak day. */
  private async updateDailyStatsAndStreak(userId: string, rating: number, durationMs: number): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const correct = rating >= 3 ? 1 : 0;
    const minutes = Math.round(durationMs / 60000);

    await this.prisma.dailyStat.upsert({
      where: { userId_date: { userId, date: today } },
      create: { userId, date: today, cardsReviewed: 1, accuracy: correct, studyMinutes: minutes },
      update: { cardsReviewed: { increment: 1 }, accuracy: { increment: correct }, studyMinutes: { increment: minutes } },
    });

    const streak = await this.prisma.streak.findUnique({ where: { userId } });
    if (!streak) {
      const created = await this.prisma.streak.create({ data: { userId, current: 1, longest: 1, lastStudyDate: today } });
      return created.current;
    }

    const last = streak.lastStudyDate ? new Date(streak.lastStudyDate) : null;
    const yesterday = new Date(today.getTime() - MS_PER_DAY);
    let current = streak.current;
    if (!last || last < yesterday) current = 1;
    else if (last.toDateString() !== today.toDateString()) current += 1;

    const updated = await this.prisma.streak.update({
      where: { userId },
      data: { current, longest: Math.max(streak.longest, current), lastStudyDate: today },
    });
    return updated.current;
  }
}
