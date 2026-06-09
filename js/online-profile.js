/* ═══════════════════════════════════════════════════════════════
   ChessArena — Online Profile Sharing
   ──────────────────────────────────────────────────────────────
   ✅ Firebase sign-in user ka naam + photo automatically bheja jaata hai
   ✅ Local username (leaderboard wala) bhi kaam karta hai
   ✅ Opponent ka naam, avatar, ELO board ke upar dikhta hai
   ✅ Chat mein "Opponent" ki jagah real naam aata hai
   ✅ Room Create + Join + Quick Match — teeno mein kaam karta hai
═══════════════════════════════════════════════════════════════ */

let opponentProfile  = null;   // received from other player
let profileSentAt    = 0;      // prevent double-sending

/* ──────────────────────────────────────────────────────────────
   GET MY PROFILE  (Firebase user OR local username)
────────────────────────────────────────────────────────────── */
function getMyProfile() {
  const countryCode = (typeof detectMyCountry === 'function') ? detectMyCountry() : null;

  // ── Custom overrides (set via Profile Editor) take priority ──
  const customName   = (typeof peGetCustomName   === 'function') ? peGetCustomName()   : localStorage.getItem('cm_custom_displayname');
  const customAvatar = (typeof peGetCustomAvatar === 'function') ? peGetCustomAvatar() : localStorage.getItem('cm_custom_avatar');

  // ── Firebase signed-in user ──
  const fbUser = (typeof currentUser !== 'undefined') ? currentUser : null;
  if (fbUser && fbUser.uid) {
    const name    = customName || fbUser.displayName || fbUser.email?.split('@')[0] || 'Player';
    const initial = name[0]?.toUpperCase() || '?';
    return {
      name,
      initial,
      photoURL    : customAvatar || fbUser.photoURL || null,
      elo         : typeof getElo === 'function' ? getElo() : 1200,
      countryCode : countryCode,
      source      : 'firebase'
    };
  }
  // ── Local username ──
  const name    = customName || localStorage.getItem('cm_username') || 'Guest';
  const initial = name[0]?.toUpperCase() || 'G';
  return {
    name,
    initial,
    photoURL    : customAvatar || null,
    elo         : typeof getElo === 'function' ? getElo() : 1200,
    countryCode : countryCode,
    source      : 'local'
  };
}

/* ──────────────────────────────────────────────────────────────
   SEND MY PROFILE  (called once per connection)
────────────────────────────────────────────────────────────── */
function sendMyProfile() {
  const now = Date.now();
  if (now - profileSentAt < 2000) return;   // dedupe
  profileSentAt = now;

  const c = (typeof conn !== 'undefined' ? conn : null)
         || (typeof qmConn !== 'undefined' ? qmConn : null);
  if (!c || !c.open) return;

  const profile = getMyProfile();
  try { c.send({ type: 'cm-profile', ...profile }); } catch(e) {}
}

/* ──────────────────────────────────────────────────────────────
   HANDLE INCOMING PROFILE PACKET
────────────────────────────────────────────────────────────── */
function handleProfilePacket(data) {
  if (data.type !== 'cm-profile') return false;
  opponentProfile = data;
  renderOpponentCard();
  refreshChatNames();
  return true;
}

/* ──────────────────────────────────────────────────────────────
   RENDER OPPONENT CARD  (above board)
────────────────────────────────────────────────────────────── */
function renderOpponentCard() {
  if (!opponentProfile) return;
  const { name, initial, photoURL, elo, countryCode } = opponentProfile;
  const myColor   = typeof myOnlineColor !== 'undefined' ? myOnlineColor : 'w';
  const oppColor  = myColor === 'w' ? 'b' : 'w';
  const oppSymbol = oppColor === 'w' ? '♔' : '♚';
  const meSymbol  = myColor  === 'w' ? '♔' : '♚';
  const me        = getMyProfile();

  const bar = document.getElementById('online-players-bar');
  if (!bar) return;
  bar.style.display = 'flex';

  const avatarHtml = (p, symbol) => p.photoURL
    ? `<img src="${p.photoURL}" class="op-avatar-img" alt="${p.name}">`
    : `<div class="op-avatar-initial">${p.initial}</div>`;

  const myFlag  = me.countryCode  ? `<span class="op-flag" title="${me.countryCode}">${(typeof countryCodeToFlag==='function')?countryCodeToFlag(me.countryCode):'🌐'}</span>` : '';
  const oppFlag = countryCode     ? `<span class="op-flag" title="${countryCode}">${(typeof countryCodeToFlag==='function')?countryCodeToFlag(countryCode):'🌐'}</span>` : '';

  bar.innerHTML = `
    <div class="op-card op-me">
      ${avatarHtml(me, meSymbol)}
      <div class="op-info">
        <div class="op-name">${myFlag} ${escHtml(me.name)} <span class="op-symbol">${meSymbol}</span></div>
        <div class="op-elo">${me.elo} ELO</div>
      </div>
      <div class="op-dot you-dot" title="You">YOU</div>
    </div>
    <div class="op-vs">VS</div>
    <div class="op-card op-them">
      <div class="op-dot opp-dot" title="Opponent">🟢</div>
      <div class="op-info" style="text-align:right;">
        <div class="op-name"><span class="op-symbol">${oppSymbol}</span> ${escHtml(name)} ${oppFlag}</div>
        <div class="op-elo">${elo} ELO</div>
      </div>
      ${avatarHtml(opponentProfile, oppSymbol)}
    </div>`;

  // Also update online badge with opponent name
  if (typeof setOnlineBadge === 'function') {
    const myLabel = myColor === 'w' ? 'White ♔' : 'Black ♚';
    setOnlineBadge(`🟢 vs ${name} · You are ${myLabel}`, '#6dcc8a');
  }
}

function hidePlayersBar() {
  const bar = document.getElementById('online-players-bar');
  if (bar) bar.style.display = 'none';
  opponentProfile = null;
}

/* ──────────────────────────────────────────────────────────────
   REFRESH CHAT — replace "Opponent" with real name
────────────────────────────────────────────────────────────── */
function refreshChatNames() {
  if (!opponentProfile?.name) return;
  document.querySelectorAll('.chat-msg.them .chat-sender')
    .forEach(el => { el.textContent = opponentProfile.name; });
}

/* ──────────────────────────────────────────────────────────────
   INJECT  PLAYERS BAR  into DOM
────────────────────────────────────────────────────────────── */
function injectPlayersBar() {
  if (document.getElementById('online-players-bar')) return;
  const bar = document.createElement('div');
  bar.id = 'online-players-bar';
  bar.className = 'online-players-bar';
  bar.style.display = 'none';

  // Insert above the board frame
  const boardWrap = document.getElementById('board-fs-wrap')
                 || document.querySelector('.board-frame')?.parentElement;
  if (boardWrap) boardWrap.parentElement?.insertBefore(bar, boardWrap);
  else document.querySelector('.game-area, .game-panel, main')?.prepend(bar);
}

/* ──────────────────────────────────────────────────────────────
   HOOK into existing online functions
────────────────────────────────────────────────────────────── */
function installProfileHooks() {

  /* ── addChatMsg override — use real opponent name ── */
  if (typeof addChatMsg === 'function') {
    const _orig = addChatMsg;
    addChatMsg = function(sender, msg) {
      if (sender === 'Opponent' && opponentProfile?.name) sender = opponentProfile.name;
      _orig(sender, msg);
    };
  }

  /* ── setupConn override — add profile data handler + send on open ── */
  if (typeof setupConn === 'function') {
    const _orig = setupConn;
    setupConn = function() {
      _orig();
      const c = (typeof conn !== 'undefined') ? conn : null;
      if (!c) return;

      // Extra data listener for profile packets
      c.on('data', data => handleProfilePacket(data));

      // Send profile once connection is open
      if (c.open) { setTimeout(sendMyProfile, 350); }
      else         { c.on('open', () => setTimeout(sendMyProfile, 350)); }
    };
  }

  /* ── doCreateRoom override — send profile after guest connects ── */
  if (typeof doCreateRoom === 'function') {
    const _orig = doCreateRoom;
    doCreateRoom = function() {
      _orig();
      // Profile will be sent via setupConn hook above (on open)
    };
  }

  /* ── qmMatchFound override — send profile after QM connects ── */
  if (typeof qmMatchFound === 'function') {
    const _orig = qmMatchFound;
    qmMatchFound = function(myColor) {
      _orig(myColor);
      // Add profile listener on the qm connection
      const c = (typeof conn !== 'undefined' ? conn : null)
             || (typeof qmConn !== 'undefined' ? qmConn : null);
      if (c) {
        c.on('data', data => handleProfilePacket(data));
        setTimeout(sendMyProfile, 600);
      }
    };
  }

  /* ── cancelOnline / cancelQuickMatch — hide bar on disconnect ── */
  if (typeof cancelOnline === 'function') {
    const _orig = cancelOnline;
    cancelOnline = function() { _orig(); hidePlayersBar(); };
  }
  if (typeof cancelQuickMatch === 'function') {
    const _orig = cancelQuickMatch;
    cancelQuickMatch = function() { _orig(); hidePlayersBar(); };
  }

  /* ── newGame — re-render bar if opponent known ── */
  if (typeof newGame === 'function') {
    const _orig = newGame;
    newGame = function() {
      _orig();
      if (opponentProfile && typeof onlineConnected !== 'undefined' && onlineConnected) {
        setTimeout(renderOpponentCard, 200);
      }
    };
  }

  /* ── Watch for online badge going green → re-render bar ── */
  if (typeof setOnlineBadge === 'function') {
    const _orig = setOnlineBadge;
    setOnlineBadge = function(msg, color) {
      _orig(msg, color);
      if (color === '#6dcc8a' && opponentProfile) setTimeout(renderOpponentCard, 100);
      if (!msg) hidePlayersBar();
    };
  }
}

/* ──────────────────────────────────────────────────────────────
   HELPER — escape HTML in names
────────────────────────────────────────────────────────────── */
function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ──────────────────────────────────────────────────────────────
   INIT
────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    injectPlayersBar();
    installProfileHooks();
    console.log('[ChessArena] Online Profile v1.0 loaded ✓');
  }, 500);   // after chess.js + firebase.js are fully ready
});
