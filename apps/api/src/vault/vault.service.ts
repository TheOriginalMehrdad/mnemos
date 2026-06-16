import { Injectable, BadRequestException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { VaultWatcherService } from './vault-watcher.service';

export interface VaultStatus {
  path: string | null;
  noteCount: number;
  indexedCount: number;
  lastSync: Date | null;
  isWatching: boolean;
}

/**
 * Vault connection & status. Connecting points the watcher at a folder and
 * kicks off a full re-index; status reports indexing progress at rest.
 */
@Injectable()
export class VaultService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly watcher: VaultWatcherService,
  ) {}

  /**
   * Connect a vault folder: validate it, persist the path, start watching and
   * trigger a full re-index.
   * @throws BadRequestException if the path is not an existing directory.
   */
  async connect(userId: string, vaultPath: string): Promise<VaultStatus> {
    try {
      const stat = await fs.stat(vaultPath);
      if (!stat.isDirectory()) throw new Error('not a directory');
    } catch {
      throw new BadRequestException(`Vault path "${vaultPath}" is not an accessible directory`);
    }

    await this.prisma.user.update({ where: { id: userId }, data: { vaultPath } });
    await this.prisma.vault.upsert({
      where: { userId },
      update: { path: vaultPath },
      create: { userId, path: vaultPath },
    });

    await this.watcher.watch(vaultPath);
    await this.watcher.enqueueFullIndex('connect');
    return this.status(userId);
  }

  /** Enqueue a full re-index of the connected vault. */
  async sync(userId: string): Promise<{ queued: boolean }> {
    await this.watcher.enqueueFullIndex('sync');
    return { queued: true };
  }

  /** Current vault status: paths, counts and whether the watcher is live. */
  async status(userId: string): Promise<VaultStatus> {
    const vault = await this.prisma.vault.findUnique({ where: { userId } });
    const [noteCount, indexedCount] = await Promise.all([
      this.prisma.note.count({ where: { userId } }),
      this.prisma.note.count({ where: { userId, deletedAt: null } }),
    ]);
    return {
      path: vault?.path ?? this.watcher.currentPath(),
      noteCount,
      indexedCount,
      lastSync: vault?.lastIndexed ?? null,
      isWatching: this.watcher.isWatching(),
    };
  }
}
