import Foundation

// The system activity accepts plain text, so colour is carried by Unicode markers.
enum ActivityPresentation {
  static func mark(_ health: Health) -> String {
    switch health {
    case .healthy: return "🟢 ✓"
    case .checking: return "🟠 …"
    case .unavailable: return "🔴 ✕"
    case .unknown: return "⚪ ?"
    case .disabled: return "—"
    }
  }
}
