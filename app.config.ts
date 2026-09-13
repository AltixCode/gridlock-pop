import type { ExpoConfig } from 'expo/config';

/**
 * Store identity and native configuration.
 *
 * AdMob *app* ids must be baked into the native manifests, so they live here rather than in JS.
 * They are public identifiers, not secrets — but they still come from the environment so that a
 * developer build can never accidentally ship with production ad units. With nothing configured
 * the Google sample app ids are used, which only ever serve test ads.
 */

const IOS_ADMOB_APP_ID =
  process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID ?? 'ca-app-pub-3940256099942544~1458002511';
const ANDROID_ADMOB_APP_ID =
  process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID ?? 'ca-app-pub-3940256099942544~3347511713';

const VERSION = '1.0.0';

const config: ExpoConfig = {
  name: 'BlockJam',
  slug: 'blockjam',
  version: VERSION,
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'blockjam',
  userInterfaceStyle: 'dark',
  backgroundColor: '#0B1020',
  primaryColor: '#FBBF24',
  assetBundlePatterns: ['**/*'],
  ios: {
    bundleIdentifier: 'com.altixcode.blockjam',
    buildNumber: '1',
    supportsTablet: true,
    requireFullScreen: false,
    config: {
      // No custom crypto beyond standard HTTPS — declaring this up front skips the yearly
      // export-compliance questionnaire on every App Store Connect submission.
      usesNonExemptEncryption: false,
    },
    infoPlist: {
      UIBackgroundModes: [],
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: 'com.altixcode.blockjam',
    versionCode: 1,
    adaptiveIcon: {
      backgroundColor: '#0B1020',
      foregroundImage: './assets/android-icon-foreground.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    permissions: [
      'com.google.android.gms.permission.AD_ID',
      'com.android.vending.BILLING',
      'android.permission.INTERNET',
      'android.permission.VIBRATE',
    ],
    blockedPermissions: ['android.permission.ACCESS_COARSE_LOCATION'],
  },
  web: { favicon: './assets/favicon.png' },
  plugins: [
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#0B1020',
      },
    ],
    [
      'react-native-google-mobile-ads',
      {
        androidAppId: ANDROID_ADMOB_APP_ID,
        iosAppId: IOS_ADMOB_APP_ID,
        userTrackingUsageDescription:
          'This lets us show you ads that are more relevant to you. Your data is never sold, and the game plays exactly the same either way.',
      },
    ],
    [
      'expo-tracking-transparency',
      {
        userTrackingPermission:
          'This lets us show you ads that are more relevant to you. Your data is never sold, and the game plays exactly the same either way.',
      },
    ],
    [
      'expo-build-properties',
      {
        ios: { deploymentTarget: '16.4' },
        android: { compileSdkVersion: 36, targetSdkVersion: 36, minSdkVersion: 24 },
      },
    ],
  ],
  runtimeVersion: { policy: 'appVersion' },
  extra: {
    eas: { projectId: process.env.EAS_PROJECT_ID },
  },
};

export default config;
