import { SHAPES, SHAPE_BY_ID } from '../shapes';
import { createRng, generatePieceBag, generateFairBag, PIECES_PER_BAG } from '../bag';
import { createEmptyGrid, countCells, hasAnyValidPlacement } from '../grid';
import { GRID_SIZE } from '../grid';

describe('shape library', () => {
  it('contains at least 15 distinct shapes', () => {
    expect(SHAPES.length).toBeGreaterThanOrEqual(15);
    expect(new Set(SHAPES.map((s) => s.id)).size).toBe(SHAPES.length);
  });

  it('indexes every shape by id', () => {
    SHAPES.forEach((shape) => expect(SHAPE_BY_ID[shape.id]).toBe(shape));
  });

  it('keeps every shape within the grid bounds and non-empty', () => {
    SHAPES.forEach((shape) => {
      expect(shape.cells.length).toBeGreaterThan(0);
      expect(shape.cells.length).toBeLessThanOrEqual(GRID_SIZE);
      shape.cells.forEach((row) => expect(row.length).toBeLessThanOrEqual(GRID_SIZE));
      expect(countCells(shape.cells)).toBeGreaterThan(0);
      const width = shape.cells[0].length;
      shape.cells.forEach((row) => expect(row).toHaveLength(width));
    });
  });

  it('trims shapes so every edge row and column is used', () => {
    SHAPES.forEach((shape) => {
      const rows = shape.cells;
      const width = rows[0].length;
      expect(rows[0].some(Boolean)).toBe(true);
      expect(rows[rows.length - 1].some(Boolean)).toBe(true);
      expect(rows.some((row) => row[0])).toBe(true);
      expect(rows.some((row) => row[width - 1])).toBe(true);
    });
  });

  it('gives every shape a positive weight', () => {
    SHAPES.forEach((shape) => expect(shape.weight).toBeGreaterThan(0));
  });
});

describe('createRng', () => {
  it('is deterministic for a given seed', () => {
    const a = createRng(1234);
    const b = createRng(1234);
    const seqA = Array.from({ length: 20 }, () => a());
    const seqB = Array.from({ length: 20 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it('differs across seeds and stays within [0, 1)', () => {
    const a = Array.from({ length: 20 }, createRng(1));
    const b = Array.from({ length: 20 }, createRng(2));
    expect(a).not.toEqual(b);
    [...a, ...b].forEach((n) => {
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(1);
    });
  });
});

describe('generatePieceBag', () => {
  it('returns exactly PIECES_PER_BAG pieces with unique ids', () => {
    const bag = generatePieceBag(createRng(7));
    expect(PIECES_PER_BAG).toBe(3);
    expect(bag).toHaveLength(3);
    expect(new Set(bag.map((p) => p.id)).size).toBe(3);
  });

  it('is deterministic for a given seed', () => {
    const a = generatePieceBag(createRng(99));
    const b = generatePieceBag(createRng(99));
    expect(a.map((p) => p.shapeId)).toEqual(b.map((p) => p.shapeId));
    expect(a.map((p) => p.colorId)).toEqual(b.map((p) => p.colorId));
  });

  it('only produces shapes from the library', () => {
    const rng = createRng(3);
    for (let i = 0; i < 50; i += 1) {
      generatePieceBag(rng).forEach((piece) => {
        expect(SHAPE_BY_ID[piece.shapeId]).toBeDefined();
        expect(piece.shape).toEqual(SHAPE_BY_ID[piece.shapeId].cells);
      });
    }
  });

  it('favours smaller pieces over the largest ones', () => {
    const rng = createRng(2024);
    let small = 0;
    let large = 0;
    for (let i = 0; i < 400; i += 1) {
      generatePieceBag(rng).forEach((piece) => {
        const size = countCells(piece.shape);
        if (size <= 3) small += 1;
        if (size >= 5) large += 1;
      });
    }
    expect(small).toBeGreaterThan(large);
  });
});

describe('generateFairBag', () => {
  it('returns a bag that is playable on the given grid', () => {
    const grid = createEmptyGrid().map((row) => row.map(() => 1));
    grid[0][0] = null;
    const bag = generateFairBag(grid, createRng(11));
    expect(bag.some((piece) => hasAnyValidPlacement(grid, piece))).toBe(true);
  });

  it('falls back to a normal bag when nothing can possibly fit', () => {
    const full = createEmptyGrid().map((row) => row.map(() => 1));
    const bag = generateFairBag(full, createRng(5));
    expect(bag).toHaveLength(PIECES_PER_BAG);
  });

  it('behaves like a normal bag on an empty grid', () => {
    const bag = generateFairBag(createEmptyGrid(), createRng(42));
    expect(bag).toHaveLength(PIECES_PER_BAG);
    bag.forEach((piece) => expect(SHAPE_BY_ID[piece.shapeId]).toBeDefined());
  });
});
