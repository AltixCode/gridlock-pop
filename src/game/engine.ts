import { generateFairBag, generatePieceBag, PIECES_PER_BAG } from './bag';
import {
  GRID_SIZE,
  canPlacePiece,
  clearLines,
  countCells,
  createEmptyGrid,
  findCompletedLines,
  isGameOver,
  placePiece,
  rankRowsByFill,
} from './grid';
import { scorePlacement } from './scoring';
import type { CompletedLines, Grid, Piece, Rng } from './types';

/** Rows wiped when the player takes the rewarded-ad continue. */
export const REVIVE_ROWS_CLEARED = 3;

export interface GameState {
  grid: Grid;
  /** Fixed-length tray; a used slot is null until the whole tray refills. */
  pieces: (Piece | null)[];
  score: number;
  combo: number;
  bestCombo: number;
  movesPlayed: number;
  linesCleared: number;
  revivesUsed: number;
  isGameOver: boolean;
}

export interface MoveOutcome {
  state: GameState;
  cleared: CompletedLines;
  pointsGained: number;
  refilled: boolean;
  gameOver: boolean;
}

export function createGame(rng: Rng): GameState {
  const grid = createEmptyGrid(GRID_SIZE);
  return {
    grid,
    pieces: generateFairBag(grid, rng, PIECES_PER_BAG),
    score: 0,
    combo: 1,
    bestCombo: 1,
    movesPlayed: 0,
    linesCleared: 0,
    revivesUsed: 0,
    isGameOver: false,
  };
}

export function canApplyMove(state: GameState, slot: number, row: number, col: number): boolean {
  if (state.isGameOver) return false;
  if (!Number.isInteger(slot) || slot < 0 || slot >= state.pieces.length) return false;
  const piece = state.pieces[slot];
  if (!piece) return false;
  return canPlacePiece(state.grid, piece, row, col);
}

export function applyMove(
  state: GameState,
  slot: number,
  row: number,
  col: number,
  rng: Rng,
): MoveOutcome {
  if (!canApplyMove(state, slot, row, col)) {
    throw new Error(`Invalid move: slot ${slot} at ${row},${col}`);
  }
  const piece = state.pieces[slot] as Piece;

  const stamped = placePiece(state.grid, piece, row, col);
  const cleared = findCompletedLines(stamped);
  const linesCleared = cleared.rows.length + cleared.cols.length;
  const grid = clearLines(stamped, cleared);

  const { points, combo } = scorePlacement({
    cellsPlaced: countCells(piece.shape),
    linesCleared,
    combo: state.combo,
  });

  let pieces = state.pieces.map((slotPiece, index) => (index === slot ? null : slotPiece));
  const refilled = pieces.every((slotPiece) => slotPiece === null);
  // Mid-run refills are an honest draw: guaranteeing a playable bag here would make the run
  // effectively endless. The fair draw is reserved for the opening hand and the revive.
  if (refilled) pieces = generatePieceBag(rng, PIECES_PER_BAG);

  const next: GameState = {
    grid,
    pieces,
    score: state.score + points,
    combo,
    bestCombo: Math.max(state.bestCombo, combo),
    movesPlayed: state.movesPlayed + 1,
    linesCleared: state.linesCleared + linesCleared,
    revivesUsed: state.revivesUsed,
    isGameOver: isGameOver(grid, pieces),
  };

  return { state: next, cleared, pointsGained: points, refilled, gameOver: next.isGameOver };
}

/** Rewarded-ad continue: wipes the fullest rows, keeps the score, and deals a fresh tray. */
export function reviveGame(state: GameState, rng: Rng): GameState {
  const rows = rankRowsByFill(state.grid).slice(0, REVIVE_ROWS_CLEARED);
  const grid = clearLines(state.grid, { rows, cols: [] });

  return {
    ...state,
    grid,
    pieces: generateFairBag(grid, rng, PIECES_PER_BAG),
    combo: 1,
    revivesUsed: state.revivesUsed + 1,
    isGameOver: false,
  };
}
