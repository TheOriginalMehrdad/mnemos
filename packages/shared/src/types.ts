/** Shared DTO / payload types used across the API and (optionally) the frontend. */

import type { QueueReason, VaultPhase } from './enums';

export type RatingValue = 1 | 2 | 3 | 4 | 5;

/** A card as returned inside the adaptive review queue. */
export interface QueueCard {
  id: string;
  noteId: string;
  domain: string;
  topic: string;
  type: string;
  front: string;
  back: string;
  language: string;
  urgencyScore: number;
  reason: QueueReason;
  nextReview: string | null;
  memoryScore: number;
}

/** Result of rating a card. */
export interface RateResult {
  nextReview: string;
  newStability: number;
  newDifficulty: number;
  newRetrievability: number;
  newUrgencyScore: number;
  streakDay: number;
}

export interface GraphNode {
  id: string;
  label: string;
  domain: string;
  level: 'note';
  connections: number;
  memory: number;
  memoryScore: number;
  urgencyScore: number;
  language: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
}

export interface GraphPayload {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// ─── WebSocket event payloads (namespace '/eruditio') ───────────────────────

export interface VaultProgressEvent {
  total: number;
  indexed: number;
  failed: number;
  phase: VaultPhase;
}

export interface VaultChangedEvent {
  noteId: string;
  slug: string;
  changeType: 'add' | 'change' | 'unlink';
}

export interface CardSummary {
  id: string;
  front: string;
  back: string;
  type: string;
}

export interface CardsGeneratedEvent {
  noteId: string;
  cardCount: number;
  cards: CardSummary[];
}

export interface ReviewRatedEvent {
  cardId: string;
  rating: RatingValue;
  nextReview: string;
  newUrgencyScore: number;
}

export interface ReviewResurfacedEvent {
  count: number;
}

/** All ERUDITIO realtime events keyed by their event name. */
export interface EruditioEvents {
  'vault:progress': VaultProgressEvent;
  'vault:changed': VaultChangedEvent;
  'cards:generated': CardsGeneratedEvent;
  'review:rated': ReviewRatedEvent;
  'review:resurfaced': ReviewResurfacedEvent;
  'stats:updated': { today: unknown };
}
