# Store listing

## Identity

| Field                           | Value                                                             |
| ------------------------------- | ----------------------------------------------------------------- |
| App name                        | BlockJam                                                          |
| Subtitle (iOS, 30 chars)        | Block puzzle, pure and quick                                      |
| Short description (Android, 80) | Drop blocks, clear lines, chase the combo. No timer, no pressure. |
| Bundle id / package             | `com.altixcode.blockjam`                                          |
| Category                        | Games → Puzzle (secondary: Casual)                                |
| Age rating                      | 4+ / Everyone — contains ads, no user content, no gambling        |
| Price                           | Free, with one optional in-app purchase                           |

## Full description

> **Drop blocks. Clear lines. Chase the combo.**
>
> BlockJam is a block puzzle stripped back to the part that feels good: place a piece,
> watch a line vanish, line up the next one. No timer. No lives. No pressure — just you
> and an 8×8 grid that keeps asking for one more move.
>
> **How it plays**
> • Drag one of three pieces onto the board
> • Fill a full row or column and it clears
> • Clear on consecutive moves to build a combo multiplier
> • The run ends when nothing fits — then you go again
>
> **Why you'll keep it installed**
> • Plays in one hand, a run takes two minutes
> • Works offline, everywhere
> • No forced sign-in, no account, no timers begging you to come back
> • Remove every ad forever with a single one-time purchase — no subscription
>
> Simple to learn. Genuinely hard to beat your own best.

## ASO keywords (iOS, 100 chars, comma-separated, no spaces)

```
block,puzzle,blockpuzzle,blast,woodoku,brick,grid,jam,relax,offline,combo,tile,sudoku,drop
```

Notes: lead with mechanic and feeling terms, not the generic word "game". Do not repeat
words already in the app name or subtitle — Apple indexes those separately.

### Android keywords

Google indexes the description, so the phrases _block puzzle_, _clear lines_, _offline
puzzle_ and _no wifi_ appear naturally in the copy above. Do not keyword-stuff; Play
penalises it.

## Screenshots (6.7" iPhone, 6.5", 12.9" iPad, Android phone + 7"/10" tablet)

Order matters — most stores only show the first two before a scroll.

1. **The satisfying moment** — mid line-clear, burst visible, combo ×3 on screen.
   Caption: "Clear a line. Then three."
2. Board mid-game with a piece being dragged and the valid-placement preview lit.
   Caption: "Three pieces. One board. Think ahead."
3. Game over with a NEW BEST badge. Caption: "Beat your own record."
4. Home screen. Caption: "Two minutes. One hand. No timer."
5. Settings showing the one-time upgrade. Caption: "Remove ads once. Forever."

Capture at the required device resolutions; no device frames on iOS, frames optional on Play.

These are the one store asset that cannot be generated ahead of time — they have to be
captured from the running app. Take them from the preview build during the device QA pass
in the release checklist, while you already have both devices in hand.

## Feature graphic (Android, 1024×500)

Already generated: **`store-assets/feature-graphic-1024x500.png`** (regenerate with
`npm run assets`). Dark gradient ground with a faint board lattice, the tile cluster left
of centre, wordmark and tagline to its right, ~96px margins on both sides so Play's
cropping on some surfaces cannot clip the text.

## Apple — App Privacy answers

Data collected and **linked to the user**: none.
Data collected and **not linked to the user**:

| Category                             | Purpose                            | Reason                                               |
| ------------------------------------ | ---------------------------------- | ---------------------------------------------------- |
| Identifiers → Device ID              | Third-party advertising, Analytics | AdMob                                                |
| Usage Data → Advertising Data        | Third-party advertising            | AdMob                                                |
| Purchases → Purchase History         | App Functionality                  | RevenueCat receipt validation                        |
| Diagnostics → Crash/Performance Data | Analytics                          | Only if you enable a crash SDK — otherwise answer No |

Tracking: **Yes** — the app asks for permission via ATT and AdMob may use the IDFA for
personalised ads. Answer "Yes, we track" and list Device ID under tracking.

## Google Play — Data Safety answers

- Does your app collect or share user data? **Yes**
- Data types: _Device or other IDs_ (collected and shared, for Advertising and Analytics),
  _Purchase history_ (collected, App functionality).
- Is data encrypted in transit? **Yes**
- Can users request data deletion? **Yes** — via the support email in Settings.
- Is all collected data optional? **No** (advertising id is required for the free tier).

Also complete: **Ads declaration = contains ads**, **Target audience = 13+** (keeps you out
of the Families programme and its extra ad restrictions), **Content rating questionnaire**
(no violence, no user interaction, no purchases of loot — one non-consumable unlock).

## In-app purchase listing

| Field                | Value                                                                                                                                                 |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reference name       | Remove Ads (Lifetime)                                                                                                                                 |
| Product id (iOS)     | `com.altixcode.blockjam.removeads`                                                                                                                    |
| Product id (Android) | `remove_ads`                                                                                                                                          |
| Type                 | Non-consumable / one-time                                                                                                                             |
| Price tier           | US$3.99 (test 2.99 vs 4.99 after the first 1k installs)                                                                                               |
| Display name         | Remove Ads Forever                                                                                                                                    |
| Description          | Removes every banner and interstitial permanently. One payment, no subscription. The optional "Continue" reward video stays available if you want it. |

## Support / legal URLs

- Support: `support@altixcode.com`
- Privacy policy and Terms: publish `docs/legal/privacy.html` and `docs/legal/terms.html`,
  then set `EXPO_PUBLIC_PRIVACY_POLICY_URL` and `EXPO_PUBLIC_TERMS_URL`.
