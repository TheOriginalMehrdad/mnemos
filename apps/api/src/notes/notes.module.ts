import { Module } from '@nestjs/common';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';
import { VaultParserService } from './vault-parser.service';
import { CardsModule } from '../cards/cards.module';

@Module({
  imports: [CardsModule],
  controllers: [NotesController],
  providers: [NotesService, VaultParserService],
  exports: [NotesService, VaultParserService],
})
export class NotesModule {}
