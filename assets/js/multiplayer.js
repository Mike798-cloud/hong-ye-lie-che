(()=>{
'use strict';
const SAVE_KEY='k417_rebuild_v3';
const SESSION_KEY='k417_multiplayer_session_v1';
const BACKUP_KEY='k417_multiplayer_single_backup_v1';
const NAME_KEY='k417_multiplayer_name_v1';
const EMPTY_BACKUP='__K417_EMPTY_SAVE__';
const CFG=window.K417_MULTIPLAYER_CONFIG||{};
const MAX_PLAYERS=Math.max(2,Math.min(3,Number(CFG.maxPlayers)||3));
const RECONNECT_DELAY=Math.max(1200,Number(CFG.reconnectDelay)||2200);
const API_TIMEOUT=10000;
const SOCKET_TIMEOUT=10000;
const SHARED_FIELDS=['stage','evidence','deductions','inspection','interviews','portraitInspection','openDocs','timeSolved','photoSolved','photoEdgeFound','boxOpened','finalSubmitted','finalAnswers','ending','choices','logs','secret','started'];
const ROUTE_NAMES={case:'案情总览',map:'列车调查',people:'证人质询',evidence:'证物与推理',search:'旧网检索',timeline:'时间轴',puzzles:'特殊检验',final:'终夜结案'};
const LOCATION_NAMES={cabin:'6车·7号包厢',dining:'8车·餐车',conductor:'9车·乘务室',corridor:'5—6车连接处',car4:'4车·行李架'};
const originalSetItem=Storage.prototype.setItem;
const originalRemoveItem=Storage.prototype.removeItem;
let suppressSaveHook=false;
let saveHookQueued=false;
let session=loadSession();
let socket=null;
let socketSerial=0;
let socketOpenTimer=0;
let reconnectTimer=0;
let reconnectAttempts=0;
let firstSnapshotPending=false;
let lastSentShared='';
let lastPresence='';
let presenceTimer=0;
let panelOpen=false;
let busy=false;
let injectQueued=false;
let gameApplyQueued=false;
let gameApplyPending=false;
let gameApplyWaitTimer=0;
let runtime={status:session?'connecting':'idle',players:[],feed:[],revision:0,error:'',roomExists:true};
function clone(v){try{return JSON.parse(JSON.stringify(v))}catch(_){return v}}
function cleanName(v){return String(v||'').replace(/[<>\n\r]/g,'').trim().slice(0,14)||'调查员'}
function cleanRoom(v){return String(v||'').toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g,'').slice(0,6)}
function configuredServer(){const raw=String(CFG.serverUrl||'').trim().replace(/\/+$/,'');return raw&&!/YOUR-WORKER/i.test(raw)?raw:''}
function serverForSession(){return configuredServer()||String(session?.serverUrl||'').replace(/\/+$/,'')}
function wsBase(http){return http.replace(/^https:/i,'wss:').replace(/^http:/i,'ws:')}
function readSave(){try{return JSON.parse(localStorage.getItem(SAVE_KEY)||'null')}catch(_){return null}}
function writeSave(v){suppressSaveHook=true;try{originalSetItem.call(localStorage,SAVE_KEY,JSON.stringify(v))}finally{suppressSaveHook=false}}
function loadSession(){try{const s=JSON.parse(sessionStorage.getItem(SESSION_KEY)||localStorage.getItem(SESSION_KEY)||'null');return s&&s.roomCode&&s.playerId&&s.token?s:null}catch(_){return null}}
function persistSession(){if(!session)return;const raw=JSON.stringify(session);try{sessionStorage.setItem(SESSION_KEY,raw);localStorage.setItem(SESSION_KEY,raw)}catch(_){}}
function clearSession(){try{sessionStorage.removeItem(SESSION_KEY);localStorage.removeItem(SESSION_KEY)}catch(_){}session=null}
function backupSingle(){try{const raw=localStorage.getItem(SAVE_KEY);originalSetItem.call(localStorage,BACKUP_KEY,raw===null?EMPTY_BACKUP:raw)}catch(_){}}
function restoreSingle(){try{const raw=localStorage.getItem(BACKUP_KEY);if(raw===EMPTY_BACKUP)originalRemoveItem.call(localStorage,SAVE_KEY);else if(raw!==null)originalSetItem.call(localStorage,SAVE_KEY,raw);originalRemoveItem.call(localStorage,BACKUP_KEY)}catch(_){}}
function ensureLocalSave(){let s=readSave();if(s)return s;const start=document.querySelector('[data-enter-case]');if(start){start.click();s=readSave()}return s}
function captureShared(full){
  full=full||{};
  const out={};
  SHARED_FIELDS.forEach(k=>{if(k in full)out[k]=clone(full[k])});
  out.started=true;
  out.stage=Math.max(1,Number(out.stage)||1);
  out.evidence=Array.isArray(out.evidence)?out.evidence:[];
  out.deductions=Array.isArray(out.deductions)?out.deductions:[];
  out.inspection=out.inspection&&typeof out.inspection==='object'?out.inspection:{};
  out.interviews=out.interviews&&typeof out.interviews==='object'?out.interviews:{};
  out.portraitInspection=out.portraitInspection&&typeof out.portraitInspection==='object'?out.portraitInspection:{};
  out.openDocs=Array.isArray(out.openDocs)?out.openDocs:[];
  out.finalAnswers=out.finalAnswers&&typeof out.finalAnswers==='object'?out.finalAnswers:{};
  out.choices=out.choices&&typeof out.choices==='object'?out.choices:{};
  out.logs=Array.isArray(out.logs)?out.logs.slice(0,30):[];
  ['timeSolved','photoSolved','photoEdgeFound','boxOpened','finalSubmitted','secret'].forEach(k=>out[k]=!!out[k]);
  if(out.ending==null)out.ending=null;
  return out;
}
function signature(v){try{return JSON.stringify(v)}catch(_){return ''}}
function presenceFrom(full){
  full=full||{};
  const route=ROUTE_NAMES[full.route]||'调查中';
  let detail='';
  if(full.route==='map')detail=LOCATION_NAMES[full.activeLocation]||'';
  if(full.route==='people'&&window.K417_DATA?.PEOPLE){detail=window.K417_DATA.PEOPLE.find(p=>p.id===full.person)?.name||''}
  return {route:full.route||'case',label:detail?`${route} · ${detail}`:route};
}
function evidenceName(id){return window.K417_DATA?.EVIDENCE?.[id]?.name||id}
function deductionName(id){return window.K417_DATA?.DEDUCTION_RECIPES?.find?.(d=>d.id===id)?.name||id}
Storage.prototype.setItem=function(key,value){
  const result=originalSetItem.call(this,key,value);
  if(!suppressSaveHook&&this===localStorage&&key===SAVE_KEY&&!saveHookQueued){
    saveHookQueued=true;
    queueMicrotask(()=>{saveHookQueued=false;onLocalGameSave()});
  }
  return result;
};
function onLocalGameSave(){
  if(!session||!socket||socket.readyState!==WebSocket.OPEN||firstSnapshotPending)return;
  const full=readSave();if(!full)return;
  const shared=captureShared(full),sig=signature(shared);
  if(sig!==lastSentShared){lastSentShared=sig;send({type:'state:update',state:shared,baseRevision:runtime.revision})}
  schedulePresence(full);
}
function schedulePresence(full){
  const p=presenceFrom(full),sig=signature(p);if(sig===lastPresence)return;
  lastPresence=sig;clearTimeout(presenceTimer);presenceTimer=setTimeout(()=>send({type:'presence',presence:p}),180);
}
function send(obj){try{if(socket?.readyState===WebSocket.OPEN)socket.send(JSON.stringify(obj))}catch(_){}}
async function api(path,options={}){
  const base=serverForSession();if(!base)throw new Error('联机服务器尚未配置');
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),API_TIMEOUT);
  try{
    const res=await fetch(base+path,{method:options.method||'GET',headers:{'Content-Type':'application/json'},body:options.body?JSON.stringify(options.body):undefined,cache:'no-store',signal:controller.signal});
    let data={};try{data=await res.json()}catch(_){ }
    if(!res.ok)throw new Error(data.error||`服务器返回 ${res.status}`);
    return data;
  }catch(e){
    if(e?.name==='AbortError')throw new Error('联机服务器响应超时，请稍后重试');
    throw e;
  }finally{clearTimeout(timer)}
}
async function createRoom(name){
  if(busy)return;busy=true;runtime.error='';renderPanel();
  try{
    backupSingle();const full=ensureLocalSave();if(!full)throw new Error('无法建立本机调查状态');
    const playerName=cleanName(name);localStorage.setItem(NAME_KEY,playerName);
    const data=await api('/api/rooms',{method:'POST',body:{playerName,protocolVersion:Number(CFG.protocolVersion)||1,initialState:captureShared(full)}});
    session={roomCode:data.roomCode,playerId:data.playerId,token:data.token,name:playerName,host:true,freshJoin:true,serverUrl:configuredServer()};persistSession();
    runtime={status:'connecting',players:[],feed:[],revision:0,error:'',roomExists:true};panelOpen=true;connect();
  }catch(e){runtime.error=e.message||String(e);if(!session)restoreSingle()}
  finally{busy=false;renderPanel();scheduleInjectUI()}
}
async function joinRoom(code,name){
  if(busy)return;busy=true;runtime.error='';renderPanel();
  try{
    code=cleanRoom(code);if(code.length!==6)throw new Error('请输入6位房间码');
    backupSingle();ensureLocalSave();
    const playerName=cleanName(name);localStorage.setItem(NAME_KEY,playerName);
    const data=await api(`/api/rooms/${encodeURIComponent(code)}/join`,{method:'POST',body:{playerName,protocolVersion:Number(CFG.protocolVersion)||1}});
    session={roomCode:data.roomCode,playerId:data.playerId,token:data.token,name:playerName,host:!!data.host,freshJoin:true,serverUrl:configuredServer()};persistSession();
    runtime={status:'connecting',players:[],feed:[],revision:0,error:'',roomExists:true};panelOpen=true;connect();
  }catch(e){runtime.error=e.message||String(e);if(!session)restoreSingle()}
  finally{busy=false;renderPanel();scheduleInjectUI()}
}
function disposeSocket(code=1000,reason='replace'){
  clearTimeout(socketOpenTimer);socketOpenTimer=0;
  const old=socket;socket=null;socketSerial++;
  if(!old)return;
  old.onopen=old.onmessage=old.onclose=old.onerror=null;
  try{old.close(code,reason)}catch(_){ }
}
function connect(){
  clearTimeout(reconnectTimer);reconnectTimer=0;if(!session)return;
  const base=serverForSession();if(!base){runtime.status='offline';runtime.error='请先在 assets/js/multiplayer-config.js 中填写 Cloudflare Worker 地址。';renderPanel();scheduleInjectUI();return}
  disposeSocket(1000,'reconnect');
  runtime.status='connecting';runtime.error='';scheduleInjectUI();renderPanel();firstSnapshotPending=true;
  const serial=socketSerial+1;socketSerial=serial;
  const url=`${wsBase(base)}/api/rooms/${encodeURIComponent(session.roomCode)}/ws?playerId=${encodeURIComponent(session.playerId)}&token=${encodeURIComponent(session.token)}`;
  let ws;
  try{ws=new WebSocket(url);socket=ws}catch(e){runtime.status='offline';runtime.error=e.message||'无法建立联机连接';scheduleReconnect();return}
  socketOpenTimer=setTimeout(()=>{
    if(socket!==ws||ws.readyState===WebSocket.OPEN)return;
    runtime.status='offline';runtime.error='联机连接超时，稍后会自动重试。';
    try{ws.close()}catch(_){ }
    renderPanel();scheduleInjectUI();scheduleReconnect();
  },SOCKET_TIMEOUT);
  ws.onopen=()=>{
    if(socket!==ws||serial!==socketSerial)return;
    clearTimeout(socketOpenTimer);socketOpenTimer=0;reconnectAttempts=0;
    runtime.status='online';runtime.error='';scheduleInjectUI();renderPanel();
    const full=readSave();
    send({type:'hello',protocolVersion:Number(CFG.protocolVersion)||1,state:session.freshJoin?null:captureShared(full),presence:presenceFrom(full)});
  };
  ws.onmessage=e=>{if(socket!==ws||serial!==socketSerial)return;let m;try{m=JSON.parse(e.data)}catch(_){return}handleMessage(m)};
  ws.onclose=e=>{
    if(socket!==ws||serial!==socketSerial)return;
    clearTimeout(socketOpenTimer);socketOpenTimer=0;socket=null;firstSnapshotPending=false;
    runtime.status='offline';runtime.players=[];
    const terminal=e.code===4404||e.code===4403||e.code===4409;
    if(e.code===4404)runtime.error='房间已失效或不存在。请退出调查组后重新创建/加入。';
    else if(e.code===4403)runtime.error='联机身份验证失败，请退出房间后重新加入。';
    else if(e.code===4409)runtime.error='该账号已在另一个页面连接。关闭另一个页面后可手动重连。';
    else if(e.code!==1000&&!runtime.error)runtime.error='联机连接暂时中断，正在等待重连。';
    scheduleInjectUI();renderPanel();
    if(!terminal&&e.code!==1000)scheduleReconnect();
  };
  ws.onerror=()=>{};
}
function scheduleReconnect(){
  if(!session||reconnectTimer||navigator.onLine===false)return;
  const delay=Math.min(15000,Math.round(RECONNECT_DELAY*Math.pow(1.45,Math.min(reconnectAttempts,5))));
  reconnectAttempts++;
  reconnectTimer=setTimeout(()=>{reconnectTimer=0;connect()},delay);
}
function runGameApply(){
  if(!gameApplyPending||gameApplyQueued)return;
  const bridge=window.K417GameBridge;
  if(!bridge?.applyExternalSave){
    clearTimeout(gameApplyWaitTimer);
    gameApplyWaitTimer=setTimeout(()=>{
      gameApplyWaitTimer=0;
      if(gameApplyPending&&window.K417GameBridge?.applyExternalSave)runGameApply();
      else if(gameApplyPending){
        runtime.error='共享进度已保存，但当前页面暂时无法实时刷新。请稍候或手动刷新一次；案件进度不会丢失。';
        renderPanel();
      }
    },1500);
    return;
  }
  gameApplyQueued=true;
  requestAnimationFrame(()=>{
    gameApplyQueued=false;
    if(!gameApplyPending)return;
    try{
      gameApplyPending=false;
      bridge.applyExternalSave();
      runtime.error='';
      const latest=readSave();
      scheduleInjectUI();renderPanel();if(latest)schedulePresence(latest);
    }catch(e){
      console.error('[K417 multiplayer live sync]',e);
      runtime.error='队友进度已经保存，但页面实时刷新失败。继续操作前建议手动刷新一次。';
      renderPanel();
    }
  });
}
function scheduleGameApply(){gameApplyPending=true;runGameApply()}
window.addEventListener('k417:game-ready',()=>{if(gameApplyPending)runGameApply()});
function handleMessage(m){
  if(m.type==='error'){runtime.error=m.error||'联机服务器错误';toast(runtime.error,'bad');renderPanel();return}
  if(m.type==='snapshot'){
    const incomingRevision=Number(m.revision)||0;if(incomingRevision<runtime.revision)return;
    runtime.revision=incomingRevision;runtime.players=Array.isArray(m.players)?m.players:[];runtime.feed=Array.isArray(m.feed)?m.feed.slice(-50):runtime.feed;
    const wasFresh=!!session?.freshJoin;if(session){session.host=!!m.host;session.freshJoin=false;persistSession()}
    firstSnapshotPending=false;
    const debug=typeof window.__K417_DEBUG_STATE__==='function'?window.__K417_DEBUG_STATE__():null;
    const full=readSave()||debug||{},remote=captureShared(m.state||{}),local=captureShared(full);
    lastSentShared=signature(remote);
    if(wasFresh)toast(`已进入调查组 ${session.roomCode}`,'good');
    if(signature(local)!==signature(remote)){
      const next={...full,...remote,version:full.version||debug?.version||'6.0.0',started:true};
      writeSave(next);scheduleGameApply();scheduleInjectUI();renderPanel();schedulePresence(next);return;
    }
    scheduleInjectUI();renderPanel();schedulePresence(full);return;
  }
  if(m.type==='presence'){
    runtime.players=Array.isArray(m.players)?m.players:[];const me=runtime.players.find(p=>p.playerId===session?.playerId);if(me&&session&&session.host!==!!me.host){session.host=!!me.host;persistSession()}scheduleInjectUI();renderPanel();return;
  }
  if(m.type==='feed'){
    if(m.entry){runtime.feed=[...runtime.feed,m.entry].slice(-50);if(m.entry.kind==='evidence')toast(`${m.entry.by} 登记：${evidenceName(m.entry.id)}`,'good');if(m.entry.kind==='deduction')toast(`${m.entry.by} 完成推理：${deductionName(m.entry.id)}`,'good');if(m.entry.kind==='stage')toast(`调查组推进至第 ${m.entry.stage} 阶段`,'good')}
    renderPanel();return;
  }
}
function leaveRoom(){
  if(!session)return;const code=session.roomCode;
  if(!confirm(`确定退出调查组 ${code}？\n你的单人存档会恢复；若你是房主，会自动移交给仍在房间里的最早加入成员。`))return;
  const leaving=clone(session),base=serverForSession();
  clearTimeout(reconnectTimer);reconnectTimer=0;reconnectAttempts=0;
  if(base){fetch(`${base}/api/rooms/${encodeURIComponent(leaving.roomCode)}/leave`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({playerId:leaving.playerId,token:leaving.token}),keepalive:true}).catch(()=>{})}
  disposeSocket(1000,'leave');clearSession();restoreSingle();runtime={status:'idle',players:[],feed:[],revision:0,error:'',roomExists:true};panelOpen=false;location.reload();
}
function panelHtml(){
  const server=configuredServer();
  if(!session){
    const name=cleanName(localStorage.getItem(NAME_KEY)||'调查员');
    const configWarning=!server?`<div class="mp-error">联机代码已加入，但 Cloudflare Worker 地址尚未配置。先部署压缩包里的 <b>cloudflare-multiplayer</b>，再把得到的 workers.dev 地址填入 <code>assets/js/multiplayer-config.js</code>。</div>`:'';
    return `<div class="mp-overlay" data-mp-overlay><section class="mp-panel" role="dialog" aria-modal="true" aria-label="联机调查"><div class="mp-panel-head"><h2>联机调查</h2><button class="mp-close" type="button" data-mp-close>×</button></div><div class="mp-body"><p class="mp-lead">支持1名房主与最多2名队友。每个人可以独立查看不同页面；证物、质证、推论、谜题和阶段进度由调查组实时共享。</p>${configWarning}<div class="mp-field"><label>调查员称呼</label><input id="mp-name" maxlength="14" value="${escapeHtml(name)}" autocomplete="nickname"></div><div class="mp-grid"><div class="mp-card"><h3>创建调查组</h3><p>以你当前的案情进度创建房间；如果尚未开始，会自动建立新的调查卷。</p><button class="mp-btn primary" type="button" data-mp-create ${!server||busy?'disabled':''}>${busy?'正在连接…':'创建房间'}</button></div><div class="mp-card"><h3>加入调查组</h3><p>输入房主提供的6位房间码。加入时不会把你的单人进度带入别人房间。</p><div class="mp-field"><input id="mp-room" class="mp-room-input" maxlength="6" placeholder="ABC234" autocomplete="off"></div><button class="mp-btn" type="button" data-mp-join ${!server||busy?'disabled':''}>加入房间</button></div></div>${runtime.error?`<div class="mp-error" style="margin-top:12px">${escapeHtml(runtime.error)}</div>`:''}<div class="mp-dev-help">单人存档会在进入联机前自动备份；退出调查组后恢复。联机期间禁止“重置案情/新建案情”，避免多人状态被单方面清空。</div></div></section></div>`;
  }
  const players=runtime.players.length?runtime.players:[{playerId:session.playerId,name:session.name,host:session.host,online:runtime.status==='online',presence:{label:'正在连接…'}}];
  const phtml=players.map(p=>`<div class="mp-player ${p.online?'':'offline'}"><span class="live"></span><div><b>${escapeHtml(p.name)}${p.playerId===session.playerId?'（你）':''}</b><small>${escapeHtml(p.presence?.label||(p.online?'调查中':'暂时离线'))}</small></div>${p.host?'<span class="mp-host">房主</span>':''}</div>`).join('');
  const feed=runtime.feed.length?runtime.feed.map(feedHtml).join(''):'<div class="mp-msg system">尚无协作记录。任何人取得新证物或完成推理后，会出现在这里。</div>';
  const stat=runtime.status==='online'?['已连接','ok']:runtime.status==='connecting'?['连接中','warn']:['已断开','warn'];
  return `<div class="mp-overlay" data-mp-overlay><section class="mp-panel" role="dialog" aria-modal="true" aria-label="调查组"><div class="mp-panel-head"><h2>调查组</h2><span class="mp-room-code">${escapeHtml(session.roomCode)}</span><button class="mp-close" type="button" data-mp-close>×</button></div><div class="mp-body"><div class="mp-status-row"><span class="mp-status-pill ${stat[1]}">${stat[0]}</span><span class="mp-status-pill">在线 ${players.filter(p=>p.online).length}/${MAX_PLAYERS}</span>${session.host?'<span class="mp-status-pill ok">你是房主 · 负责最终结案</span>':'<span class="mp-status-pill">共同调查 · 房主提交结案</span>'}</div>${runtime.error?`<div class="mp-error" style="margin-bottom:12px">${escapeHtml(runtime.error)}</div>`:''}<div class="mp-card"><h3>成员状态</h3><div class="mp-players">${phtml}</div><div class="mp-actions"><button class="mp-btn" type="button" data-mp-copy>复制房间码</button>${runtime.status!=='online'?'<button class="mp-btn" type="button" data-mp-reconnect>立即重连</button>':''}<button class="mp-btn danger" type="button" data-mp-leave>退出调查组</button></div></div><div class="mp-card" style="margin-top:12px"><h3>调查频道</h3><div class="mp-feed" id="mp-feed">${feed}</div><form class="mp-chat-form" data-mp-chat><input name="text" maxlength="180" placeholder="发一条简短协作消息…" autocomplete="off"><button class="mp-btn" type="submit" ${runtime.status!=='online'?'disabled':''}>发送</button></form></div><div class="mp-note" style="margin-top:12px">证物、质证、推论、时间校准、照片检验、密码箱与调查阶段会自动共享；当前页面、人物页、提示层级、音量和支付状态不会同步。</div></div></section></div>`;
}
function feedHtml(x){const t=escapeHtml(x.time||'');if(x.kind==='chat')return `<div class="mp-msg"><time>${t}</time><b>${escapeHtml(x.by||'调查员')}：</b>${escapeHtml(x.text||'')}</div>`;if(x.kind==='evidence')return `<div class="mp-msg system"><time>${t}</time>${escapeHtml(x.by||'队友')} 登记证物「${escapeHtml(evidenceName(x.id))}」</div>`;if(x.kind==='deduction')return `<div class="mp-msg system"><time>${t}</time>${escapeHtml(x.by||'队友')} 完成推理「${escapeHtml(deductionName(x.id))}」</div>`;if(x.kind==='stage')return `<div class="mp-msg system"><time>${t}</time>调查推进到第 ${Number(x.stage)||1} 阶段（${escapeHtml(x.by||'调查组')}）</div>`;if(x.kind==='join'||x.kind==='leave')return `<div class="mp-msg system"><time>${t}</time>${escapeHtml(x.text||'成员状态变化')}</div>`;return `<div class="mp-msg system"><time>${t}</time>${escapeHtml(x.text||'调查状态已更新')}</div>`}
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function renderPanel(){
  let root=document.getElementById('k417-multiplayer-root');
  if(!panelOpen){root?.remove();return}
  if(!root){root=document.createElement('div');root.id='k417-multiplayer-root';document.body.appendChild(root)}
  root.innerHTML=panelHtml();requestAnimationFrame(()=>{const f=document.getElementById('mp-feed');if(f)f.scrollTop=f.scrollHeight});
}
function toast(text,kind=''){let w=document.querySelector('.mp-toastwrap');if(!w){w=document.createElement('div');w.className='mp-toastwrap';document.body.appendChild(w)}const n=document.createElement('div');n.className='mp-toast '+kind;n.textContent=text;w.appendChild(n);setTimeout(()=>n.remove(),3200)}
function setText(node,text){if(node&&node.textContent!==text)node.textContent=text}
function injectUI(){
  const cover=document.querySelector('.cover-actions');
  if(cover){
    let b=cover.querySelector('[data-mp-open]');
    if(!b){b=document.createElement('button');b.type='button';b.className='btn mp-cover-btn';b.dataset.mpOpen='1';const help=cover.querySelector('[data-help]');cover.insertBefore(b,help||null)}
    setText(b,session?`调查组 ${session.roomCode}`:'联机调查');
  }
  const top=document.querySelector('.top-actions');
  if(top){
    let b=top.querySelector('[data-mp-panel]');
    if(!b){
      b=document.createElement('button');b.type='button';b.dataset.mpPanel='1';b.className='mp-team-button offline';
      const dot=document.createElement('span');dot.className='mp-dot';
      const label=document.createElement('span');label.className='mp-team-label';
      b.append(dot,label);top.insertBefore(b,top.querySelector('[data-audio]')||null);
    }
    const cls=session?runtime.status:'idle';const wanted=`mp-team-button ${cls==='online'?'online':cls==='connecting'?'connecting':'offline'}`;
    if(b.className!==wanted)b.className=wanted;
    const count=runtime.players.filter(p=>p.online).length;
    setText(b.querySelector('.mp-team-label'),session?`调查组 ${count||1}/${MAX_PLAYERS}`:'联机调查');
  }
}
function scheduleInjectUI(){
  if(injectQueued)return;injectQueued=true;
  requestAnimationFrame(()=>{injectQueued=false;injectUI()});
}
function openPanel(){panelOpen=true;renderPanel()}
function closePanel(){panelOpen=false;renderPanel()}
document.addEventListener('click',e=>{
  const t=e.target.closest?.('[data-mp-open],[data-mp-panel],[data-mp-close],[data-mp-create],[data-mp-join],[data-mp-copy],[data-mp-reconnect],[data-mp-leave]');
  if(t){
    e.preventDefault();e.stopImmediatePropagation();
    if(t.matches('[data-mp-open],[data-mp-panel]'))return openPanel();
    if(t.matches('[data-mp-close]'))return closePanel();
    if(t.matches('[data-mp-create]'))return createRoom(document.getElementById('mp-name')?.value);
    if(t.matches('[data-mp-join]'))return joinRoom(document.getElementById('mp-room')?.value,document.getElementById('mp-name')?.value);
    if(t.matches('[data-mp-copy]')){navigator.clipboard?.writeText(session?.roomCode||'').then(()=>toast('房间码已复制','good')).catch(()=>toast(`房间码：${session?.roomCode||''}`));return}
    if(t.matches('[data-mp-reconnect]')){reconnectAttempts=0;runtime.error='';return connect()}
    if(t.matches('[data-mp-leave]'))return leaveRoom();
  }
  if(session){
    const destructive=e.target.closest?.('[data-reset-case],[data-new-case],[data-restart]');
    if(destructive){e.preventDefault();e.stopImmediatePropagation();toast('联机调查中不能单方面重置案情。请先退出调查组。','warn');return}
    if(!session.host&&e.target.closest?.('[data-choice],[data-seal-report]')){e.preventDefault();e.stopImmediatePropagation();toast('最终程序选择由房主提交；你仍可继续查看全部证据。','warn');return}
  }
},true);
document.addEventListener('submit',e=>{
  if(e.target.matches?.('[data-mp-chat]')){e.preventDefault();const input=e.target.elements.text;const text=String(input?.value||'').trim().slice(0,180);if(text&&runtime.status==='online'){send({type:'chat',text});input.value=''}return}
  if(session&&!session.host&&e.target.matches?.('[data-final]')){e.preventDefault();e.stopImmediatePropagation();toast('共同结案由房主负责提交。','warn')}
},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panelOpen)closePanel()});
const observer=new MutationObserver(()=>scheduleInjectUI());
document.addEventListener('DOMContentLoaded',()=>{
  const app=document.getElementById('app');
  if(app)observer.observe(app,{childList:true});
  scheduleInjectUI();
  if(session){runtime.status='connecting';connect()}
});
window.addEventListener('online',()=>{if(session&&runtime.status!=='online'){reconnectAttempts=0;scheduleReconnect()}});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&session&&runtime.status==='offline'&&!reconnectTimer)scheduleReconnect()});
window.K417Multiplayer={
  isActive:()=>!!session,
  room:()=>session?{roomCode:session.roomCode,host:!!session.host,name:session.name}:null,
  connection:()=>runtime.status,
  captureShared:()=>captureShared(readSave()),
  leave:leaveRoom,
  reconnect:()=>{reconnectAttempts=0;runtime.error='';connect()}
};
})();
