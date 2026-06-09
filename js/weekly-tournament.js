/* ═══════════════════════════════════════════════════════════════
   ChessArena — Weekly Sunday Tournament  🏆  v2.0
   ──────────────────────────────────────────────────────────────
   Har Sunday 8:00 PM IST (14:30 UTC) automatic tournament
   Swiss pairing · 5–7 rounds · Real-time Firebase sync
   Sign-in REQUIRED (no local/guest play)
   Chat · XP · Hall of Fame · Achievements · Anti-cheat
═══════════════════════════════════════════════════════════════ */

/* ── CONSTANTS ─────────────────────────────────────────────── */
const WT = {
  HOUR_IST   : 20,
  MIN_IST    : 0,
  REG_OPEN   : 30 * 60000,
  ROUND_TIME : 25 * 60000,
  JOIN_TIME  :  5 * 60000,
  MIN_PLAYERS: 4,
  MAX_PLAYERS: 500,
  COINS: { first:100, second:60, third:30, win:10, draw:5, participate:5 },
  XP   : { first:500, second:250, third:100, win:30, draw:10, participate:15 },
  TC   : {
    blitz3 : { label:'Blitz 3+0',  min:3,  inc:0 },
    blitz3i: { label:'Blitz 3+2',  min:3,  inc:2 },
    rapid10: { label:'Rapid 10+0', min:10, inc:0 },
    rapid10i:{ label:'Rapid 10+5', min:10, inc:5 }
  },
  CHAT_LIMIT : 60
};

/* ── STATE ─────────────────────────────────────────────────── */
let wt = {
  tourneyId   : null,
  status      : 'scheduled',
  myUid       : null,
  myMatch     : null,
  standings   : [],
  currentRound: 0,
  totalRounds : 5,
  countdown   : null,
  listeners   : [],
  chatUnsub   : null,
  matchTimeout: null,
  isDirector  : false,
  timeControl : 'blitz3',
  maxPlayers  : 64,
  chatMessages: [],
  myStats     : { wins:0, draws:0, losses:0 },
  winStreak   : 0,
  matchHistory: [],
  matchStartedAt: null
};

/* ── HELPERS ───────────────────────────────────────────────── */
function getNextTournamentTime() {
  const now = new Date(), target = new Date(now);
  const day = now.getUTCDay();
  target.setUTCDate(now.getUTCDate() + (day === 0 ? 0 : 7 - day));
  target.setUTCHours(14, 30, 0, 0);
  if (target <= now) target.setUTCDate(target.getUTCDate() + 7);
  return target;
}
function getTourneyId(date) {
  return 'sunday_' + (date || getNextTournamentTime()).toISOString().split('T')[0];
}
function getMyUid() {
  if (wt.myUid) return wt.myUid;
  const u = (typeof currentUser !== 'undefined') ? currentUser : null;
  if (u?.uid) { wt.myUid = u.uid; return u.uid; }
  return null;
}
function getMyName() {
  const u = (typeof currentUser !== 'undefined') ? currentUser : null;
  return u?.displayName || localStorage.getItem('cm_username') || 'Player';
}
function getMyElo()  { return typeof getElo==='function' ? getElo() : 1200; }
function getCoins()  { return parseInt(localStorage.getItem('cm_coins')||'0'); }
function getXP()     { return parseInt(localStorage.getItem('cm_xp')||'0'); }
function addCoins(n) {
  localStorage.setItem('cm_coins', getCoins()+n);
  updateCoinBadge(); if(n>0) showCoinToast(n);
}
// NOTE: level-system.js (loaded after this file) defines a richer addXP(amount, source)
// with level-up tracking, XP toasts, and badge updates. This fallback only runs if
// level-system.js fails to load — in normal operation it is overridden at page start.
function addXP(n) {
  localStorage.setItem('cm_xp', getXP()+n);
  if(n>0) showXPToast(n);
}
function updateCoinBadge() {
  document.querySelectorAll('.coin-count').forEach(el => el.textContent = getCoins()+' 🪙');
}
function getRoomCode(uid1, uid2, round) {
  const key=[uid1,uid2].sort().join('')+round; let h=5381;
  for(let i=0;i<key.length;i++) h=((h<<5)+h)^key.charCodeAt(i);
  return Math.abs(h).toString(36).toUpperCase().slice(0,6).padStart(6,'0');
}
function isFirebaseReady() { return typeof db!=='undefined'&&db!==null; }
function isSignedIn() {
  const u=(typeof currentUser!=='undefined')?currentUser:null; return !!(u&&u.uid);
}
function escHtmlWT(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

/* ── SWISS PAIRING ─────────────────────────────────────────── */
function swissPair(players, prevMatches) {
  const sorted=[...players].filter(p=>p.status!=='withdrew').sort((a,b)=>b.score-a.score||b.elo-a.elo);
  const pairs=[],used=new Set();
  for(let i=0;i<sorted.length;i++){
    if(used.has(sorted[i].uid)) continue; let paired=false;
    for(let j=i+1;j<sorted.length;j++){
      if(used.has(sorted[j].uid)) continue;
      const key=[sorted[i].uid,sorted[j].uid].sort().join('_');
      if(!prevMatches.has(key)){
        const[w,b]=(i%2===0)?[sorted[i],sorted[j]]:[sorted[j],sorted[i]];
        pairs.push({white:w,black:b,bye:false}); used.add(sorted[i].uid); used.add(sorted[j].uid); paired=true; break;
      }
    }
    if(!paired){
      for(let j=i+1;j<sorted.length;j++){
        if(!used.has(sorted[j].uid)){
          pairs.push({white:sorted[i],black:sorted[j],bye:false}); used.add(sorted[i].uid); used.add(sorted[j].uid); paired=true; break;
        }
      }
    }
    if(!paired){ pairs.push({white:sorted[i],black:null,bye:true}); used.add(sorted[i].uid); }
  }
  return pairs;
}
function calcRounds(n){ return n<=4?5:n<=8?6:7; }

/* ── ANTI-CHEAT ────────────────────────────────────────────── */
function checkAntiCheat(result, startedAt) {
  if(!startedAt) return false;
  if((Date.now()-startedAt)<20000 && result!=='1/2-1/2'){
    console.warn('[AntiCheat] Suspicious fast game');
    if(isFirebaseReady()&&wt.tourneyId) wtDoc().collection('flags').add({uid:getMyUid(),type:'fast_game',round:wt.currentRound,ts:Date.now()}).catch(()=>{});
    return true;
  }
  return false;
}

/* ── XP / WIN STREAK ───────────────────────────────────────── */
function trackWinStreak(result) {
  const m=wt.myMatch; if(!m) return;
  const uid=getMyUid();
  const iWon=(result==='1-0'&&m.white===uid)||(result==='0-1'&&m.black===uid);
  const isDraw=result==='1/2-1/2';
  if(iWon){wt.winStreak++;} else if(!isDraw){wt.winStreak=0;}
  localStorage.setItem('wt_win_streak',wt.winStreak);
  wt.myStats.wins+=iWon?1:0; wt.myStats.draws+=isDraw?1:0; wt.myStats.losses+=(!iWon&&!isDraw)?1:0;
}

/* ── ACHIEVEMENTS ──────────────────────────────────────────── */
const WT_ACHIEVEMENTS = {
  wt_first_win : {icon:'⚔️',name:'First Blood',     desc:'Win first tournament game'},
  wt_streak_3  : {icon:'🔥',name:'On Fire',          desc:'Win 3 consecutive games'},
  wt_streak_5  : {icon:'🌋',name:'Unstoppable',      desc:'Win 5 consecutive games'},
  wt_perfect   : {icon:'💎',name:'Perfect Score',    desc:'Win all games in tournament'},
  wt_champion  : {icon:'🏆',name:'Weekly Champion',  desc:'Win the weekly tournament'},
  wt_runnerup  : {icon:'🥈',name:'Runner-up',        desc:'Finish 2nd'},
  wt_third     : {icon:'🥉',name:'Third Place',      desc:'Finish 3rd'},
  wt_veteran   : {icon:'🎖',name:'Veteran',          desc:'Participate in 5 tournaments'},
  wt_draw_3    : {icon:'🤝',name:'Draw Specialist',  desc:'Draw 3 games in one tournament'}
};
function checkWTAchievements(result) {
  const m=wt.myMatch; if(!m) return;
  const uid=getMyUid();
  const iWon=(result==='1-0'&&m.white===uid)||(result==='0-1'&&m.black===uid);
  const isDraw=result==='1/2-1/2';
  const badges=JSON.parse(localStorage.getItem('cm_achievements')||'[]');
  const award=id=>{
    if(!badges.includes(id)&&WT_ACHIEVEMENTS[id]){
      badges.push(id); localStorage.setItem('cm_achievements',JSON.stringify(badges));
      const a=WT_ACHIEVEMENTS[id];
      if(typeof showAchievementToast==='function') showAchievementToast({id,icon:a.icon,name:a.name,desc:a.desc});
    }
  };
  if(iWon){
    award('wt_first_win');
    if(wt.winStreak>=3) award('wt_streak_3');
    if(wt.winStreak>=5) award('wt_streak_5');
    if(wt.myStats.wins===wt.totalRounds) award('wt_perfect');
  }
  if(isDraw&&wt.myStats.draws>=3) award('wt_draw_3');
  if(parseInt(localStorage.getItem('wt_participation')||'0')>=5) award('wt_veteran');
}

/* ── FIREBASE REFS ─────────────────────────────────────────── */
function wtDoc()      { return db.collection('weeklyTournaments').doc(wt.tourneyId); }
function wtPlayers()  { return wtDoc().collection('players'); }
function wtRound(r)   { return wtDoc().collection('rounds').doc(String(r)); }
function wtMatches(r) { return wtRound(r).collection('matches'); }
function wtChat()     { return wtDoc().collection('chat'); }

/* ── REGISTER / WITHDRAW ───────────────────────────────────── */
async function registerForWeeklyTournament() {
  if(!isFirebaseReady()){ alert('⚠️ Firebase not configured.'); return; }
  if(!isSignedIn()){ showWTNotif('🔑 Sign In zaroori hai!','warn'); _showWTSignInPrompt(); return; }
  const uid=getMyUid(), name=getMyName(), elo=getMyElo();
  const countryCode=(typeof detectMyCountry==='function')?detectMyCountry():null;
  try {
    const snap=await wtDoc().get();
    if(!snap.exists){
      await wtDoc().set({status:'registration',startTime:getNextTournamentTime().getTime(),
        currentRound:0,totalRounds:5,timeControl:wt.timeControl,maxPlayers:wt.maxPlayers,createdAt:Date.now()});
    }
    const pSnap=await wtPlayers().doc(uid).get();
    if(pSnap.exists&&pSnap.data().status==='registered'){
      showWTNotif('✅ Already registered!','info'); renderWTLobby(); subscribeToTournament(); return;
    }
    await wtPlayers().doc(uid).set({uid,name,elo,score:0,coins:0,xp:0,wins:0,draws:0,losses:0,
      countryCode:countryCode||null,status:'registered',joinedAt:Date.now()});
    let pc=parseInt(localStorage.getItem('wt_participation')||'0')+1;
    localStorage.setItem('wt_participation',pc);
    addCoins(WT.COINS.participate); addXP(WT.XP.participate);
    wt.status='registration';
    showWTNotif('✅ Registered! Tournament starts Sunday 8 PM IST.','success');
    renderWTLobby(); subscribeToTournament();
  } catch(e){ showWTNotif('❌ Registration failed: '+e.message,'error'); }
}
function _showWTSignInPrompt(){
  const content=document.getElementById('wt-content'); if(!content) return;
  if(document.getElementById('wt-signin-prompt')) return;
  const div=document.createElement('div'); div.id='wt-signin-prompt';
  div.style.cssText='background:rgba(200,160,40,.1);border:1px solid rgba(200,160,40,.35);border-radius:12px;padding:1rem;text-align:center;margin-top:.8rem;';
  div.innerHTML=`<div style="font-size:1.1rem;margin-bottom:.4rem;">🔑</div>
    <div style="font-weight:700;color:var(--gold,#c8a028);margin-bottom:.3rem;">Sign In Required</div>
    <div style="font-size:.82rem;color:var(--text-dim,#888);margin-bottom:.8rem;">Tournament sirf registered users ke liye hai. Guest play allowed nahi.</div>
    <button class="btn btn-primary" style="width:100%;padding:.6rem;" onclick="closeWTModal();openLoginModal()">🔑 Sign In / Register</button>`;
  content.appendChild(div);
}
async function withdrawFromTournament(){
  if(!wt.tourneyId) return; const uid=getMyUid(); if(!uid) return;
  try{ await wtPlayers().doc(uid).update({status:'withdrew'}); showWTNotif('Withdrawn.','info'); unsubscribeListeners(); closeWTModal(); }catch(e){}
}

/* ── TOURNAMENT CHAT ───────────────────────────────────────── */
function subscribeToWTChat(){
  if(!isFirebaseReady()||!wt.tourneyId) return;
  if(wt.chatUnsub){try{wt.chatUnsub();}catch(e){}}
  wt.chatUnsub=wtChat().orderBy('ts','asc').limitToLast(WT.CHAT_LIMIT).onSnapshot(snap=>{
    wt.chatMessages=snap.docs.map(d=>d.data()); renderWTChat();
  });
}
async function sendWTChat(){
  if(!isSignedIn()){showWTNotif('🔑 Sign in to chat!','warn');return;}
  const inp=document.getElementById('wt-chat-input'); if(!inp) return;
  const text=inp.value.trim(); if(!text||text.length>200) return; inp.value='';
  try{
    await wtChat().add({uid:getMyUid(),name:getMyName(),text,ts:Date.now(),
      country:(typeof detectMyCountry==='function')?detectMyCountry():null});
  }catch(e){showWTNotif('Chat failed','error');}
}
function renderWTChat(){
  const el=document.getElementById('wt-chat-msgs'); if(!el) return;
  const myUid=getMyUid();
  el.innerHTML=wt.chatMessages.map(m=>{
    const isMe=m.uid===myUid;
    const flag=(m.country&&typeof countryCodeToFlag==='function')?countryCodeToFlag(m.country)+' ':'';
    const time=new Date(m.ts).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
    return `<div class="wt-chat-msg ${isMe?'wt-chat-me':''}">
      <span class="wt-chat-name">${flag}${escHtmlWT(m.name)}</span>
      <span class="wt-chat-time">${time}</span>
      <div class="wt-chat-text">${escHtmlWT(m.text)}</div></div>`;
  }).join(''); el.scrollTop=el.scrollHeight;
}

/* ── HALL OF FAME ──────────────────────────────────────────── */
async function openHallOfFame(){
  if(!isFirebaseReady()){showWTNotif('Firebase needed','warn');return;}
  document.getElementById('wt-hof-modal')?.remove();
  const overlay=document.createElement('div'); overlay.id='wt-hof-modal';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem;';
  overlay.innerHTML=`<div style="background:var(--bg-card,#1e1e2e);border:1px solid rgba(200,160,40,.35);border-radius:16px;padding:1.4rem;max-width:400px;width:100%;position:relative;max-height:85vh;display:flex;flex-direction:column;">
    <button onclick="document.getElementById('wt-hof-modal').remove()" style="position:absolute;top:.8rem;right:.8rem;background:none;border:none;color:var(--text-dim);font-size:1.2rem;cursor:pointer;">✕</button>
    <div style="font-family:'Playfair Display',serif;font-size:1.1rem;color:var(--gold,#c8a028);font-weight:700;margin-bottom:1rem;text-align:center;">🏛️ Hall of Fame — Past Champions</div>
    <div id="wt-hof-list" style="flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:.5rem;"><div style="text-align:center;color:var(--text-dim);font-size:.85rem;">Loading…</div></div>
    <button onclick="document.getElementById('wt-hof-modal').remove()" style="width:100%;margin-top:1rem;padding:.6rem;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:var(--text);cursor:pointer;">Close</button>
  </div>`;
  overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
  try{
    const snap=await db.collection('tournamentHistory').orderBy('date','desc').limit(12).get();
    const list=document.getElementById('wt-hof-list');
    if(snap.empty){list.innerHTML='<div style="text-align:center;color:var(--text-dim);font-size:.85rem;">No champions yet. Be the first! 🏆</div>';return;}
    list.innerHTML=snap.docs.map((d,i)=>{
      const t=d.data(), ch=t.winners?.first; if(!ch) return '';
      return `<div style="background:rgba(255,255,255,.05);border:1px solid ${i===0?'rgba(200,160,40,.4)':'var(--border2,rgba(255,255,255,.1))'};border-radius:10px;padding:.7rem .9rem;display:flex;align-items:center;gap:.7rem;">
        <div style="font-size:1.5rem;">${i===0?'👑':'🏆'}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:700;color:var(--text);font-size:.92rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escHtmlWT(ch.name||'—')}</div>
          <div style="font-size:.72rem;color:var(--text-dim);">${t.date||''} · ${t.players||'?'} players</div>
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <div style="color:var(--gold,#c8a028);font-weight:700;font-size:.85rem;">${ch.score||0} pts</div>
          <div style="font-size:.7rem;color:var(--text-dim);">ELO ${ch.elo||'—'}</div>
        </div>
      </div>`;
    }).join('');
  }catch(e){document.getElementById('wt-hof-list').innerHTML='<div style="color:var(--text-dim);text-align:center;font-size:.85rem;">Failed to load.</div>';}
}

/* ── MATCH HISTORY ─────────────────────────────────────────── */
async function loadMatchHistory(){
  const el=document.getElementById('wt-history-list'); if(!el||!isFirebaseReady()||!wt.tourneyId) return;
  const uid=getMyUid(); if(!uid) return;
  el.innerHTML='<div style="color:var(--text-dim);font-size:.8rem;text-align:center;padding:.5rem;">Loading…</div>';
  try{
    const history=[];
    for(let r=1;r<=wt.currentRound;r++){
      const snap=await wtMatches(r).get();
      snap.docs.forEach(d=>{
        const m=d.data();
        if(m.white===uid||m.black===uid){
          const amW=m.white===uid, oppName=amW?m.blackName:m.whiteName;
          let res='–', col='var(--text-dim)';
          if(m.result){
            if(m.result==='1/2-1/2'){res='½';col='var(--gold,#c8a028)';}
            else if(m.bye){res='BYE';col='#6dcc8a';}
            else if((m.result==='1-0'&&amW)||(m.result==='0-1'&&!amW)){res='W';col='#6dcc8a';}
            else{res='L';col='#e06060';}
          }
          history.push({round:r,oppName,res,col});
        }
      });
    }
    if(!history.length){el.innerHTML='<div style="color:var(--text-dim);font-size:.8rem;text-align:center;padding:.5rem;">No matches yet.</div>';return;}
    el.innerHTML=history.map(h=>`<div style="display:flex;align-items:center;gap:.5rem;padding:.3rem .4rem;border-radius:6px;background:rgba(255,255,255,.04);">
      <span style="font-size:.72rem;color:var(--text-dim);flex-shrink:0;min-width:20px;">R${h.round}</span>
      <span style="flex:1;font-size:.8rem;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escHtmlWT(h.oppName||'Bye')}</span>
      <span style="font-weight:700;font-size:.85rem;color:${h.col};flex-shrink:0;">${h.res}</span>
    </div>`).join('');
  }catch(e){el.innerHTML='<div style="color:var(--text-dim);font-size:.8rem;text-align:center;">Failed.</div>';}
}

/* ── TOURNAMENT DIRECTOR ───────────────────────────────────── */
async function tryBecomeDirector(){
  if(!isFirebaseReady()) return false;
  try{
    let became=false;
    await db.runTransaction(async tx=>{
      const snap=await tx.get(wtDoc()); if(!snap.exists) return;
      if(!snap.data().director){tx.update(wtDoc(),{director:getMyUid(),directorSince:Date.now()});became=true;}
    }); return became;
  }catch(e){return false;}
}
async function directorStartRound(){
  const snap=await wtDoc().get(), data=snap.data();
  if(!data||data.status!=='active') return;
  const round=data.currentRound+1;
  const pSnap=await wtPlayers().where('status','!=','withdrew').get();
  const players=pSnap.docs.map(d=>d.data()); if(players.length<2) return;
  const prevMatches=new Set();
  for(let r=1;r<round;r++){
    const mSnap=await wtMatches(r).get();
    mSnap.docs.forEach(d=>{const m=d.data();if(m.white&&m.black)prevMatches.add([m.white,m.black].sort().join('_'));});
  }
  const pairs=swissPair(players,prevMatches), batch=db.batch(), now=Date.now(), toutAt=now+WT.ROUND_TIME;
  pairs.forEach((pair,idx)=>{
    const matchId=`match_${idx+1}`, mRef=wtMatches(round).doc(matchId);
    if(pair.bye){
      batch.set(mRef,{white:pair.white.uid,black:null,bye:true,result:'bye',resolvedAt:now});
      batch.update(wtPlayers().doc(pair.white.uid),{score:firebase.firestore.FieldValue.increment(1)});
    }else{
      const code=getRoomCode(pair.white.uid,pair.black.uid,round);
      batch.set(mRef,{white:pair.white.uid,whiteName:pair.white.name,black:pair.black.uid,blackName:pair.black.name,
        roomCode:code,result:null,whiteReport:null,blackReport:null,startedAt:now,timeoutAt:toutAt});
    }
  });
  batch.update(wtDoc(),{currentRound:round,totalRounds:calcRounds(players.length),roundStartedAt:now});
  await batch.commit(); scheduleRoundTimeout(toutAt);
}
async function directorCheckRoundComplete(){
  const snap=await wtDoc().get(), data=snap.data();
  if(!data||data.status!=='active') return;
  const round=data.currentRound, mSnap=await wtMatches(round).get();
  const pending=mSnap.docs.map(d=>d.data()).filter(m=>!m.bye&&!m.result);
  if(pending.length===0){
    if(round>=data.totalRounds) await finalizeTournament();
    else{setTimeout(directorStartRound,30000);showWTNotif(`✅ Round ${round} done! Next in 30s…`,'success');}
  }
}
function scheduleRoundTimeout(toutAt){
  clearTimeout(wt.matchTimeout);
  const d=toutAt-Date.now(); if(d>0) wt.matchTimeout=setTimeout(forfeitTimedOutMatches,d+5000);
}
async function forfeitTimedOutMatches(){
  const snap=await wtDoc().get(), data=snap.data(); if(!data) return;
  const mSnap=await wtMatches(data.currentRound).where('result','==',null).get();
  const batch=db.batch();
  mSnap.docs.forEach(d=>{
    const m=d.data();
    batch.update(d.ref,{result:'1/2-1/2',forfeit:true,resolvedAt:Date.now()});
    batch.update(wtPlayers().doc(m.white),{score:firebase.firestore.FieldValue.increment(0.5)});
    batch.update(wtPlayers().doc(m.black),{score:firebase.firestore.FieldValue.increment(0.5)});
  }); await batch.commit(); directorCheckRoundComplete();
}

/* ── JOIN MATCH ────────────────────────────────────────────── */
async function joinMyTourneyMatch(){
  if(!wt.myMatch){showWTNotif('No match yet.','info');return;}
  const match=wt.myMatch, myUid=getMyUid(), amWhite=match.white===myUid;
  wt.matchStartedAt=Date.now(); closeWTModal();
  if(amWhite){
    if(document.getElementById('room-code-display')) document.getElementById('room-code-display').textContent=match.roomCode;
    if(typeof doCreateRoom==='function'){const i=document.getElementById('create-room-code');if(i)i.value=match.roomCode;doCreateRoom(match.roomCode);}
    showWTNotif(`🎮 Room created! Waiting for ${match.blackName}…`,'info');
  }else{
    if(typeof doJoinRoom==='function'){const i=document.getElementById('join-room-input');if(i)i.value=match.roomCode;doJoinRoom(match.roomCode);}
    showWTNotif(`🎮 Joining ${match.whiteName}'s room…`,'info');
  }
}

/* ── REPORT RESULT ─────────────────────────────────────────── */
async function reportTourneyResult(gameResult){
  if(!isFirebaseReady()||!wt.tourneyId||!wt.myMatch) return;
  const suspicious=checkAntiCheat(gameResult,wt.matchStartedAt);
  const round=wt.currentRound, myUid=getMyUid(), match=wt.myMatch;
  const amWhite=match.white===myUid, field=amWhite?'whiteReport':'blackReport';
  try{
    const mRef=wtMatches(round).doc(match.matchId);
    await mRef.update({[field]:gameResult,[`${field}At`]:Date.now(),[`${field}Suspicious`]:suspicious});
    const mSnap=await mRef.get(), mData=mSnap.data();
    if(mData.whiteReport&&mData.blackReport){
      const result=mData.whiteReport===mData.blackReport?mData.whiteReport:mData.whiteReport;
      await mRef.update({result,confirmedAt:Date.now()});
      const batch=db.batch();
      if(result==='1-0'){
        batch.update(wtPlayers().doc(match.white),{score:firebase.firestore.FieldValue.increment(1),wins:firebase.firestore.FieldValue.increment(1)});
        addCoinsIfMe(match.white,WT.COINS.win); addXPIfMe(match.white,WT.XP.win);
      }else if(result==='0-1'){
        batch.update(wtPlayers().doc(match.black),{score:firebase.firestore.FieldValue.increment(1),wins:firebase.firestore.FieldValue.increment(1)});
        addCoinsIfMe(match.black,WT.COINS.win); addXPIfMe(match.black,WT.XP.win);
      }else{
        batch.update(wtPlayers().doc(match.white),{score:firebase.firestore.FieldValue.increment(0.5),draws:firebase.firestore.FieldValue.increment(1)});
        batch.update(wtPlayers().doc(match.black),{score:firebase.firestore.FieldValue.increment(0.5),draws:firebase.firestore.FieldValue.increment(1)});
        addCoinsIfMe(match.white,WT.COINS.draw); addXPIfMe(match.white,WT.XP.draw);
        addCoinsIfMe(match.black,WT.COINS.draw); addXPIfMe(match.black,WT.XP.draw);
      }
      await batch.commit();
      trackWinStreak(result); checkWTAchievements(result);
      if(wt.isDirector) setTimeout(directorCheckRoundComplete,2000);
    }
  }catch(e){console.error('Result report failed',e);}
}
function addCoinsIfMe(uid,n){if(uid===getMyUid())addCoins(n);}
function addXPIfMe(uid,n){if(uid===getMyUid())addXP(n);}

/* ── FINALIZE ──────────────────────────────────────────────── */
async function finalizeTournament(){
  const pSnap=await wtPlayers().orderBy('score','desc').orderBy('elo','desc').limit(10).get();
  const top=pSnap.docs.map(d=>d.data());
  const prizes=[
    {place:1,coins:WT.COINS.first, xp:WT.XP.first, badge:'🏆',name:'Weekly Champion',achId:'wt_champion'},
    {place:2,coins:WT.COINS.second,xp:WT.XP.second,badge:'🥈',name:'Runner-up',       achId:'wt_runnerup'},
    {place:3,coins:WT.COINS.third, xp:WT.XP.third, badge:'🥉',name:'Third Place',     achId:'wt_third'}
  ];
  const myUid=getMyUid(), myRank=top.findIndex(p=>p.uid===myUid)+1;
  await wtDoc().update({status:'finished',winners:{first:top[0]||null,second:top[1]||null,third:top[2]||null},finishedAt:Date.now()});
  prizes.forEach(prize=>{
    const pl=top[prize.place-1];
    if(pl&&pl.uid===myUid){
      addCoins(prize.coins); addXP(prize.xp); awardTourneyBadge(prize.achId,prize.badge,prize.name);
      if(prize.place===1){localStorage.setItem('wt_champion_frame','1');localStorage.setItem('wt_current_champion',pl.name);}
    }
  });
  try{
    await db.collection('tournamentHistory').add({
      tourneyId:wt.tourneyId,
      date:new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}),
      players:top.length, winners:{first:top[0]||null,second:top[1]||null,third:top[2]||null}
    });
  }catch(e){}
  wt.status='finished'; renderWTLobby(); showTournamentResult(top,myRank);
}
function awardTourneyBadge(achId,icon,name){
  const badges=JSON.parse(localStorage.getItem('cm_achievements')||'[]');
  if(!badges.includes(achId)){
    badges.push(achId); localStorage.setItem('cm_achievements',JSON.stringify(badges));
    if(typeof showAchievementToast==='function') showAchievementToast({id:achId,icon,name,desc:'Weekly Tournament Award'});
  }
}

/* ── SUBSCRIPTION ──────────────────────────────────────────── */
function subscribeToTournament(){
  unsubscribeListeners(); if(!isFirebaseReady()||!wt.tourneyId) return;
  const u1=wtDoc().onSnapshot(snap=>{
    if(!snap.exists) return; const data=snap.data();
    wt.status=data.status; wt.currentRound=data.currentRound||0; wt.totalRounds=data.totalRounds||5;
    wt.timeControl=data.timeControl||'blitz3'; wt.maxPlayers=data.maxPlayers||64;
    updateWTStatusBar(data);
    if(data.status==='registration'&&data.director===getMyUid()&&Date.now()>=data.startTime) autoStartTournament(data);
    if(data.status==='active'){subscribeToMyMatch();subscribeToStandings();}
    if(data.status==='finished') renderWTLobby();
  }); wt.listeners.push(u1);
  subscribeToWTChat();
}
function subscribeToStandings(){
  const u2=wtPlayers().orderBy('score','desc').orderBy('elo','desc').onSnapshot(snap=>{
    wt.standings=snap.docs.map(d=>d.data()); renderStandings();
    const myUid=getMyUid();
    if(myUid){
      const rank=wt.standings.findIndex(p=>p.uid===myUid)+1;
      const el=document.getElementById('wt-my-rank'); if(el) el.textContent=rank?`#${rank} of ${wt.standings.length}`:'–';
    }
  }); wt.listeners.push(u2);
}
function subscribeToMyMatch(){
  const uid=getMyUid(), round=wt.currentRound; if(!round||!uid) return;
  const u3=wtMatches(round).where('white','==',uid).onSnapshot(snap=>{
    snap.docs.forEach(d=>{wt.myMatch={...d.data(),matchId:d.id};updateMyMatchUI();});
  });
  const u4=wtMatches(round).where('black','==',uid).onSnapshot(snap=>{
    snap.docs.forEach(d=>{wt.myMatch={...d.data(),matchId:d.id};updateMyMatchUI();});
  });
  wt.listeners.push(u3,u4);
}
function unsubscribeListeners(){
  wt.listeners.forEach(u=>{try{u();}catch(e){}});wt.listeners=[];
  if(wt.chatUnsub){try{wt.chatUnsub();}catch(e){}wt.chatUnsub=null;}
}

/* ── AUTO-START ────────────────────────────────────────────── */
async function autoStartTournament(data){
  const pSnap=await wtPlayers().where('status','==','registered').get();
  if(pSnap.size<WT.MIN_PLAYERS){showWTNotif(`⚠️ Only ${pSnap.size} players — need ${WT.MIN_PLAYERS}.`,'warn');return;}
  await wtDoc().update({status:'active',totalRounds:calcRounds(pSnap.size)});
  wt.isDirector=true; setTimeout(directorStartRound,3000);
  showWTNotif(`🏆 Tournament started! ${pSnap.size} players`,'success');
}

/* ── COUNTDOWN ─────────────────────────────────────────────── */
function startCountdown(){
  clearInterval(wt.countdown);
  const el=document.getElementById('wt-countdown'); if(!el) return;
  const tick=()=>{
    const diff=getNextTournamentTime().getTime()-Date.now();
    if(diff<=0){el.textContent='🔔 Starts now!';clearInterval(wt.countdown);openRegistration();return;}
    const h=Math.floor(diff/3600000),m=Math.floor((diff%3600000)/60000),s=Math.floor((diff%60000)/1000);
    el.textContent=`${h}h ${m}m ${s}s`;
    if(diff<=WT.REG_OPEN&&wt.status==='scheduled') openRegistration();
  };
  tick(); wt.countdown=setInterval(tick,1000);
}
async function openRegistration(){
  if(!isFirebaseReady()) return; wt.tourneyId=getTourneyId();
  const snap=await wtDoc().get();
  if(!snap.exists||snap.data().status==='scheduled'){
    await wtDoc().set({status:'registration',startTime:getNextTournamentTime().getTime(),
      currentRound:0,totalRounds:5,timeControl:wt.timeControl,maxPlayers:wt.maxPlayers,createdAt:Date.now()},{merge:true});
  }
  wt.status='registration'; renderWTLobby(); showWTNotif('🎉 Registration is now open!','success');
}

/* ── OPEN / CLOSE MODAL ────────────────────────────────────── */
function openWeeklyTournament(){
  wt.tourneyId=getTourneyId();
  if(!document.getElementById('wt-modal')) injectWTModal();
  document.getElementById('wt-modal')?.classList.add('show');
  wt.winStreak=parseInt(localStorage.getItem('wt_win_streak')||'0');
  renderWTLobby(); startCountdown();
  if(isFirebaseReady()) subscribeToTournament();
  else showWTNotif('⚠️ Firebase chahiye.','warn');
}
function closeWTModal(){document.getElementById('wt-modal')?.classList.remove('show');}

/* ── LOBBY RENDER ──────────────────────────────────────────── */
function renderWTLobby(){
  const content=document.getElementById('wt-content'); if(!content) return;
  const dateStr=getNextTournamentTime().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'});
  const tc=WT.TC[wt.timeControl]||WT.TC.blitz3;
  const isReg=wt.status==='registration', signedIn=isSignedIn();

  if(wt.status==='scheduled'||isReg){
    content.innerHTML=`
      <div class="wt-schedule">
        <div class="wt-date">📅 ${dateStr} · 8:00 PM IST</div>
        <div class="wt-timer-row">
          <span style="color:var(--text-dim);font-size:.8rem;">${isReg?'🟢 Registration Open!':'Next tournament in:'}</span>
          <span id="wt-countdown" class="wt-countdown">—</span>
        </div>
      </div>
      <div class="wt-info-grid">
        <div class="wt-info-tile">🎯<br><strong>Swiss</strong><br><span>Pairing</span></div>
        <div class="wt-info-tile">⚡<br><strong>5-7</strong><br><span>Rounds</span></div>
        <div class="wt-info-tile">⏱<br><strong>${tc.label}</strong><br><span>Time</span></div>
        <div class="wt-info-tile">👥<br><strong>${wt.maxPlayers}</strong><br><span>Max</span></div>
      </div>
      <div class="wt-prizes">
        <div class="wt-prize-row"><span class="prize-badge">🥇 1st</span><span class="prize-coins">100🪙 + 500XP + Champion Frame + Badge</span></div>
        <div class="wt-prize-row"><span class="prize-badge">🥈 2nd</span><span class="prize-coins">60🪙 + 250XP + Runner-up Badge</span></div>
        <div class="wt-prize-row"><span class="prize-badge">🥉 3rd</span><span class="prize-coins">30🪙 + 100XP + Third Place Badge</span></div>
        <div class="wt-prize-row"><span class="prize-badge">⚔️ Win</span><span class="prize-coins">10🪙 + 30XP · Draw: 5🪙 + 10XP</span></div>
      </div>
      ${isReg?(signedIn?`
        <div class="wt-players-waiting" id="wt-waiting-count">👥 Loading…</div>
        <button class="btn btn-primary wt-big-btn" onclick="registerForWeeklyTournament()">🏆 Register Now</button>
        <button class="btn" style="width:100%;margin-top:.4rem;" onclick="withdrawFromTournament()">Withdraw</button>
      `:`
        <div class="wt-players-waiting" id="wt-waiting-count">👥 Loading…</div>
        <div style="background:rgba(200,160,40,.1);border:1px solid rgba(200,160,40,.3);border-radius:10px;padding:.8rem;text-align:center;margin:.4rem 0;">
          <div style="font-size:.85rem;color:var(--gold,#c8a028);font-weight:700;margin-bottom:.3rem;">🔑 Sign In Required</div>
          <div style="font-size:.78rem;color:var(--text-dim,#888);margin-bottom:.6rem;">Tournament sirf signed-in users ke liye. Guest play allowed nahi.</div>
          <button class="btn btn-primary" style="width:100%;padding:.55rem;" onclick="closeWTModal();openLoginModal()">🔑 Sign In to Register</button>
        </div>
      `):`
        <div style="color:var(--text-dim);font-size:.8rem;text-align:center;margin:.8rem 0;">Registration opens 30 min before start.</div>
        <button class="btn btn-primary wt-big-btn" disabled>⏳ Not Open Yet</button>
      `}
      <div style="display:flex;gap:.4rem;margin-top:.6rem;">
        <button class="btn" style="flex:1;font-size:.78rem;" onclick="openHallOfFame()">🏛️ Hall of Fame</button>
        <button class="btn" style="flex:1;font-size:.78rem;" onclick="openKnockoutTournament()">⚔️ Knockout</button>
      </div>`;
    if(isReg) loadWaitingCount();
    startCountdown();
  }else if(wt.status==='active'){
    renderActiveTournament();
  }else if(wt.status==='finished'){
    renderFinishedTournament();
  }
}
async function loadWaitingCount(){
  if(!isFirebaseReady()||!wt.tourneyId) return;
  const snap=await wtPlayers().where('status','==','registered').get();
  const el=document.getElementById('wt-waiting-count');
  if(el) el.textContent=`👥 ${snap.size} / ${wt.maxPlayers} players registered`;
}

/* ── ACTIVE TOURNAMENT ─────────────────────────────────────── */
function renderActiveTournament(){
  const content=document.getElementById('wt-content'); if(!content) return;
  const m=wt.myMatch, tc=WT.TC[wt.timeControl]||WT.TC.blitz3, streak=wt.winStreak;
  const matchHtml=m&&!m.result?`
    <div class="wt-match-card">
      <div class="wt-match-title">⚔️ Your Match ${streak>=3?`<span class="wt-streak-badge">🔥 ${streak} streak</span>`:''}</div>
      <div class="wt-match-players">
        <span class="wt-match-p">♔ ${escHtmlWT(m.whiteName)}</span>
        <span class="wt-match-vs">VS</span>
        <span class="wt-match-p">♚ ${escHtmlWT(m.blackName)}</span>
      </div>
      <div style="font-size:.72rem;color:var(--text-dim);text-align:center;margin:.25rem 0;">⏱ ${tc.label}</div>
      <button class="btn btn-primary" style="width:100%;margin-top:.4rem;" onclick="joinMyTourneyMatch()">▶ Join Game</button>
    </div>`:
    m?.result?`<div class="wt-match-card" style="border-color:rgba(109,204,138,.4);">✅ Round ${wt.currentRound} complete!</div>`:
    `<div class="wt-match-card">⏳ Waiting for round ${wt.currentRound} pairings…</div>`;

  content.innerHTML=`
    <div class="wt-active-header">
      <div class="wt-round-badge">🏆 Round <strong id="wt-round-lbl">${wt.currentRound}</strong>/<span id="wt-total-lbl">${wt.totalRounds}</span></div>
      <div class="wt-my-rank-badge">Rank: <strong id="wt-my-rank">—</strong></div>
      <div class="wt-rounds-left-badge">⏳ ${wt.totalRounds-wt.currentRound} left</div>
    </div>
    <div class="wt-stats-strip">
      <span class="wt-stat-pill wt-stat-w">W ${wt.myStats.wins}</span>
      <span class="wt-stat-pill wt-stat-d">D ${wt.myStats.draws}</span>
      <span class="wt-stat-pill wt-stat-l">L ${wt.myStats.losses}</span>
      ${streak>=3?`<span class="wt-stat-pill wt-stat-streak">🔥${streak}</span>`:''}
    </div>
    ${matchHtml}
    <div class="wt-tabs">
      <button class="wt-tab active" onclick="wtTabSwitch(this,'wt-tab-standings')">📊</button>
      <button class="wt-tab" onclick="wtTabSwitch(this,'wt-tab-live')">👁 Live</button>
      <button class="wt-tab" onclick="wtTabSwitch(this,'wt-tab-history');loadMatchHistory()">📜</button>
      <button class="wt-tab" onclick="wtTabSwitch(this,'wt-tab-chat')">💬 Chat</button>
    </div>
    <div id="wt-tab-standings" class="wt-tab-panel" style="display:block;">
      <div id="wt-standings-list" class="wt-standings-list"></div>
    </div>
    <div id="wt-tab-live" class="wt-tab-panel" style="display:none;">
      <div style="display:flex;justify-content:flex-end;margin-bottom:.3rem;">
        <button onclick="loadLiveMatches()" style="background:none;border:1px solid rgba(255,255,255,.15);border-radius:6px;padding:.2rem .5rem;font-size:.72rem;color:var(--text-dim);cursor:pointer;">🔄 Refresh</button>
      </div>
      <div id="wt-live-matches" class="wt-live-matches-list"><div style="color:var(--text-dim);font-size:.85rem;text-align:center;padding:.5rem;">Loading…</div></div>
    </div>
    <div id="wt-tab-history" class="wt-tab-panel" style="display:none;">
      <div id="wt-history-list" style="display:flex;flex-direction:column;gap:.3rem;"></div>
    </div>
    <div id="wt-tab-chat" class="wt-tab-panel" style="display:none;">
      <div id="wt-chat-msgs" class="wt-chat-msgs"></div>
      <div class="wt-chat-bar">
        <input id="wt-chat-input" class="wt-chat-input" placeholder="Message…" maxlength="200" onkeydown="if(event.key==='Enter')sendWTChat()">
        <button class="btn wt-chat-send" onclick="sendWTChat()">▶</button>
      </div>
    </div>
    <button class="btn" style="width:100%;margin-top:.8rem;" onclick="closeWTModal()">Close (tournament continues)</button>`;
  renderStandings(); loadLiveMatches();
  if(wt.chatMessages.length) renderWTChat();
}
function wtTabSwitch(btn,panelId){
  document.querySelectorAll('.wt-tab').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.wt-tab-panel').forEach(p=>p.style.display='none');
  btn.classList.add('active');
  const p=document.getElementById(panelId); if(p) p.style.display='block';
  if(panelId==='wt-tab-chat') renderWTChat();
}
function renderStandings(){
  const el=document.getElementById('wt-standings-list'); if(!el||!wt.standings.length) return;
  const myUid=getMyUid();
  el.innerHTML=wt.standings.slice(0,15).map((p,i)=>{
    const flag=(p.countryCode&&typeof countryCodeToFlag==='function')?`<span class="wt-flag">${countryCodeToFlag(p.countryCode)}</span> `:'';
    return `<div class="wt-standing-row ${p.uid===myUid?'wt-me':''}">
      <span class="wt-rank">${i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</span>
      <span class="wt-sname wt-name-link" onclick="showPlayerProfile(${JSON.stringify(JSON.stringify(p))})">${flag}${escHtmlWT(p.name)}</span>
      <span class="wt-wdl">${p.wins||0}W${p.draws||0}D</span>
      <span class="wt-sscore"><strong>${p.score}</strong></span>
    </div>`;
  }).join('');
}

/* ── FINISHED TOURNAMENT ───────────────────────────────────── */
function renderFinishedTournament(){
  const content=document.getElementById('wt-content'); if(!content) return;
  const s=wt.standings, ch=s[0];
  content.innerHTML=`
    <div class="wt-finished-banner">🏁 Tournament Complete!</div>
    ${ch?`<div class="wt-champion-banner">
      <div class="wt-champ-crown">👑</div>
      <div class="wt-champ-name">${escHtmlWT(ch.name)}</div>
      <div class="wt-champ-sub">Weekly Champion · ${ch.score} pts · ELO ${ch.elo}</div>
    </div>`:''}
    <div class="wt-podium">
      ${s[1]?`<div class="wt-podium-step second"><div class="pod-icon">🥈</div><div class="pod-name">${escHtmlWT(s[1].name)}</div><div class="pod-score">${s[1].score} pts</div></div>`:''}
      ${s[0]?`<div class="wt-podium-step first"><div class="pod-icon">🥇</div><div class="pod-name">${escHtmlWT(s[0].name)}</div><div class="pod-score">${s[0].score} pts</div></div>`:''}
      ${s[2]?`<div class="wt-podium-step third"><div class="pod-icon">🥉</div><div class="pod-name">${escHtmlWT(s[2].name)}</div><div class="pod-score">${s[2].score} pts</div></div>`:''}
    </div>
    <div class="wt-section-title">Final Standings</div>
    <div id="wt-standings-list" class="wt-standings-list"></div>
    <div style="display:flex;gap:.4rem;margin-top:.8rem;">
      <button class="btn btn-primary" style="flex:1;" onclick="closeWTModal()">Close</button>
      <button class="btn" style="flex:1;font-size:.8rem;" onclick="openHallOfFame()">🏛️ Hall of Fame</button>
    </div>`;
  renderStandings();
}
function showTournamentResult(top,myRank){
  const prizes={1:'🥇 Champion! +100🪙 +500XP',2:'🥈 Runner-up! +60🪙 +250XP',3:'🥉 Third! +30🪙 +100XP'};
  const msg=prizes[myRank]||(myRank?`Finished #${myRank}`:'Tournament finished!');
  setTimeout(()=>{showWTNotif(`🏁 ${msg}`,'success');openWeeklyTournament();},1500);
}

/* ── PLAYER PROFILE ────────────────────────────────────────── */
function showPlayerProfile(pJson){
  let p; try{p=JSON.parse(pJson);}catch(e){return;}
  document.getElementById('wt-profile-modal')?.remove();
  const wins=p.wins||0,draws=p.draws||0,losses=p.losses||0,played=wins+draws+losses;
  const winPct=played?Math.round((wins/played)*100):0;
  const isChamp=localStorage.getItem('wt_current_champion')===p.name;
  const overlay=document.createElement('div'); overlay.id='wt-profile-modal';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem;';
  overlay.innerHTML=`<div style="background:var(--bg-card,#1e1e2e);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:1.5rem;max-width:340px;width:100%;position:relative;box-shadow:0 20px 60px rgba(0,0,0,.6);">
    <button onclick="document.getElementById('wt-profile-modal').remove()" style="position:absolute;top:.8rem;right:.8rem;background:none;border:none;color:var(--text-dim);font-size:1.2rem;cursor:pointer;">✕</button>
    <div style="text-align:center;margin-bottom:1rem;">
      <div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,var(--accent,#6dcc8a),var(--gold,#c8a028));display:flex;align-items:center;justify-content:center;font-size:2rem;font-weight:700;color:#fff;margin:0 auto;border:3px solid ${isChamp?'#c8a028':'var(--gold,#c8a028)'};${isChamp?'box-shadow:0 0 16px rgba(200,160,40,.6)':''}">
        ${(p.name||'?')[0].toUpperCase()}
      </div>
      ${isChamp?`<div style="font-size:.68rem;font-weight:800;letter-spacing:.1em;color:var(--gold,#c8a028);margin-top:.25rem;">👑 WEEKLY CHAMPION</div>`:''}
      <div style="font-size:1.2rem;font-weight:700;margin-top:.4rem;">${escHtmlWT(p.name)}</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-bottom:.8rem;">
      <div style="background:rgba(255,255,255,.06);border-radius:10px;padding:.65rem;text-align:center;"><div style="font-size:1.3rem;font-weight:700;color:var(--gold,#c8a028);">${p.elo||1200}</div><div style="font-size:.72rem;color:var(--text-dim);">ELO</div></div>
      <div style="background:rgba(255,255,255,.06);border-radius:10px;padding:.65rem;text-align:center;"><div style="font-size:1.3rem;font-weight:700;color:var(--accent,#6dcc8a);">${p.score||0}</div><div style="font-size:.72rem;color:var(--text-dim);">Points</div></div>
      <div style="background:rgba(255,255,255,.06);border-radius:10px;padding:.65rem;text-align:center;"><div style="font-size:.95rem;font-weight:700;color:#6dcc8a;">${wins}W ${draws}D ${losses}L</div><div style="font-size:.72rem;color:var(--text-dim);">W/D/L</div></div>
      <div style="background:rgba(255,255,255,.06);border-radius:10px;padding:.65rem;text-align:center;"><div style="font-size:1.3rem;font-weight:700;">${winPct}%</div><div style="font-size:.72rem;color:var(--text-dim);">Win Rate</div></div>
    </div>
    <button onclick="document.getElementById('wt-profile-modal').remove()" style="width:100%;padding:.65rem;border-radius:10px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:var(--text);cursor:pointer;">Close</button>
  </div>`;
  overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
}

/* ── SPECTATOR ─────────────────────────────────────────────── */
let wtLiveMatches=[];
async function loadLiveMatches(){
  if(!isFirebaseReady()||!wt.tourneyId||!wt.currentRound) return;
  try{
    const snap=await wtMatches(wt.currentRound).get();
    wtLiveMatches=snap.docs.map(d=>({id:d.id,...d.data()})).filter(m=>!m.result);
    renderLiveMatchesList();
  }catch(e){wtLiveMatches=[];}
}
function renderLiveMatchesList(){
  const el=document.getElementById('wt-live-matches'); if(!el) return;
  if(!wtLiveMatches.length){el.innerHTML='<div style="color:var(--text-dim);font-size:.85rem;text-align:center;padding:.5rem;">No active matches.</div>';return;}
  el.innerHTML=wtLiveMatches.map(m=>`
    <div class="wt-live-match-row">
      <div class="wt-live-match-players">
        <span class="wt-lm-white">♔ ${escHtmlWT(m.whiteName||'?')}</span>
        <span class="wt-lm-vs">vs</span>
        <span class="wt-lm-black">♚ ${escHtmlWT(m.blackName||'?')}</span>
      </div>
      <button class="btn wt-watch-btn" onclick="watchLiveGame(${JSON.stringify(JSON.stringify(m))})">👁 Watch</button>
    </div>`).join('');
}
function watchLiveGame(mJson){
  let m; try{m=JSON.parse(mJson);}catch(e){return;}
  closeWTModal(); document.getElementById('wt-spectator-modal')?.remove();
  const overlay=document.createElement('div'); overlay.id='wt-spectator-modal';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:9998;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:1rem;overflow-y:auto;';
  overlay.innerHTML=`<div style="background:var(--bg-card,#1e1e2e);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:1.2rem;max-width:420px;width:100%;position:relative;">
    <button onclick="stopWatching()" style="position:absolute;top:.8rem;right:.8rem;background:none;border:none;color:var(--text-dim);font-size:1.2rem;cursor:pointer;">✕</button>
    <div style="text-align:center;margin-bottom:.8rem;">
      <div style="font-size:.75rem;color:var(--gold,#c8a028);font-weight:700;letter-spacing:.05em;">🔴 LIVE WATCH</div>
      <div style="font-size:1rem;font-weight:700;color:var(--text);margin-top:.3rem;">♔ ${escHtmlWT(m.whiteName||'?')} vs ♚ ${escHtmlWT(m.blackName||'?')}</div>
    </div>
    <canvas id="wt-spectator-canvas" width="360" height="360" style="width:100%;border-radius:8px;border:2px solid rgba(255,255,255,.1);display:block;margin:0 auto .6rem;"></canvas>
    <div id="wt-spectator-status" style="text-align:center;font-size:.8rem;color:var(--text-dim);margin-bottom:.4rem;">⏳ Connecting…</div>
    <div id="wt-spectator-moves" style="max-height:90px;overflow-y:auto;background:rgba(0,0,0,.3);border-radius:8px;padding:.5rem;font-size:.78rem;color:var(--text-dim);font-family:monospace;margin-bottom:.8rem;">…</div>
    <button onclick="stopWatching()" style="width:100%;padding:.65rem;border-radius:10px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:var(--text);cursor:pointer;">← Back</button>
  </div>`;
  document.body.appendChild(overlay); startSpectating(m);
}
let wtSpectatorUnsub=null;
function stopWatching(){if(wtSpectatorUnsub){try{wtSpectatorUnsub();}catch(e){}wtSpectatorUnsub=null;}document.getElementById('wt-spectator-modal')?.remove();}
function startSpectating(m){
  if(!isFirebaseReady()||!wt.tourneyId){const e=document.getElementById('wt-spectator-status');if(e)e.textContent='⚠️ Firebase needed.';return;}
  const matchRef=wtMatches(wt.currentRound).doc(m.id||m.matchId);
  drawSpectatorBoard('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQ - 0 1');
  wtSpectatorUnsub=matchRef.onSnapshot(snap=>{
    if(!snap.exists) return; const data=snap.data();
    const fen=data.liveFen||'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQ - 0 1';
    const moves=data.movesHistory||[];
    drawSpectatorBoard(fen);
    const se=document.getElementById('wt-spectator-status'); if(se) se.textContent=data.result?`✅ ${data.result}`:`🔴 Live · Move ${moves.length}`;
    const me=document.getElementById('wt-spectator-moves');
    if(me&&moves.length){const pairs=[];for(let i=0;i<moves.length;i+=2)pairs.push(`${Math.floor(i/2)+1}. ${moves[i]||''} ${moves[i+1]||''}`);me.textContent=pairs.join('  ');me.scrollTop=me.scrollHeight;}
  });
}
function drawSpectatorBoard(fen){
  const canvas=document.getElementById('wt-spectator-canvas'); if(!canvas) return;
  const ctx=canvas.getContext('2d'), SIZE=canvas.width, SQ=SIZE/8;
  const pm={'K':'♔','Q':'♕','R':'♖','B':'♗','N':'♘','P':'♙','k':'♚','q':'♛','r':'♜','b':'♝','n':'♞','p':'♟'};
  const board=fen.split(' ')[0].split('/').map(row=>{const r=[];for(const ch of row){if(/\d/.test(ch)){for(let i=0;i<+ch;i++)r.push('');}else r.push(ch);}return r;});
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){
    ctx.fillStyle=(r+c)%2===0?'#f0d9b5':'#b58863'; ctx.fillRect(c*SQ,r*SQ,SQ,SQ);
    const piece=board[r]?.[c]||'';
    if(piece){ctx.font=`bold ${SQ*.72}px serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=piece===piece.toLowerCase()?'#1a1a2e':'#fff';ctx.fillText(pm[piece]||piece,c*SQ+SQ/2,r*SQ+SQ/2);}
  }
}

/* ── STATUS BAR ────────────────────────────────────────────── */
function updateWTStatusBar(data){
  const bar=document.getElementById('wt-status-bar'); if(!bar) return;
  if(data.status==='active'){bar.style.display='flex';bar.textContent=`🏆 R${data.currentRound}/${data.totalRounds}`;}
  else bar.style.display='none';
}
function updateMyMatchUI(){
  const m=wt.myMatch; if(!m) return;
  const bar=document.getElementById('wt-match-alert'); if(!bar) return;
  if(!m.result){
    bar.style.display='flex'; const opp=m.white===getMyUid()?m.blackName:m.whiteName;
    bar.innerHTML=`⚔️ Your match vs ${escHtmlWT(opp)} is ready! <button class="btn" style="font-size:.72rem;padding:.15rem .5rem;" onclick="joinMyTourneyMatch()">Join</button>`;
  }else bar.style.display='none';
}

/* ── TOASTS ────────────────────────────────────────────────── */
// showCoinToast: level-system.js defines a duplicate (loaded after this file); both are
// identical so either version works — the latter wins at runtime.
function showCoinToast(n){
  const t=document.createElement('div'); t.className='coin-toast'; t.textContent=`+${n} 🪙`;
  document.body.appendChild(t); requestAnimationFrame(()=>t.classList.add('show'));
  setTimeout(()=>{t.classList.remove('show');setTimeout(()=>t.remove(),400);},2200);
}
function showXPToast(n){
  const t=document.createElement('div');
  t.style.cssText='position:fixed;bottom:3.5rem;left:50%;transform:translateX(-50%) translateY(4px);background:rgba(109,204,138,.18);border:1px solid rgba(109,204,138,.5);color:#6dcc8a;padding:.35rem .9rem;border-radius:20px;font-weight:700;font-size:.9rem;z-index:9999;opacity:0;transition:all .3s;pointer-events:none;';
  t.textContent=`+${n} XP ⬆`; document.body.appendChild(t);
  requestAnimationFrame(()=>{t.style.opacity='1';t.style.transform='translateX(-50%) translateY(-4px)';});
  setTimeout(()=>{t.style.opacity='0';setTimeout(()=>t.remove(),400);},2200);
}

/* ── NOTIFICATIONS ─────────────────────────────────────────── */
function showWTNotif(msg,type='info'){
  const el=document.getElementById('wt-notif'); if(!el) return;
  el.textContent=msg; el.className='wt-notif wt-notif-'+type+' show';
  clearTimeout(el._t); el._t=setTimeout(()=>el.classList.remove('show'),4000);
}

/* ── ENGINE HOOKS ──────────────────────────────────────────── */
function installWTHooks(){
  if(typeof checkState!=='function') return;
  const _cs=checkState; checkState=function(){
    _cs();
    if(!over||!wt.myMatch||!wt.tourneyId||wt.status!=='active') return;
    let result='1/2-1/2';
    if(typeof inCheck==='function'&&typeof turn!=='undefined'){
      if(inCheck(turn,board)&&typeof anyLegal==='function'&&!anyLegal(turn)) result=turn==='b'?'1-0':'0-1';
    }
    setTimeout(()=>reportTourneyResult(result),800);
  };
  if(typeof doMove==='function'){const _dm=doMove;doMove=function(from,to,prom){_dm(from,to,prom);wtPushLiveFen();};}
}
async function wtPushLiveFen(){
  if(!isFirebaseReady()||!wt.tourneyId||!wt.myMatch||wt.status!=='active') return;
  try{
    const fen=(typeof getFen==='function')?getFen():(typeof currentFen!=='undefined'?currentFen:null);
    if(!fen) return;
    const mRef=wtMatches(wt.currentRound).doc(wt.myMatch.matchId);
    const upd={liveFen:fen,lastMoveAt:Date.now()};
    if(typeof moveHistory!=='undefined'&&Array.isArray(moveHistory)) upd.movesHistory=moveHistory.slice(-60);
    await mRef.update(upd);
  }catch(e){}
}

/* ── INJECT MODAL ──────────────────────────────────────────── */
function injectWTModal(){
  if(!document.getElementById('wt-status-bar')){
    const bar=document.createElement('div'); bar.id='wt-status-bar'; bar.className='wt-status-bar'; bar.style.display='none';
    bar.setAttribute('onclick','openWeeklyTournament()'); bar.style.cursor='pointer'; document.body.appendChild(bar);
  }
  if(!document.getElementById('wt-match-alert')){
    const a=document.createElement('div'); a.id='wt-match-alert'; a.className='wt-match-alert'; a.style.display='none';
    document.querySelector('.feat-bar')?.insertAdjacentElement('beforebegin',a);
  }
  if(!document.getElementById('wt-notif')){
    const n=document.createElement('div'); n.id='wt-notif'; n.className='wt-notif'; document.body.appendChild(n);
  }
  const modal=document.createElement('div'); modal.id='wt-modal'; modal.className='upgrade-overlay';
  modal.innerHTML=`<div class="upgrade-box upgrade-box-wide wt-box">
    <div class="wt-header">
      <div>
        <div class="upgrade-title" style="margin-bottom:.1rem;">🏆 Weekly Sunday Tournament</div>
        <div style="font-size:.72rem;color:var(--text-dim);">Har Sunday 8 PM IST · Swiss · Sign-in Required</div>
      </div>
      <div style="text-align:right;">
        <div class="wt-coins-display">🪙 <span class="coin-count">${getCoins()}</span></div>
        <div style="font-size:.68rem;color:var(--text-dim);margin-top:.15rem;">⬆ ${getXP()} XP</div>
      </div>
    </div>
    <div id="wt-content"></div>
    <button class="btn" style="width:100%;margin-top:.6rem;" onclick="closeWTModal()">✕ Close</button>
  </div>`;
  document.body.appendChild(modal);
}

/* ── BUTTONS ───────────────────────────────────────────────── */
function addWTButtonToHub(){
  const hg=document.querySelector('.hub-grid');
  if(hg&&!document.getElementById('wt-hub-btn')){
    const b=document.createElement('button'); b.id='wt-hub-btn'; b.className='hub-btn';
    b.innerHTML='🏆 Weekly Tournament'; b.setAttribute('onclick','closeFeatureHub?.();openWeeklyTournament()');
    hg.insertBefore(b,hg.firstChild);
  }
  const fb2=document.getElementById('feat-bar-2');
  if(fb2&&!document.getElementById('wt-feat-btn')){
    const b=document.createElement('button'); b.id='wt-feat-btn'; b.className='feat-btn';
    b.style.cssText='border-color:rgba(200,160,40,.5);color:var(--gold);font-weight:700;';
    b.textContent='🏆 Tournament'; b.setAttribute('onclick','openWeeklyTournament()');
    fb2.insertBefore(b,fb2.firstChild);
  }
}

/* ── INIT ──────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded',()=>{
  setTimeout(()=>{
    injectWTModal(); addWTButtonToHub(); installWTHooks(); updateCoinBadge();
    wt.winStreak=parseInt(localStorage.getItem('wt_win_streak')||'0');
    if(isFirebaseReady()){wt.tourneyId=getTourneyId();subscribeToTournament();}
    console.log('[ChessArena] Weekly Tournament v2.0 loaded ✓');
  },600);
});
