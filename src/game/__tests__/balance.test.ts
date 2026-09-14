import {
  estimatedMinutes,
  greedyStrategy,
  measurePacing,
  playRun,
  randomStrategy,
} from '../simulate';
import { GRID_SIZE } from '../grid';

/**
 * Pacing guard. The shape weights in shapes.ts set how long a run lasts, and session length is
 * what the retention model rests on — so a weight change that quietly turns runs into 20-second
 * or 10-minute affairs should fail here rather than in the store reviews.
 *
 * Bounds are deliberately wide: this catches a regression, it does not pin the exact tuning.
 * Run `npm run balance` for the full measurement.
 */

const RUNS = 60;

describe('run pacing', () => {
  it('keeps a competent player in the 2-4 minute target band', () => {
    const stats = measurePacing(RUNS, greedyStrategy, 1000);
    const median = estimatedMinutes(stats.medianMoves);

    expect(median).toBeGreaterThan(1.5);
    expect(median).toBeLessThan(6);
  });

  it('rarely ends a competent run before it has begun', () => {
    const stats = measurePacing(RUNS, greedyStrategy, 2000);
    // A run that dies inside ten moves reads as "that was pointless" and costs Day-1 retention.
    expect(stats.shareVeryShort).toBeLessThan(0.1);
  });

  it('still ends runs — a careless player cannot play forever', () => {
    const stats = measurePacing(RUNS, randomStrategy, 3000);
    expect(stats.meanMoves).toBeGreaterThan(8);
    expect(stats.meanMoves).toBeLessThan(60);
  });

  it('rewards skill: playing well lasts several times longer', () => {
    const careless = measurePacing(RUNS, randomStrategy, 4000);
    const competent = measurePacing(RUNS, greedyStrategy, 4000);
    expect(competent.meanMoves).toBeGreaterThan(careless.meanMoves * 2);
    expect(competent.meanScore).toBeGreaterThan(careless.meanScore * 2);
  });
});

describe('engine invariants under sustained play', () => {
  it('never corrupts the board across thousands of moves', () => {
    for (let seed = 0; seed < 40; seed += 1) {
      const result = playRun(9000 + seed, greedyStrategy);

      expect(result.moves).toBeGreaterThan(0);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(result.score)).toBe(true);
      expect(result.linesCleared).toBeGreaterThanOrEqual(0);
      expect(result.bestCombo).toBeGreaterThanOrEqual(1);
      // Occupancy can never exceed the board itself.
      expect(result.finalOccupancy).toBeLessThanOrEqual(GRID_SIZE * GRID_SIZE);
    }
  });

  it('is reproducible from a seed', () => {
    const a = playRun(4242, greedyStrategy);
    const b = playRun(4242, greedyStrategy);
    expect(a).toEqual(b);
  });

  it('produces different runs from different seeds', () => {
    const a = playRun(1, greedyStrategy);
    const b = playRun(2, greedyStrategy);
    expect(a).not.toEqual(b);
  });
});
