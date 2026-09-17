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

/**
 * The price a store screenshot shows when the simulator has no store.
 *
 * A StoreKit configuration cannot reach this pipeline. Xcode applies one by
 * syncing it to the device as part of running a scheme, via
 * `-[DVTDevice handleStoreKitConfigurationSyncForBundleID:configurationFilePath:]`,
 * and `xcrun simctl` has no equivalent -- so an `expo run:ios` plus
 * `simctl launch` build never receives a product catalogue however correct its
 * .storekit file is. The Remove ads button then renders with no price, and the
 * IAP review screenshot Apple sees shows a purchase with no cost stated.
 *
 * This app stores the price string rather than a package, so the fallback is
 * the string. The figure comes from `scripts/iap.json`, read out of the App
 * Store Connect price schedule, so the screenshot states the real cost -- it
 * simply learns it from the bundle rather than from StoreKit.
 *
 * `__DEV__` is false in every release build, so this is inert in anything that
 * ships, and `packageToBuy` deliberately stays null: the button shows a price
 * but there is nothing to purchase, which is what a capture wants and what a
 * real user must never see.
 */
function capturePriceString(): string | null {
  const price = process.env.EXPO_PUBLIC_CAPTURE_PRICE;
  const capturing = __DEV__ && process.env.EXPO_PUBLIC_CAPTURE_MODE === '1';
  if (!capturing || !price) return null;
  return price.startsWith('$') ? price : `$${price}`;
}

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
      set({
        packageToBuy: pkg,
        priceString: pkg?.product?.priceString ?? capturePriceString(),
      });
    } catch {
      set({ packageToBuy: null, priceString: capturePriceString() });
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
