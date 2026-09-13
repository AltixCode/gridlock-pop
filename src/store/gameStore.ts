import { create } from 'zustand';
import {
  applyMove,
  canApplyMove,
  createGame,
  createRng,
  findValidPlacements,
  isNewHighScore,
  reviveGame,
} from '../game';
import type { GameState, MoveOutcome, Placement, Rng } from '../game';
import { STORAGE_KEYS, loadJson, saveJson } from '../services/storage';

export type RunStatus = 'idle' | 'playing' | 'gameover';

export const MAX_REVIVES_PER_RUN = 1;

interface PersistedProgress {
  highScore: number;
  gamesPlayed: number;
  lastInterstitialAt: number;
}

export interface GameStore {
  game: GameState;
  status: RunStatus;
  highScore: number;
  gamesPlayed: number;
  lastInterstitialAt: number;
  isNewHighScore: boolean;
  /** Set for one frame after a clearing move so the UI can play the clear animation. */
  lastOutcome: MoveOutcome | null;
  hydrated: boolean;

  hydrate: () => Promise<void>;
  startGame: (seed?: number) => void;
  place: (slot: number, row: number, col: number) => MoveOutcome | null;
  canPlace: (slot: number, row: number, col: number) => boolean;
  findFirstPlacement: (slot: number) => Placement | null;
  canRevive: () => boolean;
  abandonRun: () => void;
  revive: () => void;
  endRun: () => Promise<void>;
  markInterstitialShown: () => Promise<void>;
  clearLastOutcome: () => void;
  resetForTests: () => void;
}

/** The RNG is a stateful closure, so it lives beside the store rather than inside its state. */
let rng: Rng = createRng(Date.now());

function persist(state: Pick<GameStore, 'highScore' | 'gamesPlayed' | 'lastInterstitialAt'>) {
  return saveJson(STORAGE_KEYS.progress, {
    highScore: state.highScore,
    gamesPlayed: state.gamesPlayed,
    lastInterstitialAt: state.lastInterstitialAt,
  } satisfies PersistedProgress);
}

function initialState() {
  rng = createRng(Date.now());
  return {
    game: createGame(rng),
    status: 'idle' as RunStatus,
    highScore: 0,
    gamesPlayed: 0,
    lastInterstitialAt: 0,
    isNewHighScore: false,
    lastOutcome: null,
    hydrated: false,
  };
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState(),

  hydrate: async () => {
    const stored = await loadJson<Partial<PersistedProgress>>(STORAGE_KEYS.progress, {});
    set({
      highScore: Number.isFinite(stored.highScore) ? Number(stored.highScore) : 0,
      gamesPlayed: Number.isFinite(stored.gamesPlayed) ? Number(stored.gamesPlayed) : 0,
      lastInterstitialAt: Number.isFinite(stored.lastInterstitialAt)
        ? Number(stored.lastInterstitialAt)
        : 0,
      hydrated: true,
    });
  },

  startGame: (seed) => {
    rng = createRng(seed ?? Date.now());
    set({
      game: createGame(rng),
      status: 'playing',
      isNewHighScore: false,
      lastOutcome: null,
    });
  },

  canPlace: (slot, row, col) => canApplyMove(get().game, slot, row, col),

  findFirstPlacement: (slot) => {
    const { game } = get();
    const piece = game.pieces[slot];
    if (!piece) return null;
    return findValidPlacements(game.grid, piece)[0] ?? null;
  },

  place: (slot, row, col) => {
    const { game, status } = get();
    if (status !== 'playing') return null;
    if (!canApplyMove(game, slot, row, col)) return null;

    const outcome = applyMove(game, slot, row, col, rng);
    set({
      game: outcome.state,
      lastOutcome: outcome,
      status: outcome.gameOver ? 'gameover' : 'playing',
    });
    return outcome;
  },

  canRevive: () => get().game.revivesUsed < MAX_REVIVES_PER_RUN,

  /**
   * Throws the current run away and returns to an idle state, keeping the record and the game
   * count. Used when recovering from a crash — the run is expendable, the player's best is not.
   */
  abandonRun: () => {
    rng = createRng(Date.now());
    set({
      game: createGame(rng),
      status: 'idle',
      lastOutcome: null,
      isNewHighScore: false,
    });
  },

  revive: () => {
    const { game } = get();
    if (game.revivesUsed >= MAX_REVIVES_PER_RUN) return;
    set({ game: reviveGame(game, rng), status: 'playing', lastOutcome: null });
  },

  endRun: async () => {
    const { game, highScore, gamesPlayed, lastInterstitialAt } = get();
    const beatRecord = isNewHighScore(game.score, highScore);
    const next = {
      highScore: beatRecord ? game.score : highScore,
      gamesPlayed: gamesPlayed + 1,
      lastInterstitialAt,
    };
    set({ ...next, isNewHighScore: beatRecord, status: 'gameover' });
    await persist(next);
  },

  markInterstitialShown: async () => {
    const { highScore, gamesPlayed } = get();
    const next = { highScore, gamesPlayed, lastInterstitialAt: Date.now() };
    set(next);
    await persist(next);
  },

  clearLastOutcome: () => set({ lastOutcome: null }),

  resetForTests: () => set(initialState()),
}));
