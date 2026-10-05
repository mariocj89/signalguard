Pod::Spec.new do |s|
  s.name = 'SignalGuardNative'
  s.version = '1.0.0'
  s.summary = 'Local native SignalGuard monitoring engine'
  s.description = 'Foreground-started, native continued processing with a local notification watchdog.'
  s.author = 'Et Caterva'
  s.homepage = 'https://expo.dev'
  s.license = { :type => 'MIT' }
  s.source = { :git => '' }
  s.platforms = { :ios => '26.0' }
  s.swift_version = '5.9'
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.frameworks = 'BackgroundTasks', 'Network', 'CoreTelephony', 'UserNotifications'
  s.source_files = '**/*.swift'
  s.resource_bundles = { 'SignalGuardResources' => ['Resources/**/*'] }
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES', 'SWIFT_STRICT_CONCURRENCY' => 'minimal' }
end
