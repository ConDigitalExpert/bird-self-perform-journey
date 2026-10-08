import {CampusScene,ANCHORS,SEQ} from './scene.js';
import * as MODEL from './model.js';
const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s));
const DATA=await fetch('./capabilities.json').then(r=>{if(!r.ok)throw Error('Capability evidence could not be loaded');return r.json()}).catch(()=>null);
if(!DATA){$('#render-mode').textContent='Evidence unavailable. Please reload.';$('#story-fail').hidden=false;throw Error('Capability data unavailable')}
const byScope=Object.fromEntries(DATA.scopes.map(x=>[x.id,x]));
byScope.power={id:'power',label:'Power infrastructure',headline:'Connect generation, powerlines and substations',role:'self-perform',roleLabel:'Bird self-perform capability',documentedCapability:'Bird lists power generation, high- and medium-voltage powerlines, and substations within its integrated self-perform services.',boundary:'Infrastructure delivery does not establish power availability, grid connection rights, utility approvals or energy pricing. Confirm the project scope and delivery team.',sourceIds:['B1','B5','B6'],valueMechanisms:{schedule:'Bring generation, line and substation workfaces into a coordinated delivery sequence',cost:'Use direct trade input to define the interfaces between generation, network and receiving equipment',risk:'Make the utility boundary and the handover between power packages explicit',quality:'Connect direct workmanship accountability with package inspection and testing requirements',safety:'Plan adjacent power workfaces and access while retaining electrical isolation and authorization controls',coordination:'Connect the power infrastructure trades and the information they need from each other'}};
byScope.interface={id:'interface',label:'Civil to electrical interface',headline:'Connect the trades that depend on each other',role:'self-perform',roleLabel:'Connected self-perform capabilities',documentedCapability:'Bird publishes self-perform capability in underground utilities and electrical work. This assembly illustrates where those trades meet.',boundary:'This is an illustrative combined scope. Internal technical handovers, inspections and receiving-trade acceptance remain. The actual bundle and responsibilities need agreement.',sourceIds:['B1','B5','B8'],valueMechanisms:{...byScope.utilities.valueMechanisms}};
const chapterDefaults=['power','planning-design','utilities','electrical','interface','hv-testing','expansion'];
const primaryStages=['power','design-procure','below-grade','plant','plant','prove','expand'];
const stageShort=['Define','Permit','Power','Design','Civil','Utilities','Structure','M&E','White space','Prove','Operate','Expand'];
const scopeForStage=['planning-design','permit-authority','power','planning-design','earthworks','utilities','structure-enclosure','electrical','white-space','hv-testing','owner-acceptance','expansion'];
const kickers=['THE SELF-PERFORM ADVANTAGE','EARLY DELIVERY INSIGHT','DIRECT TRADE CAPABILITY','MISSION-CRITICAL SYSTEMS','BIRD CAPABILITY. CLIENT VALUE.','TESTING & ACCEPTANCE','LIFECYCLE CONTINUITY'];
const lensTitles={schedule:'Control over field sequencing',cost:'Earlier input from delivery teams',risk:'Make responsibility visible',quality:'Direct workmanship accountability',safety:'Coordinated workface planning',coordination:'Connected trades and information'};
const state={seq:null,chapter:0,scope:'power',lens:'coordination',panelOpen:false,stage:'power',reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches,mode:'loading'};
const isExploreHash=h=>h==='explore'||DATA.chapters.some(c=>c.id===h);
let uiMode=isExploreHash(location.hash.slice(1))?'explore':'story';
const BASE_TITLE=document.title;
let labels=[],lastScopeOpener=null,lastScopeFocusId=null,scrollFrame=0,navigationUntil=0,lockedScroll=0;
const scene=new CampusScene($('#campus'),mode=>{state.mode=mode;$('#render-mode').textContent=mode},id=>{if(uiMode==='explore')selectScope(id,true)});
scene.reduced=state.reducedMotion;
const sourceMap=Object.fromEntries(DATA.sources.map(s=>[s.id,s]));
function esc(t){return String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function chapterIndex(id){const i=DATA.chapters.findIndex(c=>c.id===id);if(i<0)throw Error('Unknown chapter');return i}
function scopeIds(){const arr=[...DATA.chapters[state.chapter].scopeIds];if(state.chapter===0||state.chapter===1)arr.unshift('power');if(state.chapter===4)arr.unshift('interface');return arr}
function sync(){const ch=DATA.chapters[state.chapter],s=byScope[state.scope];$('#chapter-number').textContent=`${String(state.chapter+1).padStart(2,'0')} / 07`;$('#chapter-kicker').textContent=kickers[state.chapter];$('#chapter-title').textContent=ch.headline;$('#chapter-subtitle').textContent=ch.description;$('#active-label').textContent=s.label;$('#active-role').textContent=s.roleLabel;$('#step-count').textContent=`${String(state.chapter+1).padStart(2,'0')} / 07`;$('#prev-stage').disabled=state.chapter===0;$('#next-stage').disabled=state.chapter===6;$('#stage-boundary').textContent=state.chapter===0?'Seven connected views. Lifecycle workstreams overlap.':state.chapter===5?'HV package testing, commissioning support and owner acceptance are distinct.':state.chapter===6?'Owner operations and project maintenance scope remain separate.':'Grey = inactive scope. Colour does not establish project allocation.';
 $$('#chapter-rail button').forEach((b,i)=>b.setAttribute('aria-current',i===state.chapter?'step':'false'));$$('#lifecycle button').forEach(b=>b.setAttribute('aria-current',b.dataset.stage===state.stage?'step':'false'));
 $('#scope-list').innerHTML=scopeIds().map(id=>`<button type="button" data-scope="${id}" aria-pressed="${id===state.scope}">${esc(byScope[id].label)}</button>`).join('');
 scene.setState(state.chapter,state.scope,state.panelOpen);scene.selectable=scopeIds().filter(id=>ANCHORS[id]);updateLabels();updatePanel();$('#announcement').textContent=`${ch.label}. ${s.label}. ${s.roleLabel}.`;document.title=`Bird | ${ch.label} · From Site to Service`;
}
function setChapter(i,{scope,stage,announce=true}={}){if(!Number.isInteger(i)||i<0||i>6)throw Error('Chapter must be between 0 and 6');state.chapter=i;state.scope=scope||chapterDefaults[i];state.stage=stage||primaryStages[i];scene.reset();sync()}
function navigateChapter(i,options={}){if(i<0||i>6)return;if(state.seq!=null)seqExit();if(state.panelOpen)closePanel(false);setChapter(i,options);navigationUntil=performance.now()+900;const y=i/6*(document.documentElement.scrollHeight-innerHeight);window.scrollTo({top:y,behavior:state.reducedMotion?'instant':'smooth'});history.replaceState(null,'',`#${DATA.chapters[i].id}`);return readState()}
function openPanel(){if(state.panelOpen)return;if(performance.now()<navigationUntil){window.scrollTo({top:state.chapter/6*(document.documentElement.scrollHeight-innerHeight),behavior:'instant'});}state.panelOpen=true;lockedScroll=scrollY;document.body.classList.add('panel-open');document.body.style.overflow='hidden';$('#capability-panel').hidden=false;scene.setState(state.chapter,state.scope,true);updatePanel();$('#capability-close').focus({preventScroll:true})}
function closePanel(focus=true){state.panelOpen=false;document.body.classList.remove('panel-open');document.body.style.overflow='';$('#capability-panel').hidden=true;scene.setState(state.chapter,state.scope,false);window.scrollTo({top:lockedScroll,behavior:'instant'});if(focus){const replacement=lastScopeFocusId?$('#scope-list [data-scope="'+lastScopeFocusId+'"]'):null;const visibleDefault=$('#scope-list [data-scope="'+state.scope+'"]')||$('#capability-open');(lastScopeOpener?.isConnected?lastScopeOpener:replacement||visibleDefault).focus({preventScroll:true})}}
function selectScope(id,open=true){if(!byScope[id])throw Error('Unknown scope');if(state.seq!=null){seqPause();state.scope=id;lastScopeOpener=document.activeElement;lastScopeFocusId=lastScopeOpener?.dataset?.scope||id;seqRender(true);if(open)openPanel();return readState()}if(!scopeIds().includes(id)){const s=byScope[id],ch=s.chapterIds?.[0]||'overview';navigateChapter(chapterIndex(ch));}state.scope=id;lastScopeOpener=document.activeElement;lastScopeFocusId=lastScopeOpener?.dataset?.scope||id;sync();if(open)openPanel();return readState()}
function setLens(id){if(!DATA.lenses.some(l=>l.id===id))throw Error('Unknown client lens');state.lens=id;updatePanel();return readState()}
function updatePanel(){const s=byScope[state.scope],lens=DATA.lenses.find(l=>l.id===state.lens);$('#detail-role').textContent=s.roleLabel;$('#detail-role').dataset.role=s.role;$('#detail-title').textContent=s.label;$('#detail-capability').textContent=s.documentedCapability;$('#detail-boundary').textContent=s.boundary;$('#lens-title').textContent=lensTitles[state.lens];$('#lens-copy').textContent=s.valueMechanisms[state.lens];$('.value-qualification').textContent=`${lens.qualification}. Potential value depends on agreed scope and project conditions.`;$$('#lens-tabs button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.lens===state.lens));const ids=s.sourceIds.length?[...new Set([...s.sourceIds,...DATA.mechanismEvidence[state.lens]])]:[];$('#detail-sources').innerHTML=!ids.length?'<span>No public Bird evidence yet. Add it before client use.</span>':'<span>Official Bird evidence</span>'+ids.map(id=>`<a target="_blank" rel="noopener noreferrer" href="${sourceMap[id].url}" title="${esc(sourceMap[id].title)}">${id}</a>`).join('');updateExtras()}
function updateLabels(){let ids;if(state.seq!=null)ids=SEQ[state.seq].scopes;else if(state.scope==='power')ids=['energy-sources','powerlines','substations','power-skids'];else if(state.scope==='interface')ids=['utilities','electrical','concrete'];else{ids=[state.scope,...scopeIds().filter(id=>id!==state.scope&&ANCHORS[id])].slice(0,3)}ids=ids.filter(id=>ANCHORS[id]&&byScope[id]);$('#spatial-labels').innerHTML=ids.map(id=>`<button class="spatial-label ${(state.seq!=null||id===state.scope||state.scope==='power'||state.scope==='interface'&&['utilities','electrical'].includes(id))?'active':''}" data-scope="${id}" aria-label="Explore ${esc(byScope[id].label)}"><span>${esc(byScope[id].label)}</span><i></i><b></b></button>`).join('');labels=ids.map(id=>({id,el:$('#spatial-labels [data-scope="'+id+'"]')}));scene.dirty=true}
const drawLabelsFn=scene.drawLabels=()=>{const mobile=scene.width<761;let used=[];for(const {id,el} of labels){const p=scene.project(ANCHORS[id]);let x=p.x,y=p.y;const width=el.offsetWidth||140;const clampedX=Math.max(width/2+10,Math.min(scene.width-width/2-15,x));const clampedY=Math.max(45,Math.min(scene.height-15,y));x=clampedX;y=clampedY;for(const q of used){if(Math.abs(q.x-x)<(q.w+width)/2+8&&Math.abs(q.y-y)<54)y-=55}used.push({x,y,w:width});el.style.left=`${x}px`;el.style.top=`${y}px`;el.style.opacity=p.x<-20||p.x>scene.width+20||p.y>scene.height+20||p.y<-50?'0':'1';el.style.pointerEvents=el.style.opacity==='0'?'none':'auto';if(!mobile&&state.panelOpen&&x>scene.width-435)el.style.visibility='hidden';else el.style.visibility='visible'}};
function readState(){const s=byScope[state.scope];return{buildStep:state.seq!=null?SEQ[state.seq].id:null,chapter:DATA.chapters[state.chapter].id,stage:state.stage,scope:state.scope,scopeLabel:s.label,role:s.role,lens:state.lens,panelOpen:state.panelOpen,reducedMotion:state.reducedMotion,renderMode:state.mode,documentedCapability:s.documentedCapability,boundary:s.boundary,mechanism:s.valueMechanisms[state.lens],sources:s.sourceIds.map(id=>({id,url:sourceMap[id].url}))}}
$('#chapter-rail').innerHTML=DATA.chapters.map((c,i)=>`<button class="chapter-dot" data-chapter="${i}" aria-label="${i+1}. ${esc(c.label)}" title="${esc(c.label)}"><span>${String(i+1).padStart(2,'0')} ${esc(c.label)}</span><i></i></button>`).join('');
$('#lifecycle').innerHTML=DATA.stages.map((s,i)=>`<button data-stage="${s.id}" data-index="${i}" aria-label="${s.number}. ${esc(s.label)}" title="${esc(s.label)}"><i></i><span>${stageShort[i]}</span></button>`).join('');
$('#lens-tabs').innerHTML=DATA.lenses.map(l=>`<button type="button" data-lens="${l.id}" aria-pressed="${l.id===state.lens}">${l.label}</button>`).join('');
$('#source-register').innerHTML=DATA.sources.map(s=>`<li><a href="${s.url}" target="_blank" rel="noopener noreferrer"><span class="source-id">${s.id}</span>${esc(s.title)}</a><p>${esc(s.evidenceSummary)}</p><p class="muted">${esc(s.boundary)} ${esc(s.currency)}</p></li>`).join('');
$('#chapter-rail').addEventListener('click',e=>{const b=e.target.closest('[data-chapter]');if(b)navigateChapter(Number(b.dataset.chapter))});
$('#lifecycle').addEventListener('click',e=>{const b=e.target.closest('[data-stage]');if(!b)return;const n=Number(b.dataset.index),s=DATA.stages[n];navigateChapter(chapterIndex(s.chapterId),{stage:s.id,scope:scopeForStage[n]});b.scrollIntoView({block:'nearest',inline:'nearest',behavior:state.reducedMotion?'instant':'smooth'})});
for(const container of ['#scope-list','#spatial-labels'])$(container).addEventListener('click',e=>{const b=e.target.closest('[data-scope]');if(b)selectScope(b.dataset.scope)});
$('#lens-tabs').addEventListener('click',e=>{const b=e.target.closest('[data-lens]');if(b)setLens(b.dataset.lens)});
$('#capability-open').addEventListener('click',()=>{lastScopeOpener=$('#capability-open');openPanel()});$('#capability-close').addEventListener('click',()=>closePanel());$('#prev-stage').addEventListener('click',()=>navigateChapter(state.chapter-1));$('#next-stage').addEventListener('click',()=>navigateChapter(state.chapter+1));$('#view-reset').addEventListener('click',()=>scene.reset());
$('#motion-toggle').addEventListener('click',()=>{state.reducedMotion=!state.reducedMotion;applyMotion();syncMotion()});function syncMotion(){document.body.classList.toggle('reduced-motion',state.reducedMotion);$('#motion-toggle').setAttribute('aria-pressed',String(state.reducedMotion));$('#motion-toggle').setAttribute('aria-label',state.reducedMotion?'Enable smooth camera motion':'Reduce camera motion')}
const dialog=$('#sources-dialog');function openSources(){document.body.classList.add('dialog-open');dialog.showModal()}function closeSources(){dialog.close();document.body.classList.remove('dialog-open')}
$('#sources-open').addEventListener('click',openSources);$('#sources-footer').addEventListener('click',openSources);$('#sources-close').addEventListener('click',closeSources);dialog.addEventListener('close',()=>document.body.classList.remove('dialog-open'));dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeSources()}});
$('.brand').addEventListener('click',e=>{e.preventDefault();navigateChapter(0)});
window.addEventListener('scroll',()=>{if(scrollFrame)return;scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;if(uiMode!=='explore'||state.seq!=null||state.panelOpen||dialog.open||performance.now()<navigationUntil)return;const max=document.documentElement.scrollHeight-innerHeight;const index=Math.max(0,Math.min(6,Math.floor((scrollY/max)*6+.5)));if(index!==state.chapter){setChapter(index);history.replaceState(null,'',`#${DATA.chapters[index].id}`)}})},{passive:true});
window.addEventListener('keydown',e=>{if(uiMode!=='explore')return;if(e.key==='Escape'&&state.panelOpen&&!dialog.open)closePanel();if(!state.panelOpen&&!dialog.open&&e.target.tagName!=='CANVAS'&&['PageDown','PageUp','Home','End'].includes(e.key)){e.preventDefault();navigateChapter(e.key==='Home'?0:e.key==='End'?6:state.chapter+(e.key==='PageDown'?1:-1))}});
window.addEventListener('resize',()=>{if(uiMode!=='explore'||state.panelOpen)return;navigationUntil=performance.now()+300;window.scrollTo({top:state.chapter/6*(document.documentElement.scrollHeight-innerHeight),behavior:'instant'})});
// The build, in order. Completed scopes turn transparent and the current scope is in colour; the tour pauses for free exploration and resumes from the same step.
const REVIEW=new URLSearchParams(location.search).has('review');document.body.classList.toggle('review-mode',REVIEW);
const SEQ_COPY=DATA.buildSequence?.steps||{};let seqTimer=0,seqPlaying=false;
function seqControls(){const on=state.seq!=null;document.body.classList.toggle('build-mode',on);for(const id of ['#build-prev','#build-next','#build-label','#build-exit'])$(id).hidden=!on;const end=on&&!seqPlaying&&state.seq===SEQ.length-1;$('#build-toggle').textContent=!on?'Play the build':seqPlaying?'Pause':end?'Replay':'Resume tour';$('#build-toggle').setAttribute('aria-pressed',String(seqPlaying))}
function seqRender(keepScope=false){const n=state.seq,step=SEQ[n],copy=SEQ_COPY[step.id]||{},count=String(SEQ.length).padStart(2,'0');if(!keepScope)state.scope=step.focus;const s=byScope[state.scope];$('#chapter-number').textContent=`${String(n+1).padStart(2,'0')} / ${count}`;$('#chapter-kicker').textContent='THE BUILD, IN ORDER';$('#chapter-title').textContent=step.label;$('#chapter-subtitle').textContent=copy.text||'';$('#active-label').textContent=s.label;$('#active-role').textContent=s.roleLabel;$('#build-label').textContent=`${String(n+1).padStart(2,'0')} / ${count}  ${step.label}`;$('#build-prev').disabled=n===0;$('#build-next').disabled=n===SEQ.length-1;$('#scope-list').innerHTML=step.scopes.filter(id=>byScope[id]).map(id=>`<button type="button" data-scope="${id}" aria-pressed="${id===state.scope}">${esc(byScope[id].label)}</button>`).join('');$('#stage-boundary').textContent='Completed scopes turn transparent. The current scope is in colour.';scene.selectable=step.scopes.filter(id=>ANCHORS[id]);updateLabels();updatePanel();seqControls();$('#announcement').textContent=`Build step ${n+1} of ${SEQ.length}. ${step.label}.`}
function seqSchedule(){clearTimeout(seqTimer);if(!seqPlaying)return;seqTimer=setTimeout(()=>{if(state.seq<SEQ.length-1)seqGo(state.seq+1);else{seqPlaying=false;seqControls()}},5600)}
function seqGo(n){if(state.panelOpen)closePanel(false);state.seq=Math.max(0,Math.min(SEQ.length-1,n));scene.setSeq(state.seq);seqRender();seqSchedule();return readState()}
function seqToggle(){if(state.seq==null){seqPlaying=true;return seqGo(0)}if(seqPlaying){seqPause();return readState()}seqPlaying=true;return seqGo(state.seq===SEQ.length-1?0:state.seq)}
function seqPause(){if(!seqPlaying)return;seqPlaying=false;clearTimeout(seqTimer);seqControls()}
function seqExit(){seqPlaying=false;clearTimeout(seqTimer);if(state.panelOpen)closePanel(false);state.seq=null;scene.setSeq(null);seqControls();state.scope=chapterDefaults[state.chapter];sync()}
function updateExtras(){const md=DATA.moduleDetail?.[state.scope];$('#module-detail').hidden=!md;if(md){$('#module-components').innerHTML=md.components.map(c=>`<tr><td>${esc(c.name)}</td><td>${esc(c.qty)}</td></tr>`).join('');const steps=list=>list.map(x=>`<li class="${esc(x.state)}"><i></i>${esc(x.label)}</li>`).join('');$('#module-logistics').innerHTML=steps(md.logistics);$('#module-cx').innerHTML=steps(md.commissioning)}const media=(DATA.crewMedia?.[state.scope]||[]).filter(m=>m.src||REVIEW);$('#crew-media').hidden=!media.length;$('#crew-grid').innerHTML=media.map(m=>m.src?`<figure><img src="${esc(m.src)}" alt="${esc(m.alt||m.shot)}" loading="lazy"><figcaption>${esc(m.caption||m.shot)}</figcaption></figure>`:`<figure class="crew-slot"><div>Photo to add</div><figcaption>${esc(m.shot)}</figcaption></figure>`).join('')}
$('#build-toggle').addEventListener('click',seqToggle);$('#build-prev').addEventListener('click',()=>seqGo(state.seq-1));$('#build-next').addEventListener('click',()=>seqGo(state.seq+1));$('#build-exit').addEventListener('click',seqExit);
$('#scene-wrap').addEventListener('pointerdown',()=>{if(uiMode==='explore'&&state.seq!=null)seqPause()},{capture:true});
$('#capacity-chip').textContent=DATA.campusScale?.label||'';
syncMotion();const initialChapter=DATA.chapters.findIndex(c=>c.id===location.hash.slice(1));function startExplore(){sync();if(initialChapter>0)setTimeout(()=>{if(uiMode==='explore')navigateChapter(initialChapter)},100)}
// Public page actions are also available to a supported browser agent. They use
// exactly the same validated actions and visible state as the page controls.
const lifecycle=new AbortController();const context=document.modelContext;
if(context?.registerTool){const tools=[{name:'read_bird_journey',title:'Read Bird journey',description:'Read the currently visible chapter, capability, client lens and supporting evidence',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute(input){if(input&&Object.keys(input).length)throw Error('No fields expected');return readState()}},{name:'navigate_bird_chapter',title:'Navigate Bird chapter',description:'Navigate to one of the seven campus chapters. Does not change project data.',inputSchema:{type:'object',properties:{chapter:{type:'string',enum:DATA.chapters.map(c=>c.id)}},required:['chapter'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},async execute(input){if(uiMode!=='explore')throw Error('The explorer view is not active. Press X to open it.');if(!input||Object.keys(input).some(k=>k!=='chapter'))throw Error('Supply only chapter');const result=navigateChapter(chapterIndex(input.chapter));await new Promise(requestAnimationFrame);return result}},{name:'explore_bird_capability',title:'Explore Bird capability',description:'Select a documented capability and an optional client lens, opening its evidence panel',inputSchema:{type:'object',properties:{scope:{type:'string',enum:Object.keys(byScope)},lens:{type:'string',enum:DATA.lenses.map(l=>l.id)}},required:['scope'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},async execute(input){if(uiMode!=='explore')throw Error('The explorer view is not active. Press X to open it.');if(!input||Object.keys(input).some(k=>!['scope','lens'].includes(k))||!byScope[input.scope]||input.lens&&!DATA.lenses.some(l=>l.id===input.lens))throw Error('Supply a valid scope and optional lens');selectScope(input.scope);if(input.lens)setLens(input.lens);await new Promise(requestAnimationFrame);return readState()}}];for(const tool of tools)try{Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{})}catch{}window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true})}
// A small non-mutating state read-back supports permitted QA and accessibility.
window.BirdJourney={getState:readState,modelStats:()=>({objects:scene.objects.length,faces:scene.objects.reduce((n,o)=>n+o.faces.length,0),renderer:scene.mode,chapters:DATA.chapters.length,stages:DATA.stages.length,scopes:DATA.scopes.length})};

/* ==========================================================================
   Story mode: the default view. A predetermined narration scrubbed by scroll,
   keys or a clicker, on a dark stage with one right column and nothing else.
   Explore mode (above) is unchanged and reached only with #explore or key X.
   ========================================================================== */
const STORY_KEY='bird-story-v1';
const FALLBACK_STEPS=[
 {id:'energy',header:'Energy',disc:'power'},{id:'grid',header:'High-voltage substation',disc:'power'},{id:'transmission',header:'Transmission',disc:'power'},
 {id:'substation',header:'Campus substation',disc:'power'},{id:'civil',header:'Civil works',disc:'civil'},{id:'underground',header:'Underground utilities',disc:'civil'},
 {id:'concrete',header:'Concrete',disc:'civil'},{id:'structure',header:'Structure',disc:'structure'},{id:'electrical',header:'Electrical',disc:'electrical'},
 {id:'mechanical',header:'Mechanical',disc:'mechanical'},{id:'modular',header:'Off-site modules',disc:'modular'},{id:'telecom',header:'Telecom',disc:'telecom'},
 {id:'whitespace',header:'White space',disc:'whitespace'},{id:'next',header:'Next in the conversation',disc:'none'}];
const STEPS=Array.isArray(MODEL.STORY_STEPS)&&MODEL.STORY_STEPS.length?MODEL.STORY_STEPS:FALLBACK_STEPS;
const LAST=STEPS.length-1;
// Header colour follows the focus discipline. Mission Critical palette only (orange, red, green) and white.
const FOCUS_COLOUR={power:'#ffffff',civil:'#ffffff',structure:'#ffffff',modular:'#ffffff',whitespace:'#ffffff',none:'#ffffff',electrical:'#f58025',mechanical:'#e91d2e',telecom:'#ffffff'};
// The Mission Critical green is 2.9 to 1 on the panel, under the 3 to 1 minimum for large text, so the Telecom header stays white and carries the green as a rule above it.
const HEADER_RULE={telecom:'#00703c'};
const NEXT_DEFAULTS=['Off-site manufacturing','OFCI management','Commissioning','Labour strategy'];
const STEP_MS=1200;          // keyboard and clicker steps
// The four work steps and the module step play longer so the machines can be watched (ANIMATION-CONTRACT 9.3). A move between step k and k+1 takes the time of the later step of the pair, in both directions.
const WORK_MS={civil:4200,underground:4200,concrete:4200,structure:4600,modular:2600};
const INTRO_MS=1800;         // first entry only: the stage builds from empty into step 0 (0 turns it off)
const SETTLE_MS=220;         // idle time after scrolling before the story rests on a step
const SETTLE_BIAS=.07;       // a nudge of this much toward the next step completes it
const LIM={header:90,text:420,alt:240,item:90,items:8,data:5000000};
const QUERY=new URLSearchParams(location.search);
// A copy that is handed to a client can lock edit mode by setting window.BIRD_STORY_LOCKED=true before this script runs (tools/build-standalone.py --no-edit does).
const EDIT_LOCKED=window.BIRD_STORY_LOCKED===true;
if(EDIT_LOCKED){const dt=Array.from(document.querySelectorAll('#story-help dt')).find(n=>n.textContent==='E');if(dt){dt.nextElementSibling.remove();dt.remove()}}
const reducedQuery=matchMedia('(prefers-reduced-motion: reduce)');
const reduced=()=>state.reducedMotion||reducedQuery.matches;
// Tells the renderer whether motion is allowed (ANIMATION-CONTRACT 2.2 and 9.2). Story honours the system preference as well as the setting. Explore keeps its old rule: the setting alone.
function applyMotion(){const on=uiMode==='story'?reduced():state.reducedMotion;guard(()=>{if(typeof scene.setReducedMotion==='function')scene.setReducedMotion(on);else{scene.reduced=on;scene.dirty=true}})}
// setMotion() toggles (key M), setMotion(false) stops motion, setMotion(true) lets it run again unless the system asks for less. Silent on screen; the live region says what happened.
function setMotion(on){
 state.reducedMotion=on===undefined?!state.reducedMotion:!on;syncMotion();applyMotion();
 const stuck=!state.reducedMotion&&reducedQuery.matches;
 ui.live.textContent=stuck?'Motion stays off because the system asks for reduced motion':reduced()?'Motion stopped':'Motion resumed';S.lastAnnounced='';
 return reduced();
}
// A change of the system preference while the page is open is followed at once.
{const onPref=e=>{state.reducedMotion=e.matches;syncMotion();applyMotion()};if(reducedQuery.addEventListener)reducedQuery.addEventListener('change',onPref);else if(reducedQuery.addListener)reducedQuery.addListener(onPref)}
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
const pad2=n=>String(n).padStart(2,'0');
const $s=id=>document.getElementById(id);
const ui={
 panel:$s('story-panel'),content:$s('story-content'),header:$s('story-header'),text:$s('story-text'),
 photo:$s('story-photo'),photoImg:document.querySelector('#story-photo img'),photoShot:document.querySelector('#story-photo .story-photo-ph span'),photoClear:document.querySelector('#story-photo .story-photo-clear'),
 next:$s('story-next'),client:$s('story-client'),clientImg:$s('story-client-img'),clientMono:$s('story-client-mono'),clientClear:$s('story-client-clear'),
 toolbar:$s('story-toolbar'),stepLabel:$s('story-step-label'),save:$s('story-save'),help:$s('story-help'),toast:$s('story-toast'),live:$s('story-live'),
 fileImport:$s('story-file-import'),filePhoto:$s('story-file-photo'),fileLogo:$s('story-file-logo'),resetBtn:$s('story-reset')};
const STORY=DATA.story||{steps:[],next:{}};
const contentById=Object.fromEntries((STORY.steps||[]).map(s=>[s.id,s]));
const themeMeta=document.querySelector('meta[name="theme-color"]');
/* Constant logo: the Bird white logo by default. When content sets story.brand.useMissionCriticalLogo the Mission Critical
   primary logo (white, orange flag) replaces it once the file has loaded; if the file is missing the Bird logo simply stays. */
(()=>{
 const img=document.querySelector('#story-logo img');
 if(!img||!(STORY.brand&&STORY.brand.useMissionCriticalLogo===true))return;
 const src='./assets/mc-primary-logo-white-flag.svg',probe=new Image();
 probe.onload=()=>{img.src=src;img.alt='Bird Mission Critical';img.width=324;img.height=90;document.body.classList.add('mc-logo')};
 probe.src=src;
})();
const EDITABLE=(()=>{const t=document.createElement('div');t.contentEditable='plaintext-only';return t.contentEditable==='plaintext-only'?'plaintext-only':'true'})();

/* ---- Saved edits (localStorage, bird-story-v1). Every access is wrapped in try/catch. ---- */
function blankOverrides(){return{steps:{},next:{},clientLogo:undefined,clientLogoMono:false}}
const cleanText=(v,n)=>typeof v==='string'?v.replace(/[\u0000-\u001f\u007f]+/g,' ').replace(/\s+/g,' ').trim().slice(0,n):undefined;
function imageOk(v){
 if(typeof v!=='string'||v.length>LIM.data)return false;
 if(/^data:image\/(png|jpeg|webp|gif|svg\+xml);base64,[A-Za-z0-9+/=]+$/.test(v))return true;
 return /^(\.\/)?assets\/[A-Za-z0-9._\/-]+$/.test(v)&&!v.includes('..');
}
function sanitize(src){
 const out=blankOverrides();
 if(!src||typeof src!=='object')return out;
 const stepsIn=src.steps&&typeof src.steps==='object'?src.steps:{};
 for(const meta of STEPS){
  if(meta.id==='next')continue;
  const s=stepsIn[meta.id];if(!s||typeof s!=='object')continue;
  const o={},h=cleanText(s.header,LIM.header),t=cleanText(s.text,LIM.text),a=cleanText(s.alt,LIM.alt);
  if(h!==undefined)o.header=h;if(t!==undefined)o.text=t;if(a!==undefined)o.alt=a;
  if(s.photo===null)o.photo=null;else if(imageOk(s.photo))o.photo=s.photo;
  if(Object.keys(o).length)out.steps[meta.id]=o;
 }
 const n=src.next;
 if(n&&typeof n==='object'){
  const h=cleanText(n.header,LIM.header),t=cleanText(n.text,LIM.text);
  if(h!==undefined)out.next.header=h;if(t!==undefined)out.next.text=t;
  if(Array.isArray(n.items))out.next.items=n.items.slice(0,LIM.items).map(x=>cleanText(x,LIM.item)).filter(Boolean);
 }
 if(src.clientLogo===null)out.clientLogo=null;else if(imageOk(src.clientLogo))out.clientLogo=src.clientLogo;
 out.clientLogoMono=src.clientLogoMono===true;
 return out;
}
let ov=(()=>{try{const raw=localStorage.getItem(STORY_KEY);if(raw)return sanitize(JSON.parse(raw))}catch(err){}return blankOverrides()})();
let saveTimer=0;
function setSaveState(kind){ui.save.textContent=kind==='saved'?'Saved in this browser':kind==='failed'?'Not saved. Use Export JSON.':'';ui.save.classList.toggle('warn',kind==='failed')}
function writeNow(){clearTimeout(saveTimer);saveTimer=0;try{localStorage.setItem(STORY_KEY,JSON.stringify(ov));setSaveState('saved')}catch(err){setSaveState('failed')}}
function persist(){clearTimeout(saveTimer);saveTimer=setTimeout(writeNow,250)}

/* ---- What each step shows: saved edit, else capabilities.json "story", else the model's default header ---- */
function view(i){
 const meta=STEPS[i],id=meta.id;
 if(id==='next'){
  const c=STORY.next||{},o=ov.next||{};
  return{i,id,disc:meta.disc,header:o.header??c.header??meta.header,text:o.text??c.text??'',items:(o.items??(c.items&&c.items.length?c.items:NEXT_DEFAULTS)).slice(),photo:null};
 }
 const c=contentById[id]||{},o=ov.steps[id]||{},cp=c.photo||{};
 return{i,id,disc:meta.disc,header:o.header??c.header??meta.header,text:o.text??c.text??'',items:null,
  photo:{src:o.photo!==undefined?o.photo:(cp.src||null),alt:o.alt??cp.alt??'',shot:cp.shot||''}};
}
// Default (content) value of one editable field, so a saved edit equal to it is not kept as an override.
function baseValue(i,key){
 const meta=STEPS[i];
 if(meta.id==='next'){const c=STORY.next||{};return key==='header'?(c.header??meta.header):key==='text'?(c.text??''):undefined}
 const c=contentById[meta.id]||{},cp=c.photo||{};
 return key==='header'?(c.header??meta.header):key==='text'?(c.text??''):key==='photo'?(cp.src||null):key==='alt'?(cp.alt??''):undefined;
}
function setOverride(i,key,val){
 const id=STEPS[i].id,isNext=id==='next',bucket=isNext?ov.next:(ov.steps[id]||(ov.steps[id]={}));
 const had=Object.prototype.hasOwnProperty.call(bucket,key),before=bucket[key];
 if(val===baseValue(i,key))delete bucket[key];else bucket[key]=val;
 if(!isNext&&!Object.keys(bucket).length)delete ov.steps[id];
 const now=Object.prototype.hasOwnProperty.call(bucket,key);
 if(had!==now||before!==bucket[key])persist();
}
// Keep typed text within the same caps the loader applies.
function capLength(node,cap){
 if(node.textContent.length<=cap)return;
 node.textContent=node.textContent.slice(0,cap);
 const r=document.createRange();r.selectNodeContents(node);r.collapse(false);
 const sel=document.getSelection();sel.removeAllRanges();sel.addRange(r);
}
function rawItems(){return Array.from(ui.next.querySelectorAll('li:not(.story-add)>span')).map(s=>s.textContent)}

/* ---- Painting the right column ---- */
const S={active:false,introDone:false,p:0,sentP:-1,goal:0,mode:'idle',from:0,to:0,t0:0,dur:STEP_MS,tau:.085,last:0,raf:0,dir:0,settleT:0,shown:-1,edit:false,help:false,busy:false,lastAnnounced:''};
function paintItems(v){
 ui.next.hidden=!v.items;ui.next.textContent='';
 if(!v.items)return;
 v.items.forEach((t,k)=>{
  const li=document.createElement('li'),sp=document.createElement('span');
  sp.textContent=t;if(S.edit)sp.setAttribute('contenteditable',EDITABLE);
  li.append(sp);
  if(S.edit){const rm=document.createElement('button');rm.type='button';rm.className='story-mini';rm.dataset.remove=String(k);rm.textContent='Remove';rm.setAttribute('aria-label','Remove '+t);li.append(rm)}
  ui.next.append(li);
 });
 if(S.edit&&v.items.length<LIM.items){const li=document.createElement('li');li.className='story-add';const b=document.createElement('button');b.type='button';b.className='story-mini';b.dataset.add='1';b.textContent='Add item';li.append(b);ui.next.append(li)}
}
function paint(i){
 const v=view(i);S.shown=i;
 ui.header.textContent=v.header;ui.header.style.color=FOCUS_COLOUR[v.disc]||'#ffffff';
 if(HEADER_RULE[v.disc]){ui.header.dataset.rule='1';ui.header.style.setProperty('--rule',HEADER_RULE[v.disc])}else{delete ui.header.dataset.rule;ui.header.style.removeProperty('--rule')}
 ui.text.textContent=v.text;
 const show=!!v.photo&&(!!v.photo.src||S.edit||REVIEW);
 ui.photo.hidden=!show;
 if(show){
  const has=!!v.photo.src;
  ui.photo.classList.toggle('empty',!has);
  if(has){if(ui.photoImg.getAttribute('src')!==v.photo.src)ui.photoImg.setAttribute('src',v.photo.src);ui.photoImg.alt=v.photo.alt||v.header}
  else{ui.photoImg.removeAttribute('src');ui.photoImg.alt=''}
  ui.photoShot.textContent=v.photo.shot;
  S.edit?(ui.photo.tabIndex=0,ui.photo.setAttribute('role','button'),ui.photo.setAttribute('aria-label','Photo for '+v.header+'. Press Enter or drop an image to replace it.')):(ui.photo.removeAttribute('tabindex'),ui.photo.removeAttribute('role'),ui.photo.removeAttribute('aria-label'));
 }
 paintItems(v);paintEvidence(v);
 ui.stepLabel.textContent=`${pad2(i+1)} / ${pad2(STEPS.length)}  ${v.header}`;
}
// Edit mode only: where each claim comes from (public Bird sources) and what still needs evidence.
function paintEvidence(v){
 const box=$s('story-evidence'),c=v.id==='next'?(STORY.next||{}):(contentById[v.id]||{});
 const ids=(c.sourceIds||[]).filter(id=>sourceMap[id]),confirm=c.toConfirm||[];
 box.textContent='';
 if(!S.edit||(!ids.length&&!confirm.length)){box.hidden=true;return}
 box.hidden=false;
 const row=(label,warn)=>{const d=document.createElement('div');d.className='story-ev-row'+(warn?' warn':'');const b=document.createElement('b');b.textContent=label;d.append(b);box.append(d);return d};
 if(ids.length){
  const d=row('Public sources');
  for(const id of ids){const a=document.createElement('a');a.href=sourceMap[id].url;a.target='_blank';a.rel='noopener noreferrer';a.title=sourceMap[id].title;a.textContent=id;d.append(a)}
 }
 for(const t of confirm){const d=row('To confirm',true);const sp=document.createElement('span');sp.textContent=t;d.append(sp)}
}
ui.photoImg.addEventListener('error',()=>{if(ui.photoImg.getAttribute('src')){ui.photo.classList.add('empty');if(!S.edit&&!REVIEW)ui.photo.hidden=true}});
function paintClient(){
 const src=ov.clientLogo||null;
 ui.client.classList.toggle('has-logo',!!src);ui.client.classList.toggle('mono',!!src&&!!ov.clientLogoMono);
 ui.clientMono.setAttribute('aria-pressed',String(!!ov.clientLogoMono));
 if(src){ui.clientImg.setAttribute('src',src);ui.clientImg.alt='Client logo';ui.clientImg.hidden=false}
 else{ui.clientImg.removeAttribute('src');ui.clientImg.alt='';ui.clientImg.hidden=true}
}
function blurEditable(){const a=document.activeElement;if(a&&a!==document.body&&$s('story').contains(a)&&a.blur)a.blur()}
// Text cross-fades around the middle of every transition: out before it, swap at the middle, in after it.
function applyPanel(){
 const p=S.p;
 let idx,a=1;
 if(p<0){idx=0;a=reduced()?1:smooth(.62,1,p+1)}   // intro: the column fades in once the stage has built
 else{
  const k=Math.min(LAST,Math.floor(p+1e-6)),f=p-k;
  idx=k;
  if(k<LAST){idx=f<.5?k:k+1;a=reduced()?1:smooth(.04,.2,Math.abs(f-.5))}
 }
 if(idx!==S.shown){blurEditable();paint(idx)}
 ui.content.style.opacity=a.toFixed(3);
 ui.content.style.transform=a<1?`translateY(${((1-a)*12).toFixed(1)}px)`:'';
}
function announce(){
 if(S.mode!=='idle'||S.p<0||Math.abs(S.p-Math.round(S.p))>.002)return;
 const v=view(S.shown),msg=`${S.shown+1} of ${STEPS.length}. ${v.header}. ${v.text}`;
 if(msg!==S.lastAnnounced){S.lastAnnounced=msg;ui.live.textContent=msg}
}
const reportedErrors=new Set();
function guard(fn){try{fn()}catch(err){const m=String(err&&err.message||err);if(!reportedErrors.has(m)){reportedErrors.add(m);console.error('Story renderer:',err)}}}
function commit(force){
 if(!S.active)return;
 if(force||S.p!==S.sentP){S.sentP=S.p;guard(()=>scene.setStoryProgress(S.p))}
 applyPanel();announce();
}

/* ---- Progress: scroll scrubs it continuously, keys and clickers animate a step over about 1.2 s ---- */
function tick(now){
 S.raf=0;
 if(!S.active)return;
 if(S.mode==='tween'){
  const u=clamp((now-S.t0)/S.dur,0,1);
  S.p=S.from+(S.to-S.from)*u;
  if(u>=1){S.p=S.to;S.goal=S.to;S.mode='idle'}
 }else if(S.mode==='chase'){
  const dt=Math.min(.06,Math.max(0,(now-S.last)/1000));
  S.p+=(S.goal-S.p)*(1-Math.exp(-dt/S.tau));
  if(Math.abs(S.goal-S.p)<.0004)S.p=S.goal;
 }
 S.last=now;commit();
 if(S.mode==='tween'||(S.mode==='chase'&&S.p!==S.goal))S.raf=requestAnimationFrame(tick);
}
function kick(){if(!S.raf){S.last=performance.now();S.raf=requestAnimationFrame(tick)}}
function stopAnim(){cancelAnimationFrame(S.raf);S.raf=0;clearTimeout(S.settleT);S.settleT=0}
const durFor=d=>d<=1?Math.max(450,STEP_MS*d):STEP_MS+Math.min(1800,(d-1)*150);   // Home, End and longer jumps keep this rule
const stepMs=i=>WORK_MS[(STEPS[i]||{}).id]||STEP_MS;
// A single step (or part of one) plays at the pace of the later step of the pair; the time scales with the distance still to go.
function moveDur(from,to){const d=Math.abs(to-from);if(d>1)return durFor(d);return Math.max(450,stepMs(Math.min(LAST,Math.ceil(Math.max(from,to)-1e-9)))*d)}
function tweenTo(to,{duration,instant=false}={}){
 clearTimeout(S.settleT);S.settleT=0;S.dir=0;
 to=clamp(Math.round(to),0,LAST);
 const dist=Math.abs(to-S.p);
 if(instant||reduced()||dist<.0005){S.p=S.goal=S.to=to;S.mode='idle';commit();return}
 S.from=S.p;S.to=to;S.goal=to;S.t0=performance.now();S.dur=duration||moveDur(S.p,to);S.mode='tween';kick();
}
function stepBy(dir){
 // Relative to where the story is heading; never below step 0, so a key during the intro moves on from the first step.
 const base=S.mode==='tween'?S.to:Math.max(0,Math.round(S.mode==='chase'?S.goal:S.p));
 tweenTo(base+dir);
}
function settle(){
 S.settleT=0;
 if(!S.active)return;
 const p=S.p,k=Math.floor(p),f=p-k;let to;
 if(f<.0005)to=k;else if(f>.9995)to=k+1;
 else if(S.dir>0)to=f>=SETTLE_BIAS?k+1:k;
 else if(S.dir<0)to=f<=1-SETTLE_BIAS?k:k+1;
 else to=Math.round(p);
 tweenTo(clamp(to,0,LAST),{duration:Math.max(450,Math.min(STEP_MS,Math.abs(to-p)*STEP_MS))});
}
function nudge(ds,dir,{hold=false}={}){
 if(S.mode!=='chase'){S.goal=S.p;S.mode='chase'}
 S.goal=clamp(S.goal+ds,0,LAST);S.dir=dir;S.tau=.085;
 if(reduced()){S.p=S.goal;commit()}else kick();
 // A resting finger is not idle: while one is down the story waits and settles on release.
 clearTimeout(S.settleT);S.settleT=hold?0:setTimeout(settle,SETTLE_MS);
}
const pxPerStep=()=>clamp(innerHeight*.95,560,1100);
window.addEventListener('wheel',e=>{
 if(uiMode!=='story'||e.ctrlKey||e.metaKey)return;
 // In edit mode a column taller than the window scrolls natively instead of scrubbing the story.
 if(S.edit&&!S.help&&e.target.closest&&e.target.closest('.story-panel')&&ui.panel.scrollHeight>ui.panel.clientHeight+1)return;
 e.preventDefault();
 if(S.help)return;
 let d=Math.abs(e.deltaY)>=Math.abs(e.deltaX)?e.deltaY:e.deltaX;
 if(e.deltaMode===1)d*=32;else if(e.deltaMode===2)d*=innerHeight;
 if(d)nudge(d/pxPerStep(),d>0?1:-1);
},{passive:false});
// Touch and pen: a vertical drag scrubs, a horizontal swipe steps. A mouse drag does nothing (no free movement).
let touch=null;
document.addEventListener('pointerdown',e=>{
 if(uiMode!=='story'||S.help||e.pointerType==='mouse'||!e.isPrimary)return;
 if(e.target.closest&&e.target.closest('[contenteditable],button,input,.story-toolbar,.story-help,.story-client,.story-photo'))return;
 touch={id:e.pointerId,x:e.clientX,y:e.clientY,lastY:e.clientY,axis:null};
},{passive:true});
document.addEventListener('pointermove',e=>{
 if(!touch||e.pointerId!==touch.id||uiMode!=='story')return;
 if(!touch.axis){const ax=Math.abs(e.clientX-touch.x),ay=Math.abs(e.clientY-touch.y);if(ax+ay>10)touch.axis=ay>=ax?'y':'x';else return}
 if(touch.axis==='y'){const dy=touch.lastY-e.clientY;touch.lastY=e.clientY;if(dy)nudge(dy/clamp(innerHeight*.8,360,900),dy>0?1:-1,{hold:true})}
},{passive:true});
const endTouch=e=>{
 if(!touch||e.pointerId!==touch.id)return;
 if(touch.axis==='x'&&uiMode==='story'&&e.type==='pointerup'){const dx=touch.x-e.clientX;if(Math.abs(dx)>60)stepBy(dx>0?1:-1)}
 if(touch.axis==='y'&&uiMode==='story'){clearTimeout(S.settleT);S.settleT=setTimeout(settle,30)}
 touch=null;
};
document.addEventListener('pointerup',endTouch,{passive:true});document.addEventListener('pointercancel',endTouch,{passive:true});

/* ---- Edit mode: in-place text, photo drop, client logo, JSON export and import ---- */
function setEdit(on){
 if(EDIT_LOCKED)on=false;
 S.edit=!!on;
 document.body.classList.toggle('edit-mode',S.edit);
 for(const n of [ui.header,ui.text])S.edit?n.setAttribute('contenteditable',EDITABLE):n.removeAttribute('contenteditable');
 if(S.edit){ui.client.tabIndex=0;ui.client.setAttribute('role','group');ui.client.setAttribute('aria-label','Client logo. Press Enter to choose an image, or drop one here.')}
 else{ui.client.removeAttribute('tabindex');ui.client.removeAttribute('role');ui.client.removeAttribute('aria-label')}
 if(!S.edit){blurEditable();disarmReset()}
 if(S.shown>=0)paint(S.shown);
 pokeCursor();
}
function plainPaste(e){
 e.preventDefault();
 const t=((e.clipboardData||window.clipboardData).getData('text')||'').replace(/\s+/g,' ');
 document.execCommand('insertText',false,t);
}
for(const [node,key] of [[ui.header,'header'],[ui.text,'text']]){
 node.addEventListener('input',()=>{if(!S.edit||S.shown<0)return;capLength(node,LIM[key]);setOverride(S.shown,key,node.textContent.replace(/[\u0000-\u001f\u007f]+/g,' '))});
 node.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();node.blur()}});
 node.addEventListener('paste',plainPaste);
 node.addEventListener('blur',()=>{if(!S.edit||S.shown<0)return;const t=node.textContent.replace(/\s+/g,' ').trim();if(t!==node.textContent)node.textContent=t;setOverride(S.shown,key,t)});
}
ui.next.addEventListener('input',e=>{if(!S.edit||!e.target.closest('li>span'))return;capLength(e.target,LIM.item);ov.next.items=rawItems().map(t=>t.replace(/[\u0000-\u001f\u007f]+/g,' ')).slice(0,LIM.items);persist()});
ui.next.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.closest('li>span')){e.preventDefault();e.target.blur()}});
ui.next.addEventListener('paste',e=>{if(e.target.closest('li>span'))plainPaste(e)});
ui.next.addEventListener('blur',e=>{if(S.edit&&e.target.closest&&e.target.closest('li>span')){ov.next.items=rawItems().map(t=>t.replace(/\s+/g,' ').trim()).filter(Boolean).slice(0,LIM.items);persist()}},true);
ui.next.addEventListener('click',e=>{
 if(!S.edit)return;
 const rm=e.target.closest('[data-remove]'),add=e.target.closest('[data-add]');
 if(!rm&&!add)return;
 const items=rawItems().map(t=>t.trim());
 if(rm)items.splice(Number(rm.dataset.remove),1);else items.push('New item');
 ov.next.items=items.filter(Boolean).slice(0,LIM.items);persist();paint(S.shown);
 if(add){const spans=ui.next.querySelectorAll('li:not(.story-add)>span');const last=spans[spans.length-1];if(last){last.focus();document.getSelection().selectAllChildren(last)}}
});
function readURL(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result));r.onerror=()=>rej(r.error);r.readAsDataURL(file)})}
async function toDataURL(file,{max,type,quality}){
 if(file.type==='image/svg+xml'){if(file.size>600000)throw Error('SVG too large');return readURL(file)}
 const bmp=await createImageBitmap(file),k=Math.min(1,max/Math.max(bmp.width,bmp.height));
 const w=Math.max(1,Math.round(bmp.width*k)),h=Math.max(1,Math.round(bmp.height*k));
 const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');
 if(type==='image/jpeg'){g.fillStyle='#ffffff';g.fillRect(0,0,w,h)}
 g.drawImage(bmp,0,0,w,h);if(bmp.close)bmp.close();
 return c.toDataURL(type,quality);
}
async function takePhoto(file){
 if(!file||!/^image\//.test(file.type))return;
 try{const data=await toDataURL(file,{max:1400,type:'image/jpeg',quality:.82});setOverride(S.shown,'photo',data);setOverride(S.shown,'alt','');paint(S.shown);toast('Photo added')}
 catch(err){toast('That image could not be used')}
}
async function takeLogo(file){
 if(!file||!/^image\//.test(file.type))return;
 try{ov.clientLogo=await toDataURL(file,{max:640,type:'image/png',quality:1});persist();paintClient();toast('Client logo added')}
 catch(err){toast('That image could not be used')}
}
const hasFiles=e=>Array.from((e.dataTransfer&&e.dataTransfer.types)||[]).includes('Files');
function wireDrop(zone,take){
 zone.addEventListener('dragover',e=>{if(S.edit&&hasFiles(e)){e.preventDefault();zone.classList.add('drag')}});
 zone.addEventListener('dragleave',()=>zone.classList.remove('drag'));
 zone.addEventListener('drop',e=>{zone.classList.remove('drag');if(!S.edit||!hasFiles(e))return;e.preventDefault();e.stopPropagation();take(Array.from(e.dataTransfer.files).find(f=>/^image\//.test(f.type)))});
}
wireDrop(ui.photo,takePhoto);wireDrop(ui.client,takeLogo);
// A file dropped anywhere else must not navigate away from the presentation.
for(const type of ['dragover','drop'])window.addEventListener(type,e=>{if(uiMode==='story'&&hasFiles(e))e.preventDefault()});
ui.photo.addEventListener('click',e=>{if(!S.edit||e.target.closest('.story-photo-clear'))return;ui.filePhoto.click()});
ui.photo.addEventListener('keydown',e=>{if(S.edit&&(e.key==='Enter'||e.key===' ')&&e.target===ui.photo){e.preventDefault();ui.filePhoto.click()}});
ui.photoClear.addEventListener('click',e=>{e.stopPropagation();if(!S.edit)return;setOverride(S.shown,'photo',null);paint(S.shown);toast('Photo removed')});
ui.client.addEventListener('click',e=>{if(!S.edit||e.target.closest('.story-client-tools'))return;ui.fileLogo.click()});
ui.client.addEventListener('keydown',e=>{if(S.edit&&(e.key==='Enter'||e.key===' ')&&e.target===ui.client){e.preventDefault();ui.fileLogo.click()}});
ui.clientMono.addEventListener('click',e=>{e.stopPropagation();ov.clientLogoMono=!ov.clientLogoMono;persist();paintClient()});
ui.clientClear.addEventListener('click',e=>{e.stopPropagation();ov.clientLogo=null;persist();paintClient();toast('Client logo removed')});
ui.filePhoto.addEventListener('change',()=>{const f=ui.filePhoto.files[0];ui.filePhoto.value='';takePhoto(f)});
ui.fileLogo.addEventListener('change',()=>{const f=ui.fileLogo.files[0];ui.fileLogo.value='';takeLogo(f)});
function snapshot(){
 const steps={};
 for(let i=0;i<LAST;i++){const v=view(i);steps[v.id]={header:v.header,text:v.text,photo:v.photo.src||null,alt:v.photo.alt||''}}
 const n=view(LAST);
 return{format:'bird-story',version:1,exportedAt:new Date().toISOString(),steps,next:{header:n.header,text:n.text,items:n.items},clientLogo:ov.clientLogo||null,clientLogoMono:!!ov.clientLogoMono};
}
function download(blob,name){
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=name;a.rel='noopener';document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),4000);
}
let toastTimer=0;
function toast(msg,ms=2600){ui.toast.textContent=msg;ui.toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>ui.toast.classList.remove('show'),ms)}
$s('story-export').addEventListener('click',()=>{writeNow();download(new Blob([JSON.stringify(snapshot(),null,2)],{type:'application/json'}),`bird-story-${new Date().toISOString().slice(0,10)}.json`);toast('Story exported')});
$s('story-import-btn').addEventListener('click',()=>ui.fileImport.click());
ui.fileImport.addEventListener('change',async()=>{
 const f=ui.fileImport.files[0];ui.fileImport.value='';if(!f)return;
 try{
  if(f.size>30e6)throw Error('too large');
  const next=sanitize(JSON.parse(await f.text()));
  if(!Object.keys(next.steps).length&&!Object.keys(next.next).length&&next.clientLogo===undefined)throw Error('empty');
  ov=next;writeNow();paintClient();if(S.shown>=0)paint(S.shown);toast('Imported '+f.name);
 }catch(err){toast('That file is not a Bird story export')}
});
let resetTimer=0;
function disarmReset(){clearTimeout(resetTimer);resetTimer=0;ui.resetBtn.textContent='Reset';ui.resetBtn.classList.remove('confirm')}
ui.resetBtn.addEventListener('click',()=>{
 if(!resetTimer){ui.resetBtn.textContent='Confirm reset';ui.resetBtn.classList.add('confirm');resetTimer=setTimeout(disarmReset,3200);return}
 disarmReset();ov=blankOverrides();try{localStorage.removeItem(STORY_KEY)}catch(err){}
 setSaveState('');paintClient();if(S.shown>=0)paint(S.shown);toast('Back to the default story');
});
$s('story-prev').addEventListener('click',()=>stepBy(-1));$s('story-fwd').addEventListener('click',()=>stepBy(1));
$s('story-done').addEventListener('click',()=>setEdit(false));

/* ---- Exports: P saves a transparent PNG, G saves the model as GLB ---- */
async function exportModel(kind){
 if(S.busy||!S.active)return;
 S.busy=true;toast(kind==='png'?'Preparing PNG':'Preparing GLB',12000);
 try{
  const blob=kind==='png'?await scene.exportPNG({width:3840,transparent:true}):await scene.exportGLB();
  if(!blob)throw Error('Nothing to save');
  const name=`bird-site-to-service-${pad2(S.shown+1)}-${STEPS[S.shown].id}.${kind}`;
  download(blob,name);toast('Saved '+name,3600);
 }catch(err){console.error('Story export:',err);toast('The export could not be saved',3600)}
 finally{S.busy=false}
}

/* ---- Hidden shortcuts: E edit, X explore, P PNG, G GLB, H help, Esc closes it ---- */
let helpReturn=null;
function openHelp(){if(S.help)return;S.help=true;helpReturn=document.activeElement;ui.help.hidden=false;const card=ui.help.firstElementChild;card.tabIndex=-1;card.focus({preventScroll:true})}
function closeHelp(){if(!S.help)return;S.help=false;ui.help.hidden=true;if(helpReturn&&helpReturn.focus&&document.contains(helpReturn))helpReturn.focus({preventScroll:true});helpReturn=null}
const isTyping=t=>!!t&&(t.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName||''));
const NEXT_KEYS=new Set(['ArrowRight','ArrowDown','PageDown']),PREV_KEYS=new Set(['ArrowLeft','ArrowUp','PageUp']);
window.addEventListener('keydown',e=>{
 const k=e.key;
 if(e.ctrlKey||e.metaKey||e.altKey)return;
 if(k==='Escape'&&uiMode==='story'){if(S.help){e.preventDefault();closeHelp()}else if(isTyping(e.target))e.target.blur();return}
 if(isTyping(e.target))return;
 if((k==='x'||k==='X')&&!dialog.open){if(!e.repeat){e.preventDefault();setUiMode(uiMode==='story'?'explore':'story',{writeHash:true})}return}
 if(uiMode!=='story')return;
 const lower=k.length===1?k.toLowerCase():k;
 if(lower==='h'){if(!e.repeat){e.preventDefault();S.help?closeHelp():openHelp()}return}
 if(S.help)return;
 if(lower==='e'){if(!e.repeat){e.preventDefault();setEdit(!S.edit)}return}
 if(lower==='m'){if(!e.repeat){e.preventDefault();setMotion()}return}
 if(lower==='p'||lower==='g'){if(!e.repeat){e.preventDefault();exportModel(lower==='p'?'png':'glb')}return}
 const onButton=e.target&&e.target.tagName==='BUTTON';
 if(k===' '){if(onButton)return;e.preventDefault();if(!e.repeat)stepBy(e.shiftKey?-1:1);return}
 if(NEXT_KEYS.has(k)){e.preventDefault();if(!e.repeat)stepBy(1);return}
 if(PREV_KEYS.has(k)){e.preventDefault();if(!e.repeat)stepBy(-1);return}
 if(k==='Home'){e.preventDefault();if(!e.repeat)tweenTo(0);return}
 if(k==='End'){e.preventDefault();if(!e.repeat)tweenTo(LAST)}
});

/* ---- Switching between story and explore ---- */
let idleTimer=0;
function pokeCursor(){document.body.classList.remove('story-idle');clearTimeout(idleTimer);if(uiMode==='story'&&!S.edit)idleTimer=setTimeout(()=>{if(uiMode==='story'&&!S.edit)document.body.classList.add('story-idle')},2600)}
window.addEventListener('pointermove',pokeCursor,{passive:true});
let pendingEdit=QUERY.has('edit')&&!EDIT_LOCKED;
function enterStory(){
 const stage=document.querySelector('.stage');if(stage)stage.setAttribute('aria-hidden','true');
 if(state.seq!=null)seqExit();
 if(state.panelOpen)closePanel(false);
 if(dialog.open)closeSources();
 scene.drawLabels=null;labels=[];
 const cv=scene.canvas;cv.tabIndex=-1;cv.setAttribute('aria-hidden','true');if(document.activeElement===cv)cv.blur();
 document.title=BASE_TITLE;
 guard(()=>scene.setMode('story'));
 const intro=!S.introDone&&INTRO_MS>0&&!reduced();S.introDone=true;
 S.active=true;S.sentP=-999;S.shown=-1;S.p=S.goal=intro?-1:clamp(S.p,0,LAST);S.mode='idle';
 if(pendingEdit){pendingEdit=false;S.edit=true}
 setEdit(S.edit);
 applyMotion();commit(true);pokeCursor();
 if(intro)requestAnimationFrame(()=>requestAnimationFrame(()=>{if(S.active&&S.mode==='idle'&&S.p<0)tweenTo(0,{duration:INTRO_MS})}));
}
function enterExplore(){
 const stage=document.querySelector('.stage');if(stage)stage.removeAttribute('aria-hidden');
 S.active=false;stopAnim();S.mode='idle';closeHelp();blurEditable();
 clearTimeout(idleTimer);document.body.classList.remove('story-idle','edit-mode');
 guard(()=>scene.setMode('explore'));applyMotion();
 scene.drawLabels=drawLabelsFn;
 const cv=scene.canvas;cv.tabIndex=0;cv.removeAttribute('aria-hidden');
 sync();
 window.scrollTo({top:state.chapter/6*(document.documentElement.scrollHeight-innerHeight),behavior:'instant'});
}
function setUiMode(next,{writeHash=false}={}){
 if(next===uiMode)return;
 uiMode=next;
 document.body.classList.toggle('story-mode',next==='story');document.body.classList.toggle('explore-mode',next==='explore');
 document.documentElement.setAttribute('data-mode',next);
 if(themeMeta)themeMeta.content=next==='story'?'#0b0d0c':'#00703C';
 if(next==='story')enterStory();else enterExplore();
 if(writeHash){try{history.replaceState(null,'',next==='story'?'#story':'#explore')}catch(err){}}
}
window.addEventListener('hashchange',()=>{
 const h=location.hash.slice(1),want=isExploreHash(h)?'explore':'story';
 if(want!==uiMode){setUiMode(want);if(want==='explore'){const i=DATA.chapters.findIndex(c=>c.id===h);if(i>0)navigateChapter(i)}}
});

/* ---- Read-back for checks, like window.BirdJourney in explore mode ---- */
window.BirdStory={
 getState(){const v=S.shown>=0?view(S.shown):null;return{mode:uiMode,progress:S.p,step:S.shown,stepId:v&&v.id,header:v&&v.header,text:v&&v.text,photo:v&&v.photo?v.photo.src:null,items:v&&v.items,animating:S.mode!=='idle',intro:S.p<0,editing:S.edit,helpOpen:S.help,steps:STEPS.length,reduced:reduced()}},
 goTo(i,opts){if(uiMode==='story')tweenTo(i,opts)},
 setProgress(p){if(uiMode!=='story')return;stopAnim();S.p=S.goal=clamp(p,0,LAST);S.mode='idle';commit(true)},
 next(){if(uiMode==='story')stepBy(1)},prev(){if(uiMode==='story')stepBy(-1)},
 setEdit(on){if(uiMode==='story')setEdit(on)},
 // The camera the renderer is using for the current progress, in metres (read-only, for checks).
 camera(){let c=null;guard(()=>{c=scene.storyFrame(scene.width,scene.height).cam});return c&&{eye:c.eye.slice(),target:c.target.slice(),fov:c.fov}},
 /* Animation hooks (ANIMATION-CONTRACT 2.5). The clock belongs to the scene; these pass the calls through.
    Deterministic capture: setProgress(p); setClock({t, frozen: true}); renderNow(); then take the screenshot. */
 setClock(o){let r=null;guard(()=>{r=scene.setClock(o)});return r},
 getClock(){let r=null;guard(()=>{r=scene.getClock()});return r},
 renderNow(){let r=null;guard(()=>{commit();r=scene.renderNow()});return r},
 setMotion(on){return setMotion(on)},
 getAnimState(){
  let info={},clock=null,work={},flows=[];
  guard(()=>{info=scene.animInfo()||{}});guard(()=>{clock=scene.getClock()});
  const p=Math.max(0,S.p),red=clock?!!clock.reduced:reduced();
  guard(()=>{if(typeof MODEL.animWork==='function')work=MODEL.animWork(p)||{}});
  guard(()=>{if(typeof MODEL.flowState==='function'){const f=MODEL.flowState(p)||{};flows=Object.keys(f).map(id=>({id,intensity:f[id]}))}});
  return{p:S.p,t:red?0:(clock?clock.t:0),reduced:red,work,flows,draw:{calls:info.calls||0,triangles:info.triangles||0,frames:info.frames||0},parts:info.parts||0,reveals:info.reveals||0}
 }
};

/* ---- Start ---- */
document.body.classList.toggle('story-mode',uiMode==='story');document.body.classList.toggle('explore-mode',uiMode==='explore');
document.documentElement.setAttribute('data-mode',uiMode);
if(themeMeta)themeMeta.content=uiMode==='story'?'#0b0d0c':'#00703C';
paintClient();applyMotion();
if(uiMode==='story')enterStory();else startExplore();
