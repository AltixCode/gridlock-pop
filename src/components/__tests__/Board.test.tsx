import React from 'react';
import { render } from '@testing-library/react-native';
import { Board } from '../Board';
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
});
