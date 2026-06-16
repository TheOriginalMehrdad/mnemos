import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Resolves the single ERUDITIO user id for background work (watcher, jobs)
 * that runs outside an authenticated request context. ERUDITIO is single-user,
 * so this is simply the earliest-created (admin) user.
 */
@Injectable()
export class SystemUserService {
  private cachedId: string | null = null;

  constructor(private readonly prisma: PrismaService) {}

  /** @returns The admin user's id (cached after first lookup). */
  async getUserId(): Promise<string> {
    if (this.cachedId) return this.cachedId;
    const user = await this.prisma.user.findFirstOrThrow({ orderBy: { createdAt: 'asc' } });
    this.cachedId = user.id;
    return user.id;
  }
}
