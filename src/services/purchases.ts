import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { IS_DEV, REVENUECAT_API_KEY } from '../config/env';

let configured = false;

/**
 * RevenueCat owns the receipt validation for the single lifetime "Remove Ads" product, so the
 * app never talks to StoreKit / Play Billing directly and no server of ours needs to exist.
 */
export async function configurePurchases(): Promise<boolean> {
  if (configured) return true;
  if (!REVENUECAT_API_KEY) return false;
  try {
    if (IS_DEV) await Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
    configured = true;
    return true;
  } catch {
    return false;
  }
}

export function isPurchasesConfigured(): boolean {
  return configured;
}

export function resetPurchasesForTests(): void {
  configured = false;
}
