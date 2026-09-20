import type { ExpoConfig } from 'expo/config';

/**
 * Store identity and native configuration.
 *
 * AdMob *app* ids must be baked into the native manifests, so they live here rather than in JS.
 * They are public identifiers, not secrets — but they still come from the environment so that a
 * developer build can never accidentally ship with production ad units. With nothing configured
 * the Google sample app ids are used, which only ever serve test ads.
 */

// `||`, never `??`, for an identifier that must not be empty.
//
// A GitHub Actions env var mapped from a missing secret arrives as an EMPTY
// STRING, not undefined -- and `??` keeps an empty string. That ships
// `GADApplicationIdentifier = ""`, which makes the Google Mobile Ads SDK raise
// at startup: the app dies on launch, and Apple rejects it for crashing. Four
// apps in this portfolio were rejected for exactly that, which is why
// `attach-verified-build.py` reads the binary before attaching it to a version.
// `||` falls back on the empty string too, so the test identifier is used and
// the app starts.
const IOS_ADMOB_APP_ID =
  process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID || 'ca-app-pub-3940256099942544~1458002511';
const ANDROID_ADMOB_APP_ID =
  process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID || 'ca-app-pub-3940256099942544~3347511713';

/**
 * SKAdNetwork identifiers for the ad networks AdMob mediates on iOS. Without these, iOS
 * install attribution silently fails — which matters a great deal here, because this game is
 * discovered through paid UA, not organic search. Sourced from the Google Mobile Ads SDK docs;
 * refresh from https://developers.google.com/admob/ios/3p-skadnetworks when you update the SDK.
 */
const SK_AD_NETWORK_ITEMS = [
  'cstr6suwn9.skadnetwork',
  '4fzdc2evr5.skadnetwork',
  '2fnua5tdw4.skadnetwork',
  'ydx93a7ass.skadnetwork',
  'p78axxw29g.skadnetwork',
  'v72qych5uu.skadnetwork',
  'ludvb6z3bs.skadnetwork',
  'cp8zw746q7.skadnetwork',
  '3sh42y64q3.skadnetwork',
  'c6k4g5qg8m.skadnetwork',
  's39g8k73mm.skadnetwork',
  'wg4vff78zm.skadnetwork',
  '3qy4746246.skadnetwork',
  'f38h382jlk.skadnetwork',
  'hs6bdukanm.skadnetwork',
  'mlmmfzh3r3.skadnetwork',
  'v4nxqhlyqp.skadnetwork',
  'wzmmz9fp6w.skadnetwork',
  'su67r6k2v3.skadnetwork',
  'yclnxrl5pm.skadnetwork',
  't38b2kh725.skadnetwork',
  '7ug5zh24hu.skadnetwork',
  'gta9lk7p23.skadnetwork',
  'vutu7akeur.skadnetwork',
  'y5ghdn5j9k.skadnetwork',
  'v9wttpbfk9.skadnetwork',
  'n38lu8286q.skadnetwork',
  '47vhws6wlr.skadnetwork',
  'kbd757ywx3.skadnetwork',
  '9t245vhmpl.skadnetwork',
  'a2p9lx4jpn.skadnetwork',
  '22mmun2rn5.skadnetwork',
  '44jx6755aq.skadnetwork',
  'k674qkevps.skadnetwork',
  '4468km3ulz.skadnetwork',
  '2u9pt9hc89.skadnetwork',
  '8s468mfl3y.skadnetwork',
  'klf5c3l5u5.skadnetwork',
  'ppxm28t8ap.skadnetwork',
  'kbmxgpxpgc.skadnetwork',
  'uw77j35x4d.skadnetwork',
  '578prtvx9j.skadnetwork',
  '4dzt52r2t5.skadnetwork',
  'tl55sbb4fm.skadnetwork',
  'c3frkrj4fj.skadnetwork',
  'e5fvkxwrpn.skadnetwork',
  '8c4e2ghe7u.skadnetwork',
  '3rd42ekr43.skadnetwork',
  '97r2b46745.skadnetwork',
  '3qcr597p9d.skadnetwork',
];

// Marketing version only. Build numbers live on EAS (eas.json appVersionSource: remote),
// so they are deliberately absent here.
const VERSION = '1.0.0';

// The build number CI computes, which is `git rev-list --count HEAD`. This file
// declared neither `buildNumber` nor `versionCode`, so Expo's defaults applied
// and every build in App Store Connect is numbered 1 to 5 while the commit
// count is 59 -- no build can be matched back to the commit that made it.
//
// `||`, never `??`: GitHub Actions maps a missing variable to "", and `??`
// would keep it. An empty CFBundleVersion is an invalid Info.plist.
const BUILD = process.env.APP_BUILD || '1';

const config: ExpoConfig = {
  name: 'Gridlock Pop',
  slug: 'gridlock-pop',
  version: VERSION,
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'gridlockpop',
  userInterfaceStyle: 'dark',
  backgroundColor: '#0B1020',
  primaryColor: '#FBBF24',
  assetBundlePatterns: ['**/*'],
  ios: {
    // Kept from the app's brief life as "Cubex": Apple does not allow an existing
    // App Store Connect record's bundle id to change, and it is never user-visible.
    bundleIdentifier: 'com.altixcode.cubex',
    supportsTablet: true,
    requireFullScreen: false,
    buildNumber: BUILD,
    config: {
      // No custom crypto beyond standard HTTPS — declaring this up front skips the yearly
      // export-compliance questionnaire on every App Store Connect submission.
      usesNonExemptEncryption: false,
    },
    infoPlist: {
      // Answers Apple's export-compliance question once, in the build, so it
      // is not asked again on every submission of every app. These apps use
      // only the standard HTTPS the OS provides -- RevenueCat and AdMob over
      // TLS -- and ship no cryptography of their own, which is the exemption
      // this declares. Without the key App Store Connect asks at upload time,
      // and the answer carries legal weight rather than being a formality.
      ITSAppUsesNonExemptEncryption: false,
      UIBackgroundModes: [],
    },
  },
  android: {
    // Android's package is set by the Play Console record and cannot change there; iOS is
    // locked to com.altixcode.cubex by its App Store Connect record. They are allowed to
    // differ, and neither is user-visible.
    package: 'com.altixcode.gridlockpop',
    // Play refuses an upload whose versionCode does not increase, so a default
    // that never moves means this app could never ship a second release.
    versionCode: Number.parseInt(BUILD, 10),
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
    // iOS 26+ SDK refuses to launch apps that have not adopted the UIScene lifecycle, which
    // Expo SDK 57 / RN 0.86 do not yet generate. Drop this once the template does it itself.
    './plugins/withUIScene',
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
        skAdNetworkItems: SK_AD_NETWORK_ITEMS,
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
        android: {
          compileSdkVersion: 36,
          targetSdkVersion: 36,
          minSdkVersion: 24,
          // R8 shrinking + obfuscation for release builds. Without this, Play
          // Console's pre-launch report flags the app under 25% obfuscation
          // and warns it may lose visibility/publishing eligibility.
          enableProguardInReleaseBuilds: true,
          enableShrinkResourcesInReleaseBuilds: true,
          buildArchs: ['arm64-v8a', 'armeabi-v7a'],
        },
      },
    ],
  ],
  runtimeVersion: { policy: 'appVersion' },
  // The EAS project lives under the altixcodes-team account; the project id is a public
  // identifier, not a secret, and eas-cli cannot write it into a dynamic config itself.
  owner: 'altixcodes-team',
  extra: {
    eas: { projectId: process.env.EAS_PROJECT_ID ?? '8f2f620e-5448-4971-aacc-13f6a797c347' },
  },
};

export default config;
