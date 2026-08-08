import {DurableObject} from 'cloudflare:workers';
import {PROTOCOL_VERSION,MAX_PLAYERS,sanitizeShared,stripHostOnly,mergeShared,diffEvents} from './shared.js';

const ROOM_ALPHABET='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ROOM_RE=/^[A-HJ-NP-Z2-9]{6}$/;
const jsonHeaders={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'GET,POST,OPTIONS'};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:jsonHeaders});
const roomCode=()=>Array.from({length:6},()=>ROOM_ALPHABET[Math.floor(Math.random()*ROOM_ALPHABET.length)]).join('');
const safeName=v=>String(v||'调查员').replace(/[<>\n\r]/g,'').trim().slice(0,14)||'调查员';
const safeText=v=>String(v||'').replace(/[<>\r]/g,'').trim().slice(0,180);
const timeText=()=>new Date().toISOString().slice(11,16);
const parseBody=async req=>{try{return await req.json()}catch(_){return {}}};

export default {
  async fetch(request,env){
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers:jsonHeaders});
    const url=new URL(request.url),parts=url.pathname.split('/').filter(Boolean);
    if(url.pathname==='/health')return json({ok:true,service:'hongye-multiplayer',protocolVersion:PROTOCOL_VERSION,maxPlayers:MAX_PLAYERS});
    if(request.method==='POST'&&url.pathname==='/api/rooms'){
      const body=await parseBody(request);
      if(Number(body.protocolVersion||PROTOCOL_VERSION)!==PROTOCOL_VERSION)return json({error:'客户端联机协议版本不兼容'},409);
      for(let i=0;i<8;i++){
        const code=roomCode(),stub=env.GAME_ROOMS.getByName(code);
        const res=await stub.fetch('https://room.internal/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({playerName:safeName(body.playerName),initialState:body.initialState,protocolVersion:PROTOCOL_VERSION})});
        if(res.status===409)continue;
        const data=await res.json();return json({...data,roomCode:code},res.status);
      }
      return json({error:'暂时无法分配房间码，请重试'},503);
    }
    if(parts[0]==='api'&&parts[1]==='rooms'&&parts[2]){
      const code=String(parts[2]).toUpperCase();
      if(!ROOM_RE.test(code))return json({error:'房间码格式无效'},400);
      const stub=env.GAME_ROOMS.getByName(code);
      if(parts[3]==='join'&&request.method==='POST'){
        const body=await parseBody(request);
        if(Number(body.protocolVersion||PROTOCOL_VERSION)!==PROTOCOL_VERSION)return json({error:'客户端联机协议版本不兼容'},409);
        const res=await stub.fetch('https://room.internal/join',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({playerName:safeName(body.playerName),protocolVersion:PROTOCOL_VERSION})});
        let data={};try{data=await res.json()}catch(_){}return json({...data,roomCode:code},res.status);
      }
      if(parts[3]==='leave'&&request.method==='POST'){
        const body=await parseBody(request);
        const res=await stub.fetch('https://room.internal/leave',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({playerId:String(body.playerId||''),token:String(body.token||'')})});
        let data={};try{data=await res.json()}catch(_){}return json({...data,roomCode:code},res.status);
      }
      if(parts[3]==='status'&&request.method==='GET'){
        const res=await stub.fetch('https://room.internal/status');let data={};try{data=await res.json()}catch(_){}return json({...data,roomCode:code},res.status);
      }
      if(parts[3]==='ws'&&request.method==='GET'){
        if((request.headers.get('Upgrade')||'').toLowerCase()!=='websocket')return json({error:'该端点需要 WebSocket Upgrade'},426);
        const inner=new URL('https://room.internal/ws');inner.search=url.search;
        return stub.fetch(new Request(inner.toString(),request));
      }
    }
    return json({ok:true,service:'hongye-multiplayer',endpoints:['POST /api/rooms','POST /api/rooms/:code/join','POST /api/rooms/:code/leave','GET /api/rooms/:code/status','WS /api/rooms/:code/ws']});
  }
};

export class GameRoom extends DurableObject {
  constructor(ctx,env){
    super(ctx,env);this.sessions=new Map();
    for(const ws of this.ctx.getWebSockets()){const a=ws.deserializeAttachment();if(a)this.sessions.set(ws,a)}
    this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping','pong'));
  }
  async room(){return await this.ctx.storage.get('room')||null}
  async saveRoom(room){room.updatedAt=Date.now();await this.ctx.storage.put('room',room)}
  feedEntry(kind,fields={}){return {kind,time:timeText(),ts:Date.now(),...fields}}
  pushFeed(room,entry){room.feed=Array.isArray(room.feed)?room.feed:[];room.feed.push(entry);room.feed=room.feed.slice(-50)}
  member(room,playerId,token){const m=room?.members?.[playerId];return m&&m.token===token?m:null}
  activeByPlayer(playerId){for(const [ws,a] of this.sessions)if(a.playerId===playerId)return {ws,a};return null}
  players(room){
    const active=new Map();for(const [,a] of this.sessions)active.set(a.playerId,a);
    return Object.values(room.members||{}).map(m=>{const a=active.get(m.playerId);return {playerId:m.playerId,name:m.name,host:!!m.host,online:!!a,presence:a?.presence||null}});
  }
  send(ws,msg){try{ws.send(JSON.stringify(msg))}catch(_){}}
  sendSnapshot(ws,room,playerId){const m=room.members[playerId];this.send(ws,{type:'snapshot',state:room.state,revision:room.revision||0,players:this.players(room),feed:room.feed||[],host:!!m?.host,maxPlayers:MAX_PLAYERS})}
  broadcastPresence(room){const msg={type:'presence',players:this.players(room)};for(const [ws] of this.sessions)this.send(ws,msg)}
  broadcastFeed(entry){const msg={type:'feed',entry};for(const [ws] of this.sessions)this.send(ws,msg)}
  broadcastSnapshots(room){for(const [ws,a] of this.sessions)this.sendSnapshot(ws,room,a.playerId)}

  async fetch(request){
    const url=new URL(request.url),path=url.pathname;
    if(path==='/create'&&request.method==='POST'){
      if(await this.room())return json({error:'房间码已占用'},409);
      const body=await parseBody(request),playerId=crypto.randomUUID(),token=crypto.randomUUID(),name=safeName(body.playerName);
      const room={protocolVersion:PROTOCOL_VERSION,createdAt:Date.now(),updatedAt:Date.now(),revision:1,state:sanitizeShared(body.initialState||{}),members:{},feed:[]};
      room.members[playerId]={playerId,token,name,host:true,joinedAt:Date.now()};this.pushFeed(room,this.feedEntry('join',{text:`${name} 创建了调查组`}));await this.saveRoom(room);
      return json({playerId,token,host:true},201);
    }
    if(path==='/join'&&request.method==='POST'){
      const room=await this.room();if(!room)return json({error:'房间不存在或已失效'},404);
      if(Object.keys(room.members||{}).length>=MAX_PLAYERS)return json({error:'调查组已满（最多3人）'},409);
      const body=await parseBody(request),playerId=crypto.randomUUID(),token=crypto.randomUUID(),name=safeName(body.playerName);
      const host=Object.keys(room.members||{}).length===0;room.members[playerId]={playerId,token,name,host,joinedAt:Date.now()};this.pushFeed(room,this.feedEntry('join',{text:`${name} 加入调查组`}));await this.saveRoom(room);
      return json({playerId,token,host},201);
    }
    if(path==='/leave'&&request.method==='POST'){
      const room=await this.room();if(!room)return json({error:'房间不存在或已失效'},404);
      const body=await parseBody(request),member=this.member(room,String(body.playerId||''),String(body.token||''));if(!member)return json({error:'联机身份验证失败'},403);
      const wasHost=!!member.host,name=member.name;delete room.members[member.playerId];
      const active=this.activeByPlayer(member.playerId);if(active){try{active.ws.close(1000,'voluntary leave')}catch(_){}this.sessions.delete(active.ws)}
      let newHost=null;
      if(wasHost){const remaining=Object.values(room.members||{}).sort((a,b)=>(a.joinedAt||0)-(b.joinedAt||0));if(remaining[0]){remaining[0].host=true;newHost=remaining[0];const live=this.activeByPlayer(newHost.playerId);if(live){live.a.host=true;this.sessions.set(live.ws,live.a);live.ws.serializeAttachment(live.a)}}}
      const text=newHost?`${name} 退出调查组，房主已移交给 ${newHost.name}`:`${name} 退出调查组`;const entry=this.feedEntry('leave',{text});this.pushFeed(room,entry);await this.saveRoom(room);this.broadcastFeed(entry);this.broadcastPresence(room);this.broadcastSnapshots(room);return json({ok:true,newHost:newHost?newHost.playerId:null});
    }
    if(path==='/status'){
      const room=await this.room();if(!room)return json({exists:false},404);
      return json({exists:true,players:Object.keys(room.members||{}).length,online:this.players(room).filter(p=>p.online).length,maxPlayers:MAX_PLAYERS,revision:room.revision||0});
    }
    if(path==='/ws'){
      const room=await this.room();if(!room)return new Response('room not found',{status:404});
      const playerId=url.searchParams.get('playerId')||'',token=url.searchParams.get('token')||'',member=this.member(room,playerId,token);
      if(!member)return new Response('forbidden',{status:403});
      const previous=this.activeByPlayer(playerId);if(previous){try{previous.ws.close(4409,'duplicate connection')}catch(_){}this.sessions.delete(previous.ws)}
      const pair=new WebSocketPair(),client=pair[0],server=pair[1];
      const attachment={playerId,name:member.name,host:!!member.host,presence:{route:'case',label:'正在连接…'}};
      this.ctx.acceptWebSocket(server);server.serializeAttachment(attachment);this.sessions.set(server,attachment);
      this.broadcastPresence(room);
      return new Response(null,{status:101,webSocket:client});
    }
    return json({error:'not found'},404);
  }

  async webSocketMessage(ws,message){
    if(message==='ping')return;
    let msg;try{msg=JSON.parse(typeof message==='string'?message:new TextDecoder().decode(message))}catch(_){return this.send(ws,{type:'error',error:'消息格式无效'})}
    const attachment=this.sessions.get(ws)||ws.deserializeAttachment();if(!attachment)return;
    let room=await this.room();if(!room){try{ws.close(4404,'room gone')}catch(_){}return}
    const member=room.members?.[attachment.playerId];if(!member){try{ws.close(4403,'member gone')}catch(_){}return}
    if(msg.type==='hello'){
      if(Number(msg.protocolVersion||PROTOCOL_VERSION)!==PROTOCOL_VERSION){this.send(ws,{type:'error',error:'联机协议版本不兼容'});return}
      if(msg.presence){attachment.presence={route:String(msg.presence.route||'case').slice(0,20),label:String(msg.presence.label||'调查中').slice(0,80)};this.sessions.set(ws,attachment);ws.serializeAttachment(attachment)}
      if(msg.state){const before=room.state;room.state=mergeShared(before,stripHostOnly(msg.state,!!member.host));const events=diffEvents(before,room.state,member.name);if(JSON.stringify(before)!==JSON.stringify(room.state)){room.revision=(room.revision||0)+1;events.forEach(e=>this.pushFeed(room,e));await this.saveRoom(room);events.forEach(e=>this.broadcastFeed(e))}}
      this.sendSnapshot(ws,room,attachment.playerId);this.broadcastPresence(room);return;
    }
    if(msg.type==='presence'){
      const p=msg.presence||{};attachment.presence={route:String(p.route||'case').slice(0,20),label:String(p.label||'调查中').slice(0,80)};this.sessions.set(ws,attachment);ws.serializeAttachment(attachment);this.broadcastPresence(room);return;
    }
    if(msg.type==='chat'){
      const text=safeText(msg.text);if(!text)return;const entry=this.feedEntry('chat',{by:member.name,text});this.pushFeed(room,entry);await this.saveRoom(room);this.broadcastFeed(entry);return;
    }
    if(msg.type==='state:update'){
      const before=room.state,incoming=stripHostOnly(msg.state||{},!!member.host),merged=mergeShared(before,incoming);
      if(JSON.stringify(before)===JSON.stringify(merged))return this.sendSnapshot(ws,room,attachment.playerId);
      room.state=merged;room.revision=(room.revision||0)+1;const events=diffEvents(before,merged,member.name);events.forEach(e=>this.pushFeed(room,e));await this.saveRoom(room);events.forEach(e=>this.broadcastFeed(e));this.broadcastSnapshots(room);return;
    }
  }
  async webSocketClose(ws){this.sessions.delete(ws);const room=await this.room();if(room)this.broadcastPresence(room)}
  async webSocketError(ws){this.sessions.delete(ws);const room=await this.room();if(room)this.broadcastPresence(room)}
}
