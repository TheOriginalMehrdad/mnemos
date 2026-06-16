import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotesModule } from '../notes/notes.module';
import { CardsModule } from '../cards/cards.module';
import { VaultController } from './vault.controller';
import { VaultService } from './vault.service';
import { VaultIndexerService } from './vault-indexer.service';
import { VaultWatcherService } from './vault-watcher.service';
import { IndexVaultProcessor } from './processors/index-vault.processor';
import { GenerateCardsProcessor } from './processors/generate-cards.processor';
import { QUEUE_VAULT_INDEX, QUEUE_CARD_GENERATION } from '../jobs/job.constants';

@Module({
  imports: [
    NotesModule,
    CardsModule,
    BullModule.registerQueue({ name: QUEUE_VAULT_INDEX }, { name: QUEUE_CARD_GENERATION }),
  ],
  controllers: [VaultController],
  providers: [
    VaultService,
    VaultIndexerService,
    VaultWatcherService,
    IndexVaultProcessor,
    GenerateCardsProcessor,
  ],
  exports: [VaultIndexerService],
})
export class VaultModule {}
