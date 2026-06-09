/* ═══════════════════════════════════════════════════════════════
   ChessArena MEGA UPGRADE v4.0
   ──────────────────────────────────────────────────────────────
   1.  Claude AI Move Coach  (Anthropic API)
   2.  Move Arrow Visualization  (right-click drag)
   3.  Coordinate Trainer  (click-the-square game)
   4.  Achievements System  (15 badges)
   5.  Piece Sets  (Classic · Alto · Text)
   6.  Board Editor  (FEN input & example positions)
   7.  Voice Commands  (Web Speech API)
   8.  ELO History Graph  (sparkline in profile)
═══════════════════════════════════════════════════════════════ */

/* ──────────────────────────────────────────────────────────────
   1. CLAUDE AI MOVE COACH
────────────────────────────────────────────────────────────── */
let claudeEnabled = localStorage.getItem('cm_claude') !== 'off';

/* API key stored in localStorage (user enters it once) */
function getApiKey()   { return localStorage.getItem('cm_api_key') || ''; }
function saveApiKey(k) { localStorage.setItem('cm_api_key', k.trim()); }

function openApiKeyModal() {
  const existing = getApiKey();
  const modal = document.getElementById('api-key-modal');
  if (!modal) return;
  const inp = document.getElementById('api-key-inp');
  if (inp) inp.value = existing;
  modal.classList.add('show');
}
function closeApiKeyModal() { document.getElementById('api-key-modal')?.classList.remove('show'); }
function submitApiKey() {
  const val = document.getElementById('api-key-inp')?.value?.trim();
  if (!val || !val.startsWith('sk-ant-')) {
    document.getElementById('api-key-err').textContent = '⚠️ Key should start with sk-ant-…';
    return;
  }
  saveApiKey(val);
  closeApiKeyModal();
  claudeEnabled = true;
  localStorage.setItem('cm_claude', 'on');
  const btn = document.getElementById('claude-toggle-btn');
  if (btn) { btn.textContent = '🤖 Coach ON'; btn.classList.add('active'); }
  setStatus('✅ Claude AI Coach is now active!');
}

async function explainMove(fr, fc, tr, tc, piece, captured) {
  if (!claudeEnabled || !piece) return;
  const panel = document.getElementById('claude-panel');
  if (!panel) return;

  const apiKey = getApiKey();
  if (!apiKey) {
    panel.style.display = 'block';
    panel.innerHTML = `<div class="coach-inner">
      <div class="coach-head"><span class="coach-icon">🤖</span><span class="coach-title">AI Coach</span></div>
      <div class="coach-text" style="color:var(--text-dim);">
        API key not set. <button class="btn" style="font-size:.72rem;padding:.15rem .5rem;" onclick="openApiKeyModal()">🔑 Add Key</button>
        to enable move explanations.
      </div></div>`;
    return;
  }

  const FILES2 = 'abcdefgh';
  const fromSq = FILES2[fc] + (8 - fr);
  const toSq   = FILES2[tc] + (8 - tr);
  const color  = piece.cl === 'w' ? 'White' : 'Black';
  const pNames = { K:'King', Q:'Queen', R:'Rook', B:'Bishop', N:'Knight', P:'Pawn' };
  const pName  = pNames[piece.t] || piece.t;
  const capTxt = captured ? `, capturing the ${pNames[captured.t] || captured.t}` : '';
  const moveNum = Math.ceil(((hist && hist.length) || 0) / 2);

  panel.style.display = 'block';
  panel.innerHTML = `<div class="coach-inner"><div class="coach-loading">🤖 Analyzing move…</div></div>`;

  try {
    const matBalance = getBoardMaterialSummary();
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: 'You are a friendly, encouraging chess coach. After a move explain: (1) what the move does strategically, (2) what threat or idea it creates, (3) what the opponent should consider next. 2-3 sentences total. Plain text only — no markdown, no bullet points.',
        messages: [{
          role: 'user',
          content: `Move ${moveNum}: ${color} played ${pName} ${fromSq}→${toSq}${capTxt}. Material: ${matBalance}. Briefly explain this move for a beginner learning chess.`
        }]
      })
    });
    const data = await resp.json();
    const text = data?.content?.[0]?.text || '';
    if (!text) { panel.style.display = 'none'; return; }

    panel.innerHTML = `
      <div class="coach-inner">
        <div class="coach-head">
          <span class="coach-icon">🤖</span>
          <span class="coach-title">AI Coach</span>
          <span class="coach-move-tag">${color} ${pName}: ${fromSq}→${toSq}${captured ? ' ×' + (pNames[captured.t]||captured.t) : ''}</span>
          <button class="coach-close" onclick="muteCoach()" title="Mute coach">🔇 Mute</button>
        </div>
        <div class="coach-text">${text}</div>
      </div>`;
  } catch(e) {
    panel.style.display = 'none';
  }
}

function muteCoach() {
  claudeEnabled = false;
  localStorage.setItem('cm_claude', 'off');
  const panel = document.getElementById('claude-panel');
  if (panel) panel.style.display = 'none';
  const btn = document.getElementById('claude-toggle-btn');
  if (btn) { btn.textContent = '🤖 Coach OFF'; btn.classList.remove('active'); }
}

function toggleClaudeCoach() {
  if (!claudeEnabled && !getApiKey()) {
    openApiKeyModal(); return; // ask for key first
  }
  claudeEnabled = !claudeEnabled;
  localStorage.setItem('cm_claude', claudeEnabled ? 'on' : 'off');
  const btn = document.getElementById('claude-toggle-btn');
  if (btn) { btn.textContent = claudeEnabled ? '🤖 Coach ON' : '🤖 Coach OFF'; btn.classList.toggle('active', claudeEnabled); }
  if (!claudeEnabled) { const p = document.getElementById('claude-panel'); if (p) p.style.display = 'none'; }
}

function getBoardMaterialSummary() {
  if (!board) return 'unknown';
  const vals = { P:1, N:3, B:3, R:5, Q:9, K:0 };
  let w = 0, b = 0;
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = board[r][c];
    if (p) { if (p.cl === 'w') w += vals[p.t] || 0; else b += vals[p.t] || 0; }
  }
  const d = w - b;
  return d > 0 ? `White +${d}` : d < 0 ? `Black +${-d}` : 'Equal material';
}

/* ──────────────────────────────────────────────────────────────
   2. MOVE ARROW VISUALIZATION  (right-click to draw)
────────────────────────────────────────────────────────────── */
let arrowData  = [];   // [{fr,fc,tr,tc,color}]
let circleData = [];   // [{r,c,color}]
let arrowDragStart = null;
const CLR_ARROW  = 'rgba(255,170,20,.82)';
const CLR_GREEN  = 'rgba(60,200,100,.82)';
const CLR_RED    = 'rgba(220,60,60,.82)';

function initArrowCanvas() {
  const boardEl = document.getElementById('board');
  if (!boardEl || document.getElementById('arrow-canvas')) return;

  const frame = boardEl.parentElement;
  frame.style.position = 'relative';

  const canvas = document.createElement('canvas');
  canvas.id = 'arrow-canvas';
  canvas.style.cssText = 'position:absolute;pointer-events:none;z-index:6;top:0;left:0;';
  frame.appendChild(canvas);

  syncCanvasSize();

  // right-click on the board grid (captured in capture phase)
  boardEl.addEventListener('mousedown', e => { if (e.button === 2) { e.preventDefault(); startArrowDrag(e); } }, true);
  boardEl.addEventListener('mouseup',   e => { if (e.button === 2) { e.preventDefault(); endArrowDrag(e);   } }, true);
  boardEl.addEventListener('contextmenu', e => e.preventDefault(), true);

  window.addEventListener('resize', () => { syncCanvasSize(); redrawArrows(); });
}

function syncCanvasSize() {
  const boardEl  = document.getElementById('board');
  const canvas   = document.getElementById('arrow-canvas');
  if (!boardEl || !canvas) return;
  const boardRect = boardEl.getBoundingClientRect();
  const frameRect = boardEl.parentElement.getBoundingClientRect();
  canvas.width   = Math.round(boardRect.width);
  canvas.height  = Math.round(boardRect.height);
  canvas.style.left = Math.round(boardRect.left - frameRect.left) + 'px';
  canvas.style.top  = Math.round(boardRect.top  - frameRect.top)  + 'px';
  redrawArrows();
}

function getSqFromEvent(e) {
  const boardEl = document.getElementById('board');
  if (!boardEl) return null;
  const rect = boardEl.getBoundingClientRect();
  const px = e.clientX - rect.left;
  const py = e.clientY - rect.top;
  const sqSz = rect.width / 8;
  const dc = Math.floor(px / sqSz);
  const dr = Math.floor(py / sqSz);
  if (dc < 0 || dc > 7 || dr < 0 || dr > 7) return null;
  return [flipped_ ? 7 - dr : dr, flipped_ ? 7 - dc : dc];
}

function startArrowDrag(e) { arrowDragStart = getSqFromEvent(e); }

function endArrowDrag(e) {
  if (!arrowDragStart) return;
  const sq = getSqFromEvent(e);
  if (!sq) { arrowDragStart = null; return; }
  const color = e.shiftKey ? CLR_GREEN : e.ctrlKey ? CLR_RED : CLR_ARROW;

  if (sq[0] === arrowDragStart[0] && sq[1] === arrowDragStart[1]) {
    const idx = circleData.findIndex(c => c.r === sq[0] && c.c === sq[1]);
    if (idx >= 0) circleData.splice(idx, 1);
    else circleData.push({ r: sq[0], c: sq[1], color });
  } else {
    const idx = arrowData.findIndex(a => a.fr===arrowDragStart[0]&&a.fc===arrowDragStart[1]&&a.tr===sq[0]&&a.tc===sq[1]);
    if (idx >= 0) arrowData.splice(idx, 1);
    else arrowData.push({ fr:arrowDragStart[0], fc:arrowDragStart[1], tr:sq[0], tc:sq[1], color });
  }
  arrowDragStart = null;
  redrawArrows();
}

function clearArrows() {
  arrowData = []; circleData = []; arrowDragStart = null;
  const canvas = document.getElementById('arrow-canvas');
  if (canvas) { const ctx = canvas.getContext('2d'); ctx.clearRect(0,0,canvas.width,canvas.height); }
}

function redrawArrows() {
  const canvas = document.getElementById('arrow-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const sqSz = canvas.width / 8;

  for (const circ of circleData) {
    const dc = flipped_ ? 7 - circ.c : circ.c;
    const dr = flipped_ ? 7 - circ.r : circ.r;
    ctx.beginPath();
    ctx.arc((dc + .5) * sqSz, (dr + .5) * sqSz, sqSz * .41, 0, Math.PI * 2);
    ctx.strokeStyle = circ.color;
    ctx.lineWidth = sqSz * .09;
    ctx.stroke();
  }

  for (const arr of arrowData) {
    const dc1 = flipped_ ? 7 - arr.fc : arr.fc, dr1 = flipped_ ? 7 - arr.fr : arr.fr;
    const dc2 = flipped_ ? 7 - arr.tc : arr.tc, dr2 = flipped_ ? 7 - arr.tr : arr.tr;
    drawArrow(ctx, (dc1+.5)*sqSz, (dr1+.5)*sqSz, (dc2+.5)*sqSz, (dr2+.5)*sqSz, arr.color, sqSz);
  }
}

function drawArrow(ctx, x1, y1, x2, y2, color, sqSz) {
  const headLen = sqSz * .36;
  const lw = sqSz * .15;
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const endX = x2 - Math.cos(angle) * headLen * .35;
  const endY = y2 - Math.sin(angle) * headLen * .35;

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(endX, endY);
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI/6), y2 - headLen * Math.sin(angle - Math.PI/6));
  ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI/6), y2 - headLen * Math.sin(angle + Math.PI/6));
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

/* ──────────────────────────────────────────────────────────────
   3. COORDINATE TRAINER
────────────────────────────────────────────────────────────── */
let coordGame = { active:false, score:0, total:0, target:null, timerId:null, timeLeft:30, showPieces:false };

function openCoordTrainer() {
  document.getElementById('coord-modal')?.classList.add('show');
  startCoordGame();
}

function closeCoordTrainer() {
  document.getElementById('coord-modal')?.classList.remove('show');
  stopCoordGame();
}

function startCoordGame() {
  stopCoordGame();
  coordGame = { active:true, score:0, total:0, target:null, timerId:null, timeLeft:30, showPieces:coordGame.showPieces };
  const res = document.getElementById('coord-result');
  if (res) res.style.display = 'none';
  renderCoordBoard();
  nextCoordTarget();
  coordGame.timerId = setInterval(() => {
    coordGame.timeLeft--;
    const el = document.getElementById('coord-timer');
    if (el) { el.textContent = coordGame.timeLeft + 's'; el.style.color = coordGame.timeLeft <= 10 ? '#e06060' : 'var(--gold)'; }
    if (coordGame.timeLeft <= 0) {
      clearInterval(coordGame.timerId);
      coordGame.active = false;
      showCoordGameOver();
    }
  }, 1000);
}

function stopCoordGame() {
  clearInterval(coordGame.timerId);
  coordGame.active = false;
}

function nextCoordTarget() {
  const r = Math.floor(Math.random() * 8);
  const c = Math.floor(Math.random() * 8);
  coordGame.target = [r, c];
  const el = document.getElementById('coord-target-sq');
  if (el) el.textContent = 'abcdefgh'[c] + (8 - r);
}

function renderCoordBoard() {
  const el = document.getElementById('coord-board');
  if (!el) return;
  el.innerHTML = '';
  for (let dr = 0; dr < 8; dr++) for (let dc = 0; dc < 8; dc++) {
    const sq = document.createElement('div');
    sq.className = 'csq ' + ((dr + dc) % 2 === 0 ? 'light' : 'dark');
    const r = dr, c = dc;
    // File label on bottom row
    if (dr === 7) { const lbl = document.createElement('span'); lbl.className = 'csq-f'; lbl.textContent = 'abcdefgh'[dc]; sq.appendChild(lbl); }
    // Rank label on left col
    if (dc === 0) { const lbl = document.createElement('span'); lbl.className = 'csq-r'; lbl.textContent = 8 - dr; sq.appendChild(lbl); }
    sq.addEventListener('click', () => handleCoordClick(r, c));
    el.appendChild(sq);
  }
}

function handleCoordClick(r, c) {
  if (!coordGame.active || !coordGame.target) return;
  coordGame.total++;
  const correct = r === coordGame.target[0] && c === coordGame.target[1];

  if (correct) {
    coordGame.score++;
    if (typeof playSound === 'function') playSound('correct');
    flashCoordSquare(r, c, true);
  } else {
    if (typeof playSound === 'function') playSound('wrong');
    flashCoordSquare(r, c, false);
    flashCoordSquare(coordGame.target[0], coordGame.target[1], true);
  }

  updateCoordStats();
  setTimeout(() => { if (coordGame.active) nextCoordTarget(); }, 220);
}

function flashCoordSquare(r, c, good) {
  const el = document.getElementById('coord-board');
  if (!el) return;
  const idx = r * 8 + c;
  const sq = el.children[idx];
  if (!sq) return;
  sq.classList.add(good ? 'csq-ok' : 'csq-bad');
  setTimeout(() => sq.classList.remove('csq-ok', 'csq-bad'), 210);
}

function updateCoordStats() {
  const pct = coordGame.total > 0 ? Math.round(coordGame.score / coordGame.total * 100) : 0;
  const el = document.getElementById('coord-stats');
  if (el) el.textContent = `${coordGame.score}/${coordGame.total} · ${pct}% accuracy`;
}

function showCoordGameOver() {
  const pct = coordGame.total > 0 ? Math.round(coordGame.score / coordGame.total * 100) : 0;
  const medal = pct >= 90 ? '🥇' : pct >= 70 ? '🥈' : pct >= 50 ? '🥉' : '📚';
  const res = document.getElementById('coord-result');
  if (res) {
    res.style.display = 'block';
    res.innerHTML = `${medal} <strong>${coordGame.score}/${coordGame.total}</strong> correct — ${pct}% accuracy
      <br><button class="btn" style="margin-top:.5rem;font-size:.8rem;" onclick="startCoordGame()">▶ Play Again</button>`;
  }
}

/* ──────────────────────────────────────────────────────────────
   4. ACHIEVEMENTS SYSTEM
────────────────────────────────────────────────────────────── */
const ACHIEVEMENTS = [
  { id:'first_game',   icon:'🎮', name:'First Move',        desc:'Play your first game' },
  { id:'first_win',    icon:'🏆', name:'First Victory',     desc:'Win a game vs AI' },
  { id:'checkmate',    icon:'♚',  name:'Checkmate!',         desc:'Deliver your first checkmate' },
  { id:'puzzles5',     icon:'🧩', name:'Puzzle Apprentice', desc:'Solve 5 puzzles' },
  { id:'puzzles25',    icon:'🎯', name:'Puzzle Adept',      desc:'Solve 25 puzzles' },
  { id:'puzzles60',    icon:'🏅', name:'Puzzle Master',     desc:'Solve all 60 puzzles' },
  { id:'streak3',      icon:'🔥', name:'On Fire',            desc:'3-day puzzle streak' },
  { id:'streak7',      icon:'💥', name:'Weekly Warrior',    desc:'7-day puzzle streak' },
  { id:'elo1400',      icon:'⭐', name:'Rising Star',       desc:'Reach 1400 ELO' },
  { id:'elo1600',      icon:'💫', name:'Strong Player',     desc:'Reach 1600 ELO' },
  { id:'elo1800',      icon:'🌟', name:'Expert',             desc:'Reach 1800 ELO' },
  { id:'online_game',  icon:'🌐', name:'Online Debut',      desc:'Play first online game' },
  { id:'blitz_win',    icon:'⚡', name:'Blitz Champion',    desc:'Win a blitz/bullet game' },
  { id:'coord_ace',    icon:'🗺️', name:'Board Navigator',  desc:'Score 20/20 in Coord Trainer' },
  { id:'all_puzzles',  icon:'👑', name:'Grand Champion',    desc:'Solve all puzzles + 1500 ELO' },
];

function getUnlocked() { return JSON.parse(localStorage.getItem('cm_achievements') || '[]'); }

function unlockAchievement(id) {
  const list = getUnlocked();
  if (list.includes(id)) return false;
  list.push(id);
  localStorage.setItem('cm_achievements', JSON.stringify(list));
  const ach = ACHIEVEMENTS.find(a => a.id === id);
  if (ach) showAchievementToast(ach);
  return true;
}

function showAchievementToast(ach) {
  const toast = document.createElement('div');
  toast.className = 'ach-toast';
  toast.innerHTML = `<span class="ach-toast-icon">${ach.icon}</span><div><div class="ach-toast-label">Achievement Unlocked!</div><div class="ach-toast-name">${ach.name}</div><div class="ach-toast-desc">${ach.desc}</div></div>`;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 3800);
  if (typeof playSound === 'function') playSound('promo');
}

function checkAchievements() {
  const unlocked = getUnlocked();
  const done   = JSON.parse(localStorage.getItem('cm_pdone') || '[]');
  const elo    = typeof getElo === 'function' ? getElo() : 0;
  const streak = typeof getStreak === 'function' ? getStreak() : { count: 0 };

  if (!unlocked.includes('first_game'))  unlockAchievement('first_game');
  if (done.length >= 5   && !unlocked.includes('puzzles5'))  unlockAchievement('puzzles5');
  if (done.length >= 25  && !unlocked.includes('puzzles25')) unlockAchievement('puzzles25');
  if (done.length >= 60  && !unlocked.includes('puzzles60')) unlockAchievement('puzzles60');
  if (elo >= 1400        && !unlocked.includes('elo1400'))   unlockAchievement('elo1400');
  if (elo >= 1600        && !unlocked.includes('elo1600'))   unlockAchievement('elo1600');
  if (elo >= 1800        && !unlocked.includes('elo1800'))   unlockAchievement('elo1800');
  if (streak.count >= 3  && !unlocked.includes('streak3'))   unlockAchievement('streak3');
  if (streak.count >= 7  && !unlocked.includes('streak7'))   unlockAchievement('streak7');
  if (done.length >= 60 && elo >= 1500 && !unlocked.includes('all_puzzles')) unlockAchievement('all_puzzles');
  if (typeof mode !== 'undefined' && (mode === 'online' || mode === 'quickmatch') && !unlocked.includes('online_game')) unlockAchievement('online_game');
}

function checkGameWinAchievements() {
  const unlocked = getUnlocked();
  if (typeof mode !== 'undefined' && mode === 'ai') {
    if (!unlocked.includes('first_win')) unlockAchievement('first_win');
    if (typeof clockKey !== 'undefined' && ['bullet','blitz3','blitz5'].includes(clockKey) && !unlocked.includes('blitz_win')) unlockAchievement('blitz_win');
  }
  if (typeof inCheck === 'function' && typeof turn !== 'undefined' && typeof board !== 'undefined') {
    if (inCheck(turn, board) && typeof anyLegal === 'function' && !anyLegal(turn)) {
      if (!unlocked.includes('checkmate')) unlockAchievement('checkmate');
    }
  }
}

function openAchievements() {
  const unlocked = getUnlocked();
  const grid = document.getElementById('ach-grid');
  if (grid) {
    grid.innerHTML = ACHIEVEMENTS.map(a => {
      const done = unlocked.includes(a.id);
      return `<div class="ach-card ${done ? 'done' : 'locked'}">
        <div class="ach-icon">${done ? a.icon : '🔒'}</div>
        <div class="ach-name">${a.name}</div>
        <div class="ach-desc">${a.desc}</div>
      </div>`;
    }).join('');
  }
  const cnt = document.getElementById('ach-count-lbl');
  if (cnt) cnt.textContent = `${unlocked.length} / ${ACHIEVEMENTS.length} unlocked`;
  document.getElementById('ach-modal')?.classList.add('show');
}
function closeAchievements() { document.getElementById('ach-modal')?.classList.remove('show'); }

/* ──────────────────────────────────────────────────────────────
   5. PIECE SETS
────────────────────────────────────────────────────────────── */
const PIECE_SETS = {
  classic: { w:{K:'♔',Q:'♕',R:'♖',B:'♗',N:'♘',P:'♙'}, b:{K:'♚',Q:'♛',R:'♜',B:'♝',N:'♞',P:'♟'} },
  alto:    { w:{K:'♚',Q:'♛',R:'♜',B:'♝',N:'♞',P:'♟'}, b:{K:'♚',Q:'♛',R:'♜',B:'♝',N:'♞',P:'♟'} },
  text:    { w:{K:'K',Q:'Q',R:'R',B:'B',N:'N',P:'P'},   b:{K:'K',Q:'Q',R:'R',B:'B',N:'N',P:'P'} }
};
let currentPieceSet = localStorage.getItem('cm_piece_set') || 'classic';

function applyPieceSet(key) {
  currentPieceSet = key;
  localStorage.setItem('cm_piece_set', key);
  const ps = PIECE_SETS[key] || PIECE_SETS.classic;
  for (const t of ['K','Q','R','B','N','P']) { SYM[t].w = ps.w[t]; SYM[t].b = ps.b[t]; }
  document.querySelectorAll('.ps-btn').forEach(b => b.classList.toggle('active', b.dataset.set === key));
  if (key === 'text') {
    document.documentElement.style.setProperty('--piece-font-family', "'Playfair Display', serif");
    document.documentElement.style.setProperty('--piece-font-size-override', '34px');
  } else {
    document.documentElement.style.removeProperty('--piece-font-family');
    document.documentElement.style.removeProperty('--piece-font-size-override');
  }
  if (typeof render === 'function') render();
  hidePiecePanel();
}

function togglePiecePanel() { document.getElementById('piece-panel')?.classList.toggle('show'); }
function hidePiecePanel()   { document.getElementById('piece-panel')?.classList.remove('show'); }

/* ──────────────────────────────────────────────────────────────
   6. BOARD EDITOR (FEN Input)
────────────────────────────────────────────────────────────── */
function openBoardEditor() {
  const inp = document.getElementById('fen-inp');
  if (inp && typeof boardToFEN === 'function') inp.value = boardToFEN();
  document.getElementById('board-editor-modal')?.classList.add('show');
}
function closeBoardEditor() { document.getElementById('board-editor-modal')?.classList.remove('show'); }

const EXAMPLE_FENS = {
  start:   'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  italian: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
  sicilian:'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2',
  complex: 'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1',
  kp:      '8/8/8/4k3/8/8/4P3/4K3 w - - 0 1',
  endgame: '8/8/3k4/8/3K4/8/8/3Q4 w - - 0 1'
};

function setExampleFen(key) {
  const inp = document.getElementById('fen-inp');
  if (inp && EXAMPLE_FENS[key]) inp.value = EXAMPLE_FENS[key];
}

function loadFenFromEditor() {
  const fen = document.getElementById('fen-inp')?.value?.trim();
  if (!fen) return;
  try {
    if (typeof parseFenToBoard === 'function') {
      parseFenToBoard(fen);
      if (typeof render === 'function') render();
      clearArrows();
      closeBoardEditor();
      if (typeof setStatus === 'function') setStatus('📋 Position loaded from FEN');
    }
  } catch(e) {
    alert('Invalid FEN: ' + e.message);
  }
}

/* ──────────────────────────────────────────────────────────────
   7. VOICE COMMANDS  (Web Speech API)
────────────────────────────────────────────────────────────── */
let voiceRecog  = null;
let voiceActive = false;

function initVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { alert('Voice commands need Chrome or Edge browser.'); return false; }
  voiceRecog = new SR();
  voiceRecog.continuous  = true;
  voiceRecog.interimResults = false;
  voiceRecog.lang = 'en-US';
  voiceRecog.onresult = e => {
    const raw = e.results[e.results.length - 1][0].transcript.toLowerCase().trim();
    handleVoiceCmd(raw);
  };
  voiceRecog.onerror = () => { setVoiceUI(false); };
  voiceRecog.onend   = () => { if (voiceActive) voiceRecog.start(); };
  return true;
}

function toggleVoice() {
  if (!voiceRecog && !initVoice()) return;
  voiceActive = !voiceActive;
  if (voiceActive) voiceRecog.start(); else voiceRecog.stop();
  setVoiceUI(voiceActive);
}

function setVoiceUI(on) {
  const btn = document.getElementById('voice-btn');
  const ind = document.getElementById('voice-indicator');
  if (btn) { btn.classList.toggle('active', on); btn.textContent = on ? '🎙 Listening…' : '🎙 Voice'; }
  if (ind) { ind.style.display = on ? 'flex' : 'none'; }
  voiceActive = on;
}

function handleVoiceCmd(raw) {
  const cmd = raw.replace(/\s+/g, '');
  setVoiceStatus('"' + raw + '"');

  if (/undo|takeback|back/.test(cmd)) { if (typeof undoMove === 'function') undoMove(); return; }
  if (/newgame|restart|reset/.test(cmd)) { if (typeof newGame === 'function') newGame(); return; }
  if (/flip|rotate/.test(cmd)) { if (typeof flipBoard === 'function') flipBoard(); return; }
  if (/resign/.test(cmd)) { if (typeof resignGame === 'function') resignGame(); return; }
  if (/puzzle/.test(cmd)) { if (typeof openPuzzleMode === 'function') openPuzzleMode(); return; }
  if (/mute|coach/.test(cmd)) { toggleClaudeCoach(); return; }

  // Square: e.g. "e4", "d7"
  const sqMatch = raw.match(/\b([a-h]\s?[1-8])\b/);
  if (sqMatch) {
    const sq = sqMatch[1].replace(/\s/g, '');
    const c = sq.charCodeAt(0) - 97;
    const r = 8 - parseInt(sq[1]);
    if (typeof handleClick === 'function') handleClick(r, c);
    return;
  }

  setVoiceStatus('Unknown: "' + raw + '"');
  setTimeout(() => setVoiceStatus(''), 2000);
}

function setVoiceStatus(msg) {
  const el = document.getElementById('voice-status-txt');
  if (el) el.textContent = msg;
}

/* ──────────────────────────────────────────────────────────────
   8. ELO HISTORY GRAPH
────────────────────────────────────────────────────────────── */
function recordEloPoint(elo) {
  const arr = JSON.parse(localStorage.getItem('cm_elo_hist') || '[]');
  arr.push({ d: new Date().toLocaleDateString('en', {month:'short',day:'numeric'}), e: elo });
  localStorage.setItem('cm_elo_hist', JSON.stringify(arr.slice(-40)));
}

function renderEloGraph() {
  const canvas = document.getElementById('elo-graph-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const arr  = JSON.parse(localStorage.getItem('cm_elo_hist') || '[]');
  const W = canvas.offsetWidth || 260, H = canvas.height;
  canvas.width = W;
  ctx.clearRect(0, 0, W, H);

  if (arr.length < 2) {
    ctx.fillStyle = 'rgba(255,255,255,.25)';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Play vs AI to see ELO history', W / 2, H / 2 + 4);
    return;
  }

  const vals = arr.map(a => a.e);
  const minV = Math.min(...vals) - 30;
  const maxV = Math.max(...vals) + 30;
  const range = maxV - minV || 1;
  const pad = 10;
  const xStep = (W - pad * 2) / (arr.length - 1);
  const yOf = v => pad + (H - pad * 2) * (1 - (v - minV) / range);

  // Gradient fill
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, 'rgba(200,160,40,.38)');
  grad.addColorStop(1, 'rgba(200,160,40,.02)');
  ctx.beginPath();
  arr.forEach((pt, i) => { const x = pad + i * xStep, y = yOf(pt.e); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
  ctx.lineTo(pad + (arr.length - 1) * xStep, H); ctx.lineTo(pad, H); ctx.closePath();
  ctx.fillStyle = grad; ctx.fill();

  // Line
  ctx.beginPath();
  ctx.strokeStyle = '#c8a028'; ctx.lineWidth = 2; ctx.lineJoin = 'round';
  arr.forEach((pt, i) => { const x = pad + i * xStep, y = yOf(pt.e); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
  ctx.stroke();

  // Dots
  arr.forEach((pt, i) => {
    ctx.beginPath();
    ctx.arc(pad + i * xStep, yOf(pt.e), 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd700'; ctx.fill();
  });

  // Latest label
  const last = arr[arr.length - 1];
  ctx.fillStyle = '#ffd700'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'right';
  ctx.fillText(last.e, pad + (arr.length - 1) * xStep - 3, yOf(last.e) - 5);
}

/* ──────────────────────────────────────────────────────────────
   INJECT UI ELEMENTS
────────────────────────────────────────────────────────────── */
function injectUpgradeUI() {
  /* ─ Claude Panel (before analysis panel) ─ */
  const analysisPanel = document.getElementById('analysis-panel');
  if (analysisPanel && !document.getElementById('claude-panel')) {
    const cp = document.createElement('div');
    cp.id = 'claude-panel';
    cp.className = 'claude-panel';
    cp.style.display = 'none';
    analysisPanel.parentElement.insertBefore(cp, analysisPanel);
  }

  /* ─ New feat bar row ─ */
  const featBar = document.querySelector('.feat-bar');
  if (featBar && !document.getElementById('feat-bar-2')) {
    const row2 = document.createElement('div');
    row2.id = 'feat-bar-2';
    row2.className = 'feat-bar';
    row2.style.marginTop = '.25rem';
    row2.innerHTML = `
      <button class="feat-btn ${claudeEnabled ? 'active' : ''}" id="claude-toggle-btn" onclick="toggleClaudeCoach()">🤖 Coach ${claudeEnabled ? 'ON' : 'OFF'}</button>
      <button class="feat-btn" id="voice-btn" onclick="toggleVoice()">🎙 Voice</button>
      <button class="feat-btn" onclick="openCoordTrainer()">🎯 Coords</button>
      <button class="feat-btn" onclick="openAchievements()">🏅 Badges</button>
      <button class="feat-btn" onclick="openBoardEditor()">✏️ FEN</button>
      <div class="theme-wrap" style="position:relative;">
        <button class="feat-btn" onclick="togglePiecePanel()">♟ Pieces</button>
        <div id="piece-panel" class="theme-panel" style="top:100%;bottom:auto;left:0;right:auto;min-width:120px;">
          <div class="theme-opt ${currentPieceSet==='classic'?'active':''} ps-btn" data-set="classic" onclick="applyPieceSet('classic')">♔ Classic</div>
          <div class="theme-opt ${currentPieceSet==='alto'?'active':''} ps-btn"    data-set="alto"    onclick="applyPieceSet('alto')">♚ Alto (Solid)</div>
          <div class="theme-opt ${currentPieceSet==='text'?'active':''} ps-btn"    data-set="text"    onclick="applyPieceSet('text')">Aa Text</div>
        </div>
      </div>`;
    featBar.insertAdjacentElement('afterend', row2);

    /* Add new buttons to existing feat-bar */
    const addBtn = (label, fn) => {
      const b = document.createElement('button');
      b.className = 'feat-btn'; b.textContent = label;
      b.setAttribute('onclick', fn);
      featBar.appendChild(b);
    };
    addBtn('🏅 Badges', 'openAchievements()');
  }

  /* ─ Voice indicator ─ */
  if (!document.getElementById('voice-indicator')) {
    const vi = document.createElement('div');
    vi.id = 'voice-indicator';
    vi.className = 'voice-indicator';
    vi.style.display = 'none';
    vi.innerHTML = `<span class="voice-dot"></span> Listening — <span id="voice-status-txt"></span>`;
    document.querySelector('.feat-bar')?.insertAdjacentElement('beforebegin', vi);
  }

  /* ─ ELO graph in profile ─ */
  const profStats = document.querySelector('.profile-stats');
  if (profStats && !document.getElementById('elo-graph-canvas')) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'width:100%;margin:.6rem 0;';
    wrap.innerHTML = `<div style="font-size:.68rem;color:var(--text-dim);margin-bottom:.3rem;text-align:center;letter-spacing:.06em;text-transform:uppercase;">ELO History</div>
      <canvas id="elo-graph-canvas" height="64" style="width:100%;border-radius:6px;background:var(--bg,#0d0d0d);display:block;"></canvas>`;
    profStats.insertAdjacentElement('afterend', wrap);
  }

  /* ─ Modals (append to body) ─ */
  if (!document.getElementById('coord-modal')) {
    document.body.insertAdjacentHTML('beforeend', buildModalsHTML());
  }
}

function buildModalsHTML() {
  return `
  <!-- API KEY MODAL -->
  <div class="upgrade-overlay" id="api-key-modal">
    <div class="upgrade-box">
      <div class="upgrade-title">🔑 Claude AI Coach Setup</div>
      <div class="upgrade-sub">Enter your Anthropic API key to enable move-by-move explanations. Key is saved locally in your browser only.</div>
      <label class="fen-lbl">Anthropic API Key</label>
      <input id="api-key-inp" type="password" class="fen-area" style="height:auto;padding:.5rem;font-size:.82rem;font-family:monospace;"
        placeholder="sk-ant-api03-…"
        onkeydown="if(event.key==='Enter')submitApiKey()">
      <div id="api-key-err" style="color:#e06060;font-size:.75rem;min-height:1.1rem;margin-top:.3rem;"></div>
      <div style="font-size:.72rem;color:var(--text-dim);margin:.5rem 0 .9rem;line-height:1.5;">
        🔒 Key stays in your browser localStorage only. Never sent anywhere except Anthropic.<br>
        Get a key at <a href="https://console.anthropic.com" target="_blank" style="color:var(--gold);">console.anthropic.com</a>
      </div>
      <div style="display:flex;gap:.5rem;">
        <button class="btn btn-primary" style="flex:1;" onclick="submitApiKey()">✓ Save &amp; Enable</button>
        <button class="btn"             style="flex:1;" onclick="closeApiKeyModal()">Cancel</button>
      </div>
    </div>
  </div>

  <!-- COORDINATE TRAINER -->
  <div class="upgrade-overlay" id="coord-modal">
    <div class="upgrade-box">
      <div class="upgrade-title">🎯 Coordinate Trainer</div>
      <div class="upgrade-sub">Click the correct square as fast as you can! 30 seconds.</div>
      <div class="coord-hud">
        <span id="coord-stats" class="coord-hud-stat">0/0 · 0% accuracy</span>
        <span class="coord-hud-time">⏱ <strong id="coord-timer" style="color:var(--gold);">30s</strong></span>
      </div>
      <div class="coord-prompt">Find: <span id="coord-target-sq" class="coord-target-sq">e4</span></div>
      <div class="coord-board-outer">
        <div id="coord-board" class="coord-board"></div>
      </div>
      <div id="coord-result" class="coord-result-box" style="display:none;"></div>
      <button class="btn" style="width:100%;margin-top:.8rem;" onclick="closeCoordTrainer()">✕ Close</button>
    </div>
  </div>

  <!-- ACHIEVEMENTS -->
  <div class="upgrade-overlay" id="ach-modal">
    <div class="upgrade-box upgrade-box-wide">
      <div class="upgrade-title">🏅 Achievements</div>
      <div id="ach-count-lbl" class="upgrade-sub">0 / 15 unlocked</div>
      <div id="ach-grid" class="ach-grid"></div>
      <button class="btn btn-primary" style="width:100%;margin-top:1rem;" onclick="closeAchievements()">Close</button>
    </div>
  </div>

  <!-- BOARD EDITOR -->
  <div class="upgrade-overlay" id="board-editor-modal">
    <div class="upgrade-box">
      <div class="upgrade-title">✏️ Board Editor</div>
      <div class="upgrade-sub">Load any chess position from FEN notation.</div>
      <label class="fen-lbl">FEN String</label>
      <textarea id="fen-inp" class="fen-area" rows="3" placeholder="Paste FEN here…"></textarea>
      <div class="fen-examples-row">
        <span style="font-size:.7rem;color:var(--text-dim);">Quick load:</span>
        <button class="fen-ex-btn" onclick="setExampleFen('start')">Start</button>
        <button class="fen-ex-btn" onclick="setExampleFen('italian')">Italian</button>
        <button class="fen-ex-btn" onclick="setExampleFen('sicilian')">Sicilian</button>
        <button class="fen-ex-btn" onclick="setExampleFen('kp')">K+P End</button>
        <button class="fen-ex-btn" onclick="setExampleFen('complex')">Complex</button>
      </div>
      <div style="display:flex;gap:.5rem;margin-top:.9rem;">
        <button class="btn btn-primary" style="flex:1;" onclick="loadFenFromEditor()">▶ Load Position</button>
        <button class="btn"             style="flex:1;" onclick="closeBoardEditor()">Cancel</button>
      </div>
    </div>
  </div>`;
}

/* ──────────────────────────────────────────────────────────────
   HOOKS INTO EXISTING CHESS ENGINE
────────────────────────────────────────────────────────────── */
function installHooks() {
  /* execMove → clear arrows + coach + achievements */
  const _prevExec = execMove;
  execMove = function(fr, fc, tr, tc, promo, fromPeer = false) {
    const pieceSnap   = (board && board[fr] && board[fr][fc]) ? { ...board[fr][fc] } : null;
    const captureSnap = (board && board[tr] && board[tr][tc]) ? { ...board[tr][tc] } : null;
    _prevExec(fr, fc, tr, tc, promo, fromPeer);
    clearArrows();
    checkAchievements();
    if (claudeEnabled && pieceSnap && !fromPeer) {
      setTimeout(() => explainMove(fr, fc, tr, tc, pieceSnap, captureSnap), 700);
    }
  };

  /* checkState → achievements on game end + ELO record */
  const _prevCheck = checkState;
  checkState = function() {
    _prevCheck();
    if (over) {
      checkGameWinAchievements();
      setTimeout(() => {
        recordEloPoint(typeof getElo === 'function' ? getElo() : 1200);
      }, 600);
    }
  };

  /* updateLeaderboardEntry → record ELO for graph */
  if (typeof updateLeaderboardEntry === 'function') {
    const _prevLB = updateLeaderboardEntry;
    updateLeaderboardEntry = function(elo, result) {
      _prevLB(elo, result);
      recordEloPoint(elo);
    };
  }

  /* Profile modal → render ELO graph when opened */
  const profModal = document.getElementById('profile-modal');
  if (profModal) {
    const observer = new MutationObserver(() => {
      if (profModal.classList.contains('show')) setTimeout(renderEloGraph, 80);
    });
    observer.observe(profModal, { attributes: true, attributeFilter: ['class'] });
  }
}

/* ──────────────────────────────────────────────────────────────
   INIT
────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    injectUpgradeUI();
    installHooks();
    initArrowCanvas();
    applyPieceSet(currentPieceSet);
    checkAchievements();

    /* Escape clears arrows */
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') { clearArrows(); closeAchievements(); closeCoordTrainer(); closeBoardEditor(); }
    });

    /* Re-sync canvas after flip / fullscreen */
    const origFlip = window.flipBoard;
    if (origFlip) {
      window.flipBoard = function() { origFlip(); setTimeout(() => { syncCanvasSize(); redrawArrows(); }, 60); };
    }

    /* Re-sync after resize observer on board */
    const boardEl = document.getElementById('board');
    if (boardEl && window.ResizeObserver) {
      new ResizeObserver(() => { syncCanvasSize(); }).observe(boardEl);
    }

    console.log('[ChessArena] Upgrade v4.0 loaded ✓');
  }, 250);
});
