import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { CardGenerationService } from '../../cards/card-generation.service';
import { QUEUE_CARD_GENERATION, GenerateCardsJobData } from '../../jobs/job.constants';

/** Worker: generate flashcards for a freshly indexed note. */
@Processor(QUEUE_CARD_GENERATION)
export class GenerateCardsProcessor extends WorkerHost {
  constructor(private readonly cardGen: CardGenerationService) {
    super();
  }

  async process(job: Job<GenerateCardsJobData>): Promise<number> {
    return this.cardGen.generateForNote(job.data.userId, job.data.noteId);
  }
}
