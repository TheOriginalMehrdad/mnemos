import { describe, it, expect } from 'vitest';
import { scheduleReview, retrievability, FSRSCard } from './fsrs';

function newCard(overrides: Partial<FSRSCard> = {}): FSRSCard {
  return {
    stability: 1,
    difficulty: 5,
    retrievability: 1,
    reviewCount: 0,
    lastReview: null,
    nextReview: null,
    easeFactor: 2.5,
    ...overrides,
  };
}

const DAY = 86_400_000;

describe('FSRS scheduleReview', () => {
  it('schedules a new card rated 4 (Good) with sensible interval and stability', () => {
    // Arrange
    const now = new Date('2025-01-01T00:00:00Z');
    const card = newCard();

    // Act
    const result = scheduleReview(card, 4, now);

    // Assert
    expect(result.stability).toBe(5.0);
    expect(result.interval).toBe(5);
    expect(result.retrievability).toBe(1);
    expect(result.nextReview.getTime()).toBe(now.getTime() + 5 * DAY);
    expect(result.difficulty).toBeGreaterThan(1);
    expect(result.difficulty).toBeLessThan(10);
  });

  it('resets a mature card to stability 1 and tomorrow when rated 1 after 30 days', () => {
    // Arrange
    const now = new Date('2025-02-01T00:00:00Z');
    const card = newCard({
      stability: 10,
      reviewCount: 5,
      lastReview: new Date(now.getTime() - 30 * DAY),
    });

    // Act
    const result = scheduleReview(card, 1, now);

    // Assert
    expect(result.stability).toBe(1.0);
    expect(result.interval).toBe(1);
    expect(result.nextReview.getTime()).toBe(now.getTime() + DAY);
    expect(result.retrievability).toBeCloseTo(Math.exp(-3), 3); // e^(-30/10)
  });

  it('grows the interval geometrically when rated 5 (Easy) three times', () => {
    // Arrange
    let now = new Date('2025-01-01T00:00:00Z');
    let card = newCard();
    const intervals: number[] = [];

    // Act — review at each due date
    for (let i = 0; i < 3; i++) {
      const result = scheduleReview(card, 5, now);
      intervals.push(result.interval);
      card = {
        stability: result.stability,
        difficulty: result.difficulty,
        retrievability: result.retrievability,
        reviewCount: card.reviewCount + 1,
        lastReview: now,
        nextReview: result.nextReview,
        easeFactor: card.easeFactor,
      };
      now = result.nextReview;
    }

    // Assert — strictly increasing with a roughly constant growth ratio
    expect(intervals[1]).toBeGreaterThan(intervals[0]);
    expect(intervals[2]).toBeGreaterThan(intervals[1]);
    const r1 = intervals[1] / intervals[0];
    const r2 = intervals[2] / intervals[1];
    expect(r1).toBeGreaterThan(1);
    expect(Math.abs(r1 - r2)).toBeLessThan(r1 * 0.5);
  });
});

describe('FSRS retrievability', () => {
  it('follows R = e^(-t/S) at t=0, t=S and t=2S', () => {
    const S = 12;
    expect(retrievability(0, S)).toBe(1);
    expect(retrievability(S, S)).toBeCloseTo(Math.exp(-1), 6);
    expect(retrievability(2 * S, S)).toBeCloseTo(Math.exp(-2), 6);
  });
});
