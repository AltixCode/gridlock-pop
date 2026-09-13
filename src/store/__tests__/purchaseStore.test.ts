import Purchases from 'react-native-purchases';
import { usePurchaseStore, REMOVE_ADS_ENTITLEMENT } from '../purchaseStore';

const store = () => usePurchaseStore.getState();

const activeInfo = { entitlements: { active: { [REMOVE_ADS_ENTITLEMENT]: { isActive: true } } } };
const emptyInfo = { entitlements: { active: {} } };

const offering = {
  current: {
    availablePackages: [{ identifier: 'lifetime', product: { priceString: '$3.99' } }],
    lifetime: { identifier: 'lifetime', product: { priceString: '$3.99' } },
  },
};

describe('purchaseStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    store().resetForTests();
  });

  it('starts locked', () => {
    expect(store().adsRemoved).toBe(false);
  });

  it('unlocks when the entitlement is already active', async () => {
    (Purchases.getCustomerInfo as jest.Mock).mockResolvedValueOnce(activeInfo);
    await store().refreshEntitlements();
    expect(store().adsRemoved).toBe(true);
  });

  it('stays locked without the entitlement', async () => {
    (Purchases.getCustomerInfo as jest.Mock).mockResolvedValueOnce(emptyInfo);
    await store().refreshEntitlements();
    expect(store().adsRemoved).toBe(false);
  });

  it('exposes the localised lifetime price', async () => {
    (Purchases.getOfferings as jest.Mock).mockResolvedValueOnce(offering);
    await store().loadOffering();
    expect(store().priceString).toBe('$3.99');
  });

  it('survives an offerings fetch failure', async () => {
    (Purchases.getOfferings as jest.Mock).mockRejectedValueOnce(new Error('offline'));
    await expect(store().loadOffering()).resolves.toBeUndefined();
    expect(store().priceString).toBeNull();
  });

  it('unlocks after a successful purchase', async () => {
    (Purchases.getOfferings as jest.Mock).mockResolvedValueOnce(offering);
    await store().loadOffering();
    (Purchases.purchasePackage as jest.Mock).mockResolvedValueOnce({ customerInfo: activeInfo });

    await expect(store().purchaseRemoveAds()).resolves.toBe('purchased');
    expect(store().adsRemoved).toBe(true);
  });

  it('reports a user cancellation without an error state', async () => {
    (Purchases.getOfferings as jest.Mock).mockResolvedValueOnce(offering);
    await store().loadOffering();
    (Purchases.purchasePackage as jest.Mock).mockRejectedValueOnce({ userCancelled: true });

    await expect(store().purchaseRemoveAds()).resolves.toBe('cancelled');
    expect(store().adsRemoved).toBe(false);
    expect(store().error).toBeNull();
  });

  it('reports a failed purchase', async () => {
    (Purchases.getOfferings as jest.Mock).mockResolvedValueOnce(offering);
    await store().loadOffering();
    (Purchases.purchasePackage as jest.Mock).mockRejectedValueOnce(new Error('billing down'));

    await expect(store().purchaseRemoveAds()).resolves.toBe('error');
    expect(store().error).toBeTruthy();
  });

  it('refuses to purchase when no package has loaded', async () => {
    await expect(store().purchaseRemoveAds()).resolves.toBe('unavailable');
  });

  it('restores a previous purchase', async () => {
    (Purchases.restorePurchases as jest.Mock).mockResolvedValueOnce(activeInfo);
    await expect(store().restore()).resolves.toBe(true);
    expect(store().adsRemoved).toBe(true);
  });

  it('reports when there is nothing to restore', async () => {
    (Purchases.restorePurchases as jest.Mock).mockResolvedValueOnce(emptyInfo);
    await expect(store().restore()).resolves.toBe(false);
  });

  it('never leaves the purchase spinner stuck', async () => {
    (Purchases.restorePurchases as jest.Mock).mockRejectedValueOnce(new Error('nope'));
    await store().restore();
    expect(store().isBusy).toBe(false);
  });
});
