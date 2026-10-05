// swift-tools-version: 5.9
import PackageDescription
let package = Package(
  name: "SignalGuardCore",
  products: [.library(name: "SignalGuardCore", targets: ["SignalGuardCore"])],
  targets: [
    .target(name: "SignalGuardCore", path: "ios/Core"),
    .testTarget(name: "SignalGuardCoreTests", dependencies: ["SignalGuardCore"], path: "Tests")
  ]
)
