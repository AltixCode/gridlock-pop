import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Icon } from './Icon';
import { MAX_DISPLAY_FONT_SCALE, colors, motion, radius, spacing, type } from '../theme/tokens';

interface ScoreHeaderProps {
  score: number;
  highScore: number;
  combo: number;
}

export function ScoreHeader({ score, highScore, combo }: ScoreHeaderProps) {
  const pop = useSharedValue(0);

  useEffect(() => {
    if (score === 0) return;
    pop.value = withSequence(
      withTiming(1, { duration: 90 }),
      withTiming(0, { duration: motion.base }),
    );
  }, [score, pop]);

  const scoreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pop.value * 0.07 }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.best} accessibilityLabel={`Best score ${highScore}`}>
        <Icon name="trophy" size={16} color={colors.textMuted} />
        <Text
          style={[type.caption, styles.bestText]}
          maxFontSizeMultiplier={MAX_DISPLAY_FONT_SCALE}
        >
          {highScore.toLocaleString()}
        </Text>
      </View>

      <Animated.Text
        style={[type.score, scoreStyle]}
        maxFontSizeMultiplier={MAX_DISPLAY_FONT_SCALE}
        accessibilityLiveRegion="polite"
        accessibilityLabel={`Score ${score}`}
      >
        {score.toLocaleString()}
      </Animated.Text>

      <View style={styles.comboSlot}>
        {combo > 1 ? (
          <View style={styles.combo} accessibilityLabel={`Combo ${combo} times`}>
            <Text style={styles.comboText} maxFontSizeMultiplier={MAX_DISPLAY_FONT_SCALE}>
              ×{combo}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: spacing.xs },
  best: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  bestText: { letterSpacing: 0.4, fontVariant: ['tabular-nums'] },
  comboSlot: { height: 26, justifyContent: 'center' },
  combo: {
    backgroundColor: colors.comboFill,
    borderColor: colors.comboEdge,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
  },
  comboText: { color: colors.accent, fontWeight: '800', fontSize: 14, letterSpacing: 0.4 },
});
