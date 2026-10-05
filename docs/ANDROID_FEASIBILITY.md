# Android feasibility — 5 October 2026

Android is feasible, but the iOS background engine cannot be reused directly. Android is not enabled in the shipping app yet. This assessment records the product-level differences that must be accepted and tested before implementation claims monitoring parity.

## Reuse and native implementation

Reuse the Expo screens, configuration interface, localized strings and local history presentation. Add a Kotlin Expo module implementation behind the same typed interface. Swift remains the owner of iOS guards; Kotlin must own Android guards independently of JavaScript, React lifecycle and bridge availability.

Use a user-started foreground service with an ongoing notification and Stop action. Confirm the actual service launch, initial observations, notification readiness and independent watchdog scheduling before exposing an active state. Persist guard lifecycle/history locally and mark any unrecoverable persisted session interrupted on the next launch, requiring explicit restart. Do not automatically restart monitoring after force-stop or reboot.

Observe the default Internet network using ConnectivityManager.NetworkCallback plus small HTTPS primary/fallback probes; retain independent 60-second failure candidates and one aggregate incident. Use public subscription-specific TelephonyManager and TelephonyCallback.ServiceStateListener for cellular registration. Treat relevant services that lose registration as degraded; keep subscription identifiers transient and out of history. Verify phone-state access and hardware availability in preflight; do not request call logs, contacts, phone numbers, signal strength or unrelated background capabilities.

Android alert channels replace iOS Time Sensitive settings. Check notification permission, channel importance and sound. Do not claim alerts bypass Do Not Disturb. The ongoing service notification replaces the iOS system Live Activity; use a readable custom notification layout only within documented Android APIs.

## Watchdog differences — release gates

- Android 15 explicitly cancels an app's pending intents when the user force-stops the app. An AlarmManager watchdog cannot warn after Settings → Force stop. There is no local workaround that respects Android's stopped state. Reopening must show interrupted, not active; user must restart explicitly.
- Stopping via Android 13+ Active apps is a different operation: the app is removed from memory without callbacks, but previously scheduled alarms/jobs remain eligible to run. Removing a recent-app card is another distinct test; OEM behavior must be measured rather than assumed equivalent to either operation.
- Android's idle-mode alarms are rate-limited, and exact-alarm access is separately controlled. Official Doze guidance says allow-while-idle alarms cannot fire more than once per nine minutes per app. Do not promise a universal 60–90-second dead-monitor detection time. A watchdog implemented inside the service alone does not protect against loss of that service.
- Doze can suspend network access. Exact alarms do not solve continuous network availability and scheduling while the device sleeps. Establish a tested policy for battery settings, permitted wake locks, elapsed realtime deadlines and independent alarms. Do not disguise the app as audio, location, calling, VPN or health services.
- Notification permission/channel changes or revoked scheduling access must produce a conservative preflight failure/interrupted state. Permission cannot prove delivery under every device setting.

The user was asked whether Android support with the explicit force-stop limitation is acceptable. Acceptance of that limitation does not prove the watchdog design or guarantee Play review; those remain implementation/device release gates.

## Foreground service and store review

The likely service category is specialUse: user-initiated, finite, visible connectivity monitoring that cannot be deferred without losing its purpose. Include the specific use case in the manifest property android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE. Google Play reviews these declarations. This is a proposed classification, not confirmation of eligibility or approval.

Do not use dataSync as a convenient label: it is for data-transfer tasks, and Android 15 introduces a six-hour runtime budget for that type. Do not use phoneCall unless implementing an actual qualifying call service. Initial testing should use a locally installed development/preview APK; Play distribution is a separate explicit user request.

## Device acceptance before Android distribution

Test API levels supported by the chosen minimum and current target; physical Pixel, Samsung and at least one manufacturer with aggressive power management. Cover notification permission/channel sound/DND, phone-state permission, single and dual SIM, airplane mode, Wi-Fi plus cellular outage, mobile-data-only Internet, locked-screen overnight monitoring, Doze, battery saver, service process kill, recent-app removal, Active apps Stop, Settings Force stop, reboot, acknowledgement/recovery, cancelled reminders, guard completion and interruption history. Measure watchdog delay and energy use; document supported settings and observed limits.

## Primary references

- Foreground service types and specialUse review: https://developer.android.com/develop/background-work/services/fgs/service-types
- Android 15 stopped state / cancellation of pending intents: https://developer.android.com/about/versions/15/behavior-changes-all#stopped-state
- Active apps Stop semantics: https://developer.android.com/develop/background-work/services/fgs/handle-user-stopping
- Alarm precision and special access: https://developer.android.com/develop/background-work/services/alarms
- Doze limits: https://developer.android.com/training/monitoring-device-state/doze-standby
- Cellular callback: https://developer.android.com/reference/android/telephony/TelephonyCallback.ServiceStateListener
