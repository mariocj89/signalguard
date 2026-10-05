import { readdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const local = '.tools/swift-6.0.3-RELEASE-ubuntu20.04/usr/bin/swift';
const binary = process.env.SWIFT_BIN || (existsSync(local) ? local : 'swift');
const result = spawnSync(binary, ['test', '--package-path', 'modules/signal-guard-native'], { stdio: 'inherit' });
if (result.error) {
  console.error('Swift is required for core tests. See docs/DEVELOPMENT.md for the Linux toolchain command.');
  process.exit(1);
}
if (result.status !== 0) process.exit(result.status ?? 1);
const compiler = binary === 'swift' ? 'swiftc' : binary.replace(/swift$/, 'swiftc');
const directory = 'modules/signal-guard-native/ios';
const sources = readdirSync(directory).filter((name) => name.endsWith('.swift')).map((name) => directory + '/' + name);
const parsed = spawnSync(compiler, ['-frontend', '-parse', ...sources], { stdio: 'inherit' });
if (parsed.error) { console.error(parsed.error.message); process.exit(1); }
process.exit(parsed.status ?? 1);
