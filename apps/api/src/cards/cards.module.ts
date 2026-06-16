import { Module } from '@nestjs/common';
import { CardsController } from './cards.controller';
import { CardsService } from './cards.service';
import { FsrsService } from './fsrs.service';
import { CardGenerationService } from './card-generation.service';

@Module({
  controllers: [CardsController],
  providers: [CardsService, FsrsService, CardGenerationService],
  exports: [CardsService, FsrsService, CardGenerationService],
})
export class CardsModule {}
