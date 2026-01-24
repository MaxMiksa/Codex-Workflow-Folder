// Minimal patcher utilities for adding "Workflow fold" support to the
// installed Codex VS Code extension build artifacts.
//
// TDD note: Implementations are added after tests.

export function patchExtensionHostJs(source) {
  if (source.includes("codex-workflow-collapse")) return source;

  const inject =
    'let wf="disable";try{let d=wt({preferWsl:Bt()}),f=MB.join(d,"config.toml"),txt=await jy.promises.readFile(f,"utf-8");let m=txt.match(/^\\s*codex\\.workflow\\.collapseByDefault\\s*=\\s*\"(collapse|expand|disable)\"\\s*$/m);m&&(wf=m[1])}catch{}l=l.replace("</head>",`<meta name="codex-workflow-collapse" content="${wf}">\\n</head>`);';

  const anchor = "}return l}getWebviewContentDevelopment";
  if (source.includes(anchor)) {
    return source.replace(anchor, `}${inject}return l}getWebviewContentDevelopment`);
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
  if (source.includes("CODEX_WORKFLOW_FOLD_PATCH")) return source;

  const exportIdx = source.lastIndexOf("export{");
  if (exportIdx === -1) {
    throw new Error('patchWebviewBundleJs: could not find trailing "export{"');
  }

  const patch = `
/* CODEX_WORKFLOW_FOLD_PATCH */
function __codexWorkflowCollapseMode(){const m=globalThis.document?.querySelector('meta[name="codex-workflow-collapse"]');const v=m?.getAttribute("content")?.trim();return v==="collapse"||v==="expand"||v==="disable"?v:"disable"}
function __codexWorkflowFormatElapsed(ms){const s=Math.max(0,Math.floor(ms/1e3));const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),ss=s%60;const p=n=>String(n).padStart(2,"0");if(h>0)return \`\${h}h\${p(m)}m\${p(ss)}s\`;return \`\${m}m\${p(ss)}s\`}
function __codexWorkflowFoldItems(items,mode){if(mode==="disable")return items;const out=[];let inTurn=!1;let children=[];let turnIndex=-1;const pushWorkflow=()=>{if(children.length===0)return;out.push({type:"workflow",id:\`workflow-\${turnIndex}\`,children,defaultCollapsed:mode==="collapse"})};for(const it of items){if(it?.type==="user-message"){inTurn=!0;turnIndex++;out.push(it);children=[];continue}if(inTurn&&it?.type==="assistant-message"){pushWorkflow();out.push(it);inTurn=!1;children=[];continue}if(inTurn)children.push(it);else out.push(it)}inTurn&&pushWorkflow();return out}
const __codexOrigMapStateToLocalConversationItems=typeof mapStateToLocalConversationItems==="function"?mapStateToLocalConversationItems:null;
if(__codexOrigMapStateToLocalConversationItems){mapStateToLocalConversationItems=function(rt,Ye){const items=__codexOrigMapStateToLocalConversationItems(rt,Ye);const mode=__codexWorkflowCollapseMode();return mode==="disable"?items:__codexWorkflowFoldItems(items,mode)}}
const __codexOrigIsAgentItemStillRunning=typeof isAgentItemStillRunning==="function"?isAgentItemStillRunning:null;
if(__codexOrigIsAgentItemStillRunning){isAgentItemStillRunning=function(it){if(it?.type==="workflow")return(it.children??[]).some(ch=>__codexOrigIsAgentItemStillRunning(ch));return __codexOrigIsAgentItemStillRunning(it)}}
function __CodexWorkflowItem(rt){const {item:it}=rt,mode=__codexWorkflowCollapseMode();if(mode==="disable")return null;const intl=useIntl();const startedAt=reactExports.useRef(Date.now());const isRunning=(it.children??[]).some(ch=>__codexOrigIsAgentItemStillRunning?__codexOrigIsAgentItemStillRunning(ch):!1);const [now,setNow]=reactExports.useState(Date.now());reactExports.useEffect(()=>{if(!isRunning)return;const id=setInterval(()=>setNow(Date.now()),1e3);return()=>clearInterval(id)},[isRunning]);const [collapsed,setCollapsed]=reactExports.useState(it.defaultCollapsed===!0);const statusLabel=isRunning?intl.formatMessage({id:"codex.workflow.status.working",defaultMessage:"Working",description:"Status shown in Workflow header when the agent is still running"}):intl.formatMessage({id:"codex.workflow.status.done",defaultMessage:"Done",description:"Status shown in Workflow header when the agent has finished"});const elapsed=__codexWorkflowFormatElapsed((isRunning?now:Date.now())-startedAt.current);const header=jsxRuntimeExports.jsx("div",{className:"flex items-center gap-1.5",children:jsxRuntimeExports.jsx("span",{className:"truncate",children:intl.formatMessage({id:"codex.workflow.label",defaultMessage:"Workflow",description:"Label for the Workflow folding header"})})});const meta=jsxRuntimeExports.jsx("span",{className:"text-token-description-foreground text-xs whitespace-nowrap",children:intl.formatMessage({id:"codex.workflow.headerSuffix",defaultMessage:"({status}, {elapsed})",description:"Suffix in Workflow header with status and elapsed time"},{status:statusLabel,elapsed})});const title=jsxRuntimeExports.jsxs("div",{className:"flex min-w-0 items-baseline gap-2",children:[header,meta]});const chevron=jsxRuntimeExports.jsx(SvgChevronRight,{className:clsx("icon-xs transition-transform",collapsed?"rotate-0":"rotate-90")});const action=jsxRuntimeExports.jsx("div",{className:"flex items-center",children:chevron});const expanded=!collapsed&&(it.children??[]).length>0?jsxRuntimeExports.jsx("div",{className:"border-token-border/80 border-x border-b bg-token-input-background/70 flex flex-col gap-2 px-3 py-2",children:(it.children??[]).map((ch,idx)=>jsxRuntimeExports.jsx(__codexOrigLocalConversationItemContent,{...rt,item:ch},ch?.callId??ch?.id??\`\${it.id}-\${idx}\`))}):null;return jsxRuntimeExports.jsx(InProgressFixedContentItem,{onClick:()=>setCollapsed(v=>!v),children:title,action,expandedContent:expanded})}
const __codexOrigLocalConversationItemContent=typeof LocalConversationItemContent==="function"?LocalConversationItemContent:null;
if(__codexOrigLocalConversationItemContent){LocalConversationItemContent=function(rt){if(rt?.item?.type==="workflow")return __CodexWorkflowItem(rt);return __codexOrigLocalConversationItemContent(rt)}}
/* END CODEX_WORKFLOW_FOLD_PATCH */
`;

  return source.slice(0, exportIdx) + patch + source.slice(exportIdx);
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
