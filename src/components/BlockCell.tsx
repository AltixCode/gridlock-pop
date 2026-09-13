import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, pieceColor, radius } from '../theme/tokens';

interface BlockCellProps {
  size: number;
  colorId: number | null;
  /** Drag preview state for an empty cell. */
  preview?: 'valid' | 'invalid' | null;
  dimmed?: boolean;
}

/**
 * One board square. Filled cells get a lighter top face and a darker base so the board reads as
 * physical tiles rather than flat colour — the whole tactile feel of the game rests on this.
 */
function BlockCellComponent({ size, colorId, preview = null, dimmed = false }: BlockCellProps) {
  const inset = Math.max(1, Math.round(size * 0.06));
  const corner = Math.max(4, Math.round(size * 0.24));

  if (colorId === null) {
    return (
      <View style={{ width: size, height: size, padding: inset }}>
        <View
          style={[
            styles.empty,
            { borderRadius: corner },
            preview === 'valid' && styles.previewValid,
            preview === 'invalid' && styles.previewInvalid,
          ]}
        />
      </View>
    );
  }

  const tone = pieceColor(colorId);
  return (
    <View style={{ width: size, height: size, padding: inset }}>
      <View
        style={[
          styles.filled,
          { borderRadius: corner, backgroundColor: tone.dark, opacity: dimmed ? 0.35 : 1 },
        ]}
      >
        <View
          style={[
            styles.face,
            {
              borderRadius: Math.max(3, corner - 2),
              backgroundColor: tone.base,
              bottom: Math.max(2, Math.round(size * 0.1)),
            },
          ]}
        >
          <View
            style={[
              styles.gloss,
              { borderRadius: Math.max(2, corner - 4), backgroundColor: tone.light },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    flex: 1,
    backgroundColor: colors.cellEmpty,
    borderWidth: 1,
    borderColor: colors.cellEmptyEdge,
  },
  previewValid: {
    backgroundColor: 'rgba(251,191,36,0.30)',
    borderColor: 'rgba(251,191,36,0.70)',
  },
  previewInvalid: {
    backgroundColor: 'rgba(248,113,113,0.20)',
    borderColor: 'rgba(248,113,113,0.55)',
  },
  filled: { flex: 1 },
  face: { position: 'absolute', top: 0, left: 0, right: 0 },
  gloss: {
    position: 'absolute',
    top: '12%',
    left: '12%',
    right: '12%',
    height: '26%',
    opacity: 0.55,
  },
  cellRadius: { borderRadius: radius.sm },
});

export const BlockCell = memo(BlockCellComponent);
