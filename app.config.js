// Browser inspection is an explicit local-only testing surface; EAS remains iPhone only.
module.exports = ({ config }) => ({
  ...config,
  platforms: process.env.SIGNALGUARD_INSPECTION === '1' && process.env.EAS_BUILD !== 'true'
    ? ['ios', 'web']
    : ['ios'],
});
