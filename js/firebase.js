/* ════════════════════════════════════════════════════════════
   ChessMaster PRO — Firebase Integration
   Handles: Auth, ELO sync, Leaderboard, Game History, Streak
   Falls back to localStorage if user not logged in
════════════════════════════════════════════════════════════ */

/* ── State ── */
let fbApp = null, fbAuth = null, fbDb = null;
let currentUser = null;
let fbReady = false;

/* ─────────────────────────────────────────────────────────
   INIT — Called once on page load
───────────────────────────────────────────────────────── */
function initFirebase() {
  try {
    if (!FIREBASE_CONFIG || FIREBASE_CONFIG.apiKey === 'YOUR_API_KEY') {
      console.warn('ChessMaster: Firebase config not set. Running in offline mode.');
      showOfflineBadge();
      return;
    }

    fbApp  = firebase.initializeApp(FIREBASE_CONFIG);
    fbAuth = firebase.auth();
    fbDb   = firebase.firestore();

    // Listen for auth state changes
    fbAuth.onAuthStateChanged(user => {
      if (user) {
        currentUser = user;
        onUserSignedIn(user);
      } else {
        currentUser = null;
        onUserSignedOut();
      }
    });

    fbReady = true;
    console.log('ChessMaster: Firebase ready ✅');
  } catch (e) {
    console.error('Firebase init error:', e);
    showOfflineBadge();
  }
}

/* ─────────────────────────────────────────────────────────
   AUTH — Sign In / Out
───────────────────────────────────────────────────────── */
function signInWithGoogle() {
  if (!fbAuth) return;
  const provider = new firebase.auth.GoogleAuthProvider();
  fbAuth.signInWithPopup(provider).catch(err => {
    showAuthError(err.message);
  });
}

function signInWithEmail() {
  const email = document.getElementById('auth-email')?.value?.trim();
  const pass  = document.getElementById('auth-pass')?.value;
  if (!email || !pass) { showAuthError('Enter email and password.'); return; }
  clearAuthError();
  fbAuth.signInWithEmailAndPassword(email, pass)
    .catch(err => {
      // If user doesn't exist, create account
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        fbAuth.createUserWithEmailAndPassword(email, pass)
          .catch(e => showAuthError(e.message));
      } else {
        showAuthError(err.message);
      }
    });
}

function signOut() {
  if (!fbAuth) return;
  if (confirm('Sign out of ChessMaster?')) {
    fbAuth.signOut();
  }
}

function showAuthError(msg) {
  const el = document.getElementById('auth-error');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}
function clearAuthError() {
  const el = document.getElementById('auth-error');
  if (el) { el.textContent = ''; el.style.display = 'none'; }
}

/* ─────────────────────────────────────────────────────────
   AUTH STATE HANDLERS
───────────────────────────────────────────────────────── */
async function onUserSignedIn(user) {
  // Update header UI
  updateHeaderForUser(user);

  // Close login modal if open
  document.getElementById('login-modal')?.classList.remove('show');

  // Load user data from Firestore
  try {
    const docRef = fbDb.collection('users').doc(user.uid);
    const snap = await docRef.get();

    if (snap.exists) {
      const data = snap.data();
      // Restore ELO from cloud (take higher of cloud vs local)
      const cloudElo = data.elo || 1200;
      const localElo = parseInt(localStorage.getItem('cm_elo') || '1200');
      const finalElo = Math.max(cloudElo, localElo);
      localStorage.setItem('cm_elo', finalElo);

      // Restore streak
      if (data.streak) {
        localStorage.setItem('cm_streak', JSON.stringify(data.streak));
      }

      if (typeof updateEloDisplay === 'function') updateEloDisplay();
      if (typeof updateStreakDisplay === 'function') updateStreakDisplay();

    } else {
      // First time user — create their document
      await docRef.set({
        displayName: user.displayName || user.email?.split('@')[0] || 'Player',
        email: user.email || '',
        photoURL: user.photoURL || '',
        elo: parseInt(localStorage.getItem('cm_elo') || '1200'),
        streak: JSON.parse(localStorage.getItem('cm_streak') || '{"count":0,"last":"","best":0}'),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }

    // Set username for leaderboard
    const name = user.displayName || user.email?.split('@')[0] || 'Player';
    localStorage.setItem('cm_username', name);

    showToast('✅ Signed in as ' + name);
  } catch (e) {
    console.error('Error loading user data:', e);
  }
}

function onUserSignedOut() {
  updateHeaderForGuest();
  showToast('👋 Signed out — playing as Guest');
}

/* ─────────────────────────────────────────────────────────
   HEADER UI
───────────────────────────────────────────────────────── */
function updateHeaderForUser(user) {
  const loginBtn  = document.getElementById('login-btn');
  const userChip  = document.getElementById('user-chip');
  const userAvatar= document.getElementById('user-avatar');
  const userName  = document.getElementById('user-name');

  if (loginBtn)  loginBtn.style.display  = 'none';
  if (userChip)  userChip.style.display  = 'flex';
  if (userAvatar) {
    if (user.photoURL) {
      userAvatar.innerHTML = `<img src="${user.photoURL}" style="width:24px;height:24px;border-radius:50%;object-fit:cover;">`;
    } else {
      userAvatar.textContent = (user.displayName || user.email || '?')[0].toUpperCase();
    }
  }
  if (userName) {
    userName.textContent = user.displayName || user.email?.split('@')[0] || 'Player';
  }
}

function updateHeaderForGuest() {
  const loginBtn = document.getElementById('login-btn');
  const userChip = document.getElementById('user-chip');
  if (loginBtn) loginBtn.style.display = 'inline-flex';
  if (userChip) userChip.style.display = 'none';
}

function showOfflineBadge() {
  const loginBtn = document.getElementById('login-btn');
  if (loginBtn) {
    loginBtn.textContent = '🔧 Setup Firebase';
    loginBtn.title = 'Open js/firebase-config.js and add your Firebase keys';
    loginBtn.onclick = () => alert('To enable login:\n1. Open js/firebase-config.js\n2. Add your Firebase project keys\n3. Enable Google Auth + Firestore in Firebase Console\n\nSee js/firebase-config.js for full instructions.');
  }
}

/* ─────────────────────────────────────────────────────────
   MODALS
───────────────────────────────────────────────────────── */
function openLoginModal() {
  clearAuthError();
  document.getElementById('login-modal')?.classList.add('show');
}
function closeLoginModal() {
  document.getElementById('login-modal')?.classList.remove('show');
}

function openUserProfile() {
  if (!currentUser) { openLoginModal(); return; }
  const modal = document.getElementById('profile-modal');
  if (!modal) return;

  document.getElementById('profile-name').textContent  = currentUser.displayName || currentUser.email?.split('@')[0] || 'Player';
  document.getElementById('profile-email').textContent = currentUser.email || '';
  document.getElementById('profile-elo').textContent   = getElo();

  const avatarEl = document.getElementById('profile-avatar');
  if (avatarEl) {
    if (currentUser.photoURL) {
      avatarEl.innerHTML = `<img src="${currentUser.photoURL}" style="width:64px;height:64px;border-radius:50%;object-fit:cover;border:2px solid var(--gold);">`;
    } else {
      avatarEl.textContent = (currentUser.displayName || currentUser.email || '?')[0].toUpperCase();
      avatarEl.style.cssText = 'width:64px;height:64px;border-radius:50%;background:var(--gold);color:#120d04;display:flex;align-items:center;justify-content:center;font-size:2rem;font-weight:700;';
    }
  }

  // Load stats from Firestore
  loadProfileStats();
  modal.classList.add('show');
}

async function loadProfileStats() {
  if (!currentUser || !fbDb) return;
  try {
    const snap = await fbDb.collection('users').doc(currentUser.uid).get();
    if (snap.exists) {
      const data = snap.data();
      const streak = data.streak || {};
      document.getElementById('profile-streak').textContent  = streak.count || 0;
      document.getElementById('profile-best').textContent    = streak.best  || 0;
    }
    // Count games
    const gSnap = await fbDb.collection('users').doc(currentUser.uid)
      .collection('games').orderBy('date', 'desc').limit(1).get();
    document.getElementById('profile-games').textContent = gSnap.size || 0;
  } catch(e) { console.error(e); }
}

function closeProfileModal() {
  document.getElementById('profile-modal')?.classList.remove('show');
}

/* ─────────────────────────────────────────────────────────
   CLOUD ELO — Override localStorage ELO functions
───────────────────────────────────────────────────────── */

// Save ELO to both localStorage AND Firestore
const _origSaveElo = typeof saveElo === 'function' ? saveElo : null;
if (typeof saveElo === 'function') {
  window._localSaveElo = saveElo;
}

function saveElo(v) {
  const val = Math.max(100, Math.round(v));
  localStorage.setItem('cm_elo', val);
  // Sync to Firestore
  if (currentUser && fbDb) {
    fbDb.collection('users').doc(currentUser.uid).update({ elo: val })
      .catch(e => console.warn('ELO sync failed:', e));
  }
}

/* ─────────────────────────────────────────────────────────
   CLOUD LEADERBOARD — Global (Firestore)
───────────────────────────────────────────────────────── */
const _origUpdateLeaderboardEntry = typeof updateLeaderboardEntry === 'function' ? updateLeaderboardEntry : null;

function updateLeaderboardEntry(elo, result) {
  // Keep local leaderboard working
  if (_origUpdateLeaderboardEntry) _origUpdateLeaderboardEntry(elo, result);

  // Also push to global Firestore leaderboard
  if (!currentUser || !fbDb) return;
  const name = currentUser.displayName || currentUser.email?.split('@')[0] || 'Player';
  const lbRef = fbDb.collection('leaderboard').doc(currentUser.uid);
  lbRef.get().then(snap => {
    const existing = snap.exists ? snap.data() : { gamesW: 0, gamesD: 0, gamesL: 0 };
    const _countryCode = typeof detectMyCountry === 'function' ? detectMyCountry() : null;
    const _payload = {
      name,
      photoURL: currentUser.photoURL || '',
      elo,
      gamesW: (existing.gamesW || 0) + (result === 'w' ? 1 : 0),
      gamesD: (existing.gamesD || 0) + (result === 'draw' ? 1 : 0),
      gamesL: (existing.gamesL || 0) + (result !== 'w' && result !== 'draw' ? 1 : 0),
      lastPlayed: firebase.firestore.FieldValue.serverTimestamp()
    };
    if (_countryCode) _payload.country = _countryCode;
    lbRef.set(_payload);
  });
}

// NOTE: showLeaderboard is handled by leaderboard-upgrade.js (loaded after this file)

/* ─────────────────────────────────────────────────────────
   CLOUD GAME HISTORY — Firestore
───────────────────────────────────────────────────────── */
const _origSaveCompletedGame = typeof saveCompletedGame === 'function' ? saveCompletedGame : null;

function saveCompletedGame() {
  // Always save locally
  if (_origSaveCompletedGame) _origSaveCompletedGame();

  // Also save to Firestore if logged in
  if (!currentUser || !fbDb) return;
  if (!hist || hist.length < 2) return;

  const gameData = {
    date: firebase.firestore.FieldValue.serverTimestamp(),
    mode: typeof mode !== 'undefined' ? mode : 'human',
    result: typeof getCurrentResult === 'function' ? getCurrentResult() : '*',
    moves: hist.map(h => h.note),
    moveCount: hist.length,
    aiLevel: typeof aiDifficulty !== 'undefined' ? aiDifficulty : 0,
    aiPersonality: typeof aiPersonality !== 'undefined' ? aiPersonality : 'balanced',
    elo: getElo()
  };

  fbDb.collection('users').doc(currentUser.uid)
    .collection('games').add(gameData)
    .catch(e => console.warn('Game save to cloud failed:', e));
}

/* ─────────────────────────────────────────────────────────
   CLOUD STREAK — Sync to Firestore
───────────────────────────────────────────────────────── */
const _origSaveStreak = typeof saveStreak === 'function' ? saveStreak : null;

function saveStreak(s) {
  localStorage.setItem('cm_streak', JSON.stringify(s));
  if (currentUser && fbDb) {
    fbDb.collection('users').doc(currentUser.uid)
      .update({ streak: s })
      .catch(e => console.warn('Streak sync failed:', e));
  }
}

/* ─────────────────────────────────────────────────────────
   CLOUD GAME HISTORY VIEW — Load from Firestore
───────────────────────────────────────────────────────── */
const _origShowGameHistory = typeof showGameHistory === 'function' ? showGameHistory : null;

function showGameHistory() {
  const modal = document.getElementById('history-modal');
  if (!modal) return;
  modal.classList.add('show');

  if (currentUser && fbDb) {
    loadCloudGameHistory();
  } else if (_origShowGameHistory) {
    _origShowGameHistory();
  }
}

async function loadCloudGameHistory() {
  const list = document.getElementById('history-list');
  if (!list) return;
  list.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-dim)">☁️ Loading your games…</div>';

  try {
    const snap = await fbDb.collection('users').doc(currentUser.uid)
      .collection('games')
      .orderBy('date', 'desc')
      .limit(25)
      .get();

    if (snap.empty) {
      list.innerHTML = '<p style="text-align:center;color:var(--text-dim);padding:2rem">No cloud games yet. Finish a game to save it!</p>';
      return;
    }

    const games = [];
    snap.forEach(doc => games.push({ id: doc.id, ...doc.data() }));

    list.innerHTML = games.map(g => {
      const modeLabel = g.mode === 'ai' ? `🤖 vs AI (Lvl ${g.aiLevel || '?'})` :
                        g.mode === 'online' ? '🌐 Online' : '👥 2 Players';
      const dateStr = g.date?.toDate?.().toLocaleDateString() || g.date || '';
      const resultClass = g.result === '1-0' ? 'w-win' : g.result === '0-1' ? 'b-win' : 'draw-res';
      return `
        <div class="hc-card">
          <div class="hc-top">
            <span class="hc-mode">${modeLabel}</span>
            <span class="hc-date">${dateStr}</span>
          </div>
          <div class="hc-result-row">
            <span class="hc-result ${resultClass}">${g.result || '*'}</span>
            <span class="hc-moves-count">${g.moveCount || g.moves?.length || 0} moves</span>
            <span class="hc-moves-count" style="margin-left:auto">ELO: ${g.elo || '—'}</span>
          </div>
          <div class="hc-notation">${(g.moves || []).slice(0, 12).join(' ')}${(g.moves || []).length > 12 ? '…' : ''}</div>
        </div>
      `;
    }).join('');

  } catch(e) {
    console.error('Cloud history load failed:', e);
    list.innerHTML = '<p style="text-align:center;color:var(--text-dim);padding:1rem">Could not load cloud history. Showing local games.</p>';
    if (_origShowGameHistory) _origShowGameHistory();
  }
}

/* ─────────────────────────────────────────────────────────
   TOAST
───────────────────────────────────────────────────────── */
function showToast(msg, duration = 3000) {
  let toast = document.getElementById('fb-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'fb-toast';
    toast.style.cssText = `position:fixed;bottom:5rem;left:50%;transform:translateX(-50%) translateY(80px);
      background:var(--bg2);border:1px solid var(--border2);color:var(--text);
      font-family:'Lora',serif;font-size:.85rem;padding:.6rem 1.4rem;
      border-radius:24px;box-shadow:0 4px 20px var(--shadow);
      z-index:950;transition:transform .35s cubic-bezier(.34,1.56,.64,1),opacity .35s;
      opacity:0;pointer-events:none;white-space:nowrap;`;
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.transform = 'translateX(-50%) translateY(0)';
  toast.style.opacity = '1';
  clearTimeout(toast._t);
  toast._t = setTimeout(() => {
    toast.style.transform = 'translateX(-50%) translateY(80px)';
    toast.style.opacity = '0';
  }, duration);
}

/* ─────────────────────────────────────────────────────────
   INIT on DOM ready
───────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initFirebase();
  // Close login modal on backdrop click
  document.getElementById('login-modal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('login-modal')) closeLoginModal();
  });
  document.getElementById('profile-modal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('profile-modal')) closeProfileModal();
  });
});
