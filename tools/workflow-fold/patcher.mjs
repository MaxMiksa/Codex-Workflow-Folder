// Minimal patcher utilities for adding "Workflow fold" support to the
// installed Codex VS Code extension build artifacts.
//
// TDD note: Implementations are added after tests.

export function patchExtensionHostJs(source) {
  const v7Marker = "CODEX_WORKFLOW_FOLD_HOST_V7";
  if (source.includes(v7Marker)) return source;

  const v6Marker = "CODEX_WORKFLOW_FOLD_HOST_V6";

  const inject =
    '/* CODEX_WORKFLOW_FOLD_HOST_V7 */let wf="collapse";try{let vs=require("vscode"),v=vs?.workspace?.getConfiguration?.()?.get?.("codex.workflow.collapseByDefault");(v==="collapse"||v==="expand"||v==="disable")&&(wf=v)}catch{}try{if(typeof l==="string"&&!l.includes("codex-workflow-collapse")){let meta="<meta name=\\"codex-workflow-collapse\\" content=\\""+wf+"\\">\\n",l2=l.replace("</head>",meta+"</head>");l2===l&&(l2=l.replace("<head>","<head>"+meta),l2===l&&(l2=l.replace(/<head[^>]*>/,m=>m+meta))),l=l2}}catch{}try{const K=\"codex.workflow.timerStore.v1\",P=\"codex.workflow.timer.\";const self=this,gs=self?.globalState,repo=self?.sharedObjectRepository;if(self&&!self.__codexWorkflowTimerStoreInit&&gs&&repo&&typeof gs.get===\"function\"&&typeof gs.update===\"function\"&&typeof repo.get===\"function\"&&typeof repo.set===\"function\"){self.__codexWorkflowTimerStoreInit=!0;Promise.resolve(gs.get(K)).then(st=>{try{if(st&&typeof st===\"object\"){for(const k of Object.keys(st)){if(typeof k===\"string\"&&k.startsWith(P))repo.set(k,st[k])}}}catch{}}).catch(()=>{});if(!repo.__codexWorkflowTimerPersist){repo.__codexWorkflowTimerPersist=!0;const orig=repo.set.bind(repo);repo.set=function(k,v){try{if(typeof k===\"string\"&&k.startsWith(P)){Promise.resolve(gs.get(K)).then(st=>{try{const next=st&&typeof st===\"object\"?{...st}:{};v===void 0?delete next[k]:next[k]=v;return gs.update(K,next)}catch{}}).catch(()=>{})}}catch{}return orig(k,v)}}}}catch{}';

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
    throw new Error("patchExtensionHostJs: getWebviewContentProduction return not found");
  }

  return (
    source.slice(0, returnIdx) + inject + source.slice(returnIdx)
  );
}

export function patchWebviewBundleJs(source) {
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

export function patchWebviewBundleJsV71(source) {
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

export function patchWebviewBundleJsV73(source) {
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

export function patchZhCnLocaleJs(source) {
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
