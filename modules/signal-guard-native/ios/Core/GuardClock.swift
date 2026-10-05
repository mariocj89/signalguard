import Foundation

struct GuardClock {
  let wallStart: Date
  private let clock = ContinuousClock()
  private let instant = ContinuousClock().now
  init(wallStart: Date) { self.wallStart = wallStart }
  var elapsed: TimeInterval {
    let components = instant.duration(to: clock.now).components
    return Double(components.seconds) + Double(components.attoseconds) / 1e18
  }
  func consistent(now: Date) -> Bool {
    Self.consistent(wallStart: wallStart, now: now, elapsed: elapsed)
  }
  static func consistent(wallStart: Date, now: Date, elapsed: TimeInterval) -> Bool {
    // Significant clock jumps invalidate the selected end time and wall-clock incident timestamps.
    // Fail safely rather than extending a guard or claiming a stale heartbeat is fresh.
    abs(now.timeIntervalSince(wallStart) - elapsed) <= 5
  }
}
