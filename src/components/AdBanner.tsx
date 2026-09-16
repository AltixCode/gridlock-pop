import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { bannerUnitId } from '../services/ads';
import { usePurchaseStore } from '../store/purchaseStore';
import { useAdsStore } from '../store/adsStore';
import { colors } from '../theme/tokens';

export const BANNER_HEIGHT = 60;

/**
 * The banner slot always reserves its height while ads are enabled, so a late fill can never
 * shove the board around mid-drag. Buying the lifetime upgrade removes the slot entirely.
 */
export function AdBanner() {
  const adsRemoved = usePurchaseStore((state) => state.adsRemoved);
  const canServeAds = useAdsStore((state) => state.consent.canServeAds);
  const [failed, setFailed] = useState(false);

  // No slot at all until consent permits an ad request — an empty reserved strip would just be
  // dead space for a player who declined.
  if (adsRemoved || !canServeAds) return null;

  // Nor while capturing store screenshots. The slot fills a few seconds after
  // launch, so there is only a brief window between "still mounting" and
  // "carrying an AdMob test creative with a literal Test mode badge", and a
  // badge like that has reached App Store Connect before. Stop the slot rather
  // than race the shutter.
  //
  // `__DEV__` is false in every release build, so this is inert in anything
  // that ships however the environment is set; a capture build is a debug build.
  if (__DEV__ && process.env.EXPO_PUBLIC_CAPTURE_MODE === '1') return null;

  return (
    <View style={styles.slot} accessibilityLabel="Advertisement">
      {failed ? null : (
        <BannerAd
          unitId={bannerUnitId}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          onAdFailedToLoad={() => setFailed(true)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    // Never squeezed by a sibling that sizes itself to its content.
    // Ata on an iPad: "some of the ui elements are hidden behind the admob".
    flexShrink: 0,
    height: BANNER_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
