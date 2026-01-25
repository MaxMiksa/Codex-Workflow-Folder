import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function findInstalledExtensionDirs() {
  const base = path.join(os.homedir(), ".vscode", "extensions");
  if (!(await fileExists(base))) return [];
  const entries = await fs.readdir(base, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && e.name.startsWith("openai.chatgpt-"))
    .map((e) => ({ name: e.name, dir: path.join(base, e.name) }));
}

async function readActiveWebviewBundle(extDir) {
  const htmlPath = path.join(extDir, "webview", "index.html");
  const html = await fs.readFile(htmlPath, "utf8");
  const m = html.match(/src="\.\/assets\/(index-[^"]+\.js)"/);
  if (!m) return null;
  return m[1];
}

async function readTextIfExists(p) {
  try {
    return await fs.readFile(p, "utf8");
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
    checks.push({
      file: "webview/assets/index-*.js",
      name: "webview:mapStateToLocalConversationItems",
      ok: webviewJs.includes("function mapStateToLocalConversationItems"),
    });
    checks.push({
      file: "webview/assets/index-*.js",
      name: "webview:LocalConversationItemContent",
      ok: webviewJs.includes("function LocalConversationItemContent"),
    });
    checks.push({
      file: "webview/assets/index-*.js",
      name: "webview:InProgressFixedContentItem",
      ok: webviewJs.includes("function InProgressFixedContentItem"),
    });
    checks.push({
      file: "webview/assets/index-*.js",
      name: "webview:workflow-fold-patch-v8",
      ok: webviewJs.includes("CODEX_WORKFLOW_FOLD_PATCH_V8"),
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
  const p = path.join(extDir, "package.json");
  try {
    const txt = await fs.readFile(p, "utf8");
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

async function findProfileForFolderName(folderName) {
  const base = path.join(process.cwd(), "docs", "patch-profiles", "openai.chatgpt");

  // Preferred: match the "version part" (folder name without publisher/id prefix),
  // e.g. "openai.chatgpt-0.4.66-win32-x64" -> "0.4.66-win32-x64".
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

async function main() {
  const dirs = await findInstalledExtensionDirs();
  if (dirs.length === 0) {
    out([
      "No installed VS Code extension found matching: openai.chatgpt-*",
      `Searched: ${path.join(os.homedir(), ".vscode", "extensions")}`,
    ]);
    process.exit(2);
  }

  // Prefer newest mtime.
  const stats = await Promise.all(
    dirs.map(async (d) => ({ ...d, stat: await fs.stat(d.dir) }))
  );
  stats.sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);

  const chosen = stats[0];
  const folderName = chosen.name;
  const extDir = chosen.dir;
  const pkg = await readExtensionPackageJson(extDir);
  const activeWebview = await readActiveWebviewBundle(extDir);
  const profile = await findProfileForFolderName(folderName);

  const hostPath = path.join(extDir, "out", "extension.js");
  const webviewPath = activeWebview
    ? path.join(extDir, "webview", "assets", activeWebview)
    : null;
  const localeDir = path.join(extDir, "webview", "assets");
  let zhCnPath = null;
  try {
    const assets = await fs.readdir(localeDir);
    const hit = assets.find((n) => /^zh-CN-.*\.js$/.test(n));
    zhCnPath = hit ? path.join(localeDir, hit) : null;
  } catch {
    zhCnPath = null;
  }

  const hostJs = await readTextIfExists(hostPath);
  const webviewJs = webviewPath ? await readTextIfExists(webviewPath) : null;
  const localeJs = zhCnPath ? await readTextIfExists(zhCnPath) : null;
  const anchors = checkAnchors({ hostJs, webviewJs, localeJs });
  const anchorsOk = anchors.every((c) => c.ok);

  out([
    `Installed extension folder: ${extDir}`,
    pkg?.version ? `Extension version (package.json): ${pkg.version}` : null,
    activeWebview ? `Active webview bundle: webview/assets/${activeWebview}` : null,
    profile ? `Matching patch profile: ${profile}` : "Matching patch profile: (none)",
    zhCnPath ? `Detected zh-CN bundle: ${path.relative(extDir, zhCnPath)}` : null,
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
