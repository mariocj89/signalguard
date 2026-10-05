# SignalGuard handoff

## Current state — 5 October 2026

The MVP is implemented locally. UI preview is running through a temporary Cloudflare tunnel on Metro port 8084; Expo Go can inspect the interface but cannot run the custom Swift guard. This preview has not been published as a website.

The user has requested a TestFlight build for end-to-end testing. EAS authentication is available under `etcaterva`. The app is linked to EAS project `4cc4b82b-a106-40ab-a46f-2c87cb45a2a3`, preserving bundle ID `com.etcaterva.signalguard`.

## Build attempt

The production iOS build failed before upload/compilation during credentials setup: the provisioning profile was expired, and Apple no longer has the distribution certificate it referenced. No build was queued and nothing was submitted to TestFlight.

Automatic approval review rejected the interactive credentials manager because it can mutate other signing assets. Approval has been requested to select/create a distribution certificate and regenerate only SignalGuard’s provisioning profile, without revoking or deleting other apps’ assets.

## Checks and next steps

Implementation checks are recorded in `docs/VALIDATION.md`. Latest project-linking changes only add EAS metadata and documentation; rerun TypeScript, lint and configuration checks before the eventual cloud build.

Once approved, repair the app’s credentials, run the production EAS build, fix any Apple-framework compilation errors, and submit the successful build to App Store Connect for TestFlight. Real-device acceptance remains required; follow `docs/REAL_DEVICE_TESTS.md`. No App Store public release is requested.
