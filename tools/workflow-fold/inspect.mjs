import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

import {
  chooseBestExtensionCandidate,
  chooseZhCnBundleName,
  parseEntryBundleFromIndexHtml,
  readVersionFromExtensionDirName,
} from "./target-resolution.mjs";

function parseArgs(argv) {
  const args = { extDir: null, strictTarget: true };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--extDir") args.extDir = argv[++i] ?? null;
    else if (arg === "--strictTarget") args.strictTarget = true;
    else if (arg === "--no-strictTarget") args.strictTarget = false;
    else if (arg.startsWith("--strictTarget=")) {
      const value = arg.slice("--strictTarget=".length).trim().toLowerCase();
      if (value === "true" || value === "1") args.strictTarget = true;
      else if (value === "false" || value === "0") args.strictTarget = false;
      else throw new Error(`Invalid --strictTarget value: ${value}`);
    } else {
      throw new Error(`Unknown arg: ${arg}`);
    }
  }
  return args;
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function dirExists(dirPath) {
  try {
    const s = await fs.stat(dirPath);
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

async function findExtensionCandidates() {
  const bases = getVsCodeExtensionBases();
  const existingBases = [];
  for (const base of bases) {
    if (await dirExists(base)) existingBases.push(base);
  }

  const dirs = [];
  for (const base of existingBases) {
    const entries = await fs.readdir(base, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (!entry.name.startsWith("openai.chatgpt-")) continue;
      const dir = path.join(base, entry.name);
      const stat = await fs.stat(dir);
      dirs.push({
        name: entry.name,
        dir,
        base,
        mtimeMs: stat.mtimeMs,
        version: readVersionFromExtensionDirName(dir),
      });
    }
  }

  return { bases, existingBases, dirs };
}

async function readActiveWebviewBundle(extDir) {
  const htmlPath = path.join(extDir, "webview", "index.html");
  const html = await fs.readFile(htmlPath, "utf8");
  return parseEntryBundleFromIndexHtml(html);
}

async function readTextIfExists(filePath) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

function checkAnchors({ hostJs, webviewJs, localeJs }) {
  const checks = [];
  if (hostJs != null) {
    checks.push({
      file: "out/extension.js",
      name: "host:getWebviewContentProduction",
      ok: hostJs.includes("async getWebviewContentProduction"),
    });
    checks.push({
      file: "out/extension.js",
      name: "host:return-l",
      ok: hostJs.includes("return l}"),
    });
  }

  if (webviewJs != null) {
    const isV71Shape =
      (/function\s+qK\(/.test(webviewJs) || webviewJs.includes("CODEX_WORKFLOW_FOLD_PATCH_V71_W1")) &&
      /function\s+k2n\(/.test(webviewJs) &&
      webviewJs.includes('case"worked-for":') &&
      !webviewJs.includes("function mapStateToLocalConversationItems");

    checks.push({
      file: "webview/assets/index-*.js",
      name: "webview:mapStateToLocalConversationItems",
      ok: isV71Shape || webviewJs.includes("function mapStateToLocalConversationItems"),
    });
    checks.push({
      file: "webview/assets/index-*.js",
      name: "webview:qK-v71-shape",
      ok: !isV71Shape || /function\s+qK\(/.test(webviewJs),
    });
    checks.push({
      file: "webview/assets/index-*.js",
      name: "webview:k2n-v71-shape",
      ok: !isV71Shape || webviewJs.includes("function k2n(t){"),
    });
    checks.push({
      file: "webview/assets/index-*.js",
      name: "webview:LocalConversationItemContent",
      ok: isV71Shape || webviewJs.includes("function LocalConversationItemContent"),
    });
    checks.push({
      file: "webview/assets/index-*.js",
      name: "webview:InProgressFixedContentItem",
      ok: isV71Shape || webviewJs.includes("function InProgressFixedContentItem"),
    });
    checks.push({
      file: "webview/assets/index-*.js",
      name: "webview:workflow-fold-patch-marker",
      ok:
        webviewJs.includes("CODEX_WORKFLOW_FOLD_PATCH_V10") ||
        webviewJs.includes("CODEX_WORKFLOW_FOLD_PATCH_V71_W1") ||
        webviewJs.includes("CODEX_WORKFLOW_FOLD_PATCH_V73_W1"),
    });
  }

  if (localeJs != null) {
    checks.push({
      file: "webview/assets/zh-CN-*.js",
      name: "i18n:locale-bundle",
      ok: localeJs.startsWith("const e=") && localeJs.includes("export{e as default}"),
    });
  }

  return checks;
}

async function readExtensionPackageJson(extDir) {
  const packageJsonPath = path.join(extDir, "package.json");
  try {
    const txt = await fs.readFile(packageJsonPath, "utf8");
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

async function findProfileForFolderName(folderName) {
  const base = path.join(process.cwd(), "docs", "patch-profiles", "openai.chatgpt");
  const versionPart = folderName.startsWith("openai.chatgpt-")
    ? folderName.slice("openai.chatgpt-".length)
    : folderName;

  const candidates = [
    path.join(base, versionPart),
    path.join(base, folderName),
  ];

  for (const p of candidates) {
    if (await fileExists(p)) return p;
  }
  return null;
}

function out(lines) {
  process.stdout.write(lines.filter(Boolean).join("\n") + "\n");
}

async function resolveTarget(args) {
  if (args.extDir) {
    const resolved = path.resolve(args.extDir);
    if (!(await dirExists(resolved))) {
      throw new Error(`--extDir does not exist or is not a directory: ${resolved}`);
    }
    return {
      chosen: {
        name: path.basename(resolved),
        dir: resolved,
        base: path.dirname(resolved),
        mtimeMs: 0,
        version: readVersionFromExtensionDirName(resolved),
      },
      diagnostics: [],
    };
  }

  const scan = await findExtensionCandidates();
  if (scan.dirs.length === 0) {
    const searched = scan.existingBases.length > 0 ? scan.existingBases : scan.bases;
    throw new Error(
      [
        "No installed VS Code extension found matching: openai.chatgpt-*",
        "Searched:",
        ...searched.map((b) => `- ${b}`),
      ].join("\n")
    );
  }

  const picked = chooseBestExtensionCandidate(scan.dirs, {
    strictTarget: args.strictTarget,
  });

  return {
    chosen: {
      ...picked,
      name: path.basename(picked.dir),
      base: path.dirname(picked.dir),
    },
    diagnostics: [
      `Target scan bases: ${scan.bases.join(", ")}`,
      `Candidate count: ${scan.dirs.length}`,
      ...scan.dirs.map((d) =>
        `- ${d.dir}${d.version ? ` (version: ${d.version})` : ""}`
      ),
    ],
  };
}

async function main() {
  const args = parseArgs(process.argv);
  const { chosen, diagnostics } = await resolveTarget(args);

  const folderName = chosen.name;
  const extDir = chosen.dir;
  const pkg = await readExtensionPackageJson(extDir);
  const activeWebview = await readActiveWebviewBundle(extDir);
  const profile = await findProfileForFolderName(folderName);

  const hostPath = path.join(extDir, "out", "extension.js");
  const webviewPath = activeWebview
    ? path.join(extDir, "webview", "assets", activeWebview)
    : null;
  const assetsDir = path.join(extDir, "webview", "assets");

  const hostJs = await readTextIfExists(hostPath);
  const webviewJs = webviewPath ? await readTextIfExists(webviewPath) : null;

  let zhCnPath = null;
  let zhCnInfo = null;
  try {
    const assets = await fs.readdir(assetsDir);
    const chosenZh = chooseZhCnBundleName({
      assetNames: assets,
      entryJs: webviewJs ?? "",
      strictTarget: args.strictTarget,
    });
    if (chosenZh) {
      zhCnPath = path.join(assetsDir, chosenZh);
    } else {
      zhCnInfo = "No zh-CN locale bundle found (skip expected on some builds).";
    }
  } catch (error) {
    zhCnInfo = `zh-CN selection warning: ${error?.message || error}`;
  }

  const localeJs = zhCnPath ? await readTextIfExists(zhCnPath) : null;
  const anchors = checkAnchors({ hostJs, webviewJs, localeJs });
  const anchorsOk = anchors.every((c) => c.ok);

  out([
    `Installed extension folder: ${extDir}`,
    pkg?.version ? `Extension version (package.json): ${pkg.version}` : null,
    activeWebview ? `Active webview bundle: webview/assets/${activeWebview}` : null,
    profile ? `Matching patch profile: ${profile}` : "Matching patch profile: (none)",
    zhCnPath ? `Detected zh-CN bundle: ${path.relative(extDir, zhCnPath)}` : null,
    zhCnInfo,
    diagnostics.length > 0 ? "" : null,
    diagnostics.length > 0 ? "Target diagnostics:" : null,
    ...diagnostics,
    "",
    "Anchor checks:",
    ...anchors.map((c) => `- ${c.ok ? "OK" : "MISSING"}: ${c.name} (${c.file})`),
    !anchorsOk ? "WARNING: some anchors are missing; patch may not apply cleanly." : null,
    "",
    "Recommended next steps:",
    "1) Run tests: `npm test`",
    "2) Apply patch: `npm run apply`",
    "3) Verify (idempotent): `npm run verify`",
    "",
    "If no matching profile exists:",
    "- You can still try applying the patch (it uses robust anchors + markers).",
    "- If patching fails, collect the folder name + active bundle name and add a new profile folder under:",
    "  `docs/patch-profiles/openai.chatgpt/<folderName>/`",
  ]);
}

await main();
