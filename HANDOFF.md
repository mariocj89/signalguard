# SignalGuard handoff

## Current state — 5 October 2026

The MVP is implemented locally. The user explicitly requested a TestFlight build for end-to-end testing and authorized repairing only SignalGuard’s signing setup without revoking/deleting other apps’ assets.

EAS account: `etcaterva`; project: `4cc4b82b-a106-40ab-a46f-2c87cb45a2a3`; bundle: `com.etcaterva.signalguard`; existing App Store Connect app: `6736607323` (portal display name “Signal Guard”). Production auto-increment and EAS submit settings follow the existing Bosquedoku/Cytowars workflow. No public App Store release is requested.

## Signing repair and cloud build

All certificates listed in EAS were expired, including the shared certificate for the other apps. The cached Apple ID session had expired. Using the existing App Store Connect API key in memory, a new distribution certificate was generated and assigned only to SignalGuard, and its provisioning profile was regenerated. No other certificates/profiles were revoked or deleted, and no secret was written into this project.

Cloud build `b9a51f17-0b38-47ce-bcaf-b93d6a34d38d` (1.0.0 build 1) reached Xcode but failed because the provisioning profile lacks the Time Sensitive Notifications capability/entitlement. No successful build or TestFlight submission exists yet.

EAS capability synchronization with the stored API key failed. A correctly structured public Apple capability request confirmed that `USERNOTIFICATIONS_TIMESENSITIVE` is not supported by the public provisioning API. The user has been asked to enable **Time Sensitive Notifications** and save at:
https://developer.apple.com/account/resources/identifiers/bundleId/edit/749T5F96X8

Do not remove the entitlement or claim that the guard can safely run without this prerequisite. Once the user confirms the portal change, regenerate only SignalGuard’s provisioning profile, verify the entitlement in it, and run the production build with auto-submit. Investigate/fix any native compilation errors before reporting success.

## Checks and device testing

Prior implementation checks are recorded in `docs/VALIDATION.md`. The latest source checks passed: strict TypeScript, lint, 23 Jest tests. These checks also pass after the production auto-increment and EAS submission configuration edits.

Physical-device acceptance remains required; follow `docs/REAL_DEVICE_TESTS.md`. A TestFlight Release build uses production timings and excludes development diagnostics. Do not claim eight-hour execution or guaranteed call receipt.
