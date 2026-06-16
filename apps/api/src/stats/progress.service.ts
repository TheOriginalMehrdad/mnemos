import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface MemoryBuckets {
  masteredCount: number;
  strongCount: number;
  moderateCount: number;
  fragileCount: number;
  criticalCount: number;
}

/** Aggregates learning progress across notes, domains and daily activity. */
@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  /** High-level progress snapshot for the dashboard. */
  async overview(userId: string) {
    const notes = await this.prisma.note.findMany({
      where: { userId, deletedAt: null },
      select: { memory: true },
    });
    const buckets = this.bucket(notes.map((n) => n.memory));
    const totalNotes = notes.length;
    const overallHealthScore =
      totalNotes > 0 ? Math.round(notes.reduce((s, n) => s + n.memory, 0) / totalNotes) : 0;

    const [streak, totalCardsReviewed, studyAgg] = await Promise.all([
      this.prisma.streak.findUnique({ where: { userId } }),
      this.prisma.reviewLog.count({ where: { userId } }),
      this.prisma.dailyStat.aggregate({ where: { userId }, _sum: { studyMinutes: true } }),
    ]);

    return {
      totalNotes,
      ...buckets,
      overallHealthScore,
      currentStreak: streak?.current ?? 0,
      longestStreak: streak?.longest ?? 0,
      totalCardsReviewed,
      totalStudyMinutes: studyAgg._sum.studyMinutes ?? 0,
    };
  }

  /** Per-domain note counts and average memory health. */
  async domains(userId: string) {
    const domains = await this.prisma.domain.findMany({
      where: { userId },
      include: { notes: { where: { deletedAt: null }, select: { memory: true } } },
    });
    return domains.map((d) => {
      const memories = d.notes.map((n) => n.memory);
      const avg = memories.length ? Math.round(memories.reduce((s, m) => s + m, 0) / memories.length) : 0;
      return {
        key: d.key,
        name: d.name,
        color: d.color,
        hue: d.hue,
        noteCount: memories.length,
        memory: avg,
        ...this.bucket(memories),
      };
    });
  }

  /** Daily-stat heatmap for the last `weeks` weeks (default 26). */
  async heatmap(userId: string, weeks = 26) {
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    from.setDate(from.getDate() - weeks * 7);
    return this.prisma.dailyStat.findMany({
      where: { userId, date: { gte: from } },
      orderBy: { date: 'asc' },
    });
  }

  private bucket(memories: number[]): MemoryBuckets {
    const b: MemoryBuckets = {
      masteredCount: 0,
      strongCount: 0,
      moderateCount: 0,
      fragileCount: 0,
      criticalCount: 0,
    };
    for (const m of memories) {
      if (m >= 90) b.masteredCount++;
      else if (m >= 70) b.strongCount++;
      else if (m >= 50) b.moderateCount++;
      else if (m >= 30) b.fragileCount++;
      else b.criticalCount++;
    }
    return b;
  }
}
