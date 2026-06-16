import { Injectable } from '@nestjs/common';

// FSRS v4 default weights (19 parameters, Jarrett Ye 2022)
const W = [
  0.4072, 1.1829, 3.1262, 15.4722,
  7.2102, 0.5316, 1.0651, 0.0589,
  1.5330, 0.1544, 1.0045, 1.9722,
  0.1109, 0.2900, 2.2700, 0.0100,
  2.9898, 0.5100, 0.8000,
];

const FACTOR = 19 / 81; // guarantees R=0.9 when elapsed_days = stability

export type FsrsRating = 1 | 2 | 3 | 4; // 1=Again, 2=Hard, 3=Good, 4=Easy

export interface FsrsState {
  stability: number;
  difficulty: number;
  retrievability: number;
  interval: number;
  reviews: number;
  lapses: number;
  state: 'New' | 'Learning' | 'Review' | 'Relearning';
  due: Date;
}

@Injectable()
export class FsrsService {
  retrievability(elapsedDays: number, stability: number): number {
    if (stability <= 0) return 0;
    return Math.pow(1 + FACTOR * elapsedDays / stability, -1);
  }

  private initStability(rating: FsrsRating): number {
    return Math.max(0.1, W[rating - 1]);
  }

  private initDifficulty(rating: FsrsRating): number {
    return this.clampDifficulty(W[4] - Math.exp(W[5] * (rating - 1)) + 1);
  }

  private clampDifficulty(d: number): number {
    return Math.min(10, Math.max(1, d));
  }

  private updateDifficulty(D: number, rating: FsrsRating): number {
    const deltaD = -W[6] * (rating - 3);
    const linear = D + deltaD * ((10 - D) / 9);
    const d2 = W[7] * this.initDifficulty(4) + (1 - W[7]) * linear;
    return this.clampDifficulty(d2);
  }

  private stabilityAfterRecall(S: number, D: number, R: number, rating: FsrsRating): number {
    const hardPenalty = rating === 2 ? W[15] : 1.0;
    const easyBonus = rating === 4 ? W[16] : 1.0;
    const delta =
      Math.exp(W[8]) *
      (11 - D) *
      Math.pow(S, -W[9]) *
      (Math.exp(W[10] * (1 - R)) - 1);
    return Math.max(0.1, S * (delta * hardPenalty * easyBonus + 1));
  }

  private stabilityAfterForgetting(S: number, D: number, R: number): number {
    return Math.max(
      0.1,
      W[11] * Math.pow(D, -W[12]) * (Math.pow(S + 1, W[13]) - 1) * Math.exp(W[14] * (1 - R)),
    );
  }

  private nextInterval(stability: number, targetRetention = 0.9): number {
    const interval = (9 * stability * targetRetention) / (1 - targetRetention);
    return Math.min(36500, Math.max(1, Math.round(interval)));
  }

  private addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  schedule(current: FsrsState, fsrsRating: FsrsRating, elapsedDays: number): FsrsState {
    const R = this.retrievability(elapsedDays, current.stability);
    let S: number;
    let D: number;
    let newState: FsrsState['state'];
    let lapses = current.lapses;

    if (current.reviews === 0) {
      S = this.initStability(fsrsRating);
      D = this.initDifficulty(fsrsRating);
      newState = fsrsRating === 1 ? 'Learning' : 'Review';
    } else if (fsrsRating === 1) {
      S = this.stabilityAfterForgetting(current.stability, current.difficulty, R);
      D = this.updateDifficulty(current.difficulty, fsrsRating);
      lapses += 1;
      newState = 'Relearning';
    } else {
      S = this.stabilityAfterRecall(current.stability, current.difficulty, R, fsrsRating);
      D = this.updateDifficulty(current.difficulty, fsrsRating);
      newState = 'Review';
    }

    const interval = newState === 'Learning' ? 1 : this.nextInterval(S);
    const due = this.addDays(new Date(), interval);

    return {
      stability: Math.max(0.1, S),
      difficulty: this.clampDifficulty(D),
      retrievability: R,
      interval,
      reviews: current.reviews + 1,
      lapses,
      state: newState,
      due,
    };
  }

  mapFrontendRating(frontendRating: number): FsrsRating {
    // Frontend: 1=Blackout, 2=Fail, 3=Hard, 4=Good, 5=Easy
    // FSRS:     1=Again,    1=Again, 2=Hard,  3=Good, 4=Easy
    const map: Record<number, FsrsRating> = { 1: 1, 2: 1, 3: 2, 4: 3, 5: 4 };
    return map[frontendRating] ?? 3;
  }
}
