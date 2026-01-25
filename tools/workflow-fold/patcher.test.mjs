import test from "node:test";
import assert from "node:assert/strict";
import {
  patchExtensionHostJs,
  patchWebviewBundleJs,
  patchZhCnLocaleJs,
} from "./patcher.mjs";

test("patchExtensionHostJs injects workflow meta tag", () => {
  const input =
    'async getWebviewContentProduction(e){let l=i.replace("<!-- PROD_BASE_TAG_HERE -->","X");if(p){let h=this.initialRouteMetaTag(p);h&&(l=l.replace("</head>",`${h}\\n</head>`))}return l}';
  const out = patchExtensionHostJs(input);
  assert.match(out, /codex-workflow-collapse/i);
  assert.match(out, /CODEX_WORKFLOW_FOLD_HOST_V6/);
  assert.match(out, /require\("vscode"\)/);
  assert.match(out, /workspace\?\.\s*getConfiguration/);
});

test("patchWebviewBundleJs injects workflow fold patch marker", () => {
  const input =
    'function mapStateToLocalConversationItems(rt,Ye){const it=[];return it}function LocalConversationItemContent(rt){switch(rt.item.type){case"user-message":return null;default:return null}}export{foo as bar};';
  const out = patchWebviewBundleJs(input);
  assert.match(out, /CODEX_WORKFLOW_FOLD_PATCH/);
  assert.match(out, /CODEX_WORKFLOW_FOLD_PATCH_V2/);
  assert.match(out, /CODEX_WORKFLOW_FOLD_PATCH_V3/);
  assert.match(out, /Array\.isArray/);
  assert.match(out, /workflow/);
});

test("patchZhCnLocaleJs adds zh-CN strings", () => {
  const input = 'const e={"codex.shell.cwdLabel":"cwd"};export{e as default};';
  const out = patchZhCnLocaleJs(input);
  assert.match(out, /codex\.workflow\./);
});
