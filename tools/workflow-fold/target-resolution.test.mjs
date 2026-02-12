import test from "node:test";
import assert from "node:assert/strict";

import {
  chooseBestExtensionCandidate,
  chooseZhCnBundleName,
  parseEntryBundleFromIndexHtml,
  readVersionFromExtensionDirName,
} from "./target-resolution.mjs";

test("readVersionFromExtensionDirName extracts version", () => {
  assert.equal(
    readVersionFromExtensionDirName("openai.chatgpt-0.4.71-win32-x64"),
    "0.4.71"
  );
});

test("chooseBestExtensionCandidate picks unique highest semver", () => {
  const picked = chooseBestExtensionCandidate([
    { dir: "A", version: "0.4.70", mtimeMs: 10 },
    { dir: "B", version: "0.4.71", mtimeMs: 1 },
  ]);
  assert.equal(picked.dir, "B");
});

test("chooseBestExtensionCandidate fails on highest-version tie in strict mode", () => {
  assert.throws(
    () =>
      chooseBestExtensionCandidate([
        { dir: "A", version: "0.4.71", mtimeMs: 5 },
        { dir: "B", version: "0.4.71", mtimeMs: 10 },
      ]),
    /Ambiguous extension target/
  );
});

test("chooseBestExtensionCandidate allows mtime fallback when strictTarget=false", () => {
  const picked = chooseBestExtensionCandidate(
    [
      { dir: "A", version: "0.4.71", mtimeMs: 5 },
      { dir: "B", version: "0.4.71", mtimeMs: 10 },
    ],
    { strictTarget: false }
  );
  assert.equal(picked.dir, "B");
});

test("chooseBestExtensionCandidate falls back by mtime when versions are unparsable and strictTarget=false", () => {
  const picked = chooseBestExtensionCandidate(
    [
      { dir: "A", version: "bad", mtimeMs: 1 },
      { dir: "B", version: null, mtimeMs: 10 },
    ],
    { strictTarget: false }
  );
  assert.equal(picked.dir, "B");
});

test("parseEntryBundleFromIndexHtml returns active entry bundle", () => {
  const html = '<script type="module" src="./assets/index-abc123.js"></script>';
  assert.equal(parseEntryBundleFromIndexHtml(html), "index-abc123.js");
});

test("parseEntryBundleFromIndexHtml returns null when entry is missing", () => {
  assert.equal(parseEntryBundleFromIndexHtml("<html></html>"), null);
});

test("chooseZhCnBundleName prefers bundle referenced by entry js", () => {
  const entryJs = 'const x = "./zh-CN-B4K5_9qj.js";';
  const picked = chooseZhCnBundleName({
    assetNames: ["zh-CN-AAAA.js", "zh-CN-B4K5_9qj.js"],
    entryJs,
  });
  assert.equal(picked, "zh-CN-B4K5_9qj.js");
});

test("chooseZhCnBundleName falls back when only one zh-CN asset exists", () => {
  const picked = chooseZhCnBundleName({
    assetNames: ["zh-CN-only.js"],
    entryJs: "const x = 1;",
  });
  assert.equal(picked, "zh-CN-only.js");
});

test("chooseZhCnBundleName fails when ambiguous and no entry reference", () => {
  assert.throws(
    () =>
      chooseZhCnBundleName({
        assetNames: ["zh-CN-a.js", "zh-CN-b.js"],
        entryJs: "const x = 1;",
      }),
    /Ambiguous zh-CN bundle/
  );
});

test("chooseZhCnBundleName fails when entry references multiple zh-CN bundles", () => {
  const entryJs = '"./zh-CN-a.js";"./zh-CN-b.js";';
  assert.throws(
    () =>
      chooseZhCnBundleName({
        assetNames: ["zh-CN-a.js", "zh-CN-b.js"],
        entryJs,
      }),
    /Ambiguous zh-CN bundle/
  );
});

test("chooseZhCnBundleName allows fallback when strictTarget=false", () => {
  const picked = chooseZhCnBundleName({
    assetNames: ["zh-CN-b.js", "zh-CN-a.js"],
    entryJs: "const x = 1;",
    strictTarget: false,
  });
  assert.equal(picked, "zh-CN-a.js");
});

test("chooseZhCnBundleName returns null when no zh-CN assets exist", () => {
  const picked = chooseZhCnBundleName({
    assetNames: ["en-US.js"],
    entryJs: "const x = 1;",
  });
  assert.equal(picked, null);
});
