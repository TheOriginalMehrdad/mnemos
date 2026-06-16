import { Module } from '@nestjs/common';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';
import { AdaptiveQueueService } from './adaptive-queue.service';

@Module({
  controllers: [ReviewController],
  providers: [ReviewService, AdaptiveQueueService],
  exports: [ReviewService, AdaptiveQueueService],
})
export class ReviewModule {}
