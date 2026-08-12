(()=>{
'use strict';
const GAME_URL='assets/js/game.js?v=6.0.0';
const READY_EVENT='k417:game-ready';
const app=()=>document.getElementById('app');

function showLoadError(err){
  console.error('[K417 game-loader]',err);
  const host=app();
  if(!host)return;
  host.innerHTML=`<div class="splash cover-screen"><section class="splash-card cover-card" style="max-width:720px"><div class="kicker">K417 / RECOVERY</div><h1>调查程序加载失败</h1><p class="sub">游戏核心脚本没有完成加载。你的本地案件存档没有被删除。</p><div class="cover-note"><b>可尝试</b><span>检查网络后重新加载页面；如果浏览器缓存了旧文件，可进行一次强制刷新。</span><span class="tiny">${escapeHtml(err?.message||String(err||'未知错误'))}</span></div><div class="actions cover-actions"><button class="btn primary" type="button" data-game-retry>重新加载</button></div></section></div>`;
  host.querySelector('[data-game-retry]')?.addEventListener('click',()=>location.reload());
}
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}

function bridgePatch(){
  return String.raw`
/* K417 multiplayer live-sync bridge: injected by game-loader.js */
function __k417CaptureDraft(){
  const root=document.getElementById('app');
  if(!root)return null;
  const nodes=Array.from(root.querySelectorAll('input,textarea,select'));
  const items=nodes.map((el,index)=>({
    index,
    tag:el.tagName,
    type:el.type||'',
    name:el.name||'',
    id:el.id||'',
    value:el.value,
    checked:!!el.checked,
    selectedIndex:typeof el.selectedIndex==='number'?el.selectedIndex:-1
  }));
  const active=document.activeElement;
  const activeIndex=nodes.indexOf(active);
  let selection=null;
  if(activeIndex>=0&&active&&typeof active.selectionStart==='number')selection=[active.selectionStart,active.selectionEnd];
  return {items,activeIndex,selection,scrollX:window.scrollX,scrollY:window.scrollY};
}
function __k417RestoreDraft(snap){
  if(!snap)return;
  const root=document.getElementById('app');
  if(!root)return;
  const nodes=Array.from(root.querySelectorAll('input,textarea,select'));
  const compatible=(el,item)=>el&&item&&el.tagName===item.tag&&String(el.type||'')===String(item.type||'')&&String(el.name||'')===String(item.name||'')&&String(el.id||'')===String(item.id||'');
  snap.items.forEach(item=>{
    let el=nodes[item.index];
    if(!compatible(el,item))el=nodes.find(n=>compatible(n,item));
    if(!el)return;
    if(el.tagName==='SELECT'&&item.selectedIndex>=0)el.selectedIndex=Math.min(item.selectedIndex,Math.max(0,el.options.length-1));
    else if(el.type==='checkbox'||el.type==='radio')el.checked=!!item.checked;
    else el.value=item.value;
  });
  const active=snap.activeIndex>=0?nodes[snap.activeIndex]:null;
  if(active){
    try{active.focus({preventScroll:true})}catch(_){try{active.focus()}catch(__){}}
    if(snap.selection&&typeof active.setSelectionRange==='function')try{active.setSelectionRange(snap.selection[0],snap.selection[1])}catch(_){}
  }
  requestAnimationFrame(()=>window.scrollTo(snap.scrollX||0,snap.scrollY||0));
}
window.K417GameBridge={
  version:'7.2.0',
  applyExternalSave(){
    const draft=__k417CaptureDraft();
    const keepCover=bootCover;
    state=load();
    bootCover=keepCover;
    render();
    requestAnimationFrame(()=>__k417RestoreDraft(draft));
    return clone(state);
  },
  ensureRendered(){render();return clone(state)},
  runTest(kind){
    const result=kind==='flow'?flowTest():selfTest();
    document.body.innerHTML='<pre id="test-report" class="test-report">'+esc(JSON.stringify(result,null,2))+'</pre>';
    document.title=result.ok?'PASS':'FAIL';
    return result;
  },
  debugState(){return clone(state)}
};
`;
}

async function loadGame(){
  const response=await fetch(GAME_URL,{cache:'no-store'});
  if(!response.ok)throw new Error(`game.js 返回 ${response.status}`);
  let source=await response.text();
  const marker='const params=new URLSearchParams(location.search);';
  const pos=source.lastIndexOf(marker);
  if(pos<0)throw new Error('无法定位 game.js 启动段，版本可能已改变');
  source=source.slice(0,pos)+bridgePatch()+source.slice(pos);
  const blob=new Blob([source+'\n//# sourceURL=assets/js/game.live.js'],{type:'text/javascript'});
  const url=URL.createObjectURL(blob);
  await new Promise((resolve,reject)=>{
    const s=document.createElement('script');
    s.src=url;
    s.onload=()=>{URL.revokeObjectURL(url);resolve()};
    s.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('修复后的 game.js 执行失败'))};
    document.head.appendChild(s);
  });
  window.dispatchEvent(new CustomEvent(READY_EVENT));
  if(document.readyState!=='loading'){
    const params=new URLSearchParams(location.search);
    const test=params.get('test');
    if(test==='1'||test==='flow')window.K417GameBridge?.runTest(test==='flow'?'flow':'self');
    else window.K417GameBridge?.ensureRendered();
  }
}
loadGame().catch(showLoadError);
})();
