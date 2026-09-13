/* Jest mock for react-native-purchases. */
const LOG_LEVEL = { DEBUG: 'DEBUG', INFO: 'INFO', ERROR: 'ERROR' };

const Purchases = {
  setLogLevel: jest.fn(() => Promise.resolve()),
  configure: jest.fn(() => Promise.resolve()),
  getCustomerInfo: jest.fn(() => Promise.resolve({ entitlements: { active: {} } })),
  getOfferings: jest.fn(() => Promise.resolve({ current: null })),
  purchasePackage: jest.fn(() => Promise.resolve({ customerInfo: { entitlements: { active: {} } } })),
  restorePurchases: jest.fn(() => Promise.resolve({ entitlements: { active: {} } })),
  addCustomerInfoUpdateListener: jest.fn(() => jest.fn()),
  removeCustomerInfoUpdateListener: jest.fn(),
};

module.exports = { __esModule: true, default: Purchases, LOG_LEVEL, PURCHASES_ERROR_CODE: { PURCHASE_CANCELLED_ERROR: '1' } };
