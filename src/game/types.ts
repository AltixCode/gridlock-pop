/** A grid cell holds the colour id of the piece that filled it, or null when empty. */
export type Cell = number | null;

export type Grid = Cell[][];

/** A piece footprint: `true` means the cell is part of the piece. */
export type ShapeCells = boolean[][];

export interface ShapeDefinition {
  id: string;
  cells: ShapeCells;
  /** Relative draw frequency in the bag. Small shapes are weighted higher. */
  weight: number;
}

export interface Piece {
  /** Unique per instance — used as a React key and as the drag identity. */
  id: string;
  shapeId: string;
  shape: ShapeCells;
  colorId: number;
}

export interface CompletedLines {
  rows: number[];
  cols: number[];
}

export interface Placement {
  row: number;
  col: number;
}

export type Rng = () => number;
