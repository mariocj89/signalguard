import CoreTelephony
import Foundation

@MainActor
final class CellularService {
  private let info = CTTelephonyNetworkInfo()
  // Service identifiers remain in memory only. The UI and disk never receive them.
  func registeredServices() -> Set<String> {
    Set((info.serviceCurrentRadioAccessTechnology ?? [:]).filter { !$0.value.isEmpty }.keys)
  }
  func confirmed(baseline: Set<String>) -> Bool {
    !baseline.isEmpty && baseline.isSubset(of: registeredServices())
  }
}
