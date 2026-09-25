import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const launcherSource = await readFile(new URL("../src-tauri/src/main.rs", import.meta.url), "utf8");
const tauriConfig = JSON.parse(await readFile(new URL("../src-tauri/tauri.conf.json", import.meta.url), "utf8"));
const checkWorkflow = await readFile(new URL("../.github/workflows/check.yml", import.meta.url), "utf8");
const deferredRelease = await readFile(new URL("../docs/release-deferred.md", import.meta.url), "utf8");

test("the macOS launcher uses one instance, serialized lifecycle changes, and a loopback CDP port", () => {
  assert.match(launcherSource, /libc::flock/);
  assert.match(launcherSource, /lifecycle: Mutex/);
  assert.match(launcherSource, /generation: AtomicU64/);
  assert.match(launcherSource, /TcpListener::bind\(\("127\.0\.0\.1", 0\)\)/);
  assert.equal(launcherSource.match(/TcpListener::bind/g)?.length, 1);
  assert.match(launcherSource, /codex_port: Mutex<Option<u16>>/);
  assert.doesNotMatch(launcherSource, /const LAUNCHER_PORT/);
});

test("the 2.0.0 source release has no active desktop release or updater channel", () => {
  assert.equal(tauriConfig.productName, "Naomi Taskboard");
  assert.equal(tauriConfig.version, "2.0.0");
  assert.equal(tauriConfig.bundle.createUpdaterArtifacts, false);
  assert.doesNotMatch(JSON.stringify(tauriConfig), /github\.com|pubkey|latest\.json/i);
  assert.match(checkWorkflow, /Desktop packaging[\s\S]*intentionally deferred/);
  assert.match(deferredRelease, /automatic updates remain disabled/i);
});

test("Windows updater remains explicitly disabled in the launcher", () => {
  assert.match(
    launcherSource,
    /cfg!\(target_os = "windows"\)[\s\S]*?Windows 版本暂不支持自动更新/,
  );
});

test("the launcher minimum system version remains explicit", () => {
  assert.equal(tauriConfig.bundle.macOS.minimumSystemVersion, "14.0");
});
