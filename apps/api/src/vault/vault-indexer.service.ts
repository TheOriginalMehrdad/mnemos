import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { promises as fs } from 'fs';
import * as path from 'path';
import { VaultPhase } from '@eruditio/shared';
import { PrismaService } from '../prisma/prisma.service';
import { VaultParserService } from '../notes/vault-parser.service';
import { EruditioGateway } from '../realtime/eruditio.gateway';
import { QUEUE_CARD_GENERATION, JOB_GENERATE_CARDS, GenerateCardsJobData } from '../jobs/job.constants';

interface DerivedMeta {
  domainKey: string;
  domainName: string;
  topic: string;
  slug: string;
}

interface IndexedNote {
  noteId: string;
  isNew: boolean;
  wikilinks: string[];
}

/**
 * Indexes a Markdown vault into Notes/Domains/NoteLinks and enqueues card
 * generation for newly-discovered notes. Used by the full-index job and by the
 * file watcher for single-file updates.
 */
@Injectable()
export class VaultIndexerService {
  private readonly logger = new Logger(VaultIndexerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly parser: VaultParserService,
    private readonly gateway: EruditioGateway,
    @InjectQueue(QUEUE_CARD_GENERATION) private readonly cardQueue: Queue<GenerateCardsJobData>,
  ) {}

  /**
   * Fully (re)index a vault directory.
   * @param userId Owner of the notes.
   * @param vaultPath Absolute path to the vault root.
   * @returns Counts of indexed and failed files.
   */
  async indexVault(userId: string, vaultPath: string): Promise<{ indexed: number; failed: number }> {
    this.gateway.emit('vault:progress', { total: 0, indexed: 0, failed: 0, phase: VaultPhase.Scanning });
    const files = await this.scanMarkdownFiles(vaultPath);
    const total = files.length;

    let indexed = 0;
    let failed = 0;
    const results: IndexedNote[] = [];

    for (const absPath of files) {
      try {
        const result = await this.indexOneFile(userId, vaultPath, absPath);
        results.push(result);
        indexed += 1;
      } catch (err) {
        failed += 1;
        this.logger.warn(`Failed to index ${absPath}: ${(err as Error).message}`);
      }
      if (indexed % 5 === 0 || indexed === total) {
        this.gateway.emit('vault:progress', { total, indexed, failed, phase: VaultPhase.Indexing });
      }
    }

    this.gateway.emit('vault:progress', { total, indexed, failed, phase: VaultPhase.Linking });
    for (const r of results) {
      await this.resolveLinks(userId, r.noteId, r.wikilinks);
    }

    this.gateway.emit('vault:progress', { total, indexed, failed, phase: VaultPhase.Cards });
    for (const r of results) {
      if (r.isNew) await this.enqueueCardGeneration(userId, r.noteId);
    }

    await this.touchVaultRecord(userId, vaultPath, total);
    this.gateway.emit('vault:progress', { total, indexed, failed, phase: VaultPhase.Done });
    return { indexed, failed };
  }

  /**
   * Index (or re-index) a single Markdown file — used by the watcher.
   * @returns The indexed note descriptor, or null if the path is not Markdown.
   */
  async indexFile(userId: string, vaultPath: string, absPath: string): Promise<IndexedNote | null> {
    if (!absPath.endsWith('.md')) return null;
    const result = await this.indexOneFile(userId, vaultPath, absPath);
    await this.resolveLinks(userId, result.noteId, result.wikilinks);
    if (result.isNew) await this.enqueueCardGeneration(userId, result.noteId);
    return result;
  }

  /** Soft-delete the note backing a removed file. @returns the note id, or null. */
  async softDeleteByPath(userId: string, absPath: string): Promise<string | null> {
    const note = await this.prisma.note.findFirst({ where: { userId, filePath: absPath } });
    if (!note) return null;
    await this.prisma.note.update({ where: { id: note.id }, data: { deletedAt: new Date() } });
    return note.id;
  }

  private async indexOneFile(userId: string, vaultPath: string, absPath: string): Promise<IndexedNote> {
    const raw = await fs.readFile(absPath, 'utf-8');
    const parsed = this.parser.parseMarkdown(raw, path.basename(absPath));
    const meta = this.deriveMeta(vaultPath, absPath, parsed.title);
    const domain = await this.upsertDomain(userId, meta.domainKey, meta.domainName);

    const existing = await this.prisma.note.findUnique({
      where: { userId_slug: { userId, slug: meta.slug } },
    });

    const data = {
      title: parsed.title,
      domainId: domain.id,
      topic: meta.topic,
      content: parsed.content,
      status: parsed.status as never,
      language: parsed.language,
      difficulty: parsed.difficulty,
      source: parsed.source,
      tags: parsed.tags,
      excerpt: parsed.excerpt,
      wordCount: parsed.wordCount,
      readMinutes: parsed.readMinutes,
      filePath: absPath,
      deletedAt: null,
    };

    let noteId: string;
    if (existing) {
      const updated = await this.prisma.note.update({ where: { id: existing.id }, data });
      noteId = updated.id;
    } else {
      const created = await this.prisma.note.create({
        data: { userId, slug: meta.slug, ...data },
      });
      noteId = created.id;
    }

    this.gateway.emit('vault:changed', {
      noteId,
      slug: meta.slug,
      changeType: existing ? 'change' : 'add',
    });

    return { noteId, isNew: !existing, wikilinks: parsed.wikilinks };
  }

  private async resolveLinks(userId: string, fromId: string, wikilinks: string[]): Promise<void> {
    await this.prisma.noteLink.deleteMany({ where: { fromId, type: 'wikilink' } });
    if (wikilinks.length === 0) return;

    for (const target of wikilinks) {
      const slug = this.parser.slugify(target);
      const match = await this.prisma.note.findFirst({
        where: {
          userId,
          deletedAt: null,
          OR: [{ title: { equals: target, mode: 'insensitive' } }, { slug }],
        },
      });
      if (!match || match.id === fromId) continue;
      await this.prisma.noteLink.upsert({
        where: { fromId_toId_type: { fromId, toId: match.id, type: 'wikilink' } },
        update: {},
        create: { fromId, toId: match.id, type: 'wikilink' },
      });
    }
  }

  private async enqueueCardGeneration(userId: string, noteId: string): Promise<void> {
    await this.cardQueue.add(
      JOB_GENERATE_CARDS,
      { userId, noteId },
      { jobId: `cards-${noteId}`, removeOnComplete: true, removeOnFail: 50 },
    );
  }

  private async upsertDomain(userId: string, key: string, name: string) {
    const hue = this.hueFromString(key);
    return this.prisma.domain.upsert({
      where: { userId_key: { userId, key } },
      update: { name },
      create: { id: `${userId}:${key}`, userId, key, name, hue, color: this.hexFromHue(hue) },
    });
  }

  private deriveMeta(vaultPath: string, absPath: string, title: string): DerivedMeta {
    const rel = path.relative(vaultPath, absPath);
    const segments = rel.split(path.sep);
    const folderSegments = segments.slice(0, -1);
    const domainName = folderSegments[0] ?? 'General';
    const topic = folderSegments[1] ?? '';
    const slugSource = rel.replace(/\.md$/i, '');
    return {
      domainKey: this.parser.slugify(domainName) || 'general',
      domainName,
      topic,
      slug: this.parser.slugify(slugSource.replace(new RegExp(`\\${path.sep}`, 'g'), ' ')) || this.parser.slugify(title),
    };
  }

  private async touchVaultRecord(userId: string, vaultPath: string, fileCount: number): Promise<void> {
    await this.prisma.vault.upsert({
      where: { userId },
      update: { path: vaultPath, lastIndexed: new Date(), fileCount },
      create: { userId, path: vaultPath, lastIndexed: new Date(), fileCount },
    });
  }

  private async scanMarkdownFiles(dir: string): Promise<string[]> {
    const out: string[] = [];
    const walk = async (current: string): Promise<void> => {
      let entries: import('fs').Dirent[];
      try {
        entries = await fs.readdir(current, { withFileTypes: true });
      } catch {
        return;
      }
      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue;
        const full = path.join(current, entry.name);
        if (entry.isDirectory()) await walk(full);
        else if (entry.isFile() && entry.name.endsWith('.md')) out.push(full);
      }
    };
    await walk(dir);
    return out;
  }

  private hueFromString(s: string): number {
    let hash = 0;
    for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) % 360;
    return Math.abs(hash);
  }

  private hexFromHue(hue: number): string {
    // Convert HSL(hue, 55%, 55%) to hex for a pleasant, deterministic domain color.
    const h = hue / 360;
    const s = 0.55;
    const l = 0.55;
    const hue2rgb = (p: number, q: number, t: number): number => {
      let tt = t;
      if (tt < 0) tt += 1;
      if (tt > 1) tt -= 1;
      if (tt < 1 / 6) return p + (q - p) * 6 * tt;
      if (tt < 1 / 2) return q;
      if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
    const g = Math.round(hue2rgb(p, q, h) * 255);
    const b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);
    return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
  }
}
