(()=>{
'use strict';
const DATA=window.K417_DATA;if(!DATA)return;
const norm=s=>String(s||'').toLowerCase().replace(/[\s·，。、“”‘’：:；;（）()\/\\_-]/g,'');
const strictAnswer=(input,answers)=>{const n=norm(input);return !!n&&(answers||[]).some(a=>{const x=norm(a);return n===x||n.includes(x)})};
function guardFinalSubmit(e){
  const form=e.target?.closest?.('form[data-final]');if(!form)return;
  const bad=[];(DATA.FINAL_FIELDS||[]).forEach(f=>{const el=form.elements?.[f.id];if(!strictAnswer(el?.value,f.answers))bad.push({f,el})});
  if(!bad.length)return;
  e.preventDefault();e.stopImmediatePropagation();
  const first=bad[0];if(first.el){first.el.setCustomValidity(`请填写完整的“${first.f.label}”事实，不接受单字或残缺答案。`);first.el.reportValidity();const clear=()=>{first.el.setCustomValidity('');first.el.removeEventListener('input',clear)};first.el.addEventListener('input',clear)}
}
document.addEventListener('submit',guardFinalSubmit,true);

function fixHintCopy(){
  document.querySelectorAll('.hint-level p').forEach(el=>{const old='S03茶杯残留、S08药盒';if(el.textContent.includes(old))el.textContent=el.textContent.replace(old,'S03胺碘酮处方药盒、S08阿奇霉素说明书碎片')});
}
let hintFixQueued=false;
function scheduleHintFix(){if(hintFixQueued)return;hintFixQueued=true;requestAnimationFrame(()=>{hintFixQueued=false;fixHintCopy()})}
function installHintObserver(){
  const app=document.getElementById('app');if(!app)return;
  new MutationObserver(scheduleHintFix).observe(app,{childList:true});
  fixHintCopy();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installHintObserver,{once:true});else installHintObserver();

function confrontationPaths(c){if(!c)return[];const raw=c[1];if(!Array.isArray(raw))return [[raw]];if(raw.length&&Array.isArray(raw[0]))return raw;return raw.map(x=>[x])}
function deductionMatch(d,set){if(d.logic?.length)return d.logic.every(cl=>cl.any.filter(id=>set.has(id)).length>=(cl.min||1));const paths=d.variants?.length?d.variants:[d.need||[]];return paths.some(path=>path.every(id=>set.has(id)))}
function dependencyTest(){
  const rewards=new Set();(DATA.PEOPLE||[]).forEach(p=>(p.c||[]).forEach(c=>rewards.add(c[2])));
  const have=new Set(Object.keys(DATA.EVIDENCE||{}).filter(id=>!rewards.has(id)));const reached=[];let changed=true,loops=0;
  while(changed&&loops++<100){changed=false;(DATA.DEDUCTION_RECIPES||[]).forEach(d=>{if(!have.has(d.id)&&deductionMatch(d,have)){have.add(d.id);changed=true}});(DATA.PEOPLE||[]).forEach(p=>(p.c||[]).forEach(c=>{if(have.has(c[2]))return;if(confrontationPaths(c).some(path=>path.every(id=>have.has(id)))){have.add(c[2]);reached.push(`${p.name}:${c[0]}→${c[2]}`);changed=true}}))}
  const blocked=[];(DATA.PEOPLE||[]).forEach(p=>(p.c||[]).forEach(c=>{if(!have.has(c[2]))blocked.push({person:p.name,qid:c[0],reward:c[2],paths:confrontationPaths(c)})}));
  return {ok:blocked.length===0,blocked,reached:reached.length,rewardCount:rewards.size};
}
function sourceTest(){
  const source=new Set(['S10','R01','R02','R03','R10','R04','R05','F01','F02','F04','F05','R06','R09','R07','F06','O12','B02','O11','B03']);
  (DATA.INSPECTIONS||[]).forEach(i=>source.add(i.evidence));(DATA.SEARCH_DOCS||[]).forEach(d=>d.evidence&&source.add(d.evidence));(DATA.PEOPLE||[]).forEach(p=>{p.visualEvidence&&source.add(p.visualEvidence);(p.c||[]).forEach(c=>source.add(c[2]))});
  const missing=Object.keys(DATA.EVIDENCE||{}).filter(id=>!source.has(id));return {ok:missing.length===0,missing,covered:source.size,total:Object.keys(DATA.EVIDENCE||{}).length};
}
function dataTest(){const dependency=dependencyTest(),sources=sourceTest();return {ok:dependency.ok&&sources.ok,dependency,sources}}
const result=dataTest();window.__K417_DEPENDENCY_TEST__=dependencyTest;window.__K417_SOURCE_TEST__=sourceTest;window.__K417_DATA_TEST__=dataTest;window.__K417_STRICT_ANSWER__=strictAnswer;if(!result.ok)console.error('[K417] 数据回归失败',result);
})();
