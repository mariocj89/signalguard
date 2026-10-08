import ExpoModulesCore
import UIKit

public final class SignalGuardModule: Module {
  public func definition() -> ModuleDefinition {
    Name("SignalGuardNative")
    Events("onGuardState")
    OnCreate {
      Task { @MainActor [weak self] in
        GuardCoordinator.shared.startup()
        GuardCoordinator.shared.onChange = { [weak self] state in self?.sendEvent("onGuardState", state) }
      }
    }
    AsyncFunction("getPreflightStatus") { () async -> [String: Any] in await GuardCoordinator.shared.preflight() }
    AsyncFunction("requestNotificationPermission") { () async throws in try await GuardCoordinator.shared.requestPermission() }
    AsyncFunction("startGuard") { (config: StartRecord) async throws -> [String: Any] in
      try await GuardCoordinator.shared.start(end: Date(timeIntervalSince1970: config.end / 1000), internet: config.internet, cellular: config.cellular)
    }
    AsyncFunction("resumeGuard") { () async throws -> [String: Any] in try await GuardCoordinator.shared.resume() }
    AsyncFunction("stopGuard") { () async in await GuardCoordinator.shared.stop() }
    AsyncFunction("getGuardState") { () async -> [String: Any] in await GuardCoordinator.shared.state() }
    AsyncFunction("getHistory") { () async -> [[String: Any]] in await GuardCoordinator.shared.history() }
    AsyncFunction("clearHistory") { () async throws in try await GuardCoordinator.shared.clearHistory() }
    AsyncFunction("getSettings") { () async -> [String: Any] in await GuardCoordinator.shared.settings() }
    AsyncFunction("updateSettings") { (settings: SettingsRecord) async throws in try await GuardCoordinator.shared.updateSettings(internet: settings.internet, cellular: settings.cellular) }
    AsyncFunction("acknowledgeIncident") { () async in await GuardCoordinator.shared.acknowledge() }
    #if DEBUG
    AsyncFunction("simulate") { (action: String) async throws in try await GuardCoordinator.shared.simulate(action) }
    AsyncFunction("setTestTiming") { (enabled: Bool) async throws in try await GuardCoordinator.shared.testTiming(enabled) }
    #endif
  }
}
struct StartRecord: Record {
  @Field var end: Double = 0
  @Field var internet: Bool = true
  @Field var cellular: Bool = true
}
struct SettingsRecord: Record {
  @Field var internet: Bool = true
  @Field var cellular: Bool = true
}
public final class SignalGuardAppDelegateSubscriber: ExpoAppDelegateSubscriber {
  public func applicationDidBecomeActive(_ application: UIApplication) {
    Task { @MainActor in await GuardCoordinator.shared.resumeFromNotificationIfActive() }
  }
  public func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
    // Synchronous registration before application launch finishes; independent of React initialization.
    MainActor.assumeIsolated { GuardCoordinator.shared.startup() }
    return true
  }
}
