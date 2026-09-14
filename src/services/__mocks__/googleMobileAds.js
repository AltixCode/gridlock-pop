/* Jest mock for react-native-google-mobile-ads. */
const AdEventType = { LOADED: 'loaded', ERROR: 'error', CLOSED: 'closed', OPENED: 'opened' };
const RewardedAdEventType = { LOADED: 'rewarded_loaded', EARNED_REWARD: 'rewarded_earned_reward' };
const AdsConsentDebugGeography = { DISABLED: 0, EEA: 1, REGULATED_US_STATE: 3, OTHER: 4 };
const MaxAdContentRating = { G: 'G', PG: 'PG', T: 'T', MA: 'MA' };
const BannerAdSize = { ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER' };
const TestIds = {
  INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
  REWARDED: 'ca-app-pub-3940256099942544/5224354917',
  ADAPTIVE_BANNER: 'ca-app-pub-3940256099942544/9214589741',
};

/**
 * Ads created by the mock record their listeners so a test can drive the real event sequence
 * (loaded -> shown -> reward -> closed) instead of stubbing the outcome.
 */
const createdAds = [];

function makeAd() {
  const listeners = new Map();
  const ad = {
    loaded: false,
    load: jest.fn(),
    show: jest.fn(() => Promise.resolve()),
    addAdEventListener: jest.fn((type, handler) => {
      listeners.set(type, handler);
      return jest.fn(() => listeners.delete(type));
    }),
    removeAllListeners: jest.fn(() => listeners.clear()),
    __emit: (type, payload) => listeners.get(type)?.(payload),
    __has: (type) => listeners.has(type),
  };
  createdAds.push(ad);
  return ad;
}

function __lastAd() {
  return createdAds[createdAds.length - 1];
}

function __resetAds() {
  createdAds.length = 0;
}

const AdsConsent = {
  gatherConsent: jest.fn(() =>
    Promise.resolve({
      status: 'NOT_REQUIRED',
      canRequestAds: true,
      privacyOptionsRequirementStatus: 'NOT_REQUIRED',
    }),
  ),
  showPrivacyOptionsForm: jest.fn(() =>
    Promise.resolve({
      status: 'OBTAINED',
      canRequestAds: true,
      privacyOptionsRequirementStatus: 'REQUIRED',
    }),
  ),
  requestInfoUpdate: jest.fn(() => Promise.resolve({})),
  getConsentInfo: jest.fn(() => Promise.resolve({})),
};

const InterstitialAd = { createForAdRequest: jest.fn(makeAd) };
const RewardedAd = { createForAdRequest: jest.fn(makeAd) };

// A single instance, so a test can assert on initialize()/setRequestConfiguration() calls.
const mobileAdsInstance = {
  initialize: jest.fn(() => Promise.resolve([])),
  setRequestConfiguration: jest.fn(() => Promise.resolve()),
};
const mobileAds = () => mobileAdsInstance;

module.exports = {
  __esModule: true,
  default: mobileAds,
  AdEventType,
  RewardedAdEventType,
  MaxAdContentRating,
  BannerAdSize,
  TestIds,
  AdsConsent,
  AdsConsentDebugGeography,
  __lastAd,
  __resetAds,
  InterstitialAd,
  RewardedAd,
  BannerAd: () => null,
};
