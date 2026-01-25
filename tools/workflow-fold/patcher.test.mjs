import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
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
    'function mapStateToLocalConversationItems(rt,Ye){const it=[];return{items:it}}function LocalConversationItemContent(rt){switch(rt.item.type){case"user-message":return null;default:return null}}export{foo as bar};';
  const out = patchWebviewBundleJs(input);
  assert.match(out, /CODEX_WORKFLOW_FOLD_PATCH/);
  assert.match(out, /CODEX_WORKFLOW_FOLD_PATCH_V2/);
  assert.match(out, /CODEX_WORKFLOW_FOLD_PATCH_V3/);
  assert.match(out, /CODEX_WORKFLOW_FOLD_PATCH_V4/);
  assert.match(out, /CODEX_WORKFLOW_FOLD_PATCH_V9/);
  assert.match(out, /Array\.isArray/);
  assert.match(out, /workflow/);
});

test("webview patch folds items when mapState returns {items: []}", () => {
  const input =
    'function mapStateToLocalConversationItems(rt,Ye){return{items:rt.items}}function isAgentItemStillRunning(it){return false}export{foo as bar};';
  const out = patchWebviewBundleJs(input);
  const start = out.indexOf("/* CODEX_WORKFLOW_FOLD_PATCH */");
  const end = out.indexOf("/* END CODEX_WORKFLOW_FOLD_PATCH */");
  assert.ok(start !== -1 && end !== -1);
  const patchBlock =
    out.slice(start, end + "/* END CODEX_WORKFLOW_FOLD_PATCH */".length) + "\n";

  const ctx = {
    mapStateToLocalConversationItems: (rt, Ye) => ({ items: rt.items }),
    isAgentItemStillRunning: () => false,
    console: { error: () => {} },
  };
  vm.runInNewContext(patchBlock, ctx, { timeout: 1000 });

  const res = ctx.mapStateToLocalConversationItems(
    {
      items: [
        { type: "user-message", id: "u1", attachments: [], images: [] },
        { type: "reasoning", id: "r1", content: "x", completed: true },
        { type: "assistant-message", id: "a1", content: "y", completed: true },
      ],
    },
    null
  );

  assert.equal(res.items[0].type, "user-message");
  assert.equal(res.items[1].type, "workflow");
  assert.equal(res.items[1].children?.length, 1);
  assert.equal(res.items[2].type, "assistant-message");
});

test("webview patch keeps plan items outside workflow", () => {
  const input =
    'function mapStateToLocalConversationItems(rt,Ye){return{items:rt.items,status:rt.status}}function isAgentItemStillRunning(it){return false}export{foo as bar};';
  const out = patchWebviewBundleJs(input);
  const start = out.indexOf("/* CODEX_WORKFLOW_FOLD_PATCH */");
  const end = out.indexOf("/* END CODEX_WORKFLOW_FOLD_PATCH */");
  assert.ok(start !== -1 && end !== -1);
  const patchBlock =
    out.slice(start, end + "/* END CODEX_WORKFLOW_FOLD_PATCH */".length) + "\n";

  const ctx = {
    mapStateToLocalConversationItems: (rt, Ye) => ({ items: rt.items, status: rt.status }),
    isAgentItemStillRunning: () => false,
    console: { error: () => {} },
  };
  vm.runInNewContext(patchBlock, ctx, { timeout: 1000 });

  const res = ctx.mapStateToLocalConversationItems(
    {
      status: "completed",
      items: [
        { type: "user-message", id: "u1", attachments: [], images: [] },
        { type: "plan", explanation: null, plan: [] },
        { type: "reasoning", id: "r1", content: "x", completed: true },
        { type: "assistant-message", id: "a1", content: "y", completed: true },
      ],
    },
    null
  );

  assert.equal(res.items[0].type, "user-message");
  assert.equal(res.items[1].type, "plan");
  assert.equal(res.items[2].type, "workflow");
  assert.equal(res.items[2].children?.some((ch) => ch?.type === "plan"), false);
});

test("patchZhCnLocaleJs adds zh-CN strings", () => {
  const input = 'const e={"codex.shell.cwdLabel":"cwd"};export{e as default};';
  const out = patchZhCnLocaleJs(input);
  assert.match(out, /codex\.workflow\./);
});
