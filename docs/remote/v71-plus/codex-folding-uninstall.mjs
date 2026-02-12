#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

function die(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function log(message) {
  process.stdout.write(`${message}\n`);
}

function parseArgs(argv) {
  const args = { extDir: null, strictTarget: true };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--extDir") args.extDir = argv[++i] ?? null;
    else if (a === "--strictTarget") args.strictTarget = true;
    else if (a === "--no-strictTarget") args.strictTarget = false;
    else if (a.startsWith("--strictTarget=")) {
      const v = a.slice("--strictTarget=".length).trim().toLowerCase();
      if (v === "true" || v === "1") args.strictTarget = true;
      else if (v === "false" || v === "0") args.strictTarget = false;
      else throw new Error(`Invalid --strictTarget value: ${v}`);
    } else {
      throw new Error(`Unknown arg: ${a}`);
    }
  }
  return args;
}

function parseSemverParts(version) {
  const m = String(version || "").trim().match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function compareSemver(a, b) {
  const pa = parseSemverParts(a);
  const pb = parseSemverParts(b);
  if (!pa || !pb) return null;
  for (let i = 0; i < 3; i += 1) {
    if (pa[i] > pb[i]) return 1;
    if (pa[i] < pb[i]) return -1;
  }
  return 0;
}

function readVersionFromExtensionDirName(extDir) {
  const base = path.basename(extDir);
  const m = base.match(/^openai\.chatgpt-(\d+\.\d+\.\d+)/);
  return m ? m[1] : null;
}

function pickByMtime(candidates) {
  const sorted = [...candidates].sort((a, b) => {
    const mtimeDiff = (b.mtimeMs ?? 0) - (a.mtimeMs ?? 0);
    if (mtimeDiff !== 0) return mtimeDiff;
    return String(a.dir).localeCompare(String(b.dir));
  });
  return sorted[0];
}

function formatCandidateLines(candidates) {
  return candidates
    .map((c) => `- ${c.dir}${c.version ? ` (version: ${c.version})` : ""}`)
    .join("\n");
}

function chooseBestExtensionCandidate(candidates, { strictTarget = true } = {}) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    throw new Error("No openai.chatgpt extension candidates found.");
  }

  const normalized = candidates.map((c) => ({
    ...c,
    version: c.version || readVersionFromExtensionDirName(c.dir),
  }));

  const parsed = normalized.filter((c) => parseSemverParts(c.version));
  if (parsed.length === 0) {
    if (strictTarget) {
      throw new Error(
        [
          "Cannot resolve extension target: no semver-parsable candidates.",
          "Candidates:",
          formatCandidateLines(normalized),
          "Please rerun with --extDir <path>.",
        ].join("\n")
      );
    }
    return pickByMtime(normalized);
  }

  let maxVersion = parsed[0].version;
  for (let i = 1; i < parsed.length; i += 1) {
    const cmp = compareSemver(parsed[i].version, maxVersion);
    if (cmp != null && cmp > 0) maxVersion = parsed[i].version;
  }

  const highest = parsed.filter((c) => compareSemver(c.version, maxVersion) === 0);
  if (highest.length === 1) return highest[0];

  if (strictTarget) {
    throw new Error(
      [
        `Ambiguous extension target: multiple candidates share highest version ${maxVersion}.`,
        "Candidates:",
        formatCandidateLines(highest),
        "Please rerun with --extDir <path>.",
      ].join("\n")
    );
  }
  return pickByMtime(highest);
}

function parseEntryBundleFromIndexHtml(html) {
  const m = String(html || "").match(/src="\.\/assets\/(index-[^"]+\.js)"/);
  return m ? m[1] : null;
}

function chooseZhCnBundleName({ assetNames, entryJs, strictTarget = true }) {
  const assets = Array.isArray(assetNames) ? assetNames : [];
  const zhCandidates = assets.filter((n) => /^zh-CN-.*\.js$/.test(n));
  if (zhCandidates.length === 0) return null;

  const refs = [...new Set((String(entryJs || "").match(/zh-CN-[A-Za-z0-9_-]+\.js/g) || []))]
    .filter((n) => zhCandidates.includes(n));

  if (refs.length === 1) return refs[0];
  if (refs.length > 1) {
    if (strictTarget) {
      throw new Error(
        [
          "Ambiguous zh-CN bundle: active entry references multiple zh-CN bundles.",
          ...refs.map((n) => `- ${n}`),
          "Please rerun with --extDir <path> or --strictTarget=false.",
        ].join("\n")
      );
    }
    return [...refs].sort((a, b) => a.localeCompare(b))[0];
  }

  if (zhCandidates.length === 1) return zhCandidates[0];

  if (strictTarget) {
    throw new Error(
      [
        "Ambiguous zh-CN bundle: multiple bundles found but active entry does not reference one uniquely.",
        ...zhCandidates.map((n) => `- ${n}`),
        "Please rerun with --extDir <path> or --strictTarget=false.",
      ].join("\n")
    );
  }

  return [...zhCandidates].sort((a, b) => a.localeCompare(b))[0];
}

async function readExtensionVersion(extDir) {
  const pkgPath = path.join(extDir, "package.json");
  try {
    const raw = await fs.readFile(pkgPath, "utf8");
    const pkg = JSON.parse(raw);
    const version = typeof pkg.version === "string" ? pkg.version : null;
    return { version, pkgPath };
  } catch {
    return { version: null, pkgPath };
  }
}

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function dirExists(p) {
  try {
    const s = await fs.stat(p);
    return s.isDirectory();
  } catch {
    return false;
  }
}

function getVsCodeExtensionBases() {
  const home = os.homedir();
  return [
    path.join(home, ".vscode", "extensions"),
    path.join(home, ".vscode-insiders", "extensions"),
    path.join(home, ".vscode-oss", "extensions"),
  ];
}

async function findOpenAiChatgptExtensionCandidates() {
  const bases = getVsCodeExtensionBases();
  const existingBases = [];
  for (const base of bases) {
    if (await dirExists(base)) existingBases.push(base);
  }

  if (existingBases.length === 0) {
    throw new Error(
      `No VS Code extension directories found. Tried:\n- ${bases.join("\n- ")}`
    );
  }

  const candidates = [];
  for (const base of existingBases) {
    const entries = await fs.readdir(base, { withFileTypes: true });
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      if (!e.name.startsWith("openai.chatgpt-")) continue;
      candidates.push(path.join(base, e.name));
    }
  }

  if (candidates.length === 0) {
    throw new Error(
      `No openai.chatgpt extension found under:\n- ${existingBases.join("\n- ")}`
    );
  }

  const stats = await Promise.all(
    candidates.map(async (p) => {
      const s = await fs.stat(p);
      return {
        dir: p,
        mtimeMs: s.mtimeMs,
        version: readVersionFromExtensionDirName(p),
      };
    })
  );
  return stats;
}

async function resolveOpenAiChatgptExtensionDir({ extDir, strictTarget }) {
  if (extDir) {
    const resolved = path.resolve(extDir);
    if (!(await dirExists(resolved))) {
      throw new Error(`--extDir does not exist or is not a directory: ${resolved}`);
    }
    if (!path.basename(resolved).startsWith("openai.chatgpt-")) {
      throw new Error(
        `--extDir must point to an openai.chatgpt-* extension folder: ${resolved}`
      );
    }
    return resolved;
  }

  const candidates = await findOpenAiChatgptExtensionCandidates();
  const picked = chooseBestExtensionCandidate(candidates, { strictTarget });
  return picked.dir;
}

async function readWebviewEntryJsPath(extDir) {
  const htmlPath = path.join(extDir, "webview", "index.html");
  const html = await fs.readFile(htmlPath, "utf8");
  const bundleName = parseEntryBundleFromIndexHtml(html);
  if (!bundleName) {
    throw new Error(`Could not find webview entry JS in ${htmlPath}`);
  }
  return path.join(extDir, "webview", "assets", bundleName);
}

async function readZhCnLocalePath(extDir, webviewJs, { strictTarget }) {
  const assetsDir = path.join(extDir, "webview", "assets");
  const entries = await fs.readdir(assetsDir);
  const entryJs = await fs.readFile(webviewJs, "utf8");
  const hit = chooseZhCnBundleName({
    assetNames: entries,
    entryJs,
    strictTarget,
  });
  return hit ? path.join(assetsDir, hit) : null;
}

async function restoreFromBackup(filePath) {
  const backupPath = `${filePath}.bak`;
  if (!(await fileExists(backupPath))) return { restored: false };
  const backup = await fs.readFile(backupPath);
  await fs.writeFile(filePath, backup);
  return { restored: true, backupPath };
}

// Config is controlled via VS Code settings, so uninstall does not touch ~/.codex/config.toml.

async function main() {
  const args = parseArgs(process.argv);
  const V71 = "0.4.71";
  const V73 = "0.4.73";
  const extDir = await resolveOpenAiChatgptExtensionDir(args);
  const { version: versionFromPkg } = await readExtensionVersion(extDir);
  const version = versionFromPkg || readVersionFromExtensionDirName(extDir);
  const cmpV71 = compareSemver(version, V71);
  const cmpV73 = compareSemver(version, V73);
  if (cmpV71 == null || cmpV73 == null) {
    throw new Error(
      `Cannot parse extension version for routing (detected: ${versionFromPkg || "unknown"}). Please check ${path.join(extDir, "package.json")}.`
    );
  }
  log(`Extension: ${extDir}${version ? ` (version: ${version})` : ""}`);

  let profile;
  if (cmpV71 === 0) {
    profile = "v71";
  } else if (cmpV73 === 0) {
    profile = "v73";
  } else {
    throw new Error(
      [
        `Detected openai.chatgpt@${version ?? "unknown"}.`,
        "This direct track currently supports exactly 0.4.71 and 0.4.73.",
        "Please use docs/remote/codex-folding-uninstall.mjs for auto-routing.",
      ].join("\n")
    );
  }
  log(
    profile === "v71"
      ? "Route: ==0.4.71 direct uninstaller profile (v71-plus)"
      : "Route: ==0.4.73 direct uninstaller profile (v71-plus)"
  );

  const hostJs = path.join(extDir, "out", "extension.js");
  const webviewJs = await readWebviewEntryJsPath(extDir);
  const zhCnJs = await readZhCnLocalePath(extDir, webviewJs, args);

  const targets = [hostJs, webviewJs, ...(zhCnJs ? [zhCnJs] : [])];
  const results = [];
  for (const filePath of targets) {
    results.push({ file: filePath, ...(await restoreFromBackup(filePath)) });
  }
  if (!zhCnJs) {
    log("WARN: zh-CN locale bundle not found; skipping zh-CN restore.");
  }

  for (const r of results) {
    if (r.restored) {
      log(`RESTORED: ${r.file}`);
      log(`  from: ${r.backupPath}`);
    } else {
      log(`SKIP (no backup): ${r.file}`);
    }
  }

  // Verify markers are absent when backups were restored.
  const markers = ["CODEX_WORKFLOW_FOLD_PATCH", "codex-workflow-collapse"];
  for (const r of results) {
    if (!r.restored) continue;
    const content = await fs.readFile(r.file, "utf8");
    for (const m of markers) {
      if (content.includes(m)) {
        throw new Error(`Verify failed: marker still present in ${r.file}: ${m}`);
      }
    }
  }

  log("");
  log("Next step: restart VS Code to make the change take effect.");
}

await main().catch((err) => {
  die(`Uninstall failed: ${err?.stack || err}`);
});
