import { Platform } from 'react-native';
import { missingReleaseConfigFrom, RELEASE_ENV_KEYS, selectPlatformValue } from './releaseConfig';

/**
 * All third-party identifiers come from EXPO_PUBLIC_* env vars (wired through EAS build
 * profiles / GitHub Actions secrets). Nothing sensitive is committed: RevenueCat public SDK
 * keys and AdMob unit ids are client-side identifiers, and the secret API keys they pair with
 * never reach the app bundle.
 *
 * With no env configured the app falls back to Google's official *test* ad units, so a local
 * build can never accidentally serve — or click — a live ad.
 */

function pick(ios?: string, android?: string): string | undefined {
  return selectPlatformValue(ios, android, Platform.OS);
}

export const IS_DEV = __DEV__;

export const ADMOB = {
  interstitialUnitId: pick(
    process.env.EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL,
    process.env.EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL,
  ),
  rewardedUnitId: pick(
    process.env.EXPO_PUBLIC_ADMOB_IOS_REWARDED,
    process.env.EXPO_PUBLIC_ADMOB_ANDROID_REWARDED,
  ),
  bannerUnitId: pick(
    process.env.EXPO_PUBLIC_ADMOB_IOS_BANNER,
    process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER,
  ),
};

export const REVENUECAT_API_KEY = pick(
  process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
);

export const PRIVACY_POLICY_URL =
  process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL ??
  'https://atasmohammadi.github.io/blockjam/legal/privacy.html';
export const TERMS_URL =
  process.env.EXPO_PUBLIC_TERMS_URL ?? 'https://atasmohammadi.github.io/blockjam/legal/terms.html';
export const SUPPORT_EMAIL = process.env.EXPO_PUBLIC_SUPPORT_EMAIL ?? 'support@altixcode.com';

export { missingReleaseConfigFrom, RELEASE_ENV_KEYS, selectPlatformValue };
