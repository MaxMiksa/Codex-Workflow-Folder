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

  out([
    `Installed extension folder: ${extDir}`,
    pkg?.version ? `Extension version (package.json): ${pkg.version}` : null,
    activeWebview ? `Active webview bundle: webview/assets/${activeWebview}` : null,
    profile ? `Matching patch profile: ${profile}` : "Matching patch profile: (none)",
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
