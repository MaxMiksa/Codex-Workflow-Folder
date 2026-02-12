import path from "node:path";

export function parseSemverParts(version) {
  const m = String(version || "").trim().match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

export function compareSemver(a, b) {
  const pa = parseSemverParts(a);
  const pb = parseSemverParts(b);
  if (!pa || !pb) return null;
  for (let i = 0; i < 3; i += 1) {
    if (pa[i] > pb[i]) return 1;
    if (pa[i] < pb[i]) return -1;
  }
  return 0;
}

export function readVersionFromExtensionDirName(extDirOrName) {
  const base = path.basename(String(extDirOrName || ""));
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

export function chooseBestExtensionCandidate(candidates, { strictTarget = true } = {}) {
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
    if (cmp != null && cmp > 0) {
      maxVersion = parsed[i].version;
    }
  }

  const highest = parsed.filter((c) => compareSemver(c.version, maxVersion) === 0);
  if (highest.length === 1) {
    return highest[0];
  }

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

export function parseEntryBundleFromIndexHtml(html) {
  const m = String(html || "").match(/src="\.\/assets\/(index-[^"]+\.js)"/);
  return m ? m[1] : null;
}

function extractZhCnBundleRefs(entryJs) {
  if (typeof entryJs !== "string") return [];
  const matches = entryJs.match(/zh-CN-[A-Za-z0-9_-]+\.js/g) || [];
  return [...new Set(matches)];
}

export function chooseZhCnBundleName({ assetNames, entryJs, strictTarget = true }) {
  const assets = Array.isArray(assetNames) ? assetNames : [];
  const zhCandidates = assets.filter((n) => /^zh-CN-.*\.js$/.test(n));

  if (zhCandidates.length === 0) return null;

  const entryRefs = extractZhCnBundleRefs(entryJs).filter((n) => zhCandidates.includes(n));

  if (entryRefs.length === 1) {
    return entryRefs[0];
  }

  if (entryRefs.length > 1) {
    if (strictTarget) {
      throw new Error(
        [
          "Ambiguous zh-CN bundle: active entry references multiple zh-CN bundles.",
          ...entryRefs.map((n) => `- ${n}`),
          "Please resolve manually or rerun with strict targeting disabled.",
        ].join("\n")
      );
    }
    return [...entryRefs].sort((a, b) => a.localeCompare(b))[0];
  }

  if (zhCandidates.length === 1) {
    return zhCandidates[0];
  }

  if (strictTarget) {
    throw new Error(
      [
        "Ambiguous zh-CN bundle: multiple bundles found, but active entry did not reference one uniquely.",
        ...zhCandidates.map((n) => `- ${n}`),
        "Please resolve manually or rerun with strict targeting disabled.",
      ].join("\n")
    );
  }

  return [...zhCandidates].sort((a, b) => a.localeCompare(b))[0];
}
