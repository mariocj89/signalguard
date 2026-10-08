# SignalGuard

SignalGuard is a free, local iPhone application for people on call. It checks Internet access and cellular network registration independently and warns when either enabled condition stays unconfirmed. It **cannot guarantee receipt of a telephone call**: Apple exposes no public API that proves call deliverability.

- App: **SignalGuard**
- Bundle: **com.etcaterva.signalguard**
- Target: **iPhone, iOS 26+**; no Android implementation
- Expo SDK **57**, TypeScript, Expo Router and an Expo local Swift module
- English and Castilian Spanish, following the app language selected in iOS

## Safety model

A guard starts only from an explicit foreground action: the power/resume button or tapping the monitoring-interrupted notification/Resume action. Swift registers a continued-processing handler during application startup, submits a `BGContinuedProcessingTaskRequest` with **strategy `.fail`**, and waits for the actual launch handler and its first successful monitoring heartbeat/watchdog installation before reporting active. A submission success alone is insufficient. A delayed or refused start fails visibly, rather than queueing a guard.

There is one guard, maximum 24 hours. The central power button starts a 24-hour guard by default, with the limit shown explicitly. Optional “Choose end time” controls start at +8 hours and allow shorter sessions. This is not indefinite monitoring. Earlier clock times mean tomorrow. Manual stop takes one tap and shows a brief in-app “Monitoring stopped” notice after native completion. The native engine handles the scheduled end, cancels pending guard notifications and completes the task; the system ends its own Live Activity. No second ActivityKit activity is created.

**iOS can terminate a continued-processing task.** This API supports finite user-started work; it does not promise an eight-hour background execution allowance. SignalGuard reports real elapsed-duration progress and mitigates loss of execution with a **pre-scheduled local-notification watchdog**, rather than pretending monitoring can run permanently. Significant clock jumps interrupt the guard safely; ordinary midnight and daylight-saving transitions do not change absolute elapsed time. The Apple system controls notifications, Focus, sound and delivery. A powered-off phone or revoked notifications cannot be made reachable by this app.

Every native heartbeat (15 seconds) refreshes the independent watchdog to 90 seconds in the future. Replacing the same notification identifier avoids a deliberate cancellation gap. Connectivity can be unhealthy while the monitor itself remains confirmed. If execution expires, the engine fails safely; if the process is killed, the already-pending notification remains available to iOS. On a new process launch, a persisted running session is recorded as interrupted and requires an explicit restart. No background or automatic guard submissions occur.

The engine polls cellular registration and checks Internet with NWPathMonitor plus a bounded HTTPS probe, approximately every 30 seconds. Each enabled dimension has its own 60-second failure candidate. Brief failures are recorded without alarming red states. One aggregate incident crosses into alerting when a dimension passes the grace threshold. Acknowledgement cancels reminders for that incident, but does not hide the unhealthy state. Full recovery cancels reminders and resets acknowledgement so a new outage can alert. Two rolling reminder deadlines (five minutes apart) are planned, and notifications are submitted only within two heartbeat intervals of their deadline and before the guard end. Stable identifiers prevent a rolling update from overwriting a just-due request; the watchdog is separate.

Normal notification authorization, alerts, sound and enabled Time Sensitive delivery are required. Provisional authorization is insufficient. No Critical Alerts entitlement is requested or included. **Critical Alerts are intentionally outside the MVP**; a future approved entitlement can be added behind the notification-service boundary.

## Native architecture

React Native owns presentation. Swift owns the guard, timers, observations, state, persistence and notifications. No JavaScript interval, React lifecycle or live React bridge keeps monitoring alive.

```text
src/app/                         Home, History, development diagnostics
src/domain/                      End-time, settings and presentation logic
src/localization/                Complete en/es UI dictionaries + i18next
src/state/GuardProvider.tsx       Automatic preflight and typed native state events
modules/signal-guard-native/
  index.ts                       Typed Expo interface; unavailable platforms fail closed
  plugin.js                      CNG Info.plist and Time Sensitive entitlement
  expo-module.config.json        Module + AppDelegate subscriber autolinking
  ios/GuardCoordinator.swift     Continued task, lifecycle, native heartbeat/end timers
  ios/Core/                      Testable incident/lifecycle core and atomic JSON store
  ios/Core/InternetProbeService.swift Bounded, reusable ephemeral HTTPS session
  ios/CellularService.swift      Public CoreTelephony registration only
  ios/NotificationService.swift  Local watchdog, alerts, acknowledgement, reminders
  ios/Resources/{en,es}.lproj/   Native task and notification localization
  Tests/                         Linux-runnable XCTest core tests
```

The permitted identifier is `com.etcaterva.signalguard.guard.*`; the single concrete launch/submission identifier is `com.etcaterva.signalguard.guard.session`, consistent with Apple's documented wildcard prefix requirement. Registering the concrete handler at startup avoids relying on wildcard handler dispatch on early iOS 26 versions. The config plugin is repeatable; generated iOS files are not edited by hand.

Only the `processing` background mode is configured. There are no audio, location, VoIP, CallKit or unrelated execution workarounds. Cellular registration uses public `serviceCurrentRadioAccessTechnology`, retaining baseline service identifiers in memory only. On dual-SIM phones, losing any originally registered service degrades cellular health even if another remains registered. Signal strength and call deliverability are never queried.

## Privacy and probe endpoints

SignalGuard has no account, analytics or telemetry. Connectivity checks make minimal HTTPS requests solely to verify Internet access and do not include SignalGuard user or device identifiers.

There is no backend, advertising, tracking, cloud history or remote push registration. Local Codable JSON history is written atomically in Application Support, protected until first unlock, capped at 200 sessions, and excluded from device/cloud backups. It stores guard/incident times, dimensions, outcome, threshold and acknowledgement. No carrier/SIM/IP identifiers are persisted.

`InternetProbeService` abstracts the endpoint policy:

1. **https://www.google.com/generate_204** — tiny empty HTTP 204 response, widely used for connectivity checks.
2. **https://www.msftconnecttest.com/connecttest.txt** — independent Microsoft connectivity-check infrastructure; requires exact HTTP 200 body `Microsoft Connect Test`.

Fallback runs only if primary fails. One host outage alone therefore does not cause an Internet incident. Probes use GET with a generic `ConnectivityCheck` user agent, no payload, authentication, cookies, cache, credentials or identifiers. Redirects are rejected and response bodies are bounded at 128 bytes; timeouts are 5 seconds per request / 6 seconds resource duration. TLS remains system-validated. The hosts necessarily see an originating network address and ordinary HTTPS metadata. Probes are not telemetry. Both hosts being unreachable, filtered or incompatible means Internet cannot be confirmed even if another site works.

## Windows / WSL development

Keep this project at `~/dev/signalguard` in WSL's Linux filesystem. Use Node 22.20+ and npm. No Mac or local Xcode is needed for normal UI development or EAS builds.

```bash
cd ~/dev/signalguard
npm ci
npm run check
npm run export:ios
npm run doctor
```

Swift logic tests run on Linux using Swift 5.9+ (validated with Swift 6.0.3). Installation and additional checks: [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

Expo Go cannot run this custom native module. Browser inspection deliberately blocks Start, rather than simulating safety readiness. It is not an additional target platform.

## Install the EAS development build on your iPhone

You need an Expo account and Apple Developer Program membership for a signed physical-device internal build. EAS handles the Mac/Xcode compilation and signing. The project is linked to the existing Expo account `etcaterva` (EAS project ID `4cc4b82b-a106-40ab-a46f-2c87cb45a2a3`). No remote repository was created. The signing setup was repaired without revoking other apps’ assets, and Time Sensitive Notifications is enabled in Apple’s portal. Version **1.0.0 (3)** compiled and signed successfully on EAS and was submitted to App Store Connect on 5 October 2026. Apple has processed the build (`VALID`, `IN_BETA_TESTING`); the existing internal TestFlight group **Devs** has access. See `HANDOFF.md` for build/submission links and the latest availability check.

```bash
cd ~/dev/signalguard
npx eas-cli@latest login
npx eas-cli@latest device:create
npx eas-cli@latest build --platform ios --profile development
```

The first build may prompt to link/create the EAS build project, select your Apple team and manage development provisioning. Register this iPhone via the device-registration link. Follow the resulting build link to install its signed development client. Device registration and Apple credentials belong to you; never put secrets in this repository.

Start Metro for the installed client:

```bash
cd ~/dev/signalguard
npm start -- --lan
# If Windows/WSL LAN routing or a firewall prevents reaching Metro:
npm start -- --tunnel
```

Open the development client and connect to the displayed Metro URL. Tunnel transport is for development only. Native changes require a new EAS build; TypeScript/UI changes normally reload through Metro.

`eas.json` includes:
- `development`: physical-device, internal, development client / Debug;
- `preview`: internal Release for production-behavior acceptance;
- `production`: signed App Store Release build.

```bash
npx eas-cli@latest build --platform ios --profile preview
npx eas-cli@latest build --platform ios --profile production --auto-submit
```

TestFlight submission is configured for the existing App Store Connect app `6736607323`, matching `com.etcaterva.signalguard`; production build numbers increment automatically. No public App Store release, EAS Update, hosting, CI, analytics or Android configuration is added. EAS generates iOS via CNG, including the local module/resources/subscriber. Images use the current EAS `latest` Xcode toolchain with support for iOS 26 APIs. The iOS deployment target stays 26.0.

## Validation and remaining device work

Run [docs/REAL_DEVICE_TESTS.md](docs/REAL_DEVICE_TESTS.md) on a real phone, including force-close without reopening, Wi-Fi/cellular independence, Time Sensitive preflight, acknowledgement/recovery, midnight and dual-SIM tests.

[docs/VALIDATION.md](docs/VALIDATION.md) records checks performed and their limits. Linux can compile/test the actual pure Swift core and parse Swift sources; it cannot compile Apple frameworks, verify signing entitlements or prove system task/notification delivery. The EAS native build has passed; the real-device checklist remains required before release.

If execution is killed just after a reminder is submitted, that near-term request can still arrive before the watchdog. iOS cannot condition a local notification on live connectivity without running the app. Reminder copy says connectivity could not be confirmed, rather than asserting a still-current physical outage. No distant reminders are left scheduled, and reopening removes old incident requests from the system queue.

The system activity's subtitle shows only localized Internet/cellular status with one coloured Unicode marker per connection (green confirmed, amber checking, red unavailable, neutral unknown), without a duplicate check/cross. Progress still reflects actual guard duration. Layout, the Lock Screen background/transparency and Dynamic Island presentation are controlled by iOS and device support. BGContinuedProcessingTask exposes title, subtitle and progress, but no background-colour or SwiftUI styling API. Setting activityBackgroundTint requires an app-owned ActivityKit/WidgetKit activity and does not style this system activity. If the status presentation is insufficient, a future custom activity must first be checked for duplicate system activities. Future work also includes approved Critical Alerts, additional probe policy, energy measurement and validation of sustained background runtime; none changes the limitation that call receipt cannot be guaranteed.

## Sources

- [Expo SDK release index](https://expo.dev/sdk) and [SDK 57 reference](https://docs.expo.dev/versions/v57.0.0/)
- [Expo AppDelegate subscribers](https://docs.expo.dev/modules/appdelegate-subscribers/)
- [Apple continued-processing tasks](https://developer.apple.com/documentation/backgroundtasks/performing-long-running-tasks-on-ios-and-ipados)
- [Apple request identifier requirements](https://developer.apple.com/documentation/backgroundtasks/bgcontinuedprocessingtaskrequest/init(identifier:title:subtitle:))
- [CoreTelephony registration API](https://developer.apple.com/documentation/coretelephony/cttelephonynetworkinfo/servicecurrentradioaccesstechnology)
- [Time Sensitive notification setting](https://developer.apple.com/documentation/usernotifications/unnotificationsettings/timesensitivesetting)

Home contains Internet and Cellular monitoring switches alongside their confirmation status. Both are enabled on first use; the last selection is saved locally. Changing the selection rechecks preflight before power is enabled. At least one condition must stay enabled, and selection cannot change during a guard. There is no Settings tab. In development builds, long-press the SignalGuard heading to open diagnostics; this gesture is absent in production.


## Notification controls and long sessions

Automatic preflight checks notification authorization, alert and sound permission, and Time Sensitive delivery. Missing prerequisites block the power button; Home offers a contextual permission request or opens the app’s iOS Settings. There is no in-app notification configuration screen. That permission does not guarantee audible delivery: Silent mode, Focus and system settings still apply. Vibration is governed by iOS Sounds & Haptics; public local-notification APIs do not expose an independent vibration preference. Critical Alerts are unavailable in this MVP and require Apple approval and a future entitlement/permission implementation. They would affect notification delivery, not background execution.

An interruption after approximately four hours is not a known fixed limit in the app or a documented four-hour iOS cutoff. Apple can end a continued-processing task when resources are constrained. Do not suppress the watchdog or automatically restart from the background. New sessions persist the reason when observable: task expiration, a missed native heartbeat, or a previous process no longer running at launch. The last case cannot distinguish a crash, force-close or system termination. These diagnostics do not recover the exact cause of older sessions or guarantee a fix.

No cloud build or TestFlight submission is part of local maintenance. Start one only when explicitly requested by the user. Native changes need a subsequently authorized EAS build to reach the installed iPhone app.

History shows newest sessions first, grouped by their start day, with outcome icons and elapsed duration. Incident rows distinguish brief interruptions, alerts and acknowledgement. Cross-midnight session end labels include the end date, and recorded monitoring interruption reasons remain available. A failed history read displays an error instead of an empty-history claim.


## Expo Go UI preview

When the native module is absent in development (Expo Go or local browser inspection), Home switches use an in-memory preview adapter and History contains five past sample segments, clearly labeled as sample data. Clearing this preview only clears its memory; reload recreates the examples. Nothing is written to native storage. The adapter never reports ready or active, and Start, notifications and background monitoring remain unavailable. Custom native builds use the real module and never inject these examples. The production branch does not import the fixture module.


## Resuming an interrupted guard

The watchdog says monitoring has stopped and offers a foreground Resume action. Tapping the watchdog or its action authorizes one resume attempt once the app is active; normal icon launch never auto-restarts. A session identifier rejects stale notifications. Swift rechecks prerequisites and submits a fresh immediate/fail continued-processing request with the original end time and monitoring selection. Active is reported only after native startup/heartbeat succeeds. An expired original end does not become another 24-hour guard.

Saved resume links are written only after successful task startup. History groups segments into one guard and shows interruption/resumption timestamps, without a separate interruption-period duration. Session duration sums monitored segments rather than counting the unmonitored interval. Native notification launch/resume behavior needs physical-iPhone acceptance; Expo Go only previews History and never resumes a real guard.

## Public privacy and support pages

Published in the existing static server, following Cytowars, under `/home/mario/server/public/apps/signalguard/`. Hosting/DNS are unchanged. History's information button opens the localized policy and support links; it adds no Settings tab.

- Spanish privacy: https://web.mcorchero.com/apps/signalguard/privacidad/
- English privacy: https://web.mcorchero.com/apps/signalguard/privacy/
- Spanish support: https://web.mcorchero.com/apps/signalguard/soporte/
- English support: https://web.mcorchero.com/apps/signalguard/support/

Use these privacy/support URLs in App Store Connect metadata when preparing a release. That metadata has not been changed by publishing these pages.

Custom local-notification sounds are possible without Critical Alerts: bundle a compatible WAV/AIFF/CAF file shorter than 30 seconds and use UNNotificationSound(named:). Current notifications still use the default sound. Ordinary custom sounds remain subject to iOS Silent mode, Focus and sound settings. Critical Alerts would additionally require Apple's approval of the entitlement, an updated signed provisioning profile, native critical authorization/sound integration and the user's separate permission. This enhancement is not enabled in MVP.
