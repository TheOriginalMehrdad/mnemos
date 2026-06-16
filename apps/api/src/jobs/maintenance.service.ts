import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { computeUrgency, AdaptiveWeights } from '@eruditio/shared';
import { PrismaService } from '../prisma/prisma.service';
import { EruditioGateway } from '../realtime/eruditio.gateway';

const LONG_ABSENCE_BOOST = 1.5;
const RETRIEVABILITY_FLOOR = 0.6;

/**
 * Maintenance routines run by the daily BullMQ job. The long-absence pass
 * resurfaces notes the learner hasn't touched in a long time whose memory has
 * decayed, by boosting their cards' priority.
 */
@Injectable()
export class MaintenanceService {
  private readonly logger = new Logger(MaintenanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly gateway: EruditioGateway,
  ) {}

  /**
   * Boost priority on cards belonging to long-absent, low-retrievability notes.
   * @returns The number of cards resurfaced.
   */
  async runLongAbsence(userId: string): Promise<number> {
    const now = new Date();
    const thresholdDays = this.config.get<number>('adaptive.longAbsenceThresholdDays') ?? 30;
    const cutoff = new Date(now.getTime() - thresholdDays * 86_400_000);

    const cards = await this.prisma.card.findMany({
      where: {
        userId,
        suspended: false,
        retrievability: { lt: RETRIEVABILITY_FLOOR },
        note: {
          deletedAt: null,
          OR: [{ lastReviewed: { lt: cutoff } }, { lastReviewed: null }],
        },
      },
      include: { domain: true },
    });

    if (cards.length === 0) {
      this.gateway.emit('review:resurfaced', { count: 0 });
      return 0;
    }

    const weights = this.weights();
    await this.prisma.$transaction(
      cards.map((card) => {
        const { urgencyScore } = computeUrgency(
          {
            id: card.id,
            noteId: card.noteId,
            domain: card.domain.key,
            stability: card.stability,
            nextReview: card.due,
            reviewCount: card.reviews,
            mistakeCount: card.mistakeCount,
            lastMistakeAt: card.lastMistakeAt,
            correctStreak: card.correctStreak,
            priorityBoost: LONG_ABSENCE_BOOST,
          },
          weights,
          now,
        );
        return this.prisma.card.update({
          where: { id: card.id },
          data: { priorityBoost: LONG_ABSENCE_BOOST, urgencyScore },
        });
      }),
    );

    this.logger.log(`Resurfaced ${cards.length} long-absent cards`);
    this.gateway.emit('review:resurfaced', { count: cards.length });
    return cards.length;
  }

  private weights(): AdaptiveWeights {
    return {
      overdueWeight: this.config.get<number>('adaptive.overdueWeight') ?? 2.0,
      mistakeWeight: this.config.get<number>('adaptive.mistakeWeight') ?? 1.5,
      newCardWeight: this.config.get<number>('adaptive.newCardWeight') ?? 0.8,
      streakBonusWeight: this.config.get<number>('adaptive.streakBonusWeight') ?? 0.1,
    };
  }
}
