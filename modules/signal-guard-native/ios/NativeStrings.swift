import Foundation

private final class ResourceAnchor {}
enum NativeStrings {
  private static let bundle: Bundle = {
    let parent = Bundle(for: ResourceAnchor.self)
    if let url = parent.url(forResource: "SignalGuardResources", withExtension: "bundle"), let bundle = Bundle(url: url) {
      let language = Bundle.main.preferredLocalizations.first?.hasPrefix("es") == true ? "es" : "en"
      if let localizedURL = bundle.url(forResource: language, withExtension: "lproj"), let localized = Bundle(url: localizedURL) { return localized }
      return bundle
    }
    return parent
  }()
  static func text(_ key: String, _ arguments: CVarArg...) -> String {
    let value = NSLocalizedString(key, bundle: bundle, value: key, comment: "")
    return String(format: value, locale: Locale.current, arguments: arguments)
  }
  static func clock(_ date: Date) -> String {
    let formatter = DateFormatter()
    formatter.dateStyle = .none
    formatter.timeStyle = .short
    return formatter.string(from: date)
  }
  static func subtitle(internet: Health, cellular: Health, end: Date) -> String {
    func mark(_ health: Health) -> String {
      switch health { case .healthy: return "✓"; case .disabled: return "—"; case .checking: return "…"; default: return "✕" }
    }
    return text("task.subtitle", mark(internet), mark(cellular), clock(end))
  }
}
