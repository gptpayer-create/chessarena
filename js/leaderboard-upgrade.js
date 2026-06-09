/* ═══════════════════════════════════════════════════════════════
   ChessArena — Leaderboard Upgrade v2.0
   ──────────────────────────────────────────────────────────────
   Tabs: Global | Country | Daily | Weekly | Monthly
   Rewards: Coins + Frame + Title + Favicon per rank tier
═══════════════════════════════════════════════════════════════ */

/* ── Current active tab ── */
let lbActiveTab = 'global';

/* ── Reward tiers config ── */
const LB_REWARDS = [
  {
    rank: '#1',
    label: '🥇 Rank #1',
    cls: 'reward-gold',
    coin: 1000,
    frame: { id: 'frame_royal', name: 'Royal Gold Frame', emoji: '👑' },
    title: { id: 'title_grandmaster', name: 'Grand Master', emoji: '♛' },
    favicon: { id: 'fav_royal', name: 'Royal Crown', emoji: '⭐' },
  },
  {
    rank: '#2–3',
    label: '🥈 Rank #2–3',
    cls: 'reward-silver',
    coin: 500,
    frame: { id: 'frame_elite', name: 'Elite Silver Frame', emoji: '💎' },
    title: { id: 'title_elite', name: 'Elite', emoji: '🔷' },
    favicon: { id: 'fav_elite', name: 'Diamond Star', emoji: '💫' },
  },
  {
    rank: '#4–10',
    label: '🥉 Rank #4–10',
    cls: 'reward-bronze',
    coin: 200,
    frame: { id: 'frame_knight', name: 'Bronze Knight Frame', emoji: '⚔️' },
    title: { id: 'title_knight', name: 'Knight', emoji: '🐴' },
    favicon: { id: 'fav_knight', name: 'Bronze Shield', emoji: '🔥' },
  },
  {
    rank: '#11–20',
    label: '🎗️ Rank #11–20',
    cls: 'reward-participant',
    coin: 100,
    frame: { id: 'frame_veteran', name: 'Veteran Frame', emoji: '🛡️' },
    title: { id: 'title_veteran', name: 'Veteran', emoji: '📛' },
    favicon: null,
  },
];

/* ── Tab labels & subtitle ── */
const LB_TABS = {
  global:  { icon: '🌐', label: 'Global',  sub: 'All-time global rankings' },
  country: { icon: '🗺️', label: 'Country', sub: 'Rankings in your country' },
  daily:   { icon: '📅', label: 'Daily',   sub: "Today's top performers" },
  weekly:  { icon: '📆', label: 'Weekly',  sub: 'This week\'s rankings (resets Monday)' },
  monthly: { icon: '🗓️', label: 'Monthly', sub: 'This month\'s rankings' },
};

/* ═══════════════════════════════════════════
   MAIN SHOW LEADERBOARD — overrides firebase.js
════════════════════════════════════════════ */
function showLeaderboard(tab) {
  lbActiveTab = tab || lbActiveTab || 'global';
  document.getElementById('lb-overlay')?.classList.add('show');
  _switchLbTab(lbActiveTab);
}

function hideLeaderboard() {
  document.getElementById('lb-overlay')?.classList.remove('show');
}

/* ── Switch tab ── */
function _switchLbTab(tab) {
  lbActiveTab = tab;

  // Update tab buttons
  document.querySelectorAll('.lb-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });

  // Update subtitle
  const subEl = document.getElementById('lb-subtitle');
  if (subEl) subEl.textContent = LB_TABS[tab]?.sub || '';

  // Update rewards section title
  const rewardTitle = document.getElementById('lb-reward-period');
  if (rewardTitle) rewardTitle.textContent = LB_TABS[tab]?.label + ' Rewards';

  // Load data
  _loadLbData(tab);
}

/* ── Load data for tab ── */
async function _loadLbData(tab) {
  const tbody = document.getElementById('lb-tbody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:1.5rem;color:var(--text-dim)">
    <span class="lb-spinner"></span> Loading…</td></tr>`;

  try {
    if (window.fbDb && window.currentUser) {
      await _loadFirebaseLb(tab);
    } else {
      _loadLocalLb(tab);
    }
  } catch(e) {
    console.warn('LB load failed:', e);
    _loadLocalLb(tab);
  }
}

/* ═══════════════════════════════════════════
   FIREBASE LEADERBOARD
════════════════════════════════════════════ */
async function _loadFirebaseLb(tab) {
  const tbody = document.getElementById('lb-tbody');
  const myCode = typeof detectMyCountry === 'function' ? detectMyCountry() : null;

  let query = window.fbDb.collection('leaderboard').orderBy('elo', 'desc');

  // Date boundaries
  const now = new Date();
  let dateFrom = null;

  if (tab === 'daily') {
    dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (tab === 'weekly') {
    const day = now.getDay(); // 0=Sun
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
    dateFrom = new Date(now.getFullYear(), now.getMonth(), diff);
  } else if (tab === 'monthly') {
    dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  if (dateFrom) {
    query = query.where('lastPlayed', '>=', firebase.firestore.Timestamp.fromDate(dateFrom));
  }

  query = query.limit(30);

  const snap = await query.get();

  let rows = [];
  snap.forEach(doc => {
    const d = doc.data();
    const isMe = window.currentUser && doc.id === window.currentUser.uid;
    rows.push({ ...d, uid: doc.id, isMe });
  });

  // Country filter
  if (tab === 'country') {
    rows = rows.filter(r => r.country === myCode);
    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:1.5rem;color:var(--text-dim)">
        ${myCode ? `No players from ${COUNTRY_NAMES?.[myCode] || myCode} yet!` : 'Country not detected. Play to appear here!'}
      </td></tr>`;
      return;
    }
  }

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:1.5rem;color:var(--text-dim)">
      No players yet for this period. Be the first! 🚀</td></tr>`;
    return;
  }

  _renderLbRows(rows, tbody, tab);
}

/* ═══════════════════════════════════════════
   LOCAL STORAGE LEADERBOARD
════════════════════════════════════════════ */
function _loadLocalLb(tab) {
  const tbody = document.getElementById('lb-tbody');
  const me = typeof getUsername === 'function' ? getUsername() : (localStorage.getItem('cm_username') || 'You');
  const myCode = typeof detectMyCountry === 'function' ? detectMyCountry() : null;

  let lb = JSON.parse(localStorage.getItem('cm_lb') || '[]');

  const now = new Date();
  const todayStr = now.toLocaleDateString();
  const monthStr = `${now.getMonth() + 1}/${now.getFullYear()}`;

  // Get week boundaries
  const weekStart = new Date(now);
  const day = now.getDay();
  weekStart.setDate(now.getDate() - day + (day === 0 ? -6 : 1));
  weekStart.setHours(0, 0, 0, 0);

  if (tab === 'country') {
    // localStorage doesn't store country per entry; attach detected country to 'me'
    lb = lb.filter(e => {
      if (e.n === me) return true; // always show self
      return false; // can't determine other local players' country
    });
    if (!lb.length) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:1.5rem;color:var(--text-dim)">
        Sign in with Google to see country rankings! 🌍</td></tr>`;
      return;
    }
  } else if (tab === 'daily') {
    lb = lb.filter(e => e.last === todayStr);
    if (!lb.length) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:1.5rem;color:var(--text-dim)">
        No games today yet. Play to appear here! ♟️</td></tr>`;
      return;
    }
  } else if (tab === 'weekly') {
    lb = lb.filter(e => {
      if (!e.last) return false;
      // parse the date string
      const d = new Date(e.last);
      return !isNaN(d) && d >= weekStart;
    });
    if (!lb.length) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:1.5rem;color:var(--text-dim)">
        No games this week yet. Start playing! ♟️</td></tr>`;
      return;
    }
  } else if (tab === 'monthly') {
    lb = lb.filter(e => {
      if (!e.last) return false;
      const d = new Date(e.last);
      return !isNaN(d) && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    if (!lb.length) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:1.5rem;color:var(--text-dim)">
        No games this month yet. Start playing! ♟️</td></tr>`;
      return;
    }
  }

  if (!lb.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:1.5rem;color:var(--text-dim)">
      Play vs AI to build your rating! ♟️</td></tr>`;
    return;
  }

  // Convert local format → unified format
  const rows = lb.map(e => ({
    name: e.n,
    elo: e.e,
    gamesW: e.w || 0,
    gamesD: e.d || 0,
    gamesL: e.l || 0,
    country: e.n === me ? myCode : null,
    lastPlayed: e.last ? { toDate: () => new Date(e.last) } : null,
    isMe: e.n === me,
  }));

  _renderLbRows(rows, tbody, tab);
}

/* ═══════════════════════════════════════════
   RENDER ROWS
════════════════════════════════════════════ */
function _renderLbRows(rows, tbody, tab) {
  const flagFn = typeof flagHtml === 'function' ? flagHtml : () => '';
  const codeToFlag = typeof countryCodeToFlag === 'function' ? countryCodeToFlag : () => '';

  tbody.innerHTML = rows.map((d, i) => {
    const rankEmoji = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `<span class="lb-rank-num">${i + 1}</span>`;
    const reward = _getRewardForRank(i + 1);
    const rewardBadge = reward
      ? `<span class="lb-reward-badge ${reward.cls}" title="${reward.frame.name} + ${reward.coin} coins">${reward.frame.emoji}</span>`
      : '';

    const photo = d.photoURL
      ? `<img src="${d.photoURL}" style="width:22px;height:22px;border-radius:50%;object-fit:cover;flex-shrink:0;">`
      : `<span class="lb-avatar-placeholder">${(d.name || 'P')[0].toUpperCase()}</span>`;

    const flag = d.country ? `<span title="${COUNTRY_NAMES?.[d.country] || d.country}" style="font-size:.95rem;">${codeToFlag(d.country)}</span>` : '';

    const dateStr = d.lastPlayed?.toDate?.()
      ? d.lastPlayed.toDate().toLocaleDateString()
      : (d.lastPlayed || '-');

    return `<tr class="${d.isMe ? 'lb-me' : ''}">
      <td class="lb-rank-cell">${rankEmoji} ${rewardBadge}</td>
      <td>
        <div class="lb-player-cell">
          ${photo}
          <div class="lb-player-info">
            <span class="lb-player-name">${d.name || 'Player'}${d.isMe ? ' <span class="lb-you-tag">(You)</span>' : ''}</span>
            <span class="lb-player-country">${flag}</span>
          </div>
        </div>
      </td>
      <td><strong class="lb-elo">${d.elo || 1200}</strong></td>
      <td class="lb-record"><span class="lb-w">${d.gamesW || 0}W</span> <span class="lb-d">${d.gamesD || 0}D</span> <span class="lb-l">${d.gamesL || 0}L</span></td>
      <td><span class="lb-date">${dateStr}</span></td>
    </tr>`;
  }).join('');
}

/* ── Get reward for a given rank ── */
function _getRewardForRank(rank) {
  if (rank === 1) return LB_REWARDS[0];
  if (rank <= 3) return LB_REWARDS[1];
  if (rank <= 10) return LB_REWARDS[2];
  if (rank <= 20) return LB_REWARDS[3];
  return null;
}

/* ═══════════════════════════════════════════
   CLAIM REWARD (simulated)
════════════════════════════════════════════ */
function claimLbReward(rewardIdx) {
  const reward = LB_REWARDS[rewardIdx];
  if (!reward) return;

  // Add coins
  const coins = parseInt(localStorage.getItem('cm_coins') || '0') + reward.coin;
  localStorage.setItem('cm_coins', coins);

  // Store earned frame, title, favicon
  const earned = JSON.parse(localStorage.getItem('cm_lb_rewards') || '{}');
  earned[reward.frame.id] = true;
  earned[reward.title.id] = true;
  if (reward.favicon) earned[reward.favicon.id] = true;
  localStorage.setItem('cm_lb_rewards', JSON.stringify(earned));

  // Show toast
  _showRewardToast(reward);
}

function _showRewardToast(reward) {
  const t = document.createElement('div');
  t.className = 'lb-reward-toast';
  t.innerHTML = `
    <div class="toast-icon">${reward.frame.emoji}</div>
    <div class="toast-content">
      <strong>Reward Claimed!</strong>
      <span>+${reward.coin} 🪙 • ${reward.title.name} Title • ${reward.frame.name}</span>
    </div>`;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('show'), 50);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 3500);
}

/* ═══════════════════════════════════════════
   SAVE USERNAME (override)
════════════════════════════════════════════ */
function saveUsername() {
  const v = (document.getElementById('lb-name-inp')?.value || '').trim().slice(0, 20);
  if (!v) return;
  localStorage.setItem('cm_username', v);
  if (typeof updateEloDisplay === 'function') updateEloDisplay();
  // Reload current tab
  _loadLbData(lbActiveTab);
}

/* ═══════════════════════════════════════════
   INIT — inject HTML + CSS, attach events
════════════════════════════════════════════ */
(function initLeaderboardUpgrade() {
  // Inject CSS
  const style = document.createElement('style');
  style.textContent = `
    /* ── Leaderboard Tabs ── */
    .lb-tabs { display:flex; gap:.35rem; margin-bottom:1rem; flex-wrap:wrap; justify-content:center; }
    .lb-tab-btn {
      padding:.32rem .72rem; border-radius:20px; border:1.5px solid rgba(200,160,60,.25);
      background:transparent; color:var(--text-dim); font-size:.73rem; font-family:'Lora',serif;
      cursor:pointer; transition:all .2s; white-space:nowrap; line-height:1.3;
    }
    .lb-tab-btn:hover { border-color:rgba(200,160,60,.5); color:var(--text); background:rgba(200,160,60,.07); }
    .lb-tab-btn.active { background:rgba(200,160,60,.18); border-color:var(--gold); color:var(--gold); font-weight:600; }

    /* ── Leaderboard Box override ── */
    .lb-box { max-width:560px !important; padding:1.4rem 1.6rem !important; }
    .lb-subtitle { font-size:.75rem; color:var(--text-dim); text-align:center; margin-bottom:.6rem; margin-top:-.3rem; }

    /* ── Spinner ── */
    .lb-spinner { display:inline-block; width:18px; height:18px; border:2.5px solid rgba(200,160,60,.2); border-top-color:var(--gold); border-radius:50%; animation:lb-spin .7s linear infinite; vertical-align:middle; margin-right:.4rem; }
    @keyframes lb-spin { to { transform:rotate(360deg); } }

    /* ── Table cells ── */
    .lb-rank-cell { min-width:56px; }
    .lb-rank-num { display:inline-block; width:22px; text-align:center; font-size:.75rem; color:var(--text-dim); }
    .lb-reward-badge { font-size:.9rem; vertical-align:middle; }
    .lb-player-cell { display:flex; align-items:center; gap:.4rem; }
    .lb-player-info { display:flex; flex-direction:column; }
    .lb-player-name { font-size:.78rem; color:var(--text); }
    .lb-player-country { font-size:.75rem; }
    .lb-you-tag { color:var(--gold); font-size:.65rem; }
    .lb-avatar-placeholder { width:22px; height:22px; border-radius:50%; background:rgba(200,160,60,.25); color:var(--gold); display:flex; align-items:center; justify-content:center; font-size:.7rem; font-weight:700; flex-shrink:0; }
    .lb-elo { color:var(--gold); font-size:.88rem; }
    .lb-record { font-size:.72rem; }
    .lb-w { color:#4caf50; } .lb-d { color:var(--text-dim); } .lb-l { color:#e57373; }
    .lb-date { font-size:.65rem; color:var(--text-dim); }
    .lb-me td { background:rgba(200,160,60,.09) !important; }

    /* ── Reward Section ── */
    .lb-rewards-section {
      margin-top:1.1rem; border-top:1px solid var(--border2); padding-top:1rem;
    }
    .lb-rewards-header {
      display:flex; align-items:center; justify-content:space-between; margin-bottom:.7rem;
    }
    .lb-rewards-title {
      font-family:'Playfair Display',serif; font-size:1rem; color:var(--gold);
    }
    .lb-reward-period { font-size:.7rem; color:var(--text-dim); }
    .lb-rewards-grid { display:grid; grid-template-columns:1fr 1fr; gap:.5rem; }
    @media(max-width:440px) { .lb-rewards-grid { grid-template-columns:1fr; } }

    .lb-reward-card {
      border-radius:10px; padding:.6rem .75rem; border:1.5px solid transparent;
      position:relative; overflow:hidden;
    }
    .lb-reward-card.reward-gold   { background:rgba(200,160,60,.12); border-color:rgba(200,160,60,.4); }
    .lb-reward-card.reward-silver { background:rgba(160,180,200,.1); border-color:rgba(160,180,200,.35); }
    .lb-reward-card.reward-bronze { background:rgba(180,120,60,.1); border-color:rgba(180,120,60,.35); }
    .lb-reward-card.reward-participant { background:rgba(120,140,160,.08); border-color:rgba(120,140,160,.2); }

    .lb-reward-card-rank { font-size:.78rem; font-weight:700; margin-bottom:.35rem; }
    .reward-gold   .lb-reward-card-rank { color:#ffd700; }
    .reward-silver .lb-reward-card-rank { color:#c0d0e0; }
    .reward-bronze .lb-reward-card-rank { color:#cd8c4a; }
    .reward-participant .lb-reward-card-rank { color:var(--text-dim); }

    .lb-reward-items { display:flex; flex-direction:column; gap:.2rem; }
    .lb-reward-item-row {
      display:flex; align-items:center; gap:.35rem; font-size:.71rem; color:var(--text);
    }
    .lb-reward-item-row .ri-icon { font-size:.85rem; min-width:18px; text-align:center; }
    .lb-reward-item-row .ri-label { color:var(--text-dim); }

    /* ── Reward Toast ── */
    .lb-reward-toast {
      position:fixed; bottom:2rem; right:2rem; z-index:9999; display:flex; align-items:center; gap:.7rem;
      background:var(--bg2); border:2px solid var(--gold); border-radius:12px; padding:.8rem 1.1rem;
      box-shadow:0 8px 30px rgba(0,0,0,.5); transform:translateY(120%); opacity:0; transition:all .35s cubic-bezier(.34,1.56,.64,1);
      max-width:320px;
    }
    .lb-reward-toast.show { transform:translateY(0); opacity:1; }
    .lb-reward-toast .toast-icon { font-size:1.6rem; }
    .lb-reward-toast .toast-content { display:flex; flex-direction:column; gap:.15rem; }
    .lb-reward-toast .toast-content strong { color:var(--gold); font-size:.85rem; }
    .lb-reward-toast .toast-content span { color:var(--text-dim); font-size:.74rem; }

    /* ── My Rank Banner ── */
    .lb-my-rank-banner {
      margin-top:.7rem; padding:.5rem .8rem; border-radius:8px;
      background:rgba(200,160,60,.08); border:1px solid rgba(200,160,60,.2);
      display:flex; align-items:center; justify-content:space-between; gap:.5rem;
      font-size:.75rem; flex-wrap:wrap;
    }
    .lb-my-rank-banner .my-rank-info { color:var(--text); }
    .lb-my-rank-banner .my-rank-info strong { color:var(--gold); }
  `;
  document.head.appendChild(style);

  // Replace leaderboard HTML after DOM ready
  function _injectHTML() {
    const overlay = document.getElementById('lb-overlay');
    if (!overlay) return;

    const rewardsHTML = LB_REWARDS.map((r, i) => `
      <div class="lb-reward-card ${r.cls}">
        <div class="lb-reward-card-rank">${r.label}</div>
        <div class="lb-reward-items">
          <div class="lb-reward-item-row"><span class="ri-icon">🪙</span><span class="ri-label">${r.coin} Coins</span></div>
          <div class="lb-reward-item-row"><span class="ri-icon">${r.frame.emoji}</span><span class="ri-label">${r.frame.name}</span></div>
          <div class="lb-reward-item-row"><span class="ri-icon">${r.title.emoji}</span><span class="ri-label">${r.title.name} Title</span></div>
          ${r.favicon ? `<div class="lb-reward-item-row"><span class="ri-icon">${r.favicon.emoji}</span><span class="ri-label">${r.favicon.name} Favicon</span></div>` : ''}
        </div>
      </div>
    `).join('');

    const tabsHTML = Object.entries(LB_TABS).map(([key, t]) =>
      `<button class="lb-tab-btn${key === 'global' ? ' active' : ''}" data-tab="${key}" onclick="lbTabClick('${key}')">${t.icon} ${t.label}</button>`
    ).join('');

    overlay.innerHTML = `
      <div class="lb-box">
        <div class="lb-title">🏆 Leaderboard</div>

        <!-- Tabs -->
        <div class="lb-tabs">${tabsHTML}</div>

        <!-- Subtitle -->
        <div class="lb-subtitle" id="lb-subtitle">${LB_TABS.global.sub}</div>

        <!-- Table -->
        <table class="lb-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Player</th>
              <th>Rating</th>
              <th>Record</th>
              <th>Last</th>
            </tr>
          </thead>
          <tbody id="lb-tbody">
            <tr><td colspan="5" style="text-align:center;padding:1.5rem;color:var(--text-dim)">Loading…</td></tr>
          </tbody>
        </table>

        <!-- Rewards Section -->
        <div class="lb-rewards-section">
          <div class="lb-rewards-header">
            <div class="lb-rewards-title">🎁 Rewards</div>
            <div class="lb-reward-period" id="lb-reward-period">Global Rewards</div>
          </div>
          <div class="lb-rewards-grid">${rewardsHTML}</div>
        </div>

        <!-- Username row -->
        <div class="lb-name-row" style="margin-top:.9rem;">
          <label for="lb-name-inp" style="font-size:.78rem;color:var(--text-dim);white-space:nowrap;">Your name:</label>
          <input class="lb-inp" id="lb-name-inp" type="text" placeholder="Enter name…" maxlength="20"
            onkeydown="if(event.key==='Enter')saveUsername()">
          <button class="btn" onclick="saveUsername()" style="padding:.3rem .7rem;font-size:.78rem;">Save</button>
        </div>

        <button class="btn btn-primary" style="width:100%;margin-top:.9rem;" onclick="hideLeaderboard()">✕ Close</button>
      </div>`;

    // Pre-fill name
    const inp = document.getElementById('lb-name-inp');
    if (inp) inp.value = localStorage.getItem('cm_username') || '';
  }

  // Run after DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _injectHTML);
  } else {
    _injectHTML();
  }
})();

/* ── Tab click handler (global fn) ── */
function lbTabClick(tab) {
  _switchLbTab(tab);
}

console.log('[ChessArena] Leaderboard Upgrade v2.0 loaded ✓');
