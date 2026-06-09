/* ═══════════════════════════════════════════════════════════════
   ChessArena — Knockout Tournament  ⚔️🏆  v1.0
   ──────────────────────────────────────────────────────────────
   Single-elimination bracket · 64 / 128 / 256 players
   Sign-in REQUIRED · Firebase synced · ELO-seeded
   Bullet / Blitz / Rapid · Chat · Spectator · Rewards
═══════════════════════════════════════════════════════════════ */

/* ── CONSTANTS ─────────────────────────────────────────────── */
const KT = {
  SLOTS     : [64, 128, 256],
  JOIN_TIME : 5  * 60000,
  ROUND_WAIT: 45 * 1000,
  TC: {
    bullet : { label:'Bullet 1+0',  min:1,  inc:0 },
    blitz  : { label:'Blitz 3+0',   min:3,  inc:0 },
    rapid  : { label:'Rapid 10+0',  min:10, inc:0 }
  },
  COINS: { champion:200, runnerup:100, semi:50, quarter:25, r16:15, win:10, participate:5 },
  XP   : { champion:500, runnerup:200, semi:100, quarter:50, win:20, participate:10 },
  ROUND_NAMES: { 1:'R1', 2:'R2', 3:'R3', 4:'R4', 5:'R5' },
  CHAT_LIMIT : 60
};

/* ── STATE ─────────────────────────────────────────────────── */
let kt = {
  id            : null,
  status        : 'idle',   // idle | registration | active | finished
  myUid         : null,
  myMatch       : null,
  currentRound  : 0,
  totalRounds   : 0,
  maxPlayers    : 64,
  timeControl   : 'blitz',
  players       : [],
  bracket       : {},       // { roundNum: [matchObj] }
  listeners     : [],
  chatUnsub     : null,
  countdown     : null,
  isDirector    : false,
  matchStartedAt: null,
  drawRematches : {},       // matchId -> count
  spectatorCount: 0
};

/* ── HELPERS ───────────────────────────────────────────────── */
function ktGetMyUid() {
  if (kt.myUid) return kt.myUid;
  const u = (typeof currentUser !== 'undefined') ? currentUser : null;
  if (u?.uid) { kt.myUid = u.uid; return u.uid; }
  return null;
}
function ktGetMyName() {
  const u = (typeof currentUser !== 'undefined') ? currentUser : null;
  return u?.displayName || localStorage.getItem('cm_username') || 'Player';
}
function ktGetMyElo()  { return typeof getElo === 'function' ? getElo() : 1200; }
function ktIsFirebase(){ return typeof db !== 'undefined' && db !== null; }
function ktIsSignedIn(){
  const u = (typeof currentUser !== 'undefined') ? currentUser : null;
  return !!(u && u.uid);
}
function ktEsc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function ktCalcRounds(n){ return Math.ceil(Math.log2(n)); }
function ktRoundName(round, total) {
  const left = total - round;
  if (left === 0) return 'Final';
  if (left === 1) return 'Semi-Final';
  if (left === 2) return 'Quarter-Final';
  if (left === 3) return 'Round of 16';
  return `Round ${round}`;
}
function ktGetRoomCode(uid1, uid2, round) {
  const key = ['kt', uid1, uid2].sort().join('') + round;
  let h = 5381;
  for (let i = 0; i < key.length; i++) h = ((h << 5) + h) ^ key.charCodeAt(i);
  return 'K' + Math.abs(h).toString(36).toUpperCase().slice(0,5).padStart(5,'0');
}

/* ── FIREBASE REFS ─────────────────────────────────────────── */
function ktDoc()       { return db.collection('knockoutTournaments').doc(kt.id); }
function ktPlayers()   { return ktDoc().collection('players'); }
function ktRound(r)    { return ktDoc().collection('rounds').doc(String(r)); }
function ktMatches(r)  { return ktRound(r).collection('matches'); }
function ktChatRef()   { return ktDoc().collection('chat'); }

/* ── GENERATE UNIQUE ID ────────────────────────────────────── */
function ktGenId() {
  const d = new Date();
  return `knockout_${kt.maxPlayers}_${d.toISOString().split('T')[0]}_${d.getHours()}${d.getMinutes()}`;
}

/* ── BRACKET SEEDING ───────────────────────────────────────── */
function ktSeedBracket(players) {
  // Sort by ELO descending, assign seeds 1..n
  const sorted = [...players].sort((a, b) => b.elo - a.elo).map((p, i) => ({ ...p, seed: i + 1 }));
  const n = sorted.length;
  const pairs = [];
  // Standard bracket: seed 1 vs seed n, seed 2 vs seed n-1, etc.
  for (let i = 0; i < n / 2; i++) {
    pairs.push({ white: sorted[i], black: sorted[n - 1 - i] });
  }
  return pairs;
}

/* ── NEXT ROUND PAIRING ────────────────────────────────────── */
async function ktGetWinnersOfRound(round) {
  const snap = await ktMatches(round).get();
  return snap.docs.map(d => d.data()).filter(m => m.result).map(m => {
    if (m.result === '1-0') return { uid: m.white, name: m.whiteName, elo: m.whiteElo || 1200, seed: m.whiteSeed || 99 };
    if (m.result === '0-1') return { uid: m.black, name: m.blackName, elo: m.blackElo || 1200, seed: m.blackSeed || 99 };
    // Draw → higher seed (lower number = better seed) wins
    return { uid: m.white, name: m.whiteName, elo: m.whiteElo || 1200, seed: m.whiteSeed || 99 };
  });
}

/* ── REGISTRATION ──────────────────────────────────────────── */
async function registerForKnockout() {
  if (!ktIsFirebase()) { alert('⚠️ Firebase not configured.'); return; }
  if (!ktIsSignedIn()) {
    showKTNotif('🔑 Sign In required for Knockout Tournament!', 'warn');
    _showKTSignInPrompt(); return;
  }
  const uid = ktGetMyUid(), name = ktGetMyName(), elo = ktGetMyElo();
  const country = (typeof detectMyCountry === 'function') ? detectMyCountry() : null;
  try {
    const snap = await ktDoc().get();
    if (!snap.exists || snap.data().status === 'idle') {
      await ktDoc().set({
        status: 'registration', maxPlayers: kt.maxPlayers,
        timeControl: kt.timeControl, currentRound: 0,
        totalRounds: ktCalcRounds(kt.maxPlayers), createdAt: Date.now(),
        spectatorCount: 0
      });
    }
    const data = snap.exists ? snap.data() : { status: 'registration', maxPlayers: kt.maxPlayers };
    if (data.status !== 'registration') { showKTNotif('Registration is closed.', 'warn'); return; }

    // Check if slots are full
    const pCount = await ktPlayers().where('status', '==', 'active').get();
    if (pCount.size >= kt.maxPlayers) {
      showKTNotif(`❌ Tournament is full! (${kt.maxPlayers} players)`, 'error'); return;
    }

    await ktPlayers().doc(uid).set({
      uid, name, elo, seed: 0, status: 'active',
      country: country || null, joinedAt: Date.now(),
      roundEliminated: null, wins: 0
    });
    addCoins(KT.COINS.participate);
    addXP(KT.XP.participate);
    kt.status = 'registration';
    showKTNotif('✅ Registered for Knockout Tournament!', 'success');
    renderKTLobby();
    ktSubscribeAll();
  } catch (e) {
    showKTNotif('❌ Registration failed: ' + e.message, 'error');
  }
}

function _showKTSignInPrompt() {
  const c = document.getElementById('kt-content'); if (!c) return;
  if (document.getElementById('kt-signin-prompt')) return;
  const d = document.createElement('div'); d.id = 'kt-signin-prompt';
  d.style.cssText = 'background:rgba(220,80,80,.08);border:1px solid rgba(220,80,80,.3);border-radius:12px;padding:1rem;text-align:center;margin-top:.8rem;';
  d.innerHTML = `<div style="font-size:1.1rem;margin-bottom:.3rem;">🔑</div>
    <div style="font-weight:700;color:#e07070;margin-bottom:.3rem;">Sign In Required</div>
    <div style="font-size:.82rem;color:var(--text-dim);margin-bottom:.8rem;">Knockout Tournament sirf registered users ke liye hai.</div>
    <button class="btn btn-primary" style="width:100%;padding:.6rem;" onclick="closeKTModal();openLoginModal()">🔑 Sign In / Register</button>`;
  c.appendChild(d);
}

async function withdrawFromKnockout() {
  if (!kt.id) return; const uid = ktGetMyUid(); if (!uid) return;
  try {
    await ktPlayers().doc(uid).update({ status: 'withdrew' });
    showKTNotif('Withdrawn from knockout tournament.', 'info');
    ktUnsubscribeAll(); closeKTModal();
  } catch (e) {}
}

/* ── DIRECTOR ──────────────────────────────────────────────── */
async function ktTryBecomeDirector() {
  if (!ktIsFirebase()) return false;
  try {
    let became = false;
    await db.runTransaction(async tx => {
      const snap = await tx.get(ktDoc()); if (!snap.exists) return;
      if (!snap.data().director) {
        tx.update(ktDoc(), { director: ktGetMyUid(), directorSince: Date.now() });
        became = true;
      }
    });
    return became;
  } catch (e) { return false; }
}

async function ktDirectorStartRound() {
  const snap = await ktDoc().get(); const data = snap.data();
  if (!data || data.status !== 'active') return;
  const round = data.currentRound + 1;
  let pairs = [];

  if (round === 1) {
    // Seed bracket by ELO
    const pSnap = await ktPlayers().where('status', '==', 'active').get();
    const players = pSnap.docs.map(d => d.data());
    if (players.length < 2) return;
    pairs = ktSeedBracket(players);
  } else {
    // Get winners from last round
    const winners = await ktGetWinnersOfRound(round - 1);
    if (winners.length < 2) { await ktFinalize(); return; }
    // Pair sequentially: winner[0] vs winner[1], winner[2] vs winner[3], etc.
    for (let i = 0; i < winners.length; i += 2) {
      if (winners[i + 1]) pairs.push({ white: winners[i], black: winners[i + 1] });
      else pairs.push({ white: winners[i], black: null, bye: true }); // odd player out
    }
  }

  const batch = db.batch(), now = Date.now(), toutAt = now + KT.JOIN_TIME * 2;
  pairs.forEach((pair, idx) => {
    const mid = `match_${idx + 1}`;
    const mRef = ktMatches(round).doc(mid);
    if (pair.bye) {
      batch.set(mRef, { white: pair.white.uid, whiteName: pair.white.name, whiteElo: pair.white.elo || 1200,
        whiteSeed: pair.white.seed || 0, black: null, bye: true, result: '1-0',
        resolvedAt: now });
    } else {
      const code = ktGetRoomCode(pair.white.uid, pair.black.uid, round);
      batch.set(mRef, {
        white: pair.white.uid, whiteName: pair.white.name, whiteElo: pair.white.elo || 1200, whiteSeed: pair.white.seed || 0,
        black: pair.black.uid, blackName: pair.black.name, blackElo: pair.black.elo || 1200, blackSeed: pair.black.seed || 0,
        roomCode: code, result: null,
        whiteReport: null, blackReport: null,
        startedAt: now, timeoutAt: toutAt, round,
        drawCount: 0
      });
    }
  });

  batch.update(ktDoc(), { currentRound: round, roundStartedAt: now, lastActivity: now });
  await batch.commit();
  ktScheduleTimeout(toutAt);
  showKTNotif(`⚔️ ${ktRoundName(round, data.totalRounds)} started! ${pairs.length} matches`, 'success');
}

async function ktDirectorCheckRoundComplete() {
  const snap = await ktDoc().get(); const data = snap.data();
  if (!data || data.status !== 'active') return;
  const mSnap = await ktMatches(data.currentRound).get();
  const pending = mSnap.docs.map(d => d.data()).filter(m => !m.result);
  if (pending.length === 0) {
    const winners = await ktGetWinnersOfRound(data.currentRound);
    if (winners.length <= 1) {
      await ktFinalize(); return;
    }
    if (data.currentRound >= data.totalRounds) {
      await ktFinalize(); return;
    }
    setTimeout(ktDirectorStartRound, KT.ROUND_WAIT);
    showKTNotif(`✅ Round ${data.currentRound} complete! Next round in ${KT.ROUND_WAIT/1000}s…`, 'success');
  }
}

function ktScheduleTimeout(toutAt) {
  const delay = toutAt - Date.now();
  if (delay > 0) setTimeout(ktForfeitTimedOut, delay + 5000);
}

async function ktForfeitTimedOut() {
  const snap = await ktDoc().get(); const data = snap.data(); if (!data) return;
  const mSnap = await ktMatches(data.currentRound).where('result', '==', null).get();
  const batch = db.batch();
  mSnap.docs.forEach(d => {
    const m = d.data();
    // Neither joined → higher seed (lower number) wins; if same, white wins
    const winner = (m.whiteSeed <= m.blackSeed) ? 'white' : 'black';
    const result = winner === 'white' ? '1-0' : '0-1';
    batch.update(d.ref, { result, forfeit: true, resolvedAt: Date.now() });
    if (winner === 'white') {
      batch.update(ktPlayers().doc(m.white), { wins: firebase.firestore.FieldValue.increment(1) });
    } else {
      batch.update(ktPlayers().doc(m.black), { wins: firebase.firestore.FieldValue.increment(1) });
    }
    // Mark loser as eliminated
    const loserUid = winner === 'white' ? m.black : m.white;
    const r = data.currentRound;
    batch.update(ktPlayers().doc(loserUid), { status: 'eliminated', roundEliminated: r });
  });
  await batch.commit();
  if (kt.isDirector) ktDirectorCheckRoundComplete();
}

/* ── JOIN MATCH ────────────────────────────────────────────── */
async function joinKTMatch() {
  if (!kt.myMatch) { showKTNotif('No match assigned.', 'info'); return; }
  const match = kt.myMatch, myUid = ktGetMyUid(), amWhite = match.white === myUid;
  kt.matchStartedAt = Date.now();
  closeKTModal();
  if (amWhite) {
    if (document.getElementById('room-code-display')) document.getElementById('room-code-display').textContent = match.roomCode;
    if (typeof doCreateRoom === 'function') {
      const inp = document.getElementById('create-room-code');
      if (inp) inp.value = match.roomCode;
      doCreateRoom(match.roomCode);
    }
    showKTNotif(`🎮 Room ${match.roomCode} created! Waiting for ${match.blackName}…`, 'info');
  } else {
    if (typeof doJoinRoom === 'function') {
      const inp = document.getElementById('join-room-input');
      if (inp) inp.value = match.roomCode;
      doJoinRoom(match.roomCode);
    }
    showKTNotif(`🎮 Joining ${match.whiteName}'s room…`, 'info');
  }
}

/* ── REPORT RESULT ─────────────────────────────────────────── */
async function reportKTResult(gameResult) {
  if (!ktIsFirebase() || !kt.id || !kt.myMatch) return;
  const round = kt.currentRound, myUid = ktGetMyUid(), match = kt.myMatch;
  const amWhite = match.white === myUid;
  const field = amWhite ? 'whiteReport' : 'blackReport';

  try {
    const mRef = ktMatches(round).doc(match.matchId);
    await mRef.update({ [field]: gameResult, [`${field}At`]: Date.now() });

    const mSnap = await mRef.get(); const mData = mSnap.data();
    if (!mData.whiteReport || !mData.blackReport) return;

    // Draw handling: allow 1 rematch, then ELO tiebreak
    if (mData.whiteReport === '1/2-1/2' && mData.blackReport === '1/2-1/2') {
      const drawCount = (mData.drawCount || 0) + 1;
      if (drawCount === 1) {
        // Schedule rematch
        await mRef.update({ result: null, whiteReport: null, blackReport: null, drawCount });
        showKTNotif('🤝 Draw! Rematch starting in 30 seconds…', 'info');
        setTimeout(() => {
          // Re-open join button
          const joinBtn = document.getElementById('kt-join-btn');
          if (joinBtn) joinBtn.style.display = 'block';
          updateKTMatchUI();
        }, 3000);
        return;
      } else {
        // ELO tiebreak: higher ELO wins
        const tieResult = (mData.whiteElo || 1200) >= (mData.blackElo || 1200) ? '1-0' : '0-1';
        await mRef.update({ result: tieResult, tiebreak: true, confirmedAt: Date.now() });
        await processKTResult(mRef.id, tieResult, mData, round);
        showKTNotif('🎲 Tiebreak: Higher ELO wins!', 'info');
        return;
      }
    }

    const result = mData.whiteReport === mData.blackReport ? mData.whiteReport : mData.whiteReport;
    await mRef.update({ result, confirmedAt: Date.now() });
    await processKTResult(mRef.id, result, mData, round);
  } catch (e) { console.error('KT result report failed', e); }
}

async function processKTResult(matchId, result, mData, round) {
  const batch = db.batch();
  const winnerUid = result === '1-0' ? mData.white : mData.black;
  const loserUid  = result === '1-0' ? mData.black : mData.white;
  const myUid = ktGetMyUid();

  batch.update(ktPlayers().doc(winnerUid), { wins: firebase.firestore.FieldValue.increment(1) });
  batch.update(ktPlayers().doc(loserUid),  { status: 'eliminated', roundEliminated: round });
  await batch.commit();

  // Local rewards
  if (winnerUid === myUid) {
    addCoins(KT.COINS.win);
    addXP(KT.XP.win);
  }

  if (kt.isDirector) setTimeout(ktDirectorCheckRoundComplete, 2000);
}

/* ── FINALIZE ──────────────────────────────────────────────── */
async function ktFinalize() {
  // Get remaining active player (the champion)
  const pSnap = await ktPlayers().where('status', '==', 'active').get();
  const active = pSnap.docs.map(d => d.data());

  // Get top 4 by rounds survived
  const allSnap = await ktPlayers().orderBy('wins', 'desc').limit(8).get();
  const top = allSnap.docs.map(d => d.data());

  const champion = active[0] || top[0];
  const myUid = ktGetMyUid();

  await ktDoc().update({
    status: 'finished', champion: champion || null,
    finishedAt: Date.now(), lastActivity: Date.now()
  });

  // Award prizes
  const prizes = [
    { uid: top[0]?.uid, coins: KT.COINS.champion, xp: KT.XP.champion, badge: '🏆', name: 'Knockout Champion',  achId: 'kt_champion' },
    { uid: top[1]?.uid, coins: KT.COINS.runnerup,  xp: KT.XP.runnerup,  badge: '🥈', name: 'Knockout Runner-up', achId: 'kt_runnerup'  },
    { uid: top[2]?.uid, coins: KT.COINS.semi,       xp: KT.XP.semi,       badge: '🥉', name: 'Semi-Finalist',     achId: 'kt_semi'      },
    { uid: top[3]?.uid, coins: KT.COINS.quarter,    xp: KT.XP.quarter,    badge: '🎖', name: 'Quarter-Finalist',  achId: 'kt_quarter'   }
  ];

  prizes.forEach(p => {
    if (p.uid && p.uid === myUid) {
      addCoins(p.coins); addXP(p.xp);
      ktAwardBadge(p.achId, p.badge, p.name);
      if (p.achId === 'kt_champion') {
        localStorage.setItem('kt_champion_frame', '1');
        localStorage.setItem('kt_current_champion', top[0]?.name || '');
      }
    }
  });

  // Save to history
  try {
    await db.collection('knockoutHistory').add({
      tourneyId: kt.id, date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      players: top.length, maxPlayers: kt.maxPlayers, timeControl: kt.timeControl,
      champion: champion || null
    });
  } catch (e) {}

  kt.status = 'finished';
  renderKTLobby();
  if (top[0]?.uid === myUid) showKTNotif('🏆 You are the Knockout Champion! +200🪙 +500XP', 'success');
  else showKTNotif('🏁 Tournament finished!', 'info');
}

function ktAwardBadge(achId, icon, name) {
  const badges = JSON.parse(localStorage.getItem('cm_achievements') || '[]');
  if (!badges.includes(achId)) {
    badges.push(achId); localStorage.setItem('cm_achievements', JSON.stringify(badges));
    if (typeof showAchievementToast === 'function') showAchievementToast({ id: achId, icon, name, desc: 'Knockout Tournament' });
  }
}

/* ── CHAT ──────────────────────────────────────────────────── */
let ktChatMessages = [];
function ktSubscribeChat() {
  if (!ktIsFirebase() || !kt.id) return;
  if (kt.chatUnsub) { try { kt.chatUnsub(); } catch (e) {} }
  kt.chatUnsub = ktChatRef().orderBy('ts', 'asc').limitToLast(KT.CHAT_LIMIT).onSnapshot(snap => {
    ktChatMessages = snap.docs.map(d => d.data());
    ktRenderChat();
  });
}
async function sendKTChat() {
  if (!ktIsSignedIn()) { showKTNotif('🔑 Sign in to chat!', 'warn'); return; }
  const inp = document.getElementById('kt-chat-input'); if (!inp) return;
  const text = inp.value.trim(); if (!text || text.length > 200) return;
  inp.value = '';
  try {
    await ktChatRef().add({ uid: ktGetMyUid(), name: ktGetMyName(), text, ts: Date.now(),
      country: (typeof detectMyCountry === 'function') ? detectMyCountry() : null });
  } catch (e) {}
}
function ktRenderChat() {
  const el = document.getElementById('kt-chat-msgs'); if (!el) return;
  const myUid = ktGetMyUid();
  el.innerHTML = ktChatMessages.map(m => {
    const isMe = m.uid === myUid;
    const flag = (m.country && typeof countryCodeToFlag === 'function') ? countryCodeToFlag(m.country) + ' ' : '';
    const time = new Date(m.ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    return `<div class="wt-chat-msg ${isMe ? 'wt-chat-me' : ''}">
      <span class="wt-chat-name">${flag}${ktEsc(m.name)}</span>
      <span class="wt-chat-time">${time}</span>
      <div class="wt-chat-text">${ktEsc(m.text)}</div></div>`;
  }).join('');
  el.scrollTop = el.scrollHeight;
}

/* ── SUBSCRIPTION ──────────────────────────────────────────── */
function ktSubscribeAll() {
  ktUnsubscribeAll();
  if (!ktIsFirebase() || !kt.id) return;

  const u1 = ktDoc().onSnapshot(snap => {
    if (!snap.exists) return;
    const data = snap.data();
    kt.status = data.status;
    kt.currentRound = data.currentRound || 0;
    kt.totalRounds  = data.totalRounds  || 0;
    kt.maxPlayers   = data.maxPlayers   || 64;
    kt.timeControl  = data.timeControl  || 'blitz';

    if (data.status === 'registration' && data.director === ktGetMyUid()) {
      // Director may start tournament manually or it auto-starts when full
    }
    if (data.status === 'active') {
      ktSubscribeMyMatch();
    }
    if (data.status === 'finished') renderKTLobby();
    updateKTStatusBar(data);
  });
  kt.listeners.push(u1);
  ktSubscribeChat();
}

function ktSubscribeMyMatch() {
  const uid = ktGetMyUid(), round = kt.currentRound;
  if (!round || !uid) return;
  const u2 = ktMatches(round).where('white', '==', uid).onSnapshot(snap => {
    snap.docs.forEach(d => { kt.myMatch = { ...d.data(), matchId: d.id }; updateKTMatchUI(); });
  });
  const u3 = ktMatches(round).where('black', '==', uid).onSnapshot(snap => {
    snap.docs.forEach(d => { kt.myMatch = { ...d.data(), matchId: d.id }; updateKTMatchUI(); });
  });
  kt.listeners.push(u2, u3);
}

function ktUnsubscribeAll() {
  kt.listeners.forEach(u => { try { u(); } catch (e) {} }); kt.listeners = [];
  if (kt.chatUnsub) { try { kt.chatUnsub(); } catch (e) {} kt.chatUnsub = null; }
}

/* ── OPEN / CLOSE ──────────────────────────────────────────── */
function openKnockoutTournament() {
  if (!document.getElementById('kt-modal')) injectKTModal();
  document.getElementById('kt-modal')?.classList.add('show');
  // Try to find an active/registration tournament
  if (ktIsFirebase() && !kt.id) ktFindActiveTournament();
  else renderKTLobby();
}
function closeKTModal() { document.getElementById('kt-modal')?.classList.remove('show'); }

async function ktFindActiveTournament() {
  try {
    const snap = await db.collection('knockoutTournaments')
      .where('status', 'in', ['registration', 'active'])
      .orderBy('createdAt', 'desc').limit(1).get();
    if (!snap.empty) {
      kt.id = snap.docs[0].id;
      const data = snap.docs[0].data();
      kt.status = data.status; kt.maxPlayers = data.maxPlayers || 64;
      kt.timeControl = data.timeControl || 'blitz';
      kt.currentRound = data.currentRound || 0;
      kt.totalRounds = data.totalRounds || 0;
      ktSubscribeAll();
    }
    renderKTLobby();
  } catch (e) { renderKTLobby(); }
}

/* ── START NEW TOURNAMENT (director only) ───────────────────── */
async function ktCreateAndStart() {
  if (!ktIsFirebase()) { alert('⚠️ Firebase not configured.'); return; }
  if (!ktIsSignedIn()) { showKTNotif('🔑 Sign In required!', 'warn'); return; }

  kt.id = ktGenId();
  const totalRounds = ktCalcRounds(kt.maxPlayers);
  await ktDoc().set({
    status: 'registration', maxPlayers: kt.maxPlayers, timeControl: kt.timeControl,
    currentRound: 0, totalRounds, createdAt: Date.now(), lastActivity: Date.now(),
    director: ktGetMyUid(), spectatorCount: 0
  });
  kt.isDirector = true; kt.status = 'registration';
  showKTNotif(`✅ Knockout tournament created! Waiting for players…`, 'success');
  renderKTLobby(); ktSubscribeAll();
}

async function ktStartTournament() {
  const pSnap = await ktPlayers().where('status', '==', 'active').get();
  if (pSnap.size < 4) { showKTNotif(`⚠️ Need at least 4 players (${pSnap.size} registered).`, 'warn'); return; }

  // Pad to nearest power of 2 with byes if needed
  const n = pSnap.size, total = ktCalcRounds(n);
  await ktDoc().update({ status: 'active', totalRounds: total, playerCount: n });
  kt.status = 'active'; kt.isDirector = true;
  setTimeout(ktDirectorStartRound, 2000);
  showKTNotif(`⚔️ Tournament started! ${n} players · ${total} rounds`, 'success');
}

/* ── LOBBY RENDER ──────────────────────────────────────────── */
function renderKTLobby() {
  const content = document.getElementById('kt-content'); if (!content) return;
  const signedIn = ktIsSignedIn();

  if (kt.status === 'idle' || !kt.id) {
    _renderKTSetup(content, signedIn);
  } else if (kt.status === 'registration') {
    _renderKTRegistration(content, signedIn);
  } else if (kt.status === 'active') {
    _renderKTActive(content);
  } else if (kt.status === 'finished') {
    _renderKTFinished(content);
  }
}

function _renderKTSetup(content, signedIn) {
  const tc = KT.TC[kt.timeControl] || KT.TC.blitz;
  content.innerHTML = `
    <div style="text-align:center;margin-bottom:.8rem;">
      <div style="font-size:2rem;">⚔️</div>
      <div style="font-family:'Playfair Display',serif;font-size:1.1rem;color:var(--text);font-weight:700;">Knockout Tournament</div>
      <div style="font-size:.78rem;color:var(--text-dim);margin-top:.2rem;">Single elimination · ELO-seeded · Sign-in required</div>
    </div>
    <div class="kt-prizes">
      <div class="kt-prize-row"><span>🏆 Champion</span><span>200🪙 + 500XP + Champion Frame</span></div>
      <div class="kt-prize-row"><span>🥈 Runner-up</span><span>100🪙 + 200XP</span></div>
      <div class="kt-prize-row"><span>🥉 Semi-Final</span><span>50🪙 + 100XP</span></div>
      <div class="kt-prize-row"><span>🎖 Quarter-Final</span><span>25🪙 + 50XP</span></div>
    </div>
    <div class="kt-config">
      <div class="kt-config-label">Players</div>
      <div class="kt-config-btns" id="kt-slot-btns">
        ${KT.SLOTS.map(s => `<button class="kt-cfg-btn ${s===kt.maxPlayers?'active':''}" onclick="ktSetSlots(${s})">${s}</button>`).join('')}
      </div>
      <div class="kt-config-label" style="margin-top:.5rem;">Time Control</div>
      <div class="kt-config-btns">
        ${Object.entries(KT.TC).map(([k,v]) => `<button class="kt-cfg-btn ${k===kt.timeControl?'active':''}" onclick="ktSetTC('${k}')">${v.label}</button>`).join('')}
      </div>
    </div>
    ${signedIn ? `
      <button class="btn btn-primary" style="width:100%;margin-top:.8rem;padding:.7rem;font-size:.95rem;font-weight:700;" onclick="ktCreateAndStart()">
        ⚔️ Create Knockout Tournament
      </button>
      <button class="btn" style="width:100%;margin-top:.4rem;font-size:.82rem;" onclick="ktFindActiveTournament()">
        🔍 Find Active Tournament
      </button>
    ` : `
      <div style="background:rgba(220,80,80,.08);border:1px solid rgba(220,80,80,.3);border-radius:10px;padding:.8rem;text-align:center;margin-top:.8rem;">
        <div style="font-size:.85rem;color:#e07070;font-weight:700;margin-bottom:.3rem;">🔑 Sign In Required</div>
        <div style="font-size:.78rem;color:var(--text-dim);margin-bottom:.6rem;">Knockout sirf registered users ke liye hai.</div>
        <button class="btn btn-primary" style="width:100%;padding:.55rem;" onclick="closeKTModal();openLoginModal()">🔑 Sign In</button>
      </div>
    `}
    <button class="btn" style="width:100%;margin-top:.4rem;font-size:.78rem;" onclick="ktOpenHallOfFame()">🏛️ Past Champions</button>`;
}

function ktSetSlots(n) {
  kt.maxPlayers = n;
  document.querySelectorAll('#kt-slot-btns .kt-cfg-btn').forEach(b => b.classList.toggle('active', parseInt(b.textContent) === n));
}
function ktSetTC(tc) {
  kt.timeControl = tc;
  document.querySelectorAll('.kt-tc-btn').forEach(b => b.classList.remove('active'));
}

function _renderKTRegistration(content, signedIn) {
  const tc = KT.TC[kt.timeControl] || KT.TC.blitz;
  content.innerHTML = `
    <div class="kt-status-header">
      <div class="kt-status-badge kt-status-reg">🟢 Registration Open</div>
      <div style="font-size:.78rem;color:var(--text-dim);">${kt.maxPlayers} slots · ${tc.label}</div>
    </div>
    <div class="kt-reg-info">
      <div class="kt-reg-tile">⚔️<br><strong>Knockout</strong><br><span>Format</span></div>
      <div class="kt-reg-tile">🎯<br><strong>ELO</strong><br><span>Seeded</span></div>
      <div class="kt-reg-tile">⏱<br><strong>${tc.label}</strong><br><span>Time</span></div>
      <div class="kt-reg-tile">🏆<br><strong>200🪙</strong><br><span>1st Prize</span></div>
    </div>
    <div class="kt-players-count" id="kt-reg-count">👥 Loading…</div>
    ${signedIn ? `
      <button class="btn btn-primary kt-big-btn" onclick="registerForKnockout()">⚔️ Register Now</button>
      ${kt.isDirector ? `<button class="btn" style="width:100%;margin-top:.4rem;background:rgba(200,160,40,.12);border-color:rgba(200,160,40,.4);color:var(--gold);" onclick="ktStartTournament()">▶ Start Tournament (Director)</button>` : ''}
      <button class="btn" style="width:100%;margin-top:.4rem;font-size:.82rem;" onclick="withdrawFromKnockout()">Withdraw</button>
    ` : `
      <button class="btn btn-primary kt-big-btn" onclick="closeKTModal();openLoginModal()">🔑 Sign In to Register</button>
    `}
    <div class="kt-tabs" style="margin-top:.8rem;">
      <button class="wt-tab active" onclick="ktTabSwitch(this,'kt-tab-chat')">💬 Chat</button>
      <button class="wt-tab" onclick="ktTabSwitch(this,'kt-tab-info')">ℹ️ Info</button>
    </div>
    <div id="kt-tab-chat" class="wt-tab-panel" style="display:block;">
      <div id="kt-chat-msgs" class="wt-chat-msgs"></div>
      <div class="wt-chat-bar">
        <input id="kt-chat-input" class="wt-chat-input" placeholder="Message…" maxlength="200" onkeydown="if(event.key==='Enter')sendKTChat()">
        <button class="btn wt-chat-send" onclick="sendKTChat()">▶</button>
      </div>
    </div>
    <div id="kt-tab-info" class="wt-tab-panel" style="display:none;">
      <div style="font-size:.82rem;color:var(--text-mid);line-height:1.6;padding:.4rem 0;">
        <strong>How it works:</strong><br>
        • Top seeds face lowest seeds in R1<br>
        • Winners advance, losers are eliminated<br>
        • Draw → 1 rematch, then ELO tiebreak<br>
        • No-show → higher seed advances<br>
        • Champion gets frame + title + 200🪙
      </div>
    </div>`;
  ktLoadRegCount();
  if (ktChatMessages.length) ktRenderChat();
}

async function ktLoadRegCount() {
  if (!ktIsFirebase() || !kt.id) return;
  const snap = await ktPlayers().where('status', '==', 'active').get();
  const el = document.getElementById('kt-reg-count');
  if (el) el.textContent = `👥 ${snap.size} / ${kt.maxPlayers} players registered`;
}

function _renderKTActive(content) {
  const tc = KT.TC[kt.timeControl] || KT.TC.blitz;
  const m = kt.myMatch;
  const rName = ktRoundName(kt.currentRound, kt.totalRounds);
  const isFinal = rName === 'Final';

  const matchHtml = m && !m.result ? `
    <div class="kt-match-card ${isFinal ? 'kt-final-match' : ''}">
      ${isFinal ? `<div class="kt-final-badge">👑 GRAND FINAL</div>` : ''}
      <div class="kt-match-title">⚔️ ${rName}</div>
      <div class="kt-match-players">
        <div class="kt-player-card"><div class="kt-player-seed">#${m.whiteSeed||'?'}</div><div class="kt-player-name">♔ ${ktEsc(m.whiteName)}</div><div class="kt-player-elo">${m.whiteElo||'?'}</div></div>
        <div class="kt-vs-divider">VS</div>
        <div class="kt-player-card"><div class="kt-player-seed">#${m.blackSeed||'?'}</div><div class="kt-player-name">♚ ${ktEsc(m.blackName)}</div><div class="kt-player-elo">${m.blackElo||'?'}</div></div>
      </div>
      <div style="font-size:.72rem;color:var(--text-dim);text-align:center;margin:.3rem 0;">⏱ ${tc.label} · Room: ${m.roomCode||'—'}</div>
      <button id="kt-join-btn" class="btn btn-primary" style="width:100%;margin-top:.4rem;padding:.65rem;font-size:.9rem;font-weight:700;" onclick="joinKTMatch()">▶ Join Match</button>
    </div>` :
    m?.result ? `<div class="kt-match-card" style="border-color:rgba(109,204,138,.4);text-align:center;">
      ${m.result==='1-0'||m.result==='0-1'?
        ((m.result==='1-0'&&m.white===ktGetMyUid())||(m.result==='0-1'&&m.black===ktGetMyUid()))?
        `<div style="font-size:1.2rem;color:#6dcc8a;font-weight:700;">🎉 You Won!</div><div style="font-size:.8rem;color:var(--text-dim);">Waiting for next round…</div>`:
        `<div style="font-size:1.1rem;color:#e06060;font-weight:700;">❌ Eliminated</div><div style="font-size:.8rem;color:var(--text-dim);">Better luck next time!</div>`:''}
    </div>` :
    `<div class="kt-match-card">⏳ Waiting for ${rName} pairings…</div>`;

  content.innerHTML = `
    <div class="kt-active-header">
      <div>
        <div class="kt-round-name">${rName}</div>
        <div style="font-size:.72rem;color:var(--text-dim);">${kt.currentRound}/${kt.totalRounds} rounds complete</div>
      </div>
      <div class="kt-progress-bar-wrap">
        <div class="kt-progress-bar" style="width:${Math.round((kt.currentRound/kt.totalRounds)*100)}%"></div>
      </div>
    </div>

    ${matchHtml}

    <div class="wt-tabs" style="margin-top:.7rem;">
      <button class="wt-tab active" onclick="ktTabSwitch(this,'kt-tab-bracket')">🏆 Bracket</button>
      <button class="wt-tab" onclick="ktTabSwitch(this,'kt-tab-active')">👁 Live</button>
      <button class="wt-tab" onclick="ktTabSwitch(this,'kt-tab-chat2')">💬 Chat</button>
    </div>
    <div id="kt-tab-bracket" class="wt-tab-panel" style="display:block;">
      <div id="kt-bracket-view" class="kt-bracket-view"><div style="color:var(--text-dim);font-size:.8rem;text-align:center;padding:.5rem;">Loading bracket…</div></div>
    </div>
    <div id="kt-tab-active" class="wt-tab-panel" style="display:none;">
      <div style="display:flex;justify-content:flex-end;margin-bottom:.3rem;">
        <button onclick="ktLoadLiveMatches()" style="background:none;border:1px solid rgba(255,255,255,.15);border-radius:6px;padding:.2rem .5rem;font-size:.72rem;color:var(--text-dim);cursor:pointer;">🔄 Refresh</button>
      </div>
      <div id="kt-live-list" class="wt-live-matches-list"><div style="color:var(--text-dim);font-size:.85rem;text-align:center;padding:.5rem;">Loading…</div></div>
    </div>
    <div id="kt-tab-chat2" class="wt-tab-panel" style="display:none;">
      <div id="kt-chat-msgs" class="wt-chat-msgs"></div>
      <div class="wt-chat-bar">
        <input id="kt-chat-input" class="wt-chat-input" placeholder="Message…" maxlength="200" onkeydown="if(event.key==='Enter')sendKTChat()">
        <button class="btn wt-chat-send" onclick="sendKTChat()">▶</button>
      </div>
    </div>
    <button class="btn" style="width:100%;margin-top:.7rem;" onclick="closeKTModal()">Close (tournament continues)</button>`;

  ktLoadBracket(); ktLoadLiveMatches();
  if (ktChatMessages.length) ktRenderChat();
}

function ktTabSwitch(btn, panelId) {
  document.querySelectorAll('.wt-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.wt-tab-panel').forEach(p => p.style.display = 'none');
  btn.classList.add('active');
  const p = document.getElementById(panelId); if (p) p.style.display = 'block';
  if (panelId === 'kt-tab-chat' || panelId === 'kt-tab-chat2') ktRenderChat();
}

/* ── BRACKET VISUALIZATION ─────────────────────────────────── */
async function ktLoadBracket() {
  const el = document.getElementById('kt-bracket-view'); if (!el || !ktIsFirebase() || !kt.id) return;
  try {
    const rows = [];
    for (let r = 1; r <= kt.currentRound; r++) {
      const snap = await ktMatches(r).get();
      const matches = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      rows.push({ round: r, name: ktRoundName(r, kt.totalRounds), matches });
    }

    if (!rows.length) { el.innerHTML = '<div style="color:var(--text-dim);font-size:.8rem;text-align:center;padding:.5rem;">Bracket not started yet.</div>'; return; }

    el.innerHTML = rows.map(row => `
      <div class="kt-bracket-round">
        <div class="kt-bracket-round-title">${row.name}</div>
        ${row.matches.map(m => {
          if (m.bye) return `<div class="kt-bracket-match"><span class="kt-bm-white">${ktEsc(m.whiteName||'?')}</span><span class="kt-bm-result kt-bm-win">BYE</span></div>`;
          const wWon = m.result === '1-0', bWon = m.result === '0-1';
          return `<div class="kt-bracket-match">
            <div class="kt-bm-row ${wWon?'kt-bm-winner':''}"><span class="kt-bm-seed">#${m.whiteSeed||'?'}</span><span class="kt-bm-name">${ktEsc(m.whiteName||'?')}</span><span class="kt-bm-elo">${m.whiteElo||'?'}</span>${wWon?'<span class="kt-bm-win-icon">✓</span>':''}</div>
            <div class="kt-bm-divider"></div>
            <div class="kt-bm-row ${bWon?'kt-bm-winner':''}"><span class="kt-bm-seed">#${m.blackSeed||'?'}</span><span class="kt-bm-name">${ktEsc(m.blackName||'?')}</span><span class="kt-bm-elo">${m.blackElo||'?'}</span>${bWon?'<span class="kt-bm-win-icon">✓</span>':''}</div>
            ${m.result?'':`<div style="font-size:.68rem;color:var(--gold);text-align:center;margin-top:.2rem;">🔴 Live</div>`}
          </div>`;
        }).join('')}
      </div>`).join('');
  } catch (e) { el.innerHTML = '<div style="color:var(--text-dim);font-size:.8rem;text-align:center;">Failed to load bracket.</div>'; }
}

async function ktLoadLiveMatches() {
  const el = document.getElementById('kt-live-list'); if (!el || !ktIsFirebase() || !kt.id || !kt.currentRound) return;
  try {
    const snap = await ktMatches(kt.currentRound).get();
    const active = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(m => !m.result && !m.bye);
    if (!active.length) { el.innerHTML = '<div style="color:var(--text-dim);font-size:.85rem;text-align:center;padding:.5rem;">No active matches.</div>'; return; }
    el.innerHTML = active.map(m => `
      <div class="wt-live-match-row">
        <div class="wt-live-match-players">
          <span class="wt-lm-white">♔ ${ktEsc(m.whiteName||'?')}</span>
          <span class="wt-lm-vs">vs</span>
          <span class="wt-lm-black">♚ ${ktEsc(m.blackName||'?')}</span>
        </div>
        <button class="btn wt-watch-btn" onclick="ktWatchGame(${JSON.stringify(JSON.stringify(m))})">👁 Watch</button>
      </div>`).join('');
  } catch (e) {}
}

/* ── SPECTATOR ─────────────────────────────────────────────── */
function ktWatchGame(mJson) {
  let m; try { m = JSON.parse(mJson); } catch (e) { return; }
  closeKTModal();
  document.getElementById('kt-spectator-modal')?.remove();
  // Increment spectator count
  if (ktIsFirebase() && kt.id) ktDoc().update({ spectatorCount: firebase.firestore.FieldValue.increment(1) }).catch(() => {});

  const overlay = document.createElement('div'); overlay.id = 'kt-spectator-modal';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:9998;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:1rem;overflow-y:auto;';
  overlay.innerHTML = `<div style="background:var(--bg-card,#1e1e2e);border:1px solid rgba(255,80,80,.2);border-radius:16px;padding:1.2rem;max-width:420px;width:100%;position:relative;">
    <button onclick="ktStopWatching()" style="position:absolute;top:.8rem;right:.8rem;background:none;border:none;color:var(--text-dim);font-size:1.2rem;cursor:pointer;">✕</button>
    <div style="text-align:center;margin-bottom:.8rem;">
      <div style="font-size:.72rem;color:#e07070;font-weight:700;letter-spacing:.06em;">🔴 KNOCKOUT LIVE · ${ktRoundName(kt.currentRound, kt.totalRounds)}</div>
      <div style="font-size:1rem;font-weight:700;margin-top:.3rem;">♔ ${ktEsc(m.whiteName||'?')} vs ♚ ${ktEsc(m.blackName||'?')}</div>
      <div style="font-size:.72rem;color:var(--text-dim);">Seed #${m.whiteSeed||'?'} vs #${m.blackSeed||'?'}</div>
    </div>
    <canvas id="kt-spectator-canvas" width="360" height="360" style="width:100%;border-radius:8px;border:2px solid rgba(255,80,80,.2);display:block;margin:0 auto .6rem;"></canvas>
    <div id="kt-spectator-status" style="text-align:center;font-size:.8rem;color:var(--text-dim);margin-bottom:.4rem;">⏳ Connecting…</div>
    <div id="kt-spectator-moves" style="max-height:80px;overflow-y:auto;background:rgba(0,0,0,.3);border-radius:8px;padding:.4rem;font-size:.76rem;color:var(--text-dim);font-family:monospace;margin-bottom:.7rem;">…</div>
    <button onclick="ktStopWatching()" style="width:100%;padding:.6rem;border-radius:10px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:var(--text);cursor:pointer;">← Back</button>
  </div>`;
  document.body.appendChild(overlay);
  ktStartSpectating(m);
}

let ktSpectatorUnsub = null;
function ktStopWatching() {
  if (ktSpectatorUnsub) { try { ktSpectatorUnsub(); } catch (e) {} ktSpectatorUnsub = null; }
  if (ktIsFirebase() && kt.id) ktDoc().update({ spectatorCount: firebase.firestore.FieldValue.increment(-1) }).catch(() => {});
  document.getElementById('kt-spectator-modal')?.remove();
}
function ktStartSpectating(m) {
  if (!ktIsFirebase() || !kt.id) { const e = document.getElementById('kt-spectator-status'); if (e) e.textContent = '⚠️ Firebase needed.'; return; }
  const matchRef = ktMatches(kt.currentRound).doc(m.id || m.matchId);
  ktDrawBoard(document.getElementById('kt-spectator-canvas'), 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQ - 0 1');
  ktSpectatorUnsub = matchRef.onSnapshot(snap => {
    if (!snap.exists) return;
    const data = snap.data();
    const fen = data.liveFen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQ - 0 1';
    const moves = data.movesHistory || [];
    ktDrawBoard(document.getElementById('kt-spectator-canvas'), fen);
    const se = document.getElementById('kt-spectator-status');
    if (se) se.textContent = data.result ? `✅ ${data.result}` : `🔴 Live · Move ${moves.length}`;
    const me = document.getElementById('kt-spectator-moves');
    if (me && moves.length) {
      const pairs = []; for (let i = 0; i < moves.length; i += 2) pairs.push(`${Math.floor(i/2)+1}. ${moves[i]||''} ${moves[i+1]||''}`);
      me.textContent = pairs.join('  '); me.scrollTop = me.scrollHeight;
    }
  });
}
function ktDrawBoard(canvas, fen) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d'), SIZE = canvas.width, SQ = SIZE / 8;
  const pm = {'K':'♔','Q':'♕','R':'♖','B':'♗','N':'♘','P':'♙','k':'♚','q':'♛','r':'♜','b':'♝','n':'♞','p':'♟'};
  const board = fen.split(' ')[0].split('/').map(row => { const r = []; for (const ch of row) { if (/\d/.test(ch)) for (let i=0;i<+ch;i++) r.push(''); else r.push(ch); } return r; });
  for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
    ctx.fillStyle = (r+c)%2===0 ? '#f0d9b5' : '#b58863'; ctx.fillRect(c*SQ,r*SQ,SQ,SQ);
    const p = board[r]?.[c]||'';
    if (p) { ctx.font = `bold ${SQ*.72}px serif`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle=p===p.toLowerCase()?'#1a1a2e':'#fff'; ctx.fillText(pm[p]||p,c*SQ+SQ/2,r*SQ+SQ/2); }
  }
}

/* ── FINISHED ──────────────────────────────────────────────── */
function _renderKTFinished(content) {
  content.innerHTML = `
    <div class="wt-finished-banner" style="background:linear-gradient(135deg,rgba(220,60,60,.15),rgba(200,160,40,.15));">⚔️ Knockout Complete!</div>
    <div id="kt-winner-section" style="text-align:center;margin:.8rem 0 1rem;">
      <div style="color:var(--text-dim);font-size:.85rem;">Loading results…</div>
    </div>
    <button class="btn" style="width:100%;margin-top:.4rem;font-size:.82rem;" onclick="ktOpenHallOfFame()">🏛️ Past Champions</button>
    <div style="display:flex;gap:.4rem;margin-top:.5rem;">
      <button class="btn btn-primary" style="flex:1;" onclick="closeKTModal()">Close</button>
      <button class="btn" style="flex:1;" onclick="ktCreateAndStart()">⚔️ New Tournament</button>
    </div>`;
  ktLoadWinnerSection();
}

async function ktLoadWinnerSection() {
  const el = document.getElementById('kt-winner-section'); if (!el || !ktIsFirebase() || !kt.id) return;
  try {
    const snap = await ktDoc().get(); const data = snap.data();
    const ch = data.champion;
    if (!ch) { el.innerHTML = '<div style="color:var(--text-dim);">No champion data.</div>'; return; }
    el.innerHTML = `
      <div class="wt-champion-banner" style="background:linear-gradient(135deg,rgba(220,60,60,.12),rgba(200,160,40,.12));border-color:rgba(220,80,80,.4);">
        <div class="wt-champ-crown">⚔️👑</div>
        <div class="wt-champ-name">${ktEsc(ch.name)}</div>
        <div class="wt-champ-sub">Knockout Champion · ELO ${ch.elo||'?'}</div>
      </div>`;
  } catch (e) {}
}

/* ── HALL OF FAME ──────────────────────────────────────────── */
async function ktOpenHallOfFame() {
  if (!ktIsFirebase()) { showKTNotif('Firebase needed', 'warn'); return; }
  document.getElementById('kt-hof-modal')?.remove();
  const overlay = document.createElement('div'); overlay.id = 'kt-hof-modal';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem;';
  overlay.innerHTML = `<div style="background:var(--bg-card,#1e1e2e);border:1px solid rgba(220,80,80,.35);border-radius:16px;padding:1.4rem;max-width:380px;width:100%;position:relative;max-height:80vh;display:flex;flex-direction:column;">
    <button onclick="document.getElementById('kt-hof-modal').remove()" style="position:absolute;top:.8rem;right:.8rem;background:none;border:none;color:var(--text-dim);font-size:1.2rem;cursor:pointer;">✕</button>
    <div style="font-family:'Playfair Display',serif;font-size:1.1rem;color:#e07070;font-weight:700;margin-bottom:1rem;text-align:center;">⚔️ Knockout Hall of Fame</div>
    <div id="kt-hof-list" style="flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:.4rem;"><div style="text-align:center;color:var(--text-dim);font-size:.85rem;">Loading…</div></div>
    <button onclick="document.getElementById('kt-hof-modal').remove()" style="width:100%;margin-top:.8rem;padding:.55rem;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:var(--text);cursor:pointer;">Close</button>
  </div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
  try {
    const snap = await db.collection('knockoutHistory').orderBy('date', 'desc').limit(10).get();
    const list = document.getElementById('kt-hof-list');
    if (snap.empty) { list.innerHTML = '<div style="text-align:center;color:var(--text-dim);font-size:.85rem;">No champions yet!</div>'; return; }
    list.innerHTML = snap.docs.map((d, i) => {
      const t = d.data(), ch = t.champion;
      return `<div style="background:rgba(255,255,255,.05);border:1px solid ${i===0?'rgba(220,80,80,.4)':'var(--border2,rgba(255,255,255,.08))'};border-radius:9px;padding:.6rem .8rem;display:flex;align-items:center;gap:.6rem;">
        <div style="font-size:1.3rem;">${i===0?'👑':'⚔️'}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:700;color:var(--text);font-size:.9rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${ktEsc(ch?.name||'—')}</div>
          <div style="font-size:.7rem;color:var(--text-dim);">${t.date||''} · ${t.maxPlayers||'?'} players · ${KT.TC[t.timeControl]?.label||t.timeControl}</div>
        </div>
        <div style="text-align:right;flex-shrink:0;font-size:.8rem;color:#e07070;font-weight:700;">ELO ${ch?.elo||'?'}</div>
      </div>`;
    }).join('');
  } catch (e) { document.getElementById('kt-hof-list').innerHTML = '<div style="color:var(--text-dim);text-align:center;font-size:.85rem;">Failed to load.</div>'; }
}

/* ── STATUS BAR ────────────────────────────────────────────── */
function updateKTStatusBar(data) {
  const bar = document.getElementById('kt-status-bar'); if (!bar) return;
  if (data.status === 'active') {
    bar.style.display = 'flex';
    bar.textContent = `⚔️ ${ktRoundName(data.currentRound, data.totalRounds)}`;
  } else bar.style.display = 'none';
}
function updateKTMatchUI() {
  const m = kt.myMatch; if (!m) return;
  const bar = document.getElementById('kt-match-alert'); if (!bar) return;
  if (!m.result) {
    bar.style.display = 'flex';
    const opp = m.white === ktGetMyUid() ? m.blackName : m.whiteName;
    bar.innerHTML = `⚔️ KO match vs ${ktEsc(opp)}! <button class="btn" style="font-size:.72rem;padding:.15rem .5rem;" onclick="joinKTMatch()">Join</button>`;
  } else bar.style.display = 'none';
}

/* ── NOTIFICATIONS ─────────────────────────────────────────── */
function showKTNotif(msg, type = 'info') {
  const el = document.getElementById('wt-notif'); if (!el) return;
  el.textContent = msg; el.className = 'wt-notif wt-notif-' + type + ' show';
  clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('show'), 4000);
}

/* ── INJECT KT MODAL ───────────────────────────────────────── */
function injectKTModal() {
  if (!document.getElementById('kt-status-bar')) {
    const bar = document.createElement('div'); bar.id = 'kt-status-bar';
    bar.className = 'wt-status-bar'; bar.style.cssText = 'display:none;background:rgba(220,60,60,.15);border-color:rgba(220,60,60,.4);color:#e07070;';
    bar.setAttribute('onclick', 'openKnockoutTournament()'); bar.style.cursor = 'pointer';
    document.body.appendChild(bar);
  }
  if (!document.getElementById('kt-match-alert')) {
    const a = document.createElement('div'); a.id = 'kt-match-alert'; a.className = 'wt-match-alert'; a.style.display = 'none';
    a.style.cssText += 'border-color:rgba(220,60,60,.5);';
    document.querySelector('.feat-bar')?.insertAdjacentElement('beforebegin', a);
  }

  const modal = document.createElement('div'); modal.id = 'kt-modal'; modal.className = 'upgrade-overlay';
  modal.innerHTML = `<div class="upgrade-box upgrade-box-wide kt-box">
    <div class="kt-header">
      <div>
        <div class="upgrade-title" style="margin-bottom:.1rem;">⚔️ Knockout Tournament</div>
        <div style="font-size:.72rem;color:var(--text-dim);">Single Elimination · ELO Seeded · Sign-in Required</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:.85rem;color:#e07070;font-weight:700;">🪙 <span class="coin-count">${getCoins()}</span></div>
        <div style="font-size:.68rem;color:var(--text-dim);">⬆ ${getXP()} XP</div>
      </div>
    </div>
    <div id="kt-content"></div>
    <button class="btn" style="width:100%;margin-top:.6rem;" onclick="closeKTModal()">✕ Close</button>
  </div>`;
  document.body.appendChild(modal);
}

/* ── ADD BUTTON TO HUB ─────────────────────────────────────── */
function addKTButtonToHub() {
  const hg = document.querySelector('.hub-grid');
  if (hg && !document.getElementById('kt-hub-btn')) {
    const btn = document.createElement('button'); btn.id = 'kt-hub-btn'; btn.className = 'hub-btn';
    btn.innerHTML = '⚔️ Knockout Tournament';
    btn.setAttribute('onclick', 'closeFeatureHub?.();openKnockoutTournament()');
    hg.insertBefore(btn, hg.childNodes[1] || null);
  }
  const fb2 = document.getElementById('feat-bar-2');
  if (fb2 && !document.getElementById('kt-feat-btn')) {
    const btn = document.createElement('button'); btn.id = 'kt-feat-btn'; btn.className = 'feat-btn';
    btn.style.cssText = 'border-color:rgba(220,80,80,.5);color:#e07070;font-weight:700;';
    btn.textContent = '⚔️ Knockout'; btn.setAttribute('onclick', 'openKnockoutTournament()');
    fb2.appendChild(btn);
  }
}

/* ── CHESS HOOK (push live FEN for KT spectators) ───────────── */
function installKTHooks() {
  if (typeof doMove !== 'function') return;
  const _dm2 = doMove;
  doMove = function (from, to, prom) {
    _dm2(from, to, prom);
    ktPushLiveFen();
  };
  if (typeof checkState === 'function') {
    const _cs2 = checkState;
    checkState = function () {
      _cs2();
      if (!over || !kt.myMatch || !kt.id || kt.status !== 'active') return;
      let result = '1/2-1/2';
      if (typeof inCheck === 'function' && typeof turn !== 'undefined') {
        if (inCheck(turn, board) && typeof anyLegal === 'function' && !anyLegal(turn))
          result = turn === 'b' ? '1-0' : '0-1';
      }
      setTimeout(() => reportKTResult(result), 800);
    };
  }
}

async function ktPushLiveFen() {
  if (!ktIsFirebase() || !kt.id || !kt.myMatch || kt.status !== 'active') return;
  try {
    const fen = (typeof getFen === 'function') ? getFen() : (typeof currentFen !== 'undefined' ? currentFen : null);
    if (!fen) return;
    const mRef = ktMatches(kt.currentRound).doc(kt.myMatch.matchId);
    const upd = { liveFen: fen, lastMoveAt: Date.now() };
    if (typeof moveHistory !== 'undefined' && Array.isArray(moveHistory)) upd.movesHistory = moveHistory.slice(-60);
    await mRef.update(upd);
  } catch (e) {}
}

/* ── INIT ──────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    injectKTModal();
    addKTButtonToHub();
    installKTHooks();
    console.log('[ChessArena] Knockout Tournament v1.0 loaded ✓');
  }, 800);
});
