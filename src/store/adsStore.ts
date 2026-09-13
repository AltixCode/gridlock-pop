import { create } from 'zustand';
import type { ConsentSummary } from '../services/consentPolicy';

export interface AdsState {
  /** Mirrors the UMP consent state so components can react to it. */
  consent: ConsentSummary;
  setConsent: (consent: ConsentSummary) => void;
  resetForTests: () => void;
}

const INITIAL: ConsentSummary = { canServeAds: false, offerPrivacyOptions: false };

export const useAdsStore = create<AdsState>((set) => ({
  consent: INITIAL,
  setConsent: (consent) => set({ consent }),
  resetForTests: () => set({ consent: INITIAL }),
}));
