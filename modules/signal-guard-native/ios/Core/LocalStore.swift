import Foundation

final class LocalStore {
  let url: URL
  init(url: URL) { self.url = url }
  func load() throws -> StoreData {
    guard FileManager.default.fileExists(atPath: url.path) else { return StoreData() }
    let decoder = JSONDecoder()
    decoder.dateDecodingStrategy = .millisecondsSince1970
    let result = try decoder.decode(StoreData.self, from: Data(contentsOf: url))
    guard result.version == 1 else { throw CocoaError(.fileReadCorruptFile) }
    return result
  }
  func save(_ data: StoreData) throws {
    try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
    let encoder = JSONEncoder()
    encoder.dateEncodingStrategy = .millisecondsSince1970
    encoder.outputFormatting = [.sortedKeys]
    #if os(iOS)
    try encoder.encode(data).write(to: url, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
    var excluded = url.deletingLastPathComponent()
    var values = URLResourceValues()
    values.isExcludedFromBackup = true
    try excluded.setResourceValues(values)
    #else
    try encoder.encode(data).write(to: url, options: .atomic)
    #endif
  }
}
