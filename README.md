# BlockJam

An 8×8 block puzzle for iOS and Android. Drop polyomino pieces, clear rows and columns,
chase the combo. Built with Expo (React Native + TypeScript), monetised with AdMob and a
single lifetime "Remove Ads" purchase through RevenueCat.

## Quick start

```bash
npm ci
cp .env.example .env.local   # optional; test ad units are used when unset
npm start                    # Metro + Expo dev tools
```

Ads and in-app purchases are **native modules**: they do not work in Expo Go. Use a
development build (`npm run build:preview`, or `eas build --profile development`) to
exercise the ad and purchase flows on a device.

## Scripts

| Script                      | What it does                                                 |
| --------------------------- | ------------------------------------------------------------ |
| `npm start`                 | Expo dev server                                              |
| `npm run verify`            | lint + typecheck + tests with coverage (what CI runs)        |
| `npm test`                  | Jest in watch mode                                           |
| `npm run assets`            | Regenerates icon/splash/adaptive-icon from the vector source |
| `npm run doctor`            | `expo-doctor` project health check                           |
| `npm run build:preview`     | Internal-distribution build (APK + iOS internal)             |
| `npm run build:production`  | Store build (AAB + IPA)                                      |
| `npm run submit:production` | Uploads the latest production build to both stores           |

## Architecture

```
src/
  game/        Pure rules engine — no React, no I/O, 100% unit tested
    grid.ts      placement, collision, line detection, clearing
    scoring.ts   points, combo streaks
    shapes.ts    weighted shape library (the difficulty dial)
    bag.ts       seeded RNG + piece draws
    engine.ts    applyMove / reviveGame reducers over GameState
  store/       Zustand stores (game run, settings, purchases)
  services/    Storage, ad pacing, AdMob, RevenueCat, haptics, audio
  components/  Board, Tray, drag layer, buttons, icons, overlays
  screens/     Home, Game, Settings
  theme/       Design tokens (colour, type, spacing, motion)
```

The rules engine is deliberately free of side effects. Every function takes state and
returns new state, which is why the game logic can be exhaustively tested without a
simulator and why the UI layer stays thin.

### Why the drag is fast

The pan gesture runs entirely on the UI thread (Reanimated worklets). The JS thread is
only woken when the piece crosses into a _different_ grid cell, so dragging stays smooth
on the low-end Android hardware this audience actually plays on.

### Difficulty tuning

Average session length is controlled by two things:

1. `SHAPES[].weight` in `src/game/shapes.ts` — small pieces weighted higher keep runs alive.
2. `generateFairBag` is used for the opening hand and the revive only. Mid-run refills are
   an honest draw; guaranteeing a playable bag every turn makes runs effectively endless.

`npm run balance` plays thousands of headless runs and reports what those weights actually
produce, so tuning is measured rather than guessed. Two bots bracket real play: a careless
one taking any legal move, and a competent one that clears when it can and avoids
fragmenting the board.

Measured over 2000 runs each. Move counts are measured; the minute figures assume 2.2s
per placement (an estimate — worth checking against real play during device QA):

|                        | careless | competent   |
| ---------------------- | -------- | ----------- |
| median moves           | 17       | 77          |
| median session         | 0.6 min  | **2.8 min** |
| p10 / p90 moves        | 11 / 26  | 23 / 227    |
| median score           | 63       | 620         |
| runs ending ≤ 10 moves | 2.5%     | 0.4%        |

The competent median lands inside the 2–4 minute target, and skill is worth roughly 5× the
session length — which is what makes "one more go" work. Note the floor: a player who is
still learning gets ~1 minute runs, and that is the experience Day-1 retention is decided on.

`src/game/__tests__/balance.test.ts` guards these bounds in CI. It is a regression guard, not
a pin: making the 5-cell pieces common collapses the competent median to 0.7 min and fails it.

## Monetisation

| Surface      | Rule                                                                        |
| ------------ | --------------------------------------------------------------------------- |
| Banner       | Home and Game screens, height always reserved to avoid layout shift         |
| Interstitial | Every 3rd game over, never before the 3rd run, min 90s apart                |
| Rewarded     | Opt-in "Continue" after game over — clears the 3 fullest rows, once per run |
| IAP          | One non-consumable, entitlement `remove_ads`, removes banner + interstitial |

The rewarded continue stays available after purchase: it is a player benefit, not an ad
the upgrade is supposed to remove.

Pacing lives in `src/services/adPolicy.ts` and is unit tested — change the constants there,
not at the call sites.

### Consent (GDPR / UMP)

`initializeAds()` runs Google's User Messaging Platform flow _first_, then the iOS ATT
prompt, and only then initialises the Mobile Ads SDK — and only if UMP says the app may
request ads. The rules live in `src/services/consentPolicy.ts` and fail closed: if the
consent SDK is unreachable, the app serves no ads at all rather than risking an ad request
without consent, which is a common cause of AdMob account suspension. Where UMP reports
that a privacy entry point is required, Settings → About grows an "Ad privacy settings"
row that reopens the form.

You still have to build the consent message itself in the AdMob console
(Privacy & messaging → GDPR + US state regulations) — the SDK only presents what is
configured there.

## Configuration

No keys are committed. Everything comes from `EXPO_PUBLIC_*` environment variables
(see `.env.example`) supplied by EAS build profiles and GitHub Actions secrets. With
nothing configured the app uses Google's official **test** ad units, so a local build can
never serve or click a live ad.

Secrets that must never be `EXPO_PUBLIC_*` (they are not needed by the app): RevenueCat
secret API key, Google Play service account JSON, App Store Connect API key.

## Release

See [`docs/release-checklist.md`](docs/release-checklist.md) for the full runbook and
[`docs/store-listing.md`](docs/store-listing.md) for listing copy, ASO keywords and the
Data Safety / privacy answers both stores ask for.

## Distribution reality check

This mechanic is a commodity. The engineering is the easy part; installs are the hard part
and they cost money. Budget US$500–2,000 for an initial TikTok/Meta UA test, measure Day-1
retention and CPI before scaling, and do not build the Phase-2 backlog until Day-1
retention clears ~30%.
