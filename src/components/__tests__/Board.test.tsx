import React from 'react';
import { render } from '@testing-library/react-native';
import { Board, type BoardHandle } from '../Board';
import { createEmptyGrid } from '../../game';

describe('Board', () => {
  it('renders a labelled board', async () => {
    const view = await render(
      <Board
        grid={createEmptyGrid()}
        cellSize={32}
        preview={null}
        clearing={null}
        onMeasure={jest.fn()}
      />,
    );
    expect(view.getByLabelText('Game board')).toBeTruthy();
  });

  it('renders without crashing while a clear animation is playing', async () => {
    const grid = createEmptyGrid();
    grid[0] = grid[0].map(() => 2);
    const view = await render(
      <Board
        grid={grid}
        cellSize={32}
        preview={{ cells: ['1:1', '1:2'], valid: true }}
        clearing={{ rows: [0], cols: [3] }}
        onMeasure={jest.fn()}
      />,
    );
    expect(view.getByLabelText('Game board')).toBeTruthy();
  });

  it('exposes an imperative re-measure so a stale origin can be refreshed', async () => {
    // The board's window position can move without onLayout firing (late safe-area insets, the
    // ad banner mounting). The drag calls this before it starts.
    const onMeasure = jest.fn();
    const ref = React.createRef<BoardHandle>();

    await render(
      <Board
        ref={ref}
        grid={createEmptyGrid()}
        cellSize={32}
        preview={null}
        clearing={null}
        onMeasure={onMeasure}
      />,
    );

    expect(typeof ref.current?.measure).toBe('function');
    expect(() => ref.current?.measure()).not.toThrow();
  });
});
