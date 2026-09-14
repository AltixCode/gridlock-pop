import { createRng } from './bag';
import { applyMove, createGame, type GameState } from './engine';
import { findValidPlacements, GRID_SIZE } from './grid';
import type { Grid, Piece, Placement, Rng } from './types';

/**
 * Headless play-out of the game, used to measure pacing.
 *
 * Session length is the single number the whole retention model rests on, and it is set by the
 * shape weights in `shapes.ts`. Measuring it here means a weight change can be evaluated in
 * seconds instead of by playing twenty games by hand.
 */

export interface RunResult {
  moves: number;
  score: number;
  linesCleared: number;
  bestCombo: number;
  /** Cells filled at the moment the run ended — a proxy for how crowded the death was. */
  finalOccupancy: number;
}

export interface PacingStats {
  runs: number;
  meanMoves: number;
  medianMoves: number;
  p10Moves: number;
  p90Moves: number;
  meanScore: number;
  medianScore: number;
  meanLines: number;
  /** Share of runs that end within the first ten moves — the "that was pointless" experience. */
  shareVeryShort: number;
  /** Share of runs that run past 300 moves — long enough to feel like a chore. */
  shareVeryLong: number;
}

export type Strategy = (
  state: GameState,
  rng: Rng,
) => { slot: number; placement: Placement } | null;

/** A careless player: any legal move at all. Gives the lower bound on session length. */
export const randomStrategy: Strategy = (state, rng) => {
  const options: { slot: number; placement: Placement }[] = [];
  state.pieces.forEach((piece, slot) => {
    if (!piece) return;
    findValidPlacements(state.grid, piece).forEach((placement) =>
      options.push({ slot, placement }),
    );
  });
  if (options.length === 0) return null;
  return options[Math.floor(rng() * options.length)];
};

function countHoles(grid: Grid): number {
  // An empty cell whose orthogonal neighbours are mostly filled is hard to use later.
  let holes = 0;
  for (let r = 0; r < GRID_SIZE; r += 1) {
    for (let c = 0; c < GRID_SIZE; c += 1) {
      if (grid[r][c] !== null) continue;
      let blocked = 0;
      if (r === 0 || grid[r - 1][c] !== null) blocked += 1;
      if (r === GRID_SIZE - 1 || grid[r + 1][c] !== null) blocked += 1;
      if (c === 0 || grid[r][c - 1] !== null) blocked += 1;
      if (c === GRID_SIZE - 1 || grid[r][c + 1] !== null) blocked += 1;
      if (blocked >= 3) holes += 1;
    }
  }
  return holes;
}

function evaluate(grid: Grid, linesCleared: number): number {
  const occupied = grid.flat().filter((cell) => cell !== null).length;
  return linesCleared * 120 - countHoles(grid) * 8 - occupied * 2;
}

/**
 * A competent player: clears when it can and avoids fragmenting the board. Gives the upper
 * bound on session length — real players land between this and `randomStrategy`.
 */
export const greedyStrategy: Strategy = (state) => {
  let best: { slot: number; placement: Placement } | null = null;
  let bestScore = -Infinity;

  state.pieces.forEach((piece, slot) => {
    if (!piece) return;
    findValidPlacements(state.grid, piece).forEach((placement) => {
      const preview = simulatePlacement(state.grid, piece, placement);
      const value = evaluate(preview.grid, preview.linesCleared);
      if (value > bestScore) {
        bestScore = value;
        best = { slot, placement };
      }
    });
  });

  return best;
};

function simulatePlacement(grid: Grid, piece: Piece, placement: Placement) {
  const next = grid.map((row) => row.slice());
  piece.shape.forEach((shapeRow, r) =>
    shapeRow.forEach((filled, c) => {
      if (filled) next[placement.row + r][placement.col + c] = piece.colorId;
    }),
  );

  const fullRows: number[] = [];
  const fullCols: number[] = [];
  for (let r = 0; r < GRID_SIZE; r += 1) {
    if (next[r].every((cell) => cell !== null)) fullRows.push(r);
  }
  for (let c = 0; c < GRID_SIZE; c += 1) {
    let full = true;
    for (let r = 0; r < GRID_SIZE; r += 1) if (next[r][c] === null) full = false;
    if (full) fullCols.push(c);
  }

  const rowSet = new Set(fullRows);
  const colSet = new Set(fullCols);
  const cleared = next.map((row, r) =>
    row.map((cell, c) => (rowSet.has(r) || colSet.has(c) ? null : cell)),
  );

  return { grid: cleared, linesCleared: fullRows.length + fullCols.length };
}

/** Plays one run to completion. `maxMoves` guards against a strategy that never dies. */
export function playRun(seed: number, strategy: Strategy, maxMoves = 5000): RunResult {
  const rng = createRng(seed);
  let state = createGame(rng);
  let moves = 0;

  while (!state.isGameOver && moves < maxMoves) {
    const choice = strategy(state, rng);
    if (!choice) break;
    state = applyMove(state, choice.slot, choice.placement.row, choice.placement.col, rng).state;
    moves += 1;
  }

  return {
    moves,
    score: state.score,
    linesCleared: state.linesCleared,
    bestCombo: state.bestCombo,
    finalOccupancy: state.grid.flat().filter((cell) => cell !== null).length,
  };
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.round((p / 100) * (sorted.length - 1))),
  );
  return sorted[index];
}

function mean(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;
}

export function measurePacing(runs: number, strategy: Strategy, seed = 1): PacingStats {
  const results: RunResult[] = [];
  for (let i = 0; i < runs; i += 1) results.push(playRun(seed + i, strategy));

  const moves = results.map((r) => r.moves).sort((a, b) => a - b);
  const scores = results.map((r) => r.score).sort((a, b) => a - b);

  return {
    runs,
    meanMoves: mean(moves),
    medianMoves: percentile(moves, 50),
    p10Moves: percentile(moves, 10),
    p90Moves: percentile(moves, 90),
    meanScore: mean(scores),
    medianScore: percentile(scores, 50),
    meanLines: mean(results.map((r) => r.linesCleared)),
    shareVeryShort: results.filter((r) => r.moves <= 10).length / results.length,
    shareVeryLong: results.filter((r) => r.moves >= 300).length / results.length,
  };
}

/**
 * Assumed seconds per placement, used only to turn a move count into a readable session
 * length. This is an estimate, not a measurement — check it against real play during device
 * QA and adjust here if it is off, since every minute figure derives from it.
 */
export const SECONDS_PER_MOVE = 2.2;

export function estimatedMinutes(moves: number): number {
  return (moves * SECONDS_PER_MOVE) / 60;
}
