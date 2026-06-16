import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as chokidar from 'chokidar';
import { promises as fs } from 'fs';
import { VaultIndexerService } from './vault-indexer.service';
import { EruditioGateway } from '../realtime/eruditio.gateway';
import { SystemUserService } from '../common/system-user.service';
import { QUEUE_VAULT_INDEX, JOB_INDEX_VAULT, IndexVaultJobData } from '../jobs/job.constants';

/**
 * Watches the configured vault folder with chokidar. New/changed files are
 * re-indexed (and cards enqueued); removed files are soft-deleted.
 */
@Injectable()
export class VaultWatcherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(VaultWatcherService.name);
  private watcher: chokidar.FSWatcher | null = null;
  private watchedPath: string | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly indexer: VaultIndexerService,
    private readonly gateway: EruditioGateway,
    private readonly systemUser: SystemUserService,
    @InjectQueue(QUEUE_VAULT_INDEX) private readonly indexQueue: Queue<IndexVaultJobData>,
  ) {}

  async onModuleInit(): Promise<void> {
    const configured = this.config.get<string>('vault.path');
    if (!configured) return;
    try {
      const stat = await fs.stat(configured);
      if (!stat.isDirectory()) return;
    } catch {
      this.logger.warn(`Vault path "${configured}" not found yet; watcher idle until /vault/connect.`);
      return;
    }
    await this.watch(configured);
    try {
      await this.enqueueFullIndex('startup');
    } catch (err) {
      this.logger.warn(`Could not enqueue startup index (admin user not ready?): ${(err as Error).message}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.watcher?.close();
  }

  /** @returns true if a watcher is currently active. */
  isWatching(): boolean {
    return this.watcher !== null;
  }

  /** @returns the path currently being watched, if any. */
  currentPath(): string | null {
    return this.watchedPath;
  }

  /**
   * (Re)start watching a directory. Existing files are handled by the full
   * index job, so the watcher ignores the initial scan and only reacts to changes.
   */
  async watch(vaultPath: string): Promise<void> {
    await this.watcher?.close();
    this.watchedPath = vaultPath;
    this.watcher = chokidar.watch(vaultPath, {
      ignoreInitial: true,
      ignored: /(^|[/\\])\../, // dotfiles/dirs (.obsidian, .git, …)
      awaitWriteFinish: { stabilityThreshold: 300, pollInterval: 100 },
    });

    this.watcher
      .on('add', (p) => void this.handleUpsert(p))
      .on('change', (p) => void this.handleUpsert(p))
      .on('unlink', (p) => void this.handleUnlink(p));

    this.logger.log(`Watching vault at ${vaultPath}`);
  }

  /** Enqueue a full re-index job. */
  async enqueueFullIndex(reason: IndexVaultJobData['reason']): Promise<void> {
    const userId = await this.systemUser.getUserId();
    await this.indexQueue.add(JOB_INDEX_VAULT, { userId, reason }, { removeOnComplete: true, removeOnFail: 20 });
  }

  private async handleUpsert(absPath: string): Promise<void> {
    if (!absPath.endsWith('.md') || !this.watchedPath) return;
    try {
      const userId = await this.systemUser.getUserId();
      await this.indexer.indexFile(userId, this.watchedPath, absPath);
    } catch (err) {
      this.logger.warn(`Watcher upsert failed for ${absPath}: ${(err as Error).message}`);
    }
  }

  private async handleUnlink(absPath: string): Promise<void> {
    if (!absPath.endsWith('.md')) return;
    try {
      const userId = await this.systemUser.getUserId();
      const noteId = await this.indexer.softDeleteByPath(userId, absPath);
      if (noteId) {
        this.gateway.emit('vault:changed', { noteId, slug: '', changeType: 'unlink' });
      }
    } catch (err) {
      this.logger.warn(`Watcher unlink failed for ${absPath}: ${(err as Error).message}`);
    }
  }
}
