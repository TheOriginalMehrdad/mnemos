import { describe, it, expect } from 'vitest';
import { computeUrgency, interleave, AdaptiveWeights, ScorableCard } from './adaptive';
import { QueueReason } from './enums';

const WEIGHTS: AdaptiveWeights = {
  overdueWeight: 2.0,
  mistakeWeight: 1.5,
  newCardWeight: 0.8,
  streakBonusWeight: 0.1,
};

const NOW = new Date('2025-06-01T00:00:00Z');

function card(overrides: Partial<ScorableCard> = {}): ScorableCard {
  return {
    id: 'c',
    noteId: 'n',
    domain: 'd',
    stability: 10,
    nextReview: NOW, // due today by default (overdueRatio 0)
    reviewCount: 5,
    mistakeCount: 0,
    lastMistakeAt: null,
    correctStreak: 0,
    priorityBoost: 0,
    ...overrides,
  };
}

describe('computeUrgency', () => {
  it('scores a new card higher than a scheduled card due today', () => {
    const newCard = computeUrgency(card({ reviewCount: 0, nextReview: null }), WEIGHTS, NOW);
    const scheduled = computeUrgency(card(), WEIGHTS, NOW);

    expect(newCard.urgencyScore).toBeGreaterThan(scheduled.urgencyScore);
    expect(newCard.reason).toBe(QueueReason.New);
  });

  it('scores a card with 5 recent mistakes higher than one with 0 mistakes', () => {
    const mistakes = computeUrgency(card({ mistakeCount: 5, lastMistakeAt: NOW }), WEIGHTS, NOW);
    const clean = computeUrgency(card({ mistakeCount: 0 }), WEIGHTS, NOW);

    expect(mistakes.urgencyScore).toBeGreaterThan(clean.urgencyScore);
    expect(mistakes.reason).toBe(QueueReason.MistakeRecent);
  });

  it('scores a 10-day streak card lower than a card due today', () => {
    const streak = computeUrgency(card({ correctStreak: 10 }), WEIGHTS, NOW);
    const dueToday = computeUrgency(card({ correctStreak: 0 }), WEIGHTS, NOW);

    expect(streak.urgencyScore).toBeLessThan(dueToday.urgencyScore);
  });

  it('marks a strongly boosted card as long_absence', () => {
    const result = computeUrgency(card({ priorityBoost: 1.5 }), WEIGHTS, NOW);
    expect(result.reason).toBe(QueueReason.LongAbsence);
  });
});

describe('interleave', () => {
  it('surfaces the lone domain-B card no later than position 3 among 5 domain-A cards', () => {
    const cards = [
      { id: 'a1', noteId: 'na1', domain: 'A' },
      { id: 'a2', noteId: 'na2', domain: 'A' },
      { id: 'a3', noteId: 'na3', domain: 'A' },
      { id: 'a4', noteId: 'na4', domain: 'A' },
      { id: 'a5', noteId: 'na5', domain: 'A' },
      { id: 'b1', noteId: 'nb1', domain: 'B' },
    ];

    const ordered = interleave(cards, 2);
    const bIndex = ordered.findIndex((c) => c.domain === 'B');

    expect(bIndex).toBeGreaterThanOrEqual(0);
    expect(bIndex).toBeLessThanOrEqual(2);
  });
});
