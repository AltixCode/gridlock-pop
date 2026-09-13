import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { PieceShape, shapeHeight, shapeWidth } from './PieceShape';
import { GRID_SIZE, type Piece } from '../game';
import { colors, motion, radius, spacing } from '../theme/tokens';

/** How far above the fingertip the dragged piece floats, so the board stays visible. */
export const DRAG_LIFT = 52;

export interface DragGeometry {
  boardX: SharedValue<number>;
  boardY: SharedValue<number>;
  cellSize: SharedValue<number>;
  dragX: SharedValue<number>;
  dragY: SharedValue<number>;
  activeSlot: SharedValue<number>;
}

interface TrayProps {
  pieces: (Piece | null)[];
  trayCellSize: number;
  slotWidth: number;
  geometry: DragGeometry;
  canPlaceAt: (slot: number, row: number, col: number) => boolean;
  onDragStart: (slot: number) => void;
  onPreview: (slot: number, row: number, col: number) => void;
  onDrop: (slot: number, row: number, col: number) => void;
  onDragEnd: () => void;
  onAccessiblePlace: (slot: number) => void;
  describePiece: (piece: Piece) => string;
}

function TraySlot({
  piece,
  slot,
  trayCellSize,
  slotWidth,
  geometry,
  onDragStart,
  onPreview,
  onDrop,
  onDragEnd,
  onAccessiblePlace,
  describePiece,
}: Omit<TrayProps, 'pieces' | 'canPlaceAt'> & { piece: Piece | null; slot: number }) {
  const lifted = useSharedValue(0);
  const lastRow = useSharedValue(-99);
  const lastCol = useSharedValue(-99);

  const width = piece ? shapeWidth(piece) : 0;
  const height = piece ? shapeHeight(piece) : 0;

  const pan = Gesture.Pan()
    .enabled(Boolean(piece))
    .maxPointers(1)
    .onStart((event) => {
      geometry.activeSlot.value = slot;
      geometry.dragX.value = event.absoluteX;
      geometry.dragY.value = event.absoluteY;
      lifted.value = withTiming(1, { duration: motion.fast });
      lastRow.value = -99;
      lastCol.value = -99;
      runOnJS(onDragStart)(slot);
    })
    .onUpdate((event) => {
      geometry.dragX.value = event.absoluteX;
      geometry.dragY.value = event.absoluteY;

      const cell = geometry.cellSize.value;
      if (cell <= 0) return;
      const left = event.absoluteX - (width * cell) / 2;
      const top = event.absoluteY - height * cell - DRAG_LIFT;
      const col = Math.round((left - geometry.boardX.value) / cell);
      const row = Math.round((top - geometry.boardY.value) / cell);

      // Only cross the bridge to JS when the target cell actually changes.
      if (row !== lastRow.value || col !== lastCol.value) {
        lastRow.value = row;
        lastCol.value = col;
        runOnJS(onPreview)(slot, row, col);
      }
    })
    .onEnd(() => {
      runOnJS(onDrop)(slot, lastRow.value, lastCol.value);
    })
    .onFinalize(() => {
      geometry.activeSlot.value = -1;
      lifted.value = withTiming(0, { duration: motion.base });
      runOnJS(onDragEnd)();
    });

  const style = useAnimatedStyle(() => ({
    opacity: 1 - lifted.value,
    transform: [{ scale: 1 - lifted.value * 0.2 }],
  }));

  if (!piece) {
    return <View style={[styles.slot, { width: slotWidth }]} />;
  }

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[styles.slot, { width: slotWidth }, style]}
        accessibilityRole="button"
        accessibilityLabel={describePiece(piece)}
        accessibilityHint="Drag onto the board, or double tap to place it automatically"
        accessibilityActions={[{ name: 'activate', label: 'Place piece' }]}
        onAccessibilityAction={() => onAccessiblePlace(slot)}
      >
        <PieceShape piece={piece} cellSize={trayCellSize} />
      </Animated.View>
    </GestureDetector>
  );
}

export function Tray({ pieces, ...rest }: TrayProps) {
  return (
    <View style={styles.tray} accessibilityLabel="Piece tray">
      {pieces.map((piece, slot) => (
        <TraySlot key={piece?.id ?? `empty-${slot}`} piece={piece} slot={slot} {...rest} />
      ))}
    </View>
  );
}

/** Tray cell size that keeps even the widest piece inside its slot. */
export function trayCellSizeFor(slotWidth: number, boardCellSize: number): number {
  const widest = 5; // longest shape in the library
  return Math.min(boardCellSize * 0.62, (slotWidth - spacing.md * 2) / widest);
}

export { GRID_SIZE };

const styles = StyleSheet.create({
  tray: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  slot: {
    minHeight: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
