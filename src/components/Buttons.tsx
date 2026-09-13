import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Icon, type IconName } from './Icon';
import { HIT_SIZE, colors, motion, radius, shadow, spacing, type } from '../theme/tokens';
import { tapFeedback } from '../services/feedback';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  style,
  accessibilityHint,
}: ButtonProps) {
  const pressed = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * 0.035 }],
    opacity: 1 - pressed.value * 0.12,
  }));

  const isDisabled = disabled || loading;
  const foreground = variant === 'primary' ? colors.onAccent : colors.text;

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPressIn={() => {
        pressed.value = withTiming(1, { duration: motion.fast });
      }}
      onPressOut={() => {
        pressed.value = withTiming(0, { duration: motion.base });
      }}
      onPress={() => {
        tapFeedback();
        onPress();
      }}
      android_ripple={{ color: 'rgba(255,255,255,0.12)', borderless: false }}
      style={[
        styles.button,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        isDisabled && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <View style={styles.content}>
          {icon ? <Icon name={icon} size={20} color={foreground} filled={icon === 'play'} /> : null}
          <Text style={[type.body, styles.label, { color: foreground }]}>{label}</Text>
        </View>
      )}
    </AnimatedPressable>
  );
}

interface IconButtonProps {
  name: IconName;
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({ name, label, onPress, style }: IconButtonProps) {
  const pressed = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * 0.08 }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      onPressIn={() => {
        pressed.value = withTiming(1, { duration: motion.fast });
      }}
      onPressOut={() => {
        pressed.value = withTiming(0, { duration: motion.base });
      }}
      onPress={() => {
        tapFeedback();
        onPress();
      }}
      style={[styles.iconButton, animatedStyle, style]}
    >
      <Icon name={name} size={22} color={colors.textMuted} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    overflow: 'hidden',
  },
  primary: { backgroundColor: colors.accent, ...shadow.card },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  ghost: { backgroundColor: 'transparent', minHeight: HIT_SIZE },
  disabled: { opacity: 0.5 },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
  iconButton: {
    width: HIT_SIZE,
    height: HIT_SIZE,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
