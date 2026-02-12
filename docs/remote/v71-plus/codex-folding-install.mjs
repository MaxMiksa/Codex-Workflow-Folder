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

function parseArgs(argv) {
  const args = { extDir: null, strictTarget: true };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--extDir") args.extDir = argv[++i] ?? null;
    else if (a === "--strictTarget") args.strictTarget = true;
    else if (a === "--no-strictTarget") args.strictTarget = false;
    else if (a.startsWith("--strictTarget=")) {
      const v = a.slice("--strictTarget=".length).trim().toLowerCase();
      if (v === "true" || v === "1") args.strictTarget = true;
      else if (v === "false" || v === "0") args.strictTarget = false;
      else throw new Error(`Invalid --strictTarget value: ${v}`);
    } else {
      throw new Error(`Unknown arg: ${a}`);
    }
  }
  return args;
}

function parseSemverParts(version) {
  const m = String(version || "").trim().match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function compareSemver(a, b) {
  const pa = parseSemverParts(a);
  const pb = parseSemverParts(b);
  if (!pa || !pb) return null;
  for (let i = 0; i < 3; i += 1) {
    if (pa[i] > pb[i]) return 1;
    if (pa[i] < pb[i]) return -1;
  }
  return 0;
}

function readVersionFromExtensionDirName(extDir) {
  const base = path.basename(extDir);
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

function chooseBestExtensionCandidate(candidates, { strictTarget = true } = {}) {
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
    if (cmp != null && cmp > 0) maxVersion = parsed[i].version;
  }

  const highest = parsed.filter((c) => compareSemver(c.version, maxVersion) === 0);
  if (highest.length === 1) return highest[0];

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

function parseEntryBundleFromIndexHtml(html) {
  const m = String(html || "").match(/src="\.\/assets\/(index-[^"]+\.js)"/);
  return m ? m[1] : null;
}

function chooseZhCnBundleName({ assetNames, entryJs, strictTarget = true }) {
  const assets = Array.isArray(assetNames) ? assetNames : [];
  const zhCandidates = assets.filter((n) => /^zh-CN-.*\.js$/.test(n));
  if (zhCandidates.length === 0) return null;

  const refs = [...new Set((String(entryJs || "").match(/zh-CN-[A-Za-z0-9_-]+\.js/g) || []))]
    .filter((n) => zhCandidates.includes(n));

  if (refs.length === 1) return refs[0];
  if (refs.length > 1) {
    if (strictTarget) {
      throw new Error(
        [
          "Ambiguous zh-CN bundle: active entry references multiple zh-CN bundles.",
          ...refs.map((n) => `- ${n}`),
          "Please rerun with --extDir <path> or --strictTarget=false.",
        ].join("\n")
      );
    }
    return [...refs].sort((a, b) => a.localeCompare(b))[0];
  }

  if (zhCandidates.length === 1) return zhCandidates[0];

  if (strictTarget) {
    throw new Error(
      [
        "Ambiguous zh-CN bundle: multiple bundles found but active entry does not reference one uniquely.",
        ...zhCandidates.map((n) => `- ${n}`),
        "Please rerun with --extDir <path> or --strictTarget=false.",
      ].join("\n")
    );
  }

  return [...zhCandidates].sort((a, b) => a.localeCompare(b))[0];
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
  const bundleName = parseEntryBundleFromIndexHtml(html);
  if (!bundleName) {
    throw new Error(`Could not find webview entry JS in ${htmlPath}`);
  }
  return path.join(extDir, "webview", "assets", bundleName);
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

function patchExtensionHostJs(source) {
  const v7Marker = "CODEX_WORKFLOW_FOLD_HOST_V7";
  if (source.includes(v7Marker)) return source;

  const inject =
    '/* CODEX_WORKFLOW_FOLD_HOST_V7 */let wf="collapse";try{let vs=require("vscode"),v=vs?.workspace?.getConfiguration?.()?.get?.("codex.workflow.collapseByDefault");(v==="collapse"||v==="expand"||v==="disable")&&(wf=v)}catch{}try{if(typeof l==="string"&&!l.includes("codex-workflow-collapse")){let meta="<meta name=\\"codex-workflow-collapse\\" content=\\""+wf+"\\">\\n",l2=l.replace("</head>",meta+"</head>");l2===l&&(l2=l.replace("<head>","<head>"+meta),l2===l&&(l2=l.replace(/<head[^>]*>/,m=>m+meta))),l=l2}}catch{}try{const K=\"codex.workflow.timerStore.v1\",P=\"codex.workflow.timer.\";const self=this,gs=self?.globalState,repo=self?.sharedObjectRepository;if(self&&!self.__codexWorkflowTimerStoreInit&&gs&&repo&&typeof gs.get===\"function\"&&typeof gs.update===\"function\"&&typeof repo.get===\"function\"&&typeof repo.set===\"function\"){self.__codexWorkflowTimerStoreInit=!0;Promise.resolve(gs.get(K)).then(st=>{try{if(st&&typeof st===\"object\"){for(const k of Object.keys(st)){if(typeof k===\"string\"&&k.startsWith(P))repo.set(k,st[k])}}}catch{}}).catch(()=>{});if(!repo.__codexWorkflowTimerPersist){repo.__codexWorkflowTimerPersist=!0;const orig=repo.set.bind(repo);repo.set=function(k,v){try{if(typeof k===\"string\"&&k.startsWith(P)){Promise.resolve(gs.get(K)).then(st=>{try{const next=st&&typeof st===\"object\"?{...st}:{};v===void 0?delete next[k]:next[k]=v;return gs.update(K,next)}catch{}}).catch(()=>{})}}catch{}return orig(k,v)}}}}catch{}';

  const v6Marker = "CODEX_WORKFLOW_FOLD_HOST_V6";
  if (source.includes("CODEX_WORKFLOW_FOLD_HOST_")) {
    if (source.includes(v6Marker)) {
      const oldInject =
        '/* CODEX_WORKFLOW_FOLD_HOST_V6 */let wf="collapse";try{let vs=require("vscode"),v=vs?.workspace?.getConfiguration?.()?.get?.("codex.workflow.collapseByDefault");(v==="collapse"||v==="expand"||v==="disable")&&(wf=v)}catch{}try{if(typeof l==="string"&&!l.includes("codex-workflow-collapse")){let meta="<meta name=\\"codex-workflow-collapse\\" content=\\""+wf+"\\">\\n",l2=l.replace("</head>",meta+"</head>");l2===l&&(l2=l.replace("<head>","<head>"+meta),l2===l&&(l2=l.replace(/<head[^>]*>/,m=>m+meta))),l=l2}}catch{}';
      if (source.includes(oldInject)) return source.replace(oldInject, inject);
    }

    throw new Error(
      "patchExtensionHostJs: previous host patch detected; restore from .bak and re-install with the latest script"
    );
  }

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
  if (
    source.includes("CODEX_WORKFLOW_FOLD_PATCH_V71_W1") ||
    source.includes("CODEX_WORKFLOW_FOLD_PATCH_V73_W1")
  ) {
    return source;
  }

  const looksLikeV73 =
    source.includes("const s=jtt(t.status);return{items:Vtt({items:n,status:s,turnStartedAtMs:t.turnStartedAtMs??null,finalAssistantStartedAtMs:t.finalAssistantStartedAtMs??null}),status:s,cwd:t.params?.cwd?t.params.cwd:null,collaborationMode:t.params?.collaborationMode??null}}function Vtt(") &&
    source.includes("function T3n(t){") &&
    source.includes('case"worked-for":{let f;return e[39]!==n.timeLabel?(f=p.jsx(T3n,{timeLabel:n.timeLabel}),e[39]=n.timeLabel,e[40]=f):f=e[40],f}') &&
    source.includes("const n=oe.c(8),{conversationId:r,turn:i,requests:s,conversationDetailLevel:o,cwd:a}=e;let l;n[0]!==i||n[1]!==s?(l=oR(i,s),n[0]=i,n[1]=s,n[2]=l):l=n[2];");

  if (looksLikeV73) {
    return patchWebviewBundleJsV73(source);
  }

  const looksLikeV71 =
    source.includes("const s=JJe(t.status);return{items:aet({items:n,status:s,turnStartedAtMs:t.turnStartedAtMs??null,finalAssistantStartedAtMs:t.finalAssistantStartedAtMs??null}),status:s,cwd:t.params?.cwd?t.params.cwd:null,collaborationMode:t.params?.collaborationMode??null}}function aet(") &&
    source.includes("function k2n(t){") &&
    source.includes('case"worked-for":') &&
    !source.includes("function mapStateToLocalConversationItems");

  if (looksLikeV71) {
    return patchWebviewBundleJsV71(source);
  }

  if (source.includes("CODEX_WORKFLOW_FOLD_PATCH_V14")) return source;

  const exportIdx = source.lastIndexOf("export{");
  if (exportIdx === -1) {
    throw new Error('patchWebviewBundleJs: could not find trailing "export{"');
  }

  const patch = `
/* CODEX_WORKFLOW_FOLD_PATCH */
/* CODEX_WORKFLOW_FOLD_PATCH_V2 */
/* CODEX_WORKFLOW_FOLD_PATCH_V3 */
/* CODEX_WORKFLOW_FOLD_PATCH_V4 */
/* CODEX_WORKFLOW_FOLD_PATCH_V5 */
	/* CODEX_WORKFLOW_FOLD_PATCH_V6 */
	/* CODEX_WORKFLOW_FOLD_PATCH_V10 */
	/* CODEX_WORKFLOW_FOLD_PATCH_V11 */
	/* CODEX_WORKFLOW_FOLD_PATCH_V12 */
	/* CODEX_WORKFLOW_FOLD_PATCH_V13 */
	/* CODEX_WORKFLOW_FOLD_PATCH_V14 */
	function __codexWorkflowCollapseMode(){const m=globalThis.document?.querySelector('meta[name="codex-workflow-collapse"]');const v=m?.getAttribute("content")?.trim();return v==="collapse"||v==="expand"||v==="disable"?v:"collapse"}
	function __codexWorkflowFormatElapsed(ms){const s=Math.max(0,Math.floor(ms/1e3));const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),ss=s%60;const p=n=>String(n).padStart(2,"0");if(h>0)return \`\${h}h\${p(m)}m\${p(ss)}s\`;return \`\${m}m\${p(ss)}s\`}
	function __codexWorkflowFormatElapsedCompact(ms,locale){const s=Math.max(0,Math.floor(ms/1e3));const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),ss=s%60;const p=n=>String(n).padStart(2,"0");const l=String(locale??"").toLowerCase();const isZh=l.startsWith("zh");if(isZh){if(h>0)return h+" 小时 "+p(m)+" 分 "+p(ss)+" 秒";return m+" 分 "+p(ss)+" 秒"}if(h>0)return h+" h "+p(m)+" m "+p(ss)+" s";return m+" m "+p(ss)+" s"}
	function __codexWorkflowPickBorderRadiusFromNode(node){try{const root=node instanceof Element?node:null;if(!root||!globalThis.getComputedStyle)return null;let best=null;let bestPx=0;const els=[root,...root.querySelectorAll("*")];for(const el of els){const cs=globalThis.getComputedStyle(el);if(!cs)continue;const bg=cs.backgroundColor;if(!bg||bg==="rgba(0, 0, 0, 0)"||bg==="transparent")continue;const br=cs.borderRadius;if(!br||br==="0px")continue;const m=br.match(/(\\d+(?:\\.\\d+)?)px/);if(!m)continue;const px=Number(m[1]);if(Number.isFinite(px)&&px>bestPx){bestPx=px;best=px+"px"}}return best}catch{return null}}
	function __codexWorkflowTimerKey(conversationId,workflowId){try{const cid=conversationId==null?"unknown":String(conversationId);const wid=workflowId==null?"workflow":String(workflowId);return "codex.workflow.timer."+cid+"."+wid}catch{return "codex.workflow.timer.unknown"}}
function __codexWorkflowFoldItems(items,mode,turnIsRunning){if(mode==="disable")return items;if(!Array.isArray(items))return items;const out=[];let inTurn=!1;let children=[];let turnIndex=-1;let lastWorkflow=null;const pushWorkflow=()=>{if(children.length===0)return;const wf={type:"workflow",id:\`workflow-\${turnIndex}\`,children,defaultCollapsed:mode==="collapse"};out.push(wf),lastWorkflow=wf};for(const it of items){if(it?.type==="user-message"){inTurn=!0;turnIndex++;out.push(it);children=[];continue}if(inTurn&&it?.type==="assistant-message"){pushWorkflow();out.push(it);inTurn=!1;children=[];continue}if(inTurn&&it?.type==="plan"){out.push(it);continue}if(inTurn)children.push(it);else out.push(it)}inTurn&&pushWorkflow();typeof turnIsRunning===\"boolean\"&&lastWorkflow&&(lastWorkflow.__codexIsRunning=turnIsRunning);return out}
const __codexOrigMapStateToLocalConversationItems=typeof mapStateToLocalConversationItems==="function"?mapStateToLocalConversationItems:null;
function __codexWorkflowStatusIsRunning(st){if(typeof st===\"string\"){const s=st.toLowerCase();return s===\"inprogress\"||s===\"running\"||s===\"pending\"||s===\"in_progress\"||s.includes(\"progress\")}return!!st?.isPending||!!st?.inProgress}
if(__codexOrigMapStateToLocalConversationItems){try{mapStateToLocalConversationItems=function(rt,Ye){const res=__codexOrigMapStateToLocalConversationItems(rt,Ye);const mode=__codexWorkflowCollapseMode();if(mode==="disable")return res;const st=Array.isArray(res)?rt?.status:(res?.status??rt?.status);const turnIsRunning=__codexWorkflowStatusIsRunning(st);try{if(Array.isArray(res))return __codexWorkflowFoldItems(res,mode,turnIsRunning);if(res&&Array.isArray(res.items))return{...res,items:__codexWorkflowFoldItems(res.items,mode,turnIsRunning)};if(res&&Array.isArray(res.localConversationItems))return{...res,localConversationItems:__codexWorkflowFoldItems(res.localConversationItems,mode,turnIsRunning)};if(res&&Array.isArray(res.conversationItems))return{...res,conversationItems:__codexWorkflowFoldItems(res.conversationItems,mode,turnIsRunning)};return res}catch(e){try{console.error("Codex Workflow fold failed (mapState):",e)}catch{}return res}}}catch(e){try{console.error("Codex Workflow fold failed (mapState install):",e)}catch{}}}
const __codexOrigIsAgentItemStillRunning=typeof isAgentItemStillRunning==="function"?isAgentItemStillRunning:null;
	if(__codexOrigIsAgentItemStillRunning){try{isAgentItemStillRunning=function(it){if(it?.type==="workflow")return(it.children??[]).some(ch=>__codexOrigIsAgentItemStillRunning(ch));return __codexOrigIsAgentItemStillRunning(it)}}catch(e){try{console.error("Codex Workflow fold failed (isRunning install):",e)}catch{}}}
	function __codexWorkflowItemIsRunning(it){const kids=it?.children??[];for(const ch of kids){if(!ch)continue;try{if(__codexOrigIsAgentItemStillRunning&&__codexOrigIsAgentItemStillRunning(ch))return!0}catch{}if(ch.completed===!1||ch.isPending===!0)return!0;const st=ch.status??ch.state;if(st==="inProgress"||st==="pending"||st==="running")return!0}return!1}
		function __CodexWorkflowItemInner(p){const rt=p?.rt;const {item:it}=rt??{},mode=__codexWorkflowCollapseMode();if(mode==="disable")return null;const intl=useIntl();const startedAt=reactExports.useRef(Date.now()),doneAt=reactExports.useRef(null),everRunning=reactExports.useRef(!1),persistedWritten=reactExports.useRef(!1);const timerKey=__codexWorkflowTimerKey(rt?.conversationId,it?.id);const [persisted,setPersisted]=typeof useSharedObject==="function"?useSharedObject(timerKey):[null,()=>{}];const persistedMs=typeof persisted?.durationMs==="number"&&Number.isFinite(persisted.durationMs)?persisted.durationMs:null;reactExports.useEffect(()=>{try{startedAt.current=Date.now();doneAt.current=null;everRunning.current=!1;persistedWritten.current=!1}catch{}},[timerKey]);const rootRef=reactExports.useRef(null);const [radius,setRadius]=reactExports.useState(null);reactExports.useEffect(()=>{try{const el=rootRef.current;if(!el)return;const prev=el.previousElementSibling;if(!prev)return;const r=__codexWorkflowPickBorderRadiusFromNode(prev);if(r)setRadius(r)}catch{}},[]);const isRunning=typeof it?.__codexIsRunning==="boolean"?it.__codexIsRunning:__codexWorkflowItemIsRunning(it);reactExports.useEffect(()=>{if(isRunning)everRunning.current=!0},[isRunning]);reactExports.useEffect(()=>{if(!isRunning&&doneAt.current==null)doneAt.current=Date.now();if(isRunning)doneAt.current=null},[isRunning]);const [now,setNow]=reactExports.useState(Date.now());reactExports.useEffect(()=>{if(!isRunning)return;const id=setInterval(()=>setNow(Date.now()),1e3);return()=>clearInterval(id)},[isRunning]);reactExports.useEffect(()=>{if(isRunning)return;if(!everRunning.current)return;if(persistedWritten.current)return;if(persistedMs!=null)return;if(doneAt.current==null)return;persistedWritten.current=!0;const ms=Math.max(0,doneAt.current-startedAt.current);try{setPersisted({durationMs:ms})}catch{}},[isRunning,persistedMs]);const [collapsed,setCollapsed]=reactExports.useState(it.defaultCollapsed===!0);const endTs=isRunning?now:(doneAt.current??now);const elapsedMs=!isRunning&&persistedMs!=null?persistedMs:endTs-startedAt.current;const elapsed=__codexWorkflowFormatElapsedCompact(elapsedMs,intl?.locale);const icon=isRunning?"⚡":"✅";const header=jsxRuntimeExports.jsx("div",{className:"flex items-center gap-1.5",children:jsxRuntimeExports.jsx("span",{className:"truncate",children:intl.formatMessage({id:"codex.workflow.label",defaultMessage:"Workflow",description:"Label for the Workflow folding header"})})});const meta=jsxRuntimeExports.jsx("span",{className:"text-token-description-foreground whitespace-nowrap opacity-70",children:icon+" "+elapsed});const title=jsxRuntimeExports.jsxs("div",{className:"flex min-w-0 items-baseline gap-2",children:[header,meta]});const chevron=jsxRuntimeExports.jsx(typeof SvgChevronRight!=="undefined"?SvgChevronRight:"span",{className:clsx("icon-xs transition-transform",collapsed?"rotate-0":"rotate-90")});const row=jsxRuntimeExports.jsxs("div",{className:"flex w-full items-center justify-between gap-2",children:[title,chevron]});const expanded=!collapsed&&(it.children??[]).length>0?jsxRuntimeExports.jsx("div",{className:"border-token-border/80 border-t flex flex-col gap-1 px-3 py-2",style:{backgroundColor:"#212121"},children:(it.children??[]).map((ch,idx)=>jsxRuntimeExports.jsx(__codexOrigLocalConversationItemContent,{...rt,item:ch},ch?.callId??ch?.id??\`\${it.id}-\${idx}\`))}):null;const footer=expanded?jsxRuntimeExports.jsx("button",{type:"button",className:"w-full px-3 py-2 text-left border-token-border/80 border-t",style:{backgroundColor:"#212121"},onClick:()=>setCollapsed(v=>!v),children:row}):null;return jsxRuntimeExports.jsxs("div",{ref:rootRef,className:"border-token-border/80 border overflow-hidden",style:{borderRadius:radius||"16px",marginTop:"2px",marginBottom:"6px"},children:[jsxRuntimeExports.jsx("button",{type:"button",className:"w-full px-3 py-2 text-left",style:{backgroundColor:"#212121"},onClick:()=>setCollapsed(v=>!v),children:row}),expanded,footer]})}
const __codexOrigLocalConversationItemContent=typeof LocalConversationItemContent==="function"?LocalConversationItemContent:null;
if(__codexOrigLocalConversationItemContent){try{LocalConversationItemContent=function(rt){if(rt?.item?.type==="workflow"){try{const k=__codexWorkflowTimerKey(rt?.conversationId,rt?.item?.id);return jsxRuntimeExports.jsx(reactExports.Fragment,{children:[jsxRuntimeExports.jsx(__CodexWorkflowItemInner,{rt},k)]})}catch(e){try{console.error("Codex Workflow fold failed (render):",e)}catch{}const it=rt?.item;return jsxRuntimeExports.jsx("div",{className:"border-token-border/80 border bg-token-input-background/70 flex flex-col gap-2 px-3 py-2",children:(it?.children??[]).map((ch,idx)=>jsxRuntimeExports.jsx(__codexOrigLocalConversationItemContent,{...rt,item:ch},ch?.callId??ch?.id??\`\${it?.id??"workflow"}-\${idx}\`))})}}return __codexOrigLocalConversationItemContent(rt)}}catch(e){try{console.error("Codex Workflow fold failed (render install):",e)}catch{}}}
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

function buildWorkedForTogglePatchV71({ marker, workedForComponent }) {
  return `
/* CODEX_WORKFLOW_FOLD_PATCH_V71 */
/* ${marker} */
const __codexWorkflowCollapsedTurnsV71=globalThis.__codexWorkflowCollapsedTurnsV71 instanceof Map?globalThis.__codexWorkflowCollapsedTurnsV71:new Map;globalThis.__codexWorkflowCollapsedTurnsV71=__codexWorkflowCollapsedTurnsV71;const __codexWorkflowListenersV71=globalThis.__codexWorkflowListenersV71 instanceof Set?globalThis.__codexWorkflowListenersV71:new Set;globalThis.__codexWorkflowListenersV71=__codexWorkflowListenersV71;typeof globalThis.__codexWorkflowStoreVersionV71!=="number"&&(globalThis.__codexWorkflowStoreVersionV71=0);function __codexWorkflowEmitV71(){globalThis.__codexWorkflowStoreVersionV71=(globalThis.__codexWorkflowStoreVersionV71|0)+1;for(const l of __codexWorkflowListenersV71){try{l()}catch{}}}function __codexWorkflowSubscribeV71(l){return __codexWorkflowListenersV71.add(l),()=>{__codexWorkflowListenersV71.delete(l)}}function __codexWorkflowSnapshotV71(){return globalThis.__codexWorkflowStoreVersionV71|0}function __codexWorkflowCollapseModeV71(){const m=globalThis.document?.querySelector('meta[name="codex-workflow-collapse"]');const v=m?.getAttribute("content")?.trim();return v==="collapse"||v==="expand"||v==="disable"?v:"collapse"}function __codexWorkflowBuildTurnKeyV71(turn){try{const id=turn?.id??turn?.turnId??turn?.params?.turnId;if(id!=null)return"turn:"+String(id);const s=turn?.turnStartedAtMs??"na",f=turn?.finalAssistantStartedAtMs??"na",n=Array.isArray(turn?.items)?turn.items.length:0;return"turn-ts:"+String(s)+":"+String(f)+":"+String(n)}catch{return"turn:unknown"}}function __codexWorkflowDefaultCollapsedV71(mode){return mode==="collapse"}function __codexWorkflowIsCollapsedV71(turnKey,mode){if(mode==="disable")return!1;const cur=__codexWorkflowCollapsedTurnsV71.get(turnKey);return typeof cur==="boolean"?cur:__codexWorkflowDefaultCollapsedV71(mode)}function __codexWorkflowToggleV71(turnKey,mode){if(!turnKey||mode==="disable")return;const next=!__codexWorkflowIsCollapsedV71(turnKey,mode);__codexWorkflowCollapsedTurnsV71.set(turnKey,next);__codexWorkflowEmitV71()}function __codexWorkflowApplyV71({items,mode,turn,status}){if(!Array.isArray(items))return items;if(mode==="disable")return items;const turnKey=__codexWorkflowBuildTurnKeyV71(turn);let workedIndex=-1;for(let i=items.length-1;i>=0;i-=1){if(items[i]?.type==="worked-for"){workedIndex=i;break}}if(workedIndex<0)return items;const collapsed=__codexWorkflowIsCollapsedV71(turnKey,mode);const out=[];for(let i=0;i<items.length;i+=1){const raw=items[i];const item=i===workedIndex&&raw&&typeof raw==="object"?{...raw,__codexTurnKey:turnKey,__codexWorkflowCollapsed:collapsed}:raw;if(!collapsed){out.push(item);continue}if(i<workedIndex){if(item?.type==="user-message")out.push(item);continue}out.push(item)}return out}const __codexWorkflowReactV71=typeof reactExports!=="undefined"?reactExports:typeof T!=="undefined"?T:null;const __codexWorkflowJsxV71=typeof p!=="undefined"?p:typeof jsxRuntimeExports!=="undefined"?jsxRuntimeExports:null;function __codexWorkflowUseStoreVersionV71(){if(!__codexWorkflowReactV71)return 0;if(typeof __codexWorkflowReactV71.useSyncExternalStore==="function")return __codexWorkflowReactV71.useSyncExternalStore(__codexWorkflowSubscribeV71,__codexWorkflowSnapshotV71,__codexWorkflowSnapshotV71);const[,setTick]=__codexWorkflowReactV71.useState(0);return __codexWorkflowReactV71.useEffect(()=>__codexWorkflowSubscribeV71(()=>setTick(v=>v+1)),[]),0}function __codexWorkflowWorkedForRowV71({item}){const mode=__codexWorkflowCollapseModeV71();if(!__codexWorkflowJsxV71)return null;if(mode==="disable")return __codexWorkflowJsxV71.jsx(${workedForComponent},{timeLabel:item?.timeLabel});const turnKey=item?.__codexTurnKey??null;if(!turnKey)return __codexWorkflowJsxV71.jsx(${workedForComponent},{timeLabel:item?.timeLabel});__codexWorkflowUseStoreVersionV71();const collapsed=__codexWorkflowIsCollapsedV71(turnKey,mode),label=collapsed?"Expand workflow details":"Collapse workflow details",onToggle=()=>__codexWorkflowToggleV71(turnKey,mode),onKeyDown=e=>{(e?.key==="Enter"||e?.key===" ")&&(e.preventDefault(),onToggle())};return __codexWorkflowJsxV71.jsx("button",{type:"button",className:"w-full text-left cursor-pointer",onClick:onToggle,onKeyDown:onKeyDown,"aria-label":label,"data-codex-workflow-worked-for":"true",children:__codexWorkflowJsxV71.jsx(${workedForComponent},{timeLabel:item?.timeLabel})})}
/* END CODEX_WORKFLOW_FOLD_PATCH_V71 */
`;
}

function insertWorkedForTogglePatch(source, patch, errorContext) {
  const tailExportAnchor = "}));export{";
  const tailAnchorIdx = source.lastIndexOf(tailExportAnchor);
  const insertIdx =
    tailAnchorIdx !== -1
      ? tailAnchorIdx + "}));".length
      : source.lastIndexOf("export{");

  if (insertIdx === -1) {
    throw new Error(`${errorContext}: could not find final export anchor`);
  }

  return source.slice(0, insertIdx) + patch + source.slice(insertIdx);
}

function patchWebviewBundleJsV71(source) {
  if (source.includes("CODEX_WORKFLOW_FOLD_PATCH_V71_W1")) return source;

  if (source.includes("CODEX_WORKFLOW_FOLD_PATCH")) {
    throw new Error(
      "patchWebviewBundleJsV71: previous workflow patch detected; restore from .bak before applying 0.4.71 patch"
    );
  }

  const qkAnchor =
    "const s=JJe(t.status);return{items:aet({items:n,status:s,turnStartedAtMs:t.turnStartedAtMs??null,finalAssistantStartedAtMs:t.finalAssistantStartedAtMs??null}),status:s,cwd:t.params?.cwd?t.params.cwd:null,collaborationMode:t.params?.collaborationMode??null}}function aet(";
  const workedCaseAnchor =
    'case"worked-for":{let f;return e[38]!==n.timeLabel?(f=p.jsx(k2n,{timeLabel:n.timeLabel}),e[38]=n.timeLabel,e[39]=f):f=e[39],f}';
  const turnViewMemoAnchor =
    "const n=ae.c(8),{conversationId:r,turn:i,requests:s,conversationDetailLevel:o,cwd:a}=e;let l;n[0]!==i||n[1]!==s?(l=qK(i,s),n[0]=i,n[1]=s,n[2]=l):l=n[2];";

  if (!source.includes(qkAnchor)) {
    throw new Error("patchWebviewBundleJsV71: qK anchor not found (only supports openai.chatgpt@0.4.71)");
  }
  if (!source.includes("function k2n(t){")) {
    throw new Error("patchWebviewBundleJsV71: k2n anchor not found (only supports openai.chatgpt@0.4.71)");
  }
  if (!source.includes(workedCaseAnchor)) {
    throw new Error("patchWebviewBundleJsV71: worked-for render anchor not found (only supports openai.chatgpt@0.4.71)");
  }
  if (!source.includes(turnViewMemoAnchor)) {
    throw new Error("patchWebviewBundleJsV71: turn view memo anchor not found (only supports openai.chatgpt@0.4.71)");
  }

  const qkReplacement =
    "const s=JJe(t.status),__cwfMode=__codexWorkflowCollapseModeV71(),__cwfItems=aet({items:n,status:s,turnStartedAtMs:t.turnStartedAtMs??null,finalAssistantStartedAtMs:t.finalAssistantStartedAtMs??null}),__cwfOut=__codexWorkflowApplyV71({items:__cwfItems,mode:__cwfMode,turn:t,status:s});return{items:__cwfOut,status:s,cwd:t.params?.cwd?t.params.cwd:null,collaborationMode:t.params?.collaborationMode??null}}function aet(";
  const workedCaseReplacement =
    'case"worked-for":return p.jsx(__codexWorkflowWorkedForRowV71,{item:n});';
  const turnViewMemoReplacement =
    "const n=ae.c(9),{conversationId:r,turn:i,requests:s,conversationDetailLevel:o,cwd:a}=e,__cwfViewVersion=__codexWorkflowUseStoreVersionV71();let l;n[0]!==i||n[1]!==s||n[8]!==__cwfViewVersion?(l=qK(i,s),n[0]=i,n[1]=s,n[8]=__cwfViewVersion,n[2]=l):l=n[2];";

  let out = source.replace(qkAnchor, qkReplacement);
  if (out === source) {
    throw new Error("patchWebviewBundleJsV71: failed to rewrite qK return segment");
  }

  const out2 = out.replace(workedCaseAnchor, workedCaseReplacement);
  if (out2 === out) {
    throw new Error("patchWebviewBundleJsV71: failed to rewrite worked-for case segment");
  }
  const out3 = out2.replace(turnViewMemoAnchor, turnViewMemoReplacement);
  if (out3 === out2) {
    throw new Error("patchWebviewBundleJsV71: failed to rewrite turn view memo segment");
  }
  out = out3;

  const patch = buildWorkedForTogglePatchV71({
    marker: "CODEX_WORKFLOW_FOLD_PATCH_V71_W1",
    workedForComponent: "k2n",
  });
  return insertWorkedForTogglePatch(out, patch, "patchWebviewBundleJsV71");
}

function patchWebviewBundleJsV73(source) {
  if (source.includes("CODEX_WORKFLOW_FOLD_PATCH_V73_W1")) return source;

  if (source.includes("CODEX_WORKFLOW_FOLD_PATCH")) {
    throw new Error(
      "patchWebviewBundleJsV73: previous workflow patch detected; restore from .bak before applying 0.4.73 patch"
    );
  }

  const mapperAnchor =
    "const s=jtt(t.status);return{items:Vtt({items:n,status:s,turnStartedAtMs:t.turnStartedAtMs??null,finalAssistantStartedAtMs:t.finalAssistantStartedAtMs??null}),status:s,cwd:t.params?.cwd?t.params.cwd:null,collaborationMode:t.params?.collaborationMode??null}}function Vtt(";
  const workedCaseAnchor =
    'case"worked-for":{let f;return e[39]!==n.timeLabel?(f=p.jsx(T3n,{timeLabel:n.timeLabel}),e[39]=n.timeLabel,e[40]=f):f=e[40],f}';
  const turnViewMemoAnchor =
    "const n=oe.c(8),{conversationId:r,turn:i,requests:s,conversationDetailLevel:o,cwd:a}=e;let l;n[0]!==i||n[1]!==s?(l=oR(i,s),n[0]=i,n[1]=s,n[2]=l):l=n[2];";

  if (!source.includes(mapperAnchor)) {
    throw new Error("patchWebviewBundleJsV73: mapper anchor not found (only supports openai.chatgpt@0.4.73 profile)");
  }
  if (!source.includes("function T3n(t){")) {
    throw new Error("patchWebviewBundleJsV73: worked-for row component anchor not found (expected T3n)");
  }
  if (!source.includes(workedCaseAnchor)) {
    throw new Error("patchWebviewBundleJsV73: worked-for render anchor not found");
  }
  if (!source.includes(turnViewMemoAnchor)) {
    throw new Error("patchWebviewBundleJsV73: turn view memo anchor not found");
  }

  const mapperReplacement =
    "const s=jtt(t.status),__cwfMode=__codexWorkflowCollapseModeV71(),__cwfItems=Vtt({items:n,status:s,turnStartedAtMs:t.turnStartedAtMs??null,finalAssistantStartedAtMs:t.finalAssistantStartedAtMs??null}),__cwfOut=__codexWorkflowApplyV71({items:__cwfItems,mode:__cwfMode,turn:t,status:s});return{items:__cwfOut,status:s,cwd:t.params?.cwd?t.params.cwd:null,collaborationMode:t.params?.collaborationMode??null}}function Vtt(";
  const workedCaseReplacement =
    'case"worked-for":return p.jsx(__codexWorkflowWorkedForRowV71,{item:n});';
  const turnViewMemoReplacement =
    "const n=oe.c(9),{conversationId:r,turn:i,requests:s,conversationDetailLevel:o,cwd:a}=e,__cwfViewVersion=__codexWorkflowUseStoreVersionV71();let l;n[0]!==i||n[1]!==s||n[8]!==__cwfViewVersion?(l=oR(i,s),n[0]=i,n[1]=s,n[8]=__cwfViewVersion,n[2]=l):l=n[2];";

  let out = source.replace(mapperAnchor, mapperReplacement);
  if (out === source) {
    throw new Error("patchWebviewBundleJsV73: failed to rewrite mapper segment");
  }
  const out2 = out.replace(workedCaseAnchor, workedCaseReplacement);
  if (out2 === out) {
    throw new Error("patchWebviewBundleJsV73: failed to rewrite worked-for case segment");
  }
  const out3 = out2.replace(turnViewMemoAnchor, turnViewMemoReplacement);
  if (out3 === out2) {
    throw new Error("patchWebviewBundleJsV73: failed to rewrite turn view memo segment");
  }
  out = out3;

  const patch = buildWorkedForTogglePatchV71({
    marker: "CODEX_WORKFLOW_FOLD_PATCH_V73_W1",
    workedForComponent: "T3n",
  });
  return insertWorkedForTogglePatch(out, patch, "patchWebviewBundleJsV73");
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
    "https://raw.githubusercontent.com/MaxMiksa/Codex-Workflow-Folder/main/docs/AI_OPERATOR_MANUAL.md";
  const content = await fetchText(url);

  const candidates = [
    path.join(os.homedir(), "Downloads"),
    os.homedir(),
    process.cwd(),
  ];

  for (const dir of candidates) {
    try {
      await fs.mkdir(dir, { recursive: true });
      const outPath = path.join(dir, "Codex-Workflow-Folder-AI-Operator-Manual.md");
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
  const args = parseArgs(process.argv);
  const V71 = "0.4.71";
  const V73 = "0.4.73";
  const extDir = await resolveOpenAiChatgptExtensionDir(args);
  const { version: versionFromPkg } = await readExtensionVersion(extDir);
  const version = versionFromPkg || readVersionFromExtensionDirName(extDir);
  const cmpV71 = compareSemver(version, V71);
  const cmpV73 = compareSemver(version, V73);
  if (cmpV71 == null || cmpV73 == null) {
    throw new Error(
      `Cannot parse extension version for routing (detected: ${versionFromPkg || "unknown"}). Please check ${path.join(extDir, "package.json")}.`
    );
  }
  log(`Extension: ${extDir}${version ? ` (version: ${version})` : ""}`);

  let profile;
  if (cmpV71 === 0) {
    profile = "v71";
  } else if (cmpV73 === 0) {
    profile = "v73";
  } else {
    throw new Error(
      [
        `Detected openai.chatgpt@${version ?? "unknown"}.`,
        "This direct track currently supports exactly 0.4.71 and 0.4.73.",
        "Please use docs/remote/codex-folding-install.mjs for auto-routing.",
      ].join("\n")
    );
  }
  log(
    profile === "v71"
      ? "Route: ==0.4.71 direct installer profile (v71-plus)"
      : "Route: ==0.4.73 direct installer profile (v71-plus)"
  );

  const hostJs = path.join(extDir, "out", "extension.js");
  const webviewJs = await readWebviewEntryJsPath(extDir);
  const zhCnJs = await readZhCnLocalePath(extDir, webviewJs, args);

  const results = [];
  results.push({
    file: hostJs,
    ...(await patchFile(hostJs, patchExtensionHostJs)),
    verifyIncludes: "CODEX_WORKFLOW_FOLD_HOST_V7",
  });
  results.push({
    file: webviewJs,
    ...(await patchFile(
      webviewJs,
      profile === "v71" ? patchWebviewBundleJsV71 : patchWebviewBundleJsV73
    )),
    verifyIncludes:
      profile === "v71"
        ? "CODEX_WORKFLOW_FOLD_PATCH_V71_W1"
        : "CODEX_WORKFLOW_FOLD_PATCH_V73_W1",
  });
  if (zhCnJs) {
    results.push({
      file: zhCnJs,
      ...(await patchFile(zhCnJs, patchZhCnLocaleJs)),
      verifyIncludes: "codex.workflow.label",
    });
  } else {
    log("WARN: zh-CN locale bundle not found; skipping zh-CN patch.");
  }

  // Verify markers are present after patch.
  for (const r of results) {
    const content = await fs.readFile(r.file, "utf8");
    if (!content.includes(r.verifyIncludes)) {
      throw new Error(
        `Verify failed: ${r.verifyIncludes} not found in ${r.file}`
      );
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
