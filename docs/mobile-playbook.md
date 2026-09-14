# Mobile app playbook — AltixCode

Canonical notes for taking an Expo app to the App Store and Play Store. Kept as
its own file rather than inside `AGENTS.md` because several agents edit that file
concurrently and a section was already lost to a rewrite once.

A version-controlled copy lives in `gridlock-pop/docs/mobile-playbook.md`.

Verified end to end on **gridlock-pop**, 2026-09-14 (Expo SDK 57 / RN 0.86,
macOS 27.0, Xcode 27.0).

---

## Tooling — all installed and authenticated

| Tool | Use it for |
| --- | --- |
| `asccli` (`asc`) | App Store Connect: IAP, versions, builds, TestFlight, bundle ids, certs, screenshots |
| `gplay` | Play Console: edits, tracks, releases, listings, IAP, data safety, testers |
| `rc` / `revenuecat` | RevenueCat: projects, apps, entitlements, offerings, packages, products |
| `eas` (via `npx eas-cli@latest`) | builds and submissions |
| `gh` | repo, secrets, workflows |
| `gcloud` | Play service account (**cannot enable APIs** — lacks `serviceusage.services.enable`) |

Signing material is in `~/Certificates` (ASC API key `.p8` + key/issuer id files,
`play-store-service-account.json`). Credentials come from `~/.zshrc`:

```bash
eval "$(grep -E '^export (EXPO_TOKEN|APP_STORE_CONNECT_[A-Z0-9_]+)=' ~/.zshrc)"
```

Reference implementation: **`AltixCode/gridlock-pop`**. Its `scripts/`,
`plugins/` and `docs/` are meant to be copied.

---

## The three things no API can do

Everything else is scriptable. Plan around these:

1. **Creating an App Store Connect app record.** `asc apps` has `list` and
   `update`, never `create`.
2. **Creating a Play Console app.** The Publishing API only operates on apps that
   already exist.
3. **Creating AdMob apps, ad units and consent messages.** No public write API at
   all.

Browser sessions for all four consoles persist in the Playwright MCP profile at
`~/Library/Caches/ms-playwright-mcp/`, so console work can be driven there once a
human has logged in.

---

## Order of operations

Several steps are blocked by earlier ones in non-obvious ways.

### 1. Name and bundle id

Casual/puzzle names are heavily taken — budget several attempts. Apple checks the
**whole title string**, so `Name: Descriptor` (the convention the rest of the
portfolio uses) often clears when the bare name does not.

```bash
asccli bundle-ids create --name "<App>" --identifier com.altixcode.<app> --platform ios
```

### 2. App Store Connect record — manual

**The bundle id and SKU are permanent**; only the name can be changed later. A
bundle id that no longer matches the name is cosmetic and *not* worth recreating
the record for — recreating cascades into RevenueCat and invalidates SDK keys.

### 3. iOS in-app purchase — scriptable

```bash
asccli iap create --app-id <appId> --reference-name "Remove Ads (Lifetime)" \
  --product-id com.altixcode.<app>.removeads --type non-consumable
asccli iap-localizations create --iap-id <iapId> --locale en-US \
  --name "Remove Ads Forever" --description "<= 45 chars"
asccli iap price-points list --iap-id <iapId> --territory USA --limit 200  # find 3.99
asccli iap prices set --iap-id <iapId> --base-territory USA --price-point-id <id>
```

Display name caps at 30 chars, description at 45. Price points are **paginated
and territory-filtered** — the default 50-row page contains no USA rows at all.

### 4. Play Console — manual, with an ordering trap

A Play app has **no package name until its first bundle is uploaded**. Until then
the Publishing API answers `404 Package not found` and no in-app product can be
created.

> create app → upload an AAB to internal testing → *then* create the product

**Check the package name Play expects before building.** A Play app record can
already carry a package name, and the first upload is rejected outright if the
bundle disagrees ("Your APK or Android App Bundle needs to have the package name
X"). Neither side can be edited afterwards, so confirm it matches
`android.package` *before* spending a build. The Android package and the iOS
bundle id are allowed to differ — neither is user-visible.

Build that AAB from a **non-production profile** so it does not carry real ad
units — internal testers should not generate live impressions.

### 5. AdMob — manual

Two apps, three ad units each (banner / interstitial / rewarded). Answer **"No,
not listed on a supported app store"** for an unpublished app; linking later does
not change the ids.

Then **publish a GDPR message and a US-states message** under Privacy &
messaging. The SDK can only present a message that exists, so an app that fails
closed on missing consent shows *no ads at all* in the EEA without one.

Every new app shows **"Requires review — limited ad serving"** until it is linked
to a live listing and approved (a couple of days). Expect near-zero ad revenue in
the first days post-launch; that is not an integration bug.

### 6. RevenueCat — fully scriptable

```bash
rc projects create --name "<App>" --json --yes
rc projects use <projectId>
rc apps create --name "<App> iOS" --type app_store --bundle-id com.altixcode.<app> \
  --app-store-connect-api-key "$(cat "$APP_STORE_CONNECT_API_KEY_KEY_FILEPATH")" \
  --app-store-connect-api-key-id "$APP_STORE_CONNECT_API_KEY_KEY_ID" \
  --app-store-connect-api-key-issuer "$APP_STORE_CONNECT_API_KEY_ISSUER_ID" --json --yes
rc apps create --name "<App> Android" --type play_store --package-name com.altixcode.<app> --json --yes
rc entitlements create --lookup-key remove_ads --display-name "Remove Ads" --json --yes
rc offerings create --lookup-key default --display-name "Default" --json --yes
rc packages create <offeringId> --lookup-key '$rc_lifetime' --display-name "Lifetime" --json --yes
# once the store product exists:
rc products create --store-id com.altixcode.<app>.removeads --type one_time \
  --app-id <rcAppId> --display-name "Remove Ads Forever" --json --yes
rc packages attach <packageId> <productId> --json --yes
rc entitlements attach <entitlementId> <productId> --json --yes
```

Notes:

- Public SDK keys are **not** in `rc apps show`. Fetch them:
  `rc api GET "/projects/<proj>/apps/<app>/public_api_keys"`
- `$rc_lifetime` is what the SDK exposes as `offerings.current.lifetime` — the
  identifier client code should read.
- `rc apps update` takes **only `--name`**. Changing a bundle id means delete and
  recreate, which **invalidates the public SDK keys**. Settle the bundle id first.
- `rc apps apple setup` needs interactive Apple ID + 2FA — a human must run it.
  The App Store Connect *API key* can be set at `rc apps create` time; the
  separate **In-App Purchase key** cannot.
- A one-time product may report `type: non_renewing_subscription` with
  `is_consumable: null` until RevenueCat syncs the real type from the store.

### 7. EAS

`eas init` **cannot write into a dynamic `app.config.ts`** — take the project id
from its output and set it, plus `owner`, by hand.

`EXPO_TOKEN` must be in **both** the GitHub secret (for CI) and `~/.zshrc` (for
local `eas`) — repo secrets are write-only and cannot be read back.

With `appVersionSource: remote`, delete `versionCode`/`buildNumber` from the app
config; EAS owns them and the config values are ignored.

### 8. Gate the release

Ten `EXPO_PUBLIC_*` identifiers (2 AdMob app ids, 6 ad units, 2 RevenueCat keys)
go into EAS production env vars **and** repo secrets. Copy
`gridlock-pop/scripts/check-release-config.ts`.

**A missing identifier does not fail anything** — it silently falls back to
Google's *test* ad units, and the app earns nothing while looking perfectly
healthy. The check rejects absent, blank, **and still-a-test-unit** values.

---

## Build traps on this machine

- **`JAVA_HOME` points at a path that does not exist**
  (`/Applications/Android Studio.app/...`; the real one is on
  `/Volumes/ExtremePro/Applications`). Gradle silently falls back to JDK 25 and
  CMake dies with *"a restricted method in java.lang.System has been called"*.
  Export for every Android build:
  `JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home`
- **iOS 26+ requires UIScene adoption**, which the Expo SDK 57 template does not
  do. The app installs, launches and dies with *"UIScene life cycle is required
  for apps built with this SDK."* Copy `gridlock-pop/plugins/withUIScene.js` —
  it is generic. A bare scene manifest is **not** enough; UIKit wants a real
  `SceneDelegate` owning the window, and React Native must start from the scene
  rather than `didFinishLaunchingWithOptions`.
- **`react-native-google-mobile-ads` 16.4+ pins play-services-ads 25.3+**, which
  ships Kotlin 2.3.0 metadata that SDK 57's Kotlin 2.1.0 refuses to read. Pin the
  module to **16.3.4** (ads SDK 25.0.0). Forcing Kotlin up instead breaks
  `react-native-purchases` and `safe-area-context`, because the compiler version
  comes from the buildscript classpath while `android.kotlinVersion` only moves
  the stdlib.
- Emulator needs `adb reverse tcp:8081 tcp:8081` to reach Metro, and
  `am start -n <pkg>/.MainActivity` beats `monkey`.
- **Stop Gradle daemons when done** (`./gradlew --stop`) — two 2GB daemons plus an
  emulator will exhaust this machine.

## Testing traps

- **Worklets are invisible to Jest.** A `useAnimatedStyle` calling an ordinary JS
  helper passes every unit test, then throws *"Tried to synchronously call a
  Remote Function"* on first touch. Budget one real device run per app.
- **Simulator.app is missing from this Xcode install.** `Contents/Developer/Applications/`
  does not exist and `mdfind` finds no `Simulator.app`, though `SimulatorKit.framework`
  ships — which suggests an incomplete install rather than Apple removing it.
  Consequences: no window to click, `simctl` has no tap/swipe, and
  `simctl privacy ... tracking` is unsupported (`grant all` does **not** cover
  `kTCCServiceUserTracking`), so an **ATT prompt cannot be dismissed**. iOS is
  therefore good for build/launch/render verification only — **drive interaction
  on Android**, where `adb shell input tap/swipe` works headlessly. Reinstalling
  Xcode should restore it.
- RTL v14's `render` is **async** and so is `fireEvent`; `await` both, and await
  `cleanup` between tests or renders overlap with *"overlapping act()"* errors.
  Jest setup also needs `react-native-gesture-handler/jestSetup`, the safe-area
  mock, and an `expo-audio` stub.

## CI artifacts

Release builds are hundreds of MB and filled the whole account's Actions storage
quota once (22 GB). For any repo that uploads build outputs: upload one ABI (not
four plus the bundle), set `retention-days: 3`, and copy
`gridlock-pop/.github/workflows/artifact-retention.yml`, which prunes all but the
two newest artifacts per name. A full quota keeps rejecting uploads for **6–12
hours** after cleanup because GitHub recalculates usage on that cadence.

Repos whose default branch triggers a release build (e.g. HushTunnel iOS) need
`[skip ci]` in CI-only commits, or a one-line workflow edit costs a full macOS
build and an unwanted release tag.
