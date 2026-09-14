# Account setup — what you do, what I do

Everything here is blocked on something only a human can do: creating an app
record (no API exists), accepting an agreement, or passing Apple 2FA. After each
step I can take over — the "I continue with" line says exactly what.

Values you will need throughout:

| Thing                  | Value                                                                                                      |
| ---------------------- | ---------------------------------------------------------------------------------------------------------- |
| App name               | Gridlock Pop                                                                                               |
| Bundle ID / package    | `com.altixcode.cubex` — **deliberately does not match the name**; see note below                           |
| iOS IAP product id     | `com.altixcode.cubex.removeads`                                                                            |
| Android IAP product id | `remove_ads`                                                                                               |
| Entitlement            | `remove_ads`                                                                                               |
| Price                  | US$3.99, one-time, non-consumable                                                                          |
| RevenueCat project     | `proj62d4d4fd` (still labelled "BlockJam" in the dashboard — cosmetic; `rc` has no project-rename command) |
| RevenueCat iOS app     | `appdcf8a0f5c1`                                                                                            |
| RevenueCat Android app | `app33f836eae0`                                                                                            |

> **Why the bundle id says `cubex`.** The app was briefly called Cubex, and the
> App Store Connect record was created under that bundle id. Apple does not allow
> the bundle id or SKU of an existing app record to be changed — only the name,
> which is now Gridlock Pop. Neither the bundle id nor the SKU is ever shown to
> users, so this is cosmetic. Changing it would mean deleting the ASC record and
> recreating the RevenueCat apps, which invalidates the public SDK keys.

---

## 1. Expo — 2 minutes (do this first, it unblocks the most)

1. Go to **expo.dev** → sign in → **Account settings** → **Access tokens**.
2. **Create token**, name it `gridlock-pop-ci`, copy the value.
3. Send it to me, or run it yourself:

   ```bash
   gh secret set EXPO_TOKEN --repo AltixCode/gridlock-pop
   ```

   **Also add it to `~/.zshrc`**, so local `eas` commands work too — the GitHub
   secret is write-only and cannot be read back, so it only helps CI:

   ```bash
   echo 'export EXPO_TOKEN=<token>' >> ~/.zshrc
   ```

**I continue with:** `eas init` (creates the EAS project and writes
`EAS_PROJECT_ID`), `eas build:configure`, wiring the build/submit workflows, and
running the first preview build.

---

## 2. App Store Connect — 5 minutes

The API cannot create an app record; `asc apps` only has `list` and `update`.
This is the one Apple step that must be done in the browser.

1. **appstoreconnect.apple.com** → **Apps** → **+** → **New App**.
2. Fill in:
   - Platform: **iOS**
   - Name: **Gridlock Pop**
   - Primary language: **English (U.S.)**
   - Bundle ID: pick **com.altixcode.cubex** from the dropdown (already registered)
   - SKU: `gridlock-pop-ios`
   - User Access: Full Access
3. Click **Create**. Stop there — do not fill in any metadata.

**I continue with:** the in-app purchase (`asc iap create` + price schedule at
$3.99), all listing metadata and the age rating, App Privacy answers, and
uploading the build. Screenshots are the only asset I will ask you for.

---

## 3. Google Play Console — 10 minutes

Same shape: the Publishing API works on apps that already exist.

1. **play.google.com/console** → **Create app**.
   - App name: **Gridlock Pop**
   - Default language: **English (United States)**
   - App or game: **Game**
   - Free or paid: **Free**
   - Accept the declarations → **Create app**.
2. Open **Monetize → Products → In-app products** once and confirm the merchant
   account is active. If Play asks you to set up a payments profile, do that now —
   IAPs cannot be created until it exists.

   > **Ordering, verified 2026-09-14:** a Play app has **no package name until the
   > first bundle is uploaded**. Until then the Publishing API answers
   > `404 Package not found: com.altixcode.cubex`, and the `remove_ads` product
   > cannot be created. So the real sequence is: create the app → upload an AAB to
   > internal testing → _then_ create the IAP. I handle the last two.

3. Optional but saves a round trip: **Test and release → Testing → Internal
   testing** → create a track and add your own email as a tester.

**I continue with:** the `remove_ads` product at $3.99 via `gplay iap`, the
store listing, the Data Safety form, the content rating questionnaire, and
uploading the AAB to the internal track.

> One thing I could not do myself: the **Play Developer Reporting API** is
> disabled on GCP project `hushtunnel`, and the service account lacks permission
> to enable it. That only affects `gplay apps list`. If you want it working:
> `gcloud services enable playdeveloperreporting.googleapis.com --project=hushtunnel`
> from an account with `serviceusage.services.enable`.

---

## 4. AdMob — 15 minutes (the fiddliest, and the one with a trap)

No public API creates apps or ad units, so all of this is console work.

1. **apps.admob.com** → **Apps** → **Add app**.
   - Platform **iOS**, "Is the app listed on a supported app store?" → **Yes** if
     you finished step 2, otherwise **No** and link it later.
   - App name: **Gridlock Pop**. Repeat for **Android**.
2. For **each** of the two apps, create three ad units (**Ad units → Add ad unit**):
   - **Banner** — name it `gridlock-pop-banner`, format **Anchored adaptive**
   - **Interstitial** — `gridlock-pop-interstitial`
   - **Rewarded** — `gridlock-pop-rewarded`. When it asks for reward settings use
     amount **1**, type **continue**.
3. Collect **ten** identifiers: 2 app ids (`ca-app-pub-…~…`, note the **tilde**)
   and 8 ad unit ids (`ca-app-pub-…/…`, note the **slash**).
4. **Set the content rating**: App settings → each app → content rating **G**, so
   the ads match a 4+ / Everyone store rating.
5. **⚠️ The trap — publish a consent message.** **Privacy & messaging** → create
   and **publish** both:
   - a **GDPR** message (for the EEA and UK)
   - a **US states** message

   The app runs Google's UMP flow at launch and **fails closed**: no consent, no
   ads. The SDK can only show a message that exists in the console, so without
   this EEA users see no ads at all and you will think the integration is broken.

6. Register your own devices as **test devices** before any live build. Clicking
   your own live ads gets the account banned.

**I continue with:** putting all ten identifiers into EAS environment variables
and GitHub secrets, and verifying `npm run check:release` passes — it currently
fails by design, which is what stops a build shipping Google test ad units and
earning nothing.

---

## 5. RevenueCat — 5 minutes

The project, both apps, the `remove_ads` entitlement, the `default` offering and
the `$rc_lifetime` package **already exist** — I created them. The App Store
Connect API key is configured. Two things need you.

1. **In-App Purchase key** (this is what validates purchases, and it needs Apple
   2FA so I cannot do it):
   - **appstoreconnect.apple.com** → **Users and Access** → **Integrations** →
     **In-App Purchase** → **+** → generate a key → download the `.p8`.
   - **app.revenuecat.com** → project **Gridlock Pop** → **Apps** → **Gridlock Pop iOS**
     → paste the key, its Key ID, and your Issuer ID.
   - Or, from a terminal you are sitting at: `rc setup apple appdcf8a0f5c1`
     (it will ask for your Apple ID, password and a 2FA code).
2. **Google Play service account credentials**: RevenueCat → **Gridlock Pop Android**
   → upload the JSON from `~/Certificates/play-store-service-account.json`, and
   grant that service account **View financial data** in Play Console →
   Users and permissions.

**I continue with:** attaching both store products to the `$rc_lifetime` package
once they exist in the stores, and verifying the entitlement resolves.

---

## 6. Then hand back to me

Once 1–5 are done I can run the whole rest without you:

- `eas init`, credentials, and the first **preview** build for both platforms
- install on your devices for the QA pass in `release-checklist.md`
- production builds, gated by the release-identifier check
- store metadata, Data Safety / App Privacy answers, age ratings
- `eas submit` to TestFlight and the Play internal track

The only thing left after that is **screenshots**, which are better taken on your
real device, and the final "submit for review" click, which should be yours.
