import type { Cell, CompletedLines, Grid, Piece, Placement, ShapeCells } from './types';

export const GRID_SIZE = 8;

export function createEmptyGrid(size: number = GRID_SIZE): Grid {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => null as Cell));
}

export function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => row.slice());
}

/** Test/debug helper: '#' is filled, '.' is empty. */
export function gridFromStrings(rows: string[]): Grid {
  return rows.map((row) => row.split('').map<Cell>((char) => (char === '.' ? null : 1)));
}

export function gridToStrings(grid: Grid): string[] {
  return grid.map((row) => row.map((cell) => (cell === null ? '.' : '#')).join(''));
}

export function countCells(shape: ShapeCells): number {
  return shape.reduce((total, row) => total + row.filter(Boolean).length, 0);
}

export function canPlacePiece(grid: Grid, piece: Piece, row: number, col: number): boolean {
  if (!Number.isInteger(row) || !Number.isInteger(col)) return false;
  if (row < 0 || col < 0) return false;

  const size = grid.length;
  for (let r = 0; r < piece.shape.length; r += 1) {
    for (let c = 0; c < piece.shape[r].length; c += 1) {
      if (!piece.shape[r][c]) continue;
      const gr = row + r;
      const gc = col + c;
      if (gr >= size || gc >= grid[gr].length) return false;
      if (grid[gr][gc] !== null) return false;
    }
  }
  return true;
}

export function placePiece(grid: Grid, piece: Piece, row: number, col: number): Grid {
  if (!canPlacePiece(grid, piece, row, col)) {
    throw new Error(`Invalid placement of ${piece.shapeId} at ${row},${col}`);
  }
  const next = cloneGrid(grid);
  for (let r = 0; r < piece.shape.length; r += 1) {
    for (let c = 0; c < piece.shape[r].length; c += 1) {
      if (piece.shape[r][c]) next[row + r][col + c] = piece.colorId;
    }
  }
  return next;
}

export function findCompletedLines(grid: Grid): CompletedLines {
  const size = grid.length;
  const rows: number[] = [];
  const cols: number[] = [];

  for (let r = 0; r < size; r += 1) {
    if (grid[r].every((cell) => cell !== null)) rows.push(r);
  }
  for (let c = 0; c < size; c += 1) {
    let full = true;
    for (let r = 0; r < size; r += 1) {
      if (grid[r][c] === null) {
        full = false;
        break;
      }
    }
    if (full) cols.push(c);
  }
  return { rows, cols };
}

export function clearLines(grid: Grid, lines: CompletedLines): Grid {
  if (lines.rows.length === 0 && lines.cols.length === 0) return cloneGrid(grid);

  const rowSet = new Set(lines.rows);
  const colSet = new Set(lines.cols);
  return grid.map((row, r) => row.map((cell, c) => (rowSet.has(r) || colSet.has(c) ? null : cell)));
}

export function findValidPlacements(grid: Grid, piece: Piece): Placement[] {
  const placements: Placement[] = [];
  const size = grid.length;
  const height = piece.shape.length;
  const width = piece.shape[0]?.length ?? 0;

  for (let row = 0; row <= size - height; row += 1) {
    for (let col = 0; col <= size - width; col += 1) {
      if (canPlacePiece(grid, piece, row, col)) placements.push({ row, col });
    }
  }
  return placements;
}

export function hasAnyValidPlacement(grid: Grid, piece: Piece): boolean {
  const size = grid.length;
  const height = piece.shape.length;
  const width = piece.shape[0]?.length ?? 0;

  for (let row = 0; row <= size - height; row += 1) {
    for (let col = 0; col <= size - width; col += 1) {
      if (canPlacePiece(grid, piece, row, col)) return true;
    }
  }
  return false;
}

export function isGameOver(grid: Grid, pieces: Array<Piece | null>): boolean {
  const remaining = pieces.filter((piece): piece is Piece => piece !== null);
  if (remaining.length === 0) return true;
  return !remaining.some((piece) => hasAnyValidPlacement(grid, piece));
}

/** Rows and columns ranked by how full they are — used by the rewarded-ad revive. */
export function rankRowsByFill(grid: Grid): number[] {
  return grid
    .map((row, index) => ({ index, filled: row.filter((cell) => cell !== null).length }))
    .sort((a, b) => b.filled - a.filled || a.index - b.index)
    .map((entry) => entry.index);
}
