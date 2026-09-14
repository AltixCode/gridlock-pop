import React, {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { BlockCell } from './BlockCell';
import { GRID_SIZE, type CompletedLines, type Grid } from '../game';
import { colors, radius, spacing } from '../theme/tokens';

export const BOARD_PADDING = spacing.sm;

export interface BoardHandle {
  /** Re-reads the board's absolute origin. Call before relying on it. */
  measure: () => void;
}

interface PreviewState {
  cells: string[];
  valid: boolean;
}

interface BoardProps {
  grid: Grid;
  cellSize: number;
  preview: PreviewState | null;
  clearing: CompletedLines | null;
  onMeasure: (x: number, y: number) => void;
}

/** A fading sweep over each cleared row/column — the "satisfying moment" of the whole game. */
function LineBurst({ cellSize, lines }: { cellSize: number; lines: CompletedLines }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withSequence(
      withTiming(1, { duration: 110 }),
      withDelay(40, withTiming(0, { duration: 220 })),
    );
  }, [lines, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.94 + progress.value * 0.06 }],
  }));

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {lines.rows.map((row) => (
        <Animated.View
          key={`r${row}`}
          style={[
            styles.burst,
            style,
            { top: row * cellSize, left: 0, width: cellSize * GRID_SIZE, height: cellSize },
          ]}
        />
      ))}
      {lines.cols.map((col) => (
        <Animated.View
          key={`c${col}`}
          style={[
            styles.burst,
            style,
            { left: col * cellSize, top: 0, width: cellSize, height: cellSize * GRID_SIZE },
          ]}
        />
      ))}
    </View>
  );
}

function BoardComponent(
  { grid, cellSize, preview, clearing, onMeasure }: BoardProps,
  ref: React.Ref<BoardHandle>,
) {
  const containerRef = useRef<View>(null);

  const measure = useCallback(() => {
    // measureInWindow gives the absolute page origin the drag layer maps finger positions against.
    containerRef.current?.measureInWindow((x, y) =>
      onMeasure(x + BOARD_PADDING, y + BOARD_PADDING),
    );
  }, [onMeasure]);

  /**
   * onLayout alone is not enough. It fires when the board's layout *within its parent* changes,
   * but the value we need is its position in the window — and that can move without onLayout
   * firing at all (late safe-area insets, the ad banner mounting when consent resolves, the
   * Android status bar being applied after first paint). A stale origin sends every drop to the
   * wrong row, so the drag re-measures before it starts.
   */
  useImperativeHandle(ref, () => ({ measure }), [measure]);

  const handleLayout = (_: LayoutChangeEvent) => measure();

  const previewCells = preview ? new Set(preview.cells) : null;

  return (
    <View
      ref={containerRef}
      onLayout={handleLayout}
      style={[styles.well, { padding: BOARD_PADDING, borderRadius: radius.xl }]}
      accessibilityLabel="Game board"
    >
      <View style={{ width: cellSize * GRID_SIZE, height: cellSize * GRID_SIZE }}>
        {grid.map((row, r) => (
          <View key={r} style={styles.row}>
            {row.map((cell, c) => (
              <BlockCell
                key={c}
                size={cellSize}
                colorId={cell}
                preview={
                  previewCells?.has(`${r}:${c}`) ? (preview!.valid ? 'valid' : 'invalid') : null
                }
              />
            ))}
          </View>
        ))}
        {clearing ? <LineBurst cellSize={cellSize} lines={clearing} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  well: {
    backgroundColor: colors.boardWell,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: 'row' },
  burst: {
    position: 'absolute',
    backgroundColor: colors.clearBurst,
    borderRadius: radius.md,
  },
});

export const Board = memo(forwardRef<BoardHandle, BoardProps>(BoardComponent));
