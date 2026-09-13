import { createGame, canApplyMove, applyMove, reviveGame, REVIVE_ROWS_CLEARED } from '../engine';
import { createRng } from '../bag';
import { createEmptyGrid, gridToStrings, GRID_SIZE, countCells } from '../grid';
import { POINTS_PER_CELL, POINTS_PER_LINE } from '../scoring';
import type { Piece } from '../types';

const single: Piece = { id: 'p-single', shapeId: 'single', colorId: 1, shape: [[true]] };

function stubState(overrides: Partial<ReturnType<typeof createGame>> = {}) {
  return { ...createGame(createRng(1)), ...overrides };
}

describe('createGame', () => {
  it('starts with an empty grid, zero score and three pieces', () => {
    const state = createGame(createRng(1));
    expect(gridToStrings(state.grid)).toEqual(gridToStrings(createEmptyGrid()));
    expect(state.score).toBe(0);
    expect(state.combo).toBe(1);
    expect(state.isGameOver).toBe(false);
    expect(state.pieces.filter(Boolean)).toHaveLength(3);
    expect(state.movesPlayed).toBe(0);
    expect(state.linesCleared).toBe(0);
    expect(state.revivesUsed).toBe(0);
  });

  it('is deterministic for a given seed', () => {
    const a = createGame(createRng(77));
    const b = createGame(createRng(77));
    expect(a.pieces.map((p) => p?.shapeId)).toEqual(b.pieces.map((p) => p?.shapeId));
  });
});

describe('canApplyMove', () => {
  it('is false for an empty slot', () => {
    const state = stubState({ pieces: [null, null, null] });
    expect(canApplyMove(state, 0, 0, 0)).toBe(false);
  });

  it('is false for an out-of-range slot', () => {
    const state = createGame(createRng(1));
    expect(canApplyMove(state, 5, 0, 0)).toBe(false);
    expect(canApplyMove(state, -1, 0, 0)).toBe(false);
  });

  it('is false once the game is over', () => {
    const state = stubState({ isGameOver: true });
    expect(canApplyMove(state, 0, 0, 0)).toBe(false);
  });
});

describe('applyMove', () => {
  it('throws on an invalid move', () => {
    const state = stubState({ pieces: [null, null, null] });
    expect(() => applyMove(state, 0, 0, 0, createRng(1))).toThrow(/invalid move/i);
  });

  it('consumes only the played slot and scores the placed cells', () => {
    const state = stubState({ pieces: [single, single, single], score: 0 });
    const outcome = applyMove(state, 1, 0, 0, createRng(1));
    expect(outcome.state.pieces[0]).not.toBeNull();
    expect(outcome.state.pieces[1]).toBeNull();
    expect(outcome.state.pieces[2]).not.toBeNull();
    expect(outcome.pointsGained).toBe(POINTS_PER_CELL);
    expect(outcome.state.score).toBe(POINTS_PER_CELL);
    expect(outcome.state.movesPlayed).toBe(1);
  });

  it('does not mutate the previous state', () => {
    const state = stubState({ pieces: [single, single, single] });
    const before = gridToStrings(state.grid);
    applyMove(state, 0, 3, 3, createRng(1));
    expect(gridToStrings(state.grid)).toEqual(before);
    expect(state.pieces[0]).toBe(single);
  });

  it('refills the tray only once all three pieces are used', () => {
    let state = stubState({ pieces: [single, single, single] });
    const rng = createRng(4);
    state = applyMove(state, 0, 0, 0, rng).state;
    expect(state.pieces.filter(Boolean)).toHaveLength(2);
    state = applyMove(state, 1, 0, 1, rng).state;
    expect(state.pieces.filter(Boolean)).toHaveLength(1);
    const last = applyMove(state, 2, 0, 2, rng);
    expect(last.refilled).toBe(true);
    expect(last.state.pieces.filter(Boolean)).toHaveLength(3);
  });

  it('clears a completed row and scores the line bonus', () => {
    const grid = createEmptyGrid();
    for (let c = 0; c < GRID_SIZE - 1; c += 1) grid[0][c] = 2;
    const state = stubState({ grid, pieces: [single, single, single], combo: 1 });
    const outcome = applyMove(state, 0, 0, GRID_SIZE - 1, createRng(1));

    expect(outcome.cleared).toEqual({ rows: [0], cols: [] });
    expect(outcome.pointsGained).toBe(POINTS_PER_CELL + POINTS_PER_LINE);
    expect(outcome.state.grid[0].every((cell) => cell === null)).toBe(true);
    expect(outcome.state.linesCleared).toBe(1);
    expect(outcome.state.combo).toBe(2);
  });

  it('scores a simultaneous row and column clear', () => {
    const grid = createEmptyGrid();
    for (let c = 0; c < GRID_SIZE; c += 1) if (c !== 3) grid[3][c] = 2;
    for (let r = 0; r < GRID_SIZE; r += 1) if (r !== 3) grid[r][3] = 2;
    const state = stubState({ grid, pieces: [single, single, single] });
    const outcome = applyMove(state, 0, 3, 3, createRng(1));

    expect(outcome.cleared).toEqual({ rows: [3], cols: [3] });
    expect(outcome.pointsGained).toBe(POINTS_PER_CELL + POINTS_PER_LINE * 4);
    expect(outcome.state.linesCleared).toBe(2);
  });

  it('resets the combo after a turn that clears nothing', () => {
    const state = stubState({ pieces: [single, single, single], combo: 3 });
    const outcome = applyMove(state, 0, 4, 4, createRng(1));
    expect(outcome.state.combo).toBe(1);
  });

  it('flags game over when no remaining piece fits the board', () => {
    // Board full except isolated single-cell holes on the diagonal (so every row and column
    // keeps a hole and nothing clears), plus one spare hole to play into.
    const grid = createEmptyGrid().map((row) => row.map<number | null>(() => 1));
    for (let i = 0; i < GRID_SIZE; i += 1) grid[i][i] = null;
    grid[0][2] = null;

    const square2: Piece = {
      id: 'p-square2',
      shapeId: 'square2',
      colorId: 2,
      shape: [
        [true, true],
        [true, true],
      ],
    };
    const line5: Piece = {
      id: 'p-line5',
      shapeId: 'line5H',
      colorId: 3,
      shape: [[true, true, true, true, true]],
    };

    const state = stubState({ grid, pieces: [single, square2, line5] });
    const outcome = applyMove(state, 0, 0, 2, createRng(1));

    expect(outcome.refilled).toBe(false);
    expect(outcome.cleared).toEqual({ rows: [], cols: [] });
    expect(outcome.gameOver).toBe(true);
    expect(outcome.state.isGameOver).toBe(true);
  });

  it('is not game over while a remaining piece still fits', () => {
    const state = stubState({ pieces: [single, single, single] });
    const outcome = applyMove(state, 0, 0, 0, createRng(1));
    expect(outcome.gameOver).toBe(false);
  });

  it('tracks the highest combo reached in the run', () => {
    const grid = createEmptyGrid();
    for (let c = 0; c < GRID_SIZE - 1; c += 1) grid[0][c] = 2;
    const state = stubState({ grid, pieces: [single, single, single], combo: 2, bestCombo: 2 });
    const outcome = applyMove(state, 0, 0, GRID_SIZE - 1, createRng(1));
    expect(outcome.state.bestCombo).toBe(3);
  });
});

describe('reviveGame', () => {
  it('clears the most-filled rows and resumes play', () => {
    const grid = createEmptyGrid().map((row) => row.map<number | null>(() => 1));
    grid[7][0] = null;
    const state = stubState({ grid, isGameOver: true, pieces: [null, null, null] });
    const revived = reviveGame(state, createRng(1));

    expect(revived.isGameOver).toBe(false);
    expect(revived.revivesUsed).toBe(1);
    expect(revived.pieces.filter(Boolean)).toHaveLength(3);

    const emptyRows = revived.grid.filter((row) => row.every((cell) => cell === null));
    expect(emptyRows.length).toBeGreaterThanOrEqual(REVIVE_ROWS_CLEARED);
  });

  it('keeps the score and resets the combo', () => {
    const state = stubState({ score: 250, combo: 4, isGameOver: true });
    const revived = reviveGame(state, createRng(1));
    expect(revived.score).toBe(250);
    expect(revived.combo).toBe(1);
  });

  it('produces a playable board', () => {
    const grid = createEmptyGrid().map((row) => row.map<number | null>(() => 1));
    const state = stubState({ grid, isGameOver: true });
    const revived = reviveGame(state, createRng(9));
    const openCells = revived.grid.flat().filter((cell) => cell === null).length;
    expect(openCells).toBeGreaterThanOrEqual(REVIVE_ROWS_CLEARED * GRID_SIZE);
    expect(revived.pieces.every((p) => p === null || countCells(p.shape) > 0)).toBe(true);
  });
});
