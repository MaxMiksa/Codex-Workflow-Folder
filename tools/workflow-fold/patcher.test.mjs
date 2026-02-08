import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {
  patchExtensionHostJs,
  patchWebviewBundleJs,
  patchWebviewBundleJsV71,
  patchZhCnLocaleJs,
} from "./patcher.mjs";

test("patchExtensionHostJs injects workflow meta tag", () => {
  const input =
    'async getWebviewContentProduction(e){let l=i.replace("<!-- PROD_BASE_TAG_HERE -->","X");if(p){let h=this.initialRouteMetaTag(p);h&&(l=l.replace("</head>",`${h}\\n</head>`))}return l}';
  const out = patchExtensionHostJs(input);
  assert.match(out, /codex-workflow-collapse/i);
  assert.match(out, /CODEX_WORKFLOW_FOLD_HOST_V7/);
  assert.match(out, /require\("vscode"\)/);
  assert.match(out, /workspace\?\.\s*getConfiguration/);
  assert.match(out, /codex\.workflow\.timerStore\.v1/);
  assert.match(out, /sharedObjectRepository/);
});

test("patchWebviewBundleJs injects workflow fold patch marker", () => {
  const input =
    'function mapStateToLocalConversationItems(rt,Ye){const it=[];return{items:it}}function LocalConversationItemContent(rt){switch(rt.item.type){case"user-message":return null;default:return null}}export{foo as bar};';
  const out = patchWebviewBundleJs(input);
  assert.match(out, /CODEX_WORKFLOW_FOLD_PATCH/);
  assert.match(out, /CODEX_WORKFLOW_FOLD_PATCH_V2/);
  assert.match(out, /CODEX_WORKFLOW_FOLD_PATCH_V3/);
  assert.match(out, /CODEX_WORKFLOW_FOLD_PATCH_V4/);
  assert.match(out, /CODEX_WORKFLOW_FOLD_PATCH_V14/);
  assert.ok(
    out.includes("jsxRuntimeExports.jsx(__CodexWorkflowItemInner,{rt},k)"),
    "workflow item should be mounted with a stable per-turn key so useSharedObject does not get stuck on the first key"
  );
  assert.match(out, /Array\.isArray/);
  assert.match(out, /workflow/);
  assert.match(out, /codex\.workflow\.timer\./);
  assert.match(out, /useSharedObject/);
  assert.match(out, /conversationId/);
  assert.match(out, /const footer=expanded/);
  assert.match(out, /border-t/);
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

test("patchWebviewBundleJsV71 injects marker and rewrites worked-for case", () => {
  const input =
    'function JJe(t){return t}function qK(t,e=[]){const n=t.items;const s=JJe(t.status);return{items:aet({items:n,status:s,turnStartedAtMs:t.turnStartedAtMs??null,finalAssistantStartedAtMs:t.finalAssistantStartedAtMs??null}),status:s,cwd:t.params?.cwd?t.params.cwd:null,collaborationMode:t.params?.collaborationMode??null}}function aet({items:t,status:e,turnStartedAtMs:n,finalAssistantStartedAtMs:r}){return t}function k2n(t){const e=ae.c(6),{timeLabel:n}=t;return p.jsx("div",{children:n})}function e7(t){const e=ae.c(73),{item:n}=t;switch(n.type){case"worked-for":{let f;return e[38]!==n.timeLabel?(f=p.jsx(k2n,{timeLabel:n.timeLabel}),e[38]=n.timeLabel,e[39]=f):f=e[39],f}default:return null}}export{qK as qK};';
  const out = patchWebviewBundleJsV71(input);
  assert.match(out, /CODEX_WORKFLOW_FOLD_PATCH_V71_W1/);
  assert.match(out, /__codexWorkflowApplyV71/);
  assert.match(out, /__codexWorkflowWorkedForRowV71/);
  assert.ok(out.includes('case"worked-for":return p.jsx(__codexWorkflowWorkedForRowV71,{item:n});'));
});

test("patchWebviewBundleJs auto-routes to v71 patch shape", () => {
  const input =
    'function JJe(t){return t}function qK(t,e=[]){const n=t.items;const s=JJe(t.status);return{items:aet({items:n,status:s,turnStartedAtMs:t.turnStartedAtMs??null,finalAssistantStartedAtMs:t.finalAssistantStartedAtMs??null}),status:s,cwd:t.params?.cwd?t.params.cwd:null,collaborationMode:t.params?.collaborationMode??null}}function aet({items:t,status:e,turnStartedAtMs:n,finalAssistantStartedAtMs:r}){return t}function k2n(t){const e=ae.c(6),{timeLabel:n}=t;return p.jsx("div",{children:n})}function e7(t){const e=ae.c(73),{item:n}=t;switch(n.type){case"worked-for":{let f;return e[38]!==n.timeLabel?(f=p.jsx(k2n,{timeLabel:n.timeLabel}),e[38]=n.timeLabel,e[39]=f):f=e[39],f}default:return null}}export{qK as qK};';
  const out = patchWebviewBundleJs(input);
  assert.match(out, /CODEX_WORKFLOW_FOLD_PATCH_V71_W1/);
});

test("v71 apply function keeps only user/worked-for/final when collapsed", () => {
  const input =
    'function JJe(t){return t}function qK(t,e=[]){const n=t.items;const s=JJe(t.status);return{items:aet({items:n,status:s,turnStartedAtMs:t.turnStartedAtMs??null,finalAssistantStartedAtMs:t.finalAssistantStartedAtMs??null}),status:s,cwd:t.params?.cwd?t.params.cwd:null,collaborationMode:t.params?.collaborationMode??null}}function aet({items:t,status:e,turnStartedAtMs:n,finalAssistantStartedAtMs:r}){return t}function k2n(t){const e=ae.c(6),{timeLabel:n}=t;return p.jsx("div",{children:n})}function e7(t){const e=ae.c(73),{item:n}=t;switch(n.type){case"worked-for":{let f;return e[38]!==n.timeLabel?(f=p.jsx(k2n,{timeLabel:n.timeLabel}),e[38]=n.timeLabel,e[39]=f):f=e[39],f}default:return null}}export{qK as qK};';
  const out = patchWebviewBundleJsV71(input);
  const start = out.indexOf("/* CODEX_WORKFLOW_FOLD_PATCH_V71 */");
  const end = out.indexOf("/* END CODEX_WORKFLOW_FOLD_PATCH_V71 */");
  assert.ok(start !== -1 && end !== -1);
  const patchBlock =
    out.slice(start, end + "/* END CODEX_WORKFLOW_FOLD_PATCH_V71 */".length) + "\n";

  const ctx = {
    document: { querySelector: () => ({ getAttribute: () => "collapse" }) },
    reactExports: {},
    p: { jsx: () => ({}) },
    k2n: () => null,
  };
  vm.runInNewContext(patchBlock, ctx, { timeout: 1000 });

  const collapsed = ctx.__codexWorkflowApplyV71({
    items: [
      { type: "user-message", id: "u1" },
      { type: "reasoning", id: "r1" },
      { type: "exec", id: "x1" },
      { type: "worked-for", timeLabel: "3s" },
      { type: "assistant-message", id: "a1" },
    ],
    mode: "collapse",
    turn: { id: "turn-1" },
    status: "complete",
  });

  assert.equal(
    collapsed.map((i) => i.type).join(","),
    "user-message,worked-for,assistant-message"
  );
  assert.equal(collapsed[1].__codexTurnKey, "turn:turn-1");
});

test("v71 toggle flips collapse state", () => {
  const input =
    'function JJe(t){return t}function qK(t,e=[]){const n=t.items;const s=JJe(t.status);return{items:aet({items:n,status:s,turnStartedAtMs:t.turnStartedAtMs??null,finalAssistantStartedAtMs:t.finalAssistantStartedAtMs??null}),status:s,cwd:t.params?.cwd?t.params.cwd:null,collaborationMode:t.params?.collaborationMode??null}}function aet({items:t,status:e,turnStartedAtMs:n,finalAssistantStartedAtMs:r}){return t}function k2n(t){const e=ae.c(6),{timeLabel:n}=t;return p.jsx("div",{children:n})}function e7(t){const e=ae.c(73),{item:n}=t;switch(n.type){case"worked-for":{let f;return e[38]!==n.timeLabel?(f=p.jsx(k2n,{timeLabel:n.timeLabel}),e[38]=n.timeLabel,e[39]=f):f=e[39],f}default:return null}}export{qK as qK};';
  const out = patchWebviewBundleJsV71(input);
  const start = out.indexOf("/* CODEX_WORKFLOW_FOLD_PATCH_V71 */");
  const end = out.indexOf("/* END CODEX_WORKFLOW_FOLD_PATCH_V71 */");
  const patchBlock =
    out.slice(start, end + "/* END CODEX_WORKFLOW_FOLD_PATCH_V71 */".length) + "\n";

  const ctx = {
    document: { querySelector: () => ({ getAttribute: () => "collapse" }) },
    reactExports: {},
    p: { jsx: () => ({}) },
    k2n: () => null,
  };
  vm.runInNewContext(patchBlock, ctx, { timeout: 1000 });

  assert.equal(ctx.__codexWorkflowIsCollapsedV71("turn:1", "collapse"), true);
  ctx.__codexWorkflowToggleV71("turn:1", "collapse");
  assert.equal(ctx.__codexWorkflowIsCollapsedV71("turn:1", "collapse"), false);
  ctx.__codexWorkflowToggleV71("turn:1", "collapse");
  assert.equal(ctx.__codexWorkflowIsCollapsedV71("turn:1", "collapse"), true);
});

test("v71 patch inserts at final export boundary", () => {
  const input =
    'function JJe(t){return t}function qK(t,e=[]){const n=t.items;const s=JJe(t.status);return{items:aet({items:n,status:s,turnStartedAtMs:t.turnStartedAtMs??null,finalAssistantStartedAtMs:t.finalAssistantStartedAtMs??null}),status:s,cwd:t.params?.cwd?t.params.cwd:null,collaborationMode:t.params?.collaborationMode??null}}function aet({items:t,status:e,turnStartedAtMs:n,finalAssistantStartedAtMs:r}){return t}function k2n(t){const e=ae.c(6),{timeLabel:n}=t;return p.jsx("div",{children:n})}function e7(t){const e=ae.c(73),{item:n}=t;switch(n.type){case"worked-for":{let f;return e[38]!==n.timeLabel?(f=p.jsx(k2n,{timeLabel:n.timeLabel}),e[38]=n.timeLabel,e[39]=f):f=e[39],f}default:return null}},p.jsx(Y4n,{})]}),p.jsx(Z4n,{children:p.jsx(m5n,{})})]})})})})})})})})]})})]})})})})})})}));export{qK as qK};';
  const out = patchWebviewBundleJsV71(input);
  assert.match(out, /\/\* END CODEX_WORKFLOW_FOLD_PATCH_V71 \*\/\nexport\{/);
  assert.doesNotMatch(out, /\/\* END CODEX_WORKFLOW_FOLD_PATCH_V71 \*\/\n,p\.jsx\(/);
});
