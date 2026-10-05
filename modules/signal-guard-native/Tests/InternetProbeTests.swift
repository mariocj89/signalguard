import XCTest
import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif
@testable import SignalGuardCore

private final class ProbeURLProtocol: URLProtocol, @unchecked Sendable {
  struct Fixture { let status: Int; let body: Data }
  static let lock = NSLock()
  static var fixtures: [String: Fixture] = [:]
  static var requests: [URLRequest] = []
  static func reset(_ fixtures: [String: Fixture]) {
    lock.lock(); defer { lock.unlock() }
    self.fixtures = fixtures; requests = []
  }
  static func observed() -> [URLRequest] { lock.lock(); defer { lock.unlock() }; return requests }
  override class func canInit(with request: URLRequest) -> Bool { true }
  override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }
  override func startLoading() {
    Self.lock.lock()
    Self.requests.append(request)
    let fixture = Self.fixtures[request.url!.path]!
    Self.lock.unlock()
    let response = HTTPURLResponse(url: request.url!, statusCode: fixture.status, httpVersion: "HTTP/1.1", headerFields: ["Content-Length": String(fixture.body.count)])!
    client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
    if !fixture.body.isEmpty { client?.urlProtocol(self, didLoad: fixture.body) }
    client?.urlProtocolDidFinishLoading(self)
  }
  override func stopLoading() {}
}
final class InternetProbeTests: XCTestCase {
  func service() -> HTTPSInternetProbeService {
    let configuration = URLSessionConfiguration.ephemeral
    configuration.protocolClasses = [ProbeURLProtocol.self]
    return HTTPSInternetProbeService(endpoints: [
      ProbeEndpoint(url: URL(string: "https://example.invalid/primary")!, status: 204, body: Data()),
      ProbeEndpoint(url: URL(string: "https://example.invalid/fallback")!, status: 200, body: Data("Microsoft Connect Test".utf8))
    ], configuration: configuration)
  }
  func testSuccessfulPrimaryDoesNotUseFallbackAndHasNoIdentifiers() async {
    ProbeURLProtocol.reset(["/primary": .init(status: 204, body: Data())])
    let confirmed = await service().confirmed()
    XCTAssertTrue(confirmed)
    let requests = ProbeURLProtocol.observed()
    XCTAssertEqual(requests.count, 1)
    XCTAssertNil(requests[0].httpBody)
    XCTAssertNil(requests[0].value(forHTTPHeaderField: "Cookie"))
    XCTAssertNil(requests[0].value(forHTTPHeaderField: "Authorization"))
    XCTAssertEqual(requests[0].value(forHTTPHeaderField: "User-Agent"), "ConnectivityCheck")
    XCTAssertNil(requests[0].url?.query)
  }
  func testFallbackConfirmsInternetWhenPrimaryHostFails() async {
    ProbeURLProtocol.reset([
      "/primary": .init(status: 503, body: Data()),
      "/fallback": .init(status: 200, body: Data("Microsoft Connect Test".utf8))
    ])
    let confirmed = await service().confirmed()
    XCTAssertTrue(confirmed)
    XCTAssertEqual(ProbeURLProtocol.observed().map { $0.url!.path }, ["/primary", "/fallback"])
  }
  func testCaptivePortalAndUnexpectedBodyDoNotConfirmInternet() async {
    ProbeURLProtocol.reset([
      "/primary": .init(status: 200, body: Data("<html>Login</html>".utf8)),
      "/fallback": .init(status: 200, body: Data("Please sign in".utf8))
    ])
    let confirmed = await service().confirmed()
    XCTAssertFalse(confirmed)
    XCTAssertEqual(ProbeURLProtocol.observed().count, 2)
  }
  func testOversizedResponseIsRejected() async {
    ProbeURLProtocol.reset([
      "/primary": .init(status: 204, body: Data(repeating: 65, count: 129)),
      "/fallback": .init(status: 200, body: Data(repeating: 65, count: 129))
    ])
    let confirmed = await service().confirmed()
    XCTAssertFalse(confirmed)
  }
}
