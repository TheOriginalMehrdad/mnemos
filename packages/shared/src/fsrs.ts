/**
 * ERUDITIO — FSRS (Free Spaced Repetition Scheduler) v4, pure implementation.
 *
 * This module is intentionally side-effect free: no I/O, no dates beyond the
 * `now` argument, no framework dependencies. It is consumed both by the API
 * (via a thin NestJS wrapper) and can be shared with the frontend.
 *
 * Rating scale (1–5), as used throughout ERUDITIO:
 *   1 = Blackout — total failure. Stability resets to 1.0, review again tomorrow.
 *   2 = Fail     — recalled wrong. Stability decays, review in 1–3 days.
 *   3 = Hard     — recalled with difficulty. Stability grows with a reduced multiplier.
 *   4 = Good     — standard successful recall. Standard stability growth.
 *   5 = Easy     — effortless recall. Bonus multiplier, interval pushed further.
 *
 * Retrievability is modelled with the exponential forgetting curve:
 *   R = e^(-t / S)   where t = days since last review, S = stability.
 */

export type FsrsRating = 1 | 2 | 3 | 4 | 5;

export interface FSRSCard {
  stability: number;
  difficulty: number;
  retrievability: number;
  reviewCount: number;
  lastReview: Date | null;
  nextReview: Date | null;
  easeFactor: number;
}

export interface FSRSResult {
  stability: number;
  difficulty: number;
  retrievability: number;
  nextReview: Date;
  /** Scheduling interval in whole days until the next review. */
  interval: number;
}

/** FSRS v4 default weights (19 parameters, Jarrett Ye 2022). */
const W = [
  0.4072, 1.1829, 3.1262, 15.4722, 7.2102, 0.5316, 1.0651, 0.0589, 1.5330,
  0.1544, 1.0045, 1.9722, 0.1109, 0.2900, 2.2700, 0.0100, 2.9898, 0.5100, 0.8000,
] as const;

/** Target retention used to size intervals; chosen so intervals scale with stability. */
const INTERVAL_FACTOR = 1.0;
const MS_PER_DAY = 86_400_000;
const MIN_STABILITY = 0.1;
const MAX_INTERVAL_DAYS = 36_500;

/**
 * Retrievability — the probability of recall right now, given elapsed time and stability.
 * @param elapsedDays Days since the last review (t).
 * @param stability Current memory stability (S).
 * @returns Recall probability in the range (0, 1]; R = e^(-t/S).
 */
export function retrievability(elapsedDays: number, stability: number): number {
  if (stability <= 0) return 0;
  if (elapsedDays <= 0) return 1;
  return Math.exp(-elapsedDays / stability);
}

/**
 * Memory score — a 0–100 health indicator derived from current retrievability.
 * @param card The card whose memory is being scored.
 * @param now Reference time (defaults to the current instant).
 * @returns Math.round(R * 100), clamped to [0, 100].
 */
export function memoryScore(card: Pick<FSRSCard, 'stability' | 'lastReview'>, now: Date = new Date()): number {
  const t = card.lastReview ? daysBetween(card.lastReview, now) : 0;
  const r = retrievability(t, card.stability);
  return clamp(Math.round(r * 100), 0, 100);
}

/**
 * Schedule the next review for a card given a rating.
 * @param card Current FSRS state of the card.
 * @param rating Grade given by the learner (1–5).
 * @param now Reference time for the review (defaults to the current instant).
 * @returns The updated stability, difficulty, retrievability, next review date and interval.
 */
export function scheduleReview(card: FSRSCard, rating: FsrsRating, now: Date = new Date()): FSRSResult {
  const isNew = card.reviewCount === 0;
  const elapsedDays = card.lastReview ? daysBetween(card.lastReview, now) : 0;
  const r = isNew ? 1 : retrievability(elapsedDays, card.stability);

  const difficulty = clamp(
    isNew ? initDifficulty(rating) : updateDifficulty(card.difficulty, rating),
    1,
    10,
  );

  let stability: number;
  let interval: number;

  if (rating === 1) {
    // Blackout — reset and relearn tomorrow.
    stability = 1.0;
    interval = 1;
  } else if (rating === 2) {
    // Fail — stability decays; surface again within 1–3 days.
    stability = isNew ? initStability(2) : stabilityAfterForgetting(card.stability, difficulty, r);
    interval = clamp(Math.round(stability), 1, 3);
  } else {
    // Hard / Good / Easy — successful recall.
    stability = isNew ? initStability(rating) : stabilityAfterRecall(card.stability, difficulty, r, rating);
    interval = nextInterval(stability);
  }

  return {
    stability: Math.max(MIN_STABILITY, stability),
    difficulty,
    retrievability: r,
    interval,
    nextReview: addDays(now, interval),
  };
}

// ─── internals ────────────────────────────────────────────────────────────

/** Initial stability for a brand-new card, in days, by rating. */
function initStability(rating: FsrsRating): number {
  const base: Record<FsrsRating, number> = { 1: 1.0, 2: 0.6, 3: 2.0, 4: 5.0, 5: 9.0 };
  return Math.max(MIN_STABILITY, base[rating]);
}

/** Initial difficulty for a brand-new card (rating 3 is the neutral anchor). */
function initDifficulty(rating: FsrsRating): number {
  return clamp(W[4] - Math.exp(W[5] * (rating - 3)) + 1, 1, 10);
}

/** Mean-reverting difficulty update: harder grades raise D, easier grades lower it. */
function updateDifficulty(d: number, rating: FsrsRating): number {
  const deltaD = -W[6] * (rating - 3);
  const linear = d + deltaD * ((10 - d) / 9);
  const reverted = W[7] * initDifficulty(4) + (1 - W[7]) * linear;
  return clamp(reverted, 1, 10);
}

/**
 * Stability after a successful recall (ratings 3–5).
 *
 * Stability is multiplied by a grade-dependent factor that is independent of S,
 * so repeated identical grades yield geometric interval growth. The factor is
 * modulated by retrievability (recalling after a longer gap strengthens memory
 * more) and gently by difficulty, while staying in a realistic range:
 *   Hard ≈ ×1.3, Good ≈ ×2.0, Easy ≈ ×2.6 (at equilibrium retrievability).
 */
function stabilityAfterRecall(s: number, d: number, r: number, rating: FsrsRating): number {
  const grade: Record<number, number> = { 3: 1.3, 4: 2.0, 5: 2.6 };
  const recallBonus = 1 + (1 - r) * 0.5; // harder retrieval → bigger boost
  const difficultyDamping = 1 - ((d - 1) / 9) * 0.2; // higher difficulty → slightly less growth
  const factor = Math.max(1.05, (grade[rating] ?? 1.3) * recallBonus * difficultyDamping);
  return Math.max(MIN_STABILITY, s * factor);
}

/** Stability after forgetting (rating 2) — a fraction of prior stability. */
function stabilityAfterForgetting(s: number, d: number, r: number): number {
  return Math.max(
    MIN_STABILITY,
    W[11] * Math.pow(d, -W[12]) * (Math.pow(s + 1, W[13]) - 1) * Math.exp(W[14] * (1 - r)),
  );
}

/** Interval in whole days for a given stability. */
function nextInterval(stability: number): number {
  return clamp(Math.round(stability * INTERVAL_FACTOR), 1, MAX_INTERVAL_DAYS);
}

function daysBetween(from: Date, to: Date): number {
  return Math.max(0, (to.getTime() - from.getTime()) / MS_PER_DAY);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
