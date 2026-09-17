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
    // WARN, not DEBUG. At DEBUG the SDK writes routine lifecycle lines to the
    // console, React Native draws them as a LogBox toast, and the toast lands on
    // top of the UI -- it was photographed covering the "Remove ads" button on
    // an iPad during QA. A store screenshot with a dev warning across it is not
    // shippable, and this is the only thing that put one there.
    //
    // While capturing, drop to ERROR: even a warning is a toast.
    if (IS_DEV) {
      const capturing = process.env.EXPO_PUBLIC_CAPTURE_MODE === '1';
      await Purchases.setLogLevel(capturing ? LOG_LEVEL.ERROR : LOG_LEVEL.WARN);
    }
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
