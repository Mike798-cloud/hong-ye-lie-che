export const PROTOCOL_VERSION=1;
export const MAX_PLAYERS=3;
export const SHARED_KEYS=new Set(['stage','evidence','deductions','inspection','interviews','portraitInspection','openDocs','timeSolved','photoSolved','photoEdgeFound','boxOpened','finalSubmitted','finalAnswers','ending','choices','logs','secret','started']);

const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
const arr=v=>Array.isArray(v)?v:[];
const obj=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
const uniq=(a,b)=>[...new Set([...arr(a),...arr(b)].map(String))];

function mergeSeenRecord(a,b){
  a=obj(a);b=obj(b);
  const out={...clone(a),...clone(b)};
  if(a.seen||b.seen)out.seen=uniq(a.seen,b.seen).map(x=>Number.isFinite(Number(x))?Number(x):x);
  if('registered'in a||'registered'in b)out.registered=!!a.registered||!!b.registered;
  if(a.note||b.note){const an=String(a.note||''),bn=String(b.note||'');out.note=bn.length>=an.length?bn:an}
  delete out.zoom;
  return out;
}
function mergeNestedMap(a,b,seenRecords=false){
  const out=clone(obj(a));
  for(const [k,v] of Object.entries(obj(b))){
    if(seenRecords)out[k]=mergeSeenRecord(out[k],v);
    else if(v&&typeof v==='object'&&!Array.isArray(v))out[k]={...obj(out[k]),...clone(v)};
    else out[k]=clone(v);
  }
  return out;
}
function mergeLogs(a,b){
  const all=[...arr(b),...arr(a)].filter(x=>x&&typeof x==='object');
  const seen=new Set(),out=[];
  for(const x of all){const key=`${x.t||''}|${x.text||''}`;if(seen.has(key))continue;seen.add(key);out.push({t:String(x.t||'').slice(0,8),text:String(x.text||'').slice(0,260)})}
  return out.slice(0,30);
}

export function sanitizeShared(input={}){
  input=obj(input);const out={};
  for(const key of SHARED_KEYS)if(key in input)out[key]=clone(input[key]);
  out.started=true;
  out.stage=Math.max(1,Math.min(8,Number(out.stage)||1));
  out.evidence=uniq([],out.evidence).slice(0,160);
  out.deductions=uniq([],out.deductions).slice(0,40);
  out.inspection=mergeNestedMap({},out.inspection,true);
  out.interviews=mergeNestedMap({},out.interviews,false);
  out.portraitInspection=mergeNestedMap({},out.portraitInspection,true);
  out.openDocs=uniq([],out.openDocs).slice(0,100);
  ['timeSolved','photoSolved','photoEdgeFound','boxOpened','finalSubmitted','secret'].forEach(k=>out[k]=!!out[k]);
  out.finalAnswers=obj(out.finalAnswers);out.choices=obj(out.choices);out.logs=mergeLogs([],out.logs);
  out.ending=out.ending==null?null:String(out.ending).slice(0,32);
  return out;
}

export function stripHostOnly(input,host){
  const out=sanitizeShared(input);
  if(!host){delete out.finalSubmitted;delete out.finalAnswers;delete out.choices;delete out.ending}
  return out;
}

export function mergeShared(current={},incoming={}){
  const a=sanitizeShared(current),b=sanitizeShared(incoming),out={...a};
  out.started=true;
  out.stage=Math.max(a.stage,b.stage);
  out.evidence=uniq(a.evidence,b.evidence);
  out.deductions=uniq(a.deductions,b.deductions);
  out.inspection=mergeNestedMap(a.inspection,b.inspection,true);
  out.interviews=mergeNestedMap(a.interviews,b.interviews,false);
  out.portraitInspection=mergeNestedMap(a.portraitInspection,b.portraitInspection,true);
  out.openDocs=uniq(a.openDocs,b.openDocs);
  ['timeSolved','photoSolved','photoEdgeFound','boxOpened','finalSubmitted','secret'].forEach(k=>out[k]=!!a[k]||!!b[k]);
  out.finalAnswers={...obj(a.finalAnswers),...obj(b.finalAnswers)};
  out.choices={...obj(a.choices),...obj(b.choices)};
  out.ending=b.ending||a.ending||null;
  out.logs=mergeLogs(a.logs,b.logs);
  return sanitizeShared(out);
}

export function diffEvents(before={},after={},by='调查员'){
  const a=sanitizeShared(before),b=sanitizeShared(after),events=[];
  const ae=new Set(a.evidence),ad=new Set(a.deductions);
  for(const id of b.evidence)if(!ae.has(id))events.push({kind:'evidence',id,by});
  for(const id of b.deductions)if(!ad.has(id))events.push({kind:'deduction',id,by});
  if(b.stage>a.stage)events.push({kind:'stage',stage:b.stage,by});
  if(!a.finalSubmitted&&b.finalSubmitted)events.push({kind:'system',by,text:'共同结案事实链已由房主核验。'});
  if(!a.ending&&b.ending)events.push({kind:'system',by,text:'调查组已经封存最终卷宗。'});
  return events.slice(0,12);
}
