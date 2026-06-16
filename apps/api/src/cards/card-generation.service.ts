import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EruditioGateway } from '../realtime/eruditio.gateway';
import { AI_PROVIDER, AIProvider } from '../ai/ai-provider.interface';
import type { CardSummary } from '@eruditio/shared';

/**
 * Generates flashcards for a note via the AI provider and persists them as new
 * (review_count = 0) cards, then emits a 'cards:generated' realtime event.
 */
@Injectable()
export class CardGenerationService {
  private readonly logger = new Logger(CardGenerationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: EruditioGateway,
    @Inject(AI_PROVIDER) private readonly ai: AIProvider,
  ) {}

  /**
   * Generate and persist cards for a note. Skips generation if the note was
   * deleted or already has cards.
   * @returns The number of cards created.
   */
  async generateForNote(userId: string, noteId: string, count = 4): Promise<number> {
    const note = await this.prisma.note.findFirst({
      where: { id: noteId, userId, deletedAt: null },
      include: { domain: true },
    });
    if (!note) return 0;

    const existing = await this.prisma.card.count({ where: { noteId, userId } });
    if (existing > 0) return 0;

    const { data: generated } = await this.ai.generateCards(
      { id: note.id, title: note.title, content: note.content, domain: note.domain?.key },
      count,
    );

    const now = new Date();
    const created = await this.prisma.$transaction(
      generated.map((c) =>
        this.prisma.card.create({
          data: {
            userId,
            noteId: note.id,
            domainId: note.domainId,
            topic: note.topic,
            type: c.type,
            front: c.front,
            back: c.back,
            language: note.language,
            due: now,
            reviews: 0,
          },
        }),
      ),
    );

    const summaries: CardSummary[] = created.map((c) => ({
      id: c.id,
      front: c.front,
      back: c.back,
      type: c.type,
    }));
    this.gateway.emit('cards:generated', { noteId, cardCount: created.length, cards: summaries });
    this.logger.log(`Generated ${created.length} cards for note ${noteId}`);
    return created.length;
  }
}
