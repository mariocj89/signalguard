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
