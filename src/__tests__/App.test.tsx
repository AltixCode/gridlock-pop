import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import App from '../../App';
import { useGameStore } from '../store/gameStore';
import { usePurchaseStore } from '../store/purchaseStore';
import { useAdsStore } from '../store/adsStore';

/**
 * Smoke test over the real composition root. Unit tests cover the pieces; this is the only
 * thing that would catch the app being wired together wrongly — a missing provider, a screen
 * that never mounts, a store that is never hydrated.
 */
describe('App', () => {
  beforeEach(() => {
    useGameStore.getState().resetForTests();
    usePurchaseStore.getState().resetForTests();
    useAdsStore.getState().resetForTests();
  });

  it('opens on the home screen', async () => {
    const view = await render(<App />);
    expect(view.getByLabelText('Play')).toBeTruthy();
    expect(view.getByText('Gridlock Pop')).toBeTruthy();
  });

  it('starts a run and shows the board and a full tray', async () => {
    const view = await render(<App />);
    await fireEvent.press(view.getByLabelText('Play'));

    expect(view.getByLabelText('Game board')).toBeTruthy();
    expect(view.getByLabelText('Piece tray')).toBeTruthy();
    expect(useGameStore.getState().status).toBe('playing');
    expect(useGameStore.getState().game.pieces.filter(Boolean)).toHaveLength(3);
  });

  it('pauses and resumes without losing the run', async () => {
    const view = await render(<App />);
    await fireEvent.press(view.getByLabelText('Play'));

    await fireEvent.press(view.getByLabelText('Pause'));
    expect(view.getByLabelText('Paused')).toBeTruthy();

    await fireEvent.press(view.getByLabelText('Resume'));
    expect(view.queryByLabelText('Paused')).toBeNull();
    expect(useGameStore.getState().status).toBe('playing');
  });

  it('returns home from the pause menu', async () => {
    const view = await render(<App />);
    await fireEvent.press(view.getByLabelText('Play'));
    await fireEvent.press(view.getByLabelText('Pause'));
    await fireEvent.press(view.getByLabelText('Quit to home'));

    expect(view.getByLabelText('Play')).toBeTruthy();
  });

  it('reaches settings and back from the home screen', async () => {
    const view = await render(<App />);
    await fireEvent.press(view.getByLabelText('Settings'));

    expect(view.getByText('Settings')).toBeTruthy();
    expect(view.getByLabelText('Restore purchases')).toBeTruthy();

    await fireEvent.press(view.getByLabelText('Close settings'));
    expect(view.getByLabelText('Play')).toBeTruthy();
  });

  it('offers the upgrade until it is bought, then thanks the player instead', async () => {
    const view = await render(<App />);
    expect(view.getByLabelText('Remove ads')).toBeTruthy();

    await act(async () => usePurchaseStore.setState({ adsRemoved: true }));
    expect(view.queryByLabelText('Remove ads')).toBeNull();
    expect(view.getByText('Ad-free unlocked')).toBeTruthy();
  });

  it('hides the ad privacy entry point until the consent SDK asks for one', async () => {
    const view = await render(<App />);
    await fireEvent.press(view.getByLabelText('Settings'));
    expect(view.queryByLabelText('Ad privacy settings')).toBeNull();

    await act(async () =>
      useAdsStore.setState({ consent: { canServeAds: true, offerPrivacyOptions: true } }),
    );
    expect(view.getByLabelText('Ad privacy settings')).toBeTruthy();
  });

  it('shows no ad banner while consent has not been given', async () => {
    const view = await render(<App />);
    expect(view.queryByLabelText('Advertisement')).toBeNull();

    await act(async () =>
      useAdsStore.setState({ consent: { canServeAds: true, offerPrivacyOptions: false } }),
    );
    expect(view.getByLabelText('Advertisement')).toBeTruthy();
  });
});
