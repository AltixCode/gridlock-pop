/**
 * Geometry for the drag interaction, kept apart from the gesture so it can be unit tested.
 *
 * Every function here is a worklet: it runs on the UI thread inside the pan handler, which is
 * what keeps dragging smooth. That also means it must stay pure — no closures over React
 * state, no JS-thread calls.
 */

/** How far above the fingertip the dragged piece floats, so the board stays visible. */
export const DRAG_LIFT = 52;

export interface DragOriginInput {
  pointerX: number;
  pointerY: number;
  cellSize: number;
  pieceWidth: number;
  pieceHeight: number;
}

export interface DragCellInput extends DragOriginInput {
  boardX: number;
  boardY: number;
}

export interface PieceOrigin {
  left: number;
  top: number;
}

export interface TargetCell {
  row: number;
  col: number;
}

/** Screen position of the dragged piece's top-left corner for a given fingertip position. */
export function draggedPieceOrigin({
  pointerX,
  pointerY,
  cellSize,
  pieceWidth,
  pieceHeight,
}: DragOriginInput): PieceOrigin {
  'worklet';
  return {
    left: pointerX - (pieceWidth * cellSize) / 2,
    top: pointerY - pieceHeight * cellSize - DRAG_LIFT,
  };
}

/**
 * The grid cell the dragged piece is currently over. Snaps to the nearest cell, and reports
 * out-of-range coordinates as-is — deciding whether a placement is legal belongs to the grid.
 */
export function targetCellFromDrag(input: DragCellInput): TargetCell {
  'worklet';
  const { boardX, boardY, cellSize } = input;
  // A zero cell size means the board has not been measured yet; report a cell that can never
  // be valid rather than dividing by zero.
  if (cellSize <= 0) return { row: -1, col: -1 };

  const { left, top } = draggedPieceOrigin(input);
  return {
    row: Math.round((top - boardY) / cellSize),
    col: Math.round((left - boardX) / cellSize),
  };
}
