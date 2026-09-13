module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Must stay last: it compiles worklets for Reanimated/Gesture Handler.
    plugins: ['react-native-worklets/plugin'],
  };
};
