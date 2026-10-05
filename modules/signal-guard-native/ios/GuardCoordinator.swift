import BackgroundTasks
import Foundation
import Network
import UIKit

struct GuardFailure: LocalizedError {
  let code: String
  var errorDescription: String? { code }
}
@MainActor
final class GuardCoordinator {
  static let shared = GuardCoordinator()
  // The Info.plist permits guard.*; use an exact concrete launch identifier to avoid wildcard
  // handler matching issues on early iOS 26 releases. Only one guard exists at a time.
  static let identifier = "com.etcaterva.signalguard.guard.session"
  private var registered = false
  private var startupDone = false
  private var task: BGContinuedProcessingTask?
  private var life = GuardLifecycle()
  private var data = StoreData()
  private let store: LocalStore
  private var storageOK = true
  private let notifications = LocalNotificationService()
  private let probe: InternetProbeService
  private let cellular = CellularService()
  private var baseline: Set<String> = []
  private var machine: IncidentMachine?
  private var timer: DispatchSourceTimer?
  private var endWork: DispatchWorkItem?
  private var pathMonitor: NWPathMonitor?
  private var pathSatisfied: Bool?
  private var internetConfirmed = false
  private var nextProbe = Date.distantPast
  private var sampling = false
  private var inFlightHeartbeats = 0
  private var finalizing = false
  private var epoch = UUID()
  private var pendingStart: CheckedContinuation<[String: Any], Error>?
  private var timing = Timing.production
  private var lastConfirmed: Date?
  private var lastConnectivityConfirmed: Date?
  private var guardClock: GuardClock?
  private var failureCode: String?
  var onChange: (([String: Any]) -> Void)?
  #if DEBUG
  private var simulated: Set<Dimension>?
  #endif

  private init(probe: InternetProbeService = HTTPSInternetProbeService()) {
    self.probe = probe
    let directory = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0].appendingPathComponent("SignalGuard", isDirectory: true)
    store = LocalStore(url: directory.appendingPathComponent("history.json"))
    do { data = try store.load() } catch { storageOK = false; failureCode = "storageUnavailable" }
  }
  func startup() {
    guard !startupDone else { return }
    startupDone = true
    notifications.configure()
    registered = BGTaskScheduler.shared.register(forTaskWithIdentifier: Self.identifier, using: .main) { backgroundTask in
      Task { @MainActor in
        guard let continued = backgroundTask as? BGContinuedProcessingTask else {
          backgroundTask.setTaskCompleted(success: false)
          return
        }
        await self.accept(continued)
      }
    }
    // A persisted running session never proves a running task in this new process.
    if data.recoverOrphan() {
      life.interrupt()
      failureCode = "monitorInterrupted"
      save()
      notifications.cancelReminders()
      // Leave the already-scheduled dead-man switch intact. Never silently submit a new task.
    } else if data.terminal == .interrupted { life.interrupt() }
    else if data.terminal == .completed { life.complete() }
    let staleIncidentIDs = Set(data.history.flatMap { $0.incidents.map { $0.id } })
    Task { await notifications.cancelPersistedIncidentNotifications(incidentIDs: staleIncidentIDs) }
  }

  func preflight() async -> [String: Any] {
    startup()
    life.preflight(ready: nil)
    emit()
    let settings = data.settings
    let net = settings.internet ? await probe.confirmed() : false
    let readiness = await notifications.readiness()
    let cell = !cellular.registeredServices().isEmpty
    guard settings == data.settings else { return await preflight() }
    var issues: [String] = []
    if !settings.valid { issues.append("conditionsRequired") }
    if settings.internet && !net { issues.append("internetUnavailable") }
    if settings.cellular && !cell { issues.append("cellularUnavailable") }
    if !readiness.notifications { issues.append("notificationsRequired") }
    if !readiness.timeSensitive && !readiness.undetermined { issues.append("timeSensitiveRequired") }
    if !storageOK { issues.append("storageUnavailable") }
    if !registered { issues.append("taskUnavailable") }
    life.preflight(ready: issues.isEmpty)
    emit()
    return ["ready": issues.isEmpty, "internet": net, "cellular": cell,
            "notifications": readiness.notifications, "timeSensitive": readiness.timeSensitive,
            "permissionUndetermined": readiness.undetermined, "issues": issues]
  }
  func requestPermission() async throws { try await notifications.requestPermission() }
  func settings() -> [String: Any] { ["internet": data.settings.internet, "cellular": data.settings.cellular] }
  func updateSettings(internet: Bool, cellular: Bool) throws {
    guard !life.phase.isActive, life.phase != .starting, life.phase != .stopping else { throw GuardFailure(code: "settingsLocked") }
    let settings = GuardSettings(internet: internet, cellular: cellular)
    guard settings.valid else { throw GuardFailure(code: "conditionsRequired") }
    data.settings = settings
    guard save() else { throw GuardFailure(code: "storageUnavailable") }
    emit()
  }
  func start(end: Date, internet: Bool, cellular: Bool) async throws -> [String: Any] {
    startup()
    guard UIApplication.shared.applicationState == .active else { throw GuardFailure(code: "foregroundRequired") }
    guard !finalizing, inFlightHeartbeats == 0, pendingStart == nil, task == nil, !life.phase.isActive, life.phase != .starting else { throw GuardFailure(code: "alreadyActive") }
    let settings = GuardSettings(internet: internet, cellular: cellular)
    guard settings == data.settings else { throw GuardFailure(code: "settingsChanged") }
    guard settings.valid else { throw GuardFailure(code: "conditionsRequired") }
    guard GuardLifecycle.validEnd(now: Date(), end: end) else { throw GuardFailure(code: "invalidEnd") }
    // Mark starting before any await to exclude double submissions.
    try life.begin(now: Date(), end: end, settings: settings)
    failureCode = nil
    let generation = UUID()
    epoch = generation
    emit()
    let result = await preflight()
    guard epoch == generation, life.phase == .starting else { throw GuardFailure(code: "startFailed") }
    guard result["ready"] as? Bool == true else {
      life.reset(); emit(); throw GuardFailure(code: "preflightFailed")
    }
    guard UIApplication.shared.applicationState == .active, GuardLifecycle.validEnd(now: Date(), end: end) else {
      life.reset(); emit(); throw GuardFailure(code: "foregroundRequired")
    }
    baseline = self.cellular.registeredServices()
    if settings.cellular && baseline.isEmpty {
      life.reset(); emit(); throw GuardFailure(code: "cellularUnavailable")
    }
    notifications.resetIncidentTracking()
    lastConnectivityConfirmed = nil
    machine = IncidentMachine(enabled: settings.enabled, timing: timing)
    let now = Date()
    guardClock = GuardClock(wallStart: now)
    data.current = GuardSession(start: now, scheduledEnd: end, lastHeartbeat: now)
    data.terminal = .starting
    guard save() else { life.reset(); emit(); throw GuardFailure(code: "storageUnavailable") }
    let request = BGContinuedProcessingTaskRequest(identifier: Self.identifier, title: NativeStrings.text("task.title"), subtitle: NativeStrings.text("task.starting"))
    request.strategy = .fail
    // Deliberately no network/resource requirement: we must keep running to detect loss.
    return try await withCheckedThrowingContinuation { continuation in
      pendingStart = continuation
      do { try BGTaskScheduler.shared.submit(request) }
      catch { failStart("startFailed"); return }
      DispatchQueue.main.asyncAfter(deadline: .now() + 15) {
        if self.epoch == generation && self.pendingStart != nil {
          // Never show active after only a successful submit() or after a delayed callback.
          BGTaskScheduler.shared.cancel(taskRequestWithIdentifier: Self.identifier)
          if self.task != nil {
            Task { @MainActor in await self.interrupt(code: "startFailed") }
          } else { self.failStart("startFailed") }
        }
      }
    }
  }
  private func failStart(_ code: String) {
    epoch = UUID()
    data.current = nil
    data.terminal = .idle
    life.reset(); failureCode = code
    machine = nil; baseline = []; lastConfirmed = nil
    save()
    let continuation = pendingStart; pendingStart = nil
    continuation?.resume(throwing: GuardFailure(code: code))
    emit()
  }
  private func accept(_ continued: BGContinuedProcessingTask) async {
    guard life.phase == .starting, pendingStart != nil, let session = data.current, task == nil else {
      continued.setTaskCompleted(success: false); return
    }
    let generation = epoch
    task = continued
    continued.expirationHandler = {
      Task { @MainActor in
        if self.epoch == generation { await self.interrupt(code: "monitorInterrupted") }
      }
    }
    continued.progress.totalUnitCount = max(1, Int64(ceil(session.scheduledEnd.timeIntervalSince(session.start))))
    continued.progress.completedUnitCount = 0
    pathMonitor = NWPathMonitor()
    pathMonitor?.pathUpdateHandler = { path in
      let satisfied = path.status == .satisfied
      Task { @MainActor in
        guard self.epoch == generation else { return }
        self.pathSatisfied = satisfied
        self.nextProbe = .distantPast
        await self.heartbeat()
      }
    }
    pathMonitor?.start(queue: DispatchQueue(label: "com.etcaterva.signalguard.path", qos: .utility))
    // The first successful heartbeat installs the watchdog before resolving start().
    await heartbeat()
    guard epoch == generation, task != nil else { return }
    if pendingStart != nil {
      guard lastConfirmed != nil else { await interrupt(code: "startFailed"); return }
      do { try life.didStart() } catch { await interrupt(code: "startFailed"); return }
      if let machine { life.sample(machine.phase) }
      let continuation = pendingStart; pendingStart = nil
      emit()
      continuation?.resume(returning: snapshot())
    }
    let timer = DispatchSource.makeTimerSource(queue: .main)
    timer.schedule(deadline: .now() + timing.heartbeat, repeating: timing.heartbeat, leeway: .seconds(1))
    timer.setEventHandler { Task { @MainActor in if self.epoch == generation { await self.heartbeat() } } }
    self.timer = timer
    timer.resume()
    let work = DispatchWorkItem {
      Task { @MainActor in if self.epoch == generation { await self.finish(normal: true) } }
    }
    endWork = work
    DispatchQueue.main.asyncAfter(deadline: .now() + max(0, session.scheduledEnd.timeIntervalSinceNow), execute: work)
  }

  private func heartbeat() async {
    guard task != nil, let session = data.current else { return }
    if guardClock?.consistent(now: Date()) == false { await interrupt(code: "clockChanged"); return }
    if pendingStart == nil && Date().timeIntervalSince(session.lastHeartbeat) >= timing.watchdog {
      await interrupt(code: "monitorInterrupted"); return
    }
    if Date() >= session.scheduledEnd { await finish(normal: true); return }
    guard !sampling else { return }
    sampling = true
    inFlightHeartbeats += 1
    let generation = epoch
    defer {
      inFlightHeartbeats -= 1
      if epoch == generation { sampling = false }
    }
    let readiness = await notifications.readiness()
    guard epoch == generation, task != nil else { return }
    guard readiness.ready else { await interrupt(code: "notificationsChanged"); return }
    let now = Date()
    if nextProbe <= now {
      if pathSatisfied == false { internetConfirmed = false }
      else if data.settings.internet { internetConfirmed = await probe.confirmed() }
      nextProbe = Date().addingTimeInterval(timing.probe)
    }
    guard epoch == generation, task != nil, var incidentMachine = machine else { return }
    if Date() >= session.scheduledEnd { await finish(normal: true); return }
    var failed: Set<Dimension> = []
    if data.settings.internet && !internetConfirmed { failed.insert(.internet) }
    if data.settings.cellular && !cellular.confirmed(baseline: baseline) { failed.insert(.cellular) }
    #if DEBUG
    if let simulated { failed = simulated }
    #endif
    let confirmedAt = Date()
    if guardClock?.consistent(now: confirmedAt) == false { await interrupt(code: "clockChanged"); return }
    if pendingStart == nil && confirmedAt.timeIntervalSince(session.lastHeartbeat) >= timing.watchdog {
      await interrupt(code: "monitorInterrupted"); return
    }
    if pendingStart != nil && confirmedAt.timeIntervalSince(session.start) > 15 {
      await interrupt(code: "startFailed"); return
    }
    let effects = incidentMachine.sample(unhealthy: failed, now: confirmedAt)
    machine = incidentMachine
    if life.phase.isActive { life.sample(incidentMachine.phase) }
    // Confirm engine operation independently of whether connectivity is healthy.
    do {
      try await notifications.refreshWatchdog(delay: timing.watchdog)
      guard epoch == generation, task != nil else {
        // A stop/expiration may have raced add(); ensure it cannot resurrect a cancelled watchdog.
        if life.phase != .interrupted { notifications.cancelGuardNotifications() }
        return
      }
      data.current?.lastHeartbeat = confirmedAt
      data.current?.incidents = machine?.records ?? incidentMachine.records
      guard save() else { await interrupt(code: "storageUnavailable"); return }
      lastConfirmed = confirmedAt
      if failed.isEmpty { lastConnectivityConfirmed = confirmedAt }
      if effects.contains(.cancelReminders) { notifications.cancelReminders() }
      if effects.contains(.alert), let incident = machine?.current {
        try await notifications.alert(incident: incident, dimensions: Set(machine?.failures.keys.map { $0 } ?? []))
      }
      guard epoch == generation, task != nil else { return }
      if var currentMachine = machine, let incident = currentMachine.current, !incident.acknowledged {
        // Plan two deadlines, but submit only near-term reminders. A killed monitor should not
        // leave five/ten-minute stale outage messages behind its 90-second watchdog warning.
        let dates = currentMachine.reminderDates(now: Date(), end: session.scheduledEnd)
          .filter { $0.timeIntervalSinceNow <= timing.heartbeat * 2 }
        machine = currentMachine
        try await notifications.reminders(incident: incident, dates: dates, dimensions: Set(machine?.failures.keys.map { $0 } ?? []))
        // Revalidate after every awaited scheduling operation: recovery/ack/stop can race add().
        if epoch != generation || machine?.current?.id != incident.id || machine?.current?.acknowledged == true {
          notifications.cancelReminders()
        }
        if epoch != generation && life.phase != .interrupted { notifications.cancelGuardNotifications() }
      }
      guard epoch == generation, let task else { return }
      if Date().timeIntervalSince(confirmedAt) >= timing.watchdog {
        await interrupt(code: "monitorInterrupted"); return
      }
      task.progress.completedUnitCount = min(task.progress.totalUnitCount, max(0, Int64(Date().timeIntervalSince(session.start))))
      task.updateTitle(NativeStrings.text("task.title"), subtitle: NativeStrings.subtitle(internet: machine?.health(.internet, now: Date()) ?? .unknown, cellular: machine?.health(.cellular, now: Date()) ?? .unknown))
      emit()
    } catch { if epoch == generation { await interrupt(code: "notificationSchedulingFailed") } }
  }

  func stop() async { await finish(normal: false) }
  private func cancelRuntime() {
    timer?.cancel(); timer = nil
    endWork?.cancel(); endWork = nil
    pathMonitor?.cancel(); pathMonitor = nil; pathSatisfied = nil
    baseline = []; sampling = false; guardClock = nil
    epoch = UUID()
  }
  private func finish(normal: Bool) async {
    guard task != nil || pendingStart != nil else { return }
    if normal && guardClock?.consistent(now: Date()) == false { await interrupt(code: "clockChanged"); return }
    if normal, let heartbeat = data.current?.lastHeartbeat, Date().timeIntervalSince(heartbeat) >= timing.watchdog {
      await interrupt(code: "monitorInterrupted"); return
    }
    finalizing = true
    defer { finalizing = false }
    life.stopping(); emit()
    let continued = task
    task = nil
    cancelRuntime()
    let ended = normal ? (data.current?.scheduledEnd ?? Date()) : Date()
    machine?.finish(now: ended)
    if var session = data.current {
      session.end = ended
      session.outcome = normal ? .completed : .stopped
      session.incidents = machine?.records ?? session.incidents
      data.history.append(session)
    }
    data.current = nil
    data.terminal = normal ? .completed : .idle
    notifications.cancelGuardNotifications()
    BGTaskScheduler.shared.cancel(taskRequestWithIdentifier: Self.identifier)
    let saved = save()
    if normal && saved {
      continued?.progress.completedUnitCount = continued?.progress.totalUnitCount ?? 1
      continued?.setTaskCompleted(success: true)
      life.complete()
      do { try await notifications.completed(end: ended) }
      catch { failureCode = "completionNotificationFailed" }
    } else {
      continued?.setTaskCompleted(success: saved)
      if saved { life.reset() } else { life.interrupt(); failureCode = "storageUnavailable" }
    }
    let continuation = pendingStart; pendingStart = nil
    continuation?.resume(throwing: GuardFailure(code: "startFailed"))
    machine = nil; lastConfirmed = nil
    emit()
  }
  private func interrupt(code: String) async {
    guard task != nil || pendingStart != nil else { return }
    finalizing = true
    defer { finalizing = false }
    let continued = task; task = nil
    cancelRuntime()
    let ended = Date()
    machine?.finish(now: ended)
    if var session = data.current {
      session.end = ended
      session.outcome = .interrupted
      session.incidents = machine?.records ?? session.incidents
      data.history.append(session)
    }
    data.current = nil; data.terminal = .interrupted
    life.interrupt(); failureCode = code
    save()
    notifications.cancelReminders()
    continued?.setTaskCompleted(success: false)
    let continuation = pendingStart; pendingStart = nil
    continuation?.resume(throwing: GuardFailure(code: code))
    emit()
    // If code is still running, warn promptly. On SIGKILL the existing pending watchdog does this.
    try? await notifications.refreshWatchdog(delay: 1)
  }
  func state() async -> [String: Any] {
    if task != nil && guardClock?.consistent(now: Date()) == false { await interrupt(code: "clockChanged") }
    if task != nil, let heartbeat = data.current?.lastHeartbeat, Date().timeIntervalSince(heartbeat) >= timing.watchdog {
      await interrupt(code: "monitorInterrupted")
    }
    return snapshot()
  }
  func history() -> [[String: Any]] { data.history.reversed().map { encode($0) } }
  func clearHistory() throws {
    data.history = []
    guard save() else { throw GuardFailure(code: "storageUnavailable") }
  }
  func acknowledge(incidentID: String? = nil) async {
    guard machine?.current?.crossedThreshold == true, incidentID == nil || incidentID == machine?.current?.id else { return }
    _ = machine?.acknowledge()
    notifications.cancelReminders()
    data.current?.incidents = machine?.records ?? []
    if !save() { await interrupt(code: "storageUnavailable"); return }
    emit()
  }
  @discardableResult
  private func save() -> Bool {
    data.history = Array(data.history.suffix(200))
    do { try store.save(data); storageOK = true; return true }
    catch { storageOK = false; failureCode = "storageUnavailable"; return false }
  }
  private func encode<T: Encodable>(_ value: T) -> [String: Any] {
    let encoder = JSONEncoder(); encoder.dateEncodingStrategy = .millisecondsSince1970
    guard let bytes = try? encoder.encode(value), let json = try? JSONSerialization.jsonObject(with: bytes) as? [String: Any] else { return [:] }
    return json
  }
  private func snapshot() -> [String: Any] {
    let now = Date()
    let session = data.current
    let recent = data.history.last
    let monitoring = task != nil && life.phase.isActive && lastConfirmed.map { now.timeIntervalSince($0) < timing.watchdog } == true
    var result: [String: Any] = [
      "phase": life.phase.rawValue, "monitoring": monitoring,
      "internet": machine?.health(.internet, now: now).rawValue ?? "unknown",
      "cellular": machine?.health(.cellular, now: now).rawValue ?? "unknown",
      "settings": settings()
    ]
    if let start = session?.start ?? recent?.start { result["start"] = start.timeIntervalSince1970 * 1000 }
    if let end = session?.scheduledEnd ?? recent?.scheduledEnd { result["end"] = end.timeIntervalSince1970 * 1000 }
    if let lastConnectivityConfirmed {
      result["lastConfirmed"] = lastConnectivityConfirmed.timeIntervalSince1970 * 1000
      result["lastConfirmationRecent"] = now.timeIntervalSince(lastConnectivityConfirmed) < 45
    }
    #if DEBUG
    result["simulationActive"] = simulated != nil
    result["testTimingActive"] = timing.grace != Timing.production.grace
    #endif
    if let incident = machine?.current { result["incident"] = encode(incident) }
    if let failureCode { result["error"] = failureCode }
    return result
  }
  private func emit() { onChange?(snapshot()) }

  #if DEBUG
  func simulate(_ action: String) async throws {
    guard task != nil, life.phase.isActive else { throw GuardFailure(code: "guardRequired") }
    switch action {
    case "internet": simulated = [.internet]
    case "cellular": simulated = [.cellular]
    case "both": simulated = [.internet, .cellular]
    case "recovery": simulated = []
    case "real": simulated = nil
    case "interruption":
      // Mimic losing runtime: keep the PRE-SCHEDULED watchdog, rather than adding an immediate alert.
      let continued = task; task = nil; cancelRuntime(); life.interrupt()
      if var session = data.current {
        let ended = Date()
        machine?.finish(now: ended)
        session.end = ended; session.outcome = .interrupted
        session.incidents = machine?.records ?? session.incidents
        data.history.append(session)
      }
      data.current = nil; data.terminal = .interrupted; save()
      notifications.cancelReminders()
      continued?.setTaskCompleted(success: false); emit()
      return
    case "completion": data.current?.scheduledEnd = Date(); await finish(normal: true); return
    default: throw GuardFailure(code: "invalidSimulation")
    }
    nextProbe = .distantPast
    await heartbeat()
  }
  func testTiming(_ enabled: Bool) throws {
    guard task == nil, pendingStart == nil, life.phase != .starting, life.phase != .stopping else { throw GuardFailure(code: "settingsLocked") }
    timing = enabled ? .test : .production
    simulated = nil
    emit()
  }
  #endif
}
