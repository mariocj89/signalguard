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


## TestFlight build 4 — 5 October 2026

The user explicitly requested sending the new design to TestFlight. Dispatched production EAS Build with auto-submit, using the existing scoped signing credentials and App Store Connect application 6736607323. Local app.json build number incremented from 3 to 4.

- Version **1.0.0 (4)**: EAS build `2793dc13-6859-44b8-ae7b-f53a65adc732` **FINISHED**. Apple SDK compilation, archive and signing succeeded, including the updated custom Swift module, activity strings/markers and icon/font assets.
- Submission `783fffd9-9199-4b21-a5bd-b8c02892da50` is **FINISHED**, completed 2026-10-05T12:40:03Z. Apple build `74063d92-928c-473a-afe8-51d729d2ee7d` is **VALID**, version 1.0.0 (4), internal beta state **IN_BETA_TESTING**; confirmed directly against App Store Connect.
- App Store Connect now shows build 4 as the newest upload. The internal **Devs** group has access to all builds; the user's account is already a member. No invitations or group changes were needed.
- Rechecked: TypeScript and lint pass, 27 Jest tests and 18 native Swift tests pass. Dependency audit currently reports 54 upstream findings (51 high, three moderate, zero critical); no incompatible broad dependency upgrade was applied.
- Actual on-device behaviour and system activity layout still require the real-device acceptance checklist.

Build: https://expo.dev/accounts/etcaterva/projects/signalguard/builds/2793dc13-6859-44b8-ae7b-f53a65adc732
Submission: https://expo.dev/accounts/etcaterva/projects/signalguard/submissions/783fffd9-9199-4b21-a5bd-b8c02892da50

Follow up by checking `npx eas-cli@latest submit:view 783fffd9-9199-4b21-a5bd-b8c02892da50 --json` and the latest Apple upload. Temporary read-only helpers `/tmp/signalguard-submission-status.py` and `/tmp/signalguard-apple-build.cjs` report safe status fields without exposing credential or signed-log data.


## Minimal settings and single activity markers — local changes after build 4

At the user's request, Settings now shows only its heading and two compact Internet/Cellular condition switches with globe/phone icons, green switches and a divider. Removed language/privacy/about/advanced explanatory sections and persistent timing/watchdog text from this screen. Errors remain contextual. Native validation, at-least-one-enabled protection, active-session settings lock and the always-on watchdog remain unchanged. Privacy and limitations remain documented in README. Development diagnostics remain reachable by long-pressing the Settings heading, absent in production; acceptance instructions updated.

The system activity now uses exactly one coloured marker per connection (green, amber, red or grey), removing duplicate checks, ellipses, crosses and question marks. Disabled monitoring retains its dash. Native marker tests and English/Spanish browser navigation checks updated.

The requested opaque Lock Screen background cannot be set on BGContinuedProcessingTask's system activity: the public API exposes title/subtitle/progress but no background styling. Apple's ActivityKit/WidgetKit activityBackgroundTint styles app-owned activities only. No private API or second activity was introduced. This limitation and real-device contrast checks are documented; any future custom activity must first verify it does not duplicate the system activity.

Validation: TypeScript, lint, 27 Jest tests, 18 Swift tests, two browser tests (English/Spanish) and Git whitespace checks pass. These changes are local only; TestFlight 1.0.0 (4) contains the earlier settings and double markers. No new cloud build was requested or dispatched for this edit.


## TestFlight build 5 — minimal settings and single markers

At the user's explicit publishing request, launched production EAS Build with auto-submit. App version 1.0.0, iOS build number **5**. Build `d8c81262-aef6-452e-9793-75b777111d4b` **FINISHED**: Apple SDK compilation, archive and signing succeeded. Includes the minimal Settings screen, development-only heading gesture and single coloured native activity markers from commit 7f61b9f. The system activity background remains controlled by iOS, as documented.

Submission `42ab5da9-c5d6-45e2-a84f-5b465f773362` is currently **IN_QUEUE**, with no error. The Devs group and user access are already configured. Apple processing/availability of build 5 is pending.

Rechecked: typecheck, lint, 27 Jest tests, 18 Swift tests and two English/Spanish browser tests pass. No new signing assets, testing groups, invitations, remote repository or public App Store release were created.

Build: https://expo.dev/accounts/etcaterva/projects/signalguard/builds/d8c81262-aef6-452e-9793-75b777111d4b
Submission: https://expo.dev/accounts/etcaterva/projects/signalguard/submissions/42ab5da9-c5d6-45e2-a84f-5b465f773362


Build 5 follow-up: after extended monitoring, submission remains IN_QUEUE with no logs/errors and canRetry=false. Verified submittedBuild is the correct FINISHED version 1.0.0 (5); Expo's service status page reports EAS Submit operational. There is no upload retry/error to repair yet. All project/signing work is complete; external queue execution and Apple's processing remain pending. Do not tell the user build 5 is installable until checking `python3 /tmp/signalguard-submission-status.py 42ab5da9-c5d6-45e2-a84f-5b465f773362` and `node /tmp/signalguard-apple-build.cjs` for the current upload (the old 2024 build 5 belongs to version 1.1.0 and is expired).


## Phone icon and Android feasibility discussion

Replaced the icon's check with a green smartphone inside the existing white shield/navy background. Regenerated the 1024×1024 full-square PNG and visually inspected it. Typecheck, lint and all 27 Jest tests pass. Icon changes are local only, not in TestFlight build 5.

At the user's Android question, researched current official foreground-service, phone registration, stopped-state and alarm/Doze documentation. Added docs/ANDROID_FEASIBILITY.md. Android is not enabled or implemented yet; same-engine reuse would be unsafe. A Kotlin native service, visible ongoing notification, phone-state permission, Android notification readiness and independent AlarmManager watchdog must be designed/tested. specialUse is a proposed foreground-service type subject to Play review. Force-stop cancels pending intents on Android 15, making the original force-close watchdog expectation impossible to promise on Android. Idle alarm limits also prevent claiming a universal 60–90-second watchdog bound. Asked asynchronously whether Android with the explicit force-stop limitation is acceptable; await the answer before dependent implementation. No Android cloud build, credentials or Play upload were created.

TestFlight follow-up: build 5 submission 42ab5da9-c5d6-45e2-a84f-5b465f773362 is FINISHED (2026-10-05T16:55:27Z). Direct Apple API confirms build 233e24d3-737e-47de-bc74-19e203d464cb is version 1.0.0 (5), VALID and IN_BETA_TESTING, uploaded on 5 October 2026. It is available to the existing internal group. This supersedes the earlier pending queue notes.


## One-tap manual stop — local changes after build 5

The user explicitly removed the stop-confirmation requirement. Home now calls native stopGuard directly from a single tap of the ON control. The button stays busy/disabled during the operation; native state continues to determine ON/OFF. A compact in-app notice reads “Monitoring stopped” / “Monitorización detenida” only after native stop resolves, and dismisses automatically after four seconds. Starting a new guard clears the notice. The dismissal timeout is UI feedback only; it does not perform monitoring. Failed stops show the existing error and do not claim success.

Updated the behavioural stop test to check immediate native invocation, no confirmation dialog, disabled pending control, no premature OFF/success notice and final OFF/notice after native completion. Added a failed-stop test. Removed unused stop-dialog translations in both languages and updated README/device acceptance instructions. Native stop lifecycle and cancellation remain unchanged. History-clearing and notification-permission confirmations remain as before.

Validation: typecheck and lint pass; 28 Jest tests, 18 Swift tests, two English/Spanish browser tests, iOS bundle export, Expo Doctor 21/21 and whitespace checks pass. These changes and the phone-shield icon remain local; published TestFlight 1.0.0 (5) still has the old stop confirmation and check-shield icon. No new build/submission was requested for this edit. Android remains unimplemented.


## Build 6 — aligned Monitor settings, phone icon and one-tap stop

The user explicitly requested aligned Settings switches, a Monitor section header and submission. Settings now places both switches in a fixed 52-point, non-shrinking trailing column, with flexible/wrapping labels and equal-width icon slots. Added localized section headings Monitor / Monitorizar. English browser inspection checks the two switches share the same x-position within one pixel; both languages verify the heading. Actual native iPhone layout still needs review.

Validation: typecheck/lint, 28 Jest tests, 18 Swift tests, two browser checks, iOS bundle export, Expo Doctor 21/21 and whitespace checks pass. Source checkpoint 712e1a0. No monitoring-engine changes.

Dispatched production EAS build **1.0.0 (6)** with auto-submit: build `31135c77-edbc-498e-a0c5-7c6ebe98eb45`, submission `1f176e8d-a469-4ea9-b097-7e13341b55fc`. Build/submission are pending at this record. The archive includes the previously local phone-shield icon and one-tap manual stop/in-app notice, as well as aligned settings. Existing scoped signing credentials were reused; no new certificate/profile or testing group was created. Android remains unimplemented; no public App Store release.

Build: https://expo.dev/accounts/etcaterva/projects/signalguard/builds/31135c77-edbc-498e-a0c5-7c6ebe98eb45
Submission: https://expo.dev/accounts/etcaterva/projects/signalguard/submissions/1f176e8d-a469-4ea9-b097-7e13341b55fc

Build 6 queue follow-up: EAS reports NEW, NORMAL priority, no error, no logs and no queue-position/wait estimate. Native archive/Apple upload remain unvalidated for this build. Auto-submit is scheduled and will run after successful build; temporary status helpers can follow build 31135c77-edbc-498e-a0c5-7c6ebe98eb45 and submission 1f176e8d-a469-4ea9-b097-7e13341b55fc. Do not claim build 6 is installed/available until Apple processing is confirmed.


## 8 October 2026: long-session diagnosis and notification information

User reports a monitoring-interrupted warning after about four hours. No fixed four-hour cutoff was found in the app. Added persisted interruption reasons (taskExpired, heartbeatMissed, processStopped), backward-compatible with previous session JSON; processStopped cannot identify crash versus force-close/system termination. No guaranteed fix is claimed. Settings now reports actual sound permission and explains system-managed vibration, Time Sensitive timing and unavailable Critical Alerts in English/Spanish. No Critical Alerts entitlement or permission request was added.

User explicitly forbids EAS/TestFlight builds unless requested. No build/submission was started for these changes. Their Apple-framework compilation and real-device behavior remain unvalidated until a later authorized build. Expo SDK 57 patch dependencies were aligned with current doctor recommendations.


## 8 October 2026: simplified notification UX

At the user’s request, removed the entire notification information section from Settings, the unused getNotificationStatus bridge/native helper and its UI-only translations. Settings again shows only the aligned Monitor switches. Preserved automatic native preflight for authorized alert/sound and Time Sensitive delivery, Home’s contextual permission request / Open Settings action, and interruption diagnostics. No EAS build or TestFlight submission. Existing explicitly approved temporary Expo Go tunnel serves the updated manifest and iOS bundle (HTTP 200); native monitoring cannot run in Expo Go.

Local validation: typecheck/lint, 31 Jest tests, 19 Swift tests, two browser checks, iOS export, Expo Doctor 21/21 and whitespace checks pass. Regression coverage verifies absent notification UI and both undetermined/denied permission paths block Start. Device behavior still needs validation.


## 8 October 2026: Home monitoring selection and History UX

Moved the two monitoring switches onto Home beside connectivity status, removed the Settings route/tab, and moved Debug-only diagnostics access to a long press on the SignalGuard heading. Both conditions default on at first use; native persistence retains the last choice. Saving/rechecking blocks power, at least one condition must remain on, and active guards hide selectors. Public CoreTelephony API usage remains unchanged; the reported false-negative registration cause is unverified. Preflight copy now says registration could not be confirmed rather than asserting no service.

History now sorts newest first, groups by start day, shows compact outcome icons/durations and incident timelines, distinguishes brief interruptions and alerts/acknowledgement, handles midnight end dates, and shows loading/error without falsely claiming empty history. Added interrupted-reason localization mapping that was missing from errorText.

Passed: TypeScript/lint, 36 Jest tests, 19 Swift tests/parser checks, two browser tests, iOS export, Expo Doctor 21/21 and git whitespace. Verified existing approved Expo tunnel manifest/current bundle HTTP 200; link remains exp://browsers-tobacco-winning-postage.trycloudflare.com while PC/processes run. Expo Go is UI-only and cannot run native monitoring. No EAS/TestFlight build or submission. Real-device false-negative cellular diagnosis and background runtime remain unverified.


## 8 October 2026: fix Expo Go selectors and seed UI-only sample history

The original fail-closed fallback rejected updateSettings, so Home switches could not change in Expo Go. Added a development-only memory adapter when native is absent; updates emit state and survive screen navigation. Both-off validation remains, and readiness/start/notifications/monitoring remain unavailable. Preview History contains four clearly labeled past sessions with completed/stopped/interrupted outcomes, brief and threshold-crossing failures, combined incidents and acknowledgement. Samples never touch disk/native history; clear empties preview memory until reload. Native clients always use real data.

Passed typecheck/lint, 38 Jest tests, 19 Swift tests/parser checks, two English/Spanish browser checks including actual preview switch interaction and seeded history, iOS export, Expo Doctor 21/21 and whitespace validation. Production Hermes artifact explicitly checked to exclude fixture IDs. Existing approved Expo manifest and development bundle HTTP 200 and verified to include current samples. No EAS/TestFlight builds or submissions.


## 8 October 2026: explicit foreground resume and linked History events

User approved resuming from the watchdog notification/Resume action and explicitly removed the interruption-period duration from History. Native watchdog now has localized interrupted/tap-to-resume copy and foreground Resume action with session identity. Response stores a one-shot in-memory intent; the AppDelegate subscriber consumes it only once the app is active. Icon launch never silently restarts. Native resume validates session identity/end, preserves original monitoring selection/end, rechecks preflight, and uses the existing immediate/fail continued task flow. Failed requests remain visibly interrupted; active still requires actual native startup/heartbeat. Expired original ends cannot extend another 24h guard.

Sessions persist optional monitoredSettings and resumedFrom fields for backwards-compatible decoding. Successful resume links are saved only after native startup; History groups segments, sums their monitored durations and shows interruption/resumption timestamps without any gap/period duration. A currently resumed active segment is included in History so its resume event is visible immediately. Development sample History includes a linked resume example. UI resume state/power label is localized.

Local checks pass: typecheck/lint, 40 Jest tests, 20 Swift core/probe tests and Apple-framework parser checks, two English/Spanish browser tests, iOS export, Expo Doctor 21/21 and whitespace validation. Approved Expo manifest/current bundle HTTP 200 and contains sample resume example; production export excludes fixture IDs. Apple-framework compilation, notification foreground handling and actual iPhone resume remain unvalidated until a user-authorized native build/device check. No EAS or TestFlight build/submission was started.


## 8 October 2026: implementation and product review

Reviewed Home/preflight, native start/resume/task lifetime, incident aggregation/acknowledgement/reminders/watchdog, local persistence, History grouping, localization, CNG config and production/demo separation. Found and fixed clearing History inadvertently removing resumable-session metadata. clearVisibleHistory now erases visible records/incidents but retains a minimal interrupted-guard recovery checkpoint; subsequent resume events remain visible even when their older segment was deleted. Original failure reason/end remain available after relaunch. Also fixed specific task-unavailable/completion-notification failure explanations falling back to generic errors.

Local checks pass: typecheck/lint, 42 Jest tests, 21 Swift tests/parser checks, two browser tests, iOS export, Expo Doctor 21/21 and whitespace. Fresh npm audit reports 58 upstream findings (50 high, eight moderate, zero critical); suggested broad fixes change incompatible SDK/RN versions, so no force upgrade was applied. This remains an unresolved dependency review item, not a clean audit.

Product items to confirm with user, without changing behavior yet: retain last monitoring selection (current) versus reset both conditions for each NEW guard (recommended to avoid accidental partial coverage; resume must retain original settings), and a discreet information/privacy access after removing Settings. App Store requires accessible in-app privacy policy link and metadata URL; no such route/link is currently exposed. No public policy URL/hosting work is authorized here. Device gates remain: cellular false-negative report, sustained background runtime, actual watchdog/sound/Focus/notification resume and Apple-framework compilation of current changes. No EAS/TestFlight build/submission.
