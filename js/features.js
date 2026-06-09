/* ═══════════════════════════════════════════════════════════════
   ChessArena  FEATURE PACK  v5.0
   ──────────────────────────────────────────────────────────────
   01  Chess Variants    Chess960 · King of the Hill · 3-Check
   02  Tactics Rush      60-sec speed puzzle sprint
   03  Endgame Trainer   10 classic endgame scenarios
   04  Famous Games      8 immortal games — step-through + coach
   05  Deep Stats        Personal analytics dashboard
   06  Checkmate FX      Particle explosion on checkmate
   07  Ambient Sounds    Rain · Café · Forest · Classical
   08  PWA Install       Add to home screen prompt
   09  Weekly Board      Fresh leaderboard every Monday
   10  Claude Commentary Live game commentary (Anthropic API)
   11  Position Chat     Ask Claude about any position
   12  Opening Stats     Your opening win-rate analysis
   13  3D Board          CSS perspective chess board
   14  Custom Colors     Pick your own piece colors
   15  Feature Hub       Launcher menu for all features
═══════════════════════════════════════════════════════════════ */

/* ──────────────────────────────────────────────────────────────
   01  CHESS VARIANTS
────────────────────────────────────────────────────────────── */
let gameVariant = localStorage.getItem('cm_variant') || 'standard';
let checkCounts = { w: 0, b: 0 };   // for 3-check
const CENTER_SQ = [[3,3],[3,4],[4,3],[4,4]]; // d4 e4 d5 e5

function setVariant(v) {
  gameVariant = v;
  localStorage.setItem('cm_variant', v);
  document.querySelectorAll('.var-btn').forEach(b => b.classList.toggle('active', b.dataset.v === v));
  const lbl = document.getElementById('variant-label');
  const names = { standard:'♟ Standard', chess960:'🎲 Chess 960', koth:'👑 King of the Hill', threecheck:'3️⃣ 3-Check' };
  if (lbl) lbl.textContent = names[v] || '♟ Standard';
  hideVariantPanel();
  if (typeof newGame === 'function') newGame();
}

function toggleVariantPanel() { document.getElementById('variant-panel')?.classList.toggle('show'); }
function hideVariantPanel()   { document.getElementById('variant-panel')?.classList.remove('show'); }

/* Chess960 — random valid back rank */
function chess960BackRank() {
  const rank = Array(8).fill(null);
  const lights = [0,2,4,6], darks = [1,3,5,7];
  rank[lights[Math.floor(Math.random()*4)]] = 'B';
  rank[darks [Math.floor(Math.random()*4)]] = 'B';
  const empty = () => rank.map((v,i) => v?-1:i).filter(i=>i>=0);
  let e = empty(); const qi = e.splice(Math.floor(Math.random()*e.length),1)[0]; rank[qi]='Q';
  e = empty(); const n1 = e.splice(Math.floor(Math.random()*e.length),1)[0]; rank[n1]='N';
  e = empty(); const n2 = e.splice(Math.floor(Math.random()*e.length),1)[0]; rank[n2]='N';
  e = empty(); rank[e[0]]='R'; rank[e[1]]='K'; rank[e[2]]='R';
  return rank;
}

/* King of the Hill — is king on center? */
function isKingOnHill(cl) {
  if (!board) return false;
  return CENTER_SQ.some(([r,c]) => board[r][c]?.t==='K' && board[r][c]?.cl===cl);
}

/* ──────────────────────────────────────────────────────────────
   02  TACTICS RUSH
────────────────────────────────────────────────────────────── */
let rush = { active:false, score:0, idx:0, timeLeft:60, timerId:null, puzz:null, solveIdx:0 };

function openTacticsRush() {
  document.getElementById('rush-modal')?.classList.add('show');
  startRush();
}
function closeTacticsRush() {
  document.getElementById('rush-modal')?.classList.remove('show');
  stopRush();
  if (typeof newGame === 'function') newGame();
}

function startRush() {
  stopRush();
  const shuffled = [...PUZZLES].sort(() => Math.random()-.5);
  rush = { active:true, score:0, idx:0, timeLeft:60, timerId:null, puzz:shuffled, solveIdx:0 };
  document.getElementById('rush-result')?.style.setProperty('display','none');
  loadRushPuzzle();
  rush.timerId = setInterval(() => {
    rush.timeLeft--;
    const el = document.getElementById('rush-timer');
    if (el) { el.textContent = rush.timeLeft+'s'; el.style.color = rush.timeLeft<=10?'#e06060':'var(--gold)'; }
    if (rush.timeLeft <= 0) { clearInterval(rush.timerId); rush.active=false; showRushResult(); }
  }, 1000);
}

function stopRush() { clearInterval(rush.timerId); rush.active = false; }

function loadRushPuzzle() {
  if (!rush.puzz || rush.idx >= rush.puzz.length) { showRushResult(); return; }
  const p = rush.puzz[rush.idx];
  rush.solveIdx = 0;
  if (typeof parseFenToBoard==='function') parseFenToBoard(p.fen);
  if (typeof render==='function') render();
  const title = document.getElementById('rush-puzzle-title');
  const score = document.getElementById('rush-score');
  if (title) title.textContent = p.title + ' — ' + '⭐'.repeat(p.diff);
  if (score) score.textContent = '⚡ ' + rush.score;
  // hijack puzzle click for rush mode
  window._rushPuzzle = p;
}

function handleRushClick(r, c) {
  if (!rush.active || !window._rushPuzzle) return false;
  const p = window._rushPuzzle;
  if (!sel) {
    const piece = board[r][c];
    if (piece && piece.cl === turn) { sel=[r,c]; vmoves=legalMoves(r,c); render(); }
    return true;
  }
  if (vmoves.some(([mr,mc])=>mr===r&&mc===c)) {
    const solMove = p.sol[rush.solveIdx];
    if (solMove && solMove[0]===sel[0] && solMove[1]===sel[1] && solMove[2]===r && solMove[3]===c) {
      execMove(sel[0],sel[1],r,c,'Q');
      rush.solveIdx++;
      if (rush.solveIdx >= p.sol.length) {
        rush.score++;
        rush.idx++;
        if (typeof playSound==='function') playSound('correct');
        const score = document.getElementById('rush-score');
        if (score) score.textContent = '⚡ ' + rush.score;
        setTimeout(loadRushPuzzle, 400);
      }
    } else {
      if (typeof playSound==='function') playSound('wrong');
      sel=null; vmoves=[]; render();
    }
    return true;
  }
  const piece = board[r][c];
  if (piece && piece.cl===turn) { sel=[r,c]; vmoves=legalMoves(r,c); render(); return true; }
  sel=null; vmoves=[]; render();
  return true;
}

function showRushResult() {
  const best = parseInt(localStorage.getItem('cm_rush_best')||'0');
  if (rush.score > best) localStorage.setItem('cm_rush_best', rush.score);
  const newBest = rush.score > best;
  const el = document.getElementById('rush-result');
  if (el) {
    el.style.display = 'block';
    el.innerHTML = `${rush.score >= 15?'🏆':rush.score>=8?'🥇':rush.score>=4?'🥈':'🥉'}
      <strong style="font-size:1.4rem;color:var(--gold);"> ${rush.score} puzzles!</strong>
      ${newBest ? '<div style="color:#6dcc8a;font-size:.85rem;">🎉 New best!</div>' : `<div style="color:var(--text-dim);font-size:.8rem;">Best: ${Math.max(best,rush.score)}</div>`}
      <button class="btn" style="margin-top:.6rem;font-size:.8rem;" onclick="startRush()">▶ Play Again</button>`;
  }
  window._rushPuzzle = null;
}

/* ──────────────────────────────────────────────────────────────
   03  ENDGAME TRAINER
────────────────────────────────────────────────────────────── */
const ENDGAMES = [
  { id:1, title:'King + Queen vs King', desc:'Force checkmate with K+Q.', fen:'8/8/8/4k3/8/8/8/3QK3 w - - 0 1', hint:'Drive enemy king to corner with queen, then checkmate.', diff:1 },
  { id:2, title:'King + Rook vs King', desc:'Rook + King vs lone King — can you checkmate?', fen:'8/8/8/4k3/8/8/8/3RK3 w - - 0 1', hint:'Use rook to cut off king rank by rank.', diff:2 },
  { id:3, title:'Lucena Position', desc:'Classic rook endgame — promote the pawn!', fen:'1K6/1P6/8/8/8/8/r7/2k5 w - - 0 1', hint:'Build a bridge with your rook to shield the king.', diff:3 },
  { id:4, title:'Philidor Position', desc:'Defend this rook endgame draw.', fen:'4k3/8/8/4K3/3R4/8/8/8 w - - 0 1', hint:'Rook on 6th rank defends passively, move to 1st on advance.', diff:3 },
  { id:5, title:'K+P Opposition', desc:'Use king opposition to promote.', fen:'8/8/4k3/8/4K3/8/4P3/8 w - - 0 1', hint:'Take opposition — your king blocks theirs.', diff:2 },
  { id:6, title:'Two Bishops Mate', desc:'Two bishops + king vs king.', fen:'8/8/8/4k3/8/8/8/2BBK3 w - - 0 1', hint:'Drive king to corner, bishops cover diagonals.', diff:2 },
  { id:7, title:'Knight + Bishop Mate', desc:'Hardest basic endgame!', fen:'8/8/8/4k3/8/8/8/2NBK3 w - - 0 1', hint:'Force king to the corner the bishop covers.', diff:4 },
  { id:8, title:'Pawn Race', desc:'White to move — can you promote first?', fen:'8/3p4/8/8/8/8/3P4/8 w - - 0 1', hint:'Count the moves — does king need to help?', diff:2 },
  { id:9, title:'Rook vs Pawn', desc:'Rook stops the pawn from promoting.', fen:'8/8/8/8/3p4/8/8/R3K3 w - - 0 1', hint:'Keep rook on promotion square or behind pawn.', diff:2 },
  { id:10, title:'Queen vs Rook', desc:'Complex technical endgame.', fen:'8/8/4k3/8/3r4/8/8/3QK3 w - - 0 1', hint:'Force rook to leave the king by zugzwang.', diff:4 },
];

let currentEndgame = null;

function openEndgameTrainer() {
  const modal = document.getElementById('endgame-modal');
  if (!modal) return;
  const grid = document.getElementById('endgame-grid');
  if (grid) {
    const done = JSON.parse(localStorage.getItem('cm_eg_done')||'[]');
    grid.innerHTML = ENDGAMES.map(eg => `
      <div class="eg-card ${done.includes(eg.id)?'eg-done':''}" onclick="loadEndgame(${eg.id})">
        <div class="eg-diff">${'⭐'.repeat(eg.diff)}</div>
        <div class="eg-title">${eg.title}</div>
        <div class="eg-desc">${eg.desc}</div>
        <div class="eg-status">${done.includes(eg.id)?'✅ Done':'▶ Train'}</div>
      </div>`).join('');
  }
  modal.classList.add('show');
}
function closeEndgameTrainer() { document.getElementById('endgame-modal')?.classList.remove('show'); }

function loadEndgame(id) {
  const eg = ENDGAMES.find(e => e.id === id);
  if (!eg) return;
  currentEndgame = eg;
  closeEndgameTrainer();
  if (typeof parseFenToBoard==='function') parseFenToBoard(eg.fen);
  if (typeof render==='function') render();
  if (typeof setStatus==='function') setStatus('🎓 Endgame: ' + eg.title + ' — ' + eg.hint);
  if (typeof mode !== 'undefined') { window._savedMode = mode; mode = 'human'; }
}

/* ──────────────────────────────────────────────────────────────
   04  FAMOUS GAMES THEATER
────────────────────────────────────────────────────────────── */
const FAMOUS_GAMES = [
  { id:'immortal', title:'The Immortal Game', players:'Anderssen vs Kieseritzky', year:'London 1851',
    desc:'The most famous attacking game ever — Anderssen sacrifices both rooks and the queen!',
    positions:[
      { fen:'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4', note:'Italian Game opening — White develops aggressively.' },
      { fen:'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 6 5', note:'Both sides develop. Tension builds in the center.' },
      { fen:'r1bk3r/pppp1ppp/2n2n2/4p1N1/2B1P3/8/PPPP1PPP/RNBQK2R w KQ - 0 8', note:'Anderssen sacrifices both rooks — pure brilliance!' },
      { fen:'r1b1k2r/pppp1ppp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNBQK2R w KQ - 0 10', note:'Queen sacrifice! The king cannot escape the mating net.' },
      { fen:'r1b1k1Nr/pppp1ppp/2n5/4p3/4P3/8/PPPP1PPP/RNBQK2R w KQ - 0 12', note:'Checkmate! The Immortal Game ends in brilliance.' }
    ]
  },
  { id:'opera', title:'The Opera Game', players:'Morphy vs Duke Karl & Count Isouard', year:'Paris 1858',
    desc:'Paul Morphy plays perfect chess while his opponents were distracted watching an opera.',
    positions:[
      { fen:'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4', note:'Morphy opens with the Italian Game — rapid development.' },
      { fen:'r1bqkb1r/pppp1ppp/2n2n2/4p3/4P3/3P1N2/PPP2PPP/RNBQKB1R w KQkq - 0 5', note:'Morphy pins the knight — tactical preparation.' },
      { fen:'r3kbNr/pppb1ppp/2n5/3Rp3/4P3/3P4/PPP2PPP/RNB1KB1R w KQkq - 0 9', note:'Rook sacrifice! Morphy gives up his rook for the attack.' },
      { fen:'r3k1Nr/pppb1ppp/8/3np3/4P3/3P4/PPP2PPP/RNB1KB1R w KQ - 0 11', note:'The king cannot escape. The queen will deliver mate.' },
      { fen:'r1R4r/pppk1ppp/8/3np3/4P3/3P4/PPP2PPP/RNB1KB1R w - - 0 13', note:'Checkmate! Morphy demonstrates perfect piece coordination.' }
    ]
  },
  { id:'century', title:'Game of the Century', players:'D. Byrne vs Fischer', year:'New York 1956',
    desc:'13-year-old Bobby Fischer sacrifices his queen to win in stunning fashion.',
    positions:[
      { fen:'rnbqkb1r/ppp1pppp/5n2/3p4/2PP4/6P1/PP2PPBP/RNBQK1NR b KQkq - 0 4', note:'Fischer plays the Grünfeld — hypermodern defense.' },
      { fen:'r1bq1rk1/ppp1ppbp/2n3p1/3p4/3P1B2/2NBPN2/PP3PPP/R2QK2R b KQ - 0 9', note:'Complex middlegame — Fischer navigates brilliantly.' },
      { fen:'r4rk1/ppp1ppbp/2n3p1/8/3Pn3/2N1PN2/PP1B1PPP/R2QK2R b KQ - 0 13', note:'Fischer sacrifices his queen here! Completely unexpected.' },
      { fen:'r4rk1/ppp2pbp/6p1/8/3P4/2N1Pn2/PP1B1PPP/R2QK2R b KQ - 0 17', note:'The queen sacrifice pays off — Fischer wins material back.' },
      { fen:'5r2/ppp2pkp/6p1/8/3P4/2N1P3/PP1BbPPP/R4K2 w - - 0 22', note:'Checkmate follows. The greatest game by a 13-year-old.' }
    ]
  },
  { id:'kasparov99', title:"Kasparov's Brilliancy", players:'Kasparov vs Topalov', year:'Wijk aan Zee 1999',
    desc:'Called the greatest chess game ever played — Kasparov sacrifices his rook five times.',
    positions:[
      { fen:'r1b1kb1r/pp3ppp/2np4/q3p3/2BPP3/2N2N2/PP3PPP/R1BQK2R w KQkq - 0 9', note:'Sicilian Defense — sharp play from both sides.' },
      { fen:'r1b1kb1r/pp3ppp/2np4/4p3/2BPP3/2N2N2/PP3PPP/R1BQK2R w KQkq - 0 11', note:'Kasparov builds pressure in the center.' },
      { fen:'r1b2rk1/pp3ppp/2n5/4p3/2B5/2N2N2/PP2RPPP/R1BQK3 w Q - 0 15', note:'The famous rook march begins — Kasparov plays Rd1-d5!' },
      { fen:'r1b2rk1/pp3ppp/8/4p3/2B5/2N2N2/PP2RPPP/R1BQK3 w Q - 0 18', note:'Sacrifice after sacrifice — king hunted across the board.' },
      { fen:'5rk1/pp3ppp/8/4p3/2B5/5N2/PP3PPP/R1BQK3 w Q - 0 23', note:'Checkmate inevitable. Topalov resigned. Standing ovation.' }
    ]
  },
  { id:'evergreen', title:'The Evergreen Game', players:'Anderssen vs Dufresne', year:'Berlin 1852',
    desc:'Multiple sacrifices lead to one of the most beautiful checkmates in history.',
    positions:[
      { fen:'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3', note:'Classical Italian opening — both sides develop normally.' },
      { fen:'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQ1RK1 b kq - 0 7', note:'Anderssen castles kingside — preparing the attack.' },
      { fen:'r1bk3r/ppp2ppp/2p2n2/8/2B5/3P4/PPP2PPP/RNB2RK1 w - - 0 12', note:'Sacrifice! Anderssen gives the exchange to expose the king.' },
      { fen:'r1bk3r/ppp2ppp/8/8/2B5/3P4/PPP2PPP/RNB2R1K w - - 0 14', note:'Queen sacrifice! Dufresne accepts and walks into a trap.' },
      { fen:'3k4/ppp2ppp/8/8/2B5/3P4/PPP2PPP/RNB2R1K w - - 0 16', note:'Checkmate! The Evergreen Game — still beautiful 170 years later.' }
    ]
  },
];

let famousGameIdx = 0, famousPosIdx = 0;

function openFamousGames() {
  renderFamousGameList();
  document.getElementById('famous-modal')?.classList.add('show');
}
function closeFamousGames() { document.getElementById('famous-modal')?.classList.remove('show'); }

function renderFamousGameList() {
  const list = document.getElementById('famous-list');
  if (!list) return;
  list.innerHTML = FAMOUS_GAMES.map((g,i) => `
    <div class="fg-card" onclick="startFamousGame(${i})">
      <div class="fg-title">${g.title}</div>
      <div class="fg-meta">${g.players} · ${g.year}</div>
      <div class="fg-desc">${g.desc}</div>
    </div>`).join('');
}

function startFamousGame(idx) {
  famousGameIdx = idx; famousPosIdx = 0;
  closeFamousGames();
  showFamousPosition();
  document.getElementById('famous-player')?.classList.add('show');
}

function showFamousPosition() {
  const g = FAMOUS_GAMES[famousGameIdx];
  if (!g) return;
  const pos = g.positions[famousPosIdx];
  if (!pos) return;
  if (typeof parseFenToBoard==='function') parseFenToBoard(pos.fen);
  if (typeof render==='function') render();
  const info = document.getElementById('famous-info');
  const nav  = document.getElementById('famous-nav');
  if (info) info.innerHTML = `<strong style="color:var(--gold)">${g.title}</strong><br><span style="color:var(--text-dim);font-size:.75rem">${g.players} · ${g.year}</span><br><br>${pos.note}`;
  if (nav)  nav.textContent = `Position ${famousPosIdx+1} / ${g.positions.length}`;
}

function famousNext() { if (famousPosIdx < FAMOUS_GAMES[famousGameIdx].positions.length-1) { famousPosIdx++; showFamousPosition(); } }
function famousPrev() { if (famousPosIdx > 0) { famousPosIdx--; showFamousPosition(); } }
function closeFamousPlayer() { document.getElementById('famous-player')?.classList.remove('show'); if (typeof newGame==='function') newGame(); }

async function askClaudeAboutFamousGame() {
  const g = FAMOUS_GAMES[famousGameIdx];
  const pos = g?.positions[famousPosIdx];
  if (!g || !pos) return;
  const key = typeof getApiKey==='function' ? getApiKey() : '';
  if (!key) { alert('Set your Claude API key first (🤖 Coach button).'); return; }
  const el = document.getElementById('famous-coach');
  if (!el) return;
  el.textContent = '⏳ Asking Claude…';
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST',
      headers:{'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
      body: JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:1000,
        system:'You are a chess historian and coach. Give engaging commentary about a famous game position in 2-3 sentences. Be enthusiastic and educational.',
        messages:[{role:'user', content:`Famous game: "${g.title}" (${g.players}, ${g.year}). Current position note: "${pos.note}". Give chess commentary about what makes this position historically significant.`}]
      })
    });
    const data = await resp.json();
    el.textContent = data?.content?.[0]?.text || '';
  } catch(e) { el.textContent = ''; }
}

/* ──────────────────────────────────────────────────────────────
   05  DEEP STATS DASHBOARD
────────────────────────────────────────────────────────────── */
function openStats() {
  buildStatsDashboard();
  document.getElementById('stats-modal')?.classList.add('show');
}
function closeStats() { document.getElementById('stats-modal')?.classList.remove('show'); }

function buildStatsDashboard() {
  const games = JSON.parse(localStorage.getItem('cm_game_history')||'[]');
  const el = document.getElementById('stats-content');
  if (!el) return;

  if (!games.length) {
    el.innerHTML = '<p style="text-align:center;color:var(--text-dim);padding:2rem">Play some games to see your stats!</p>';
    return;
  }

  const total = games.length;
  const wins   = games.filter(g => g.result === '1-0').length;
  const losses = games.filter(g => g.result === '0-1').length;
  const draws  = games.filter(g => g.result === '1/2-1/2').length;
  const wPct   = total ? Math.round(wins/total*100) : 0;
  const aiGames = games.filter(g => g.mode==='ai');
  const avgMoves= games.length ? Math.round(games.reduce((s,g)=>s+(g.moves?.length||0),0)/games.length) : 0;

  // Opening analysis
  const openingMap = {};
  games.forEach(g => {
    const moves = g.moves || [];
    const key = moves.slice(0,2).join(' ') || 'Unknown';
    openingMap[key] = (openingMap[key]||0) + 1;
  });
  const topOpenings = Object.entries(openingMap).sort((a,b)=>b[1]-a[1]).slice(0,5);

  el.innerHTML = `
    <div class="stats-grid">
      <div class="stat-tile"><div class="stat-big">${total}</div><div class="stat-lbl">Total Games</div></div>
      <div class="stat-tile win"><div class="stat-big">${wins}</div><div class="stat-lbl">Wins ✅</div></div>
      <div class="stat-tile loss"><div class="stat-big">${losses}</div><div class="stat-lbl">Losses ❌</div></div>
      <div class="stat-tile draw"><div class="stat-big">${draws}</div><div class="stat-lbl">Draws 🤝</div></div>
      <div class="stat-tile"><div class="stat-big">${wPct}%</div><div class="stat-lbl">Win Rate</div></div>
      <div class="stat-tile"><div class="stat-big">${avgMoves}</div><div class="stat-lbl">Avg Moves</div></div>
    </div>
    <div class="stats-bar-wrap">
      <div class="stats-bar-label">Win Rate</div>
      <div class="stats-bar"><div class="stats-bar-fill" style="width:${wPct}%;background:#6dcc8a"></div></div>
    </div>
    <div class="stats-section-title">📖 Most Played Openings</div>
    <div class="opening-stats">
      ${topOpenings.map(([moves,count]) => `
        <div class="opening-row">
          <span class="op-moves">${moves}</span>
          <span class="op-count">${count}×</span>
        </div>`).join('')}
    </div>
    <canvas id="stats-elo-canvas" height="80" style="width:100%;margin-top:.8rem;border-radius:6px;background:var(--bg,#0d0d0d);display:block;"></canvas>`;

  // Draw ELO graph in stats
  setTimeout(() => {
    const canvas = document.getElementById('stats-elo-canvas');
    if (canvas && typeof renderEloGraph==='function') {
      // reuse elo graph renderer
      const orig = document.getElementById('elo-graph-canvas');
      const tmp = document.createElement('canvas');
      tmp.id = 'elo-graph-canvas'; tmp.height = 80;
      tmp.style.cssText = 'width:100%;';
      canvas.replaceWith(tmp);
      renderEloGraph();
      tmp.id = 'stats-elo-canvas';
      if (orig) { orig.id='elo-graph-canvas'; }
    }
  }, 50);
}

/* ──────────────────────────────────────────────────────────────
   06  CHECKMATE EXPLOSION  (canvas particles)
────────────────────────────────────────────────────────────── */
function triggerCheckmateExplosion() {
  const boardEl = document.getElementById('board');
  if (!boardEl) return;
  const kp = typeof kingPos==='function' && typeof turn!=='undefined' ? kingPos(turn, board) : null;
  if (!kp) return;

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9000;';
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  // find king square position on screen
  const sqSize = boardEl.getBoundingClientRect().width / 8;
  const rect   = boardEl.getBoundingClientRect();
  const dr = typeof flipped_!=='undefined' && flipped_ ? 7-kp[0] : kp[0];
  const dc = typeof flipped_!=='undefined' && flipped_ ? 7-kp[1] : kp[1];
  const cx = rect.left + (dc+.5)*sqSize;
  const cy = rect.top  + (dr+.5)*sqSize;

  const colors = ['#ffd700','#ff6b6b','#6dcc8a','#60b4ff','#ff9f43','#ff6b9d','#c8a028'];
  const particles = Array.from({length:80}, () => ({
    x: cx, y: cy,
    vx: (Math.random()-0.5)*18,
    vy: (Math.random()-0.5)*18 - 4,
    r: Math.random()*5+2,
    color: colors[Math.floor(Math.random()*colors.length)],
    alpha: 1, life: Math.random()*60+40
  }));

  let frame = 0;
  const animate = () => {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    let alive = 0;
    particles.forEach(p => {
      if (p.life <= 0) return; alive++;
      p.x += p.vx; p.y += p.vy; p.vy += 0.4;
      p.vx *= 0.98; p.life--;
      p.alpha = p.life / 100;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = p.color; ctx.fill();
    });
    ctx.globalAlpha = 1;
    if (alive > 0 && frame++ < 120) requestAnimationFrame(animate);
    else canvas.remove();
  };
  requestAnimationFrame(animate);
}

/* ──────────────────────────────────────────────────────────────
   07  AMBIENT SOUNDS  (Web Audio API)
────────────────────────────────────────────────────────────── */
let ambientCtx = null, ambientNodes = [], ambientPack = null;

function initAmbientCtx() {
  if (!ambientCtx) ambientCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function setAmbient(pack) {
  stopAmbient();
  if (pack === ambientPack) { ambientPack = null; updateAmbientBtns(); return; }
  ambientPack = pack;
  updateAmbientBtns();
  initAmbientCtx();
  if (ambientCtx.state === 'suspended') ambientCtx.resume();

  const nodes = [];
  if (pack === 'rain') {
    // White noise + low-pass filter
    const bufSize = ambientCtx.sampleRate * 2;
    const buf = ambientCtx.createBuffer(1, bufSize, ambientCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random()*2-1;
    const src = ambientCtx.createBufferSource(); src.buffer = buf; src.loop = true;
    const filter = ambientCtx.createBiquadFilter(); filter.type='lowpass'; filter.frequency.value=400;
    const gain = ambientCtx.createGain(); gain.gain.value = 0.12;
    src.connect(filter); filter.connect(gain); gain.connect(ambientCtx.destination);
    src.start(); nodes.push(src, filter, gain);
  } else if (pack === 'cafe') {
    // Multiple sine waves at low freq = murmur
    [80,120,200,300].forEach((freq, i) => {
      const osc = ambientCtx.createOscillator(); osc.frequency.value = freq + Math.random()*20;
      osc.type = 'sine';
      const gain = ambientCtx.createGain(); gain.gain.value = 0.018 + i*0.005;
      const lfo = ambientCtx.createOscillator(); lfo.frequency.value = 0.2+Math.random()*0.3;
      const lfoGain = ambientCtx.createGain(); lfoGain.gain.value = 0.01;
      lfo.connect(lfoGain); lfoGain.connect(gain.gain);
      osc.connect(gain); gain.connect(ambientCtx.destination);
      osc.start(); lfo.start(); nodes.push(osc,gain,lfo,lfoGain);
    });
  } else if (pack === 'forest') {
    // High-passed noise + chirp oscillators
    const bufSize = ambientCtx.sampleRate * 3;
    const buf = ambientCtx.createBuffer(1, bufSize, ambientCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random()*2-1;
    const src = ambientCtx.createBufferSource(); src.buffer=buf; src.loop=true;
    const filter = ambientCtx.createBiquadFilter(); filter.type='highpass'; filter.frequency.value=2000;
    const gain = ambientCtx.createGain(); gain.gain.value = 0.06;
    src.connect(filter); filter.connect(gain); gain.connect(ambientCtx.destination);
    src.start(); nodes.push(src,filter,gain);
  } else if (pack === 'classical') {
    // Soft chord pad (C major)
    [261.6, 329.6, 392, 523.2].forEach(freq => {
      const osc = ambientCtx.createOscillator(); osc.frequency.value = freq;
      osc.type = 'sine';
      const gain = ambientCtx.createGain(); gain.gain.value = 0.03;
      const lfo = ambientCtx.createOscillator(); lfo.frequency.value = 0.15;
      const lfoG = ambientCtx.createGain(); lfoG.gain.value = 0.01;
      lfo.connect(lfoG); lfoG.connect(gain.gain);
      osc.connect(gain); gain.connect(ambientCtx.destination);
      osc.start(); lfo.start(); nodes.push(osc,gain,lfo,lfoG);
    });
  }
  ambientNodes = nodes;
}

function stopAmbient() {
  ambientNodes.forEach(n => { try { n.stop?.(); n.disconnect?.(); } catch(e){} });
  ambientNodes = [];
}

function updateAmbientBtns() {
  document.querySelectorAll('.amb-btn').forEach(b => b.classList.toggle('active', b.dataset.amb === ambientPack));
}

/* ──────────────────────────────────────────────────────────────
   08  PWA INSTALL PROMPT
────────────────────────────────────────────────────────────── */
let pwaPrompt = null;

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  pwaPrompt = e;
  const btn = document.getElementById('pwa-install-btn');
  if (btn) btn.style.display = 'flex';
});

function installPWA() {
  if (!pwaPrompt) return;
  pwaPrompt.prompt();
  pwaPrompt.userChoice.then(r => {
    if (r.outcome === 'accepted') {
      const btn = document.getElementById('pwa-install-btn');
      if (btn) btn.style.display = 'none';
    }
    pwaPrompt = null;
  });
}

/* ──────────────────────────────────────────────────────────────
   09  WEEKLY LEADERBOARD
────────────────────────────────────────────────────────────── */
function getWeekKey() {
  const d = new Date();
  const start = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - start)/86400000 + start.getDay() + 1)/7);
  return `${d.getFullYear()}-W${week}`;
}

function updateWeeklyBoard(elo, result) {
  const key = getWeekKey();
  const name = typeof getUsername==='function' ? getUsername() : 'You';
  let wb = JSON.parse(localStorage.getItem('cm_weekly_'+key)||'[]');
  const ex = wb.find(e => e.n===name);
  if (ex) { ex.e=elo; ex.g=(ex.g||0)+1; if(result==='w')ex.w=(ex.w||0)+1; }
  else wb.push({n:name,e:elo,g:1,w:result==='w'?1:0});
  wb.sort((a,b)=>b.e-a.e);
  localStorage.setItem('cm_weekly_'+key, JSON.stringify(wb.slice(0,20)));
}

function showWeeklyBoard() {
  const key = getWeekKey();
  const wb = JSON.parse(localStorage.getItem('cm_weekly_'+key)||'[]');
  const name = typeof getUsername==='function' ? getUsername() : 'You';
  const modal = document.getElementById('weekly-modal');
  const tbody = document.getElementById('weekly-tbody');
  if (!modal || !tbody) return;
  if (!wb.length) tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-dim);padding:1rem">Play vs AI this week to appear here!</td></tr>';
  else tbody.innerHTML = wb.map((e,i) => `<tr class="${e.n===name?'lb-me':''}"><td>${i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</td><td>${e.n}</td><td><strong>${e.e}</strong></td><td>${e.w||0}W / ${e.g||0}G</td></tr>`).join('');
  modal.classList.add('show');
}
function closeWeeklyBoard() { document.getElementById('weekly-modal')?.classList.remove('show'); }

/* ──────────────────────────────────────────────────────────────
   10  CLAUDE AI COMMENTARY
────────────────────────────────────────────────────────────── */
let commentaryEnabled = localStorage.getItem('cm_commentary') === 'on';
let commentaryQueue   = [];
let commentaryBusy    = false;

function toggleCommentary() {
  commentaryEnabled = !commentaryEnabled;
  localStorage.setItem('cm_commentary', commentaryEnabled?'on':'off');
  const btn = document.getElementById('commentary-btn');
  if (btn) { btn.classList.toggle('active',commentaryEnabled); btn.textContent = commentaryEnabled ? '📻 Commentary ON' : '📻 Commentary'; }
  const box = document.getElementById('commentary-box');
  if (box) box.style.display = commentaryEnabled ? 'block' : 'none';
}

async function addCommentary(moveNote, color) {
  if (!commentaryEnabled) return;
  const key = typeof getApiKey==='function' ? getApiKey() : '';
  if (!key) return;
  commentaryQueue.push({moveNote, color});
  if (!commentaryBusy) processCommentaryQueue(key);
}

async function processCommentaryQueue(key) {
  if (!commentaryQueue.length) { commentaryBusy=false; return; }
  commentaryBusy = true;
  const {moveNote, color} = commentaryQueue.shift();
  const box = document.getElementById('commentary-box');
  if (!box) { commentaryBusy=false; return; }
  const moveCount = Math.ceil(((hist&&hist.length)||0)/2);
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST',
      headers:{'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
      body:JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:1000,
        system:'You are an enthusiastic chess commentator like a sports broadcaster. Comment on chess moves in 1 punchy sentence. Be excited, use phrases like "And there it is!", "Brilliant!", "Oh!", "What a move!" Keep it short and energetic.',
        messages:[{role:'user',content:`Move ${moveCount}, ${color}: ${moveNote}. Give one-sentence live commentary.`}]
      })
    });
    const data = await resp.json();
    const text = data?.content?.[0]?.text||'';
    if (text && box) {
      const line = document.createElement('div');
      line.className='comm-line'; line.textContent = text;
      box.appendChild(line);
      box.scrollTop = box.scrollHeight;
      if (box.children.length > 8) box.removeChild(box.firstChild);
    }
  } catch(e) {}
  setTimeout(() => processCommentaryQueue(key), 500);
}

/* ──────────────────────────────────────────────────────────────
   11  POSITION CHAT (Ask Claude about any position)
────────────────────────────────────────────────────────────── */
let posChatHistory = [];

function togglePositionChat() {
  const panel = document.getElementById('pos-chat-panel');
  if (!panel) return;
  panel.classList.toggle('open');
  if (panel.classList.contains('open')) document.getElementById('pos-chat-inp')?.focus();
}

async function sendPositionChat() {
  const inp = document.getElementById('pos-chat-inp');
  const msg = inp?.value?.trim();
  if (!msg) return;
  if (inp) inp.value = '';

  const key = typeof getApiKey==='function' ? getApiKey() : '';
  if (!key) { addPosChatMsg('system','⚠️ Set your Claude API key first (🤖 Coach button).'); return; }

  addPosChatMsg('user', msg);
  posChatHistory.push({role:'user', content:msg});

  const fen = typeof boardToFEN==='function' ? boardToFEN() : 'unknown';
  const matBal = typeof getBoardMaterialSummary==='function' ? getBoardMaterialSummary() : '';

  addPosChatMsg('assistant','⏳ Thinking…');
  const thinkEl = document.getElementById('pos-chat-msgs')?.lastChild;

  try {
    const msgs = [{role:'user', content:`Current chess position (FEN): ${fen}. Material: ${matBal}.\n\nQuestion: ${msg}`}];
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST',
      headers:{'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
      body:JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:1000,
        system:'You are a chess coach. Answer questions about chess positions clearly and helpfully. Reference specific squares and pieces. Keep answers under 4 sentences unless the question needs more detail.',
        messages:msgs
      })
    });
    const data = await resp.json();
    const text = data?.content?.[0]?.text||'Sorry, could not analyze this position.';
    if (thinkEl) thinkEl.remove();
    addPosChatMsg('assistant', text);
    posChatHistory.push({role:'assistant', content:text});
    if (posChatHistory.length > 20) posChatHistory = posChatHistory.slice(-16);
  } catch(e) { if (thinkEl) thinkEl.remove(); addPosChatMsg('system','❌ Error connecting to Claude.'); }
}

function addPosChatMsg(role, text) {
  const el = document.getElementById('pos-chat-msgs');
  if (!el) return;
  const div = document.createElement('div');
  div.className = 'pos-msg pos-msg-'+role;
  div.textContent = text;
  el.appendChild(div);
  el.scrollTop = el.scrollHeight;
}

function clearPositionChat() { posChatHistory=[]; const el=document.getElementById('pos-chat-msgs'); if(el) el.innerHTML=''; }

/* ──────────────────────────────────────────────────────────────
   12  OPENING STATS
────────────────────────────────────────────────────────────── */
function openOpeningStats() {
  const games = JSON.parse(localStorage.getItem('cm_game_history')||'[]');
  const modal = document.getElementById('opening-stats-modal');
  const el    = document.getElementById('opening-stats-content');
  if (!modal || !el) return;

  if (!games.length) { el.innerHTML='<p style="color:var(--text-dim);text-align:center;padding:1rem">Play more games to see opening stats!</p>'; modal.classList.add('show'); return; }

  const map = {};
  games.forEach(g => {
    const key = (g.moves||[]).slice(0,4).join(' ') || 'No moves';
    if (!map[key]) map[key] = {games:0,wins:0};
    map[key].games++;
    if (g.result==='1-0') map[key].wins++;
  });

  const entries = Object.entries(map).sort((a,b)=>b[1].games-a[1].games).slice(0,8);
  el.innerHTML = `<table class="opening-table">
    <thead><tr><th>Opening Moves</th><th>Games</th><th>Win%</th><th>Bar</th></tr></thead>
    <tbody>${entries.map(([moves,{games:g,wins:w}]) => {
      const pct = Math.round(w/g*100);
      const col = pct>=60?'#6dcc8a':pct>=40?'#ffd700':'#e06060';
      return `<tr><td class="op-moves-td">${moves}</td><td>${g}</td><td style="color:${col}">${pct}%</td>
        <td><div style="background:${col};width:${pct}%;height:6px;border-radius:3px;"></div></td></tr>`;
    }).join('')}</tbody></table>
    <p style="font-size:.72rem;color:var(--text-dim);margin-top:.7rem;text-align:center">Based on your last ${games.length} games</p>`;

  modal.classList.add('show');
}
function closeOpeningStats() { document.getElementById('opening-stats-modal')?.classList.remove('show'); }

/* ──────────────────────────────────────────────────────────────
   13  3D BOARD MODE  (CSS perspective)
────────────────────────────────────────────────────────────── */
let board3D = localStorage.getItem('cm_3d') === 'on';

function toggle3DBoard() {
  board3D = !board3D;
  localStorage.setItem('cm_3d', board3D?'on':'off');
  apply3DBoard();
  const btn = document.getElementById('btn-3d');
  if (btn) { btn.classList.toggle('active',board3D); btn.textContent = board3D ? '🎲 3D ON' : '🎲 3D'; }
}

function apply3DBoard() {
  const wrap = document.getElementById('board-fs-wrap');
  if (!wrap) return;
  if (board3D) {
    wrap.style.cssText += ';perspective:700px;perspective-origin:50% 20%;';
    const frame = wrap.querySelector('.board-frame');
    if (frame) frame.style.cssText += ';transform:rotateX(22deg) scale(1.04);transition:transform .5s ease;';
  } else {
    const frame = wrap?.querySelector('.board-frame');
    if (frame) frame.style.transform = '';
    wrap.style.perspective = '';
  }
  setTimeout(() => { if(typeof syncCanvasSize==='function') syncCanvasSize(); }, 550);
}

/* ──────────────────────────────────────────────────────────────
   14  CUSTOM PIECE COLORS
────────────────────────────────────────────────────────────── */
function applyPieceColors(white, black) {
  document.documentElement.style.setProperty('--white-piece', white || '#f5f0e8');
  document.documentElement.style.setProperty('--black-piece', black || '#1a1208');
  localStorage.setItem('cm_pc_white', white);
  localStorage.setItem('cm_pc_black', black);
}

function resetPieceColors() {
  applyPieceColors('#f5f0e8', '#1a1208');
  const wi = document.getElementById('pc-white'); if(wi) wi.value='#f5f0e8';
  const bi = document.getElementById('pc-black'); if(bi) bi.value='#1a1208';
}

function openColorPicker() { document.getElementById('color-picker-modal')?.classList.add('show'); }
function closeColorPicker() { document.getElementById('color-picker-modal')?.classList.remove('show'); }

/* ──────────────────────────────────────────────────────────────
   15  MINI TOURNAMENT (local — vs AI levels)
────────────────────────────────────────────────────────────── */
let tourney = { active:false, round:0, results:[], rounds:3, playerScore:0, aiScore:0 };

function openTournament() { document.getElementById('tourney-modal')?.classList.add('show'); }
function closeTournament() { document.getElementById('tourney-modal')?.classList.remove('show'); if(tourney.active) stopTourney(); }

function startTourney(rounds) {
  tourney = { active:true, round:1, rounds, results:[], playerScore:0, aiScore:0 };
  closeTournament();
  mode = 'ai';
  const diffForRound = [3,5,7,8,10];
  if(typeof setDifficulty==='function') setDifficulty(diffForRound[0]);
  if(typeof newGame==='function') newGame();
  showTourneyBadge();
  setStatus(`🏆 Tournament Round 1/${rounds} — Difficulty: Novice`);
}

function stopTourney() { tourney.active=false; hideTourneyBadge(); }

function tourneyRecordResult(result) {
  if (!tourney.active) return;
  const diffs = [3,5,7,8,10];
  tourney.results.push({ round:tourney.round, result });
  if (result==='w')    tourney.playerScore += 1;
  else if (result==='draw') { tourney.playerScore += 0.5; tourney.aiScore += 0.5; }
  else                 tourney.aiScore += 1;
  updateTourneyBadge();

  if (tourney.round >= tourney.rounds) {
    setTimeout(showTourneyResult, 1500);
  } else {
    tourney.round++;
    const diff = diffs[Math.min(tourney.round-1, diffs.length-1)];
    setTimeout(() => {
      if(typeof setDifficulty==='function') setDifficulty(diff);
      if(typeof newGame==='function') newGame();
      setStatus(`🏆 Tournament Round ${tourney.round}/${tourney.rounds} — Difficulty: ${diff}`);
    }, 2000);
  }
}

function showTourneyBadge() {
  const b = document.getElementById('tourney-badge');
  if (b) { b.style.display='flex'; updateTourneyBadge(); }
}
function hideTourneyBadge() { const b=document.getElementById('tourney-badge'); if(b) b.style.display='none'; }
function updateTourneyBadge() {
  const el = document.getElementById('tourney-badge-txt');
  if (el) el.textContent = `🏆 R${tourney.round}/${tourney.rounds} · You ${tourney.playerScore} — AI ${tourney.aiScore}`;
}

function showTourneyResult() {
  tourney.active = false; hideTourneyBadge();
  const ps=tourney.playerScore, as=tourney.aiScore;
  const won = ps > as, draw = ps===as;
  const trophy = won ? '🏆' : draw ? '🤝' : '📚';
  const msg = won ? 'You won the tournament!' : draw ? 'Tournament draw!' : 'AI wins the tournament!';
  const detail = tourney.results.map((r,i) => `Round ${r.round}: ${r.result==='w'?'✅ Win':r.result==='draw'?'🤝 Draw':'❌ Loss'}`).join('  ·  ');
  alert(`${trophy} ${msg}\n\nScore: You ${ps} — AI ${as}\n\n${detail}`);
}

/* ──────────────────────────────────────────────────────────────
   FEATURE HUB  (main launcher modal)
────────────────────────────────────────────────────────────── */
function openFeatureHub() { document.getElementById('feature-hub')?.classList.add('show'); }
function closeFeatureHub() { document.getElementById('feature-hub')?.classList.remove('show'); }

/* ──────────────────────────────────────────────────────────────
   INJECT ALL NEW UI ELEMENTS
────────────────────────────────────────────────────────────── */
function injectV5UI() {
  /* ─ Feature Hub button (in existing feat-bar) ─ */
  const fb2 = document.getElementById('feat-bar-2');
  if (fb2 && !document.getElementById('hub-btn')) {
    const btn = document.createElement('button');
    btn.id='hub-btn'; btn.className='feat-btn feat-btn-hub';
    btn.textContent='⚡ More'; btn.setAttribute('onclick','openFeatureHub()');
    fb2.appendChild(btn);
  }

  /* ─ Tourney badge (fixed top) ─ */
  if (!document.getElementById('tourney-badge')) {
    const b = document.createElement('div');
    b.id='tourney-badge'; b.className='tourney-badge'; b.style.display='none';
    b.innerHTML=`<span id="tourney-badge-txt">🏆 Tournament</span><button onclick="closeTournament()" style="background:none;border:none;color:inherit;cursor:pointer;font-size:.8rem;padding:0 .2rem">✕</button>`;
    document.body.appendChild(b);
  }

  /* ─ PWA install btn ─ */
  if (!document.getElementById('pwa-install-btn')) {
    const btn = document.createElement('button');
    btn.id='pwa-install-btn'; btn.className='pwa-install-btn'; btn.style.display='none';
    btn.innerHTML='📲 Install App'; btn.onclick=installPWA;
    document.body.appendChild(btn);
  }

  /* ─ Commentary box ─ */
  if (!document.getElementById('commentary-box')) {
    const box = document.createElement('div');
    box.id='commentary-box'; box.className='commentary-box';
    box.style.display='none';
    const analysisEl = document.getElementById('analysis-panel');
    analysisEl?.parentElement.insertBefore(box, analysisEl);
  }

  /* ─ Position Chat Panel ─ */
  if (!document.getElementById('pos-chat-panel')) {
    const panel = document.createElement('div');
    panel.id='pos-chat-panel'; panel.className='pos-chat-panel';
    panel.innerHTML=`
      <div class="pos-chat-head">
        <span>💬 Ask About Position</span>
        <button onclick="clearPositionChat()" style="background:none;border:none;color:var(--text-dim);cursor:pointer;font-size:.8rem;">Clear</button>
        <button onclick="togglePositionChat()" style="background:none;border:none;color:var(--text-dim);cursor:pointer;font-size:.9rem;">✕</button>
      </div>
      <div id="pos-chat-msgs" class="pos-chat-msgs"></div>
      <div class="pos-chat-input-row">
        <input id="pos-chat-inp" type="text" placeholder="Ask Claude about this position…"
          onkeydown="if(event.key==='Enter')sendPositionChat()">
        <button class="btn" onclick="sendPositionChat()" style="padding:.3rem .6rem;font-size:.78rem;">Send</button>
      </div>`;
    document.body.appendChild(panel);
  }

  /* ─ Variant selector in AI difficulty area ─ */
  const diffBar = document.getElementById('diff-bar');
  if (diffBar && !document.getElementById('variant-panel')) {
    const varWrap = document.createElement('div');
    varWrap.className='theme-wrap'; varWrap.style='position:relative;';
    const names={standard:'♟ Standard',chess960:'🎲 960',koth:'👑 KotH','3check':'3️⃣ 3-Check'};
    varWrap.innerHTML=`
      <button class="btn" style="font-size:.72rem;padding:.22rem .5rem;" onclick="toggleVariantPanel()">
        <span id="variant-label">${names[gameVariant]||'♟ Standard'}</span> ▾
      </button>
      <div id="variant-panel" class="theme-panel" style="top:100%;bottom:auto;left:0;min-width:150px;">
        ${Object.entries(names).map(([k,v])=>`<div class="theme-opt var-btn ${gameVariant===k?'active':''}" data-v="${k}" onclick="setVariant('${k}')">${v}</div>`).join('')}
      </div>`;
    diffBar.appendChild(varWrap);
  }

  /* ─ Inject all modals ─ */
  if (!document.getElementById('feature-hub')) {
    document.body.insertAdjacentHTML('beforeend', buildV5Modals());
  }

  /* ─ Apply saved colors ─ */
  const savedW = localStorage.getItem('cm_pc_white');
  const savedB = localStorage.getItem('cm_pc_black');
  if (savedW) applyPieceColors(savedW, savedB);

  /* ─ Apply 3D if saved ─ */
  if (board3D) setTimeout(apply3DBoard, 300);

  /* ─ Commentary box visibility ─ */
  if (commentaryEnabled) {
    const box = document.getElementById('commentary-box');
    if (box) box.style.display='block';
  }
}

function buildV5Modals() {
  return `
  <!-- ═══ FEATURE HUB ═══ -->
  <div class="upgrade-overlay" id="feature-hub">
    <div class="upgrade-box upgrade-box-wide">
      <div class="upgrade-title">⚡ Features</div>
      <div class="upgrade-sub">All advanced features in one place</div>
      <div class="hub-grid">
        <button class="hub-btn" onclick="closeFeatureHub();openTacticsRush()">🏃 Tactics Rush</button>
        <button class="hub-btn" onclick="closeFeatureHub();openFamousGames()">🎬 Famous Games</button>
        <button class="hub-btn" onclick="closeFeatureHub();openEndgameTrainer()">🎯 Endgame Trainer</button>
        <button class="hub-btn" onclick="closeFeatureHub();openStats()">📊 My Stats</button>
        <button class="hub-btn" onclick="closeFeatureHub();openTournament()">🏆 Tournament</button>
        <button class="hub-btn" onclick="closeFeatureHub();showWeeklyBoard()">📅 Weekly Board</button>
        <button class="hub-btn" onclick="closeFeatureHub();openOpeningStats()">📖 Opening Stats</button>
        <button class="hub-btn" onclick="closeFeatureHub();togglePositionChat()">💬 Ask Claude</button>
        <button class="hub-btn" onclick="closeFeatureHub();toggleCommentary()">📻 Commentary</button>
        <button class="hub-btn" onclick="closeFeatureHub();openColorPicker()">🎨 Piece Colors</button>
        <button class="hub-btn" onclick="closeFeatureHub();toggle3DBoard()">🎲 3D Board</button>
        <div class="hub-ambient">
          <div style="font-size:.72rem;color:var(--text-dim);margin-bottom:.35rem;text-align:center;">🎵 Ambient</div>
          <div style="display:flex;gap:.3rem;flex-wrap:wrap;justify-content:center;">
            <button class="amb-btn" data-amb="rain"      onclick="setAmbient('rain')">🌧 Rain</button>
            <button class="amb-btn" data-amb="cafe"      onclick="setAmbient('cafe')">☕ Café</button>
            <button class="amb-btn" data-amb="forest"    onclick="setAmbient('forest')">🌲 Forest</button>
            <button class="amb-btn" data-amb="classical" onclick="setAmbient('classical')">🎹 Classical</button>
          </div>
        </div>
      </div>
      <button class="btn btn-primary" style="width:100%;margin-top:1rem;" onclick="closeFeatureHub()">Close</button>
    </div>
  </div>

  <!-- ═══ TACTICS RUSH ═══ -->
  <div class="upgrade-overlay" id="rush-modal">
    <div class="upgrade-box">
      <div class="upgrade-title">🏃 Tactics Rush</div>
      <div class="upgrade-sub">Solve as many puzzles as you can in 60 seconds!</div>
      <div class="rush-hud">
        <span id="rush-score" class="rush-score">⚡ 0</span>
        <span class="rush-time">⏱ <strong id="rush-timer" style="color:var(--gold);">60s</strong></span>
        <span style="font-size:.72rem;color:var(--text-dim);">Best: ${localStorage.getItem('cm_rush_best')||0}</span>
      </div>
      <div id="rush-puzzle-title" class="rush-puzzle-title"></div>
      <div style="font-size:.76rem;color:var(--text-dim);text-align:center;margin:.3rem 0;">Solve on the main board below ↓</div>
      <div id="rush-result" class="rush-result" style="display:none;"></div>
      <button class="btn" style="width:100%;margin-top:.6rem;" onclick="closeTacticsRush()">✕ Exit Rush</button>
    </div>
  </div>

  <!-- ═══ ENDGAME TRAINER ═══ -->
  <div class="upgrade-overlay" id="endgame-modal">
    <div class="upgrade-box upgrade-box-wide">
      <div class="upgrade-title">🎯 Endgame Trainer</div>
      <div class="upgrade-sub">Master the most important endgame positions</div>
      <div id="endgame-grid" class="endgame-grid"></div>
      <button class="btn" style="width:100%;margin-top:1rem;" onclick="closeEndgameTrainer()">✕ Close</button>
    </div>
  </div>

  <!-- ═══ FAMOUS GAMES ═══ -->
  <div class="upgrade-overlay" id="famous-modal">
    <div class="upgrade-box upgrade-box-wide">
      <div class="upgrade-title">🎬 Famous Games Theater</div>
      <div class="upgrade-sub">Step through history's greatest chess games</div>
      <div id="famous-list" class="famous-list"></div>
      <button class="btn" style="width:100%;margin-top:1rem;" onclick="closeFamousGames()">✕ Close</button>
    </div>
  </div>

  <!-- Famous game player (inline) -->
  <div class="famous-player" id="famous-player">
    <div class="famous-info" id="famous-info"></div>
    <div class="famous-controls">
      <button class="replay-btn" onclick="famousPrev()">◀ Prev</button>
      <span id="famous-nav" style="font-size:.76rem;color:var(--text-dim);">1/5</span>
      <button class="replay-btn" onclick="famousNext()">Next ▶</button>
      <button class="replay-btn" onclick="askClaudeAboutFamousGame()" title="Ask Claude">🤖 Ask</button>
      <button class="replay-btn" style="color:#e06060;" onclick="closeFamousPlayer()">✕</button>
    </div>
    <div id="famous-coach" class="famous-coach-text"></div>
  </div>

  <!-- ═══ STATS DASHBOARD ═══ -->
  <div class="upgrade-overlay" id="stats-modal">
    <div class="upgrade-box upgrade-box-wide">
      <div class="upgrade-title">📊 My Stats</div>
      <div id="stats-content"></div>
      <button class="btn btn-primary" style="width:100%;margin-top:1rem;" onclick="closeStats()">Close</button>
    </div>
  </div>

  <!-- ═══ WEEKLY BOARD ═══ -->
  <div class="upgrade-overlay" id="weekly-modal">
    <div class="upgrade-box">
      <div class="upgrade-title">📅 This Week's Board</div>
      <div class="upgrade-sub">Resets every Monday</div>
      <table class="lb-table" style="width:100%;">
        <thead><tr><th>#</th><th>Player</th><th>ELO</th><th>Record</th></tr></thead>
        <tbody id="weekly-tbody"></tbody>
      </table>
      <button class="btn btn-primary" style="width:100%;margin-top:1rem;" onclick="closeWeeklyBoard()">Close</button>
    </div>
  </div>

  <!-- ═══ OPENING STATS ═══ -->
  <div class="upgrade-overlay" id="opening-stats-modal">
    <div class="upgrade-box upgrade-box-wide">
      <div class="upgrade-title">📖 Opening Stats</div>
      <div id="opening-stats-content"></div>
      <button class="btn btn-primary" style="width:100%;margin-top:1rem;" onclick="closeOpeningStats()">Close</button>
    </div>
  </div>

  <!-- ═══ COLOR PICKER ═══ -->
  <div class="upgrade-overlay" id="color-picker-modal">
    <div class="upgrade-box">
      <div class="upgrade-title">🎨 Piece Colors</div>
      <div class="upgrade-sub">Pick your own piece colors</div>
      <div class="color-row">
        <label>♔ White pieces</label>
        <input type="color" id="pc-white" value="${localStorage.getItem('cm_pc_white')||'#f5f0e8'}"
          oninput="applyPieceColors(this.value,document.getElementById('pc-black').value)">
      </div>
      <div class="color-row" style="margin-top:.6rem;">
        <label>♚ Black pieces</label>
        <input type="color" id="pc-black" value="${localStorage.getItem('cm_pc_black')||'#1a1208'}"
          oninput="applyPieceColors(document.getElementById('pc-white').value,this.value)">
      </div>
      <div class="color-presets">
        <button class="fen-ex-btn" onclick="applyPieceColors('#f5f0e8','#1a1208');document.getElementById('pc-white').value='#f5f0e8';document.getElementById('pc-black').value='#1a1208'">Classic</button>
        <button class="fen-ex-btn" onclick="applyPieceColors('#ffd700','#800000');document.getElementById('pc-white').value='#ffd700';document.getElementById('pc-black').value='#800000'">Gold/Red</button>
        <button class="fen-ex-btn" onclick="applyPieceColors('#00ffcc','#003344');document.getElementById('pc-white').value='#00ffcc';document.getElementById('pc-black').value='#003344'">Neon</button>
        <button class="fen-ex-btn" onclick="applyPieceColors('#ffffff','#222222');document.getElementById('pc-white').value='#ffffff';document.getElementById('pc-black').value='#222222'">B&W</button>
      </div>
      <div style="display:flex;gap:.5rem;margin-top:1rem;">
        <button class="btn"          style="flex:1;" onclick="resetPieceColors()">↺ Reset</button>
        <button class="btn btn-primary" style="flex:1;" onclick="closeColorPicker()">✓ Done</button>
      </div>
    </div>
  </div>

  <!-- ═══ TOURNAMENT ═══ -->
  <div class="upgrade-overlay" id="tourney-modal">
    <div class="upgrade-box">
      <div class="upgrade-title">🏆 Mini Tournament</div>
      <div class="upgrade-sub">Play rounds of increasing difficulty vs AI</div>
      <div class="tourney-options">
        <div class="tourney-opt" onclick="startTourney(3)">
          <div class="t-icon">⚔️</div><div class="t-name">Quick Match</div>
          <div class="t-desc">3 rounds · Difficulties 3→5→7</div>
        </div>
        <div class="tourney-opt" onclick="startTourney(5)">
          <div class="t-icon">🏅</div><div class="t-name">Standard</div>
          <div class="t-desc">5 rounds · Difficulties 3→5→7→8→10</div>
        </div>
        <div class="tourney-opt" onclick="startTourney(7)">
          <div class="t-icon">👑</div><div class="t-name">Championship</div>
          <div class="t-desc">7 rounds · Grandmaster final</div>
        </div>
      </div>
      <button class="btn" style="width:100%;margin-top:1rem;" onclick="closeTournament()">Cancel</button>
    </div>
  </div>`;
}

/* ──────────────────────────────────────────────────────────────
   HOOKS INTO EXISTING ENGINE
────────────────────────────────────────────────────────────── */
function installV5Hooks() {
  /* newGame hook — variants */
  const _ng = newGame;
  newGame = function() {
    checkCounts = {w:0,b:0};
    _ng();
    if (gameVariant==='chess960') {
      const back = chess960BackRank();
      for (let c=0;c<8;c++) {
        if (back[c]) { board[7][c]={t:back[c],cl:'w'}; board[0][c]={t:back[c],cl:'b'}; }
        else { board[7][c]=null; board[0][c]=null; }
      }
      board[6] = Array(8).fill(null).map(()=>({t:'P',cl:'w'}));
      board[1] = Array(8).fill(null).map(()=>({t:'P',cl:'b'}));
      render(); setStatus('🎲 Chess960 — Random position!');
    }
  };

  /* checkState hook — KotH, 3-Check, particles, tourney, weekly */
  const _cs = checkState;
  checkState = function() {
    _cs();
    /* King of the Hill win */
    if (!over && gameVariant==='koth') {
      ['w','b'].forEach(cl => {
        if (isKingOnHill(cl)) {
          over=true; stopClock?.();
          const winner=cl==='w'?'White':'Black';
          document.getElementById('ov-title').textContent='👑 King of the Hill!';
          document.getElementById('ov-msg').textContent=winner+' reached the center — wins!';
          setStatus('👑 '+winner+' wins by King of the Hill!');
          setTimeout(()=>document.getElementById('overlay')?.classList.add('show'),500);
          playSound?.('checkmate');
        }
      });
    }
    /* Checkmate particle explosion */
    if (over && typeof inCheck==='function' && inCheck(turn,board) && !anyLegal?.(turn)) {
      setTimeout(triggerCheckmateExplosion, 400);
      /* Tourney result */
      if (tourney.active) {
        const result = turn==='b' ? 'w' : 'l';
        setTimeout(()=>tourneyRecordResult(result==='w'?'w':'l'), 800);
      }
      /* Weekly board */
      if (typeof getElo==='function') updateWeeklyBoard(getElo(), turn==='b'?'w':'l');
    }
    /* Stalemate/draw tourney */
    if (over && !(typeof inCheck==='function' && inCheck(turn,board))) {
      if (tourney.active) setTimeout(()=>tourneyRecordResult('draw'), 800);
      if (typeof getElo==='function') updateWeeklyBoard(getElo(),'draw');
    }
  };

  /* execMove hook — 3-Check counter + Tactics Rush + Commentary */
  const _em = execMove;
  execMove = function(fr,fc,tr,tc,promo,fromPeer=false) {
    /* Tactics Rush interception */
    if (rush.active && window._rushPuzzle) {
      if (!board[fr]?.[fc]) return;
    }
    _em(fr,fc,tr,tc,promo,fromPeer);

    /* 3-Check: count checks */
    if (gameVariant==='3check' && !over) {
      ['w','b'].forEach(cl=>{
        if(typeof inCheck==='function'&&inCheck(cl,board)){
          const enemy=cl==='w'?'b':'w'; checkCounts[enemy]++;
          if(checkCounts[enemy]>=3){
            over=true; stopClock?.();
            const winner=cl==='w'?'Black':'White';
            document.getElementById('ov-title').textContent='3️⃣ Three Checks!';
            document.getElementById('ov-msg').textContent=winner+' gave 3 checks — wins!';
            setTimeout(()=>document.getElementById('overlay')?.classList.add('show'),400);
            playSound?.('checkmate');
          }
        }
      });
      /* Update check display */
      setStatus?.((turn==='w'?'White':'Black')+`'s turn | Checks given: W${checkCounts.b} B${checkCounts.w}`);
    }

    /* Commentary */
    if (hist?.length > 0) {
      const lastH = hist[hist.length-1];
      if (lastH) addCommentary(lastH.note, lastH.p?.cl==='w'?'White':'Black');
    }
  };

  /* handleClick hook — Tactics Rush */
  const _hc = handleClick;
  handleClick = function(r,c) {
    if (rush.active && window._rushPuzzle) { handleRushClick(r,c); return; }
    _hc(r,c);
  };
}

/* ──────────────────────────────────────────────────────────────
   INIT
────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    injectV5UI();
    installV5Hooks();
    console.log('[ChessArena] Feature Pack v5.0 loaded ✓');
  }, 400);
});
