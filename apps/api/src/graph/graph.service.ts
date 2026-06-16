import { Injectable } from '@nestjs/common';
import { GraphPayload, GraphNode, GraphEdge } from '@eruditio/shared';
import { PrismaService } from '../prisma/prisma.service';

export interface GraphOptions {
  domain?: string;
  minConnections?: number;
}

/** Builds the knowledge graph (notes as nodes, links as edges) for the UI. */
@Injectable()
export class GraphService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * @returns Graph nodes (with memory & urgency) and edges, filtered by options.
   */
  async buildGraph(userId: string, opts: GraphOptions = {}): Promise<GraphPayload> {
    const notes = await this.prisma.note.findMany({
      where: {
        userId,
        deletedAt: null,
        ...(opts.domain ? { domain: { key: opts.domain } } : {}),
      },
      include: {
        domain: true,
        cards: { select: { urgencyScore: true } },
        _count: { select: { linksFrom: true, linksTo: true } },
      },
    });

    const minConnections = opts.minConnections ?? 0;
    const nodes: GraphNode[] = notes
      .map((note) => {
        const connections = note._count.linksFrom + note._count.linksTo;
        const urgencyScore = note.cards.reduce((max, c) => Math.max(max, c.urgencyScore), 0);
        return {
          id: note.id,
          label: note.title,
          domain: note.domain.key,
          level: 'note' as const,
          connections,
          memory: Math.round(note.memory),
          memoryScore: Math.round(note.memory),
          urgencyScore: Number(urgencyScore.toFixed(4)),
          language: note.language,
        };
      })
      .filter((n) => n.connections >= minConnections);

    const nodeIds = new Set(nodes.map((n) => n.id));
    const links = await this.prisma.noteLink.findMany({
      where: { from: { userId, deletedAt: null }, to: { userId, deletedAt: null } },
    });
    const edges: GraphEdge[] = links
      .filter((l) => nodeIds.has(l.fromId) && nodeIds.has(l.toId))
      .map((l) => ({ source: l.fromId, target: l.toId, type: l.type }));

    return { nodes, edges };
  }
}
