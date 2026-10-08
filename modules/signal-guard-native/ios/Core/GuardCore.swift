import Foundation

enum Dimension: String, Codable, CaseIterable, Hashable { case internet, cellular }
enum Health: String, Codable { case healthy, checking, unavailable, unknown, disabled }
enum GuardPhase: String, Codable {
  case idle, preflighting, ready, starting, activeHealthy, activeDegraded, activeIncident
  case stopping, completed, interrupted
  var isActive: Bool { [.activeHealthy, .activeDegraded, .activeIncident].contains(self) }
}
struct GuardSettings: Codable, Equatable {
  var internet = true
  var cellular = true
  var valid: Bool { internet || cellular }
  var enabled: Set<Dimension> {
    Set(Dimension.allCases.filter { $0 == .internet ? internet : cellular })
  }
}
struct Timing {
  let grace: TimeInterval
  let reminder: TimeInterval
  let heartbeat: TimeInterval
  let watchdog: TimeInterval
  let probe: TimeInterval
  static let production = Timing(grace: 60, reminder: 300, heartbeat: 15, watchdog: 90, probe: 30)
  #if DEBUG
  static let test = Timing(grace: 10, reminder: 30, heartbeat: 3, watchdog: 18, probe: 5)
  #endif
}
struct Incident: Codable, Equatable {
  var id = UUID().uuidString
  var start: Date
  var end: Date?
  var dimensions: [Dimension]
  var crossedThreshold = false
  var acknowledged = false
}
enum IncidentPhase: String { case healthy, candidateFailure, alerting, acknowledgedWhileUnhealthy, recovered }
enum IncidentEffect: Equatable { case alert, cancelReminders, updateReminders }
struct IncidentMachine {
  let enabled: Set<Dimension>
  let timing: Timing
  private(set) var failures: [Dimension: Date] = [:]
  private(set) var current: Incident?
  private(set) var history: [Incident] = []
  private(set) var phase: IncidentPhase = .healthy
  private(set) var nextReminder: Date?

  mutating func sample(unhealthy: Set<Dimension>, now: Date) -> [IncidentEffect] {
    let failed = unhealthy.intersection(enabled)
    let oldFailed = Set(failures.keys)
    for dimension in enabled {
      if failed.contains(dimension) {
        if failures[dimension] == nil { failures[dimension] = now }
      } else { failures.removeValue(forKey: dimension) }
    }
    if failed.isEmpty {
      guard var incident = current else { phase = .healthy; return [] }
      incident.end = now
      history.append(incident)
      current = nil
      nextReminder = nil
      phase = .recovered
      return [.cancelReminders]
    }
    if current == nil {
      current = Incident(start: now, dimensions: [])
    }
    let dimensions = Array(Set(current?.dimensions ?? []).union(failed)).sorted { $0.rawValue < $1.rawValue }
    current?.dimensions = dimensions
    let qualified = failures.values.contains { now.timeIntervalSince($0) >= timing.grace }
    if qualified && current?.crossedThreshold == false {
      current?.crossedThreshold = true
      nextReminder = now.addingTimeInterval(timing.reminder)
      phase = .alerting
      return [.alert, .updateReminders]
    }
    if current?.crossedThreshold == true {
      phase = current?.acknowledged == true ? .acknowledgedWhileUnhealthy : .alerting
      if oldFailed != failed { return [.updateReminders] }
    } else { phase = .candidateFailure }
    return []
  }
  func health(_ dimension: Dimension, now: Date) -> Health {
    guard enabled.contains(dimension) else { return .disabled }
    guard let since = failures[dimension] else { return .healthy }
    return now.timeIntervalSince(since) >= timing.grace ? .unavailable : .checking
  }
  mutating func acknowledge() -> [IncidentEffect] {
    guard current?.crossedThreshold == true else { return [] }
    current?.acknowledged = true
    nextReminder = nil
    phase = .acknowledgedWhileUnhealthy
    return [.cancelReminders]
  }
  mutating func reminderDates(now: Date, end: Date) -> [Date] {
    guard current?.crossedThreshold == true, current?.acknowledged == false, var next = nextReminder else { return [] }
    // Maintain just two one-shot requests; never schedule beyond the guard end.
    while next <= now { next = next.addingTimeInterval(timing.reminder) }
    nextReminder = next
    return [next, next.addingTimeInterval(timing.reminder)].filter { $0 < end }
  }
  mutating func finish(now: Date) {
    if var incident = current {
      incident.end = now
      history.append(incident)
    }
    current = nil; failures = [:]; nextReminder = nil; phase = .healthy
  }
  var records: [Incident] { history + (current.map { [$0] } ?? []) }
}
enum CoreError: Error { case invalidSettings, invalidEnd, alreadyActive, invalidTransition }
struct GuardLifecycle {
  private(set) var phase: GuardPhase = .idle
  private(set) var start: Date?
  private(set) var end: Date?
  mutating func preflight(ready: Bool?) {
    guard !phase.isActive, phase != .starting, phase != .stopping, phase != .interrupted, phase != .completed else { return }
    phase = ready == nil ? .preflighting : ready == true ? .ready : .idle
  }
  mutating func begin(now: Date, end: Date, settings: GuardSettings) throws {
    guard !phase.isActive, phase != .starting, phase != .stopping else { throw CoreError.alreadyActive }
    guard settings.valid else { throw CoreError.invalidSettings }
    guard Self.validEnd(now: now, end: end) else { throw CoreError.invalidEnd }
    start = now; self.end = end; phase = .starting
  }
  mutating func didStart() throws {
    guard phase == .starting else { throw CoreError.invalidTransition }
    phase = .activeHealthy
  }
  mutating func sample(_ incident: IncidentPhase) {
    guard phase.isActive else { return }
    switch incident {
    case .healthy, .recovered: phase = .activeHealthy
    case .candidateFailure: phase = .activeDegraded
    case .alerting, .acknowledgedWhileUnhealthy: phase = .activeIncident
    }
  }
  mutating func stopping() { if phase.isActive || phase == .starting { phase = .stopping } }
  mutating func complete() { phase = .completed }
  mutating func interrupt() { phase = .interrupted }
  mutating func reset() { phase = .idle; start = nil; end = nil }
  static func validEnd(now: Date, end: Date) -> Bool {
    let duration = end.timeIntervalSince(now)
    return duration > 0 && duration <= 86400 && duration.isFinite
  }
}
enum SessionOutcome: String, Codable { case running, completed, stopped, interrupted }
struct GuardSession: Codable {
  var id = UUID().uuidString
  var start: Date
  var scheduledEnd: Date
  var end: Date?
  var lastHeartbeat: Date
  var interruptionReason: String?
  var monitoredSettings: GuardSettings?
  var resumedFrom: String?
  var outcome: SessionOutcome = .running
  var incidents: [Incident] = []
}
struct StoreData: Codable {
  var version = 1
  var settings = GuardSettings()
  var current: GuardSession?
  var terminal: GuardPhase = .idle
  var history: [GuardSession] = []
  func resumableSession(now: Date, requestedID: String? = nil) -> GuardSession? {
    guard current == nil, terminal == .interrupted, let previous = history.last,
      previous.outcome == .interrupted,
      requestedID == nil || requestedID == previous.id,
      GuardLifecycle.validEnd(now: now, end: previous.scheduledEnd) else { return nil }
    return previous
  }
  mutating func recoverOrphan() -> Bool {
    guard var orphan = current else { return false }
    orphan.outcome = .interrupted
    orphan.interruptionReason = "processStopped"
    orphan.end = orphan.lastHeartbeat
    orphan.incidents = orphan.incidents.map { incident in
      var record = incident
      if record.end == nil { record.end = orphan.lastHeartbeat }
      return record
    }
    history.append(orphan)
    current = nil
    terminal = .interrupted
    return true
  }
}
