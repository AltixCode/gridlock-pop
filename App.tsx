import React, { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { LogBox, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ReduceMotion, ReducedMotionConfig } from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { GameScreen } from './src/screens/GameScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { useGameStore } from './src/store/gameStore';
import { useSettingsStore } from './src/store/settingsStore';
import { usePurchaseStore } from './src/store/purchaseStore';
import { initializeAds } from './src/services/ads';
import { initializeSound } from './src/services/sound';
import { colors } from './src/theme/tokens';

type Route = 'home' | 'game' | 'settings';

/**
 * No LogBox toast in a capture build.
 *
 * Dropping the RevenueCat log level to ERROR silences chatter but not errors,
 * and in a simulator the errors are unavoidable -- there is no StoreKit to
 * reach. React Native draws them as a toast docked at the bottom, which was
 * photographed sitting across this game's piece tray, cutting all three
 * playable pieces off mid-shape. The tray underneath was completely intact:
 * the toast does not break the UI, it makes correct UI *look* broken, which is
 * its own kind of bad screenshot.
 *
 * Gated on `__DEV__` and the capture flag together: an ordinary debug build
 * keeps its warnings, a release build never reaches the line.
 */
if (__DEV__ && process.env.EXPO_PUBLIC_CAPTURE_MODE === '1') {
  LogBox.ignoreAllLogs(true);
}

export default function App() {
  const [route, setRoute] = useState<Route>('home');
  const [returnTo, setReturnTo] = useState<Route>('home');

  useEffect(() => {
    void useGameStore.getState().hydrate();
    void useSettingsStore.getState().hydrate();
    void usePurchaseStore.getState().initialize();
    void initializeSound();
    // Ads initialise last: the ATT prompt should never be the first thing a new player sees.
    void initializeAds();
  }, []);

  const openSettings = useCallback(() => {
    setReturnTo(route === 'settings' ? 'home' : route);
    setRoute('settings');
  }, [route]);

  const startGame = useCallback(() => {
    useGameStore.getState().startGame();
    setRoute('game');
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        {/* Honour the OS "reduce motion" setting: entrances and the clear flash stop animating
            for players who have asked the system for less movement. */}
        <ReducedMotionConfig mode={ReduceMotion.System} />
        <ErrorBoundary
          onReset={() => {
            // Drop the broken run and put the player back somewhere that definitely works.
            useGameStore.getState().abandonRun();
            setRoute('home');
          }}
        >
          <View style={styles.root}>
            {route === 'home' ? (
              <HomeScreen
                onPlay={startGame}
                onOpenSettings={openSettings}
                onRemoveAds={openSettings}
              />
            ) : null}

            {route === 'game' ? (
              <GameScreen onExit={() => setRoute('home')} onOpenSettings={openSettings} />
            ) : null}

            {route === 'settings' ? <SettingsScreen onClose={() => setRoute(returnTo)} /> : null}
          </View>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
});
