import React from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, IconButton } from '../components/Buttons';
import { Icon } from '../components/Icon';
import { AdBanner } from '../components/AdBanner';
import { useGameStore } from '../store/gameStore';
import { usePurchaseStore } from '../store/purchaseStore';
import {
  MAX_DISPLAY_FONT_SCALE,
  colors,
  pieceColors,
  radius,
  shadow,
  spacing,
  type,
} from '../theme/tokens';

interface HomeScreenProps {
  onPlay: () => void;
  onOpenSettings: () => void;
  onRemoveAds: () => void;
}

/** A small decorative arrangement of tiles — the game's own vocabulary instead of stock art. */
function Hero() {
  const { width } = useWindowDimensions();
  const tiles = [
    { row: 0, col: 1, color: 0 },
    { row: 0, col: 2, color: 0 },
    { row: 1, col: 0, color: 3 },
    { row: 1, col: 1, color: 3 },
    { row: 1, col: 2, color: 2 },
    { row: 2, col: 2, color: 2 },
    { row: 2, col: 3, color: 4 },
  ];
  // The tile arrangement is the game's own vocabulary, and it was 34pt on every
  // device -- a postage stamp on a 13" iPad, which is one of the reasons half
  // that screen read as empty. It is decoration, so it grows with the display
  // rather than staying a phone-sized ornament.
  const isTablet = width >= 700;
  const size = isTablet ? 72 : 34;
  const gap = isTablet ? 12 : 6;

  return (
    <View
      style={{ width: 4 * (size + gap), height: 3 * (size + gap) }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {tiles.map((tile, index) => (
        <Animated.View
          key={`${tile.row}-${tile.col}`}
          entering={FadeInDown.delay(index * 55)
            .duration(360)
            .springify()
            .damping(14)}
          style={{
            position: 'absolute',
            top: tile.row * (size + gap),
            left: tile.col * (size + gap),
            width: size,
            height: size,
            borderRadius: 10,
            backgroundColor: pieceColors[tile.color].dark,
            ...shadow.piece,
          }}
        >
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 4,
              borderRadius: 10,
              backgroundColor: pieceColors[tile.color].base,
            }}
          />
        </Animated.View>
      ))}
    </View>
  );
}

export function HomeScreen({ onPlay, onOpenSettings, onRemoveAds }: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  // A 1032pt-wide Play button is not a button, it is a stripe. The column keeps
  // the controls at a size a thumb expects while the gradient takes the rest.
  const isTablet = width >= 700;
  // A 1032pt-wide Play button is not a button, it is a stripe. The column keeps
  // the controls at a size a thumb expects while the gradient takes the rest.
  const column = isTablet
    ? { maxWidth: 560, width: '100%' as const, alignSelf: 'center' as const }
    : null;
  // `space-between` is right on a phone, where the hero and the panel sit close
  // enough to read as one composition. On a 1376pt-tall iPad it pulls them to
  // opposite ends: the logo floats alone around the middle, the controls jam
  // against the bottom edge, and the two thirds between are dead. Measured
  // during QA as the worst layout in the fleet -- and worse than merely sparse,
  // because emptiness in the MIDDLE reads as deliberate rather than as content
  // that ran out. On a tablet the two groups stay together at the top instead.
  const distribution = isTablet
    ? { justifyContent: 'flex-start' as const, gap: spacing.xl }
    : null;
  const highScore = useGameStore((state) => state.highScore);
  const adsRemoved = usePurchaseStore((state) => state.adsRemoved);
  const priceString = usePurchaseStore((state) => state.priceString);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.gradientTop, colors.background]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View
        style={[styles.content, column, distribution, { paddingTop: insets.top + spacing.lg }]}
      >
        <View style={styles.topBar}>
          <View style={styles.spacer} />
          <IconButton name="settings" label="Settings" onPress={onOpenSettings} />
        </View>

        <Animated.View entering={FadeInUp.duration(400)} style={styles.hero}>
          <Hero />
          <Text
            style={[type.display, styles.title, isTablet && styles.titleTablet]}
            maxFontSizeMultiplier={MAX_DISPLAY_FONT_SCALE}
          >
            Gridlock Pop
          </Text>
          <Text style={[type.caption, styles.subtitle]}>
            Drop blocks. Clear lines. Chase the combo.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(400)} style={styles.panel}>
          <View style={styles.bestRow}>
            <Icon name="trophy" size={18} color={colors.accent} />
            <Text style={type.label}>BEST</Text>
            <Text
              style={[type.title, styles.bestValue]}
              maxFontSizeMultiplier={MAX_DISPLAY_FONT_SCALE}
            >
              {highScore.toLocaleString()}
            </Text>
          </View>

          <Button label="Play" icon="play" onPress={onPlay} accessibilityHint="Starts a new game" />

          {!adsRemoved ? (
            <Button
              label={priceString ? `Remove ads — ${priceString}` : 'Remove ads'}
              icon="no-ads"
              variant="secondary"
              onPress={onRemoveAds}
              accessibilityHint="One-time purchase that removes every ad forever"
            />
          ) : (
            <View style={styles.proBadge}>
              <Icon name="sparkles" size={16} color={colors.success} filled />
              <Text style={[type.caption, { color: colors.success }]}>Ad-free unlocked</Text>
            </View>
          )}
        </Animated.View>
      </View>

      <View style={{ paddingBottom: insets.bottom }}>
        <AdBanner />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    justifyContent: 'space-between',
  },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  spacer: { width: 48 },
  hero: { alignItems: 'center', gap: spacing.lg },
  title: { fontSize: 46, marginTop: spacing.lg },
  titleTablet: { fontSize: 64 },
  subtitle: { textAlign: 'center' },
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl + 4,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow.card,
  },
  bestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  bestValue: { fontVariant: ['tabular-nums'] },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
});
