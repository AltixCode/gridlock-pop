/* Jest mock for react-native-google-mobile-ads. */
const AdEventType = { LOADED: 'loaded', ERROR: 'error', CLOSED: 'closed', OPENED: 'opened' };
const RewardedAdEventType = { LOADED: 'rewarded_loaded', EARNED_REWARD: 'rewarded_earned_reward' };
const MaxAdContentRating = { G: 'G', PG: 'PG', T: 'T', MA: 'MA' };
const BannerAdSize = { ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER' };
const TestIds = {
  INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
  REWARDED: 'ca-app-pub-3940256099942544/5224354917',
  ADAPTIVE_BANNER: 'ca-app-pub-3940256099942544/9214589741',
};

function makeAd() {
  return {
    loaded: false,
    load: jest.fn(),
    show: jest.fn(() => Promise.resolve()),
    addAdEventListener: jest.fn(() => jest.fn()),
    removeAllListeners: jest.fn(),
  };
}

const InterstitialAd = { createForAdRequest: jest.fn(makeAd) };
const RewardedAd = { createForAdRequest: jest.fn(makeAd) };

const mobileAds = () => ({
  initialize: jest.fn(() => Promise.resolve([])),
  setRequestConfiguration: jest.fn(() => Promise.resolve()),
});

module.exports = {
  __esModule: true,
  default: mobileAds,
  AdEventType,
  RewardedAdEventType,
  MaxAdContentRating,
  BannerAdSize,
  TestIds,
  InterstitialAd,
  RewardedAd,
  BannerAd: () => null,
};
