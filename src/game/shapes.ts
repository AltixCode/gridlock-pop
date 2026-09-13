import type { ShapeCells, ShapeDefinition } from './types';

/** Build a shape footprint from a compact string form: '#' filled, '.' empty. */
export function cellsFromStrings(rows: string[]): ShapeCells {
  return rows.map((row) => row.split('').map((char) => char === '#'));
}

function shape(id: string, rows: string[], weight: number): ShapeDefinition {
  return { id, cells: cellsFromStrings(rows), weight };
}

/**
 * Shape library. Weights are tuned so small pieces appear more often than large ones —
 * this is the main lever on average session length (see the difficulty tuning note in the plan).
 */
export const SHAPES: ShapeDefinition[] = [
  shape('single', ['#'], 6),

  shape('domino2H', ['##'], 10),
  shape('domino2V', ['#', '#'], 10),

  shape('line3H', ['###'], 9),
  shape('line3V', ['#', '#', '#'], 9),

  shape('line4H', ['####'], 5),
  shape('line4V', ['#', '#', '#', '#'], 5),

  shape('line5H', ['#####'], 2),
  shape('line5V', ['#', '#', '#', '#', '#'], 2),

  shape('square2', ['##', '##'], 8),
  shape('square3', ['###', '###', '###'], 1),

  shape('cornerTL', ['##', '#.'], 7),
  shape('cornerTR', ['##', '.#'], 7),
  shape('cornerBL', ['#.', '##'], 7),
  shape('cornerBR', ['.#', '##'], 7),

  shape('lUp', ['#.', '#.', '##'], 3),
  shape('lDown', ['##', '.#', '.#'], 3),
  shape('jUp', ['.#', '.#', '##'], 3),
  shape('jDown', ['##', '#.', '#.'], 3),

  shape('tUp', ['###', '.#.'], 3),
  shape('tDown', ['.#.', '###'], 3),

  shape('sPiece', ['.##', '##.'], 2),
  shape('zPiece', ['##.', '.##'], 2),
];

export const SHAPE_BY_ID: Record<string, ShapeDefinition> = Object.fromEntries(
  SHAPES.map((definition) => [definition.id, definition]),
);

export const TOTAL_SHAPE_WEIGHT = SHAPES.reduce((sum, definition) => sum + definition.weight, 0);
