import { AdEventType, RewardedAdEventType } from 'react-native-google-mobile-ads';

interface MockAd {
  loaded: boolean;
  show: jest.Mock;
  __emit: (type: string, payload?: unknown) => void;
  __has: (type: string) => boolean;
}

/**
 * The service is re-required after every module reset, so the SDK handle has to be taken from
 * the same fresh module registry — a reference captured at import time would be a different
 * instance than the one the service under test is using.
 */
const adsModule = () =>
  require('react-native-google-mobile-ads') as {
    __lastAd: () => MockAd;
    __resetAds: () => void;
    default: () => { initialize: jest.Mock; setRequestConfiguration: jest.Mock };
    AdsConsent: { gatherConsent: jest.Mock; showPrivacyOptionsForm: jest.Mock };
  };

const CONSENTED = {
  status: 'OBTAINED',
  canRequestAds: true,
  privacyOptionsRequirementStatus: 'NOT_REQUIRED',
};
const WITHHELD = {
  status: 'REQUIRED',
  canRequestAds: false,
  privacyOptionsRequirementStatus: 'REQUIRED',
};

describe('ads service', () => {
  let ads: typeof import('../ads');
  let sdk: ReturnType<typeof adsModule>;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    sdk = adsModule();
    sdk.__resetAds();
    ads = require('../ads');
  });

  describe('initializeAds', () => {
    it('gathers consent before touching the ads SDK', async () => {
      sdk.AdsConsent.gatherConsent.mockResolvedValueOnce(CONSENTED);
      await ads.initializeAds();

      expect(sdk.AdsConsent.gatherConsent).toHaveBeenCalled();
      expect(sdk.default().initialize).toHaveBeenCalled();
      expect(ads.getConsentSummary().canServeAds).toBe(true);
    });

    it('never initialises the ads SDK when consent is withheld', async () => {
      sdk.AdsConsent.gatherConsent.mockResolvedValueOnce(WITHHELD);
      await ads.initializeAds();

      expect(sdk.default().initialize).not.toHaveBeenCalled();
      expect(ads.getConsentSummary()).toEqual({ canServeAds: false, offerPrivacyOptions: true });
    });

    it('fails closed when the consent SDK throws', async () => {
      sdk.AdsConsent.gatherConsent.mockRejectedValueOnce(new Error('no network'));
      await ads.initializeAds();

      expect(sdk.default().initialize).not.toHaveBeenCalled();
      expect(ads.getConsentSummary().canServeAds).toBe(false);
    });

    it('only runs once', async () => {
      sdk.AdsConsent.gatherConsent.mockResolvedValue(CONSENTED);
      await ads.initializeAds();
      await ads.initializeAds();

      expect(sdk.AdsConsent.gatherConsent).toHaveBeenCalledTimes(1);
    });

    it('does not throw when the ads SDK itself fails', async () => {
      sdk.AdsConsent.gatherConsent.mockResolvedValueOnce(CONSENTED);
      sdk.default().initialize.mockRejectedValueOnce(new Error('boom'));
      await expect(ads.initializeAds()).resolves.toBeUndefined();
    });
  });

  describe('showPrivacyOptionsForm', () => {
    it('refreshes the consent summary after the form closes', async () => {
      await expect(ads.showPrivacyOptionsForm()).resolves.toBe(true);
      expect(ads.getConsentSummary().offerPrivacyOptions).toBe(true);
    });

    it('reports failure rather than throwing', async () => {
      sdk.AdsConsent.showPrivacyOptionsForm.mockRejectedValueOnce(new Error('nope'));
      await expect(ads.showPrivacyOptionsForm()).resolves.toBe(false);
    });
  });

  describe('showInterstitial', () => {
    it('resolves false when no ad has been preloaded', async () => {
      await expect(ads.showInterstitial()).resolves.toBe(false);
    });

    it('resolves true once a shown ad is dismissed', async () => {
      ads.preloadInterstitial();
      const ad = adsModule().__lastAd();

      const shown = ads.showInterstitial();
      ad.__emit(AdEventType.LOADED);
      ad.__emit(AdEventType.CLOSED);

      await expect(shown).resolves.toBe(true);
    });

    it('resolves false when the ad errors', async () => {
      ads.preloadInterstitial();
      const ad = adsModule().__lastAd();

      const shown = ads.showInterstitial();
      ad.__emit(AdEventType.ERROR, new Error('no fill'));

      await expect(shown).resolves.toBe(false);
    });

    it('shows immediately when the ad was already loaded', async () => {
      ads.preloadInterstitial();
      const ad = adsModule().__lastAd();
      ad.loaded = true;

      const shown = ads.showInterstitial();
      expect(ad.show).toHaveBeenCalled();
      ad.__emit(AdEventType.CLOSED);

      await expect(shown).resolves.toBe(true);
    });

    it('queues a replacement ad for next time', async () => {
      ads.preloadInterstitial();
      const first = adsModule().__lastAd();

      const shown = ads.showInterstitial();
      first.__emit(AdEventType.CLOSED);
      await shown;

      expect(adsModule().__lastAd()).not.toBe(first);
    });
  });

  describe('showRewarded', () => {
    it('resolves false when no ad has been preloaded', async () => {
      await expect(ads.showRewarded()).resolves.toBe(false);
    });

    // The reward is what the player was promised, so only an actual EARNED_REWARD counts.
    it('grants the reward only when it was actually earned', async () => {
      ads.preloadRewarded();
      const ad = adsModule().__lastAd();

      const earned = ads.showRewarded();
      ad.__emit(RewardedAdEventType.LOADED);
      ad.__emit(RewardedAdEventType.EARNED_REWARD, { amount: 1, type: 'continue' });
      ad.__emit(AdEventType.CLOSED);

      await expect(earned).resolves.toBe(true);
    });

    it('does not grant the reward when the player skips out early', async () => {
      ads.preloadRewarded();
      const ad = adsModule().__lastAd();

      const earned = ads.showRewarded();
      ad.__emit(RewardedAdEventType.LOADED);
      ad.__emit(AdEventType.CLOSED);

      await expect(earned).resolves.toBe(false);
    });

    it('resolves false when the rewarded ad errors', async () => {
      ads.preloadRewarded();
      const ad = adsModule().__lastAd();

      const earned = ads.showRewarded();
      ad.__emit(AdEventType.ERROR, new Error('no fill'));

      await expect(earned).resolves.toBe(false);
    });
  });

  describe('isRewardedReady', () => {
    it('reports readiness from the preloaded ad', () => {
      expect(ads.isRewardedReady()).toBe(false);
      ads.preloadRewarded();
      adsModule().__lastAd().loaded = true;
      expect(ads.isRewardedReady()).toBe(true);
    });
  });
});
