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
