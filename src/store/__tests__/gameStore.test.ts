import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGameStore } from '../gameStore';
import { STORAGE_KEYS } from '../../services/storage';
import { GRID_SIZE, createEmptyGrid } from '../../game';

const store = () => useGameStore.getState();

describe('gameStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    store().resetForTests();
  });

  it('starts idle with no run in progress', () => {
    expect(store().status).toBe('idle');
    expect(store().highScore).toBe(0);
  });

  it('starts a run with a full tray and zero score', () => {
    store().startGame(1234);
    expect(store().status).toBe('playing');
    expect(store().game.score).toBe(0);
    expect(store().game.pieces.filter(Boolean)).toHaveLength(3);
  });

  it('is deterministic for a given seed', () => {
    store().startGame(99);
    const first = store().game.pieces.map((p) => p?.shapeId);
    store().startGame(99);
    expect(store().game.pieces.map((p) => p?.shapeId)).toEqual(first);
  });

  it('places a piece and scores it', () => {
    store().startGame(1);
    const piece = store().game.pieces[0]!;
    const placement = store().findFirstPlacement(0)!;
    expect(placement).toBeTruthy();

    const outcome = store().place(0, placement.row, placement.col);
    expect(outcome).not.toBeNull();
    expect(store().game.score).toBeGreaterThan(0);
    expect(store().game.pieces[0]).toBeNull();
    expect(piece.shapeId).toBeTruthy();
  });

  it('ignores an invalid placement without changing state', () => {
    store().startGame(1);
    const before = store().game;
    expect(store().place(0, -5, -5)).toBeNull();
    expect(store().game).toBe(before);
  });

  it('ignores placements once the run is over', () => {
    store().startGame(1);
    store().endRun();
    expect(store().place(0, 0, 0)).toBeNull();
  });

  it('records a new high score and persists it', async () => {
    store().startGame(1);
    useGameStore.setState((s) => ({ game: { ...s.game, score: 500 } }));
    await store().endRun();

    expect(store().highScore).toBe(500);
    expect(store().isNewHighScore).toBe(true);
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.progress);
    expect(JSON.parse(raw!)).toMatchObject({ highScore: 500 });
  });

  it('does not flag a new high score when the run ties the record', async () => {
    store().startGame(1);
    useGameStore.setState((s) => ({ game: { ...s.game, score: 500 } }));
    await store().endRun();
    store().startGame(2);
    useGameStore.setState((s) => ({ game: { ...s.game, score: 500 } }));
    await store().endRun();

    expect(store().isNewHighScore).toBe(false);
    expect(store().highScore).toBe(500);
  });

  it('counts completed games for the ad cadence', async () => {
    store().startGame(1);
    await store().endRun();
    store().startGame(2);
    await store().endRun();
    expect(store().gamesPlayed).toBe(2);
  });

  it('hydrates a persisted high score', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEYS.progress,
      JSON.stringify({ highScore: 4242, gamesPlayed: 9, lastInterstitialAt: 0 }),
    );
    await store().hydrate();
    expect(store().highScore).toBe(4242);
    expect(store().gamesPlayed).toBe(9);
  });

  it('revives a finished run without losing the score', () => {
    store().startGame(1);
    const full = createEmptyGrid().map((row) => row.map<number | null>(() => 1));
    useGameStore.setState((s) => ({
      game: { ...s.game, grid: full, score: 300, isGameOver: true },
      status: 'gameover',
    }));

    store().revive();
    expect(store().status).toBe('playing');
    expect(store().game.score).toBe(300);
    expect(store().game.isGameOver).toBe(false);
    expect(store().game.revivesUsed).toBe(1);
    expect(
      store()
        .game.grid.flat()
        .filter((cell) => cell === null).length,
    ).toBeGreaterThanOrEqual(GRID_SIZE);
  });

  it('allows only one revive per run', () => {
    store().startGame(1);
    useGameStore.setState((s) => ({ game: { ...s.game, isGameOver: true }, status: 'gameover' }));
    expect(store().canRevive()).toBe(true);
    store().revive();
    useGameStore.setState((s) => ({ game: { ...s.game, isGameOver: true }, status: 'gameover' }));
    expect(store().canRevive()).toBe(false);
  });

  it('abandons a run without losing the record or the game count', async () => {
    store().startGame(1);
    useGameStore.setState((s) => ({ game: { ...s.game, score: 900 } }));
    await store().endRun();

    store().startGame(2);
    useGameStore.setState((s) => ({ game: { ...s.game, score: 40 } }));
    store().abandonRun();

    expect(store().status).toBe('idle');
    expect(store().game.score).toBe(0);
    expect(store().game.isGameOver).toBe(false);
    expect(store().highScore).toBe(900);
    expect(store().gamesPlayed).toBe(1);
  });

  it('records and persists when an interstitial was shown', async () => {
    store().startGame(1);
    await store().endRun();

    const before = Date.now();
    await store().markInterstitialShown();

    expect(store().lastInterstitialAt).toBeGreaterThanOrEqual(before);
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.progress);
    expect(JSON.parse(raw!).lastInterstitialAt).toBe(store().lastInterstitialAt);
    // The record and game count must survive the write.
    expect(JSON.parse(raw!).gamesPlayed).toBe(1);
  });

  it('clears the last move outcome once the animation has played', () => {
    store().startGame(1);
    const placement = store().findFirstPlacement(0)!;
    store().place(0, placement.row, placement.col);
    expect(store().lastOutcome).not.toBeNull();

    store().clearLastOutcome();
    expect(store().lastOutcome).toBeNull();
  });

  it('has no placement to offer for an empty tray slot', () => {
    store().startGame(1);
    useGameStore.setState({ game: { ...store().game, pieces: [null, null, null] } });
    expect(store().findFirstPlacement(0)).toBeNull();
  });

  it('flips to gameover when the board dies', () => {
    store().startGame(1);
    const grid = createEmptyGrid().map((row) => row.map<number | null>(() => 1));
    for (let i = 0; i < GRID_SIZE; i += 1) grid[i][i] = null;
    grid[0][2] = null;
    useGameStore.setState((s) => ({
      game: {
        ...s.game,
        grid,
        pieces: [
          { id: 'x', shapeId: 'single', colorId: 1, shape: [[true]] },
          {
            id: 'y',
            shapeId: 'square2',
            colorId: 1,
            shape: [
              [true, true],
              [true, true],
            ],
          },
          {
            id: 'z',
            shapeId: 'square2',
            colorId: 2,
            shape: [
              [true, true],
              [true, true],
            ],
          },
        ],
      },
    }));

    store().place(0, 0, 2);
    expect(store().status).toBe('gameover');
  });
});
