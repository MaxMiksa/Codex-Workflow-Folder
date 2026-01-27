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

async function findLatestOpenAiChatgptExtensionDir() {
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
    candidates.map(async (p) => ({ p, s: await fs.stat(p) }))
  );
  stats.sort((a, b) => b.s.mtimeMs - a.s.mtimeMs);
  return stats[0].p;
}

async function readWebviewEntryJsPath(extDir) {
  const htmlPath = path.join(extDir, "webview", "index.html");
  const html = await fs.readFile(htmlPath, "utf8");
  const m = html.match(/src="\.\/assets\/(index-[^"]+\.js)"/);
  if (!m) {
    throw new Error(`Could not find webview entry JS in ${htmlPath}`);
  }
  return path.join(extDir, "webview", "assets", m[1]);
}

async function readZhCnLocalePath(extDir) {
  const assetsDir = path.join(extDir, "webview", "assets");
  const entries = (await fs.readdir(assetsDir)).filter((n) =>
    /^zh-CN-.*\.js$/.test(n)
  );
  entries.sort((a, b) => a.localeCompare(b));
  const hit = entries[0];
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
  const extDir = await findLatestOpenAiChatgptExtensionDir();
  log(`Extension: ${extDir}`);

  const hostJs = path.join(extDir, "out", "extension.js");
  const webviewJs = await readWebviewEntryJsPath(extDir);
  const zhCnJs = await readZhCnLocalePath(extDir);

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
