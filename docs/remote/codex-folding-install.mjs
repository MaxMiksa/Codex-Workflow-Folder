#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import https from "node:https";

function die(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function log(message) {
  process.stdout.write(`${message}\n`);
}

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function fetchText(url) {
  if (typeof globalThis.fetch === "function") {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.text();
  }

  return await new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          res.resume();
          return;
        }
        res.setEncoding("utf8");
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => resolve(data));
      })
      .on("error", reject);
  });
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
  const entries = (await fs.readdir(assetsDir)).filter((n) =>
    /^zh-CN-.*\.js$/.test(n)
  );
  entries.sort((a, b) => a.localeCompare(b));
  const hit = entries[0];
  if (!hit) {
    throw new Error(`Could not find zh-CN locale bundle under ${assetsDir}`);
  }
  return path.join(assetsDir, hit);
}

function patchExtensionHostJs(source) {
  const v6Marker = "CODEX_WORKFLOW_FOLD_HOST_V6";
  if (source.includes(v6Marker)) return source;
  if (source.includes("CODEX_WORKFLOW_FOLD_HOST_")) {
    throw new Error(
      "patchExtensionHostJs: previous host patch detected; restore from .bak and re-install with the latest script"
    );
  }

  const inject =
    '/* CODEX_WORKFLOW_FOLD_HOST_V6 */let wf="collapse";try{let vs=require("vscode"),v=vs?.workspace?.getConfiguration?.()?.get?.("codex.workflow.collapseByDefault");(v==="collapse"||v==="expand"||v==="disable")&&(wf=v)}catch{}try{if(typeof l==="string"&&!l.includes("codex-workflow-collapse")){let meta="<meta name=\\"codex-workflow-collapse\\" content=\\""+wf+"\\">\\n",l2=l.replace("</head>",meta+"</head>");l2===l&&(l2=l.replace("<head>","<head>"+meta),l2===l&&(l2=l.replace(/<head[^>]*>/,m=>m+meta))),l=l2}}catch{}';

  const anchor = "}return l}getWebviewContentDevelopment";
  if (source.includes(anchor)) {
    return source.replace(anchor, () => `}${inject}return l}getWebviewContentDevelopment`);
  }

  const fnStart = source.indexOf("async getWebviewContentProduction(e){");
  if (fnStart === -1) {
    throw new Error(
      "patchExtensionHostJs: getWebviewContentProduction not found"
    );
  }

  const returnIdx = source.indexOf("return l}", fnStart);
  if (returnIdx === -1) {
    throw new Error(
      "patchExtensionHostJs: getWebviewContentProduction return not found"
    );
  }

  return source.slice(0, returnIdx) + inject + source.slice(returnIdx);
}

function patchWebviewBundleJs(source) {
  if (source.includes("CODEX_WORKFLOW_FOLD_PATCH_V3")) return source;

  const exportIdx = source.lastIndexOf("export{");
  if (exportIdx === -1) {
    throw new Error('patchWebviewBundleJs: could not find trailing "export{"');
  }

  const patch = `
/* CODEX_WORKFLOW_FOLD_PATCH */
/* CODEX_WORKFLOW_FOLD_PATCH_V2 */
/* CODEX_WORKFLOW_FOLD_PATCH_V3 */
function __codexWorkflowCollapseMode(){const m=globalThis.document?.querySelector('meta[name="codex-workflow-collapse"]');const v=m?.getAttribute("content")?.trim();return v==="collapse"||v==="expand"||v==="disable"?v:"disable"}
function __codexWorkflowFormatElapsed(ms){const s=Math.max(0,Math.floor(ms/1e3));const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),ss=s%60;const p=n=>String(n).padStart(2,"0");if(h>0)return \`\${h}h\${p(m)}m\${p(ss)}s\`;return \`\${m}m\${p(ss)}s\`}
function __codexWorkflowFoldItems(items,mode){if(mode==="disable")return items;if(!Array.isArray(items))return items;const out=[];let inTurn=!1;let children=[];let turnIndex=-1;const pushWorkflow=()=>{if(children.length===0)return;out.push({type:"workflow",id:\`workflow-\${turnIndex}\`,children,defaultCollapsed:mode==="collapse"})};for(const it of items){if(it?.type==="user-message"){inTurn=!0;turnIndex++;out.push(it);children=[];continue}if(inTurn&&it?.type==="assistant-message"){pushWorkflow();out.push(it);inTurn=!1;children=[];continue}if(inTurn)children.push(it);else out.push(it)}inTurn&&pushWorkflow();return out}
const __codexOrigMapStateToLocalConversationItems=typeof mapStateToLocalConversationItems==="function"?mapStateToLocalConversationItems:null;
if(__codexOrigMapStateToLocalConversationItems){mapStateToLocalConversationItems=function(rt,Ye){const items=__codexOrigMapStateToLocalConversationItems(rt,Ye);const mode=__codexWorkflowCollapseMode();if(mode==="disable")return items;if(!Array.isArray(items))return items;try{return __codexWorkflowFoldItems(items,mode)}catch(e){try{console.error("Codex Workflow fold failed (mapState):",e)}catch{}return items}}}
const __codexOrigIsAgentItemStillRunning=typeof isAgentItemStillRunning==="function"?isAgentItemStillRunning:null;
if(__codexOrigIsAgentItemStillRunning){isAgentItemStillRunning=function(it){if(it?.type==="workflow")return(it.children??[]).some(ch=>__codexOrigIsAgentItemStillRunning(ch));return __codexOrigIsAgentItemStillRunning(it)}}
function __CodexWorkflowItem(rt){const {item:it}=rt,mode=__codexWorkflowCollapseMode();if(mode==="disable")return null;const intl=useIntl();const startedAt=reactExports.useRef(Date.now());const isRunning=(it.children??[]).some(ch=>__codexOrigIsAgentItemStillRunning?__codexOrigIsAgentItemStillRunning(ch):!1);const [now,setNow]=reactExports.useState(Date.now());reactExports.useEffect(()=>{if(!isRunning)return;const id=setInterval(()=>setNow(Date.now()),1e3);return()=>clearInterval(id)},[isRunning]);const [collapsed,setCollapsed]=reactExports.useState(it.defaultCollapsed===!0);const statusLabel=isRunning?intl.formatMessage({id:"codex.workflow.status.working",defaultMessage:"Working",description:"Status shown in Workflow header when the agent is still running"}):intl.formatMessage({id:"codex.workflow.status.done",defaultMessage:"Done",description:"Status shown in Workflow header when the agent has finished"});const elapsed=__codexWorkflowFormatElapsed((isRunning?now:Date.now())-startedAt.current);const header=jsxRuntimeExports.jsx("div",{className:"flex items-center gap-1.5",children:jsxRuntimeExports.jsx("span",{className:"truncate",children:intl.formatMessage({id:"codex.workflow.label",defaultMessage:"Workflow",description:"Label for the Workflow folding header"})})});const meta=jsxRuntimeExports.jsx("span",{className:"text-token-description-foreground text-xs whitespace-nowrap",children:intl.formatMessage({id:"codex.workflow.headerSuffix",defaultMessage:"({status}, {elapsed})",description:"Suffix in Workflow header with status and elapsed time"},{status:statusLabel,elapsed})});const title=jsxRuntimeExports.jsxs("div",{className:"flex min-w-0 items-baseline gap-2",children:[header,meta]});const chevron=jsxRuntimeExports.jsx(typeof SvgChevronRight!=="undefined"?SvgChevronRight:"span",{className:clsx("icon-xs transition-transform",collapsed?"rotate-0":"rotate-90")});const action=jsxRuntimeExports.jsx("div",{className:"flex items-center",children:chevron});const expanded=!collapsed&&(it.children??[]).length>0?jsxRuntimeExports.jsx("div",{className:"border-token-border/80 border-x border-b bg-token-input-background/70 flex flex-col gap-2 px-3 py-2",children:(it.children??[]).map((ch,idx)=>jsxRuntimeExports.jsx(__codexOrigLocalConversationItemContent,{...rt,item:ch},ch?.callId??ch?.id??\`\${it.id}-\${idx}\`))}):null;return jsxRuntimeExports.jsx(InProgressFixedContentItem,{onClick:()=>setCollapsed(v=>!v),children:title,action,expandedContent:expanded})}
const __codexOrigLocalConversationItemContent=typeof LocalConversationItemContent==="function"?LocalConversationItemContent:null;
if(__codexOrigLocalConversationItemContent){LocalConversationItemContent=function(rt){if(rt?.item?.type==="workflow"){try{return __CodexWorkflowItem(rt)}catch(e){try{console.error("Codex Workflow fold failed (render):",e)}catch{}const it=rt?.item;return jsxRuntimeExports.jsx("div",{className:"border-token-border/80 border bg-token-input-background/70 flex flex-col gap-2 px-3 py-2",children:(it?.children??[]).map((ch,idx)=>jsxRuntimeExports.jsx(__codexOrigLocalConversationItemContent,{...rt,item:ch},ch?.callId??ch?.id??\`\${it?.id??"workflow"}-\${idx}\`))})}}return __codexOrigLocalConversationItemContent(rt)}}
/* END CODEX_WORKFLOW_FOLD_PATCH */
`;

  if (source.includes("CODEX_WORKFLOW_FOLD_PATCH")) {
    const start = source.indexOf("/* CODEX_WORKFLOW_FOLD_PATCH */");
    const end = source.indexOf("/* END CODEX_WORKFLOW_FOLD_PATCH */");
    if (start !== -1 && end !== -1) {
      const endIdx = end + "/* END CODEX_WORKFLOW_FOLD_PATCH */".length;
      return source.slice(0, start) + patch.trimStart() + source.slice(endIdx);
    }
    throw new Error("patchWebviewBundleJs: existing patch markers missing for upgrade");
  }

  return source.slice(0, exportIdx) + patch + source.slice(exportIdx);
}

function patchZhCnLocaleJs(source) {
  if (source.includes("codex.workflow.headerSuffix")) return source;

  const tail = "};export{e as default};";
  const idx = source.indexOf(tail);
  if (idx === -1) {
    throw new Error("patchZhCnLocaleJs: expected locale file tail not found");
  }

  const additions =
    ',"codex.workflow.label":"工作流","codex.workflow.status.working":"进行中","codex.workflow.status.done":"完成","codex.workflow.headerSuffix":"（{status}，{elapsed}）"';

  return source.replace(tail, `${additions}${tail}`);
}

async function patchFile(filePath, patchFn) {
  const before = await fs.readFile(filePath, "utf8");
  const after = patchFn(before);
  if (after === before) return { changed: false };

  const backupPath = `${filePath}.bak`;
  if (!(await fileExists(backupPath))) {
    await fs.writeFile(backupPath, before, "utf8");
  }

  await fs.writeFile(filePath, after, "utf8");
  return { changed: true, backupPath };
}

// Config is controlled via VS Code settings (recommended), not via ~/.codex/config.toml.

async function maybeDownloadManual() {
  const url =
    "https://raw.githubusercontent.com/MaxMiksa/Codex-Folding/main/docs/AI_OPERATOR_MANUAL.md";
  const content = await fetchText(url);

  const candidates = [
    path.join(os.homedir(), "Downloads"),
    os.homedir(),
    process.cwd(),
  ];

  for (const dir of candidates) {
    try {
      await fs.mkdir(dir, { recursive: true });
      const outPath = path.join(dir, "Codex-Folding-AI-Operator-Manual.md");
      await fs.writeFile(outPath, content, "utf8");
      return { outPath, url };
    } catch {
      // try next dir
    }
  }

  return { outPath: null, url };
}

async function readExtensionVersion(extDir) {
  const pkgPath = path.join(extDir, "package.json");
  try {
    const raw = await fs.readFile(pkgPath, "utf8");
    const pkg = JSON.parse(raw);
    const version = typeof pkg.version === "string" ? pkg.version : null;
    return { version, pkgPath };
  } catch {
    return { version: null, pkgPath };
  }
}

async function main() {
  const extDir = await findLatestOpenAiChatgptExtensionDir();
  const { version } = await readExtensionVersion(extDir);
  log(`Extension: ${extDir}${version ? ` (version: ${version})` : ""}`);

  const hostJs = path.join(extDir, "out", "extension.js");
  const webviewJs = await readWebviewEntryJsPath(extDir);
  const zhCnJs = await readZhCnLocalePath(extDir);

  const results = [];
  results.push({
    file: hostJs,
    ...(await patchFile(hostJs, patchExtensionHostJs)),
    verifyIncludes: "codex-workflow-collapse",
  });
  results.push({
    file: webviewJs,
    ...(await patchFile(webviewJs, patchWebviewBundleJs)),
    verifyIncludes: "CODEX_WORKFLOW_FOLD_PATCH",
  });
  results.push({
    file: zhCnJs,
    ...(await patchFile(zhCnJs, patchZhCnLocaleJs)),
    verifyIncludes: "codex.workflow.label",
  });

  // Verify markers are present after patch.
  for (const r of results) {
    const content = await fs.readFile(r.file, "utf8");
    if (!content.includes(r.verifyIncludes)) {
      throw new Error(`Verify failed: marker not present: ${r.verifyIncludes}`);
    }
  }

  const manual = await maybeDownloadManual();

  for (const r of results) {
    if (r.changed) {
      log(`PATCHED: ${r.file}`);
      if (r.backupPath) log(`  backup: ${r.backupPath}`);
    } else {
      log(`OK: ${r.file}`);
    }
  }
  if (manual.outPath) {
    log(`Manual saved: ${manual.outPath}`);
  } else {
    log(`Manual URL: ${manual.url}`);
  }

  log("");
  log("Next step: restart VS Code to make the change take effect.");
}

await main().catch((err) => {
  die(`Install failed: ${err?.stack || err}`);
});
