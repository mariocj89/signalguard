# Reproducible WSL checks

## Dependencies

```bash
cd ~/dev/signalguard
npm ci
```

Node 22.20+ is required. Expo SDK 57 chooses React 19.2.3 / React Native 0.86.3. Native packages use `expo install` version resolution. Test renderer is pinned to 1.2.0 for React 19.2 compatibility. Playwright is pinned to 1.55.1 because the currently installed Ubuntu 20.04 WSL distribution is unsupported by newer Playwright browser distributions.

## Linux Swift toolchain

The native iOS build remains exclusively EAS. Linux Swift is only for portable engine, persistence and HTTPS probe tests. If `swift` is on PATH it will be used. This project also recognizes the following local, ignored toolchain:

```bash
mkdir -p .tools
curl -fL -o .tools/swift.tar.gz \
  https://download.swift.org/swift-6.0.3-release/ubuntu2004/swift-6.0.3-RELEASE/swift-6.0.3-RELEASE-ubuntu20.04.tar.gz
tar -xzf .tools/swift.tar.gz -C .tools
npm run test:native
```

Other Linux distributions should install the corresponding official [Swift toolchain](https://www.swift.org/install/linux/). Set `SWIFT_BIN=/absolute/path/to/swift` to override discovery. Missing Swift causes an explicit check failure, not a silently skipped test suite.

## Commands

```bash
npm run check        # strict TypeScript, Expo lint, Jest, real Swift XCTest
npm run export:ios   # Metro/Hermes iOS production bundle (not native compilation)
npm run export:web   # optional browser inspection bundle
npm run doctor      # Expo configuration/dependency checks
npx expo install --check
npx expo prebuild --platform ios --no-install
npx expo-modules-autolinking resolve --platform apple
npx playwright install chromium
npm run test:web     # essential inspection/navigation in English/Spanish
npm audit
```

Prebuild is safe on WSL for configuration generation with `--no-install`. Do not run CocoaPods or `expo run:ios` here. Generated `ios/` and `android/` are ignored; the CNG plugin is the source of truth. EAS must receive the module directory and plugin, and generate its own native project.

Jest controls the native boundary; its UI tests verify automatic preflight, blocked Time Sensitive readiness, no early Active state and acknowledgement remaining visibly unhealthy. XCTest runs the same Swift incident/lifecycle/persistence/HTTPS probe sources compiled into the iOS module, without duplicated JavaScript monitoring logic. Browser tests never emulate a guard or assert real iOS behavior.

## Simulations

Only Debug builds expose the native simulation/timing methods (`#if DEBUG`). Only `__DEV__` UI exposes diagnostics. No test timing flag is persisted. Release diagnostics routes redirect home; production timing stays 60-second grace, five-minute reminders, 15-second heartbeat/30-second probe and 90-second watchdog.

Start a real native guard before injecting failures. Simulated recovery confirms both dimensions for testing; restore real readings to return to actual observations. “Interrupt native monitoring” intentionally stops refreshing the existing watchdog, exercising the dead-man behavior instead of merely showing a fake alert. “Complete guard” runs the real cleanup and completion-notification path.

## Dependency audit

Use SDK-compatible packages rather than force-changing Expo/RN majors to satisfy a toolchain advisory. The validation record identifies current upstream npm audit findings. Treat developer tools and project inputs as trusted; do not expose Metro publicly. Re-run audit and Expo checks when upstream patches become available.

The browser smoke server explicitly enables local inspection. SDK 57 web setup checks static app.json (iOS-only) instead of the evaluated dynamic config, so the inspection server bypasses that setup gate after dependencies are installed. Runtime assertions remain enabled; production EAS config still resolves to iOS only.
