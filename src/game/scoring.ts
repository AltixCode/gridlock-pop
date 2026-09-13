export const POINTS_PER_CELL = 1;
export const POINTS_PER_LINE = 10;
export const MAX_COMBO = 5;

export interface ScoreInput {
  cellsPlaced: number;
  linesCleared: number;
  /** Combo multiplier in effect for this placement (>= 1). */
  combo: number;
}

export interface ScoreResult {
  points: number;
  lineBonus: number;
  /** Combo to carry into the next placement. */
  combo: number;
}

export function nextCombo(combo: number, linesCleared: number): number {
  if (linesCleared <= 0) return 1;
  return Math.min(combo + 1, MAX_COMBO);
}

export function scorePlacement({ cellsPlaced, linesCleared, combo }: ScoreInput): ScoreResult {
  if (cellsPlaced < 0) throw new Error('cellsPlaced must be >= 0');
  if (linesCleared < 0) throw new Error('linesCleared must be >= 0');
  if (combo < 1) throw new Error('combo must be >= 1');

  // Simultaneous clears grow quadratically; the combo streak multiplies the line bonus only,
  // so grinding single placements can never inflate the score.
  const lineBonus = POINTS_PER_LINE * linesCleared * linesCleared * combo;
  const points = cellsPlaced * POINTS_PER_CELL + lineBonus;

  return { points, lineBonus, combo: nextCombo(combo, linesCleared) };
}

export function isNewHighScore(score: number, highScore: number): boolean {
  return score > highScore;
}
