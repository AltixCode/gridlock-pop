import { useWindowDimensions } from 'react-native';

/** The widest a content column gets on a phone, in points. Never binds: the
 *  widest phone is 440pt. */
const CONTENT_MAX_WIDTH = 640;

/** The widest it gets on a tablet. 1032pt (13" portrait) less two gutters is
 *  984, so this binds only on a landscape 13" and leaves the portrait case
 *  using the screen it is on. */
const TABLET_MAX_WIDTH = 920;

/**
 * Caps and centres a screen's content column.
 *
 * This app was the only one in the portfolio left out of the fleet-wide roll
 * out, because it is a plain React Native app rooted in `App.tsx` rather than
 * an expo-router app with an `app/` directory, and the fleet sweep globbed
 * for a paywall route under each app's `app` directory. Its Settings screen -- which is where this app sells its
 * upgrade, since it has no paywall route at all -- ran full width on a 13" iPad
 * with roughly 45% of the height unused beneath it.
 *
 * Spread onto the ScrollView's `contentContainerStyle`. Deliberately does NOT
 * centre vertically: `justifyContent: 'center'` only has slack when content is
 * shorter than the viewport, which on a 13" iPad is most screens, and that
 * leaves a phone's worth of interface floating with dead space above and below.
 */
/**
 * `cap` narrows the column further for a screen that is a single block of prose
 * and one button -- a paywall, not a list. 920pt of feature text on a 13" iPad
 * reads as stretched even though nothing overflows; 640 is the width the same
 * copy already uses on the phone, so the screen looks composed rather than
 * inflated at every size. Omit it and the general cap applies unchanged.
 */
export function useTabletColumn(cap?: number) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 700;
  const phoneMax = cap ?? CONTENT_MAX_WIDTH;
  const tabletMax = cap ?? TABLET_MAX_WIDTH;

  return {
    width: '100%' as const,
    maxWidth: isTablet ? Math.min(width - 48, tabletMax) : phoneMax,
    alignSelf: 'center' as const,
  };
}
