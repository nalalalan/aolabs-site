# Idle Shroom App Store Prep

Current status: source is mobile-ready, but no App Store binary has been produced from this Windows machine.

## Required before App Store submission

- Apple Developer Program account.
- macOS with Xcode for the iOS build, signing, screenshots, and upload.
- Final privacy answers in App Store Connect.
- Final ad disclosure if ads are enabled.
- Native ad integration through a mobile ad SDK, not web-only AdSense.
- Real app icon PNG exports for App Store sizes.
- Real device test pass on iPhone and iPad.

## Native ad path

The web build has gated ad slots in `ads-config.js`. The cozy boost is designed as a rewarded-ad placement: a completed rewarded ad unlocks a 10+ minute spores/sec boost. For iOS, use the `admob` ids in that config as the source of truth, then add the native AdMob plugin during the Capacitor build. Keep ads appropriate for the app rating, clearly dismissible when interruptive, and never require or encourage ad clicks.

The global leaderboard is configured in `online-config.js` and backed by the Railway `idle-shroom-api` service. It is suitable for casual competition; a fully cheat-resistant mode would require server-authoritative scoring.

## Build outline on macOS

```bash
npm install
npx cap add ios
npx cap sync ios
npx cap open ios
```

Then configure signing in Xcode, test on device, archive, and upload from Xcode Organizer.
