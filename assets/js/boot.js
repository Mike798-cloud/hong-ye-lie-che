(()=>{
  'use strict';
  const SAVE_KEY='k417_rebuild_v3';
  const SESSION_KEY='k417_multiplayer_session_v1';
  const BACKUP_KEY='k417_multiplayer_single_backup_v1';
  const EMPTY_BACKUP='__K417_EMPTY_SAVE__';
  const app=document.getElementById('app');
  const reduceMotion=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const lowPower=(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=4)||(navigator.deviceMemory&&navigator.deviceMemory<=4)||reduceMotion;
  if(lowPower)document.documentElement.classList.add('k417-low-power');

  function bootMarkup(message,recovery=false){
    return `<div class="k417-boot-screen"><div class="k417-boot-card"><div class="k417-boot-title">北纬七码 · 终夜列车</div><div class="k417-boot-copy">${message}</div>${recovery?'<div class="k417-boot-actions"><button type="button" data-k417-reload>重新加载</button><button type="button" data-k417-clear-mp>清除异常联机会话并重试</button></div>':''}</div></div>`;
  }
  if(app&&!app.childNodes.length)app.innerHTML=bootMarkup('正在载入案件资料……');

  let fatal='';
  function showRecovery(message){
    fatal=message||'部分游戏资源没有正常载入。';
    if(!app)return;
    const live=app.querySelector('.splash,.shell,.cover-screen,.game-shell,[data-route]');
    if(live)return;
    app.innerHTML=bootMarkup(`${fatal}<br>你的案件存档不会因为重新加载而被清除。`,true);
  }

  window.addEventListener('error',event=>{
    const t=event.target;
    if(!t||!t.tagName)return;
    if(t.tagName==='SCRIPT')showRecovery('关键脚本载入失败，可能是网络或浏览器缓存异常。');
    else if(t.tagName==='LINK'&&String(t.rel).includes('stylesheet'))showRecovery('页面样式载入失败，可能是网络或浏览器缓存异常。');
  },true);

  window.addEventListener('unhandledrejection',()=>{
    setTimeout(()=>{
      if(app&&!app.querySelector('.splash,.shell,.cover-screen,.game-shell,[data-route]'))showRecovery('游戏初始化没有完成。');
    },0);
  });

  document.addEventListener('click',event=>{
    const reload=event.target.closest?.('[data-k417-reload]');
    if(reload){
      const url=new URL(location.href);url.searchParams.set('_reload',Date.now().toString());location.replace(url.toString());return;
    }
    const clear=event.target.closest?.('[data-k417-clear-mp]');
    if(clear){
      try{
        const backup=localStorage.getItem(BACKUP_KEY);
        if(backup===EMPTY_BACKUP)localStorage.removeItem(SAVE_KEY);
        else if(backup) localStorage.setItem(SAVE_KEY,backup);
        localStorage.removeItem(BACKUP_KEY);
        localStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(SESSION_KEY);
      }catch(_){ }
      const url=new URL(location.href);url.searchParams.set('_recover',Date.now().toString());location.replace(url.toString());
    }
  });

  window.addEventListener('DOMContentLoaded',()=>{
    setTimeout(()=>{
      if(!app)return;
      const stillBoot=!!app.querySelector('.k417-boot-screen');
      const empty=!app.textContent.trim();
      if(stillBoot||empty)showRecovery(fatal||'游戏启动时间异常，可能是缓存、网络或联机会话导致初始化失败。');
    },4500);
  },{once:true});
})();
