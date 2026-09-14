import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Board, BOARD_PADDING, type BoardHandle } from '../components/Board';
import { AdBanner } from '../components/AdBanner';
import { GameOverOverlay } from '../components/GameOverOverlay';
import { PauseOverlay } from '../components/PauseOverlay';
import { IconButton } from '../components/Buttons';
import { PieceShape, shapeHeight, shapeWidth } from '../components/PieceShape';
import { ScoreHeader } from '../components/ScoreHeader';
import { Tray, trayCellSizeFor } from '../components/Tray';
import { DRAG_LIFT, GRID_SIZE, type CompletedLines, type Piece } from '../game';
import { useGameStore } from '../store/gameStore';
import { usePurchaseStore } from '../store/purchaseStore';
import { shouldShowInterstitial } from '../services/adPolicy';
import { isRewardedReady, showInterstitial, showRewarded } from '../services/ads';
import {
  clearFeedback,
  gameOverFeedback,
  placeFeedback,
  rejectFeedback,
} from '../services/feedback';
import { playSound } from '../services/sound';
import { colors, spacing } from '../theme/tokens';

const MAX_BOARD_WIDTH = 440;
const CLEAR_ANIMATION_MS = 420;

interface GameScreenProps {
  onExit: () => void;
  onOpenSettings: () => void;
}

export function GameScreen({ onExit, onOpenSettings }: GameScreenProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const game = useGameStore((state) => state.game);
  const status = useGameStore((state) => state.status);
  const highScore = useGameStore((state) => state.highScore);
  const isNewHigh = useGameStore((state) => state.isNewHighScore);
  const adsRemoved = usePurchaseStore((state) => state.adsRemoved);

  const [preview, setPreview] = useState<{ cells: string[]; valid: boolean } | null>(null);
  const [dragging, setDragging] = useState<Piece | null>(null);
  const [clearing, setClearing] = useState<CompletedLines | null>(null);
  const [watchingAd, setWatchingAd] = useState(false);
  const [paused, setPaused] = useState(false);
  const endedRef = useRef(false);
  const boardRef = useRef<BoardHandle>(null);

  // Board sizing: the board is the one element that must never be cramped, so it takes the
  // width it can get and everything else lays out around it.
  const boardWidth = Math.min(width - spacing.lg * 2, MAX_BOARD_WIDTH, height * 0.52);
  const cellSize = Math.floor((boardWidth - BOARD_PADDING * 2) / GRID_SIZE);
  const slotWidth = (boardWidth - spacing.sm * 2) / 3;
  const trayCellSize = Math.floor(trayCellSizeFor(slotWidth, cellSize));

  // Shared values are declared individually (stable refs) and only then bundled for the tray —
  // the drag maths runs on the UI thread and must never depend on a re-rendered object.
  const boardX = useSharedValue(0);
  const boardY = useSharedValue(0);
  const cellSizeShared = useSharedValue(cellSize);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const activeSlot = useSharedValue(-1);
  // The dragged piece's footprint in cells. These have to be shared values: the drag style is a
  // worklet on the UI thread, and calling a plain JS helper from there throws
  // "Tried to synchronously call a Remote Function".
  const dragCellsWide = useSharedValue(0);
  const dragCellsHigh = useSharedValue(0);

  const geometry = useMemo(
    () => ({ boardX, boardY, cellSize: cellSizeShared, dragX, dragY, activeSlot }),
    [boardX, boardY, cellSizeShared, dragX, dragY, activeSlot],
  );

  useEffect(() => {
    cellSizeShared.value = cellSize;
  }, [cellSize, cellSizeShared]);

  const handleMeasure = useCallback(
    (x: number, y: number) => {
      boardX.value = x;
      boardY.value = y;
    },
    [boardX, boardY],
  );

  const handleDragStart = useCallback(
    (slot: number) => {
      // Re-read the board's window position: it can have moved since the last layout pass.
      boardRef.current?.measure();

      const piece = useGameStore.getState().game.pieces[slot] ?? null;
      dragCellsWide.value = piece ? shapeWidth(piece) : 0;
      dragCellsHigh.value = piece ? shapeHeight(piece) : 0;
      setDragging(piece);
    },
    [dragCellsWide, dragCellsHigh],
  );

  const handlePreview = useCallback((slot: number, row: number, col: number) => {
    const state = useGameStore.getState();
    const piece = state.game.pieces[slot];
    if (!piece) return;

    const cells: string[] = [];
    piece.shape.forEach((shapeRow, r) =>
      shapeRow.forEach((filled, c) => {
        if (!filled) return;
        const gr = row + r;
        const gc = col + c;
        if (gr >= 0 && gr < GRID_SIZE && gc >= 0 && gc < GRID_SIZE) cells.push(`${gr}:${gc}`);
      }),
    );

    if (cells.length === 0) {
      setPreview(null);
      return;
    }
    setPreview({ cells, valid: state.canPlace(slot, row, col) });
  }, []);

  const handleDrop = useCallback((slot: number, row: number, col: number) => {
    const store = useGameStore.getState();
    setPreview(null);

    if (!store.canPlace(slot, row, col)) {
      rejectFeedback();
      return;
    }

    const outcome = store.place(slot, row, col);
    if (!outcome) return;

    const linesCleared = outcome.cleared.rows.length + outcome.cleared.cols.length;
    if (linesCleared > 0) {
      clearFeedback();
      playSound(linesCleared > 1 ? 'combo' : 'clear');
      setClearing(outcome.cleared);
      setTimeout(() => setClearing(null), CLEAR_ANIMATION_MS);
    } else {
      placeFeedback();
      playSound('place');
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragging(null);
    setPreview(null);
  }, []);

  /** Screen-reader path: place the piece at its first legal position. */
  const handleAccessiblePlace = useCallback(
    (slot: number) => {
      const store = useGameStore.getState();
      const spot = store.findFirstPlacement(slot);
      if (!spot) {
        rejectFeedback();
        return;
      }
      handleDrop(slot, spot.row, spot.col);
    },
    [handleDrop],
  );

  // End-of-run bookkeeping: persist the score, then decide whether an interstitial is due.
  useEffect(() => {
    if (status !== 'gameover' || endedRef.current) return;
    endedRef.current = true;

    void (async () => {
      gameOverFeedback();
      playSound('gameover');
      await useGameStore.getState().endRun();

      const { gamesPlayed, lastInterstitialAt, markInterstitialShown } = useGameStore.getState();
      if (
        shouldShowInterstitial({
          gamesPlayed,
          lastInterstitialAt,
          now: Date.now(),
          adsRemoved,
        })
      ) {
        const shown = await showInterstitial();
        if (shown) await markInterstitialShown();
      }
    })();
  }, [status, adsRemoved]);

  useEffect(() => {
    if (status === 'playing') endedRef.current = false;
  }, [status]);

  const handleRevive = useCallback(async () => {
    setWatchingAd(true);
    const earned = await showRewarded();
    setWatchingAd(false);
    if (earned) {
      useGameStore.getState().revive();
      playSound('clear');
    }
  }, []);

  const handlePlayAgain = useCallback(() => {
    useGameStore.getState().startGame();
  }, []);

  const dragStyle = useAnimatedStyle(() => {
    const cell = cellSizeShared.value;
    const w = dragCellsWide.value * cell;
    const h = dragCellsHigh.value * cell;
    return {
      opacity: activeSlot.value >= 0 ? 1 : 0,
      transform: [{ translateX: dragX.value - w / 2 }, { translateY: dragY.value - h - DRAG_LIFT }],
    };
  });

  const describePiece = useCallback(
    (piece: Piece) => `Piece ${piece.shapeId.replace(/([A-Z0-9])/g, ' $1').toLowerCase()}`,
    [],
  );

  const canRevive = useGameStore((state) => state.game.revivesUsed) < 1 && isRewardedReady();

  const pieces = useMemo(() => game.pieces, [game.pieces]);

  return (
    <View style={styles.root}>
      <View style={[styles.content, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.topBar}>
          <IconButton name="pause" label="Pause" onPress={() => setPaused(true)} />
          <ScoreHeader score={game.score} highScore={highScore} combo={game.combo} />
          <IconButton name="settings" label="Settings" onPress={onOpenSettings} />
        </View>

        <View style={styles.boardArea}>
          <Board
            ref={boardRef}
            grid={game.grid}
            cellSize={cellSize}
            preview={preview}
            clearing={clearing}
            onMeasure={handleMeasure}
          />
        </View>

        <View style={{ width: boardWidth }}>
          <Tray
            pieces={pieces}
            trayCellSize={trayCellSize}
            slotWidth={slotWidth}
            geometry={geometry}
            onDragStart={handleDragStart}
            onPreview={handlePreview}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            onAccessiblePlace={handleAccessiblePlace}
            describePiece={describePiece}
          />
        </View>
      </View>

      <View style={{ paddingBottom: insets.bottom }}>
        <AdBanner />
      </View>

      {/* Drag layer: lives above everything and ignores touches so the gesture keeps ownership. */}
      <Animated.View pointerEvents="none" style={[styles.dragLayer, dragStyle]}>
        {dragging ? <PieceShape piece={dragging} cellSize={cellSize} /> : null}
      </Animated.View>

      {paused && status === 'playing' ? (
        <PauseOverlay
          score={game.score}
          onResume={() => setPaused(false)}
          onRestart={() => {
            setPaused(false);
            handlePlayAgain();
          }}
          onSettings={() => {
            setPaused(false);
            onOpenSettings();
          }}
          onHome={() => {
            setPaused(false);
            onExit();
          }}
        />
      ) : null}

      {status === 'gameover' ? (
        <GameOverOverlay
          score={game.score}
          highScore={highScore}
          isNewHighScore={isNewHigh}
          linesCleared={game.linesCleared}
          canRevive={canRevive}
          isWatchingAd={watchingAd}
          onRevive={handleRevive}
          onPlayAgain={handlePlayAgain}
          onHome={onExit}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  boardArea: { alignItems: 'center', justifyContent: 'center' },
  dragLayer: { position: 'absolute', top: 0, left: 0 },
});
