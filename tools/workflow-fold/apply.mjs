import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

import {
  patchExtensionHostJs,
  patchWebviewBundleJs,
  patchZhCnLocaleJs,
} from "./patcher.mjs";

function parseArgs(argv) {
  const args = { dryRun: false, extDir: null, verify: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") args.dryRun = true;
    else if (a === "--verify") args.verify = true;
    else if (a === "--extDir") args.extDir = argv[++i] ?? null;
    else throw new Error(`Unknown arg: ${a}`);
  }
  return args;
}

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function findLatestOpenAiChatgptExtensionDir() {
  const base = path.join(os.homedir(), ".vscode", "extensions");
  const entries = await fs.readdir(base, { withFileTypes: true });
  const candidates = entries
    .filter((e) => e.isDirectory() && e.name.startsWith("openai.chatgpt-"))
    .map((e) => path.join(base, e.name));

  if (candidates.length === 0) {
    throw new Error(`No openai.chatgpt extension found under ${base}`);
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
  const entries = await fs.readdir(assetsDir);
  const hit = entries.find((n) => /^zh-CN-.*\.js$/.test(n));
  if (!hit) {
    throw new Error(`Could not find zh-CN locale bundle under ${assetsDir}`);
  }
  return path.join(assetsDir, hit);
}

async function patchFile(filePath, patchFn, { dryRun }) {
  const before = await fs.readFile(filePath, "utf8");
  const after = patchFn(before);
  if (after === before) return { changed: false };

  const backupPath = `${filePath}.bak`;
  if (!(await fileExists(backupPath))) {
    await fs.writeFile(backupPath, before, "utf8");
  }

  if (!dryRun) {
    await fs.writeFile(filePath, after, "utf8");
  }
  return { changed: true, backupPath };
}

async function main() {
  const args = parseArgs(process.argv);
  const extDir = args.extDir ?? (await findLatestOpenAiChatgptExtensionDir());

  const hostJs = path.join(extDir, "out", "extension.js");
  const webviewJs = await readWebviewEntryJsPath(extDir);
  const zhCnJs = await readZhCnLocalePath(extDir);

  const results = [];
  results.push({
    file: hostJs,
    ...(await patchFile(hostJs, patchExtensionHostJs, args)),
  });
  results.push({
    file: webviewJs,
    ...(await patchFile(webviewJs, patchWebviewBundleJs, args)),
  });
  results.push({
    file: zhCnJs,
    ...(await patchFile(zhCnJs, patchZhCnLocaleJs, args)),
  });

  const changed = results.filter((r) => r.changed);
  if (args.verify) {
    const host = await fs.readFile(hostJs, "utf8");
    const web = await fs.readFile(webviewJs, "utf8");
    const zh = await fs.readFile(zhCnJs, "utf8");
    if (!host.includes("codex-workflow-collapse")) {
      throw new Error("Verify failed: host meta tag not present");
    }
    if (!web.includes("CODEX_WORKFLOW_FOLD_PATCH_V10")) {
      throw new Error("Verify failed: webview patch marker not present (V10)");
    }
    if (!zh.includes("codex.workflow.label")) {
      throw new Error("Verify failed: zh-CN strings not present");
    }
  }

  process.stdout.write(
    [
      `Extension: ${extDir}`,
      ...results.map((r) =>
        r.changed
          ? `PATCHED: ${r.file} (backup: ${r.backupPath})`
          : `OK: ${r.file}`
      ),
      args.dryRun ? "(dry-run)" : "",
      changed.length === 0 ? "No changes needed." : "",
    ]
      .filter(Boolean)
      .join("\n") + "\n"
  );
}

await main();
