import React, { useCallback } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Button } from './Buttons';
import { MAX_DISPLAY_FONT_SCALE, colors, radius, shadow, spacing, type } from '../theme/tokens';

interface PauseOverlayProps {
  score: number;
  onResume: () => void;
  onRestart: () => void;
  onSettings: () => void;
  onHome: () => void;
}

export function PauseOverlay({
  score,
  onResume,
  onRestart,
  onSettings,
  onHome,
}: PauseOverlayProps) {
  const handleRestart = useCallback(() => {
    // Losing a run in progress to a mis-tap is the worst thing this menu could do.
    if (score <= 0) {
      onRestart();
      return;
    }
    Alert.alert('Restart run?', `You'll lose the ${score.toLocaleString()} points from this run.`, [
      { text: 'Keep playing', style: 'cancel' },
      { text: 'Restart', style: 'destructive', onPress: onRestart },
    ]);
  }, [score, onRestart]);

  return (
    <Animated.View
      entering={FadeIn.duration(180)}
      style={styles.backdrop}
      accessibilityViewIsModal
      accessibilityLabel="Paused"
    >
      <Animated.View
        entering={FadeInDown.duration(240).springify().damping(18)}
        style={styles.card}
      >
        <Text style={[type.label, styles.kicker]}>PAUSED</Text>
        <Text
          style={[type.score, styles.score]}
          maxFontSizeMultiplier={MAX_DISPLAY_FONT_SCALE}
          accessibilityLabel={`Current score ${score}`}
        >
          {score.toLocaleString()}
        </Text>

        {/*
         * Nothing in this game is time-driven -- no falling pieces, no
         * countdown, no combo that decays while the screen is away. A tester
         * asked what Pause was even for, reasonably: with nothing to freeze,
         * it just looks like it does nothing. What it actually does is block
         * input and hold this run's score, which is worth saying rather than
         * leaving to be inferred.
         */}
        <Text style={[type.caption, styles.explainer]}>
          Your run is safe — nothing is timed, so resume whenever you like.
        </Text>

        <View style={styles.actions}>
          <Button label="Resume" icon="play" onPress={onResume} />
          <Button label="Restart" icon="restart" variant="secondary" onPress={handleRestart} />
          <Button label="Settings" icon="settings" variant="secondary" onPress={onSettings} />
          <Button label="Quit to home" variant="ghost" onPress={onHome} />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.backgroundElevated,
    borderRadius: radius.xl + 6,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadow.card,
  },
  kicker: { letterSpacing: 2 },
  score: { fontVariant: ['tabular-nums'] },
  explainer: { textAlign: 'center', paddingHorizontal: spacing.sm },
  actions: { width: '100%', gap: spacing.sm, marginTop: spacing.lg },
});
