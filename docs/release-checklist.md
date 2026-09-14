# Release runbook

Everything below is one-time setup unless marked **each release**.

## 1. Accounts and one-time setup

### Expo / EAS

```bash
npm i -g eas-cli
eas login
eas init                      # creates the project, writes EAS_PROJECT_ID
eas build:configure
```

Add `EXPO_TOKEN` (Expo → Access Tokens) to the GitHub repo secrets so CI can build.

### AdMob (`console.admob.google.com`)

1. Create the app twice — once for iOS, once for Android.
2. Create three ad units per platform: **Banner (adaptive)**, **Interstitial**, **Rewarded**.
3. Put the app ids and unit ids into EAS environment variables (below).
4. Set the app's content rating to **G** in AdMob so the ads match the store age rating.
5. **Privacy & messaging → create a GDPR message and a US state regulations message**, and
   publish them. The app runs the UMP flow on launch, but the SDK can only present a message
   that exists in the console; without one, EEA/UK users generate no consent and — because the
   app fails closed — see no ads at all.
6. Register your own devices as test devices before ever running a live build —
   clicking your own live ads gets the account banned.

### RevenueCat (`app.revenuecat.com`)

1. Create the project, add the iOS and Android apps.
2. Create one **non-consumable / one-time** product in each store:
   - App Store Connect: `com.altixcode.blockjam.removeads`
   - Play Console: `remove_ads`
3. In RevenueCat create entitlement **`remove_ads`** and attach both products.
4. Create offering **`default`** with a package of type **Lifetime** containing them.
   The app looks for `current.lifetime`, then a package identified `lifetime`, then the
   first available package — matching any of those works.
5. Copy the **public SDK keys** (`appl_…`, `goog_…`) into the env vars below.

Identifiers the code expects live in `src/store/purchaseStore.ts`
(`REMOVE_ADS_ENTITLEMENT`, `REMOVE_ADS_OFFERING_PACKAGE`).

### Environment variables

Set these as EAS environment variables (`eas env:create`) for the `production` and
`preview` environments — never in git:

```
EXPO_PUBLIC_ADMOB_IOS_APP_ID            EXPO_PUBLIC_ADMOB_ANDROID_APP_ID
EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL      EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL
EXPO_PUBLIC_ADMOB_IOS_REWARDED          EXPO_PUBLIC_ADMOB_ANDROID_REWARDED
EXPO_PUBLIC_ADMOB_IOS_BANNER            EXPO_PUBLIC_ADMOB_ANDROID_BANNER
EXPO_PUBLIC_REVENUECAT_IOS_KEY          EXPO_PUBLIC_REVENUECAT_ANDROID_KEY
EXPO_PUBLIC_PRIVACY_POLICY_URL          EXPO_PUBLIC_TERMS_URL
EXPO_PUBLIC_SUPPORT_EMAIL
```

GitHub secrets needed by the workflows:

| Secret                                         | Used by                                                        |
| ---------------------------------------------- | -------------------------------------------------------------- |
| `EXPO_TOKEN`                                   | build + submit                                                 |
| `EXPO_APPLE_ID`, `ASC_APP_ID`, `APPLE_TEAM_ID` | iOS submit                                                     |
| `EXPO_APPLE_APP_SPECIFIC_PASSWORD`             | iOS submit                                                     |
| `PLAY_SERVICE_ACCOUNT_JSON`                    | Android submit (full JSON, written to a temp file and deleted) |

### Hosting the policy pages

`docs/legal/` contains ready-to-publish `privacy.html` and `terms.html`. Publish them
anywhere static (GitHub Pages needs the repo to be public, or a paid plan for a private
one), then point `EXPO_PUBLIC_PRIVACY_POLICY_URL` / `EXPO_PUBLIC_TERMS_URL` at them.
Both stores reject an app whose privacy URL 404s.

## 2. Each release

```bash
npm run verify                 # lint + types + full test suite
npm run doctor                 # expo-doctor, 21 checks
npm run check:release          # refuses a build that would ship test ad units
```

`check:release` is the one that matters before a store build. A missing AdMob or RevenueCat
identifier does not crash anything — the app falls back to Google's test units, plays
perfectly, and earns nothing, which you would only notice as a flat revenue line weeks after
the UA spend went out. The check fails on absent, blank, _or still-a-test-unit_ values, and
the production path of the EAS Build workflow runs it automatically.

1. Bump `version` in `app.config.ts` (build numbers auto-increment via `appVersionSource: remote`).
2. Tag it: `git tag v1.0.1 && git push --tags` → the **EAS Build** workflow runs
   lint/typecheck/tests and then builds both platforms. Or run the workflow manually
   with the `preview` profile first.
3. Install the preview build on a **low-end Android device** and one iPhone. Confirm:
   - 60fps while dragging on the cheap device
   - line clears feel right, no dropped gestures
   - the consent form appears in the EEA (test with AdsConsentDebugGeography.EEA) and
     "Ad privacy settings" then shows up in Settings → About
   - the ATT prompt appears once on iOS, and ads still fill when denied
   - rewarded "Continue" actually grants the revive
   - interstitial appears no more than once per three game-overs
   - purchase and **restore** both work in sandbox, on both platforms
   - zero uncaught exceptions in the device log
4. Run the **EAS Submit** workflow (manual — never automatic).
5. iOS lands in TestFlight, Android in the Play **internal** track as a _draft_.
   Promote by hand after a few days of internal testing.

## 3. Store review gotchas

- **ATT**: the prompt must fire after the app is interactive, not at launch. Already handled.
- **Restore purchases**: Apple rejects non-consumable IAPs without a restore button. It is in Settings.
- **Privacy policy link**: must be reachable from inside the app (Settings → About) and from the listing.
- **Data Safety / Privacy Nutrition labels**: see `docs/store-listing.md` for the exact answers.
- **Account deletion**: not applicable — the app has no accounts and no backend.
- **Export compliance**: `usesNonExemptEncryption: false` is already declared.
- **Ad content rating**: keep AdMob at G so it matches the 4+ / Everyone rating.

## 4. After launch

Do not build the Phase-2 backlog (daily challenge, themes, leaderboard, achievements)
until a paid UA test shows Day-1 retention around 30%+. If it is below that, the fix is
the core loop — piece weights, combo pacing, clear feedback — not more features.
