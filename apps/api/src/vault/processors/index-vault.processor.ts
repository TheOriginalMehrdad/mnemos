import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { VaultIndexerService } from '../vault-indexer.service';
import { QUEUE_VAULT_INDEX, IndexVaultJobData } from '../../jobs/job.constants';

/** Worker: full vault (re)index. */
@Processor(QUEUE_VAULT_INDEX)
export class IndexVaultProcessor extends WorkerHost {
  private readonly logger = new Logger(IndexVaultProcessor.name);

  constructor(
    private readonly indexer: VaultIndexerService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    super();
  }

  async process(job: Job<IndexVaultJobData>): Promise<unknown> {
    const { userId } = job.data;
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const vaultPath = user?.vaultPath ?? this.config.get<string>('vault.path');
    if (!vaultPath) {
      this.logger.warn('No vault path configured; skipping index job');
      return { skipped: true };
    }
    return this.indexer.indexVault(userId, vaultPath);
  }
}
