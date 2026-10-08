import XCTest
@testable import SignalGuardCore

final class GuardCoreTests: XCTestCase {
  let base = Date(timeIntervalSince1970: 1000)
  func machine() -> IncidentMachine { IncidentMachine(enabled: [.internet, .cellular], timing: .production) }
  func date(_ seconds: Double) -> Date { base.addingTimeInterval(seconds) }

  func testGraceAndThreshold() {
    var sut = machine()
    XCTAssertEqual(sut.sample(unhealthy: [.internet], now: base), [])
    XCTAssertEqual(sut.health(.internet, now: date(59)), .checking)
    XCTAssertEqual(sut.sample(unhealthy: [.internet], now: date(59)), [])
    XCTAssertEqual(sut.sample(unhealthy: [.internet], now: date(60)), [.alert, .updateReminders])
    XCTAssertEqual(sut.health(.internet, now: date(60)), .unavailable)
    XCTAssertEqual(sut.sample(unhealthy: [.internet], now: date(61)), [])
  }
  func testBriefFailureRecordedWithoutAlert() {
    var sut = machine()
    _ = sut.sample(unhealthy: [.cellular], now: base)
    XCTAssertEqual(sut.sample(unhealthy: [], now: date(23)), [.cancelReminders])
    XCTAssertEqual(sut.history.count, 1)
    XCTAssertFalse(sut.history[0].crossedThreshold)
    XCTAssertEqual(sut.history[0].end!.timeIntervalSince(base), 23)
    XCTAssertEqual(sut.health(.cellular, now: date(23)), .healthy)
  }
  func testAcknowledgementAndRecovery() {
    var sut = machine()
    _ = sut.sample(unhealthy: [.internet], now: base)
    _ = sut.sample(unhealthy: [.internet], now: date(60))
    XCTAssertEqual(sut.reminderDates(now: date(60), end: date(1000)), [date(360), date(660)])
    XCTAssertEqual(sut.acknowledge(), [.cancelReminders])
    XCTAssertEqual(sut.phase, .acknowledgedWhileUnhealthy)
    XCTAssertEqual(sut.health(.internet, now: date(61)), .unavailable)
    XCTAssertEqual(sut.reminderDates(now: date(61), end: date(1000)), [])
    XCTAssertEqual(sut.sample(unhealthy: [], now: date(90)), [.cancelReminders])
    XCTAssertTrue(sut.history[0].acknowledged)
    _ = sut.sample(unhealthy: [.internet], now: date(120))
    XCTAssertEqual(sut.sample(unhealthy: [.internet], now: date(180)), [.alert, .updateReminders])
    XCTAssertFalse(sut.current!.acknowledged)
  }
  func testRecoveryCancelsUnacknowledgedReminders() {
    var sut = machine()
    _ = sut.sample(unhealthy: [.internet], now: base)
    _ = sut.sample(unhealthy: [.internet], now: date(60))
    XCTAssertEqual(sut.sample(unhealthy: [], now: date(70)), [.cancelReminders])
    XCTAssertEqual(sut.reminderDates(now: date(70), end: date(1000)), [])
  }
  func testCombinedFailuresProduceOneAlert() {
    var sut = machine()
    _ = sut.sample(unhealthy: [.internet, .cellular], now: base)
    let effects = sut.sample(unhealthy: [.internet, .cellular], now: date(60))
    XCTAssertEqual(effects.filter { $0 == .alert }.count, 1)
    XCTAssertEqual(Set(sut.current!.dimensions), Set([Dimension.internet, .cellular]))
    XCTAssertEqual(sut.sample(unhealthy: [.cellular], now: date(70)), [.updateReminders])
    XCTAssertNotNil(sut.current)
    XCTAssertEqual(sut.sample(unhealthy: [], now: date(80)), [.cancelReminders])
    XCTAssertEqual(sut.history.count, 1)
  }
  func testEachDimensionHasItsOwnGrace() {
    var sut = machine()
    _ = sut.sample(unhealthy: [.internet], now: base)
    _ = sut.sample(unhealthy: [.internet, .cellular], now: date(59))
    _ = sut.sample(unhealthy: [.cellular], now: date(60))
    XCTAssertFalse(sut.current!.crossedThreshold)
    XCTAssertEqual(sut.sample(unhealthy: [.cellular], now: date(119)), [.alert, .updateReminders])
  }
  func testDisabledDimensionsAndReminderBound() {
    var sut = IncidentMachine(enabled: [.cellular], timing: .production)
    _ = sut.sample(unhealthy: [.internet], now: base)
    XCTAssertNil(sut.current)
    XCTAssertEqual(sut.health(.internet, now: base), .disabled)
    _ = sut.sample(unhealthy: [.cellular], now: base)
    _ = sut.sample(unhealthy: [.cellular], now: date(60))
    XCTAssertEqual(sut.reminderDates(now: date(60), end: date(500)), [date(360)])
    XCTAssertEqual(sut.reminderDates(now: date(361), end: date(1000)), [date(660), date(960)])
    sut.finish(now: date(400))
    XCTAssertEqual(sut.reminderDates(now: date(400), end: date(1000)), [])
  }
  func testStartRequiresConfirmationCompletionAndInterruption() throws {
    var sut = GuardLifecycle()
    try sut.begin(now: base, end: date(28800), settings: GuardSettings())
    XCTAssertEqual(sut.phase, .starting)
    XCTAssertFalse(sut.phase.isActive)
    try sut.didStart()
    XCTAssertTrue(sut.phase.isActive)
    XCTAssertThrowsError(try sut.begin(now: base, end: date(28800), settings: GuardSettings()))
    sut.sample(.candidateFailure)
    XCTAssertEqual(sut.phase, .activeDegraded)
    sut.sample(.alerting)
    XCTAssertEqual(sut.phase, .activeIncident)
    sut.stopping()
    sut.complete()
    XCTAssertFalse(sut.phase.isActive)
    sut.sample(.healthy)
    XCTAssertEqual(sut.phase, .completed)
    try sut.begin(now: date(30000), end: date(40000), settings: GuardSettings())
    sut.interrupt()
    XCTAssertEqual(sut.phase, .interrupted)
    XCTAssertFalse(sut.phase.isActive)
    XCTAssertThrowsError(try sut.didStart())
  }
  func testSettingsAnd24HourLimit() {
    XCTAssertFalse(GuardSettings(internet: false, cellular: false).valid)
    XCTAssertTrue(GuardSettings(internet: false, cellular: true).valid)
    XCTAssertTrue(GuardLifecycle.validEnd(now: base, end: date(86400)))
    XCTAssertFalse(GuardLifecycle.validEnd(now: base, end: date(86401)))
    XCTAssertFalse(GuardLifecycle.validEnd(now: base, end: base))
  }
  func testCodableRetainsHistory() throws {
    var data = StoreData()
    data.history = [GuardSession(start: base, scheduledEnd: date(600), end: date(600), lastHeartbeat: date(600), outcome: .completed)]
    let decoded = try JSONDecoder().decode(StoreData.self, from: JSONEncoder().encode(data))
    XCTAssertEqual(decoded.history[0].outcome, .completed)
    XCTAssertEqual(decoded.history[0].end, date(600))
  }
  func testPersistedSessionRecoversAsInterruptedEvenAfterScheduledEnd() {
    var data = StoreData()
    data.current = GuardSession(start: base, scheduledEnd: date(300), lastHeartbeat: date(100), incidents: [Incident(start: date(80), dimensions: [.cellular])])
    XCTAssertTrue(data.recoverOrphan())
    XCTAssertNil(data.current)
    XCTAssertEqual(data.terminal, .interrupted)
    XCTAssertEqual(data.history[0].outcome, .interrupted)
    XCTAssertEqual(data.history[0].end, date(100))
    XCTAssertEqual(data.history[0].incidents[0].end, date(100))
    XCTAssertFalse(data.recoverOrphan())
    XCTAssertEqual(data.history.count, 1)
  }
  func testAtomicPersistenceAndCorruptStorageFailsClosed() throws {
    let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
    defer { try? FileManager.default.removeItem(at: directory) }
    let store = LocalStore(url: directory.appendingPathComponent("history.json"))
    XCTAssertEqual(try store.load().history.count, 0)
    var data = StoreData()
    data.settings = GuardSettings(internet: true, cellular: false)
    data.current = GuardSession(start: base, scheduledEnd: date(600), lastHeartbeat: date(60))
    try store.save(data)
    let restored = try store.load()
    XCTAssertEqual(restored.settings, data.settings)
    XCTAssertEqual(restored.current?.lastHeartbeat, date(60))
    try Data("not valid JSON".utf8).write(to: store.url)
    XCTAssertThrowsError(try store.load())
  }

  func testInterruptionReasonSurvivesPersistenceAndOlderHistoryStillDecodes() throws {
    let session = GuardSession(start: base, scheduledEnd: date(28800), lastHeartbeat: date(14400), interruptionReason: "taskExpired", outcome: .interrupted)
    let bytes = try JSONEncoder().encode(session)
    let restored = try JSONDecoder().decode(GuardSession.self, from: bytes)
    XCTAssertEqual(restored.interruptionReason, "taskExpired")
    var old = try XCTUnwrap(JSONSerialization.jsonObject(with: bytes) as? [String: Any])
    old.removeValue(forKey: "interruptionReason")
    let legacy = try JSONDecoder().decode(GuardSession.self, from: JSONSerialization.data(withJSONObject: old))
    XCTAssertNil(legacy.interruptionReason)
    var data = StoreData()
    data.current = GuardSession(start: base, scheduledEnd: date(28800), lastHeartbeat: date(14400))
    XCTAssertTrue(data.recoverOrphan())
    XCTAssertEqual(data.history.last?.interruptionReason, "processStopped")
  }

  func testClockJumpsFailSafelyButNormalElapsedTimeAndMidnightDoNot() {
    XCTAssertTrue(GuardClock.consistent(wallStart: base, now: date(60), elapsed: 60))
    XCTAssertTrue(GuardClock.consistent(wallStart: base, now: date(86400), elapsed: 86400))
    XCTAssertFalse(GuardClock.consistent(wallStart: base, now: date(-1200), elapsed: 60))
    XCTAssertFalse(GuardClock.consistent(wallStart: base, now: date(1800), elapsed: 60))
  }

  func testActivityMarkersKeepUnknownAndDisabledDistinctFromConfirmedConnectivity() {
    XCTAssertEqual(ActivityPresentation.mark(.healthy), "🟢")
    XCTAssertEqual(ActivityPresentation.mark(.checking), "🟠")
    XCTAssertEqual(ActivityPresentation.mark(.unavailable), "🔴")
    XCTAssertEqual(ActivityPresentation.mark(.unknown), "⚪")
    XCTAssertEqual(ActivityPresentation.mark(.disabled), "—")
  }
  func testResumeRetainsEndAndSettingsAndRejectsExpiredOrStaleRequests() throws {
    var data = StoreData()
    let selected = GuardSettings(internet: false, cellular: true)
    var interrupted = GuardSession(start: base, scheduledEnd: date(28800), lastHeartbeat: date(14400), monitoredSettings: selected)
    interrupted.end = date(14400); interrupted.outcome = .interrupted
    data.history = [interrupted]; data.terminal = .interrupted
    let resumable = try XCTUnwrap(data.resumableSession(now: date(15000), requestedID: interrupted.id))
    XCTAssertEqual(resumable.scheduledEnd, date(28800))
    XCTAssertEqual(resumable.monitoredSettings, selected)
    XCTAssertNil(data.resumableSession(now: date(28800)))
    XCTAssertNil(data.resumableSession(now: date(15000), requestedID: "old-notification"))
    data.current = GuardSession(start: date(15000), scheduledEnd: resumable.scheduledEnd, lastHeartbeat: date(15000), monitoredSettings: selected, resumedFrom: resumable.id)
    XCTAssertNil(data.resumableSession(now: date(16000)))
    let encoded = try JSONEncoder().encode(data)
    let decoded = try JSONDecoder().decode(StoreData.self, from: encoded)
    XCTAssertEqual(decoded.current?.resumedFrom, interrupted.id)
    XCTAssertEqual(decoded.current?.monitoredSettings, selected)
  }

}
