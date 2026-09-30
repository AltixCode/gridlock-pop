import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { PauseOverlay } from '../PauseOverlay';

const baseProps = {
  score: 0,
  onResume: jest.fn(),
  onRestart: jest.fn(),
  onSettings: jest.fn(),
  onHome: jest.fn(),
};

describe('PauseOverlay', () => {
  beforeEach(() => jest.clearAllMocks());

  it('presents itself as a modal to assistive tech', async () => {
    const view = await render(<PauseOverlay {...baseProps} />);
    expect(view.getByLabelText('Paused')).toBeTruthy();
  });

  it('explains that pausing is a safety gate, not a clock — this game has no timer', async () => {
    // A tester asked what the pause button was even for, since nothing in the
    // game is time-driven: no falling pieces, no countdown, no combo decay.
    // Pausing here only blocks input and protects the run from an accidental
    // restart tap, which is easy to misread as broken without saying so.
    const view = await render(<PauseOverlay {...baseProps} />);
    expect(view.getByText(/your run is safe/i)).toBeTruthy();
  });

  it('resumes play', async () => {
    const view = await render(<PauseOverlay {...baseProps} />);
    await fireEvent.press(view.getByLabelText('Resume'));
    expect(baseProps.onResume).toHaveBeenCalledTimes(1);
  });

  it('restarts immediately when nothing has been scored yet', async () => {
    const view = await render(<PauseOverlay {...baseProps} score={0} />);
    await fireEvent.press(view.getByLabelText('Restart'));
    expect(baseProps.onRestart).toHaveBeenCalledTimes(1);
  });

  it('asks before throwing away a run in progress', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const view = await render(<PauseOverlay {...baseProps} score={420} />);
    await fireEvent.press(view.getByLabelText('Restart'));

    expect(baseProps.onRestart).not.toHaveBeenCalled();
    expect(alert).toHaveBeenCalled();

    // Confirming the dialog is what actually restarts the run.
    const buttons = alert.mock.calls[0][2] as { text: string; onPress?: () => void }[];
    const confirm = buttons.find((button) => button.text === 'Restart');
    confirm?.onPress?.();
    expect(baseProps.onRestart).toHaveBeenCalledTimes(1);
  });

  it('opens settings and returns home', async () => {
    const view = await render(<PauseOverlay {...baseProps} />);
    await fireEvent.press(view.getByLabelText('Settings'));
    await fireEvent.press(view.getByLabelText('Quit to home'));

    expect(baseProps.onSettings).toHaveBeenCalledTimes(1);
    expect(baseProps.onHome).toHaveBeenCalledTimes(1);
  });
});
