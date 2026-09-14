import { RELEASE_ENV_KEYS, missingReleaseConfigFrom, selectPlatformValue } from '../releaseConfig';

describe('selectPlatformValue', () => {
  it('picks the value for the running platform', () => {
    expect(selectPlatformValue('ios-value', 'android-value', 'ios')).toBe('ios-value');
    expect(selectPlatformValue('ios-value', 'android-value', 'android')).toBe('android-value');
  });

  it('treats an empty string as absent', () => {
    // An unset variable in a shell or CI often arrives as "" rather than undefined, and an
    // empty ad unit id would be accepted as configured.
    expect(selectPlatformValue('', 'android-value', 'ios')).toBeUndefined();
    expect(selectPlatformValue('   ', 'android-value', 'ios')).toBeUndefined();
  });

  it('does not fall back to the other platform', () => {
    // Falling back would ship the iOS ad unit inside the Android build.
    expect(selectPlatformValue(undefined, 'android-value', 'ios')).toBeUndefined();
    expect(selectPlatformValue('ios-value', undefined, 'android')).toBeUndefined();
  });

  it('returns undefined on an unknown platform', () => {
    expect(selectPlatformValue('ios-value', 'android-value', 'web')).toBeUndefined();
  });
});

describe('missingReleaseConfigFrom', () => {
  const complete: Record<string, string> = Object.fromEntries(
    RELEASE_ENV_KEYS.map((key) => [key, 'set']),
  );

  it('lists nothing when every identifier is present', () => {
    expect(missingReleaseConfigFrom(complete)).toEqual([]);
  });

  it('names each missing identifier', () => {
    const partial = { ...complete };
    delete partial.EXPO_PUBLIC_ADMOB_IOS_REWARDED;
    delete partial.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;

    expect(missingReleaseConfigFrom(partial).sort()).toEqual(
      ['EXPO_PUBLIC_ADMOB_IOS_REWARDED', 'EXPO_PUBLIC_REVENUECAT_ANDROID_KEY'].sort(),
    );
  });

  it('counts an empty or blank value as missing', () => {
    expect(missingReleaseConfigFrom({ ...complete, EXPO_PUBLIC_ADMOB_IOS_BANNER: '' })).toEqual([
      'EXPO_PUBLIC_ADMOB_IOS_BANNER',
    ]);
    expect(missingReleaseConfigFrom({ ...complete, EXPO_PUBLIC_ADMOB_IOS_BANNER: '  ' })).toEqual([
      'EXPO_PUBLIC_ADMOB_IOS_BANNER',
    ]);
  });

  it('rejects a Google test ad unit as a production value', () => {
    // Shipping a test unit is the silent failure this whole check exists to prevent: the app
    // works perfectly and earns nothing.
    const withTestUnit = {
      ...complete,
      EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
    };
    expect(missingReleaseConfigFrom(withTestUnit)).toEqual([
      'EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL',
    ]);
  });

  it('reports everything when nothing is configured at all', () => {
    expect(missingReleaseConfigFrom({})).toEqual([...RELEASE_ENV_KEYS]);
  });

  it('covers both platforms and both vendors', () => {
    const keys = RELEASE_ENV_KEYS.join(' ');
    expect(keys).toMatch(/ADMOB_IOS/);
    expect(keys).toMatch(/ADMOB_ANDROID/);
    expect(keys).toMatch(/REVENUECAT_IOS/);
    expect(keys).toMatch(/REVENUECAT_ANDROID/);
  });
});
