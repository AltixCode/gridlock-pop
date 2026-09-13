import { hasAnyValidPlacement } from './grid';
import { SHAPES, TOTAL_SHAPE_WEIGHT } from './shapes';
import type { Grid, Piece, Rng, ShapeDefinition } from './types';

export const PIECES_PER_BAG = 3;
export const COLOR_COUNT = 6;

/** Number of attempts to draw a bag the player can actually play before giving up. */
const FAIR_BAG_ATTEMPTS = 12;

let pieceCounter = 0;

/** mulberry32 — small, fast, deterministic; keeps daily challenges and tests reproducible. */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeightedShape(rng: Rng): ShapeDefinition {
  let ticket = rng() * TOTAL_SHAPE_WEIGHT;
  for (const definition of SHAPES) {
    ticket -= definition.weight;
    if (ticket < 0) return definition;
  }
  return SHAPES[SHAPES.length - 1];
}

export function createPiece(definition: ShapeDefinition, colorId: number): Piece {
  pieceCounter += 1;
  return {
    id: `${definition.id}-${pieceCounter}`,
    shapeId: definition.id,
    shape: definition.cells,
    colorId,
  };
}

export function generatePieceBag(rng: Rng, count: number = PIECES_PER_BAG): Piece[] {
  return Array.from({ length: count }, () =>
    createPiece(pickWeightedShape(rng), Math.floor(rng() * COLOR_COUNT)),
  );
}

/**
 * Draws a bag that is playable on `grid` when one is reachable, so runs end because the board
 * filled up rather than because of an unlucky draw. Falls back to a plain bag when the board
 * genuinely has no room left.
 */
export function generateFairBag(grid: Grid, rng: Rng, count: number = PIECES_PER_BAG): Piece[] {
  let bag = generatePieceBag(rng, count);
  for (let attempt = 0; attempt < FAIR_BAG_ATTEMPTS; attempt += 1) {
    if (bag.some((piece) => hasAnyValidPlacement(grid, piece))) return bag;
    bag = generatePieceBag(rng, count);
  }
  return bag;
}
