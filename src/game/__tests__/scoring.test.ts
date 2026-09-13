import {
  POINTS_PER_CELL,
  POINTS_PER_LINE,
  MAX_COMBO,
  scorePlacement,
  nextCombo,
  isNewHighScore,
} from '../scoring';

describe('nextCombo', () => {
  it('resets to 1 when a placement clears nothing', () => {
    expect(nextCombo(4, 0)).toBe(1);
  });

  it('increments on a clearing placement', () => {
    expect(nextCombo(1, 1)).toBe(2);
    expect(nextCombo(2, 3)).toBe(3);
  });

  it('is capped at MAX_COMBO', () => {
    expect(nextCombo(MAX_COMBO, 2)).toBe(MAX_COMBO);
    expect(MAX_COMBO).toBeGreaterThan(1);
  });
});

describe('scorePlacement', () => {
  it('awards one point per placed cell when nothing clears', () => {
    const result = scorePlacement({ cellsPlaced: 4, linesCleared: 0, combo: 1 });
    expect(result.points).toBe(4 * POINTS_PER_CELL);
    expect(result.combo).toBe(1);
    expect(result.lineBonus).toBe(0);
  });

  it('awards a quadratic bonus for simultaneous clears', () => {
    const one = scorePlacement({ cellsPlaced: 0, linesCleared: 1, combo: 1 });
    const two = scorePlacement({ cellsPlaced: 0, linesCleared: 2, combo: 1 });
    const three = scorePlacement({ cellsPlaced: 0, linesCleared: 3, combo: 1 });
    expect(one.points).toBe(POINTS_PER_LINE);
    expect(two.points).toBe(POINTS_PER_LINE * 4);
    expect(three.points).toBe(POINTS_PER_LINE * 9);
  });

  it('multiplies only the line bonus by the incoming combo', () => {
    const result = scorePlacement({ cellsPlaced: 3, linesCleared: 1, combo: 3 });
    expect(result.lineBonus).toBe(POINTS_PER_LINE * 3);
    expect(result.points).toBe(3 * POINTS_PER_CELL + POINTS_PER_LINE * 3);
  });

  it('advances the combo across consecutive clearing turns', () => {
    let combo = 1;
    const totals: number[] = [];
    for (let turn = 0; turn < 3; turn += 1) {
      const result = scorePlacement({ cellsPlaced: 2, linesCleared: 1, combo });
      totals.push(result.points);
      combo = result.combo;
    }
    expect(combo).toBe(4);
    expect(totals).toEqual([
      2 * POINTS_PER_CELL + POINTS_PER_LINE * 1,
      2 * POINTS_PER_CELL + POINTS_PER_LINE * 2,
      2 * POINTS_PER_CELL + POINTS_PER_LINE * 3,
    ]);
  });

  it('drops the combo back to 1 after a non-clearing turn', () => {
    const kept = scorePlacement({ cellsPlaced: 1, linesCleared: 1, combo: 2 });
    expect(kept.combo).toBe(3);
    const dropped = scorePlacement({ cellsPlaced: 1, linesCleared: 0, combo: kept.combo });
    expect(dropped.combo).toBe(1);
  });

  it('never returns a negative or fractional score', () => {
    const result = scorePlacement({ cellsPlaced: 0, linesCleared: 0, combo: 1 });
    expect(result.points).toBe(0);
    expect(Number.isInteger(result.points)).toBe(true);
  });

  it('rejects nonsensical input', () => {
    expect(() => scorePlacement({ cellsPlaced: -1, linesCleared: 0, combo: 1 })).toThrow();
    expect(() => scorePlacement({ cellsPlaced: 0, linesCleared: -2, combo: 1 })).toThrow();
    expect(() => scorePlacement({ cellsPlaced: 0, linesCleared: 0, combo: 0 })).toThrow();
  });
});

describe('isNewHighScore', () => {
  it('is true only when strictly greater', () => {
    expect(isNewHighScore(10, 9)).toBe(true);
    expect(isNewHighScore(10, 10)).toBe(false);
    expect(isNewHighScore(0, 0)).toBe(false);
  });
});
