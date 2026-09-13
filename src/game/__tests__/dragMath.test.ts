import { DRAG_LIFT, draggedPieceOrigin, targetCellFromDrag } from '../dragMath';

const board = { boardX: 100, boardY: 200, cellSize: 40 };

describe('draggedPieceOrigin', () => {
  it('centres the piece horizontally on the finger and floats it above by the lift', () => {
    const origin = draggedPieceOrigin({
      pointerX: 500,
      pointerY: 600,
      cellSize: 40,
      pieceWidth: 2,
      pieceHeight: 3,
    });

    expect(origin.left).toBe(500 - 40); // half of a 2-cell wide piece
    expect(origin.top).toBe(600 - 120 - DRAG_LIFT);
  });

  it('lifts the piece clear of the fingertip so the board stays visible', () => {
    expect(DRAG_LIFT).toBeGreaterThan(40);
  });
});

describe('targetCellFromDrag', () => {
  const drag = (pointerX: number, pointerY: number, pieceWidth = 1, pieceHeight = 1) =>
    targetCellFromDrag({ ...board, pointerX, pointerY, pieceWidth, pieceHeight });

  it('maps a single cell piece resting exactly on a cell origin', () => {
    // 1x1 piece: origin.left = pointerX - 20, origin.top = pointerY - 40 - lift.
    // To land on row 1, col 0 the pointer must sit one cell below the board's second row.
    expect(drag(100 + 20, 200 + 40 * 2 + DRAG_LIFT)).toEqual({ row: 1, col: 0 });
  });

  it('snaps to the nearest cell rather than truncating', () => {
    const base = { x: 100 + 20, y: 200 + 40 * 2 + DRAG_LIFT };
    // Just past halfway into the next column should round up, not down.
    expect(drag(base.x + 21, base.y)).toEqual({ row: 1, col: 1 });
    expect(drag(base.x + 19, base.y)).toEqual({ row: 1, col: 0 });
  });

  it('accounts for the width of a wide piece', () => {
    // A 5-wide piece centred on the finger starts 2.5 cells to its left.
    const pointerX = 100 + 40 * 2.5;
    expect(drag(pointerX, 200 + 40 * 2 + DRAG_LIFT, 5, 1)).toEqual({ row: 1, col: 0 });
  });

  it('accounts for the height of a tall piece', () => {
    const pointerY = 200 + 40 * 4 + DRAG_LIFT;
    expect(drag(100 + 20, pointerY, 1, 4)).toEqual({ row: 0, col: 0 });
  });

  it('returns out-of-range cells rather than clamping them', () => {
    // Placement validity is the grid's job; this function only reports where the piece is.
    const result = drag(0, 0);
    expect(result.row).toBeLessThan(0);
    expect(result.col).toBeLessThan(0);
  });

  it('is stable under a zero or negative cell size', () => {
    expect(
      targetCellFromDrag({
        boardX: 100,
        boardY: 200,
        cellSize: 0,
        pointerX: 300,
        pointerY: 400,
        pieceWidth: 1,
        pieceHeight: 1,
      }),
    ).toEqual({ row: -1, col: -1 });
  });

  it('always returns whole numbers', () => {
    const result = drag(137.4, 291.8, 3, 2);
    expect(Number.isInteger(result.row)).toBe(true);
    expect(Number.isInteger(result.col)).toBe(true);
  });

  it('moves one column per cell width of travel', () => {
    const start = drag(300, 500);
    const oneCellRight = drag(300 + board.cellSize, 500);
    expect(oneCellRight.col - start.col).toBe(1);
    expect(oneCellRight.row).toBe(start.row);
  });

  it('moves one row per cell height of travel', () => {
    const start = drag(300, 500);
    const oneCellDown = drag(300, 500 + board.cellSize);
    expect(oneCellDown.row - start.row).toBe(1);
    expect(oneCellDown.col).toBe(start.col);
  });
});
