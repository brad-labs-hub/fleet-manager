# Fleet Manager — iOS (Capacitor)

The iOS app is a **native shell** (Capacitor) that loads your deployed Next.js site in a WKWebView. The web app stays on Vercel; you ship updates to production without App Store review for most changes.

## Prerequisites

- macOS with **Xcode** (current stable)
- **Apple Developer** account (you already have this)
- Production deployment on Vercel with `NEXT_PUBLIC_APP_URL` set to your public URL
- Supabase **Site URL** and **Redirect URLs** include that same URL

## Bundle ID

Default: `com.bradlawson.fleetmanager`

Change in Xcode (**App** target → **Signing & Capabilities**) if you use a different identifier, and register it in [Apple Developer → Identifiers](https://developer.apple.com/account/resources/identifiers/list).

## Quick start

```bash
cd /Users/bradlawson/fleetmanager
npm install
npm run cap:sync    # copy www + config into ios/
npm run cap:open    # open Xcode
```

In Xcode:

1. Select the **App** target → **Signing & Capabilities** → choose your **Team**
2. Confirm **Bundle Identifier** matches your App Store Connect app
3. Connect an iPhone or pick a simulator → **Run** (⌘R)

The app loads **`https://crownfleet.vercel.app`** by default (see `capacitor.config.ts`).

## Point at a different server

Production (recommended for TestFlight / App Store):

```bash
CAPACITOR_SERVER_URL=https://your-domain.com npm run cap:sync
```

Local Next.js on a physical device (same Wi‑Fi):

```bash
# Terminal 1
npm run dev

# Terminal 2 — use your Mac's LAN IP, not localhost
CAPACITOR_SERVER_URL=http://192.168.1.42:3000 npm run cap:sync
npm run cap:open
```

Also add `http://192.168.1.42:3000/**` to Supabase Auth redirect URLs for that test session.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run cap:sync` | Sync web assets and Capacitor config into `ios/` |
| `npm run cap:open` | Open `ios/App/App.xcworkspace` in Xcode |
| `npm run cap:run` | Sync + open |

After changing `capacitor.config.ts` or `www/`, run `cap:sync` before building in Xcode.

## TestFlight / App Store archive

1. In Xcode: **Product → Destination → Any iOS Device (arm64)**
2. **Product → Archive**
3. **Distribute App** → **App Store Connect** → upload
4. In App Store Connect: add build to TestFlight, then submit for review

Bump version in Xcode: **App** target → **General** → **Version** / **Build**, or edit `MARKETING_VERSION` / `CURRENT_PROJECT_VERSION` in `ios/App/App.xcodeproj/project.pbxproj`.

## App Review notes

- Provide **driver** and **controller** demo accounts in App Review Information
- Document **MFA (TOTP)** setup steps — the app requires MFA after login
- Primary mobile experience is **`/driver/*`** routes

## Privacy & permissions

`Info.plist` includes camera and photo library strings for receipt uploads via the file picker. Export compliance is set to **no non-exempt encryption** (HTTPS only).

## Custom app icon

Xcode → **App** → **Assets.xcassets** → **AppIcon**. Add a 1024×1024 source image; Xcode generates required sizes.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Blank white screen | Confirm Vercel URL loads in Safari on the device; run `cap:sync` after changing `CAPACITOR_SERVER_URL` |
| Login redirect fails | Supabase Site URL + redirect URLs must match `NEXT_PUBLIC_APP_URL` / Capacitor server URL |
| MFA loop | Complete TOTP setup in Safari first, then retry in the app |
| File upload fails on iOS | Use photo picker; ensure Info.plist permission strings are present (already configured) |

## What is not in the native project

Admin-heavy flows still work in the WebView but are optimized for desktop. Future native enhancements (push notifications, Face ID lock, offline cache) can be added via Capacitor plugins without rewriting the whole app.
