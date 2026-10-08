import Foundation
import UserNotifications

struct NotificationReadiness {
  let ready: Bool
  let notifications: Bool
  let timeSensitive: Bool
  let undetermined: Bool
}
@MainActor
protocol GuardNotificationService {
  func refreshWatchdog(delay: TimeInterval) async throws
  func alert(incident: Incident, dimensions: Set<Dimension>) async throws
  func reminders(incident: Incident, dates: [Date], dimensions: Set<Dimension>) async throws
  func cancelReminders()
  func cancelGuardNotifications()
}
// This boundary can adopt Critical Alerts in future; the incident engine has no entitlement assumptions.
@MainActor
final class LocalNotificationService: GuardNotificationService {
  static let watchdogID = "sg.watchdog"

  private let center = UNUserNotificationCenter.current()
  private var incidentNotificationIDs: Set<String> = []
  private var reminderDimensions: [String: Set<Dimension>] = [:]
  private let delegate = SignalGuardNotificationDelegate()
  func configure() {
    let action = UNNotificationAction(identifier: "ACKNOWLEDGE", title: NativeStrings.text("action.acknowledge"), options: [])
    center.setNotificationCategories([UNNotificationCategory(identifier: "SG_INCIDENT", actions: [action], intentIdentifiers: [], options: [])])
    center.delegate = delegate
  }
  func readiness() async -> NotificationReadiness {
    let settings = await center.notificationSettings()
    let notifications = settings.authorizationStatus == .authorized && settings.alertSetting == .enabled && settings.soundSetting == .enabled
    let sensitive = settings.timeSensitiveSetting == .enabled
    return NotificationReadiness(ready: notifications && sensitive, notifications: notifications, timeSensitive: sensitive, undetermined: settings.authorizationStatus == .notDetermined)
  }
  func requestPermission() async throws {
    // Time Sensitive delivery is enabled by the entitlement, not Critical Alerts authorization.
    _ = try await center.requestAuthorization(options: [.alert, .sound])
  }
  private func content(title: String, body: String, sensitive: Bool) -> UNMutableNotificationContent {
    let content = UNMutableNotificationContent()
    content.title = NativeStrings.text(title)
    content.body = body
    content.sound = .default
    content.interruptionLevel = sensitive ? .timeSensitive : .active
    return content
  }
  func refreshWatchdog(delay: TimeInterval) async throws {
    let content = content(title: "watchdog.title", body: NativeStrings.text("watchdog.body"), sensitive: true)
    // Adding the SAME identifier replaces the previous request atomically at the notification center;
    // do not first cancel, which would leave a gap if the process dies before add().
    try await center.add(UNNotificationRequest(identifier: Self.watchdogID, content: content, trigger: UNTimeIntervalNotificationTrigger(timeInterval: max(1, delay), repeats: false)))
  }
  private func incidentContent(_ incident: Incident, dimensions: Set<Dimension>) -> UNMutableNotificationContent {
    let key = dimensions.count > 1 ? "incident.both" : dimensions.contains(.cellular) ? "incident.cellular" : "incident.internet"
    let content = content(title: "incident.title", body: NativeStrings.text(key), sensitive: true)
    content.categoryIdentifier = "SG_INCIDENT"
    content.userInfo = ["incidentId": incident.id]
    return content
  }
  func alert(incident: Incident, dimensions: Set<Dimension>) async throws {
    let id = "sg.incident." + incident.id
    incidentNotificationIDs.insert(id)
    try await center.add(UNNotificationRequest(identifier: id, content: incidentContent(incident, dimensions: dimensions), trigger: nil))
  }
  func reminders(incident: Incident, dates: [Date], dimensions: Set<Dimension>) async throws {
    for date in dates where date > Date() {
      // Stable per-deadline IDs: rolling forward must not overwrite the request that just became due.
      let id = "sg.reminder." + incident.id + "." + String(Int64(date.timeIntervalSince1970))
      if reminderDimensions[id] == dimensions { continue }
      reminderDimensions[id] = dimensions
      try await center.add(UNNotificationRequest(identifier: id, content: incidentContent(incident, dimensions: dimensions), trigger: UNTimeIntervalNotificationTrigger(timeInterval: max(1, date.timeIntervalSinceNow), repeats: false)))
    }
  }
  func cancelReminders() { center.removePendingNotificationRequests(withIdentifiers: Array(reminderDimensions.keys)) }
  func cancelPersistedIncidentNotifications(incidentIDs: Set<String>) async {
    // In-memory tracking is gone after process death. Read iOS's pending queue and cancel only
    // incidents belonging to old stored sessions, so a new guard/watchdog cannot be cancelled.
    let requests = await center.pendingNotificationRequests()
    let stale = requests.filter { request in
      guard let id = request.content.userInfo["incidentId"] as? String else { return false }
      return incidentIDs.contains(id)
    }.map { $0.identifier }
    center.removePendingNotificationRequests(withIdentifiers: stale)
  }
  func resetIncidentTracking() {
    cancelReminders()
    center.removePendingNotificationRequests(withIdentifiers: Array(incidentNotificationIDs))
    reminderDimensions = [:]; incidentNotificationIDs = []
  }
  func cancelGuardNotifications() {
    // Completion notifications are outside guard cleanup, including async stop races.
    center.removePendingNotificationRequests(withIdentifiers: [Self.watchdogID] + Array(reminderDimensions.keys) + Array(incidentNotificationIDs))
  }

  func completed(end: Date) async throws {
    let content = content(title: "completion.title", body: NativeStrings.text("completion.body", NativeStrings.clock(end)), sensitive: false)
    try await center.add(UNNotificationRequest(identifier: "sg.completed." + UUID().uuidString, content: content, trigger: nil))
  }
}
final class SignalGuardNotificationDelegate: NSObject, UNUserNotificationCenterDelegate {
  func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
    completionHandler([.banner, .list, .sound])
  }
  func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
    guard response.actionIdentifier == "ACKNOWLEDGE", let id = response.notification.request.content.userInfo["incidentId"] as? String else { completionHandler(); return }
    Task { @MainActor in
      await GuardCoordinator.shared.acknowledge(incidentID: id)
      completionHandler()
    }
  }
}
