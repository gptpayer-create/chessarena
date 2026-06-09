/* ═══════════════════════════════════════════════════════════════
   ChessArena — Level System  ⬆️  v1.0
   ──────────────────────────────────────────────────────────────
   Level 1→100 · 10 Tiers · XP rewards · Level-up modal
   Daily streak · Monthly season · Prestige (max 5★)
   All data localStorage + Firebase sync (optional)
═══════════════════════════════════════════════════════════════ */

/* ── XP SOURCES ────────────────────────────────────────────── */
const XP_SRC = {
  win          : 30,  loss        : 5,   draw        : 12,
  win_higher_elo:50,  daily_first  :20,  daily_login  :10,
  streak_3     : 15,  streak_5     :25,  streak_10    :40,
  tourney_win  : 40,  tourney_top3 :100, tourney_top1 :300,
  puzzle       : 8,   daily_challenge:25,
  ko_win       : 40,  ko_champion  :400,
  prestige_bonus:50
};

/* ── 10 TIERS ──────────────────────────────────────────────── */
const LS_TIERS = [
  { min:1,   max:10,  name:'Peasant',     icon:'🪨', color:'#888888',  glow:'rgba(136,136,136,.3)',   frame:'stone'    },
  { min:11,  max:20,  name:'Pawn',        icon:'🪵', color:'#8B5E3C',  glow:'rgba(139,94,60,.35)',    frame:'wood'     },
  { min:21,  max:30,  name:'Squire',      icon:'🥉', color:'#cd7f32',  glow:'rgba(205,127,50,.4)',    frame:'bronze'   },
  { min:31,  max:40,  name:'Knight',      icon:'⚔️', color:'#a0a0b0',  glow:'rgba(160,160,176,.35)',  frame:'iron'     },
  { min:41,  max:50,  name:'Bishop',      icon:'🛡️', color:'#5b8dd9',  glow:'rgba(91,141,217,.4)',    frame:'steel'    },
  { min:51,  max:60,  name:'Castellan',   icon:'🥈', color:'#a8c8e8',  glow:'rgba(168,200,232,.4)',   frame:'silver'   },
  { min:61,  max:70,  name:'Rook Lord',   icon:'🏺', color:'#c8a028',  glow:'rgba(200,160,40,.45)',   frame:'gold'     },
  { min:71,  max:80,  name:'Grand Duke',  icon:'💎', color:'#00e5ff',  glow:'rgba(0,229,255,.45)',    frame:'diamond'  },
  { min:81,  max:90,  name:'Archmage',    icon:'🔮', color:'#b44cf0',  glow:'rgba(180,76,240,.45)',   frame:'mystic'   },
  { min:91,  max:99,  name:'King',        icon:'👑', color:'#ff6b35',  glow:'rgba(255,107,53,.45)',   frame:'legend'   },
  { min:100, max:100, name:'Grandmaster', icon:'⚡', color:'rainbow',   glow:'rgba(200,160,40,.6)',   frame:'apex'     }
];

/* ── MILESTONE REWARDS ─────────────────────────────────────── */
const LS_REWARDS = {
  5  :{ coins:100, unlock:'board_dark_wood',  badge:null,          title:null,         label:'Board: Dark Wood 🟫' },
  10 :{ coins:150, unlock:'piece_marble',     badge:'marble_hands',title:null,         label:'Pieces: Marble Set 🏛️' },
  15 :{ coins:200, unlock:null,               badge:'iron_knight', title:null,         label:'Badge: Iron Knight ⚔️' },
  20 :{ coins:200, unlock:'frame_wood',       badge:null,          title:null,         label:'Frame: Wood Border 🪵' },
  25 :{ coins:250, unlock:'board_ocean_blue', badge:null,          title:null,         label:'Board: Ocean Blue 🌊' },
  30 :{ coins:300, unlock:'frame_bronze',     badge:'bronze_guard',title:null,         label:'Frame: Bronze Border + Badge' },
  35 :{ coins:300, unlock:'piece_crystal',    badge:null,          title:null,         label:'Pieces: Crystal Set 💎' },
  40 :{ coins:400, unlock:null,               badge:null,          title:'Iron Lord',  label:'Title: Iron Lord ⚔️' },
  45 :{ coins:400, unlock:'board_midnight',   badge:null,          title:null,         label:'Board: Midnight Black 🌑' },
  50 :{ coins:500, unlock:'board_neon_grid',  badge:'silver_sage', title:'Silver Sage',label:'Board: Neon Grid + Silver Frame 🥈' },
  55 :{ coins:500, unlock:'frame_silver',     badge:null,          title:null,         label:'Frame: Silver Glow 🥈' },
  60 :{ coins:600, unlock:'piece_gold',       badge:'gold_master', title:null,         label:'Pieces: Gold Set + Badge 🏺' },
  65 :{ coins:650, unlock:'board_royal',      badge:null,          title:null,         label:'Board: Royal Velvet 👑' },
  70 :{ coins:700, unlock:'frame_diamond',    badge:'diamond_eye', title:'Diamond Eye',label:'Frame: Diamond + Chat Glow 💎' },
  75 :{ coins:750, unlock:'board_lava',       badge:null,          title:null,         label:'Board: Lava 🌋' },
  80 :{ coins:800, unlock:'frame_mystic',     badge:'archmage',    title:'Archmage',   label:'Frame: Mystic Glow + Name Glow 🔮' },
  85 :{ coins:900, unlock:'piece_mystic',     badge:null,          title:null,         label:'Pieces: Mystic Set 🔮' },
  90 :{ coins:1000,unlock:'frame_legend',     badge:'crown_bearer',title:'Crown Bearer',label:'Crown Badge + Legend Frame 👑' },
  95 :{ coins:1000,unlock:'board_cosmos',     badge:null,          title:null,         label:'Board: Cosmos ✨' },
  99 :{ coins:500, unlock:null,               badge:'almost_gm',   title:null,         label:'Badge: Almost There… 🎯' },
  100:{ coins:2000,unlock:'frame_apex',       badge:'grandmaster', title:'Grandmaster',label:'⚡ GRANDMASTER — Rainbow Frame + 2000🪙' }
};

/* ── STREAK REWARDS ────────────────────────────────────────── */
const LS_STREAK = {
  1  :{ xp:10,  coins:0,   badge:null },
  3  :{ xp:25,  coins:20,  badge:null },
  7  :{ xp:75,  coins:50,  badge:'weekly_loyal' },
  14 :{ xp:150, coins:100, badge:null },
  30 :{ xp:300, coins:200, badge:'monthly_legend' },
  60 :{ xp:400, coins:300, badge:null },
  100:{ xp:500, coins:500, badge:'loyal_champion' }
};

/* ── SEASON CONFIG ─────────────────────────────────────────── */
const LS_SEASON = {
  bronze   :{ xp:1000,   badge:'season_bronze',   label:'Bronze',   color:'#cd7f32' },
  silver   :{ xp:5000,   badge:'season_silver',   label:'Silver',   color:'#a8c8e8' },
  gold     :{ xp:15000,  badge:'season_gold',     label:'Gold',     color:'#c8a028' },
  platinum :{ xp:30000,  badge:'season_platinum', label:'Platinum', color:'#00e5ff' }
};

/* ── XP MATH ───────────────────────────────────────────────── */
function lsXpNeeded(level) {
  // XP required to go from (level-1) → level
  if (level <= 1)  return 0;
  if (level <= 25) return 200  + (level - 2) * 25;   // 200 → 775
  if (level <= 75) return 1000 + (level - 26) * 50;  // 1000 → 3450
  return               4000 + (level - 76) * 160;    // 4000 → 7840
}

function lsTotalXpForLevel(level) {
  let total = 0;
  for (let l = 2; l <= Math.min(level, 100); l++) total += lsXpNeeded(l);
  return total;
}

function lsGetLevel() {
  const xp = lsGetXP();
  let level = 1;
  while (level < 100 && xp >= lsTotalXpForLevel(level + 1)) level++;
  return level;
}

function lsGetProgress() {
  // Returns { level, currentXP, neededXP, pct, totalXP }
  const totalXP = lsGetXP();
  const level   = lsGetLevel();
  if (level >= 100) return { level:100, currentXP:0, neededXP:0, pct:100, totalXP };
  const baseXP  = lsTotalXpForLevel(level);
  const nextXP  = lsTotalXpForLevel(level + 1);
  const cur     = totalXP - baseXP;
  const needed  = nextXP  - baseXP;
  return { level, currentXP:cur, neededXP:needed, pct:Math.min(100, Math.round((cur/needed)*100)), totalXP };
}

function lsGetTier(level) {
  return LS_TIERS.find(t => level >= t.min && level <= t.max) || LS_TIERS[0];
}

/* ── STORAGE HELPERS ───────────────────────────────────────── */
function lsGetXP()     { return parseInt(localStorage.getItem('cm_xp')    || '0'); }
function lsGetCoins()  { return parseInt(localStorage.getItem('cm_coins') || '0'); }
function lsGetPrestige(){ return parseInt(localStorage.getItem('cm_prestige')|| '0'); }
function lsGetStreak() { return parseInt(localStorage.getItem('ls_daily_streak')|| '0'); }
function lsGetSeasonXP(){ return parseInt(localStorage.getItem('ls_season_xp')  || '0'); }

function lsAddCoinsLocal(n) {
  localStorage.setItem('cm_coins', lsGetCoins() + n);
  document.querySelectorAll('.coin-count').forEach(el => el.textContent = lsGetCoins() + ' 🪙');
  if (n > 0 && typeof showCoinToast === 'function') showCoinToast(n);
}

function lsUnlock(key) {
  const unlocked = JSON.parse(localStorage.getItem('cm_unlocked') || '[]');
  if (!unlocked.includes(key)) { unlocked.push(key); localStorage.setItem('cm_unlocked', JSON.stringify(unlocked)); }
}

function lsHasUnlock(key) {
  return JSON.parse(localStorage.getItem('cm_unlocked') || '[]').includes(key);
}

function lsAwardBadge(badge) {
  if (!badge) return;
  const badges = JSON.parse(localStorage.getItem('cm_achievements') || '[]');
  if (!badges.includes(badge)) { badges.push(badge); localStorage.setItem('cm_achievements', JSON.stringify(badges)); }
}

/* ══════════════════════════════════════════════════════════════
   MAIN: addXP  (overrides WT/KT versions — loads last)
══════════════════════════════════════════════════════════════ */
function addXP(amount, source) {
  if (!amount || amount <= 0) return;
  const oldLevel = lsGetLevel();
  const oldXP    = lsGetXP();
  const newXP    = oldXP + amount;
  localStorage.setItem('cm_xp', newXP);

  // Season XP tracking
  localStorage.setItem('ls_season_xp', lsGetSeasonXP() + amount);

  // XP toast
  lsShowXPToast(amount, source);

  // Check level-up
  const newLevel = lsGetLevel();
  if (newLevel > oldLevel) lsProcessLevelUp(oldLevel, newLevel);

  // Update badge
  lsUpdateBadge();
}

/* ── LEVEL-UP PROCESSOR ────────────────────────────────────── */
function lsProcessLevelUp(oldLevel, newLevel) {
  // Process each level individually (could jump multiple at once)
  for (let lv = oldLevel + 1; lv <= newLevel; lv++) {
    const rewards = LS_REWARDS[lv];
    if (rewards) {
      if (rewards.coins)   lsAddCoinsLocal(rewards.coins);
      if (rewards.unlock)  lsUnlock(rewards.unlock);
      if (rewards.badge)   lsAwardBadge(rewards.badge);
      if (rewards.title)   localStorage.setItem('ls_title', rewards.title);
    }
  }
  // Show level-up modal for the highest new level
  const tier = lsGetTier(newLevel);
  const oldTier = lsGetTier(oldLevel);
  const tierUp = tier.name !== oldTier.name;
  setTimeout(() => showLevelUpModal({
    oldLevel, newLevel,
    tier, oldTier, tierUp,
    rewards: LS_REWARDS[newLevel] || null
  }), 600);
}

/* ── LEVEL-UP MODAL ────────────────────────────────────────── */
function showLevelUpModal(data) {
  document.getElementById('ls-levelup-modal')?.remove();

  const { newLevel, tier, tierUp, oldTier, rewards } = data;
  const isHundred = newLevel === 100;
  const prestige  = lsGetPrestige();

  const rewardHtml = rewards ? `
    <div class="ls-reward-list">
      ${rewards.coins   ? `<div class="ls-reward-item ls-rw-coin">🪙 +${rewards.coins} Coins</div>` : ''}
      ${rewards.unlock  ? `<div class="ls-reward-item ls-rw-unlock">🔓 ${rewards.label||rewards.unlock}</div>` : ''}
      ${rewards.badge   ? `<div class="ls-reward-item ls-rw-badge">🏅 New Badge Unlocked!</div>` : ''}
      ${rewards.title   ? `<div class="ls-reward-item ls-rw-title">✨ Title: "${rewards.title}"</div>` : ''}
    </div>` : '';

  const tierUpHtml = tierUp ? `
    <div class="ls-tier-up-banner" style="--tier-color:${tier.color};">
      <span>${tier.icon}</span>
      <span>Tier Up! <strong>${tier.name}</strong></span>
    </div>` : '';

  const overlay = document.createElement('div');
  overlay.id = 'ls-levelup-modal';
  overlay.className = 'ls-modal-overlay';
  overlay.innerHTML = `
    <div class="ls-modal-box ${isHundred ? 'ls-modal-gm' : ''}">
      ${isHundred ? '<div class="ls-confetti-wrap" id="ls-confetti"></div>' : ''}
      <div class="ls-modal-top">
        <div class="ls-lvl-label">LEVEL UP!</div>
        <div class="ls-lvl-number" style="color:${tier.color==='rainbow'?'var(--gold)':tier.color};">
          ${newLevel}
        </div>
        ${prestige > 0 ? `<div class="ls-prestige-stars">${'⭐'.repeat(prestige)}</div>` : ''}
      </div>
      ${tierUpHtml}
      <div class="ls-tier-badge" style="border-color:${tier.color==='rainbow'?'var(--gold)':tier.color};">
        <span class="ls-tier-icon">${tier.icon}</span>
        <span class="ls-tier-name" style="color:${tier.color==='rainbow'?'var(--gold)':tier.color};">${tier.name}</span>
      </div>
      ${rewardHtml}
      ${isHundred ? `
        <div class="ls-gm-message">
          ⚡ You have reached the highest rank.<br>
          <span style="color:var(--gold);font-weight:700;">Grandmaster of ChessArena.</span>
        </div>
        ${lsGetPrestige() < 5 ? `<button class="btn ls-prestige-btn" onclick="lsDoPrestige()">⭐ Prestige (Reset + Star)</button>` : ''}
      ` : ''}
      <div class="ls-xp-preview">
        ${lsGetProgress().pct}% to Level ${Math.min(newLevel + 1, 100)}
      </div>
      <button class="btn btn-primary ls-modal-close" onclick="document.getElementById('ls-levelup-modal').remove();lsUpdateBadge()">
        Continue →
      </button>
    </div>`;

  document.body.appendChild(overlay);
  if (isHundred) lsSpawnConfetti();

  // Auto-close after 8s
  setTimeout(() => document.getElementById('ls-levelup-modal')?.remove(), 8000);
}

/* ── CONFETTI ──────────────────────────────────────────────── */
function lsSpawnConfetti() {
  const wrap = document.getElementById('ls-confetti'); if (!wrap) return;
  const colors = ['#c8a028','#6dcc8a','#e07070','#00e5ff','#b44cf0','#ff6b35'];
  for (let i = 0; i < 40; i++) {
    const p = document.createElement('div'); p.className = 'ls-confetti-piece';
    p.style.cssText = `left:${Math.random()*100}%;background:${colors[i%colors.length]};
      animation-delay:${Math.random()*2}s;animation-duration:${2+Math.random()*2}s;
      width:${6+Math.random()*6}px;height:${6+Math.random()*6}px;
      border-radius:${Math.random()>.5?'50%':'2px'};`;
    wrap.appendChild(p);
  }
}

/* ── DAILY STREAK ──────────────────────────────────────────── */
function lsCheckDailyStreak() {
  const today      = new Date().toDateString();
  const lastLogin  = localStorage.getItem('ls_last_login') || '';
  const yesterday  = new Date(Date.now() - 86400000).toDateString();
  let streak       = lsGetStreak();

  if (lastLogin === today) return; // Already checked today

  if (lastLogin === yesterday) {
    streak++;
  } else if (lastLogin !== today) {
    streak = 1; // Reset streak if missed a day
  }

  localStorage.setItem('ls_daily_streak', streak);
  localStorage.setItem('ls_last_login', today);

  // Award streak reward
  const reward = LS_STREAK[streak] || { xp: 10, coins: 0, badge: null };
  addXP(reward.xp, 'daily_login');
  if (reward.coins > 0) lsAddCoinsLocal(reward.coins);
  if (reward.badge) lsAwardBadge(reward.badge);

  // Show streak toast
  setTimeout(() => {
    lsShowStreakToast(streak, reward);
    lsUpdateStreakBadge(streak);
  }, 1200);
}

function lsUpdateStreakBadge(streak) {
  const el = document.getElementById('streak-badge');
  if (el) el.textContent = `🔥 ${streak}`;
}

/* ── SEASON SYSTEM ─────────────────────────────────────────── */
function lsGetSeasonInfo() {
  const now  = new Date();
  const year = now.getFullYear();
  const mon  = now.getMonth() + 1;
  const key  = `Season ${year}-${String(mon).padStart(2,'0')}`;
  const ends = new Date(year, mon, 1); // First day of next month
  const daysLeft = Math.ceil((ends - now) / 86400000);
  const seasonXP = lsGetSeasonXP();

  let rank = null;
  if      (seasonXP >= LS_SEASON.platinum.xp) rank = 'platinum';
  else if (seasonXP >= LS_SEASON.gold.xp)     rank = 'gold';
  else if (seasonXP >= LS_SEASON.silver.xp)   rank = 'silver';
  else if (seasonXP >= LS_SEASON.bronze.xp)   rank = 'bronze';

  return { key, year, mon, daysLeft, seasonXP, rank, ends };
}

function lsCheckSeasonReset() {
  const lastSeason = localStorage.getItem('ls_last_season');
  const si = lsGetSeasonInfo();
  const curKey = `${si.year}-${si.mon}`;
  if (lastSeason && lastSeason !== curKey) {
    // Season ended — award badge for last season rank
    const lastRank = localStorage.getItem('ls_last_season_rank');
    if (lastRank && LS_SEASON[lastRank]) {
      lsAwardBadge(LS_SEASON[lastRank].badge + `_${lastSeason}`);
    }
    // Reset season XP
    localStorage.setItem('ls_season_xp', '0');
    localStorage.setItem('ls_last_season_rank', '');
    setTimeout(() => lsShowSeasonResetToast(lastRank), 2000);
  }
  localStorage.setItem('ls_last_season', curKey);
  // Save current season rank
  if (si.rank) localStorage.setItem('ls_last_season_rank', si.rank);
}

/* ── PRESTIGE ──────────────────────────────────────────────── */
function lsCanPrestige() { return lsGetLevel() >= 100 && lsGetPrestige() < 5; }

function lsDoPrestige() {
  if (!lsCanPrestige()) return;
  const p = lsGetPrestige() + 1;
  localStorage.setItem('cm_prestige', p);
  localStorage.setItem('cm_xp', '0');
  lsAwardBadge(`prestige_${p}`);
  lsAddCoinsLocal(500 * p); // Bonus coins per prestige
  document.getElementById('ls-levelup-modal')?.remove();
  setTimeout(() => {
    lsShowPrestigeToast(p);
    lsUpdateBadge();
    addXP(XP_SRC.prestige_bonus * p, 'prestige_bonus');
  }, 400);
}

/* ── LEVEL BADGE (injected into header) ────────────────────── */
function lsUpdateBadge() {
  const prog    = lsGetProgress();
  const tier    = lsGetTier(prog.level);
  const prestige= lsGetPrestige();
  const color   = tier.color === 'rainbow' ? 'var(--gold)' : tier.color;
  const title   = localStorage.getItem('ls_title') || tier.name;

  let el = document.getElementById('ls-level-badge');
  if (!el) {
    el = document.createElement('div');
    el.id = 'ls-level-badge'; el.className = 'ls-level-badge';
    el.setAttribute('onclick','openLevelProfile()'); el.style.cursor='pointer';
    // Insert after streak-badge
    const streak = document.getElementById('streak-badge');
    if (streak) streak.insertAdjacentElement('afterend', el);
    else document.querySelector('.top-bar')?.appendChild(el);
  }

  el.style.setProperty('--lv-color', color);
  el.style.setProperty('--lv-glow', tier.glow);
  el.innerHTML = `
    <span class="ls-badge-icon">${tier.icon}</span>
    <span class="ls-badge-level" style="color:${color};">${prog.level}</span>
    ${prestige > 0 ? `<span class="ls-badge-prestige">${'⭐'.repeat(prestige)}</span>` : ''}
    <div class="ls-badge-xpbar"><div class="ls-badge-xpfill" style="width:${prog.pct}%;background:${color};"></div></div>`;
  el.title = `Level ${prog.level} · ${title} · ${prog.currentXP}/${prog.neededXP} XP`;
}

/* ── LEVEL PROFILE MODAL ───────────────────────────────────── */
function openLevelProfile() {
  document.getElementById('ls-profile-modal')?.remove();
  const prog    = lsGetProgress();
  const tier    = lsGetTier(prog.level);
  const prestige= lsGetPrestige();
  const si      = lsGetSeasonInfo();
  const streak  = lsGetStreak();
  const color   = tier.color === 'rainbow' ? 'var(--gold)' : tier.color;
  const title   = localStorage.getItem('ls_title') || tier.name;
  const unlocked= JSON.parse(localStorage.getItem('cm_unlocked') || '[]').length;

  // Next milestone
  const milestoneKeys = Object.keys(LS_REWARDS).map(Number).sort((a,b)=>a-b);
  const nextMilestone = milestoneKeys.find(lv => lv > prog.level) || 100;
  const mReward = LS_REWARDS[nextMilestone];

  // Season rank display
  const rankInfo = si.rank ? LS_SEASON[si.rank] : null;

  const overlay = document.createElement('div');
  overlay.id = 'ls-profile-modal'; overlay.className = 'ls-modal-overlay';
  overlay.innerHTML = `
    <div class="ls-profile-box">
      <button onclick="document.getElementById('ls-profile-modal').remove()"
        class="ls-profile-close">✕</button>

      <!-- Level hero -->
      <div class="ls-profile-hero" style="--lv-color:${color};--lv-glow:${tier.glow};">
        <div class="ls-profile-tier-icon">${tier.icon}</div>
        <div class="ls-profile-level" style="color:${color};">${prog.level}</div>
        ${prestige>0?`<div class="ls-prestige-stars-big">${'⭐'.repeat(prestige)}</div>`:''}
        <div class="ls-profile-title" style="color:${color};">${title}</div>
        ${prog.level < 100 ? `
          <div class="ls-profile-xpbar-wrap">
            <div class="ls-profile-xpbar"><div class="ls-profile-xpfill" style="width:${prog.pct}%;background:${color};"></div></div>
            <div class="ls-profile-xplabel">${prog.currentXP} / ${prog.neededXP} XP · ${prog.pct}%</div>
          </div>` : `<div style="color:var(--gold);font-size:.78rem;margin-top:.3rem;">MAX LEVEL ⚡</div>`}
      </div>

      <!-- Stats grid -->
      <div class="ls-profile-stats">
        <div class="ls-stat-cell"><div class="ls-stat-val">${prog.totalXP.toLocaleString()}</div><div class="ls-stat-lbl">Total XP</div></div>
        <div class="ls-stat-cell"><div class="ls-stat-val">${streak}</div><div class="ls-stat-lbl">Day Streak 🔥</div></div>
        <div class="ls-stat-cell"><div class="ls-stat-val">${lsGetCoins()}</div><div class="ls-stat-lbl">Coins 🪙</div></div>
        <div class="ls-stat-cell"><div class="ls-stat-val">${unlocked}</div><div class="ls-stat-lbl">Unlocks 🔓</div></div>
      </div>

      <!-- Season -->
      <div class="ls-season-card" ${rankInfo?`style="border-color:${rankInfo.color};"`:''}>
        <div class="ls-season-left">
          <div style="font-size:.72rem;color:var(--text-dim);">Season ${si.year}-${String(si.mon).padStart(2,'0')}</div>
          <div style="font-size:.82rem;font-weight:700;color:${rankInfo?rankInfo.color:'var(--text-dim)'};">
            ${rankInfo ? rankInfo.label + ' Rank 🏅' : 'No rank yet'}
          </div>
          <div style="font-size:.7rem;color:var(--text-dim);">${si.seasonXP.toLocaleString()} XP this season · ${si.daysLeft}d left</div>
        </div>
        <div class="ls-season-bar-wrap">
          ${Object.entries(LS_SEASON).map(([k,v]) => `
            <div class="ls-season-tier-row">
              <span style="font-size:.65rem;color:${v.color};min-width:52px;">${v.label}</span>
              <div class="ls-season-tier-bar">
                <div style="width:${Math.min(100,Math.round((si.seasonXP/v.xp)*100))}%;background:${v.color};height:100%;border-radius:2px;transition:width .4s;"></div>
              </div>
              <span style="font-size:.62rem;color:var(--text-dim);min-width:40px;text-align:right;">${(v.xp/1000).toFixed(0)}k</span>
            </div>`).join('')}
        </div>
      </div>

      <!-- Next milestone -->
      ${prog.level < 100 ? `
        <div class="ls-next-milestone">
          <div style="font-size:.72rem;color:var(--text-dim);">Next milestone: <strong style="color:var(--text);">Level ${nextMilestone}</strong></div>
          <div style="font-size:.78rem;color:var(--gold);margin-top:.15rem;">${mReward?.label || '—'}</div>
          <div style="font-size:.68rem;color:var(--text-dim);margin-top:.1rem;">
            ${(lsTotalXpForLevel(nextMilestone) - prog.totalXP).toLocaleString()} XP away
          </div>
        </div>` : ''}

      <!-- Prestige option -->
      ${lsCanPrestige() ? `
        <div class="ls-prestige-offer">
          <div style="font-size:.82rem;font-weight:700;color:var(--gold);">⭐ Prestige Available!</div>
          <div style="font-size:.74rem;color:var(--text-dim);margin:.2rem 0;">Reset to Level 1, keep all unlocks, earn a Prestige Star</div>
          <button class="btn ls-prestige-btn" onclick="lsDoPrestige();document.getElementById('ls-profile-modal').remove()">
            ⭐ Prestige ${lsGetPrestige()+1}/5
          </button>
        </div>` : ''}

      <!-- Tiers overview -->
      <div style="font-size:.72rem;color:var(--text-dim);margin:.6rem 0 .3rem;font-weight:600;">ALL TIERS</div>
      <div class="ls-tiers-grid">
        ${LS_TIERS.map(t => {
          const c = t.color === 'rainbow' ? 'var(--gold)' : t.color;
          const reached = prog.level >= t.min;
          return `<div class="ls-tier-chip ${reached?'ls-tier-reached':''}" style="${reached?`border-color:${c};color:${c};`:''}">
            <span>${t.icon}</span><span>${t.name}</span><span style="font-size:.6rem;opacity:.7;">${t.min}${t.min!==t.max?'-'+t.max:''}</span>
          </div>`;
        }).join('')}
      </div>

      <button class="btn btn-primary" style="width:100%;margin-top:.8rem;" onclick="document.getElementById('ls-profile-modal').remove()">Close</button>
    </div>`;

  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

/* ── TOASTS ────────────────────────────────────────────────── */
function lsShowXPToast(n, source) {
  const t = document.createElement('div'); t.className = 'ls-xp-toast';
  t.textContent = `+${n} XP${source ? ' · ' + source : ''}`;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 350); }, 2000);
}

function lsShowStreakToast(streak, reward) {
  const t = document.createElement('div'); t.className = 'ls-streak-toast';
  t.innerHTML = `🔥 Day ${streak} Streak!<br><span style="font-size:.8rem;opacity:.8;">+${reward.xp} XP${reward.coins?' · +'+reward.coins+'🪙':''}</span>`;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 3500);
}

function lsShowPrestigeToast(p) {
  const t = document.createElement('div'); t.className = 'ls-streak-toast';
  t.style.cssText += 'border-color:rgba(200,160,40,.6);background:rgba(200,160,40,.12);color:var(--gold);';
  t.innerHTML = `⭐ Prestige ${p}!<br><span style="font-size:.8rem;opacity:.8;">You are reborn. Keep climbing.</span>`;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 4000);
}

function lsShowSeasonResetToast(rank) {
  if (!rank) return;
  const r = LS_SEASON[rank];
  const t = document.createElement('div'); t.className = 'ls-streak-toast';
  t.style.setProperty('border-color', r.color);
  t.innerHTML = `🏅 Season Over!<br><span style="font-size:.8rem;opacity:.8;">Finished: ${r.label} Rank</span>`;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 4000);
}

// Also expose showCoinToast in case not loaded yet
function showCoinToast(n) {
  const t = document.createElement('div'); t.className = 'coin-toast'; t.textContent = `+${n} 🪙`;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 2200);
}

/* ── HOOK INTO GAME RESULT ─────────────────────────────────── */
function lsInstallGameHooks() {
  // Hook into chess game end
  if (typeof checkState === 'function') {
    const _csLS = checkState;
    checkState = function () {
      const wasOver = (typeof over !== 'undefined') ? over : false;
      _csLS();
      const isNowOver = (typeof over !== 'undefined') ? over : false;
      if (!wasOver && isNowOver) {
        setTimeout(() => lsHandleGameEnd(), 500);
      }
    };
  }
}

function lsHandleGameEnd() {
  // Don't double-award if tournament already awarded
  if (typeof wt !== 'undefined' && wt.status === 'active') return;
  if (typeof kt !== 'undefined' && kt.status === 'active') return;

  // Must have a completed game
  if (typeof over === 'undefined' || !over) return;

  // FIX: Use chess.js getCurrentResult() instead of undefined global 'result'
  const gameResult = (typeof getCurrentResult === 'function') ? getCurrentResult() : '';
  if (!gameResult || gameResult === '*') return;

  // FIX: Use chess.js actual variables — 'playerColor' doesn't exist, use 'mode' + 'myOnlineColor'
  let myColor = null;
  if (typeof mode !== 'undefined') {
    if (mode === 'ai') {
      myColor = 'w'; // player always plays White vs AI
    } else if ((mode === 'online' || mode === 'quickmatch') && typeof myOnlineColor !== 'undefined') {
      myColor = myOnlineColor; // set when online match begins
    } else if (mode === 'human') {
      myColor = 'w'; // award XP to White's perspective in local 2-player game
    }
  }
  if (!myColor) return;

  const iWon  = (gameResult === '1-0' && myColor === 'w') || (gameResult === '0-1' && myColor === 'b');
  const isDraw = gameResult === '1/2-1/2';

  if (iWon)        addXP(XP_SRC.win,  'game win');
  else if (isDraw) addXP(XP_SRC.draw, 'draw');
  else             addXP(XP_SRC.loss, 'game played');
}

/* ── FIREBASE SYNC (optional) ──────────────────────────────── */
async function lsSyncToFirebase() {
  if (typeof db === 'undefined' || typeof currentUser === 'undefined') return;
  if (!currentUser?.uid) return;
  try {
    const prog = lsGetProgress();
    await db.collection('playerLevels').doc(currentUser.uid).set({
      uid     : currentUser.uid,
      name    : currentUser.displayName || 'Player',
      level   : prog.level,
      totalXP : prog.totalXP,
      prestige: lsGetPrestige(),
      tier    : lsGetTier(prog.level).name,
      title   : localStorage.getItem('ls_title') || '',
      streak  : lsGetStreak(),
      updatedAt: Date.now()
    }, { merge: true });
  } catch (e) {}
}

/* ── INIT ──────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    lsCheckSeasonReset();
    lsCheckDailyStreak();
    lsUpdateBadge();
    lsInstallGameHooks();

    // Sync to Firebase after a delay (non-blocking)
    setTimeout(lsSyncToFirebase, 3000);

    // Resync badge after profile loads
    setTimeout(lsUpdateBadge, 1500);

    console.log('[ChessArena] Level System v1.0 loaded ✓ — Level', lsGetLevel(), '/', 100);
  }, 1000);
});
