import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '../store/settingsStore';

/** Haptics are a setting, so every call checks the store rather than the caller remembering to. */
function enabled(): boolean {
  return useSettingsStore.getState().haptics;
}

export function tapFeedback(): void {
  if (enabled()) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function placeFeedback(): void {
  if (enabled()) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

export function clearFeedback(): void {
  if (enabled()) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export function rejectFeedback(): void {
  if (enabled()) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

export function gameOverFeedback(): void {
  if (enabled()) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}
