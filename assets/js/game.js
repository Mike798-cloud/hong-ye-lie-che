(() => {
'use strict';

const VERSION='1.0.0';
const SAVE_KEY='beiwai7_night_train_v1';
const $=(s,r=document)=>r.querySelector(s);
const esc=(s='')=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

const PEOPLE=[
 {id:'lin',name:'林婉',age:39,role:'中学教师',seat:'6车 03包厢',summary:'克制、谨慎。1994年事故受害儿童林越的姐姐。',topics:[
  ['行程','“我只是去江港参加教研会。周柏年？我知道这个名字，但很多年没见过他。”',1,'E17'],
  ['1994','“如果你已经查到安济诊所，就不用装作偶然了。那年我弟弟十岁。”',3,'E21'],
  ['7号包厢','“我没进去。我在餐车待到一点二十以后。”',2,'E18'] ]},
 {id:'chen',name:'陈川',age:45,role:'外科医生',seat:'6车 05包厢',summary:'1994年曾在安济诊所实习，现为三甲医院外科医生。',topics:[
  ['周柏年','“认识。医学圈里谁没听过他？但我和他没有私人往来。”',1,'E19'],
  ['实习经历','“我当年只是实习生。病历、用药都不是我决定的。”',3,'E22'],
  ['药物','“他长期服用胺碘酮。若再叠加某些大环内酯类药物，会很危险。”',5,'E31'] ]},
 {id:'gu',name:'顾言',age:34,role:'调查记者',seat:'5车 11号',summary:'擅长调查医疗与地方财政，随身携带相机和录音笔。',topics:[
  ['偷拍','“我承认拍了走廊。因为有人在撒谎，而且不止一个。”',2,'E23'],
  ['父亲','“我父亲顾明远也是记者。你要是找到1994年的旧报纸，就会知道我为什么来。”',3,'E24'],
  ['录音','“我进过7号包厢。不是为了杀人，是拿回一盘本来就属于受害者的录音。”',6,'E38'] ]},
 {id:'jiang',name:'蒋文静',age:43,role:'保险公司职员',seat:'4车 17号',summary:'身份记录干净，与医疗集团表面无直接关系。',topics:[
  ['身份','“蒋文静是我现在的名字。以前的名字……没有必要谈。”',2,'E25'],
  ['改名','“我原来姓韩。1994年之后，我不想再有人叫我‘那个死了孩子的女人’。”',7,'E47'],
  ['周柏年','“我想过杀他。想过，不等于做过。”',6,'E39'] ]},
 {id:'xu',name:'徐洛',age:29,role:'自由摄影师',seat:'5车 03号',summary:'为杂志拍摄冬季铁路专题，保存大量照片原片。',topics:[
  ['照片','“相机时间是准的，我每月第一天会和电台报时校一次。”',2,'E26'],
  ['走廊','“有张照片反光里拍到一个人。我当时没注意。”',4,'E33'],
  ['旧照片','“那十二张旧照片不是同一台相机拍的，其中一张边缘明显被裁过。”',7,'E48'] ]},
 {id:'wu',name:'吴德诚',age:58,role:'退休列车员',seat:'3车 08号',summary:'熟悉老式25K/25G车体结构，声称只是探亲。',topics:[
  ['门锁','“这种包厢锁能从外面用乘务钥匙复位，但会留下锁舌磨痕。”',1,'E08'],
  ['监控','“电源切换会让老录像机重启，十几分钟黑屏并不稀奇。”',4,'E32'],
  ['1994','“那年我就在临川客运段。运过一批医疗设备，货主是安济。”',7,'E49'] ]},
 {id:'tang',name:'唐宁',age:32,role:'药品销售代表',seat:'4车 09号',summary:'随身携带多个处方药样品，与死者集团有业务往来。',topics:[
  ['药箱','“都是正规样品，有登记。缺的那盒阿奇霉素三天前就给客户了。”',2,'E27'],
  ['业务','“周柏年准备让我的公司背一个旧项目的锅，我来就是阻止他。”',6,'E40'],
  ['咖啡','“我没碰过他的咖啡。餐车的人可以证明。”',5,'E34'] ]},
 {id:'fang',name:'方琴',age:61,role:'退休护士',seat:'6车 09包厢',summary:'曾在安济诊所任护士。记忆时有断裂，但对药名异常敏感。',topics:[
  ['旧诊所','“不是设备坏，是剂量错了……不，对不起，我记不清。”',3,'E28'],
  ['急救','“胸闷、心悸、出冷汗。如果及时处理，本来有机会救回来。”',5,'E35'],
  ['当晚','“我看见他倒在床边。他还在喘。我……我没有按铃。”',8,'E53'] ]},
 {id:'shen',name:'沈途',age:26,role:'计算机工程师',seat:'5车 15号',summary:'负责给铁路外包公司维护存储设备，因此被怀疑删除监控。',topics:[
  ['监控','“不是黑客。录像文件最后写入时间和系统启动日志对得上。”',4,'E29'],
  ['17分钟','“系统掉电后自动校时失败，重新启动后时钟快了六分钟。”',4,'E36'],
  ['进入包厢','“我进去是为了找周柏年的U盘。里面有我父亲替他们写过的程序验收记录。”',6,'E41'] ]},
 {id:'luo',name:'罗峰',age:40,role:'餐车厨师',seat:'餐车值班间',summary:'当夜负责餐车夜班，1点前后曾给死者送咖啡。',topics:[
  ['咖啡','“1:12下单，1:16端出去。黑咖啡，另外给了两包糖。”',1,'E09'],
  ['送餐','“我把托盘放到门口，是一个女人接进去的。我只看见她的手。”',5,'E37'],
  ['杯子','“死者的杯子不是餐车的制式杯，应该是他自己带的保温杯。”',5,'E42'] ]},
 {id:'han',name:'韩雪琴',age:48,role:'家庭主妇',seat:'3车 12号',summary:'存在感最低，称独自前往江港照顾女儿。',topics:[
  ['行程','“我不会用电脑，也不认识那些记者、医生。我只是坐错了一列很倒霉的车。”',2,'E20'],
  ['旧照片','“照片里那个抱孩子的女人是我姐姐。她后来改名叫蒋文静。”',7,'E50'],
  ['咖啡','“我只想让他难受几个小时，让列车停车，让大家有机会拿到资料。我不知道会死人。”',8,'E54'] ]},
 {id:'qiao',name:'乔至衡',age:50,role:'医疗集团法务顾问',seat:'4车 05号',summary:'周柏年的长期法务。唯一主动承认与死者同行的人。',topics:[
  ['协议','“董事长要在江港召开说明会。内容属于公司机密。”',3,'E30'],
  ['刺伤','“我看到他趴着，以为他还活着。我带了刀……那一刻我失控了。”',6,'E43'],
  ['说明会','“那不是认罪。他要把责任推给已经死掉的两个人，然后让股价反弹。”',8,'E55'] ]}
];

const EVIDENCE={
 E01:['停在1:31的腕表','现场','死者左腕机械表表镜破裂，秒针卡死在1:31。表壳右侧有新鲜撞痕。'],
 E02:['半杯温水','现场','杯壁仍有余温。水面漂有极少量白色颗粒，不能仅凭肉眼判断成分。'],
 E03:['处方药盒','现场','胺碘酮片，死者本人处方。药盒显示当天已服用一次。'],
 E04:['十二张旧照片','现场','桌上整齐摆放十二张1994年前后的旧照片，其中一张边缘有重新裁切痕迹。'],
 E05:['包厢门锁','现场','门从内侧锁住，但锁舌表面有沿开启方向的细长新磨痕。'],
 E06:['垃圾袋里的糖包','现场','两包糖均未拆封；另有一张被揉皱的药品说明书碎片。'],
 E07:['床脚血迹','现场','后脑位置附近血迹很少，与看上去严重的胸部创口不相称。'],
 E08:['门锁结构说明','证词','吴德诚说明乘务钥匙可以从外部复位包厢锁，且会留下锁舌磨痕。'],
 E09:['餐车送餐时间','记录','罗峰确认1:12下单、1:16送出黑咖啡；餐车收银机为独立时钟。'],
 E10:['未发送短信','数字','死者手机草稿："明早九点，按协议发布。一个都别想躲。" 保存时间1:18。'],
 E11:['车厢广播记录','列车','1:24发生第一次制动提示；1:47因暴雪正式停车。'],
 E12:['相机原片IMG_1228','照片','徐洛的照片拍到7号包厢门外玻璃反光，时间戳1:23:41。'],
 E13:['乘务巡检表','列车','1:26巡检员经过6车时记录“7号包厢安静，门锁闭”。'],
 E14:['药品碎片','现场','垃圾袋碎片上可辨“阿奇…素”字样，包装并非完整药盒。'],
 E15:['密码箱','现场','床下发现四位数字密码箱，贴纸写着“别相信纪念日”。'],
 E16:['旧磁带标签','现场','空磁带盒，标签手写“安济 / 11.18 / 原始访谈”。'],
 E17:['林婉车票','证词','终点确为江港，与其教研会说法表面一致。'],
 E18:['林婉餐车小票','证词','餐车独立时钟显示1:19结账。'],
 E19:['陈川名片','人物','陈川现为临川市第一医院外科副主任医师。'],
 E20:['韩雪琴身份证复印件','人物','户籍变更记录显示其旧籍贯与1994年安济诊所所在街道一致。'],
 E21:['林越病历编号','旧案','林婉弟弟林越，1994年接受“神经代谢干预”后死亡。'],
 E22:['实习签字页','旧案','原始病历复印件上出现陈川实习签字，证明他并非“完全不知情”。'],
 E23:['顾言走廊照片','照片','顾言相机里有多张1点后走廊偷拍照片。'],
 E24:['顾明远旧报道','旧案','1994年顾言父亲曾发表“设备故障已排除人为责任”的报道。'],
 E25:['蒋文静旧姓线索','人物','保险内部旧档显示蒋文静曾使用姓氏“韩”。'],
 E26:['相机校时习惯','证词','徐洛确认相机每月与电台报时校准，可作为独立时间源。'],
 E27:['唐宁药品登记单','人物','阿奇霉素样品确实在三日前登记交付，无法证明当夜由她提供。'],
 E28:['护士排班表','旧案','方琴1994年11月18日在安济诊所夜班。'],
 E29:['录像机启动日志','数字','录像机发生掉电重启，不存在远程删除记录。'],
 E30:['说明会日程','数字','死者次日上午9:00安排“历史项目说明会”。'],
 E31:['药物相互作用说明','法医','胺碘酮与部分大环内酯类药物叠加可能显著增加严重心律失常风险。'],
 E32:['列车电源切换说明','列车','进入山区供电切换时，旧录像设备可能断电重启。'],
 E33:['玻璃反光人影','照片','校正照片后可辨林婉在监控所谓1:29时段出现在6车连接处。'],
 E34:['唐宁不在场记录','人物','餐车值班员与刷卡单共同证明1:08—1:21唐宁一直在餐车。'],
 E35:['可救治窗口','法医','出现早期心律失常症状后若立即呼救，存在明确救治机会。'],
 E36:['监控快6分钟','数字','重启日志与徐洛相机对照：监控系统恢复后整体快6分钟。'],
 E37:['送餐接杯者','证词','罗峰确认咖啡由一名女性从门内接走，而非周柏年本人。'],
 E38:['失踪录音去向','证词','顾言承认从包厢取走1994年原始采访磁带。'],
 E39:['蒋文静杀意','证词','蒋文静承认曾准备报复，但当晚只取走照片。'],
 E40:['唐宁的真实动机','证词','唐宁担心公司被当作说明会替罪羊，试图阻止发布。'],
 E41:['沈途进入现场','证词','沈途承认进入包厢寻找父亲留下的技术验收U盘。'],
 E42:['私人保温杯','证词','咖啡后来被倒入死者自带保温杯，使接触杯子的人员范围扩大。'],
 E43:['死后刺伤承认','证词','乔至衡承认用刀刺入死者胸口；他当时误以为周柏年仍活着。'],
 E44:['法医初步报告','法医','胸部刺伤周围组织反应极弱、出血量异常少，刺伤发生时循环已接近停止。'],
 E45:['毒理筛查','法医','检出治疗剂量胺碘酮及阿奇霉素代谢物；单独剂量均不足以解释死亡。'],
 E46:['完整时间校正表','推理','将监控统一减6分钟后，各独立时间源首次可以互相吻合。'],
 E47:['蒋文静改名档案','旧案','蒋文静原名韩文静，是1994年死亡儿童韩一鸣的母亲。'],
 E48:['旧照片裁切痕迹','照片','十二张照片中一张左侧边缘残留半截袖口，原图至少还有第十三人。'],
 E49:['医疗设备货运单','旧案','吴德诚保存的老货运复印件证明事故前一周有未经登记设备运入安济。'],
 E50:['韩氏姐妹关系','旧案','韩雪琴与韩文静（现蒋文静）为姐妹。'],
 E51:['1994原始事故清单','旧案','受试儿童共7人，并非当年公开的4人；其中1人死亡、3人留下长期后遗症。'],
 E52:['密码箱协议','旧案','周柏年计划承认“管理疏忽”，同时把核心责任归于两名已故员工，以保全集团。'],
 E53:['方琴未施救','证词','方琴承认看见周柏年出现危险症状，却故意没有呼救。'],
 E54:['韩雪琴下药','证词','韩雪琴承认把阿奇霉素碾碎放入咖啡，只想让周柏年病倒迫停。'],
 E55:['虚假认罪计划','证词','乔至衡说明所谓说明会实为危机公关方案。'],
 E56:['现场行为重建','推理','至少五人先后进入包厢，各自取走、移动或添加物品，最终叠成“密室现场”。'],
 E57:['第十三人档案','隐藏','被裁掉的人是1994年项目真正的资金负责人“沈世勋”，此人从未登上K417。']
};

const ROUTES=[
 ['case','案件板','案'],['map','列车地图','图'],['people','人物档案','人'],['evidence','证物库','证'],['timeline','时间线','时'],
 ['sms','短信','信'],['intranet','列车内网','网'],['search','搜索','搜'],['media','媒体资料','媒'],['deduction','推理板','推'],['settings','设置','设'],['credits','资料来源','源']
];

const CHAPTERS=[
 {n:1,title:'凌晨 1:47',desc:'检查7号包厢，确定最初死亡时间假设。'},
 {n:2,title:'十二个人',desc:'询问乘客，识别谁在关键时间撒谎。'},
 {n:3,title:'被删除的旧案',desc:'从搜索、论坛、邮件中还原1994年的安济诊所事故。'},
 {n:4,title:'消失的十七分钟',desc:'校正列车监控时间，重建可靠时间轴。'},
 {n:5,title:'不是那一刀',desc:'从法医与药理证据重新判断死因。'},
 {n:6,title:'所有人都说谎',desc:'区分进入现场、破坏现场与真正致死行为。'},
 {n:7,title:'1994：照片之外',desc:'确认旧案身份并打开死者的密码箱。'},
 {n:8,title:'终夜',desc:'完成五项最终判断，并决定怎样提交真相。'}
];

const DEDUCTIONS={
 1:{q:'根据现场现有证据，哪种判断最稳妥？',opts:[
  ['A','手表1:31就是死亡时间'],['B','死亡时间应早于1:31，腕表可能因碰撞停走'],['C','死者一定在1:47停车后死亡']],correct:'B',need:['E01','E07','E09'],award:'E10'},
 2:{q:'多份证词彼此冲突，当前最合理的调查方向是？',opts:[
  ['A','只找一个进入过7号包厢的人'],['B','默认所有撒谎者共同谋杀'],['C','分别核验每个人撒谎的具体原因与时间']],correct:'C',need:['E18','E23','E27'],award:'E12'},
 3:{q:'1994年的安济诊所与本案关系更可能是什么？',opts:[
  ['A','只是背景彩蛋'],['B','多名乘客与旧案有直接关系，列车聚集并非偶然'],['C','只有林婉与旧案有关']],correct:'B',need:['E21','E24','E28'],award:'E51'},
 4:{q:'如何解释监控“17分钟空白”和人物时间矛盾？',opts:[
  ['A','沈途黑入系统删掉录像'],['B','设备掉电重启，恢复后系统时钟整体快6分钟'],['C','所有人的表都慢6分钟']],correct:'B',need:['E29','E32','E36'],award:'E46'},
 5:{q:'胸口锐器伤与死因的关系是？',opts:[
  ['A','锐器伤是唯一死因'],['B','刺伤发生在循环接近停止之后，不能解释主要死亡过程'],['C','死者没有被刺伤']],correct:'B',need:['E44','E45','E31'],award:'E35'},
 6:{q:'“密室”最可能是怎样形成的？',opts:[
  ['A','一个凶手从头到尾精心布置'],['B','多个人先后进入、取走或移动不同物品，现场被层层叠加'],['C','列车员统一伪造']],correct:'B',need:['E38','E41','E43'],award:'E56'},
 7:{q:'密码箱贴着“别相信纪念日”。结合现有资料，四位密码应取哪组？',opts:[
  ['A','1118（事故日）'],['B','0701（7名受试儿童、1人死亡）'],['C','1994（旧案年份）']],correct:'B',need:['E48','E51','E15'],award:'E52'}
};

const FINAL_QS=[
 ['death','周柏年的直接死亡机制是什么？',[['stab','胸部刺伤失血'],['arrhythmia','药物相互作用诱发严重心律失常'],['cold','低温休克']], 'arrhythmia'],
 ['act','谁实施了让死者进入危险状态的行为？',[['han','韩雪琴'],['tang','唐宁'],['fang','方琴']], 'han'],
 ['rescue','谁明知存在救治机会却故意没有呼救？',[['lin','林婉'],['fang','方琴'],['gu','顾言']], 'fang'],
 ['stabber','胸部刺伤是谁造成的？',[['qiao','乔至衡'],['jiang','蒋文静'],['shen','沈途']], 'qiao'],
 ['locked','“密室”为什么会出现？',[['master','单人预谋的完美密室'],['layer','多人各自隐瞒行为叠加，最后再由外部钥匙复位门锁'],['accident','门锁自然故障']], 'layer']
];

const OBJECTIVES={
 1:[['inspect','检查7号包厢至少5处关键位置'],['interview','取得餐车送餐时间和门锁结构信息'],['deduce','完成第一阶段死亡时间判断']],
 2:[['people','至少询问6名乘客'],['contradict','获得3条可核验证词'],['deduce','完成“十二个人”阶段判断']],
 3:[['search94','搜索并找到安济诊所旧案'],['forum','阅读北城夜话旧帖'],['deduce','确认旧案与乘客群体的联系']],
 4:[['logs','取得录像机启动日志'],['clock','完成监控时间校正'],['deduce','完成17分钟推理']],
 5:[['forensic','取得法医初步报告和毒理筛查'],['drug','确认关键药物相互作用'],['deduce','推翻“胸部刺伤致死”假设']],
 6:[['lies','获得至少3份进入现场的真实理由'],['scene','重建密室形成过程'],['deduce','完成多人行为判断']],
 7:[['oldphoto','确认旧照片裁切痕迹'],['box','打开密码箱'],['deduce','查明说明会真实目的']],
 8:[['confess','取得韩雪琴、方琴、乔至衡的最终证词'],['final','完成五项最终推理'],['choice','选择提交真相的方式']]
};

function baseState(){return {started:false,route:'case',chapter:1,completed:[],evidence:[],docs:[],interviews:{},searchHistory:[],forumRead:false,mailRead:false,passengerRead:false,clockSolved:false,boxOpened:false,finalAnswers:{},finalSubmitted:false,ending:null,hints:0,audio:false,mobileOpen:false,secret:false,seenNew:[],startedAt:0};}
let state=loadState();
function loadState(){try{const x=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');return x?Object.assign(baseState(),x):baseState()}catch{return baseState()}}
function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(state))}catch{} }
function reset(){localStorage.removeItem(SAVE_KEY);state=baseState();render();}
function has(id){return state.evidence.includes(id)}
function addEvidence(id,msg=true){if(!EVIDENCE[id]||has(id))return false;state.evidence.push(id);state.seenNew.push(id);save();if(msg)toast('获得证物：'+EVIDENCE[id][0],'good');return true}
function interviewCount(){return Object.values(state.interviews).reduce((n,a)=>n+(a?.length||0),0)}
function personCount(){return Object.values(state.interviews).filter(a=>a?.length).length}
function chapter(){return CHAPTERS[state.chapter-1]}
function progress(){const max=57;return Math.min(100,Math.round(state.evidence.length/max*100))}
function toast(msg,type=''){let w=$('.toastwrap');if(!w){w=document.createElement('div');w.className='toastwrap';document.body.appendChild(w)}const t=document.createElement('div');t.className='toast '+type;t.textContent=msg;w.appendChild(t);setTimeout(()=>t.remove(),3300)}
function nav(route){state.route=route;state.mobileOpen=false;save();render();window.scrollTo(0,0)}
function startGame(){state.started=true;state.startedAt=state.startedAt||Date.now();save();render();}
function toggleAudio(){const a=$('#ambience');state.audio=!state.audio;save();if(state.audio){a.volume=.28;a.play().catch(()=>{state.audio=false;save();renderTopOnly();toast('浏览器阻止了音频播放。声音仅用于氛围，不影响任何谜题。','warn')})}else a.pause();renderTopOnly();}
function renderTopOnly(){const b=$('[data-audio]');if(b)b.textContent=state.audio?'环境音：开':'环境音：关'}

function shell(body,title){
 const navs=ROUTES.map(([id,label,ico])=>`<button data-nav="${id}" class="${state.route===id?'active':''}"><span class="ico">${ico}</span>${label}${id==='evidence'&&state.seenNew.length?`<span class="badge">${state.seenNew.length}</span>`:''}</button>`).join('');
 return `<div class="shell"><aside class="sidebar ${state.mobileOpen?'open':''}"><div class="brand"><strong>北纬七码</strong><small>K417 · 调查终端 / 2008</small></div><nav class="nav">${navs}</nav><div class="side-bottom"><div class="status-mini"><span>证物</span><b>${state.evidence.length}/57</b></div><div class="progress"><i style="width:${progress()}%"></i></div><button class="btn sm ghost" data-audio>${state.audio?'环境音：开':'环境音：关'}</button></div></aside><main class="main"><header class="topbar"><button class="btn sm mobile-menu" data-mobile>菜单</button><h2>${esc(title)}</h2><span class="chapter-pill">第${state.chapter}章 · ${esc(chapter().title)}</span><span class="meta">K417 / 暴雪封锁 / 外界通信不稳定</span></header><section class="content">${body}</section></main></div>`;
}

function render(){
 const app=$('#app');
 if(!state.started){app.innerHTML=renderSplash();bind();return}
 let out='';
 switch(state.route){
  case 'case':out=renderCase();break;case 'map':out=renderMap();break;case 'people':out=renderPeople();break;case 'evidence':out=renderEvidence();break;
  case 'timeline':out=renderTimeline();break;case 'sms':out=renderSMS();break;case 'intranet':out=renderIntranet();break;case 'search':out=renderSearch();break;
  case 'media':out=renderMedia();break;case 'deduction':out=renderDeduction();break;case 'settings':out=renderSettings();break;case 'credits':out=renderCredits();break;
  default:state.route='case';out=renderCase();
 }
 app.innerHTML=out; bind();
 if(state.audio){const a=$('#ambience');if(a&&a.paused){a.volume=.28;a.play().catch(()=>{})}}
}

function renderSplash(){const hasSave=state.started||state.evidence.length||state.startedAt;return `<section class="splash"><div class="splash-bg"></div><div class="snow"></div><div class="splash-card"><div class="kicker">A closed-night train mystery</div><h1>北纬七码·终夜列车</h1><span class="case-tag">网页悬疑侦探解谜 / 封闭空间 / 群像推理</span><p class="sub">2008年冬，K417夜行列车在山区暴雪中被迫停车。软卧7号包厢内，一名医疗集团董事死亡。门从内部锁住，监控消失十七分钟，桌上却整齐摆着十二张1994年的旧照片。</p><div class="splash-actions"><button class="btn primary" data-start>${hasSave?'继续调查':'开始调查'}</button>${hasSave?'<button class="btn ghost" data-reset>重新开始</button>':''}<button class="btn ghost" data-about>游玩说明</button></div><div class="splash-foot">关键谜题均提供非音频路径；建议使用桌面端 Chrome / Edge。游戏会自动保存在当前浏览器。</div></div></section>`}

function objDone(key){
 switch(key){
  case 'inspect':return ['E01','E02','E03','E04','E05','E06','E07'].filter(has).length>=5;
  case 'interview':return has('E08')&&has('E09'); case 'deduce':return state.completed.includes(state.chapter);
  case 'people':return personCount()>=6; case 'contradict':return ['E18','E23','E27'].filter(has).length>=3;
  case 'search94':return state.docs.includes('clinic94'); case 'forum':return state.forumRead; case 'logs':return has('E29'); case 'clock':return state.clockSolved;
  case 'forensic':return has('E44')&&has('E45');case 'drug':return has('E31');case 'lies':return ['E38','E41','E43'].filter(has).length>=3;
  case 'scene':return has('E56');case 'oldphoto':return has('E48');case 'box':return state.boxOpened;case 'confess':return ['E53','E54','E55'].every(has);
  case 'final':return !!state.finalSubmitted;case 'choice':return !!state.ending; default:return false;
 }
}

function renderCase(){const c=chapter();const objs=(OBJECTIVES[state.chapter]||[]).map(([k,t])=>`<div class="objective ${objDone(k)?'done':''}"><span class="dot">${objDone(k)?'✓':''}</span><div class="txt"><b>${t}</b><small>${objectiveHint(k)}</small></div></div>`).join('');return shell(`<div class="pagehead"><div><h1>案件板</h1><p>不要寻找“唯一可疑的人”。先确认每一条信息到底可靠到什么程度。</p></div></div><div class="hero-panel"><div class="hero-copy"><div class="kicker">CASE K417-071</div><h2>${esc(c.title)}</h2><p>${esc(c.desc)}</p><button class="btn primary" data-nav="${state.chapter===1?'map':state.chapter<=2?'people':state.chapter===3?'search':state.chapter===4?'timeline':state.chapter===5?'media':state.chapter===6?'people':state.chapter===7?'media':'deduction'}">前往当前调查</button></div></div><h2 class="section-title">当前目标</h2><div class="grid cols2"><div class="card">${objs}<div class="sep"></div><button class="btn sm" data-hint>需要提示</button></div><div class="card"><h3>调查进度</h3><div class="statrow"><div class="stat"><strong>${state.evidence.length}</strong><span>已登记证物</span></div><div class="stat"><strong>${personCount()}</strong><span>已询问人物</span></div><div class="stat"><strong>${state.searchHistory.length}</strong><span>搜索记录</span></div><div class="stat"><strong>${state.hints}</strong><span>使用提示</span></div></div><div class="sep"></div><p class="tiny">提示不会锁死结局，但会影响结案评价。最终推理页只使用你真正找到过的材料，不会自动补齐。</p></div></div>`, '案件板')}
function objectiveHint(k){const m={inspect:'现场不会出现强发光轮廓；把鼠标移到可疑区域会有轻微边框变化。',interview:'餐车和退休列车员掌握不同类型的时间/结构信息。',people:'不同人物的谎言可能出于不同目的。',contradict:'优先找能被票据、照片、登记表核验的说法。',search94:'“1994”“安济”“医疗事故”都可以作为搜索入口。',forum:'北城夜话的旧帖里有公开报道没有写出的细节。',logs:'技术故障不等于有人入侵。',clock:'相机与餐车收银机是两个独立时间源。',forensic:'法医材料会在第5章自动开放。',drug:'陈川对药物相互作用的描述值得核验。',lies:'重点不是“谁进去过”，而是“进去后做了什么”。',scene:'取得三份进入现场的真实理由后再推理。',oldphoto:'徐洛能从照片冲印和裁切痕迹提供专业判断。',box:'密码不等于纪念日；死者已经在贴纸上提醒了这一点。',confess:'第8章会开放三名关键人物的新话题。',final:'五个问题分别对应死因、危险行为、不施救、刺伤和密室。',choice:'没有“官方唯一正确”的道德结局。'};return m[k]||'继续调查。'}

function renderMap(){
 const cars=[['1','行李/机务'],['2','硬座'],['3','硬卧'],['4','硬卧'],['5','软座'],['6','软卧'],['7','软卧·案发'],['8','餐车'],['9','乘务'],['10','行李']];
 const map=cars.map(([n,t])=>`<div class="car ${n==='7'?'available target':''}" ${n==='7'?'data-scene':''}><strong>${n}车</strong><span>${t}</span>${n==='7'?'<span>7号包厢 · 封锁中</span>':''}</div>`).join('');
 const found=['E01','E02','E03','E04','E05','E06','E07'].filter(has).length;
 return shell(`<div class="pagehead"><div><h1>列车地图</h1><p>K417在山区临时停车。除案发车厢外，车门均由乘务组控制。</p></div><span class="chapter-pill">现场已检 ${found}/7</span></div><div class="trainmap">${map}</div><h2 class="section-title">6车 · 7号包厢</h2><div class="scene"><img src="assets/images/cabin_scene.jpg" alt="2008年前后软卧包厢实景风格场景"><button class="hotspot ${has('E01')?'found':''}" style="left:50%;top:42%;width:12%;height:16%" data-ev="E01"><span>腕表</span></button><button class="hotspot ${has('E02')?'found':''}" style="left:18%;top:55%;width:13%;height:16%" data-ev="E02"><span>水杯</span></button><button class="hotspot ${has('E03')?'found':''}" style="left:8%;top:59%;width:11%;height:13%" data-ev="E03"><span>药盒</span></button><button class="hotspot ${has('E04')?'found':''}" style="left:29%;top:53%;width:15%;height:14%" data-ev="E04"><span>旧照片</span></button><button class="hotspot ${has('E05')?'found':''}" style="left:84%;top:20%;width:13%;height:48%" data-ev="E05"><span>门锁</span></button><button class="hotspot ${has('E06')?'found':''}" style="left:29%;top:72%;width:16%;height:15%" data-ev="E06"><span>垃圾袋</span></button><button class="hotspot ${has('E07')?'found':''}" style="left:53%;top:72%;width:25%;height:15%" data-ev="E07"><span>床脚血迹</span></button></div><div class="scene-legend">提示：可调查区域只有轻微边框反馈。手机端可逐区域轻触。现场内容不依赖图片加载才能通关，证物库与提示系统都有文字兜底。</div><div class="grid cols2" style="margin-top:16px"><div class="card"><h3>现场补充</h3><button class="btn sm" data-ev="E14">检查药品说明书碎片</button> <button class="btn sm" data-ev="E15">检查床下密码箱</button> <button class="btn sm" data-ev="E16">检查空磁带盒</button></div><div class="card"><h3>车上记录</h3><button class="btn sm" data-ev="E11">查看广播/制动记录</button> <button class="btn sm" data-ev="E13">查看乘务巡检表</button></div></div>`, '列车地图')}

function renderPeople(){const cards=PEOPLE.map(p=>{const asked=state.interviews[p.id]||[];const tags=asked.length?`<span class="chip ok">已询问 ${asked.length}/${p.topics.length}</span>`:'<span class="chip">尚未询问</span>';return `<article class="card person"><div class="photo-stub" aria-label="证件照占位：采用档案式模糊证件照处理"></div><div><h3>${p.name} <span class="tiny">${p.age}岁</span></h3><div class="role">${p.role} · ${p.seat}</div><p>${p.summary}</p><div class="confidence">${tags}${p.id==='gu'&&has('E24')?'<span class="chip bad">家庭关系被隐瞒</span>':''}${p.id==='jiang'&&has('E47')?'<span class="chip bad">身份变更</span>':''}</div><div class="interview"><div class="topicbar">${p.topics.map((t,i)=>`<button data-interview="${p.id}:${i}" ${state.chapter<t[2]?'disabled title="后续章节开放"':''}>${t[0]}</button>`).join('')}</div>${asked.length?`<div class="quote">${asked.slice(-1).map(i=>p.topics[i][1]).join('<br>')}</div>`:''}</div></div></article>`}).join('');return shell(`<div class="pagehead"><div><h1>人物档案</h1><p>“说谎”只说明一个人有需要隐藏的事，不自动等于杀人。</p></div><span class="chapter-pill">已询问 ${personCount()}/12 人</span></div><div class="grid cols2">${cards}</div>`, '人物档案')}

function renderEvidence(){state.seenNew=[];save();const evs=state.evidence.length?state.evidence.map(id=>{const e=EVIDENCE[id];return `<article class="card evidence-card"><span class="ev-id">${id}</span><span class="ev-type">${e[1]}</span><h3>${e[0]}</h3><p>${e[2]}</p></article>`}).join(''):'<div class="card"><h3>尚无证物</h3><p>先前往列车地图检查7号包厢。</p></div>';return shell(`<div class="pagehead"><div><h1>证物库</h1><p>这里仅显示你亲自获得过的证物。最终推理不会凭空补齐缺失信息。</p></div><span class="chapter-pill">${state.evidence.length}/57</span></div><div class="grid cols3">${evs}</div>`, '证物库')}

function renderTimeline(){const can=state.chapter>=4;const corrected=state.clockSolved;const list=(corrected?[
 ['01:12','餐车收银','周柏年下单黑咖啡。'],['01:16','餐车门口','罗峰送出咖啡，一名女性从包厢内接走。'],['01:18','死者手机','周柏年保存未发送短信。'],['01:19','餐车','林婉结账。'],['01:23','徐洛相机','走廊照片拍到玻璃反光。'],['01:24','列车广播','第一次制动提示。'],['01:26','乘务巡检','7号包厢门锁闭。']]:[
 ['01:12','餐车收银','独立时钟记录。'],['01:23','徐洛相机','相机时间经电台校准。'],['01:29','监控画面','林婉出现在连接处（与小票冲突）。'],['01:32','监控画面','走廊出现沈途（与相机冲突）。']]).map(x=>`<div class="titem"><span class="time">${x[0]}</span><h4>${x[1]}</h4><p>${x[2]}</p></div>`).join('');return shell(`<div class="pagehead"><div><h1>时间线</h1><p>${can?'比较独立时钟，不要假设所有设备显示的是同一个“真实时间”。':'该模块将在第4章成为主调查工具。'}</p></div></div><div class="grid cols2"><div class="card"><h3>${corrected?'已校正时间线':'原始记录'}</h3><div class="timeline">${list}</div></div><div class="card"><h3>监控时钟校正</h3>${can?`<div class="clock-puzzle"><div class="clock"><span>徐洛相机</span><strong>01:23</strong></div><div class="clock"><span>同一画面监控</span><strong>01:29</strong></div></div><p>两台设备拍到同一走廊事件。监控应校正：</p><div class="topicbar"><button data-clock="-6">减 6 分钟</button><button data-clock="+6">加 6 分钟</button><button data-clock="0">无需校正</button></div>${corrected?'<div class="quote">校正成功：监控系统恢复后整体快6分钟。所有监控时间应减6分钟。</div>':''}`:'<p class="tiny">继续推进案件。</p>'}</div></div>`, '时间线')}

function renderSMS(){if(!has('E10')&&state.chapter>=1)addEvidence('E10',false);return shell(`<div class="pagehead"><div><h1>短信</h1><p>死者手机为老式功能机，未接入云端；以下内容来自本机存储。</p></div></div><div class="smsphone"><div class="smshead"><span>K417 / CHINA MOBILE</span><span>01:47</span></div><div class="sms"><b>草稿箱 · 未发送</b>明早九点，按协议发布。一个都别想躲。<br><span class="tiny">保存 01:18</span></div><div class="sms"><b>乔至衡 · 00:36</b>协议我又看了一遍。你最好别把所有责任都推给死人。</div><div class="sms"><b>未知号码 · 昨日 22:14</b>你把他们叫到同一列车上，到底想证明什么？</div><div class="sms"><b>罗峰 · 01:12</b>餐车：您的黑咖啡已下单。</div></div>`, '短信')}

function renderIntranet(){return shell(`<div class="pagehead"><div><h1>列车内网</h1><p>列车局域网缓存了部分论坛、邮件和乘车资料。页面按2000年代早期网页风格还原。</p></div></div><div class="grid cols3"><button class="card" data-intra="forum"><h3>北城夜话 BBS</h3><p>旧论坛镜像 · 2004—2008</p></button><button class="card" data-intra="mail"><h3>临川邮局 Mail</h3><p>死者电脑已缓存邮件</p></button><button class="card" data-intra="passenger"><h3>K417 旅客名单</h3><p>本次列车实名信息</p></button></div><div id="intra-detail" style="margin-top:20px">${state.forumRead?forumHtml(false):''}</div>`, '列车内网')}
function forumHtml(set=true){if(set){state.forumRead=true;save();addEvidence('E24',false)}return `<div class="oldweb"><div class="oldweb-head">北城夜话论坛 &gt; 临川往事 &gt; 老城旧闻</div><div class="oldweb-nav">首页 | 论坛 | 搜索 | 收藏夹 | 控制面板　当前存档日期：2006-09-14</div><div class="oldweb-body"><h3>【求证】还有人记得94年安济诊所那批孩子吗？</h3><div class="post"><span class="user">北门旧报童</span> <small>#1 2006-09-14 23:11</small><p>当年说是设备故障，但我家里有人在医院，听说名单比报纸上多。</p></div><div class="post"><span class="user">needle_1118</span> <small>#7 2006-09-15 00:42</small><p>不是四个，是七个。真正原始病历后来被换掉了。</p></div><div class="post"><span class="user">明远看临川</span> <small>#12 2006-09-15 08:06</small><p>别再查。那篇报道我写过，我知道自己当年写错了什么。</p></div><div class="post"><span class="user">匿名</span> <small>#21 2006-09-18 02:17</small><p>照片里不是十二个人。有人把最左边那个人剪掉了。</p></div></div></div>`}
function mailHtml(){state.mailRead=true;save();addEvidence('E30',false);return `<div class="mailbox"><div class="mail-head">临川邮局 2008 WebMail　收件箱（离线缓存）</div><div class="mail-row unread"><span>乔至衡</span><span>《历史项目说明会最终稿》：请确认责任段落</span><span>12月18日 21:05</span></div><div class="mail-row"><span>董事会秘书</span><span>明早9:00江港酒店媒体厅已确认</span><span>12月18日 19:12</span></div><div class="mail-row"><span>匿名</span><span>你以为公开一半真相就叫认罪？</span><span>12月17日 03:40</span></div><div class="mail-row"><span>旧档案转发</span><span>附件：安济项目受试者清单（加密）</span><span>12月16日 15:26</span></div></div>`}
function passengerHtml(){state.passengerRead=true;save();return `<div class="paper"><h2>K417 旅客实名摘录</h2><p>临川 → 江港　2008年12月19日</p><table style="width:100%;border-collapse:collapse"><tr><th align="left">姓名</th><th align="left">车厢</th><th align="left">备注</th></tr>${PEOPLE.map(p=>`<tr><td>${p.name}</td><td>${p.seat}</td><td>${p.role}</td></tr>`).join('')}<tr><td>周柏年</td><td>7车 07包厢</td><td>医疗集团董事</td></tr></table><p class="tiny">名单显示这些人来自不同购票渠道，不像普通团体出行。</p></div>`}

function renderSearch(){const last=state.searchHistory.at(-1)||'';const results=last?searchResults(last):[];return shell(`<div class="pagehead"><div><h1>离线搜索</h1><p>支持同义词与包含匹配；不需要猜作者规定的唯一字符串。</p></div></div><div class="card"><form class="searchbox" data-searchform><input name="q" autocomplete="off" placeholder="例如：周柏年 / 安济诊所 / 1994 医疗事故 / 顾明远" value=""><button class="btn primary">搜索</button></form><div class="suggestions"><button data-q="周柏年">周柏年</button><button data-q="安济诊所 1994">安济诊所 1994</button><button data-q="医疗事故">医疗事故</button><button data-q="顾明远">顾明远</button>${state.chapter>=7?'<button data-q="第十三个人">第十三个人</button>':''}</div></div>${last?`<h2 class="section-title">“${esc(last)}” 的结果</h2><div class="card">${results.length?results.join(''):'<p>没有完全匹配的缓存页。可以尝试更短的关键词；系统接受同义词和组合词。</p>'}</div>`:''}`, '搜索')}
function searchResults(q){const s=q.toLowerCase().replace(/\s+/g,'');let r=[];if(/周柏年|柏年|医疗集团|慈善/.test(s)){r.push(res('临川经纬：锐康医疗董事周柏年将举行历史项目说明会','news.local/2008/1218/zhou','集团称将“主动面对历史管理问题”。'));addEvidence('E30',false)}if(/安济|1994|94年|医疗事故|旧医院|诊所/.test(s)){r.push(res('临川旧闻数字档案：安济诊所设备事故','archive.local/1994/1118','公开记录称4名儿童出现不良反应；后续页面存在缺页。'));if(!state.docs.includes('clinic94'))state.docs.push('clinic94');addEvidence('E21',false);addEvidence('E28',false);save()}if(/顾明远|记者|旧报道/.test(s)){r.push(res('临川日报1994-11-22：设备故障已排除人为责任','paper.local/1994/1122','署名记者：顾明远。'));addEvidence('E24',false)}if(/药|胺碘酮|阿奇霉素|心律/.test(s)){r.push(res('药品安全资料：QT间期延长风险提示','med-cache.local/interactions/qt','合并使用特定药物时需警惕严重心律失常。'));if(state.chapter>=5)addEvidence('E31',false)}if(/第十三|13人|照片边缘/.test(s)&&state.chapter>=7){r.push(res('北城夜话已删除缓存：照片左侧的人是谁？','bbs-cache.local/deleted/13','缓存只剩一句：“资金签字人姓沈，不在公开名单里。”'));state.secret=true;addEvidence('E57',false);save()}return r}
function res(t,u,d){return `<div class="result"><h3>${t}</h3><div class="url">${u}</div><p>${d}</p></div>`}

function renderMedia(){if(state.chapter>=5){addEvidence('E44',false);addEvidence('E45',false)}const oldUnlocked=state.chapter>=3||state.docs.includes('clinic94');return shell(`<div class="pagehead"><div><h1>媒体与档案资料</h1><p>照片、旧报纸、法医摘要和内部文件会随调查推进开放。</p></div></div><div class="grid cols2"><div class="card"><h3>1994旧照片</h3><img src="assets/images/old_photo_1994.jpg" style="width:100%;border:8px solid #d4c8ae;filter:sepia(.2)" alt="做旧的1994年照片证物"><p>桌上的旧照片之一。${has('E48')?'徐洛已确认左侧存在二次裁切。':'需要一名熟悉影像的人判断边缘痕迹。'}</p>${state.chapter>=7&&!has('E48')?'<button class="btn sm" data-ev="E48">请徐洛检查冲印边缘</button>':''}</div><div class="paper"><span class="stamp">内部复核</span><h2>法医初步摘要</h2>${state.chapter>=5?'<p><b>胸部创口：</b>组织反应与失血量明显低于生前锐器伤常见表现。</p><p><b>毒理：</b>胺碘酮、阿奇霉素相关代谢物均检出。</p><p><b>结论：</b>应优先考虑严重心律失常导致循环衰竭，锐器伤时序需重新判断。</p>':'<p>文件尚未从封锁区传回。</p>'}</div></div>${oldUnlocked?`<h2 class="section-title">安济诊所旧案</h2><div class="grid cols2"><div class="paper"><h2>临川日报 · 1994年11月22日</h2><h3>安济诊所治疗设备故障，四名儿童出现不良反应</h3><p>院方称设备瞬时异常，已暂停相关项目。项目负责人表示“未发现人为剂量错误”。</p><p class="tiny">注意：公开报道中的人数与论坛证词不一致。</p></div><div class="card"><h3>档案交叉核验</h3><p>随着人物询问，你可以逐步获得病历签字、护士排班、货运单与身份变更资料。</p>${state.chapter>=7?'<button class="btn sm" data-ev="E51">整理原始受试者清单</button>':''}${state.chapter>=7&&!state.boxOpened?'<button class="btn sm" data-box>尝试打开密码箱</button>':''}${state.boxOpened?'<div class="quote">密码箱已打开：内部是一份“历史项目说明会”协议与危机公关草案。</div>':''}</div></div>`:''}`, '媒体资料')}

function renderDeduction(){if(state.ending)return renderEnding();if(state.chapter<8){const d=DEDUCTIONS[state.chapter];const missing=d.need.filter(x=>!has(x));return shell(`<div class="pagehead"><div><h1>阶段推理</h1><p>结论需要建立在已经取得的证物上。缺少关键材料时，系统不会替你补全。</p></div></div><div class="deduction"><div class="ded-q"><h3>${d.q}</h3></div><div class="ded-options">${d.opts.map(o=>`<button data-ded="${o[0]}">${o[0]}. ${o[1]}</button>`).join('')}</div></div>${missing.length?`<div class="card" style="margin-top:15px"><h3>证据尚不足</h3><p>还缺 ${missing.length} 项关键材料：${missing.map(x=>EVIDENCE[x][0]).join('、')}。</p></div>`:'<div class="card" style="margin-top:15px"><p>关键材料已齐，可以提交判断。</p></div>'}`, '推理板')}
 const final=FINAL_QS.map(([id,q,opts])=>`<div class="deduction" style="margin-bottom:14px"><div class="ded-q"><h3>${q}</h3></div><div class="ded-options">${opts.map(o=>`<button data-final="${id}:${o[0]}" class="${state.finalAnswers[id]===o[0]?'selected':''}">${o[1]}</button>`).join('')}</div></div>`).join('');return shell(`<div class="pagehead"><div><h1>最终推理</h1><p>不要把法律责任、道德责任与物理上的死亡机制混成一个“凶手”答案。</p></div></div>${final}<button class="btn primary" data-final-submit>提交五项判断</button>${state.finalSubmitted?`<h2 class="section-title">如何提交这起案件？</h2><div class="grid cols3"><div class="final-choice"><h3>法律</h3><p>提交全部当夜行为与1994旧案证据，让不同参与者分别承担责任。</p><button class="btn" data-ending="law">提交完整证据</button></div><div class="final-choice"><h3>真相</h3><p>公开旧案与集团操控，但隐去部分当夜行为，保护受害者家属。</p><button class="btn" data-ending="truth">公开历史真相</button></div><div class="final-choice"><h3>沉默</h3><p>只提交足以解释死亡的材料，不主动追究所有现场破坏。</p><button class="btn" data-ending="silence">保留部分证据</button></div></div>`:''}`, '推理板')}
function finalCorrect(){return FINAL_QS.every(([id,,,correct])=>state.finalAnswers[id]===correct)}
function renderEnding(){const map={law:['结局 A · 法律','K417重新启动后的第三天，专案组正式立案。韩雪琴因投放药物行为被追责；方琴的不施救、乔至衡的死后刺伤与其他人的现场破坏被分别认定。1994年安济诊所项目重新调查，七名受试儿童的真实名单第一次进入公开卷宗。'],truth:['结局 B · 真相','顾言的报道在全国转载。你交出的材料足以证明集团长期掩盖旧案，却没有把所有当夜行为交给警方。有人因此逃过处罚，也有人第一次能以自己的名字讲完1994年的故事。'],silence:['结局 C · 沉默','官方结论停在药物相互作用、延误救治与现场破坏。列车重新穿过雪夜时，没有人再谈7号包厢。几个月后，你收到一封没有寄件人的邮件：你找到的是事实，还是大家能够承受的事实？']};const [title,text]=map[state.ending]||map.law;const score=Math.max(60,100-state.hints*4-Math.max(0,28-state.evidence.length));return shell(`<div class="ending"><div class="ending-card"><div class="kicker">CASE CLOSED / K417-071</div><h1>${title}</h1><p>${text}</p>${state.secret?'<div class="epilogue"><b>隐藏后记：第十三个人</b><p>被裁掉的资金负责人沈世勋从未登上K417。旧案并没有随着周柏年的死亡彻底结束。你把名字写进新的调查页。</p></div>':''}<div class="score">调查评价 ${score}/100</div><p class="tiny">已发现证物 ${state.evidence.length}/57 · 提示 ${state.hints} 次 · ${state.secret?'隐藏档案已解锁':'隐藏档案未解锁'}</p><button class="btn" data-nav="evidence">回看证物</button> <button class="btn danger" data-reset>重新开始</button></div></div>`, '结案')}

function renderSettings(){return shell(`<div class="pagehead"><div><h1>设置</h1><p>所有关键推理都可以在静音状态完成。</p></div></div><div class="card"><div class="settings-row"><div><b>环境列车声</b><div class="tiny">仅提供氛围；浏览器阻止播放时不会影响流程。</div></div><button class="btn sm" data-audio>${state.audio?'关闭':'开启'}</button></div><div class="settings-row"><div><b>自动存档</b><div class="tiny">使用 localStorage，每次获得证物、推理或切换页面都会保存。</div></div><span class="chip ok">已启用</span></div><div class="settings-row"><div><b>导出存档</b><div class="tiny">复制到另一浏览器后可用于恢复。</div></div><button class="btn sm" data-export>导出</button></div><div class="settings-row"><div><b>导入存档</b></div><button class="btn sm" data-import>导入</button></div><div class="settings-row"><div><b>重置案件</b></div><button class="btn sm danger" data-reset>清除进度</button></div></div>`, '设置')}
function renderCredits(){return shell(`<div class="pagehead"><div><h1>资料来源与授权</h1><p>游戏剧情、人物、证据与UI均为本项目原创虚构内容。场景照片采用可再利用的历史铁路照片并本地化打包。</p></div></div><div class="card"><h3>场景照片</h3><p><b>Soft sleeper compartment for train T138 from Shanghai to Xi'an</b><br>拍摄：Cvalente，2008-12-18，Wikimedia Commons，Public Domain。</p><p><b>Beijing Railway Station at Night</b><br>拍摄：Alex Needham，2008上传，Wikimedia Commons，Public Domain。</p><p><b>Tianshui train station 20090226</b><br>拍摄：MarsmanRom，2009-02-26，Wikimedia Commons，Public Domain。</p><div class="sep"></div><p class="tiny">版本 ${VERSION}。照片仅用于营造2008年前后铁路环境，不表示照片中的真实地点、机构或人物与虚构案件有关。</p></div>`, '资料来源')}

function doInterview(spec){const [pid,idxs]=spec.split(':');const idx=+idxs,p=PEOPLE.find(x=>x.id===pid);if(!p||!p.topics[idx]||state.chapter<p.topics[idx][2])return;const arr=state.interviews[pid]||(state.interviews[pid]=[]);if(!arr.includes(idx))arr.push(idx);const ev=p.topics[idx][3];if(ev)addEvidence(ev);save();render()}
function doDed(choice){const d=DEDUCTIONS[state.chapter];const missing=d.need.filter(x=>!has(x));if(missing.length){toast('关键证据还没有齐。先继续调查。','warn');return}if(choice===d.correct){if(d.award)addEvidence(d.award);if(state.chapter===7)state.boxOpened=true;if(!state.completed.includes(state.chapter))state.completed.push(state.chapter);toast('阶段推理成立。新的调查阶段已开放。','good');state.chapter++;save();render()}else{toast('这个结论无法同时解释现有证据。再核对一下。','warn')}}
function doClock(v){if(v==='-6'){state.clockSolved=true;addEvidence('E36');save();toast('时钟校正成功：监控快6分钟。','good');render()}else toast('校正后仍与独立时间源冲突。','warn')}
function doBox(){if(state.chapter<7){toast('目前还没有足够信息理解密码。','warn');return}openPrompt('输入四位密码（数字）','0701',val=>{if(val.replace(/\D/g,'')==='0701'){state.boxOpened=true;addEvidence('E52');save();toast('密码箱打开。','good');render()}else toast('密码不对。贴纸写着“别相信纪念日”。','warn')})}
function submitFinal(){const need=['E53','E54','E55','E44','E45','E56'];const miss=need.filter(x=>!has(x));if(miss.length){toast('关键证据还没齐：'+miss.map(x=>EVIDENCE[x][0]).join('、'),'warn');return}if(finalCorrect()){state.finalSubmitted=true;save();toast('五项判断互相一致。现在决定如何提交案件。','good');render()}else toast('至少一项判断仍与证据冲突。','warn')}
function ending(type){if(!state.finalSubmitted||!finalCorrect())return;state.ending=type;save();render()}

function hint(){state.hints++;save();const h={1:['先检查腕表、床脚血迹和餐车送餐记录。单一时钟不能直接当死亡时间。','退休列车员熟悉门锁；餐车厨师知道咖啡送出时间。'],2:['优先询问林婉、顾言、唐宁，再用票据/照片/登记单核验。','“谁撒谎”不是答案，问“为什么撒谎”。'],3:['搜索“安济诊所 1994”或“医疗事故”，然后读北城夜话。','顾言的父亲和方琴都在旧案公开资料里留下过痕迹。'],4:['徐洛相机显示1:23，监控同一画面显示1:29。','监控整体快6分钟，所以监控时间统一减6。'],5:['胸部伤口失血太少。查法医摘要与陈川的药物说明。','胺碘酮与阿奇霉素叠加是关键。'],6:['询问顾言“录音”、沈途“进入包厢”、乔至衡“刺伤”。','密室可能没有一个统一设计者。'],7:['照片被裁掉一人；密码不是1118，也不是1994。','原始受试儿童是7人，其中1人死亡：0701。'],8:['把“谁下药”“谁不施救”“谁刺伤”分成三个问题。','最终答案：药物相互作用；韩雪琴；方琴；乔至衡；多人行为叠加。']}[state.chapter]||['继续核对证物。'];showModal(`<h2>案件助手</h2><div class="hintbox">${h[Math.min(1,state.hints>1?1:0)]}</div><p class="tiny">本次提示已计入调查评价。</p>`)}

function openPrompt(title,placeholder,cb){showModal(`<h2>${title}</h2><form data-promptform><input name="value" style="width:100%;padding:11px;background:#0d1518;border:1px solid #53636a;color:#fff;border-radius:7px" placeholder="${placeholder||''}" autofocus><div style="margin-top:12px"><button class="btn primary">确认</button></div></form>`,m=>{const f=$('[data-promptform]',m);f.addEventListener('submit',e=>{e.preventDefault();const v=f.value.value;closeModal();cb(v)})})}
function showModal(html,onopen){const b=document.createElement('div');b.className='modalback';b.innerHTML=`<div class="modal"><button class="btn sm close" data-close>关闭</button>${html}</div>`;document.body.appendChild(b);$('[data-close]',b).onclick=()=>b.remove();b.addEventListener('click',e=>{if(e.target===b)b.remove()});if(onopen)onopen(b)}
function closeModal(){document.querySelector('.modalback')?.remove()}
function exportSave(){const raw=btoa(unescape(encodeURIComponent(JSON.stringify(state))));showModal(`<h2>导出存档</h2><textarea style="width:100%;height:180px;background:#0d1518;color:#ddd;border:1px solid #526269;padding:10px">${raw}</textarea><p class="tiny">复制并自行保存这段文本。</p>`)}
function importSave(){openPrompt('粘贴导出的存档文本','',val=>{try{const s=JSON.parse(decodeURIComponent(escape(atob(val.trim()))));state=Object.assign(baseState(),s);save();toast('存档已导入。','good');render()}catch{toast('存档文本无效。','warn')}})}

function bind(){
 document.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>nav(b.dataset.nav));
 $('[data-start]')?.addEventListener('click',startGame); document.querySelectorAll('[data-reset]').forEach(b=>b.onclick=()=>{if(confirm('确定清除当前调查进度？'))reset()});
 $('[data-about]')?.addEventListener('click',()=>showModal('<h2>游玩说明</h2><p>这是一个以证据交叉验证为核心的网页侦探游戏。搜索支持同义词；所有声音均可关闭；提示分级且不会造成流程阻断。</p><p>建议先从“列车地图”检查案发包厢，再去“人物档案”询问。</p>'));
 document.querySelectorAll('[data-audio]').forEach(b=>b.onclick=toggleAudio);$('[data-mobile]')?.addEventListener('click',()=>{state.mobileOpen=!state.mobileOpen;render()});
 document.querySelectorAll('[data-ev]').forEach(b=>b.onclick=()=>{addEvidence(b.dataset.ev);render()});
 document.querySelectorAll('[data-interview]').forEach(b=>b.onclick=()=>doInterview(b.dataset.interview));
 document.querySelectorAll('[data-ded]').forEach(b=>b.onclick=()=>doDed(b.dataset.ded));
 document.querySelectorAll('[data-clock]').forEach(b=>b.onclick=()=>doClock(b.dataset.clock));
 document.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>performSearch(b.dataset.q));
 $('[data-searchform]')?.addEventListener('submit',e=>{e.preventDefault();performSearch(e.target.q.value)});
 document.querySelectorAll('[data-intra]').forEach(b=>b.onclick=()=>{const d=$('#intra-detail');if(b.dataset.intra==='forum')d.innerHTML=forumHtml();if(b.dataset.intra==='mail')d.innerHTML=mailHtml();if(b.dataset.intra==='passenger')d.innerHTML=passengerHtml()});
 $('[data-box]')?.addEventListener('click',doBox);$('[data-final-submit]')?.addEventListener('click',submitFinal);document.querySelectorAll('[data-final]').forEach(b=>b.onclick=()=>{const [k,v]=b.dataset.final.split(':');state.finalAnswers[k]=v;state.finalSubmitted=false;save();render()});
 document.querySelectorAll('[data-ending]').forEach(b=>b.onclick=()=>ending(b.dataset.ending));$('[data-hint]')?.addEventListener('click',hint);$('[data-export]')?.addEventListener('click',exportSave);$('[data-import]')?.addEventListener('click',importSave);
 $('[data-scene]')?.addEventListener('click',()=>document.querySelector('.scene')?.scrollIntoView({behavior:'smooth'}));
}
function performSearch(q){q=(q||'').trim();if(!q){toast('请输入调查关键词。','warn');return}state.searchHistory.push(q);if(state.searchHistory.length>30)state.searchHistory.shift();searchResults(q);save();render()}

// Built-in regression test. Opens with ?selftest=1 and leaves a machine-readable report in DOM.
function runSelfTest(){
 const report=[];const assert=(name,cond)=>{report.push((cond?'PASS ':'FAIL ')+name);if(!cond)throw new Error(name)};
 try{
  const old=state; state=baseState();state.started=true;
  ['E01','E02','E03','E04','E05','E06','E07','E08','E09'].forEach(x=>addEvidence(x,false));assert('scene evidence',state.evidence.length===9);
  state.interviews.lin=[0,2];state.interviews.gu=[0];state.interviews.tang=[0];state.interviews.wu=[0];state.interviews.luo=[0];assert('people count',personCount()>=5);
  searchResults('安济诊所 1994 医疗事故');assert('search alias old case',state.docs.includes('clinic94')&&has('E21'));
  state.forumRead=true;addEvidence('E24',false);addEvidence('E28',false);assert('old case evidence',has('E24')&&has('E28'));
  state.chapter=4;addEvidence('E29',false);addEvidence('E32',false);state.clockSolved=true;addEvidence('E36',false);assert('clock solved',state.clockSolved&&has('E36'));
  state.chapter=5;addEvidence('E44',false);addEvidence('E45',false);addEvidence('E31',false);assert('forensic bundle',has('E44')&&has('E45')&&has('E31'));
  state.chapter=7;addEvidence('E48',false);addEvidence('E51',false);state.boxOpened=true;addEvidence('E52',false);assert('box state',state.boxOpened&&has('E52'));
  state.chapter=8;addEvidence('E53',false);addEvidence('E54',false);addEvidence('E55',false);FINAL_QS.forEach(([id,,,c])=>state.finalAnswers[id]=c);assert('final answers',finalCorrect());assert('ending gated before submit',!renderDeduction().includes('data-ending=\"law\"'));state.finalSubmitted=true;assert('ending options after submit',renderDeduction().includes('data-ending=\"law\"'));
  for(const r of ROUTES.map(x=>x[0])){state.route=r;let html='';switch(r){case'case':html=renderCase();break;case'map':html=renderMap();break;case'people':html=renderPeople();break;case'evidence':html=renderEvidence();break;case'timeline':html=renderTimeline();break;case'sms':html=renderSMS();break;case'intranet':html=renderIntranet();break;case'search':html=renderSearch();break;case'media':html=renderMedia();break;case'deduction':html=renderDeduction();break;case'settings':html=renderSettings();break;case'credits':html=renderCredits();break}assert('render '+r,html.includes('shell'))}
  state.ending='law';assert('ending render',renderEnding().includes('结局 A'));
  localStorage.setItem('SELFTEST_TMP',JSON.stringify(state));assert('storage roundtrip',JSON.parse(localStorage.getItem('SELFTEST_TMP')).chapter===8);localStorage.removeItem('SELFTEST_TMP');
  state=old;
  document.body.innerHTML=`<pre id="selftest" style="white-space:pre-wrap;padding:20px;color:#dfe;background:#111">SELFTEST_PASS\n${report.join('\n')}</pre>`;document.title='SELFTEST_PASS';
 }catch(e){document.body.innerHTML=`<pre id="selftest" style="white-space:pre-wrap;padding:20px;color:#fbb;background:#111">SELFTEST_FAIL\n${report.join('\n')}\n${e.stack}</pre>`;document.title='SELFTEST_FAIL';throw e}
}

if(new URLSearchParams(location.search).get('selftest')==='1'){runSelfTest()}else render();

window.GameDebug={state:()=>state,reset,addEvidence,searchResults,VERSION};
})();
