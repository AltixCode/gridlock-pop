import {
  GAMES_BETWEEN_INTERSTITIALS,
  MIN_GAMES_BEFORE_FIRST_INTERSTITIAL,
  MIN_MS_BETWEEN_INTERSTITIALS,
  shouldShowInterstitial,
} from '../adPolicy';

const BASE = { gamesPlayed: 3, lastInterstitialAt: 0, now: 10_000_000, adsRemoved: false };

describe('shouldShowInterstitial', () => {
  it('never shows once ads have been removed', () => {
    expect(shouldShowInterstitial({ ...BASE, adsRemoved: true })).toBe(false);
  });

  it('never shows during the first games of a new install', () => {
    for (let gamesPlayed = 1; gamesPlayed <= MIN_GAMES_BEFORE_FIRST_INTERSTITIAL; gamesPlayed += 1) {
      expect(shouldShowInterstitial({ ...BASE, gamesPlayed })).toBe(false);
    }
  });

  it('shows on every Nth game over', () => {
    expect(GAMES_BETWEEN_INTERSTITIALS).toBe(3);
    expect(shouldShowInterstitial({ ...BASE, gamesPlayed: 3 })).toBe(true);
    expect(shouldShowInterstitial({ ...BASE, gamesPlayed: 6 })).toBe(true);
  });

  it('stays quiet between those games', () => {
    expect(shouldShowInterstitial({ ...BASE, gamesPlayed: 4 })).toBe(false);
    expect(shouldShowInterstitial({ ...BASE, gamesPlayed: 5 })).toBe(false);
  });

  it('honours a minimum gap between interstitials', () => {
    const now = 10_000_000;
    expect(
      shouldShowInterstitial({
        ...BASE,
        gamesPlayed: 6,
        now,
        lastInterstitialAt: now - (MIN_MS_BETWEEN_INTERSTITIALS - 1),
      }),
    ).toBe(false);
    expect(
      shouldShowInterstitial({
        ...BASE,
        gamesPlayed: 6,
        now,
        lastInterstitialAt: now - MIN_MS_BETWEEN_INTERSTITIALS,
      }),
    ).toBe(true);
  });

  it('tolerates a clock that jumps backwards', () => {
    expect(shouldShowInterstitial({ ...BASE, gamesPlayed: 6, lastInterstitialAt: 99_999_999 })).toBe(
      false,
    );
  });

  it('ignores nonsensical game counts', () => {
    expect(shouldShowInterstitial({ ...BASE, gamesPlayed: 0 })).toBe(false);
    expect(shouldShowInterstitial({ ...BASE, gamesPlayed: -3 })).toBe(false);
  });
});
