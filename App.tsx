import React, { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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
