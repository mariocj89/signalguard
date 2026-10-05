# Validation record

Validated from Windows / Ubuntu 20.04 WSL on 5 October 2026, using Node 22.20, Expo SDK 57 and the official Linux Swift 6.0.3 toolchain.

## Passing checks

- Strict TypeScript typecheck: no errors.
- Expo ESLint: no errors or warnings.
- Jest: 23 passing tests, including real UI/provider tests with a mocked native boundary, scheduling, settings, localization and CNG/EAS packaging checks.
- Swift XCTest: 17 passing tests in both Debug and Release. These compile the actual incident state machine, lifecycle, JSON persistence, guard clock and HTTPS probe implementation; URLProtocol fixtures exercise primary/fallback behavior, captive portal responses, request privacy and response-size limits.
- Swift parser checks: Apple-framework source files parse successfully, including Debug-only declarations. Parsing is not Apple SDK typechecking.
- Playwright: two passing browser inspection tests covering fail-closed readiness, navigation/privacy/history and Spanish content.
- Expo Doctor: 21/21 checks passing; Expo dependency-version validation passes.
- iOS Metro/Hermes production bundle export succeeds. Browser inspection export also succeeds; there is no web deployment.
- iOS CNG prebuild succeeds without CocoaPods. Generated configuration verifies bundle identifier `com.etcaterva.signalguard`, iPhone device family only, iOS deployment target 26.0, processing background mode, permitted continued-task identifier pattern, English/Spanish localization and the Time Sensitive entitlement. No Critical Alerts entitlement is present.
- Expo autolinking resolves the local module and startup AppDelegate subscriber; generated provider includes both. EAS packaging regression verifies native Swift, podspec and localization resources remain included while generated root iOS files are excluded.
- Git whitespace check passes.

## Dependency audit findings

`npm audit` still reports 55 upstream findings: 52 high and three moderate, with no critical findings. Direct affected packages reported by the audit are `braces` (nested-pattern denial of service), `node-forge` (RSA PKCS signature verification) and `decode-uri-component` (malformed URI denial of service); affected parents inflate the count. These span Expo/Metro, signing/testing dependencies and routing. This is not a clean security audit.

The vulnerable installed versions of braces and node-forge are also the latest registry releases checked during implementation. Suggested broad fixes replace the stable Expo/RN stack with incompatible majors or a beta SDK, so they were not applied. A narrow xcode dependency override upgrades uuid to 11.1.1 and removes its separate advisory; prebuild remains validated. The lockfile records the resolved dependency set. Recheck upstream patches before distribution.

## Requires EAS and a physical iPhone

No iOS native compilation, signing or cloud build was performed, and no EAS account/project or remote repository was created. Linux cannot typecheck UIKit, BackgroundTasks, CoreTelephony, Network or UserNotifications against the Apple SDK. The production JavaScript bundle and generated native configuration are validated; the native Apple-framework build still requires EAS.

A real iPhone must validate immediate task submission/launch, system Live Activity presentation, background execution duration, cellular and dual-SIM registration observations, notification permissions/Time Sensitive delivery, sound, acknowledgement, reminder cancellation, task expiry, force-close watchdog delivery and scheduled completion. Follow [the acceptance checklist](REAL_DEVICE_TESTS.md) before relying on or distributing the app.

Apple can terminate monitoring. A scheduled watchdog mitigates lost execution but cannot guarantee delivery: iOS notification settings, Focus, device power and operating-system behavior still apply. A queued near-term reminder cannot condition its delivery on later network recovery when the process is no longer executing.
