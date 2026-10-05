const { withInfoPlist, withEntitlementsPlist } = require('expo/config-plugins');
module.exports = function withSignalGuard(config) {
  config = withInfoPlist(config, (mod) => {
    mod.modResults.BGTaskSchedulerPermittedIdentifiers = ['com.etcaterva.signalguard.guard.*'];
    mod.modResults.UIBackgroundModes = ['processing'];
    mod.modResults.CFBundleLocalizations = ['en', 'es'];
    mod.modResults.CFBundleDevelopmentRegion = 'en';
    return mod;
  });
  return withEntitlementsPlist(config, (mod) => {
    mod.modResults['com.apple.developer.usernotifications.time-sensitive'] = true;
    return mod;
  });
};
