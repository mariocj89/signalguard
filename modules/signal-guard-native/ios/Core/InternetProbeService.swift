import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

protocol InternetProbeService {
  func confirmed() async -> Bool
}
struct ProbeEndpoint {
  let url: URL
  let status: Int
  let body: Data
}
// A bounded delegate rejects redirects and responses over 128 bytes, including captive portals.
// The one ephemeral URLSession is reused. No cookies, credentials, cache, or identifiers.
final class HTTPSInternetProbeService: NSObject, InternetProbeService, URLSessionDataDelegate, URLSessionTaskDelegate, @unchecked Sendable {
  private struct Pending {
    let endpoint: ProbeEndpoint
    let continuation: CheckedContinuation<Bool, Never>
    var body = Data()
    var statusMatches = false
  }
  private let lock = NSLock()
  private var pending: [Int: Pending] = [:]
  private var session: URLSession!
  private let endpoints: [ProbeEndpoint]
  init(endpoints: [ProbeEndpoint] = [
    ProbeEndpoint(url: URL(string: "https://www.google.com/generate_204")!, status: 204, body: Data()),
    ProbeEndpoint(url: URL(string: "https://www.msftconnecttest.com/connecttest.txt")!, status: 200, body: Data("Microsoft Connect Test".utf8))
  ], configuration: URLSessionConfiguration = .ephemeral) {
    self.endpoints = endpoints
    super.init()
    configuration.timeoutIntervalForRequest = 5
    configuration.timeoutIntervalForResource = 6
    configuration.httpCookieStorage = nil
    configuration.httpShouldSetCookies = false
    configuration.urlCredentialStorage = nil
    configuration.urlCache = nil
    configuration.requestCachePolicy = .reloadIgnoringLocalCacheData
    configuration.httpAdditionalHeaders = ["User-Agent": "ConnectivityCheck", "Accept": "text/plain"]
    #if os(iOS)
    configuration.waitsForConnectivity = false
    #endif
    session = URLSession(configuration: configuration, delegate: self, delegateQueue: nil)
  }
  func confirmed() async -> Bool {
    for endpoint in endpoints {
      if await probe(endpoint) { return true }
    }
    return false
  }
  private func probe(_ endpoint: ProbeEndpoint) async -> Bool {
    await withCheckedContinuation { continuation in
      var request = URLRequest(url: endpoint.url)
      request.httpMethod = "GET"
      request.setValue("ConnectivityCheck", forHTTPHeaderField: "User-Agent")
      request.setValue("text/plain", forHTTPHeaderField: "Accept")
      let task = session.dataTask(with: request)
      lock.lock()
      pending[task.taskIdentifier] = Pending(endpoint: endpoint, continuation: continuation)
      lock.unlock()
      task.resume()
    }
  }
  func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive response: URLResponse, completionHandler: @escaping (URLSession.ResponseDisposition) -> Void) {
    lock.lock()
    let valid = (response as? HTTPURLResponse)?.statusCode == pending[dataTask.taskIdentifier]?.endpoint.status && response.expectedContentLength <= 128
    pending[dataTask.taskIdentifier]?.statusMatches = valid
    lock.unlock()
    completionHandler(valid ? .allow : .cancel)
  }
  func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive data: Data) {
    lock.lock()
    let tooLarge = (pending[dataTask.taskIdentifier]?.body.count ?? 0) + data.count > 128
    if !tooLarge { pending[dataTask.taskIdentifier]?.body.append(data) }
    lock.unlock()
    if tooLarge { dataTask.cancel() }
  }
  func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
    lock.lock()
    let result = pending.removeValue(forKey: task.taskIdentifier)
    lock.unlock()
    guard let result else { return }
    result.continuation.resume(returning: error == nil && result.statusMatches && result.body == result.endpoint.body)
  }
  func urlSession(_ session: URLSession, task: URLSessionTask, willPerformHTTPRedirection response: HTTPURLResponse, newRequest request: URLRequest, completionHandler: @escaping (URLRequest?) -> Void) { completionHandler(nil) }
}
