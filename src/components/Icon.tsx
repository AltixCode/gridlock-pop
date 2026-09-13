import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors } from '../theme/tokens';

export type IconName =
  | 'play'
  | 'settings'
  | 'close'
  | 'back'
  | 'sound-on'
  | 'sound-off'
  | 'vibrate'
  | 'trophy'
  | 'sparkles'
  | 'no-ads'
  | 'restore'
  | 'restart'
  | 'chevron-right';

/** Lucide-derived 24x24 outline paths — no emoji stands in for an icon anywhere in the app. */
const PATHS: Record<IconName, React.ReactNode> = {
  play: <Path d="M7 4.5v15l13-7.5z" />,
  settings: (
    <>
      <Circle cx={12} cy={12} r={3} />
      <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </>
  ),
  close: <Path d="M18 6 6 18M6 6l12 12" />,
  back: <Path d="M19 12H5m7-7-7 7 7 7" />,
  'sound-on': <Path d="M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14" />,
  'sound-off': <Path d="M11 5 6 9H2v6h4l5 4zM22 9l-6 6M16 9l6 6" />,
  vibrate: (
    <Path d="M2 8v8M22 8v8M8 4h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
  ),
  trophy: (
    <Path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6m12 5h1.5a2.5 2.5 0 0 0 0-5H18M6 4h12v5a6 6 0 0 1-12 0zM9 20h6M12 15v5" />
  ),
  sparkles: (
    <Path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z" />
  ),
  'no-ads': (
    <Path d="M3 3l18 18M8.5 8.5H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h11M21 16V8a2 2 0 0 0-2-2h-6" />
  ),
  restore: <Path d="M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5" />,
  restart: <Path d="M21 12a9 9 0 1 1-3-6.7L21 8m0-5v5h-5" />,
  'chevron-right': <Path d="m9 18 6-6-6-6" />,
};

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  filled?: boolean;
}

export function Icon({ name, size = 22, color = colors.text, filled = false }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? color : 'none'}
      stroke={filled ? 'none' : color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {PATHS[name]}
    </Svg>
  );
}
