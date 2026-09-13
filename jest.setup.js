// Gesture Handler installs native bindings on import; its own Jest setup stubs them.
require('react-native-gesture-handler/jestSetup');

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('react-native-google-mobile-ads', () =>
  require('./src/services/__mocks__/googleMobileAds'),
);
jest.mock('react-native-purchases', () => require('./src/services/__mocks__/purchases'));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));
jest.mock('expo-tracking-transparency', () => ({
  requestTrackingPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getTrackingPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
}));

// RTL v14 renders and cleans up asynchronously; without awaiting cleanup, one test's teardown
// overlaps the next test's render and produces "overlapping act()" failures.
const { cleanup } = require('@testing-library/react-native');

afterEach(async () => {
  await cleanup();
});

// expo-audio touches native player prototypes at import time, which the Jest environment
// cannot provide; the sound service is a thin wrapper with nothing else to assert.
// SafeAreaProvider renders nothing until the native module reports insets, which never
// happens under Jest; the library's own mock supplies a static frame instead.
jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

jest.mock('expo-audio', () => ({
  setAudioModeAsync: jest.fn(() => Promise.resolve()),
  createAudioPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn(),
    remove: jest.fn(),
  })),
}));
