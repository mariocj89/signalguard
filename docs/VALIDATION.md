# Validation record

Validated from Windows / Ubuntu 20.04 WSL on 5 October 2026, using Node 22.20, Expo SDK 57 and the official Linux Swift 6.0.3 toolchain.

## Passing checks

- Strict TypeScript typecheck: no errors.
- Expo ESLint: no errors or warnings.
- Jest: 28 passing tests, including real UI/provider tests with a mocked native boundary, scheduling, settings, localization and CNG/EAS packaging checks.
- Swift XCTest: 18 passing tests in Debug; the earlier 17-test suite also passed in Release. These compile the actual incident state machine, lifecycle, JSON persistence, guard clock and HTTPS probe implementation; URLProtocol fixtures exercise primary/fallback behavior, captive portal responses, request privacy and response-size limits.
- Swift parser checks: Apple-framework source files parse successfully, including Debug-only declarations. Parsing is not Apple SDK typechecking.
- Playwright: two passing browser inspection tests covering fail-closed readiness, navigation/privacy/history and Spanish content.
- Expo Doctor: 21/21 checks passing; Expo dependency-version validation passes.
- iOS Metro/Hermes production bundle export succeeds. Browser inspection export also succeeds; there is no web deployment.
- iOS CNG prebuild succeeds without CocoaPods. Generated configuration verifies bundle identifier `com.etcaterva.signalguard`, iPhone device family only, iOS deployment target 26.0, processing background mode, permitted continued-task identifier pattern, English/Spanish localization and the Time Sensitive entitlement. No Critical Alerts entitlement is present.
- Expo autolinking resolves the local module and startup AppDelegate subscriber; generated provider includes both. EAS packaging regression verifies native Swift, podspec and localization resources remain included while generated root iOS files are excluded.
- Git whitespace check passes.

## Dependency audit findings

`npm audit` still reports 54 upstream findings: 51 high and three moderate, with no critical findings. Direct affected packages reported by the audit are `braces` (nested-pattern denial of service), `node-forge` (RSA PKCS signature verification) and `decode-uri-component` (malformed URI denial of service); affected parents inflate the count. These span Expo/Metro, signing/testing dependencies and routing. This is not a clean security audit.

The vulnerable installed versions of braces and node-forge are also the latest registry releases checked during implementation. Suggested broad fixes replace the stable Expo/RN stack with incompatible majors or a beta SDK, so they were not applied. A narrow xcode dependency override upgrades uuid to 11.1.1 and removes its separate advisory; prebuild remains validated. The lockfile records the resolved dependency set. Recheck upstream patches before distribution.

## Requires EAS and a physical iPhone

The initial record above described WSL checks. On 5 October 2026, at the user’s explicit TestFlight request, production **1.0.0 (3)** successfully compiled the Apple-framework Swift module, archived and signed on EAS (build `420f2806-ed0c-4113-b5d7-11403fb89cab`). EAS Submit job `7baa5463-6a49-41ef-b85f-35a9447e9222` completed the App Store Connect upload. The EAS project is linked to the existing account; no remote repository was created. Apple processing is also confirmed: the new upload is `VALID` with internal beta state `IN_BETA_TESTING`. Real-device behavior remains unvalidated until the acceptance checklist is run.

The updated power-button design and coloured activity markers also compiled, archived and signed successfully as **1.0.0 (4)** on EAS (build `2793dc13-6859-44b8-ae7b-f53a65adc732`). Submission `783fffd9-9199-4b21-a5bd-b8c02892da50` completed at 2026-10-05T12:40:03Z. Apple build `74063d92-928c-473a-afe8-51d729d2ee7d` is VALID and IN_BETA_TESTING. The subsequent minimal Settings and single-colour-marker changes pass all local checks but are not included in build 4.

A real iPhone must validate immediate task submission/launch, system Live Activity presentation, background execution duration, cellular and dual-SIM registration observations, notification permissions/Time Sensitive delivery, sound, acknowledgement, reminder cancellation, task expiry, force-close watchdog delivery and scheduled completion. Follow [the acceptance checklist](REAL_DEVICE_TESTS.md) before relying on or distributing the app.

Apple can terminate monitoring. A scheduled watchdog mitigates lost execution but cannot guarantee delivery: iOS notification settings, Focus, device power and operating-system behavior still apply. A queued near-term reminder cannot condition its delivery on later network recovery when the process is no longer executing.


## Production build 5

On 5 October 2026, production **1.0.0 (5)** successfully compiled, archived and signed on EAS, including minimal Settings and single activity markers (build `d8c81262-aef6-452e-9793-75b777111d4b`). Typecheck, lint, 27 Jest tests, 18 Swift tests and two English/Spanish browser checks were rerun successfully. Submission `42ab5da9-c5d6-45e2-a84f-5b465f773362` is linked to this finished build but remains IN_QUEUE without logs or errors after extended monitoring. Apple upload, processing and TestFlight availability of build 5 remain unconfirmed. Real-device acceptance checks remain required.


Build 5 status follow-up: submission completed at 2026-10-05T16:55:27Z; Apple build 233e24d3-737e-47de-bc74-19e203d464cb is VALID and IN_BETA_TESTING. The subsequent phone-icon SVG/PNG change passes typecheck, lint and 27 Jest tests but has not been published. Android has a feasibility assessment only; no Android implementation or build is validated.


One-tap-stop change: all local checks pass (28 Jest, 18 Swift, two browser tests, typecheck/lint, iOS export, Expo Doctor 21/21). Pending/success/failure stop behaviour is covered. These UI changes are not yet in TestFlight build 5.


Build 6 settings alignment: fixed trailing switch column and localized Monitor header pass typecheck/lint, 28 Jest tests, 18 Swift tests, two browser tests (including measured switch alignment), iOS export and Expo Doctor 21/21. EAS build 31135c77-edbc-498e-a0c5-7c6ebe98eb45 is pending, with auto-submit 1f176e8d-a469-4ea9-b097-7e13341b55fc scheduled. This archive also includes the phone icon and direct-stop notice; native compilation and Apple processing for build 6 are not yet confirmed.


## 8 October 2026: notification information and interruption diagnosis

Local checks after the changes and SDK 57 patch alignment: TypeScript and ESLint pass; 30 Jest tests, 19 Swift XCTest tests and two English/Spanish Playwright tests pass. Swift parser checks, iOS Metro/Hermes export, Expo Doctor 21/21 and git whitespace validation pass. Regression tests cover actual/unknown sound status, system-managed vibration and unavailable Critical Alerts, backward-compatible session decoding and persisted interruption reasons.

The package installation reports 58 upstream audit findings (50 high, eight moderate); this is not a clean dependency security audit. No broad incompatible-major audit fix was applied.

No EAS build or TestFlight submission was started, as explicitly requested by the user. The changed Apple-framework source has only been parsed, not compiled against an Apple SDK. Four-hour background interruption is unresolved: new diagnostics identify an observable expiration, missed heartbeat or process loss, but neither prove the original cause nor guarantee sustained execution. Real-device validation remains required.


Notification UX follow-up, 8 October 2026: removed notification information UI and unused status API. All local checks pass: typecheck/lint, 31 Jest tests, 19 Swift tests, two English/Spanish browser checks, iOS bundle export, Swift parser checks, Expo Doctor 21/21 and whitespace validation. Existing permission/Time Sensitive preflight is retained. Verified the approved Expo Go tunnel’s current manifest and bundle respond HTTP 200. No cloud build or store upload was started.


Home selection and History follow-up, 8 October 2026: TypeScript/lint pass; 36 Jest tests, 19 Swift tests/parser checks and two English/Spanish browser tests pass; iOS export, Expo Doctor 21/21 and git whitespace pass. Tests cover disabling either unavailable condition on Home, blocking power during selection changes, refusing both-off selection, hiding selectors during guards, newest-first History, brief/alert/acknowledgement presentation, interruption reasons and history read failures. Existing Expo manifest/current bundle respond HTTP 200. No native compilation or store upload was performed; cellular false-negative report remains unverified on device.


Expo Go preview fix, 8 October 2026: 38 Jest, 19 Swift and two browser tests pass, along with typecheck/lint, parser checks, iOS export and Expo Doctor 21/21. Browser tests exercise toggles, both-off protection, disabled Start and sample History in both languages. Preview data are memory-only and absent from native clients; production Hermes artifact excludes sample fixture IDs. Public approved preview manifest/bundle HTTP 200. No EAS/TestFlight build or upload.


Foreground resume follow-up, 8 October 2026: TypeScript/lint, 40 Jest tests, 20 Swift tests/parser checks, two browser checks, iOS export, Expo Doctor 21/21 and whitespace validation pass. Regressions verify original end/settings and stale/expired resume rejection, linked History grouping with no gap-duration field, and no active claim while native resume is pending. Expo Go serves updated sample resume History (HTTP 200); production artifact excludes fixtures. Changed Apple-framework code has only been parsed locally; actual notification launch/task submission/resume needs an explicitly authorized native build and a physical iPhone. No build or upload was started.
