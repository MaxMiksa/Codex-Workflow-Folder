import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

import {
  patchExtensionHostJs,
  patchWebviewBundleJs,
  patchZhCnLocaleJs,
} from "./patcher.mjs";
import {
  chooseBestExtensionCandidate,
  chooseZhCnBundleName,
  parseEntryBundleFromIndexHtml,
  readVersionFromExtensionDirName,
} from "./target-resolution.mjs";

function parseArgs(argv) {
  const args = { dryRun: false, extDir: null, verify: false, strictTarget: true };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") args.dryRun = true;
    else if (a === "--verify") args.verify = true;
    else if (a === "--extDir") args.extDir = argv[++i] ?? null;
    else if (a === "--strictTarget") args.strictTarget = true;
    else if (a === "--no-strictTarget") args.strictTarget = false;
    else if (a.startsWith("--strictTarget=")) {
      const v = a.slice("--strictTarget=".length).trim().toLowerCase();
      if (v === "true" || v === "1") args.strictTarget = true;
      else if (v === "false" || v === "0") args.strictTarget = false;
      else throw new Error(`Invalid --strictTarget value: ${v}`);
    }
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
  const entryBundle = parseEntryBundleFromIndexHtml(html);
  if (!entryBundle) {
    throw new Error(`Could not find webview entry JS in ${htmlPath}`);
  }
  return path.join(extDir, "webview", "assets", entryBundle);
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
  const extDir = await resolveOpenAiChatgptExtensionDir(args);

  const hostJs = path.join(extDir, "out", "extension.js");
  const webviewJs = await readWebviewEntryJsPath(extDir);
  const zhCnJs = await readZhCnLocalePath(extDir, webviewJs, args);

  const results = [];
  results.push({
    file: hostJs,
    ...(await patchFile(hostJs, patchExtensionHostJs, args)),
  });
  results.push({
    file: webviewJs,
    ...(await patchFile(webviewJs, patchWebviewBundleJs, args)),
  });
  if (zhCnJs) {
    results.push({
      file: zhCnJs,
      ...(await patchFile(zhCnJs, patchZhCnLocaleJs, args)),
    });
  }

  const changed = results.filter((r) => r.changed);
  if (args.verify) {
    const host = await fs.readFile(hostJs, "utf8");
    const web = await fs.readFile(webviewJs, "utf8");
    if (!host.includes("codex-workflow-collapse")) {
      throw new Error("Verify failed: host meta tag not present");
    }
    if (
      !web.includes("CODEX_WORKFLOW_FOLD_PATCH_V10") &&
      !web.includes("CODEX_WORKFLOW_FOLD_PATCH_V73_W1") &&
      !web.includes("CODEX_WORKFLOW_FOLD_PATCH_V71_W1")
    ) {
      throw new Error(
        "Verify failed: webview patch marker not present (expected V10 or V71_W1 or V73_W1)"
      );
    }
    if (zhCnJs) {
      const zh = await fs.readFile(zhCnJs, "utf8");
      if (!zh.includes("codex.workflow.label")) {
        throw new Error("Verify failed: zh-CN strings not present");
      }
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
      zhCnJs ? "" : "WARN: zh-CN locale bundle not found; skipping zh-CN patch.",
      args.dryRun ? "(dry-run)" : "",
      changed.length === 0 ? "No changes needed." : "",
    ]
      .filter(Boolean)
      .join("\n") + "\n"
  );
}

await main();
