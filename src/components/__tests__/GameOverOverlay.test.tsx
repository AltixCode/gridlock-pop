import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { GameOverOverlay } from '../GameOverOverlay';

const baseProps = {
  score: 1280,
  highScore: 2000,
  isNewHighScore: false,
  linesCleared: 14,
  canRevive: true,
  isWatchingAd: false,
  onRevive: jest.fn(),
  onPlayAgain: jest.fn(),
  onHome: jest.fn(),
};

describe('GameOverOverlay', () => {
  beforeEach(() => jest.clearAllMocks());

  it('announces the final score to assistive tech', async () => {
    const view = await render(<GameOverOverlay {...baseProps} />);
    expect(view.getByLabelText('You scored 1280')).toBeTruthy();
  });

  it('shows GAME OVER rather than the badge on an ordinary run', async () => {
    const view = await render(<GameOverOverlay {...baseProps} />);
    expect(view.getByText('GAME OVER')).toBeTruthy();
    expect(view.queryByText('NEW BEST')).toBeNull();
  });

  it('celebrates a new record', async () => {
    const view = await render(<GameOverOverlay {...baseProps} isNewHighScore />);
    expect(view.getByText('NEW BEST')).toBeTruthy();
  });

  it('offers the rewarded continue only when a revive is available', async () => {
    const view = await render(<GameOverOverlay {...baseProps} />);
    expect(view.getByLabelText('Continue — watch an ad')).toBeTruthy();

    await view.rerender(<GameOverOverlay {...baseProps} canRevive={false} />);
    expect(view.queryByLabelText('Continue — watch an ad')).toBeNull();
  });

  it('wires every action', async () => {
    const view = await render(<GameOverOverlay {...baseProps} />);
    await fireEvent.press(view.getByLabelText('Continue — watch an ad'));
    await fireEvent.press(view.getByLabelText('Play again'));
    await fireEvent.press(view.getByLabelText('Home'));

    expect(baseProps.onRevive).toHaveBeenCalledTimes(1);
    expect(baseProps.onPlayAgain).toHaveBeenCalledTimes(1);
    expect(baseProps.onHome).toHaveBeenCalledTimes(1);
  });

  it('blocks the continue button while the ad is loading', async () => {
    const view = await render(<GameOverOverlay {...baseProps} isWatchingAd />);
    await fireEvent.press(view.getByLabelText('Continue — watch an ad'));
    expect(baseProps.onRevive).not.toHaveBeenCalled();
  });

  it('reports both run stats', async () => {
    const view = await render(<GameOverOverlay {...baseProps} />);
    expect(view.getByText('2,000')).toBeTruthy();
    expect(view.getByText('14')).toBeTruthy();
  });
});
