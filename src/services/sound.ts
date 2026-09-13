import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { useSettingsStore } from '../store/settingsStore';

const SOURCES = {
  place: require('../../assets/sounds/place.wav'),
  clear: require('../../assets/sounds/clear.wav'),
  combo: require('../../assets/sounds/combo.wav'),
  gameover: require('../../assets/sounds/gameover.wav'),
  tap: require('../../assets/sounds/tap.wav'),
} as const;

export type SoundName = keyof typeof SOURCES;

const players = new Map<SoundName, AudioPlayer>();

/**
 * Players are created once and rewound on each play — cheap enough to fire on every placement,
 * and it keeps the game silent-switch friendly by never claiming the audio session.
 */
export async function initializeSound(): Promise<void> {
  try {
    await setAudioModeAsync({
      playsInSilentMode: false,
      shouldPlayInBackground: false,
      interruptionMode: 'mixWithOthers',
    });
    (Object.keys(SOURCES) as SoundName[]).forEach((name) => {
      if (!players.has(name)) players.set(name, createAudioPlayer(SOURCES[name]));
    });
  } catch {
    // Audio is a nicety; a device that refuses it still plays the game.
  }
}

export function playSound(name: SoundName): void {
  if (!useSettingsStore.getState().sound) return;
  try {
    const player = players.get(name);
    if (!player) return;
    player.seekTo(0);
    player.play();
  } catch {
    // ignore playback races
  }
}

export function releaseSound(): void {
  players.forEach((player) => {
    try {
      player.remove();
    } catch {
      // ignore
    }
  });
  players.clear();
}
