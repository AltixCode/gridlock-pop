module.exports = {
  preset: 'jest-expo',
  // Reanimated 4 resolves its worklets runtime through this resolver under Jest.
  resolver: 'react-native-worklets/jest/resolver.js',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|react-native-reanimated|react-native-gesture-handler|react-native-google-mobile-ads|react-native-purchases))',
  ],
  collectCoverageFrom: [
    'src/game/**/*.ts',
    'src/store/**/*.ts',
    'src/services/adPolicy.ts',
    'src/services/storage.ts',
    '!src/game/index.ts',
    '!src/game/types.ts',
  ],
  coverageThreshold: {
    global: { branches: 80, functions: 90, lines: 90, statements: 90 },
  },
};
