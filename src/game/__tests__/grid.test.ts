import {
  GRID_SIZE,
  createEmptyGrid,
  cloneGrid,
  gridFromStrings,
  gridToStrings,
  canPlacePiece,
  placePiece,
  findCompletedLines,
  clearLines,
  countCells,
  hasAnyValidPlacement,
  findValidPlacements,
  isGameOver,
} from '../grid';
import type { Piece } from '../types';

const square2: Piece = {
  id: 'sq2',
  shapeId: 'square2',
  colorId: 1,
  shape: [
    [true, true],
    [true, true],
  ],
};

const single: Piece = { id: 's1', shapeId: 'single', colorId: 2, shape: [[true]] };

const lineH5: Piece = {
  id: 'l5',
  shapeId: 'line5H',
  colorId: 3,
  shape: [[true, true, true, true, true]],
};

const lShape: Piece = {
  id: 'lp',
  shapeId: 'lThree',
  colorId: 4,
  shape: [
    [true, false],
    [true, true],
  ],
};

describe('createEmptyGrid', () => {
  it('creates an 8x8 grid of empty cells by default', () => {
    const grid = createEmptyGrid();
    expect(GRID_SIZE).toBe(8);
    expect(grid).toHaveLength(8);
    grid.forEach((row) => {
      expect(row).toHaveLength(8);
      row.forEach((cell) => expect(cell).toBeNull());
    });
  });

  it('does not share row references between rows', () => {
    const grid = createEmptyGrid();
    grid[0][0] = 5;
    expect(grid[1][0]).toBeNull();
  });
});

describe('gridFromStrings / gridToStrings', () => {
  it('round-trips a textual grid representation', () => {
    const rows = [
      '#.......',
      '........',
      '........',
      '........',
      '........',
      '........',
      '........',
      '.......#',
    ];
    const grid = gridFromStrings(rows);
    expect(grid[0][0]).not.toBeNull();
    expect(grid[7][7]).not.toBeNull();
    expect(gridToStrings(grid)).toEqual(rows);
  });
});

describe('canPlacePiece', () => {
  it('allows placement on an empty grid', () => {
    expect(canPlacePiece(createEmptyGrid(), square2, 0, 0)).toBe(true);
  });

  it('rejects negative coordinates', () => {
    const grid = createEmptyGrid();
    expect(canPlacePiece(grid, square2, -1, 0)).toBe(false);
    expect(canPlacePiece(grid, square2, 0, -1)).toBe(false);
  });

  it('allows placement flush against the bottom-right boundary', () => {
    expect(canPlacePiece(createEmptyGrid(), square2, 6, 6)).toBe(true);
  });

  it('rejects placement that overflows the right edge', () => {
    expect(canPlacePiece(createEmptyGrid(), square2, 0, 7)).toBe(false);
  });

  it('rejects placement that overflows the bottom edge', () => {
    expect(canPlacePiece(createEmptyGrid(), square2, 7, 0)).toBe(false);
  });

  it('rejects placement onto an occupied cell', () => {
    const grid = createEmptyGrid();
    grid[1][1] = 9;
    expect(canPlacePiece(grid, square2, 0, 0)).toBe(false);
  });

  it('ignores empty cells inside a piece shape when checking collisions', () => {
    const grid = createEmptyGrid();
    grid[0][1] = 9; // the hole of lShape
    expect(canPlacePiece(grid, lShape, 0, 0)).toBe(true);
  });

  it('handles a full-width piece at the only fitting column', () => {
    const grid = createEmptyGrid();
    expect(canPlacePiece(grid, lineH5, 3, 3)).toBe(true);
    expect(canPlacePiece(grid, lineH5, 3, 4)).toBe(false);
  });
});

describe('placePiece', () => {
  it('stamps the piece colour into the grid', () => {
    const grid = createEmptyGrid();
    const next = placePiece(grid, square2, 2, 3);
    expect(next[2][3]).toBe(square2.colorId);
    expect(next[2][4]).toBe(square2.colorId);
    expect(next[3][3]).toBe(square2.colorId);
    expect(next[3][4]).toBe(square2.colorId);
  });

  it('is pure and does not mutate the input grid', () => {
    const grid = createEmptyGrid();
    const snapshot = gridToStrings(grid);
    placePiece(grid, square2, 0, 0);
    expect(gridToStrings(grid)).toEqual(snapshot);
  });

  it('throws when the placement is invalid', () => {
    expect(() => placePiece(createEmptyGrid(), square2, 7, 7)).toThrow(/invalid placement/i);
  });
});

describe('findCompletedLines', () => {
  it('returns nothing for an empty grid', () => {
    expect(findCompletedLines(createEmptyGrid())).toEqual({ rows: [], cols: [] });
  });

  it('detects a completed row', () => {
    const grid = gridFromStrings([
      '########',
      '........',
      '........',
      '........',
      '........',
      '........',
      '........',
      '........',
    ]);
    expect(findCompletedLines(grid)).toEqual({ rows: [0], cols: [] });
  });

  it('detects a completed column', () => {
    const grid = createEmptyGrid();
    for (let r = 0; r < GRID_SIZE; r += 1) grid[r][5] = 1;
    expect(findCompletedLines(grid)).toEqual({ rows: [], cols: [5] });
  });

  it('detects a simultaneous row and column clear', () => {
    const grid = createEmptyGrid();
    for (let c = 0; c < GRID_SIZE; c += 1) grid[2][c] = 1;
    for (let r = 0; r < GRID_SIZE; r += 1) grid[r][4] = 1;
    expect(findCompletedLines(grid)).toEqual({ rows: [2], cols: [4] });
  });

  it('does not report a row that is one cell short', () => {
    const grid = gridFromStrings([
      '#######.',
      '........',
      '........',
      '........',
      '........',
      '........',
      '........',
      '........',
    ]);
    expect(findCompletedLines(grid)).toEqual({ rows: [], cols: [] });
  });
});

describe('clearLines', () => {
  it('empties the given rows and columns', () => {
    const grid = createEmptyGrid();
    for (let c = 0; c < GRID_SIZE; c += 1) grid[2][c] = 1;
    for (let r = 0; r < GRID_SIZE; r += 1) grid[r][4] = 1;
    grid[7][7] = 6;

    const next = clearLines(grid, { rows: [2], cols: [4] });
    expect(next[2].every((cell) => cell === null)).toBe(true);
    expect(next.every((row) => row[4] === null)).toBe(true);
    expect(next[7][7]).toBe(6);
  });

  it('returns an equal grid when there is nothing to clear', () => {
    const grid = gridFromStrings([
      '#.......',
      '........',
      '........',
      '........',
      '........',
      '........',
      '........',
      '........',
    ]);
    expect(gridToStrings(clearLines(grid, { rows: [], cols: [] }))).toEqual(gridToStrings(grid));
  });

  it('is pure and does not mutate the input grid', () => {
    const grid = createEmptyGrid();
    for (let c = 0; c < GRID_SIZE; c += 1) grid[0][c] = 1;
    const snapshot = gridToStrings(grid);
    clearLines(grid, { rows: [0], cols: [] });
    expect(gridToStrings(grid)).toEqual(snapshot);
  });
});

describe('countCells', () => {
  it('counts the filled cells of a piece shape', () => {
    expect(countCells(square2.shape)).toBe(4);
    expect(countCells(lShape.shape)).toBe(3);
    expect(countCells(single.shape)).toBe(1);
  });
});

describe('findValidPlacements / hasAnyValidPlacement', () => {
  it('finds every placement of a single cell on an empty grid', () => {
    expect(findValidPlacements(createEmptyGrid(), single)).toHaveLength(64);
  });

  it('finds no placement when the grid is completely full', () => {
    const grid = createEmptyGrid().map((row) => row.map(() => 1));
    expect(findValidPlacements(grid, single)).toHaveLength(0);
    expect(hasAnyValidPlacement(grid, single)).toBe(false);
  });

  it('finds the single remaining hole', () => {
    const grid = createEmptyGrid().map((row) => row.map(() => 1));
    grid[5][6] = null;
    expect(findValidPlacements(grid, single)).toEqual([{ row: 5, col: 6 }]);
    expect(hasAnyValidPlacement(grid, single)).toBe(true);
  });
});

describe('isGameOver', () => {
  it('is false on an empty grid', () => {
    expect(isGameOver(createEmptyGrid(), [square2, lineH5, single])).toBe(false);
  });

  it('is true when the grid is full', () => {
    const grid = createEmptyGrid().map((row) => row.map(() => 1));
    expect(isGameOver(grid, [single])).toBe(true);
  });

  it('is true when the only gaps are too small for every remaining piece', () => {
    const grid = createEmptyGrid().map((row) => row.map(() => 1));
    grid[0][0] = null;
    grid[7][7] = null;
    expect(isGameOver(grid, [square2, lineH5])).toBe(true);
  });

  it('is false when at least one piece still fits', () => {
    const grid = createEmptyGrid().map((row) => row.map(() => 1));
    grid[0][0] = null;
    expect(isGameOver(grid, [square2, single])).toBe(false);
  });

  it('is true when there are no pieces left to place', () => {
    expect(isGameOver(createEmptyGrid(), [])).toBe(true);
  });
});

describe('cloneGrid', () => {
  it('produces an independent copy', () => {
    const grid = createEmptyGrid();
    const copy = cloneGrid(grid);
    copy[0][0] = 3;
    expect(grid[0][0]).toBeNull();
  });
});
