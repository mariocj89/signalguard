# SignalGuard handoff

## Current state — 5 October 2026

The MVP is implemented locally. The user explicitly requested a TestFlight build for end-to-end testing and authorized repairing only SignalGuard’s signing setup without revoking/deleting other apps’ assets.

EAS account: `etcaterva`; project: `4cc4b82b-a106-40ab-a46f-2c87cb45a2a3`; bundle: `com.etcaterva.signalguard`; existing App Store Connect app: `6736607323` (portal display name “Signal Guard”). Production auto-increment and EAS submit settings follow the existing Bosquedoku/Cytowars workflow. No public App Store release is requested.

## Signing repair and cloud build

All certificates listed in EAS were expired, including the shared certificate for the other apps. The cached Apple ID session had expired. Using the existing App Store Connect API key in memory, a new distribution certificate was generated and assigned only to SignalGuard, and its provisioning profile was regenerated. No other certificates/profiles were revoked or deleted, and no secret was written into this project.

Cloud build `b9a51f17-0b38-47ce-bcaf-b93d6a34d38d` (1.0.0 build 1) reached Xcode but failed because the provisioning profile lacks the Time Sensitive Notifications capability/entitlement. This earlier build did not produce an installable app.

EAS capability synchronization with the stored API key failed. A correctly structured public Apple capability request confirmed that `USERNOTIFICATIONS_TIMESENSITIVE` is not supported by the public provisioning API. The user confirmed that **Time Sensitive Notifications** has now been enabled and saved at:
https://developer.apple.com/account/resources/identifiers/bundleId/edit/749T5F96X8

A new SignalGuard-only provisioning profile was generated and verified to contain `com.apple.developer.usernotifications.time-sensitive = true`. Build 2 reached Swift compilation and exposed a parameter shadowing error: `cellular` in `start` referred to a Bool rather than the native service. The reference is corrected to `self.cellular`.

**Build 1.0.0 (3) succeeded**, including Apple-framework Swift compilation, archive and signing:
https://expo.dev/accounts/etcaterva/projects/signalguard/builds/420f2806-ed0c-4113-b5d7-11403fb89cab

**EAS submission completed successfully** at 2026-10-05 09:28:44 UTC:
https://expo.dev/accounts/etcaterva/projects/signalguard/submissions/7baa5463-6a49-41ef-b85f-35a9447e9222

Apple processing is complete: build `543de967-88ef-47ff-bee8-fc9833d54da4`, uploaded 5 October 2026, has processing state **VALID** and internal beta state **IN_BETA_TESTING** for version **1.0.0 (3)**. It is available for internal TestFlight testing. External beta review was not submitted. The existing internal group **Devs** includes the user's account email and has access to all builds; no additional testers or groups were created. Old 2024 builds (including another build numbered 3 for version 1.0.1) are expired and must not be mistaken for this 2026 upload. No public App Store release is requested.

## Checks and device testing

Prior implementation checks are recorded in `docs/VALIDATION.md`. The latest source checks passed: strict TypeScript, lint, 23 Jest tests. These checks also pass after the production auto-increment and EAS submission configuration edits.

Physical-device acceptance remains required; follow `docs/REAL_DEVICE_TESTS.md`. A TestFlight Release build uses production timings and excludes development diagnostics. Do not claim eight-hour execution or guaranteed call receipt.

## UI polish — local changes after TestFlight build 3

The user requested a small style improvement with green checks, a simple layout and less text. Confirmed status marks now use filled green circular badges with contrasting checkmarks; checking, unavailable and unknown states retain amber/red/neutral treatments and never gain green readiness. The status card uses subtle dividers, end-time controls are grouped in a separate compact card, quick durations form one segmented row, and last-confirmed information is a single line. Type hierarchy and light/dark backgrounds are refined.

Home no longer repeats the guard-end heading, scheduling help or the safety footer. Safety limitations remain in Settings and documentation. Shorter English/Spanish copy covers language, local history, advanced options, interruption and acknowledgement. Native monitoring and preflight behavior are unchanged.

Validated: strict TypeScript, lint, 23 Jest tests, 17 Swift tests, two English/Spanish browser smoke tests, iOS production bundle export and Expo Doctor 21/21. Device appearance still needs review on an iPhone.

These changes are local only. No new EAS build or submission was dispatched for the style request; TestFlight still contains 1.0.0 build 3. A future explicitly requested build will include this polish.

## App icon polish — local changes after build 3

Updated the code-native SVG and regenerated `assets/icon.png`: a solid white shield with a bold green check on navy, matching the UI’s confirmed-state green. The icon has an opaque full-square background so iOS applies its own mask. Visually reviewed the rendered asset and verified PNG dimensions 1024×1024, 8-bit RGB, no alpha channel. TypeScript, lint, 23 Jest tests and Expo Doctor 21/21 pass.

This icon and the UI polish remain local; TestFlight build 3 has the previous icon. No new build/submission was requested or launched for this icon edit.

## Power-button home and compact activity — local, after build 3

At the user’s request, Home now centres on a large, accessible power control with actual native ON/OFF state. Only confirmed native monitoring can show ON; pending starts show a spinner, and turning off an active guard still requires confirmation. Healthy active monitoring is green; a candidate outage turns the control amber and an incident turns it red while remaining ON. Interruption explicitly shows OFF and a restart message.

The normal start requires no time selection: it starts a finite guard with a visible **24-hour limit**, preserving the native hard maximum and all expiry/watchdog behavior. This is not indefinite operation. Optional “Choose end time” expands the original time picker and 1/4/8/12-hour controls, defaulting to eight hours when enabled. Collapsing it restores the 24-hour normal mode.

Home shows only a narrower Internet/Cellular card (maximum width 310, 52-point rows), with globe/call icons. Notification readiness still blocks starting and shows contextual permission/settings actions when needed. It is no longer a redundant healthy status row. Expo Go/browser show unavailable native observations as unknown, not a claimed physical outage. Tabs use standard outline icons. SDK-compatible vector icons, font and asset dependencies/plugins were added.

The native system activity title is simply SignalGuard; its subtitle contains only localized Internet and Cellular/Red móvil states, without notification/guard rows or end time. Text-only API limits are respected: Unicode status markers provide green/amber/red/neutral colour plus check/ellipsis/cross/question mark. Real duration progress remains unchanged. No extra ActivityKit activity was created. Actual Lock Screen/Dynamic Island layout and markers require the next iPhone build.

Validated: typecheck, lint, **27 Jest tests**, **18 Swift tests**, two English/Spanish browser tests, iOS bundle export, Expo Doctor 21/21 and iOS CNG prebuild. The added tests exercise normal 24-hour start, optional shorter duration, stop confirmation and conservative unknown presentation; Swift tests cover activity markers. Browser layout was reviewed at 390×844 with no horizontal overflow. The existing public Expo Go manifest/bundle was verified to serve the updated power-button interface successfully.

These changes remain local and available via the running Expo Go preview. TestFlight still has version 1.0.0 build 3. No new cloud build or submission was launched for this design request.
