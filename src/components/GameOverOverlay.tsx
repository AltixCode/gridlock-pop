import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Button } from './Buttons';
import { Icon } from './Icon';
import { colors, radius, shadow, spacing, type } from '../theme/tokens';

interface GameOverOverlayProps {
  score: number;
  highScore: number;
  isNewHighScore: boolean;
  linesCleared: number;
  canRevive: boolean;
  isWatchingAd: boolean;
  onRevive: () => void;
  onPlayAgain: () => void;
  onHome: () => void;
}

export function GameOverOverlay({
  score,
  highScore,
  isNewHighScore,
  linesCleared,
  canRevive,
  isWatchingAd,
  onRevive,
  onPlayAgain,
  onHome,
}: GameOverOverlayProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      style={styles.backdrop}
      accessibilityViewIsModal
      accessibilityLabel="Game over"
    >
      <Animated.View
        entering={FadeInDown.duration(280).springify().damping(18)}
        style={styles.card}
      >
        {isNewHighScore ? (
          <View style={styles.badge}>
            <Icon name="sparkles" size={16} color={colors.onAccent} filled />
            <Text style={styles.badgeText}>NEW BEST</Text>
          </View>
        ) : (
          <Text style={[type.label, styles.kicker]}>GAME OVER</Text>
        )}

        <Text style={[type.display, styles.score]} accessibilityLabel={`You scored ${score}`}>
          {score.toLocaleString()}
        </Text>

        <View style={styles.stats}>
          <Stat label="BEST" value={highScore.toLocaleString()} />
          <View style={styles.divider} />
          <Stat label="LINES" value={String(linesCleared)} />
        </View>

        <View style={styles.actions}>
          {canRevive ? (
            <Button
              label="Continue — watch an ad"
              icon="play"
              onPress={onRevive}
              loading={isWatchingAd}
              accessibilityHint="Clears three rows and returns you to the board"
            />
          ) : null}
          <Button
            label="Play again"
            icon={canRevive ? 'restart' : 'play'}
            variant={canRevive ? 'secondary' : 'primary'}
            onPress={onPlayAgain}
          />
          <Button label="Home" variant="ghost" onPress={onHome} />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={type.label}>{label}</Text>
      <Text style={[type.title, styles.statValue]}>{value}</Text>
    </View>
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
    gap: spacing.md,
    ...shadow.card,
  },
  kicker: { letterSpacing: 2 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  badgeText: { color: colors.onAccent, fontWeight: '800', fontSize: 12, letterSpacing: 1.2 },
  score: { fontVariant: ['tabular-nums'] },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    paddingVertical: spacing.sm,
  },
  stat: { alignItems: 'center', gap: 2 },
  statValue: { fontVariant: ['tabular-nums'] },
  divider: { width: 1, height: 32, backgroundColor: colors.border },
  actions: { width: '100%', gap: spacing.sm, marginTop: spacing.sm },
});
