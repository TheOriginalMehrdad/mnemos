import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingsService } from '../ai/embeddings.service';
import { VaultParserService } from './vault-parser.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { CardsService } from '../cards/cards.service';

function noteToDto(note: any) {
  return {
    id: note.id,
    slug: note.slug,
    title: note.title,
    domain: note.domain?.key ?? note.domainId,
    domainId: note.domainId,
    domainName: note.domain?.name ?? '',
    topic: note.topic,
    status: note.status,
    language: note.language,
    difficulty: note.difficulty,
    memory: note.memory,
    wordCount: note.wordCount,
    readMinutes: note.readMinutes,
    tags: note.tags ?? [],
    source: note.source,
    excerpt: note.excerpt,
    content: note.content,
    lastReviewed: note.lastReviewed,
    created: note.createdAt,
    updated: note.updatedAt,
    links: (note.linksFrom ?? []).map((l: any) => l.toId),
    memState: memoryState(note.memory),
  };
}

function memoryState(score: number) {
  if (score >= 90) return { key: 'mastered', label: 'Mastered' };
  if (score >= 70) return { key: 'strong', label: 'Strong' };
  if (score >= 50) return { key: 'moderate', label: 'Moderate' };
  if (score >= 30) return { key: 'fragile', label: 'Fragile' };
  return { key: 'critical', label: 'Critical' };
}

@Injectable()
export class NotesService {
  constructor(
    private prisma: PrismaService,
    private embeddings: EmbeddingsService,
    private parser: VaultParserService,
    private cards: CardsService,
  ) {}

  async list(userId: string, filters: { domain?: string; status?: string; search?: string; sort?: string; page?: number; limit?: number }) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    const where: any = { userId, deletedAt: null };
    if (filters.domain) where.domain = { key: filters.domain };
    if (filters.status) where.status = filters.status;
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { excerpt: { contains: filters.search, mode: 'insensitive' } },
        { tags: { has: filters.search } },
      ];
    }

    const orderBy: any = this.buildOrderBy(filters.sort);
    const [total, items] = await this.prisma.$transaction([
      this.prisma.note.count({ where }),
      this.prisma.note.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: { domain: true, linksFrom: { select: { toId: true } } },
      }),
    ]);

    return {
      items: items.map(noteToDto),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(userId: string, id: string) {
    const note = await this.prisma.note.findFirst({
      where: { id, userId, deletedAt: null },
      include: { domain: true, linksFrom: { select: { toId: true } }, linksTo: { select: { fromId: true } } },
    });
    if (!note) throw new NotFoundException('Note not found');
    return noteToDto(note);
  }

  /** Domains with note counts and average memory score. */
  async domains(userId: string) {
    const domains = await this.prisma.domain.findMany({
      where: { userId },
      include: { notes: { where: { deletedAt: null }, select: { memory: true } } },
      orderBy: { name: 'asc' },
    });
    return domains.map((d) => {
      const memories = d.notes.map((n) => n.memory);
      const avg = memories.length ? Math.round(memories.reduce((s, m) => s + m, 0) / memories.length) : 0;
      return { id: d.id, key: d.key, name: d.name, color: d.color, hue: d.hue, noteCount: memories.length, memory: avg };
    });
  }

  /** Incoming and outgoing links for a note. */
  async links(userId: string, id: string) {
    const note = await this.prisma.note.findFirst({ where: { id, userId, deletedAt: null } });
    if (!note) throw new NotFoundException('Note not found');
    const [outgoing, incoming] = await Promise.all([
      this.prisma.noteLink.findMany({
        where: { fromId: id },
        include: { to: { select: { id: true, title: true, slug: true } } },
      }),
      this.prisma.noteLink.findMany({
        where: { toId: id },
        include: { from: { select: { id: true, title: true, slug: true } } },
      }),
    ]);
    return {
      outgoing: outgoing.map((l) => ({ id: l.to.id, title: l.to.title, slug: l.to.slug, type: l.type })),
      incoming: incoming.map((l) => ({ id: l.from.id, title: l.from.title, slug: l.from.slug, type: l.type })),
    };
  }

  /** All cards for a note with their current urgency scores. */
  async cardsForNote(userId: string, id: string) {
    const note = await this.prisma.note.findFirst({ where: { id, userId, deletedAt: null } });
    if (!note) throw new NotFoundException('Note not found');
    return this.prisma.card.findMany({
      where: { noteId: id, userId },
      orderBy: { urgencyScore: 'desc' },
    });
  }

  async create(userId: string, dto: CreateNoteDto) {
    const slug = this.parser.slugify(dto.title);
    const excerpt = this.parser.extractExcerpt(dto.content ?? '');
    const words = (dto.content ?? '').split(/\s+/).filter(Boolean).length;

    const note = await this.prisma.note.create({
      data: {
        userId,
        slug: await this.uniqueSlug(userId, slug),
        title: dto.title,
        domainId: dto.domainId,
        topic: dto.topic ?? '',
        content: dto.content ?? '',
        status: dto.status ?? 'draft',
        language: dto.language ?? 'en',
        difficulty: dto.difficulty ?? 3,
        source: dto.source ?? '',
        tags: dto.tags ?? [],
        excerpt,
        wordCount: words,
        readMinutes: Math.max(1, Math.ceil(words / 200)),
      },
      include: { domain: true, linksFrom: { select: { toId: true } } },
    });

    this.generateEmbedding(note.id, `${note.title}\n\n${note.excerpt}\n\n${note.content}`).catch(() => {});
    return noteToDto(note);
  }

  async update(userId: string, id: string, dto: UpdateNoteDto) {
    const note = await this.prisma.note.findUnique({ where: { id } });
    if (!note) throw new NotFoundException('Note not found');
    if (note.userId !== userId) throw new ForbiddenException();

    const updateData: any = { ...dto };
    if (dto.content !== undefined) {
      updateData.excerpt = this.parser.extractExcerpt(dto.content);
      const words = dto.content.split(/\s+/).filter(Boolean).length;
      updateData.wordCount = words;
      updateData.readMinutes = Math.max(1, Math.ceil(words / 200));
    }
    if (dto.title && dto.title !== note.title) {
      updateData.slug = await this.uniqueSlug(userId, this.parser.slugify(dto.title));
    }

    const updated = await this.prisma.note.update({
      where: { id },
      data: updateData,
      include: { domain: true, linksFrom: { select: { toId: true } } },
    });

    if (dto.content) {
      this.generateEmbedding(id, `${updated.title}\n\n${updated.excerpt}\n\n${updated.content}`).catch(() => {});
    }

    return noteToDto(updated);
  }

  async delete(userId: string, id: string) {
    const note = await this.prisma.note.findUnique({ where: { id } });
    if (!note) throw new NotFoundException('Note not found');
    if (note.userId !== userId) throw new ForbiddenException();
    await this.prisma.note.delete({ where: { id } });
  }

  async importMarkdownFiles(userId: string, files: Express.Multer.File[], domainId: string) {
    const results: ReturnType<typeof noteToDto>[] = [];
    for (const file of files) {
      const raw = file.buffer.toString('utf-8');
      const parsed = this.parser.parseMarkdown(raw, file.originalname);
      const slug = await this.uniqueSlug(userId, this.parser.slugify(parsed.title));

      const note = await this.prisma.note.create({
        data: {
          userId,
          slug,
          title: parsed.title,
          domainId,
          topic: '',
          content: parsed.content,
          status: parsed.status as any,
          language: parsed.language,
          difficulty: parsed.difficulty,
          source: parsed.source,
          tags: parsed.tags,
          excerpt: parsed.excerpt,
          wordCount: parsed.wordCount,
          readMinutes: parsed.readMinutes,
        },
        include: { domain: true, linksFrom: { select: { toId: true } } },
      });

      this.generateEmbedding(note.id, `${note.title}\n\n${parsed.excerpt}\n\n${note.content}`).catch(() => {});
      results.push(noteToDto(note));
    }
    return results;
  }

  async generateCards(userId: string, noteId: string) {
    return this.cards.generateFromNote(userId, noteId, 6);
  }

  async addGeneratedCards(userId: string, noteId: string, selectedCards: any[]) {
    const note = await this.prisma.note.findUnique({ where: { id: noteId } });
    if (!note) throw new NotFoundException('Note not found');
    if (note.userId !== userId) throw new ForbiddenException();
    return this.cards.bulkCreate(userId, selectedCards);
  }

  private async generateEmbedding(noteId: string, text: string) {
    const vec = await this.embeddings.embed(text);
    const vecStr = `[${vec.join(',')}]`;
    await this.prisma.$executeRawUnsafe(
      `UPDATE notes SET embedding = $1::vector WHERE id = $2`,
      vecStr,
      noteId,
    );
  }

  private buildOrderBy(sort?: string): any {
    const map: Record<string, any> = {
      'updated': { updatedAt: 'desc' },
      'memory': { memory: 'desc' },
      'title': { title: 'asc' },
      'created': { createdAt: 'desc' },
    };
    return map[sort ?? 'updated'] ?? { updatedAt: 'desc' };
  }

  private async uniqueSlug(userId: string, base: string): Promise<string> {
    let slug = base;
    let n = 0;
    while (true) {
      const exists = await this.prisma.note.findUnique({ where: { userId_slug: { userId, slug } } });
      if (!exists) return slug;
      n++;
      slug = `${base}-${n}`;
    }
  }
}
