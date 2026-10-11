# Real iPhone acceptance tests

Use an **iPhone on iOS 26 or later** and the EAS development build. Expo Go, a browser, Linux Swift tests and a simulator cannot validate this feature. Record iPhone model, iOS version, language, SIM configuration, build identifier, timestamps and results. Test the production timings as well as development timings. Do not distribute as a safety tool until these checks pass.

## Setup and preflight

1. Install the development build. Open SignalGuard. Verify setup checks run automatically with no separate test flow.
2. On the first notification request, verify the explanation appears before the iOS permission sheet. Allow notifications.
3. In iOS Settings → Apps → SignalGuard → Notifications, enable alerts, sounds and Time Sensitive Notifications. Start must remain disabled when any required setting cannot be confirmed.
4. Deny notification permission, reopen SignalGuard, and verify START GUARD is disabled with a direct Open Settings action.
5. Disable Time Sensitive Notifications only. Reopen and verify START GUARD is disabled even if ordinary alerts and sound remain enabled.
6. Remove cellular registration before starting (Airplane Mode, or disable all SIM lines). Verify the cellular row is unavailable and Start is blocked when cellular monitoring is enabled.
7. On Home, disable Internet, then attempt to disable Cellular. Verify the last enabled condition stays on and a clear explanation appears. Stop an active guard before changing these settings.

## Start, Lock Screen and background runtime

1. Restore Internet and cellular registration. Choose +8h and press START GUARD in the foreground.
2. During submission, verify the UI does not claim active. On success verify Guard Active, Until, monitoring and a recent confirmation appear.
3. Lock the phone. Verify the **system continued-processing Live Activity** appears on the Lock Screen; verify Dynamic Island presentation on a supported iPhone. There must be exactly one activity.
4. Leave the app backgrounded for at least 15 minutes; also test 4, 8 and 12 hours. Observe genuine duration progress. Capture early system termination instead of assuming eight-hour execution is guaranteed.
5. Cancel via the system activity. Verify the app becomes interrupted, an interruption warning arrives, and resuming requires an explicit foreground action.
6. Test with low power/battery pressure and other apps doing continued processing. An immediate submission refusal must produce a visible error without claiming monitoring is active. There must be no queued future guard.

## Internet and cellular are independent

1. With a guard running and the phone locked, enable Airplane Mode with Wi-Fi off. Verify amber checking first, then a single aggregate Time Sensitive alert after approximately 60 seconds of confirmed failure. Sampling and probe timeouts can add detection latency.
2. Restore connectivity. Verify red clears and **all future outage reminders are cancelled**. Wait beyond two reminder intervals to prove there are no stale notifications.
3. Keep Wi-Fi Internet working. Disable each relevant cellular line, or use a situation where cellular registration is lost while Wi-Fi remains available. Verify Internet stays healthy, cellular enters amber then red, and an incident alerts. **Turning mobile data off alone does not necessarily remove cellular registration.**
4. Restore the line. Verify recovery cancels reminders immediately on the next native observation.
5. Turn Wi-Fi off while functional mobile data remains available. Verify Internet stays healthy and no Wi-Fi-only incident appears.
6. Cause a brief loss under 60 seconds, restore it, and verify no incident alert was sent. After stopping, History must retain the brief interruption with “no alert”.
7. On Wi-Fi with a captive portal, verify a satisfied path alone is insufficient to show healthy Internet.
8. In a controlled network test, block only the primary probe endpoint. Verify fallback success avoids an Internet incident. Block both and verify unconfirmed Internet becomes an incident after its own grace period.
9. Cause one dimension to fail, then the other after 30 seconds. Verify one aggregate incident, separate grace timers and no duplicate initial alert.

## Acknowledgement and recovery

1. Keep an incident unhealthy for over 60 seconds. Verify sound and Time Sensitive presentation where iOS permits; repeat locked and foreground.
2. Leave it unacknowledged. Verify reminders approximately every five minutes; reminders should be submitted only near their deadlines, with at most two planned deadlines and no unbounded pending queue.
3. Tap **Acknowledge** in the notification. Verify reminders stop while the app remains red until real connectivity recovery.
4. Repeat acknowledgement from the app. Verify the same behavior.
5. Recover without acknowledging. Verify reminders stop automatically, then create a new outage and verify it can alert again.
6. Tap Acknowledge on an old delivered incident after a new incident starts. Verify the old action cannot acknowledge the new incident.
7. Recover/acknowledge/stop near a reminder boundary. Verify no pending requests are resurrected by an in-flight operation.

## Monitoring-health watchdog and restart

1. Start a healthy guard and wait for at least one confirmation.
2. Force-close SignalGuard from the app switcher while the guard has ample time remaining.
3. Keep the phone locked. Verify the **pre-scheduled interruption warning** arrives approximately 90 seconds after the last successful heartbeat; do not reopen the app to cause the warning.
4. Reopen. Verify **Guard interrupted**, local history records an interrupted session, and the app does not falsely claim Guard Active or silently restart.
5. Explicitly press RESTART GUARD. Verify iOS starts a new task and the new watchdog replaces any pending interruption warning.
6. Kill near the scheduled end time. If the monitor did not actually complete, verify it reports interruption rather than inventing a successful completion.
7. Disable notifications during a running guard. Verify active monitoring fails safely; notification delivery itself may be unavailable because it was disabled.
8. Use development “Interrupt native monitoring” and leave the app open/backgrounded. Verify the existing watchdog warns without a replacement heartbeat.

## Stop and completion

1. Tap STOP GUARD once. Verify there is no confirmation dialog, the button waits for native completion and an in-app “Monitoring stopped” notice appears briefly after monitoring stops.
2. After the stop completes, verify monitoring and pending watchdog/outage/reminder requests stop, system activity ends, and history says Guard stopped.
3. Select an end time a few minutes ahead. Lock the phone and leave the app backgrounded. At end verify:
   - monitoring stops;
   - system activity completes successfully;
   - one ordinary Guard completed notification appears;
   - history has the actual completion;
   - no later watchdog or outage reminders occur.
4. Start an incident shortly before guard end. Verify reminders never get scheduled beyond the end, and completion cancels the watchdog.
5. Start before midnight, select an earlier clock time, and verify it means tomorrow. Test the 24-hour limit and daylight-saving boundaries.
6. Change the device clock during a guard. Verify that a significant manual clock jump interrupts the guard safely and requires an explicit restart. Ordinary midnight and daylight-saving transitions must not interrupt it.

## Languages and accessibility

1. Test English and Castilian Spanish using the app language in iOS Settings, including home, history, monitoring selection, permission explanation, errors, notification actions, watchdog, completion and system activity subtitles.
2. Verify no technical network/SIM identifiers or untranslated keys appear.
3. Test light/dark appearance, VoiceOver, large text, a smaller iPhone display and status contrast.
4. Verify no copy claims guaranteed telephone-call receipt.

## Dual-SIM, if available

Start with both services registered. Lose registration on one original service while the other remains registered. Cellular must become unhealthy; the remaining line must not hide the outage. Restore both and verify recovery. Repeat with only one line registered at start. Service identifiers must not appear in history or UI.

## Development simulations

In a development build, long-press the SignalGuard heading on Home to open Development diagnostics. Before starting, enable short timings (10-second grace, 30-second reminders, 18-second watchdog; heartbeat 3 seconds/probes 5 seconds). Return Home and start a real native task; simulations never bypass real preflight/task submission.

Exercise Internet, Cellular, Both, Recovery, Interruption and Completion. Restore real readings before real connectivity tests. Test a Release preview build to verify diagnostics are inaccessible and simulation/timing methods are absent. Short timings are memory-only and cannot persist into production.

## Power control and compact activity

- With valid setup, tap the central OFF power button. Verify ON appears only after the native task starts, and the end time is within 24 hours. No end-time selection is required; the 24-hour limit is visible before starting. iOS can still expire the task earlier.
- Tap the ON button once; verify no confirmation dialog appears, a brief in-app notice confirms the actual stop, and the native task ends and the watchdog/reminders are cancelled.
- Expand “Choose end time”, select +4h, and verify the guard ends four hours after the press. Collapse the control before starting another session and verify the 24-hour default is restored.
- Verify the system activity shows SignalGuard plus only Internet and Cellular (Red móvil in Spanish). There is no notification row, duplicate guard status row or end-time subtitle. Confirm one green/amber/red/unknown marker per connection reflects the native status, without a second check/cross; Apple controls layout and progress presentation.
- Test dark mode, large text and a narrow iPhone. The power button must remain tappable and status labels must remain readable without horizontal scrolling.

- Check activity contrast against bright and dark Lock Screen wallpapers. The system activity background is controlled by iOS and cannot be made opaque through BGContinuedProcessingTask. Record readability problems for a future custom-activity evaluation, which must first rule out duplicate activities.


## Notification information and sustained monitoring

1. Open Home and verify aligned Monitor switches are next to Internet and Cellular status; there is no Settings tab. No sound, vibration or Critical Alerts section appears. Repeat in Spanish.
2. Disable notification or sound permission in iOS Settings, return to Home and verify the power button stays disabled with an Open Settings action. Repeat with Time Sensitive disabled. On a fresh installation, verify Enable notifications explains why permission is needed before requesting it, and denying permission leaves the guard blocked.
3. Run an ordinary guard for more than four hours while locked, recording start time and any interruption notification time. Reopen and inspect the interruption reason in History. No running native task must be represented as active after process loss, and restart must require an explicit foreground Resume action.
4. Record task expiration separately from missed-heartbeat and process-stopped outcomes. A process-stopped reason alone does not identify why iOS ended the process. Do not declare the four-hour report resolved based only on local tests.


## Home selection and history presentation

- Verify both conditions are enabled on first use. Disable unavailable Internet and start a Cellular-only guard, then repeat with unavailable Cellular and Internet-only monitoring. After each selection change, power must wait for fresh preflight. The remaining enabled condition and all notification/watchdog requirements still apply.
- Attempt to turn off both conditions; the last remains enabled with an explanation. During active monitoring, selectors disappear; stop to change them. Saved selection survives relaunch.
- Review populated History in English and Spanish, light/dark mode and large text. Verify newest-first day grouping, outcome, duration, brief interruption/alert distinction and acknowledgement. Check sessions spanning midnight display the end date. Interrupted sessions must remain visibly distinct, and no incidents recorded must not imply uninterrupted system execution.


## Resume from interruption

1. Start with an end time at least one hour away. Interrupt/force-close, then tap the watchdog notification or its Resume action. Verify the app becomes active, native preflight runs and a new immediate task starts. No active indication may appear before the first successful heartbeat/watchdog. The original end and monitoring selection must be preserved.
2. Repeat by opening from the app icon instead: no task starts automatically; the power control says Resume and needs one tap.
3. Disable notifications or make an enabled connection unavailable before resuming. Verify preflight fails visibly and no active state is claimed. Restore prerequisites and retry explicitly.
4. Tap a stale watchdog notification from a previous guard; it must not restart a different session. Repeat taps/foreground events must not create duplicate tasks.
5. Let the original end time pass before tapping Resume. Verify it does not start another 24-hour guard; a fresh guard requires a new explicit start.
6. Inspect History after success and after completion: linked segments appear as one guard with interruption and resumption events. No interruption-period duration appears. After a failed resume attempt, no successful-resumption event may be recorded.
7. Run all of the above in English and Spanish. Expo Go sample History is only a UI demonstration; real notifications/resume need a native build.


- Interrupt a guard, clear its visible History, quit/reopen and verify Resume retains its original end/selection. Old incidents must remain erased; a later successful resumed segment must still show its resume event. Clear History after completion and verify no resumable checkpoint is offered.

## Interruption detail inspection (next native build)

- Start, interrupt and explicitly resume a guard twice, then stop it. In History tap each interruption row: each must show its own persisted reason, segment start and last heartbeat even though the group ends as stopped.
- Verify taskExpired says iOS ended the task without claiming why; processStopped says the process was absent when reopening without claiming a crash/force-close. An old record missing its reason must say the reason is unavailable.
- Tap Copy details, then paste into Notes. Verify the selected segment only, UTC timestamps, no SIM/device/session identifiers; it must not send anything remotely or request permission to read clipboard content.
- Repeat in English and Spanish with large text and dark/light appearance. Expand/collapse must remain usable and copying must show success only after a successful write.
- Existing TestFlight build 7 does not contain this feature. No EAS build is authorized automatically; await an explicit user request after quota is available.
