/**
 * ERUDITIO — adaptive review-queue scoring & interleaving (pure).
 *
 * Decides not just WHICH cards are due, but in what ORDER and with what URGENCY.
 * No I/O and no framework deps so it is fully unit-testable and shareable.
 */

import { QueueReason } from './enums';

/** Tunable weights — sourced from env/config in the API, never hardcoded. */
export interface AdaptiveWeights {
  overdueWeight: number;
  mistakeWeight: number;
  newCardWeight: number;
  streakBonusWeight: number;
}

/** The minimal card shape the scorer needs. */
export interface ScorableCard {
  id: string;
  noteId: string;
  domain: string;
  stability: number;
  nextReview: Date | null;
  reviewCount: number;
  mistakeCount: number;
  lastMistakeAt: Date | null;
  correctStreak: number;
  priorityBoost: number;
}

export interface ScoredCard {
  urgencyScore: number;
  reason: QueueReason;
}

const MS_PER_DAY = 86_400_000;
const STREAK_CAP = 0.5;
const RECENT_MISTAKE_DAYS = 7;
const LONG_ABSENCE_BOOST = 1.5;

/**
 * Compute a card's urgency score and the reason it surfaced.
 * @param card Card signals.
 * @param weights Tunable weights.
 * @param now Reference time.
 */
export function computeUrgency(card: ScorableCard, weights: AdaptiveWeights, now: Date = new Date()): ScoredCard {
  const isNewCard = card.reviewCount === 0 ? 1 : 0;

  const daysSinceNextReview = card.nextReview ? (now.getTime() - card.nextReview.getTime()) / MS_PER_DAY : 0;
  const overdueRatio = Math.max(0, daysSinceNextReview / Math.max(0.1, card.stability));

  const daysSinceLastMistake = card.lastMistakeAt
    ? (now.getTime() - card.lastMistakeAt.getTime()) / MS_PER_DAY
    : Infinity;
  const recencyMultiplier = daysSinceLastMistake < RECENT_MISTAKE_DAYS ? 2.0 : 1.0;
  const mistakePenalty = Math.log1p(card.mistakeCount) * recencyMultiplier;

  const streakTerm = Math.min(card.correctStreak * weights.streakBonusWeight, STREAK_CAP);

  const urgencyScore =
    weights.overdueWeight * overdueRatio +
    weights.mistakeWeight * mistakePenalty +
    weights.newCardWeight * isNewCard +
    card.priorityBoost -
    streakTerm;

  return { urgencyScore, reason: classify(card, isNewCard, overdueRatio, daysSinceLastMistake) };
}

function classify(
  card: ScorableCard,
  isNewCard: number,
  overdueRatio: number,
  daysSinceLastMistake: number,
): QueueReason {
  if (isNewCard) return QueueReason.New;
  if (card.mistakeCount > 0 && daysSinceLastMistake < RECENT_MISTAKE_DAYS) return QueueReason.MistakeRecent;
  if (card.priorityBoost >= LONG_ABSENCE_BOOST) return QueueReason.LongAbsence;
  if (overdueRatio > 0) return QueueReason.Overdue;
  return QueueReason.Scheduled;
}

/**
 * Reorder cards (already sorted by urgency desc) so that no more than
 * `maxConsecutive` in a row come from the same note or the same domain.
 * @param cards Cards sorted by urgency descending.
 * @param maxConsecutive Max allowed consecutive same-note/same-domain cards.
 */
export function interleave<T extends { noteId: string; domain: string }>(cards: T[], maxConsecutive = 2): T[] {
  const pool = [...cards];
  const result: T[] = [];

  while (pool.length > 0) {
    const idx = pickIndex(result, pool, maxConsecutive);
    result.push(pool.splice(idx, 1)[0]);
  }
  return result;
}

function pickIndex<T extends { noteId: string; domain: string }>(result: T[], pool: T[], max: number): number {
  if (result.length < max) return 0;
  const run = result.slice(result.length - max);

  const violates = (candidate: T): boolean =>
    run.every((c) => c.domain === candidate.domain) || run.every((c) => c.noteId === candidate.noteId);

  if (!violates(pool[0])) return 0;
  for (let i = 1; i < pool.length; i++) {
    if (!violates(pool[i])) return i;
  }
  return 0; // no non-violating alternative; accept the highest-scoring card
}
