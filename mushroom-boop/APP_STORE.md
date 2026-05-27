# Idle Shroom App Store Prep

Current status: the web app is installable on phones as a PWA from `https://aolabs.io/mushroom-boop/`, and the standalone domain is prepared at `idleshroom.aolabs.io`. Android packaging has been generated through Capacitor in `android/`; a release `.aab` is blocked on local JDK/Android SDK/signing. No iOS App Store binary has been produced from this Windows machine.

## Phone install path now

- iPhone/iPad: open the HTTPS game route in Safari, use Share, then Add to Home Screen.
- Android: open the HTTPS game route in Chrome, use Install app or Add to Home screen.
- Use `https://aolabs.io/mushroom-boop/` until GitHub finishes the HTTPS certificate for `idleshroom.aolabs.io`.

## Required before App Store submission

- Apple Developer Program account.
- macOS with Xcode for the iOS build, signing, screenshots, and upload.
- Final privacy answers in App Store Connect.
- Final ad disclosure if ads are enabled.
- Native ad integration through a mobile ad SDK, not web-only AdSense.
- Real app icon PNG exports for App Store sizes.
- Real device test pass on iPhone and iPad.

## Native ad path

The web build has gated ad slots in `ads-config.js`. Nutrient Frenzy is designed as a rewarded-ad placement: a completed rewarded ad unlocks a 10+ minute nutrients/sec boost. Core play now includes rare spawns that drop nutrients, Relic Caps, Mutation Goo, or Ancient Spores without requiring ads. Android still has the legacy-named native `MushroomBoopRewardedAdPlugin` bridge for AdMob rewarded ads so existing wrapper code remains stable once a real rewarded unit id is configured. For iOS, use the `admob` ids in that config as the source of truth, then add the native AdMob plugin during the Capacitor build. Keep ads appropriate for the app rating, clearly dismissible when interruptive, and never require or encourage ad clicks.

The global leaderboard is configured in `online-config.js` and backed by the Railway `idle-shroom-api` service. It is suitable for casual competition; a fully cheat-resistant mode would require server-authoritative scoring.

## Build outline on macOS

```bash
npm install
npx cap add ios
npx cap sync ios
npx cap open ios
```

Then configure signing in Xcode, test on device, archive, and upload from Xcode Organizer.
