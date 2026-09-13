import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from './Buttons';
import { colors, radius, spacing, type } from '../theme/tokens';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Hook for a crash reporter. Called once per caught error. */
  onError?: (error: Error, info: React.ErrorInfo) => void;
  /** Called when the player chooses to start over, so the app can reset its own state. */
  onReset?: () => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Last line of defence. An uncaught render error would otherwise leave the player staring at a
 * blank screen with no way back — which reads as "this app is broken" and earns one-star
 * reviews. A run is cheap to lose; the session is not.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.props.onError?.(error, info);
  }

  handleReset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <View style={styles.root} accessibilityLabel="Error">
        <View style={styles.card}>
          <Text style={type.title}>Something went wrong</Text>
          <Text style={[type.caption, styles.body]}>
            The game hit an unexpected problem. Your best score is safe — start a new run and carry
            on.
          </Text>
          <Button
            label="Start a new game"
            icon="restart"
            onPress={this.handleReset}
            style={styles.action}
          />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.md,
    alignItems: 'center',
  },
  body: { textAlign: 'center' },
  action: { alignSelf: 'stretch', marginTop: spacing.sm },
});
