import { create } from 'zustand';
import Purchases from 'react-native-purchases';
import type { CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import { configurePurchases } from '../services/purchases';

export const REMOVE_ADS_ENTITLEMENT = 'remove_ads';
export const REMOVE_ADS_OFFERING_PACKAGE = 'lifetime';

export type PurchaseResult = 'purchased' | 'cancelled' | 'error' | 'unavailable';

export interface PurchaseState {
  adsRemoved: boolean;
  priceString: string | null;
  packageToBuy: PurchasesPackage | null;
  isBusy: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  refreshEntitlements: () => Promise<void>;
  loadOffering: () => Promise<void>;
  purchaseRemoveAds: () => Promise<PurchaseResult>;
  restore: () => Promise<boolean>;
  resetForTests: () => void;
}

function hasEntitlement(info: CustomerInfo | undefined | null): boolean {
  return Boolean(info?.entitlements?.active?.[REMOVE_ADS_ENTITLEMENT]);
}

const INITIAL = {
  adsRemoved: false,
  priceString: null as string | null,
  packageToBuy: null as PurchasesPackage | null,
  isBusy: false,
  error: null as string | null,
};

export const usePurchaseStore = create<PurchaseState>((set, get) => ({
  ...INITIAL,

  initialize: async () => {
    await configurePurchases();
    await get().refreshEntitlements();
    await get().loadOffering();
  },

  refreshEntitlements: async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      set({ adsRemoved: hasEntitlement(info) });
    } catch {
      // Offline: keep whatever entitlement state we already had rather than locking the player out.
    }
  },

  loadOffering: async () => {
    try {
      const offerings = await Purchases.getOfferings();
      const current = offerings?.current;
      const pkg =
        current?.lifetime ??
        current?.availablePackages?.find(
          (item) => item.identifier === REMOVE_ADS_OFFERING_PACKAGE,
        ) ??
        current?.availablePackages?.[0] ??
        null;
      set({ packageToBuy: pkg, priceString: pkg?.product?.priceString ?? null });
    } catch {
      set({ packageToBuy: null, priceString: null });
    }
  },

  purchaseRemoveAds: async () => {
    const pkg = get().packageToBuy;
    if (!pkg) return 'unavailable';

    set({ isBusy: true, error: null });
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const unlocked = hasEntitlement(customerInfo);
      set({ adsRemoved: unlocked, isBusy: false });
      return unlocked ? 'purchased' : 'error';
    } catch (error) {
      const cancelled = Boolean((error as { userCancelled?: boolean })?.userCancelled);
      set({
        isBusy: false,
        error: cancelled ? null : 'Purchase could not be completed. Please try again.',
      });
      return cancelled ? 'cancelled' : 'error';
    }
  },

  restore: async () => {
    set({ isBusy: true, error: null });
    try {
      const info = await Purchases.restorePurchases();
      const unlocked = hasEntitlement(info);
      set({ adsRemoved: unlocked, isBusy: false });
      return unlocked;
    } catch {
      set({ isBusy: false, error: 'Could not restore purchases. Please try again.' });
      return false;
    }
  },

  resetForTests: () => set({ ...INITIAL }),
}));
