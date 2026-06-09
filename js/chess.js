/* ═══════════════════════════════════════════════════════════════
   ChessMaster — PRO EDITION v2.0
   NEW: Stockfish AI · Difficulty 1-10 · Drag & Drop
        Move Animation · 60+ Puzzles · Post-Game Analysis
        Opening Explorer · PWA · Enhanced Engine
   All original features preserved + upgraded
═══════════════════════════════════════════════════════════════ */

/* ── I18N (20 Languages — unchanged) ── */
const LANGS = {
  en: { name:'English',flag:'🇬🇧',dir:'ltr',twoPlayers:'2 Players',vsAI:'vs AI',newGame:'New Game',undo:'↩ Undo',flip:'⟳ Flip',fullscreen:'⛶ Fullscreen',exitFS:'✕ Exit',whiteTurn:"White's turn",blackTurn:"Black's turn",whiteCheck:'White is in check!',blackCheck:'Black is in check!',checkmate:'Checkmate!',stalemate:'Stalemate — Draw!',winsGame:'wins! 🏆',drawMsg:'The game is a draw.',playAgain:'Play Again',moveHistory:'Move History',choosePromo:'Choose Promotion',white:'White',black:'Black',advertisement:'Advertisement',nav:{play:'Play',how:'How to Play',rules:'Rules',about:'About',contact:'Contact'}},
  hi: { name:'हिन्दी',flag:'🇮🇳',dir:'ltr',twoPlayers:'2 खिलाड़ी',vsAI:'AI से खेलें',newGame:'नई गेम',undo:'↩ पूर्ववत',flip:'⟳ पलटें',fullscreen:'⛶ पूर्ण स्क्रीन',exitFS:'✕ बाहर',whiteTurn:'सफेद की बारी है',blackTurn:'काले की बारी है',whiteCheck:'सफेद शह में है!',blackCheck:'काला शह में है!',checkmate:'शहमात!',stalemate:'स्टेलमेट — ड्रॉ!',winsGame:'जीत गया! 🏆',drawMsg:'खेल बराबर है।',playAgain:'फिर खेलें',moveHistory:'चाल इतिहास',choosePromo:'प्रमोशन चुनें',white:'सफेद',black:'काला',advertisement:'विज्ञापन',nav:{play:'खेलें',how:'कैसे खेलें',rules:'नियम',about:'के बारे में',contact:'संपर्क'}},
  es: { name:'Español',flag:'🇪🇸',dir:'ltr',twoPlayers:'2 Jugadores',vsAI:'vs IA',newGame:'Nueva Partida',undo:'↩ Deshacer',flip:'⟳ Voltear',fullscreen:'⛶ Pantalla Completa',exitFS:'✕ Salir',whiteTurn:'Turno de las Blancas',blackTurn:'Turno de las Negras',whiteCheck:'¡Blancas en jaque!',blackCheck:'¡Negras en jaque!',checkmate:'¡Jaque Mate!',stalemate:'¡Tablas!',winsGame:'¡gana! 🏆',drawMsg:'La partida es tablas.',playAgain:'Jugar de Nuevo',moveHistory:'Historial',choosePromo:'Elegir Promoción',white:'Blancas',black:'Negras',advertisement:'Publicidad',nav:{play:'Jugar',how:'Cómo Jugar',rules:'Reglas',about:'Acerca de',contact:'Contacto'}},
  fr: { name:'Français',flag:'🇫🇷',dir:'ltr',twoPlayers:'2 Joueurs',vsAI:'vs IA',newGame:'Nouvelle Partie',undo:'↩ Annuler',flip:'⟳ Retourner',fullscreen:'⛶ Plein Écran',exitFS:'✕ Quitter',whiteTurn:'Au tour des Blancs',blackTurn:'Au tour des Noirs',whiteCheck:'Les Blancs en échec !',blackCheck:'Les Noirs en échec !',checkmate:'Échec et mat !',stalemate:'Pat — Nulle !',winsGame:'gagne ! 🏆',drawMsg:'La partie est nulle.',playAgain:'Rejouer',moveHistory:'Historique',choosePromo:'Choisir la Promotion',white:'Blancs',black:'Noirs',advertisement:'Publicité',nav:{play:'Jouer',how:'Comment Jouer',rules:'Règles',about:'À Propos',contact:'Contact'}},
  de: { name:'Deutsch',flag:'🇩🇪',dir:'ltr',twoPlayers:'2 Spieler',vsAI:'vs KI',newGame:'Neues Spiel',undo:'↩ Rückgängig',flip:'⟳ Drehen',fullscreen:'⛶ Vollbild',exitFS:'✕ Beenden',whiteTurn:'Weiß ist am Zug',blackTurn:'Schwarz ist am Zug',whiteCheck:'Weiß im Schach!',blackCheck:'Schwarz im Schach!',checkmate:'Schachmatt!',stalemate:'Patt!',winsGame:'gewinnt! 🏆',drawMsg:'Das Spiel endet remis.',playAgain:'Nochmal',moveHistory:'Zugverlauf',choosePromo:'Umwandlung',white:'Weiß',black:'Schwarz',advertisement:'Werbung',nav:{play:'Spielen',how:'Anleitung',rules:'Regeln',about:'Über uns',contact:'Kontakt'}},
  pt: { name:'Português',flag:'🇧🇷',dir:'ltr',twoPlayers:'2 Jogadores',vsAI:'vs IA',newGame:'Nova Partida',undo:'↩ Desfazer',flip:'⟳ Virar',fullscreen:'⛶ Tela Cheia',exitFS:'✕ Sair',whiteTurn:'Vez das Brancas',blackTurn:'Vez das Pretas',whiteCheck:'Brancas em xeque!',blackCheck:'Pretas em xeque!',checkmate:'Xeque-Mate!',stalemate:'Afogamento!',winsGame:'vence! 🏆',drawMsg:'Partida empatada.',playAgain:'Jogar Novamente',moveHistory:'Histórico',choosePromo:'Escolher Promoção',white:'Brancas',black:'Pretas',advertisement:'Publicidade',nav:{play:'Jogar',how:'Como Jogar',rules:'Regras',about:'Sobre',contact:'Contato'}},
  ru: { name:'Русский',flag:'🇷🇺',dir:'ltr',twoPlayers:'2 Игрока',vsAI:'vs ИИ',newGame:'Новая игра',undo:'↩ Отмена',flip:'⟳ Перевернуть',fullscreen:'⛶ На весь экран',exitFS:'✕ Выйти',whiteTurn:'Ход белых',blackTurn:'Ход чёрных',whiteCheck:'Белый под шахом!',blackCheck:'Чёрный под шахом!',checkmate:'Шах и мат!',stalemate:'Пат!',winsGame:'побеждает! 🏆',drawMsg:'Ничья.',playAgain:'Сыграть снова',moveHistory:'История ходов',choosePromo:'Выбрать фигуру',white:'Белые',black:'Чёрные',advertisement:'Реклама',nav:{play:'Играть',how:'Как играть',rules:'Правила',about:'О нас',contact:'Контакт'}},
  ar: { name:'العربية',flag:'🇸🇦',dir:'rtl',twoPlayers:'لاعبان',vsAI:'ضد الذكاء الاصطناعي',newGame:'لعبة جديدة',undo:'↩ تراجع',flip:'⟳ قلب',fullscreen:'⛶ ملء الشاشة',exitFS:'✕ خروج',whiteTurn:'دور الأبيض',blackTurn:'دور الأسود',whiteCheck:'الأبيض في كش!',blackCheck:'الأسود في كش!',checkmate:'كش ملك!',stalemate:'تعادل!',winsGame:'يفوز! 🏆',drawMsg:'انتهت اللعبة بالتعادل.',playAgain:'العب مجدداً',moveHistory:'سجل الحركات',choosePromo:'اختر قطعة الترقية',white:'الأبيض',black:'الأسود',advertisement:'إعلان',nav:{play:'العب',how:'كيف تلعب',rules:'القواعد',about:'عن الموقع',contact:'تواصل'}},
  zh: { name:'中文简体',flag:'🇨🇳',dir:'ltr',twoPlayers:'双人对战',vsAI:'对战AI',newGame:'新游戏',undo:'↩ 悔棋',flip:'⟳ 翻转',fullscreen:'⛶ 全屏',exitFS:'✕ 退出',whiteTurn:'白方行棋',blackTurn:'黑方行棋',whiteCheck:'白方将军！',blackCheck:'黑方将军！',checkmate:'将死！',stalemate:'逼和！',winsGame:'获胜！🏆',drawMsg:'本局为平局。',playAgain:'再来一局',moveHistory:'棋谱',choosePromo:'选择升变',white:'白方',black:'黑方',advertisement:'广告',nav:{play:'下棋',how:'如何下棋',rules:'规则',about:'关于',contact:'联系'}},
  ja: { name:'日本語',flag:'🇯🇵',dir:'ltr',twoPlayers:'2人対戦',vsAI:'AI対戦',newGame:'新しいゲーム',undo:'↩ 待った',flip:'⟳ 反転',fullscreen:'⛶ 全画面',exitFS:'✕ 終了',whiteTurn:'白番の手番',blackTurn:'黒番の手番',whiteCheck:'白がチェック！',blackCheck:'黒がチェック！',checkmate:'チェックメイト！',stalemate:'ステールメイト！',winsGame:'勝利！🏆',drawMsg:'引き分け。',playAgain:'もう一度',moveHistory:'棋譜',choosePromo:'プロモーション',white:'白',black:'黒',advertisement:'広告',nav:{play:'対戦',how:'遊び方',rules:'ルール',about:'概要',contact:'お問い合わせ'}},
  ko: { name:'한국어',flag:'🇰🇷',dir:'ltr',twoPlayers:'2인 대전',vsAI:'AI 대전',newGame:'새 게임',undo:'↩ 무르기',flip:'⟳ 뒤집기',fullscreen:'⛶ 전체화면',exitFS:'✕ 나가기',whiteTurn:'백의 차례',blackTurn:'흑의 차례',whiteCheck:'백 체크!',blackCheck:'흑 체크!',checkmate:'체크메이트!',stalemate:'스테일메이트!',winsGame:'승리! 🏆',drawMsg:'무승부.',playAgain:'다시 하기',moveHistory:'기보',choosePromo:'프로모션',white:'백',black:'흑',advertisement:'광고',nav:{play:'게임',how:'게임 방법',rules:'규칙',about:'소개',contact:'문의'}},
  it: { name:'Italiano',flag:'🇮🇹',dir:'ltr',twoPlayers:'2 Giocatori',vsAI:'vs IA',newGame:'Nuova Partita',undo:'↩ Annulla',flip:'⟳ Ruota',fullscreen:'⛶ Schermo Intero',exitFS:'✕ Esci',whiteTurn:'Turno del Bianco',blackTurn:'Turno del Nero',whiteCheck:'Il Bianco in scacco!',blackCheck:'Il Nero in scacco!',checkmate:'Scacco Matto!',stalemate:'Stallo!',winsGame:'vince! 🏆',drawMsg:'Partita patta.',playAgain:'Gioca Ancora',moveHistory:'Cronologia',choosePromo:'Promozione',white:'Bianco',black:'Nero',advertisement:'Pubblicità',nav:{play:'Gioca',how:'Come Giocare',rules:'Regole',about:'Chi Siamo',contact:'Contatti'}},
  tr: { name:'Türkçe',flag:'🇹🇷',dir:'ltr',twoPlayers:'2 Oyuncu',vsAI:'AI Karşı',newGame:'Yeni Oyun',undo:'↩ Geri Al',flip:'⟳ Çevir',fullscreen:'⛶ Tam Ekran',exitFS:'✕ Çık',whiteTurn:'Beyazın sırası',blackTurn:'Siyahın sırası',whiteCheck:'Beyaz şahta!',blackCheck:'Siyah şahta!',checkmate:'Şah Mat!',stalemate:'Pat!',winsGame:'kazandı! 🏆',drawMsg:'Beraberlik.',playAgain:'Tekrar Oyna',moveHistory:'Hamle Geçmişi',choosePromo:'Taş Seç',white:'Beyaz',black:'Siyah',advertisement:'Reklam',nav:{play:'Oyna',how:'Nasıl Oynanır',rules:'Kurallar',about:'Hakkında',contact:'İletişim'}},
  nl: { name:'Nederlands',flag:'🇳🇱',dir:'ltr',twoPlayers:'2 Spelers',vsAI:'vs AI',newGame:'Nieuw Spel',undo:'↩ Ongedaan',flip:'⟳ Draaien',fullscreen:'⛶ Volledig',exitFS:'✕ Verlaten',whiteTurn:'Wit aan zet',blackTurn:'Zwart aan zet',whiteCheck:'Wit in schaak!',blackCheck:'Zwart in schaak!',checkmate:'Schaakmat!',stalemate:'Pat!',winsGame:'wint! 🏆',drawMsg:'Remise.',playAgain:'Opnieuw',moveHistory:'Zetten',choosePromo:'Promotie',white:'Wit',black:'Zwart',advertisement:'Advertentie',nav:{play:'Spelen',how:'Hoe',rules:'Regels',about:'Over',contact:'Contact'}},
  pl: { name:'Polski',flag:'🇵🇱',dir:'ltr',twoPlayers:'2 Graczy',vsAI:'vs AI',newGame:'Nowa Gra',undo:'↩ Cofnij',flip:'⟳ Obróć',fullscreen:'⛶ Pełny Ekran',exitFS:'✕ Wyjdź',whiteTurn:'Ruch białych',blackTurn:'Ruch czarnych',whiteCheck:'Białe w szachu!',blackCheck:'Czarne w szachu!',checkmate:'Szach i mat!',stalemate:'Pat!',winsGame:'wygrywa! 🏆',drawMsg:'Remis.',playAgain:'Zagraj Ponownie',moveHistory:'Historia',choosePromo:'Promocja',white:'Białe',black:'Czarne',advertisement:'Reklama',nav:{play:'Graj',how:'Jak Grać',rules:'Zasady',about:'O Nas',contact:'Kontakt'}},
  bn: { name:'বাংলা',flag:'🇧🇩',dir:'ltr',twoPlayers:'২ খেলোয়াড়',vsAI:'AI বিরুদ্ধে',newGame:'নতুন খেলা',undo:'↩ পূর্বাবস্থা',flip:'⟳ উল্টান',fullscreen:'⛶ পূর্ণ স্ক্রিন',exitFS:'✕ বাহির',whiteTurn:'সাদার পালা',blackTurn:'কালোর পালা',whiteCheck:'সাদা শহ!',blackCheck:'কালো শহ!',checkmate:'কিস্তিমাত!',stalemate:'ড্র!',winsGame:'জিতেছে! 🏆',drawMsg:'ড্র হয়েছে।',playAgain:'আবার খেলুন',moveHistory:'ইতিহাস',choosePromo:'প্রমোশন',white:'সাদা',black:'কালো',advertisement:'বিজ্ঞাপন',nav:{play:'খেলুন',how:'কীভাবে',rules:'নিয়ম',about:'সম্পর্কে',contact:'যোগাযোগ'}},
  ur: { name:'اردو',flag:'🇵🇰',dir:'rtl',twoPlayers:'دو کھلاڑی',vsAI:'AI خلاف',newGame:'نئی گیم',undo:'↩ واپس',flip:'⟳ پلٹیں',fullscreen:'⛶ مکمل',exitFS:'✕ باہر',whiteTurn:'سفید کی باری',blackTurn:'کالے کی باری',whiteCheck:'سفید چیک!',blackCheck:'کالا چیک!',checkmate:'شہ مات!',stalemate:'برابری!',winsGame:'جیت! 🏆',drawMsg:'برابر۔',playAgain:'دوبارہ',moveHistory:'تاریخ',choosePromo:'پروموشن',white:'سفید',black:'کالا',advertisement:'اشتہار',nav:{play:'کھیلیں',how:'کیسے',rules:'قواعد',about:'بارے میں',contact:'رابطہ'}},
  vi: { name:'Tiếng Việt',flag:'🇻🇳',dir:'ltr',twoPlayers:'2 Người chơi',vsAI:'vs AI',newGame:'Ván mới',undo:'↩ Hoàn tác',flip:'⟳ Lật bàn',fullscreen:'⛶ Toàn màn hình',exitFS:'✕ Thoát',whiteTurn:'Đến lượt Trắng',blackTurn:'Đến lượt Đen',whiteCheck:'Trắng bị chiếu!',blackCheck:'Đen bị chiếu!',checkmate:'Chiếu hết!',stalemate:'Hòa cờ!',winsGame:'thắng! 🏆',drawMsg:'Ván đấu hòa.',playAgain:'Chơi lại',moveHistory:'Lịch sử',choosePromo:'Phong cấp',white:'Trắng',black:'Đen',advertisement:'Quảng cáo',nav:{play:'Chơi',how:'Cách chơi',rules:'Luật',about:'Giới thiệu',contact:'Liên hệ'}},
  id: { name:'Bahasa Indonesia',flag:'🇮🇩',dir:'ltr',twoPlayers:'2 Pemain',vsAI:'vs AI',newGame:'Permainan Baru',undo:'↩ Batalkan',flip:'⟳ Balik',fullscreen:'⛶ Layar Penuh',exitFS:'✕ Keluar',whiteTurn:'Giliran Putih',blackTurn:'Giliran Hitam',whiteCheck:'Putih dikepung!',blackCheck:'Hitam dikepung!',checkmate:'Skakmat!',stalemate:'Seri!',winsGame:'menang! 🏆',drawMsg:'Permainan seri.',playAgain:'Main Lagi',moveHistory:'Riwayat',choosePromo:'Promosi',white:'Putih',black:'Hitam',advertisement:'Iklan',nav:{play:'Main',how:'Cara',rules:'Aturan',about:'Tentang',contact:'Kontak'}},
  sw: { name:'Kiswahili',flag:'🇰🇪',dir:'ltr',twoPlayers:'Wachezaji 2',vsAI:'vs AI',newGame:'Mchezo Mpya',undo:'↩ Rudisha',flip:'⟳ Pindua',fullscreen:'⛶ Skrini Nzima',exitFS:'✕ Toka',whiteTurn:'Zamu ya Nyeupe',blackTurn:'Zamu ya Nyeusi',whiteCheck:'Nyeupe hatarini!',blackCheck:'Nyeusi hatarini!',checkmate:'Cheki Mati!',stalemate:'Usawa!',winsGame:'ameshinda! 🏆',drawMsg:'Mchezo umefungana.',playAgain:'Cheza Tena',moveHistory:'Historia',choosePromo:'Chagua Kipande',white:'Nyeupe',black:'Nyeusi',advertisement:'Tangazo',nav:{play:'Cheza',how:'Jinsi',rules:'Sheria',about:'Kuhusu',contact:'Wasiliana'}}
};

let currentLang='en';
function t(key){const keys=key.split('.');let v=LANGS[currentLang];for(const k of keys)v=v?.[k];return v??(LANGS.en[keys[0]]??key);}

/* ── THEME ── */
let currentTheme=localStorage.getItem('cm_theme')||'dark';
function applyTheme(theme){currentTheme=theme;document.documentElement.setAttribute('data-theme',theme);localStorage.setItem('cm_theme',theme);const btn=document.getElementById('theme-btn');if(btn)btn.textContent=theme==='dark'?'☀️':'🌙';}
function toggleTheme(){applyTheme(currentTheme==='dark'?'light':'dark');}

/* ── LANGUAGE ── */
function initLang(){const s=localStorage.getItem('cm_lang');if(s&&LANGS[s])currentLang=s;}
function setLang(code){if(!LANGS[code])return;currentLang=code;localStorage.setItem('cm_lang',code);document.documentElement.setAttribute('lang',code);document.documentElement.setAttribute('dir',LANGS[code].dir);closeLangDropdown();updateLangBtn();applyLangToPage();if(document.getElementById('board'))updateGameUI();}
function updateLangBtn(){const btn=document.getElementById('lang-btn');if(btn)btn.innerHTML=`${LANGS[currentLang].flag} ${LANGS[currentLang].name} <span style="opacity:.5;font-size:.7rem;">▼</span>`;}
function buildLangDropdown(){const dd=document.getElementById('lang-dropdown');if(!dd)return;dd.innerHTML='';for(const[code,L]of Object.entries(LANGS)){const d=document.createElement('div');d.className='lang-option'+(code===currentLang?' active':'');d.innerHTML=`<span class="flag">${L.flag}</span> ${L.name}`;d.onclick=()=>setLang(code);dd.appendChild(d);}}
function toggleLangDropdown(){const dd=document.getElementById('lang-dropdown');if(!dd)return;buildLangDropdown();dd.classList.toggle('open');}
function closeLangDropdown(){document.getElementById('lang-dropdown')?.classList.remove('open');}
function applyLangToPage(){document.querySelectorAll('[data-nav]').forEach(el=>{const k=el.getAttribute('data-nav');if(t('nav.'+k))el.textContent=t('nav.'+k);});document.querySelectorAll('[data-i18n]').forEach(el=>{const k=el.getAttribute('data-i18n');if(t(k)!==k)el.textContent=t(k);});}

/* ── FULLSCREEN ── */
let isFullscreen=false;
function toggleFullscreen(){const c=document.getElementById('board-fs-wrap');if(!c)return;const isNFS=document.fullscreenElement||document.webkitFullscreenElement;if(!isNFS){const req=c.requestFullscreen||c.webkitRequestFullscreen||c.mozRequestFullScreen;if(req)req.call(c).catch(()=>{c.classList.add('css-fullscreen');isFullscreen=true;updateFSBtn();});else{c.classList.add('css-fullscreen');isFullscreen=true;updateFSBtn();}}else{const exit=document.exitFullscreen||document.webkitExitFullscreen;if(exit)exit.call(document);c.classList.remove('css-fullscreen');isFullscreen=false;updateFSBtn();}}
function updateFSBtn(){const btn=document.getElementById('fs-btn');if(!btn)return;const a=document.fullscreenElement||document.webkitFullscreenElement||isFullscreen;btn.textContent=a?t('exitFS'):t('fullscreen');}
document.addEventListener('fullscreenchange',()=>{isFullscreen=!!document.fullscreenElement;if(!isFullscreen)document.getElementById('board-fs-wrap')?.classList.remove('css-fullscreen');updateFSBtn();});
document.addEventListener('webkitfullscreenchange',()=>{isFullscreen=!!document.webkitFullscreenElement;updateFSBtn();});

/* ═══════════════════════════════════════════════════════
   SOUND SYSTEM
═══════════════════════════════════════════════════════ */
let soundEnabled=localStorage.getItem('cm_sound')!=='off';
let _audioCtx=null;
function getAC(){if(!_audioCtx)_audioCtx=new(window.AudioContext||window.webkitAudioContext)();if(_audioCtx.state==='suspended')_audioCtx.resume();return _audioCtx;}
function playTone(freq,type,dur,vol,delay=0){try{const ac=getAC(),osc=ac.createOscillator(),g=ac.createGain(),now=ac.currentTime+delay;osc.connect(g);g.connect(ac.destination);osc.type=type;osc.frequency.setValueAtTime(freq,now);g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(vol,now+0.006);g.gain.exponentialRampToValueAtTime(0.001,now+dur);osc.start(now);osc.stop(now+dur);}catch(e){}}
function playNoise(vol=0.4,dur=0.08,delay=0){try{const ac=getAC(),buf=ac.createBuffer(1,Math.floor(ac.sampleRate*dur),ac.sampleRate),d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.exp(-i/(d.length*0.2));const src=ac.createBufferSource(),g=ac.createGain(),f=ac.createBiquadFilter();f.type='bandpass';f.frequency.value=1600;f.Q.value=0.8;src.buffer=buf;src.connect(f);f.connect(g);g.connect(ac.destination);g.gain.setValueAtTime(vol,ac.currentTime+delay);src.start(ac.currentTime+delay);}catch(e){}}
function playSound(type){if(!soundEnabled)return;switch(type){case 'move':playNoise(0.45,0.07);break;case 'capture':playNoise(0.7,0.09);playNoise(0.35,0.07,0.06);break;case 'castle':playNoise(0.45,0.07);playNoise(0.45,0.07,0.12);break;case 'check':playTone(880,'square',0.12,0.22);playTone(1100,'square',0.1,0.16,0.1);break;case 'checkmate':[440,370,294].forEach((f,i)=>playTone(f,'sawtooth',0.28+i*0.12,0.35-i*0.07,i*0.22));break;case 'promo':[523,659,784,1047].forEach((f,i)=>playTone(f,'sine',0.22,0.38,i*0.1));break;case 'draw':playTone(523,'sine',0.3,0.25);playTone(523,'sine',0.3,0.25,0.38);break;case 'start':playTone(523,'sine',0.15,0.28);playTone(659,'sine',0.18,0.28,0.14);break;case 'wrong':playTone(200,'sawtooth',0.18,0.3);break;case 'correct':playTone(784,'sine',0.14,0.3);playTone(1047,'sine',0.14,0.3,0.14);break;case 'clock-low':playNoise(0.18,0.05);break;}}
function toggleSound(){soundEnabled=!soundEnabled;localStorage.setItem('cm_sound',soundEnabled?'on':'off');const btn=document.getElementById('sound-btn');if(btn)btn.textContent=soundEnabled?'🔊':'🔇';}

/* ═══════════════════════════════════════════════════════
   CLOCK SYSTEM
═══════════════════════════════════════════════════════ */
const TIME_CONTROLS={none:{base:0,inc:0,label:'∞ Free'},bullet:{base:60,inc:0,label:'⚡ 1+0'},blitz3:{base:180,inc:2,label:'🔥 3+2'},blitz5:{base:300,inc:0,label:'🔥 5+0'},rapid10:{base:600,inc:0,label:'⏱ 10+0'},rapid15:{base:900,inc:10,label:'⏱ 15+10'}};
let clockKey='none',clockW=0,clockB=0,clockStarted=false,clockRunning=false,clockInterval=null;
function setTimeControl(key){clockKey=key;document.querySelectorAll('.tc-btn').forEach(b=>b.classList.remove('active'));document.querySelector(`.tc-btn[data-tc="${key}"]`)?.classList.add('active');if(document.getElementById('board'))newGame();else resetClock();}
function resetClock(){stopClock();const tc=TIME_CONTROLS[clockKey];clockW=tc.base;clockB=tc.base;clockStarted=false;clockRunning=false;updateClockDisplay();}
function startClock(){if(clockKey==='none'||clockRunning)return;clockRunning=true;clockStarted=true;clockInterval=setInterval(tickClock,1000);}
function stopClock(){clockRunning=false;if(clockInterval){clearInterval(clockInterval);clockInterval=null;}}
function tickClock(){if(!clockRunning)return;if(turn==='w'){clockW--;if(clockW<=10&&clockW>0)playSound('clock-low');if(clockW<=0){clockW=0;updateClockDisplay();onClockTimeout('w');return;}}else{clockB--;if(clockB<=10&&clockB>0)playSound('clock-low');if(clockB<=0){clockB=0;updateClockDisplay();onClockTimeout('b');return;}}updateClockDisplay();}
function switchClock(){if(clockKey==='none')return;const jm=turn==='w'?'b':'w';const inc=TIME_CONTROLS[clockKey].inc;if(jm==='w')clockW+=inc;else clockB+=inc;if(!clockStarted)startClock();updateClockDisplay();}
function updateClockDisplay(){const show=clockKey!=='none';const eW=document.getElementById('clock-w'),eB=document.getElementById('clock-b');if(eW){eW.style.display=show?'flex':'none';eW.textContent=fmtTime(clockW);eW.className='player-clock'+(turn==='w'&&clockStarted&&!over?' active':'')+(clockW<=10&&clockStarted?' low':'');}if(eB){eB.style.display=show?'flex':'none';eB.textContent=fmtTime(clockB);eB.className='player-clock'+(turn==='b'&&clockStarted&&!over?' active':'')+(clockB<=10&&clockStarted?' low':'');}}
function fmtTime(s){if(s<=0)return'0:00';const m=Math.floor(s/60),sec=s%60;return m+':'+(sec<10?'0':'')+sec;}
function onClockTimeout(color){stopClock();over=true;const winner=color==='w'?t('black'):t('white');document.getElementById('ov-title').textContent='⏰ '+t('checkmate');document.getElementById('ov-msg').textContent=winner+' wins on time!';setStatus('⏰ '+winner+' wins on time!');playSound('checkmate');setTimeout(()=>document.getElementById('overlay')?.classList.add('show'),300);setTimeout(()=>updateEloAfterGame(color==='w'?'b':'w'),500);}

/* ═══════════════════════════════════════════════════════
   ELO RATING
═══════════════════════════════════════════════════════ */
function getElo(){return parseInt(localStorage.getItem('cm_elo')||'1200');}
function saveElo(v){localStorage.setItem('cm_elo',Math.max(100,Math.round(v)));}
function updateEloDisplay(){const el=document.getElementById('elo-badge');if(el)el.textContent='⚡ '+getElo();}
function updateEloAfterGame(winner){
  if(mode!=='ai')return;
  const my=getElo(),aiElo=1000+aiDifficulty*70;
  const K=32,exp=1/(1+Math.pow(10,(aiElo-my)/400));
  const score=winner==='w'?1:winner==='draw'?0.5:0;
  const delta=Math.round(K*(score-exp));
  const newElo=Math.max(100,my+delta);
  saveElo(newElo);
  const el=document.getElementById('elo-change');
  if(el){el.textContent=`Rating: ${my} → ${newElo} (${delta>=0?'+':''}${delta})`;el.style.color=delta>=0?'#6dcc8a':'#e06060';el.style.display='block';}
  updateEloDisplay();updateLeaderboardEntry(newElo,winner);
}

/* ── LEADERBOARD ── */
function getUsername(){return localStorage.getItem('cm_username')||'You';}
function saveUsername(){const v=(document.getElementById('lb-name-inp')?.value||'').trim().slice(0,20);if(!v)return;localStorage.setItem('cm_username',v);updateEloDisplay();hideLeaderboard();}
function updateLeaderboardEntry(elo,result){const name=getUsername();let lb=JSON.parse(localStorage.getItem('cm_lb')||'[]');const ex=lb.find(e=>e.n===name);const today=new Date().toLocaleDateString();if(ex){ex.e=elo;ex.g=(ex.g||0)+1;if(result==='w')ex.w=(ex.w||0)+1;else if(result==='draw')ex.d=(ex.d||0)+1;else ex.l=(ex.l||0)+1;ex.last=today;}else lb.push({n:name,e:elo,g:1,w:result==='w'?1:0,d:result==='draw'?1:0,l:result!=='w'&&result!=='draw'?1:0,last:today});lb.sort((a,b)=>b.e-a.e);localStorage.setItem('cm_lb',JSON.stringify(lb.slice(0,15)));}
function showLeaderboard(){const lb=JSON.parse(localStorage.getItem('cm_lb')||'[]');const me=getUsername();const tbody=document.getElementById('lb-tbody');if(tbody){if(!lb.length)tbody.innerHTML='<tr><td colspan="5" style="text-align:center;color:var(--text-dim);padding:1.5rem">Play vs AI to build your rating!</td></tr>';else tbody.innerHTML=lb.map((e,i)=>`<tr class="${e.n===me?'lb-me':''}">${[i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1,e.n,`<strong>${e.e}</strong>`,`${e.w||0}W ${e.d||0}D ${e.l||0}L`,`<span style="font-size:.72rem;color:var(--text-dim)">${e.last||'-'}</span>`].map(x=>`<td>${x}</td>`).join('')}</tr>`).join('');}const inp=document.getElementById('lb-name-inp');if(inp)inp.value=localStorage.getItem('cm_username')||'';document.getElementById('lb-overlay')?.classList.add('show');}
function hideLeaderboard(){document.getElementById('lb-overlay')?.classList.remove('show');}

/* ── BOARD THEMES ── */
const BOARD_THEMES={classic:{light:'#f0d9b5',dark:'#b58863',frame:'#281c08',border:'#4a3018',name:'🟫 Classic'},forest:{light:'#eeeed2',dark:'#769656',frame:'#1a2a1a',border:'#2d4a2d',name:'🟩 Forest'},ocean:{light:'#dde6ea',dark:'#6b8fa0',frame:'#0d2030',border:'#1a3d55',name:'🟦 Ocean'},twilight:{light:'#e8d8f0',dark:'#7a5fa0',frame:'#1a0a2e',border:'#3a1a5e',name:'🟣 Twilight'},ruby:{light:'#f5d5d5',dark:'#a03030',frame:'#2a0808',border:'#5a1010',name:'🔴 Ruby'},midnight:{light:'#c8d8e8',dark:'#4a6080',frame:'#080c14',border:'#1a2840',name:'🌙 Midnight'},amber:{light:'#ffd98a',dark:'#b87a20',frame:'#2a1600',border:'#5a3000',name:'🟡 Amber'}};
let boardThemeKey=localStorage.getItem('cm_board_theme')||'classic';
function applyBoardTheme(key){const th=BOARD_THEMES[key];if(!th)return;boardThemeKey=key;localStorage.setItem('cm_board_theme',key);document.documentElement.style.setProperty('--light-sq',th.light);document.documentElement.style.setProperty('--dark-sq',th.dark);const frame=document.querySelector('.board-frame');if(frame){frame.style.background=th.frame;frame.style.borderColor=th.border;}const boardEl=document.getElementById('board');if(boardEl)boardEl.style.borderColor=th.border;document.querySelectorAll('.theme-opt').forEach(b=>b.classList.toggle('active',b.dataset.theme===key));hideBoardThemePanel();}
function toggleBoardThemePanel(){document.getElementById('board-theme-panel')?.classList.toggle('show');}
function hideBoardThemePanel(){document.getElementById('board-theme-panel')?.classList.remove('show');}

/* ═══════════════════════════════════════════════════════
   NEW: DIFFICULTY SYSTEM (1-10)
═══════════════════════════════════════════════════════ */
let aiDifficulty=parseInt(localStorage.getItem('cm_difficulty')||'5');
const DIFF_NAMES=['','Beginner','Easy','Novice','Casual','Medium','Competent','Advanced','Expert','Master','Grandmaster'];
function setDifficulty(d){aiDifficulty=d;localStorage.setItem('cm_difficulty',d);document.querySelectorAll('.diff-btn').forEach((b,i)=>b.classList.toggle('active',i+1===d));const lbl=document.getElementById('diff-label');if(lbl)lbl.textContent=DIFF_NAMES[d];if(sfWorker&&sfReady)sfWorker.postMessage(`setoption name Skill Level value ${getSkillLevel()}`);}
function getSkillLevel(){const t2=[0,0,2,4,6,9,12,15,17,19,20];return t2[aiDifficulty]||10;}
function getSearchDepth(){const t2=[0,1,1,2,2,3,4,5,7,9,12];return t2[aiDifficulty]||4;}
function getRandomness(){if(aiDifficulty<=2)return 0.55;if(aiDifficulty<=3)return 0.3;if(aiDifficulty<=4)return 0.12;return 0;}

/* ═══════════════════════════════════════════════════════
   NEW: STOCKFISH INTEGRATION
═══════════════════════════════════════════════════════ */
let sfWorker=null,sfReady=false,sfSearching=false,sfResolve=null;

async function initStockfish(){
  if(sfWorker)return sfReady;
  const sfStatus=document.getElementById('sf-status');
  if(sfStatus)sfStatus.textContent='Loading Stockfish…';
  try{
    const res=await fetch('https://cdn.jsdelivr.net/npm/stockfish.js@10.0.2/stockfish.js');
    if(!res.ok)throw new Error('fetch failed');
    const js=await res.text();
    const blob=new Blob([js],{type:'text/javascript'});
    sfWorker=new Worker(URL.createObjectURL(blob));
    sfWorker.onmessage=({data})=>{
      if(data==='uciok'){sfReady=true;if(sfStatus)sfStatus.textContent='🟢 Stockfish Ready';}
      if(data.startsWith('bestmove')&&sfResolve){const mv=data.split(' ')[1];const r=sfResolve;sfResolve=null;sfSearching=false;r(mv);}
    };
    sfWorker.onerror=()=>{sfWorker=null;sfReady=false;if(sfStatus)sfStatus.textContent='';};
    sfWorker.postMessage('uci');
    sfWorker.postMessage(`setoption name Skill Level value ${getSkillLevel()}`);
    sfWorker.postMessage('setoption name Hash value 16');
    sfWorker.postMessage('isready');
    return true;
  }catch(e){sfWorker=null;sfReady=false;if(sfStatus)sfStatus.textContent='';return false;}
}

function sfSearch(fen,depth,movetime){
  return new Promise(resolve=>{
    if(!sfWorker||!sfReady){resolve(null);return;}
    sfSearching=true;sfResolve=resolve;
    sfWorker.postMessage(`position fen ${fen}`);
    sfWorker.postMessage(`go depth ${depth} movetime ${movetime||3000}`);
  });
}

function sfMoveToIdx(mv){
  if(!mv||mv==='(none)')return null;
  return{fr:8-parseInt(mv[1]),fc:mv.charCodeAt(0)-97,tr:8-parseInt(mv[3]),tc:mv.charCodeAt(2)-97,promo:mv.length>4?mv[4].toUpperCase():null};
}

function boardToFEN(){
  let fen='';
  for(let r=0;r<8;r++){let e=0;for(let c=0;c<8;c++){const p=board[r][c];if(!p)e++;else{if(e>0){fen+=e;e=0;}fen+=p.cl==='w'?p.t:p.t.toLowerCase();}}if(e>0)fen+=e;if(r<7)fen+='/';}
  fen+=' '+turn;
  let cs='';if(castle.w.k)cs+='K';if(castle.w.q)cs+='Q';if(castle.b.k)cs+='k';if(castle.b.q)cs+='q';fen+=' '+(cs||'-');
  fen+=epTgt?' '+String.fromCharCode(97+epTgt[1])+(8-epTgt[0]):' -';
  fen+=' 0 '+Math.max(1,Math.ceil(hist.length/2));
  return fen;
}

/* ── OPENING DETECTOR ── */
const OPENING_DB=[
  {seq:['6444'],name:"King's Pawn Opening"},{seq:['6343'],name:"Queen's Pawn Opening"},{seq:['6242'],name:"English Opening"},{seq:['7655'],name:"Réti Opening"},{seq:['6444','1434'],name:"Open Game (e4 e5)"},{seq:['6444','1424'],name:"French Defense"},{seq:['6444','1222'],name:"Caro-Kann Defense"},{seq:['6444','1232'],name:"Sicilian Defense"},{seq:['6444','0625'],name:"Alekhine's Defense"},{seq:['6444','1333'],name:"Scandinavian Defense"},{seq:['6444','1323'],name:"Pirc Defense"},{seq:['6343','1333'],name:"Closed Game (d4 d5)"},{seq:['6343','0625'],name:"Indian Game"},{seq:['6343','1535'],name:"Dutch Defense"},{seq:['6343','1333','6242'],name:"Queen's Gambit"},{seq:['6444','1434','7655'],name:"King's Knight Opening"},{seq:['6444','1434','7152'],name:"Vienna Game"},{seq:['6444','1434','7655','0625'],name:"Petrov's Defense"},{seq:['6444','1434','7655','0122'],name:"Three Knights Game"},{seq:['6444','1434','7655','0122','7531'],name:"Ruy Lopez (Spanish)"},{seq:['6444','1434','7655','0122','7542'],name:"Italian Game"},{seq:['6444','1434','7655','0122','7542','0532'],name:"Giuoco Piano"},{seq:['6444','1434','7655','0122','7542','0625'],name:"Two Knights Defense"},{seq:['6343','0625','6242'],name:"King's Indian Defense"},{seq:['6343','0625','6252'],name:"Nimzo-Indian Defense"},{seq:['6444','1232','7655'],name:"Sicilian — Open Variation"},{seq:['6444','1232','6464'],name:"Sicilian — Closed"},{seq:['6343','1333','6242','1535'],name:"Queen's Gambit Accepted"},{seq:['6343','1333','6242','1212'],name:"Queen's Gambit Declined"},{seq:['6444','1424','6444','0525'],name:"French — Classical"},{seq:['6444','1222','6444','6464'],name:"Caro-Kann — Classical"},{seq:['6242','0625','7655','6444'],name:"Réti Opening — 1...d5"}
];
let moveKeys=[];
function updateOpeningDisplay(){let best=null;for(const op of OPENING_DB)if(op.seq.length<=moveKeys.length&&op.seq.every((m,i)=>m===moveKeys[i])&&(!best||op.seq.length>best.seq.length))best=op;const el=document.getElementById('opening-name');if(!el)return;if(best){el.textContent='📖 '+best.name;el.style.display='block';el.onclick=()=>openOpeningExplorer(best.name);}else if(moveKeys.length===0)el.style.display='none';}

/* ── OPENING EXPLORER ── */
const OPENING_LINES={
  "King's Pawn Opening":"1.e4 - Controls the center. White immediately occupies d5 and f5 control. Most popular first move at all levels.",
  "Sicilian Defense":"1.e4 c5 - Black fights for d4 asymmetrically. Creates imbalanced positions with winning chances for both sides. Most popular chess opening.",
  "French Defense":"1.e4 e6 - Solid, strategic defense. Black allows e5 space gain but plans counterplay with d5.",
  "Caro-Kann Defense":"1.e4 c6 - Solid pawn structure. Black prepares d5 without weakening the kingside.",
  "Ruy Lopez (Spanish)":"1.e4 e5 2.Nf3 Nc6 3.Bb5 - Oldest and most deeply studied opening. White pressures e5 via the bishop.",
  "Italian Game":"1.e4 e5 2.Nf3 Nc6 3.Bc4 - Rapidly developing. White aims at f7 and controls the center.",
  "Queen's Gambit":"1.d4 d5 2.c4 - White offers a pawn to gain central control. Not a true gambit as Black can't keep the pawn.",
  "King's Indian Defense":"1.d4 Nf6 2.c4 g6 - Black allows White central domination then counterattacks. Favored by Fischer and Kasparov.",
  "English Opening":"1.c4 - Flexible flank opening. White controls d5 without committing the d-pawn.",
  "default":"A rich chess opening with centuries of theory. Understanding pawn structures and piece activity is key to playing it well."
};
function openOpeningExplorer(name){
  const modal=document.getElementById('oe-modal');if(!modal)return;
  document.getElementById('oe-title').textContent='📖 '+name;
  const info=OPENING_LINES[name]||OPENING_LINES.default;
  document.getElementById('oe-info').textContent=info;
  modal.classList.add('show');
}
function closeOpeningExplorer(){document.getElementById('oe-modal')?.classList.remove('show');}

/* ── CHAT SYSTEM ── */
function toggleChat(){const p=document.getElementById('chat-panel');if(!p)return;p.classList.toggle('open');if(p.classList.contains('open')){const b=document.getElementById('chat-badge');if(b)b.style.display='none';}}
function addChatMsg(sender,msg){const list=document.getElementById('chat-list');if(!list)return;const div=document.createElement('div');div.className='chat-msg '+(sender==='You'?'me':'them');div.innerHTML=`<span class="chat-sender">${sender}</span><span class="chat-text">${msg.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span>`;list.appendChild(div);list.scrollTop=list.scrollHeight;}
function sendChatMessage(){const inp=document.getElementById('chat-input');if(!inp||!inp.value.trim())return;const msg=inp.value.trim().slice(0,120);inp.value='';addChatMsg('You',msg);const c=conn||qmConn;if(c&&c.open)c.send({type:'chat',msg});}
function sendQuickChat(msg){addChatMsg('You',msg);const c=conn||qmConn;if(c&&c.open)c.send({type:'chat',msg});}
function showChatBtn(show){const btn=document.getElementById('chat-toggle-btn');if(btn)btn.className=show?'chat-toggle-btn visible':'chat-toggle-btn';}

/* ── PGN EXPORT ── */
function exportPGN(){const d=new Date().toISOString().split('T')[0].replace(/-/g,'.');const modeStr=mode==='ai'?'Human vs Computer':mode==='online'||mode==='quickmatch'?'Online Game':'Human vs Human';let result='*';if(over){if(inCheck(turn,board)&&!anyLegal(turn))result=turn==='w'?'0-1':'1-0';else result='1/2-1/2';}let pgn=`[Event "${modeStr}"]\n[Site "ChessMaster Pro"]\n[Date "${d}"]\n[White "White"]\n[Black "${mode==='ai'?'ChessMaster AI (Lvl '+aiDifficulty+')':'Black'}"]\n[Result "${result}"]\n\n`;let num=1;for(let i=0;i<hist.length;i++){if(hist[i].p.cl==='w')pgn+=num+'. ';pgn+=hist[i].note+' ';if(hist[i].p.cl==='b')num++;}pgn+=result;const btn=document.getElementById('pgn-copy-btn');if(navigator.clipboard)navigator.clipboard.writeText(pgn).then(()=>{if(btn){btn.textContent='✅ Copied!';setTimeout(()=>btn.textContent='📋 Copy PGN',2500);}}).catch(()=>prompt('Copy PGN:',pgn));else prompt('Copy PGN:',pgn);}

/* ── RESIGN & DRAW ── */
function resignGame(){if(over||!board)return;if(!confirm('Are you sure you want to resign?'))return;over=true;stopClock();const winner=turn==='w'?t('black'):t('white');document.getElementById('ov-title').textContent='🏳️ Resigned';document.getElementById('ov-msg').textContent=winner+' wins by resignation!';setStatus(winner+' wins by resignation!');playSound('checkmate');setTimeout(()=>document.getElementById('overlay')?.classList.add('show'),300);if(mode==='ai')setTimeout(()=>updateEloAfterGame(turn==='w'?'b':'w'),500);const c=conn||qmConn;if((mode==='online'||mode==='quickmatch')&&c&&c.open)c.send({type:'resign'});}
function offerDraw(){if(over||!board)return;if(mode==='online'||mode==='quickmatch'){const c=conn||qmConn;if(c&&c.open){c.send({type:'draw-offer'});setStatus('Draw offer sent…');}}else if(mode==='ai'){setStatus('The AI declined the draw offer.');setTimeout(()=>{if(!over)setStatus(turn==='w'?t('whiteTurn'):t('blackTurn'));},2500);}else{if(confirm('Accept draw?'))acceptDraw();}}
function acceptDraw(){over=true;stopClock();document.getElementById('ov-title').textContent='🤝 Draw!';document.getElementById('ov-msg').textContent=t('drawMsg');setStatus(t('drawMsg'));playSound('draw');setTimeout(()=>document.getElementById('overlay')?.classList.add('show'),300);if(mode==='ai')setTimeout(()=>updateEloAfterGame('draw'),500);}

/* ═══════════════════════════════════════════════════════
   EXPANDED PUZZLE DATABASE — 60 Puzzles
═══════════════════════════════════════════════════════ */
const PUZZLES=[
  // ── BACK RANK MATES ──
  {id:1,title:"Back Rank Weakness",desc:"White to move. The king's back rank is unguarded!",hint:"Move the Rook to the 8th rank.",fen:"6k1/5ppp/8/8/8/8/8/3R2K1 w - - 0 1",sol:[[7,3,0,3]],theme:"Back Rank",diff:1},
  {id:2,title:"Rook Strikes!",desc:"White to move. One rook move ends the game.",hint:"Place the Rook on f8.",fen:"7k/5ppp/8/8/8/8/8/5RK1 w - - 0 1",sol:[[7,5,0,5]],theme:"Back Rank",diff:1},
  {id:3,title:"Scholar's Mate",desc:"White to move. The classic 4-move checkmate!",hint:"The Queen and Bishop target f7.",fen:"r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 1",sol:[[5,5,1,5]],theme:"Queen Attack",diff:1},
  {id:4,title:"Fool's Mate",desc:"Black to move. Fastest checkmate in chess history!",hint:"Look at the diagonal opened by White's pawns.",fen:"rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq g3 0 2",sol:[[0,3,4,7]],theme:"Queen Attack",diff:1},
  {id:5,title:"Queen & Rook Combo",desc:"White to move. Major pieces deliver mate!",hint:"The Queen captures on g7.",fen:"r5k1/ppR2Qpp/8/8/8/8/PP4PP/6K1 w - - 0 1",sol:[[1,5,1,6]],theme:"Combination",diff:1},
  {id:6,title:"Corner Checkmate",desc:"White to move. The king is cornered — finish it!",hint:"Move the Rook to a1.",fen:"k7/1K6/8/8/8/8/8/7R w - - 0 1",sol:[[7,7,7,0]],theme:"Endgame",diff:1},
  {id:7,title:"Queen Finale",desc:"White to move. The Queen delivers a decisive blow!",hint:"The f-file leads straight to the king.",fen:"5k2/4p1pp/8/8/8/8/8/5Q1K w - - 0 1",sol:[[7,5,1,5]],theme:"Queen Attack",diff:1},
  {id:8,title:"Capture & Mate",desc:"White to move. Take the rook and deliver checkmate!",hint:"Capturing on d8 traps the king.",fen:"3r2k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1",sol:[[7,3,0,3]],theme:"Back Rank",diff:1},
  // ── NEW: MORE BACK RANK ──
  {id:9,title:"Rook on the 8th",desc:"White to move. The enemy king has no shelter.",hint:"A rook belongs on the 8th rank.",fen:"6k1/5pp1/7p/8/8/8/8/1R4K1 w - - 0 1",sol:[[7,1,0,1]],theme:"Back Rank",diff:1},
  {id:10,title:"Double Rooks",desc:"White to move. Both rooks cooperate for mate.",hint:"One rook comes to the back rank.",fen:"6k1/5ppp/8/8/8/8/8/RR4K1 w - - 0 1",sol:[[7,0,0,0]],theme:"Back Rank",diff:1},
  // ── QUEEN MATES ──
  {id:11,title:"Queen's Diagonal",desc:"White to move. The Queen strikes diagonally!",hint:"Look for a diagonal attacking the king.",fen:"5k2/5p1p/8/8/3Q4/8/8/6K1 w - - 0 1",sol:[[4,3,1,6]],theme:"Queen Attack",diff:2},
  {id:12,title:"Corridor Mate",desc:"White to move. Drive the king to the edge!",hint:"The Queen cuts off all escape routes.",fen:"8/8/8/8/8/8/5k2/Q5K1 w - - 0 1",sol:[[7,0,5,2]],theme:"Endgame",diff:2},
  // ── SMOTHERED MATE ──
  {id:13,title:"Smothered Mate",desc:"White to move. The knight delivers the killing blow!",hint:"The king is smothered by its own pieces.",fen:"6rk/6pp/8/8/8/8/8/N5K1 w - - 0 1",sol:[[7,0,5,1]],theme:"Knight",diff:2},
  // ── FORK PATTERNS ──
  {id:14,title:"Royal Fork",desc:"White to move. The knight can fork king and queen!",hint:"Knights attack two pieces at once.",fen:"4k3/8/8/3q4/8/8/8/3NK2K w - - 0 1",sol:[[7,3,5,4]],theme:"Fork",diff:2},
  {id:15,title:"Knight Fork",desc:"White to move. Find the fork!",hint:"The knight jumps to attack both major pieces.",fen:"r3k3/8/8/8/8/8/8/4NK1K w - - 0 1",sol:[[7,4,5,3]],theme:"Fork",diff:2},
  // ── PINS ──
  {id:16,title:"Pinned to Death",desc:"White to move. Exploit the pin!",hint:"A piece pinned to the king is helpless.",fen:"4k3/4r3/8/4Q3/8/8/8/4K3 w - - 0 1",sol:[[3,4,1,4]],theme:"Pin",diff:2},
  // ── DISCOVERED ATTACKS ──
  {id:17,title:"Discovered Check",desc:"White to move. Moving one piece reveals a devastating check!",hint:"Uncover the bishop's diagonal.",fen:"4k3/8/8/8/3NB3/8/8/4K3 w - - 0 1",sol:[[4,3,2,4]],theme:"Discovery",diff:3},
  // ── ENDGAME TACTICS ──
  {id:18,title:"Lucena Position",desc:"White to move. Promote the pawn!",hint:"The rook bridges to create a shield.",fen:"3R4/3PK3/8/8/8/8/3k4/3r4 w - - 0 1",sol:[[0,3,4,3]],theme:"Endgame",diff:3},
  {id:19,title:"King & Pawn Race",desc:"White to move. Promote first!",hint:"Count the moves to promotion.",fen:"8/8/8/3k4/8/8/3P4/3K4 w - - 0 1",sol:[[6,3,5,3]],theme:"Endgame",diff:2},
  {id:20,title:"Opposition Endgame",desc:"White to move. Use king opposition to win!",hint:"Take the opposition with your king.",fen:"8/8/4k3/8/4K3/8/8/8 w - - 0 1",sol:[[4,4,5,4]],theme:"Endgame",diff:2},
  // ── ROOK MATES ──
  {id:21,title:"Anastasia's Mate",desc:"White to move. The rook and knight combine!",hint:"The rook cuts off the king's escape.",fen:"5rk1/4Rppp/8/8/8/8/8/3N2K1 w - - 0 1",sol:[[1,4,1,7]],theme:"Combination",diff:2},
  {id:22,title:"Arabian Mate",desc:"White to move. Rook and knight — the Arabian Mate!",hint:"The knight covers the escape, rook delivers mate.",fen:"6k1/6R1/5N2/8/8/8/8/6K1 w - - 0 1",sol:[[1,6,0,6]],theme:"Combination",diff:2},
  // ── BISHOP MATES ──
  {id:23,title:"Bishop & Rook",desc:"White to move. The bishop assists the rook for mate.",hint:"Combine rook and bishop power.",fen:"5k2/5Rpp/8/8/8/5B2/8/6K1 w - - 0 1",sol:[[1,5,0,5]],theme:"Combination",diff:2},
  // ── QUEEN ENDGAMES ──
  {id:24,title:"Queen vs King",desc:"White to move. Force checkmate with just a queen!",hint:"Drive the king to the corner.",fen:"8/8/8/8/8/2K5/8/Q6k w - - 0 1",sol:[[7,0,7,1]],theme:"Endgame",diff:1},
  {id:25,title:"Two Queens!",desc:"White to move. Two queens is overwhelming.",hint:"One queen guards while the other mates.",fen:"7k/8/8/8/8/8/8/QQ5K w - - 0 1",sol:[[7,0,1,0]],theme:"Queen Attack",diff:1},
  // ── ZUGZWANG ──
  {id:26,title:"Zugzwang!",desc:"Black to move — any move loses! Find the pattern.",hint:"Being forced to move is the problem.",fen:"8/8/1k6/2p5/2P5/1K6/8/8 b - - 0 1",sol:[[2,2,1,2]],theme:"Zugzwang",diff:3},
  // ── STAIRCASE MATE ──
  {id:27,title:"Staircase Mate",desc:"White to move. Two rooks staircase the king!",hint:"One rook checks, other blocks escape.",fen:"k7/8/8/8/8/8/1R6/R5K1 w - - 0 1",sol:[[6,1,1,1]],theme:"Back Rank",diff:2},
  {id:28,title:"Epaulette Mate",desc:"White to move. The king's own rooks trap it!",hint:"A queen delivers epaulette checkmate.",fen:"r5rk/8/8/8/8/8/8/3Q2K1 w - - 0 1",sol:[[7,3,1,7]],theme:"Queen Attack",diff:2},
  // ── DISCOVERED CHECKS ──
  {id:29,title:"Double Check!",desc:"White to move. A double check from two pieces!",hint:"Move a piece to uncover a check AND give a new check.",fen:"r1bqk2r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 5",sol:[[5,5,4,7]],theme:"Discovery",diff:3},
  // ── SIMPLE TACTICS ──
  {id:30,title:"Hanging Piece",desc:"White to move. Capture the undefended piece!",hint:"Look for a piece that has no defender.",fen:"r1bqkb1r/pppp1ppp/2n5/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 0 3",sol:[[4,2,1,5]],theme:"Tactics",diff:1},
  {id:31,title:"Free Piece",desc:"White to move. Win material!",hint:"The knight on c6 is undefended.",fen:"2rqkb1r/pp2pppp/2np4/3p4/3PP3/2N2N2/PPP2PPP/R1BQKB1R w KQkq - 0 7",sol:[[2,2,1,0]],theme:"Tactics",diff:2},
  {id:32,title:"Skewer Attack",desc:"White to move. A skewer wins material!",hint:"Attack the king through the bishop.",fen:"4k3/4b3/8/8/8/8/8/4RK2 w - - 0 1",sol:[[7,4,1,4]],theme:"Skewer",diff:2},
  {id:33,title:"The Pin Wins",desc:"White to move. Use the pin to win material.",hint:"The pinned knight cannot move.",fen:"r1bqkbnr/pppp1ppp/2n5/4p3/3PP3/8/PPP2PPP/RNBQKBNR w KQkq - 0 3",sol:[[6,3,4,3]],theme:"Pin",diff:2},
  {id:34,title:"Windmill",desc:"White to move. A rook and bishop windmill!",hint:"Check, capture, check, capture...",fen:"r5k1/ppp2pBp/8/8/8/8/PPP2PPP/4R1K1 w - - 0 1",sol:[[1,6,0,7]],theme:"Combination",diff:3},
  {id:35,title:"Greek Gift",desc:"White to move. The classic bishop sacrifice!",hint:"Sacrifice the bishop on h7.",fen:"r1bq1rk1/ppp2ppp/2n2n2/3pp3/2B1P3/2NP1N2/PPPB1PPP/R2QK2R w KQ - 0 8",sol:[[4,2,1,7]],theme:"Sacrifice",diff:3},
  // ── MORE BACK RANK ──
  {id:36,title:"Rook Invasion",desc:"White to move. The rook invades the 7th rank!",hint:"Place the rook on d7 for a crushing advantage.",fen:"3r2k1/3p1ppp/8/8/8/8/3P1PPP/3R2K1 w - - 0 1",sol:[[7,3,1,3]],theme:"Back Rank",diff:2},
  {id:37,title:"Back Rank Plus Rook",desc:"White to move. The rook and queen deliver mate.",hint:"The queen sacrifices to open lines.",fen:"r5k1/ppQ2ppp/8/8/8/8/PP3PPP/6RK w - - 0 1",sol:[[1,2,0,2]],theme:"Combination",diff:2},
  // ── MATE IN 2 ──
  {id:38,title:"Mate in Two (I)",desc:"White to move — find the 2-move checkmate!",hint:"First check with the queen, then follow up.",fen:"r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 1",sol:[[1,5,1,4]],theme:"Combination",diff:2},
  {id:39,title:"Smothered Mate in 2",desc:"White to move — smother the king with 2 moves!",hint:"Sacrifice the queen, then the knight mates.",fen:"r2qkb1r/pp4pp/2p1Np2/2bPp3/6Q1/8/PPP2PPP/R1B1KB1R w KQkq - 0 12",sol:[[3,6,0,6]],theme:"Sacrifice",diff:3},
  {id:40,title:"Queen Sacrifice Mate",desc:"White to move. Sacrifice the queen to win!",hint:"Give up the queen for a forced checkmate.",fen:"r1bk3r/ppp2ppp/8/3Np3/3nP3/3Q4/PPP2PPP/R4RK1 w - - 0 1",sol:[[5,3,1,7]],theme:"Sacrifice",diff:3},
  // ── FORK PATTERNS 2 ──
  {id:41,title:"Bishop Fork",desc:"White to move. The bishop attacks two pieces!",hint:"A bishop move forks both rooks.",fen:"r7/8/8/8/8/8/8/r2BK2k w - - 0 1",sol:[[7,3,4,6]],theme:"Fork",diff:2},
  {id:42,title:"Rook Fork",desc:"White to move. Fork king and queen with the rook!",hint:"Place the rook on the 7th rank.",fen:"3qk3/8/8/8/8/8/8/R5K1 w - - 0 1",sol:[[7,0,1,0]],theme:"Fork",diff:2},
  // ── ENDGAME ──
  {id:43,title:"Rook Endgame",desc:"White to move. The rook supports the pawn promotion.",hint:"Cut off the black king with the rook.",fen:"8/3P4/8/8/8/3k4/8/3RK3 w - - 0 1",sol:[[7,3,3,3]],theme:"Endgame",diff:2},
  {id:44,title:"Pawn Promotion",desc:"White to move. Promote the pawn to win!",hint:"Nothing can stop this pawn.",fen:"8/P7/8/8/8/8/8/k5K1 w - - 0 1",sol:[[1,0,0,0]],theme:"Endgame",diff:1},
  {id:45,title:"Two Pawns Win",desc:"White to move. Two connected passed pawns win.",hint:"Advance the pawns together.",fen:"8/8/8/3PP3/8/3k4/8/3K4 w - - 0 1",sol:[[3,3,2,3]],theme:"Endgame",diff:2},
  // ── ADVANCED TACTICS ──
  {id:46,title:"Clearance Sacrifice",desc:"White to move. Clear the path for a decisive attack!",hint:"Remove the piece blocking your attack.",fen:"r3k2r/pp1b1ppp/2n1p3/1BppN3/3P4/2N3PP/PPP2P2/R2QR1K1 w kq - 0 12",sol:[[3,1,5,3]],theme:"Sacrifice",diff:3},
  {id:47,title:"Interference Tactic",desc:"White to move. Interfere with enemy piece coordination!",hint:"A sacrificial interference wins material.",fen:"r2qr1k1/1pp2ppp/2n1b3/p3p3/4P3/1BNP1N2/PPP2PPP/R2QR1K1 w - - 0 12",sol:[[5,5,4,4]],theme:"Tactics",diff:3},
  {id:48,title:"X-Ray Attack",desc:"White to move. The rook attacks through the enemy!",hint:"The rook's x-ray power wins material.",fen:"3r2k1/3q2pp/8/8/8/8/8/3RQK2 w - - 0 1",sol:[[7,3,0,3]],theme:"Tactics",diff:2},
  {id:49,title:"Overloaded Piece",desc:"White to move. The defender is overloaded!",hint:"Attack both threats — the defender can't handle both.",fen:"r4rk1/1pp1qppp/p1np1n2/2b1p3/2B1P3/2NP1N2/PPPBQPPP/R4RK1 w - - 0 10",sol:[[4,2,3,3]],theme:"Tactics",diff:3},
  {id:50,title:"Deflection",desc:"White to move. Deflect the defender!",hint:"Force the defender away from its duty.",fen:"r4rk1/1ppq1ppp/p2p1n2/2b1p3/2B1P3/2NP4/PPPQNPPP/R4RK1 w - - 0 10",sol:[[4,2,5,3]],theme:"Tactics",diff:3},
  // ── BEAUTIFUL COMBINATIONS ──
  {id:51,title:"Boden's Mate",desc:"White to move. Two bishops deliver Boden's Mate!",hint:"The two bishops create a mating net.",fen:"2kr3r/ppp1pppp/2n5/8/1b6/2N5/PPP1BPPP/R3K2R w KQ - 0 10",sol:[[4,4,1,1]],theme:"Combination",diff:3},
  {id:52,title:"Légal's Mate",desc:"White to move. The famous queen sacrifice!",hint:"Give up the queen — the knight and bishops mate!",fen:"r1bqkb1r/pppp1ppp/2n2n2/4N3/2B1P3/8/PPPP1PPP/RNBQK2R w KQkq - 0 5",sol:[[3,4,1,5]],theme:"Sacrifice",diff:3},
  {id:53,title:"Philidor's Legacy",desc:"White to move. A smothered mate masterpiece!",hint:"Force the king into a corner, then smother.",fen:"6rk/6pp/8/7N/8/8/8/4Q1K1 w - - 0 1",sol:[[4,4,0,4]],theme:"Knight",diff:3},
  {id:54,title:"Opera Game Mate",desc:"White to move. Recreate Morphy's immortal finish!",hint:"The rook on the open file is decisive.",fen:"1r1Rb1k1/2pQ1ppp/8/p7/8/8/PPP2PPP/R5K1 w - - 0 1",sol:[[1,3,1,7]],theme:"Combination",diff:2},
  {id:55,title:"Immortal Game",desc:"White to move. Attack like Anderssen!",hint:"Sacrifice everything for the king!",fen:"r3k2r/ppp2ppp/2n5/2bqp3/4P3/2NP4/PPPQ1PPP/R3K2R w KQkq - 0 10",sol:[[7,7,7,6]],theme:"Attack",diff:3},
  // ── SPECIAL MOVES ──
  {id:56,title:"En Passant!",desc:"White to move. Use the en passant rule to win!",hint:"The en passant capture removes the advanced pawn.",fen:"8/8/8/3pP3/8/8/8/4K2k w - d6 0 2",sol:[[3,4,2,3]],theme:"Special",diff:2},
  {id:57,title:"Castling to Safety",desc:"White to move. Castle to safety and activate the rook!",hint:"Castle kingside to protect the king.",fen:"rnbqk2r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 5",sol:[[7,4,7,6]],theme:"Special",diff:1},
  // ── ROOK MATES ADVANCED ──
  {id:58,title:"Rook & King",desc:"White to move. King and rook checkmate in the corner!",hint:"Drive the king to the edge.",fen:"8/8/8/8/8/1K6/8/R6k w - - 0 1",sol:[[7,0,7,7]],theme:"Endgame",diff:2},
  {id:59,title:"Two Rooks Mate",desc:"White to move. Two rooks create an unstoppable mating net.",hint:"Use one rook to cut off, other to mate.",fen:"7k/8/8/8/8/8/8/RR4K1 w - - 0 1",sol:[[7,1,1,1]],theme:"Back Rank",diff:1},
  {id:60,title:"Rook on 7th",desc:"White to move. A rook on the 7th rank is devastating!",hint:"The rook on the 7th rank restricts the king.",fen:"6k1/8/6K1/8/8/8/8/7R w - - 0 1",sol:[[7,7,1,7]],theme:"Endgame",diff:2}
];

let puzzleMode=false,currentPuzzle=null,puzzleSolveIdx=0,puzzleSolved=false;
let puzzleFilter='all';

function getDailyPuzzle(){return PUZZLES[Math.floor(Date.now()/86400000)%PUZZLES.length];}

function openPuzzleMode(){
  renderPuzzleList();
  document.getElementById('puzzle-list-modal')?.classList.add('show');
}
function closePuzzleListModal(){document.getElementById('puzzle-list-modal')?.classList.remove('show');}

function renderPuzzleList(){
  const grid=document.getElementById('puzzle-grid');if(!grid)return;
  const done=JSON.parse(localStorage.getItem('cm_pdone')||'[]');
  const filtered=puzzleFilter==='all'?PUZZLES:PUZZLES.filter(p=>p.theme===puzzleFilter||p.diff===parseInt(puzzleFilter));
  const themes=[...new Set(PUZZLES.map(p=>p.theme))];
  // Filter buttons
  const fb=document.getElementById('puzzle-filter-bar');
  if(fb&&!fb.querySelector('.pf-btn')){
    ['all',...themes].forEach(th=>{const b=document.createElement('button');b.className='pf-btn';b.textContent=th==='all'?'All':th;b.onclick=()=>{puzzleFilter=th;document.querySelectorAll('.pf-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderPuzzleList();};if(th==='all')b.classList.add('active');fb.appendChild(b);});
  }
  grid.innerHTML=filtered.map(p=>{const isDone=done.includes(p.id);return`<div class="pz-card ${isDone?'done':''}" onclick="closePuzzleListModal();loadPuzzle(PUZZLES.find(x=>x.id===${p.id}))">
    <div class="pz-top"><span class="pz-theme">${p.theme}</span><span class="pz-diff">${'⭐'.repeat(p.diff)}</span></div>
    <div class="pz-title">${p.title}</div>
    <div class="pz-status">${isDone?'✅ Solved':'🟡 Try it'}</div>
  </div>`}).join('');
}

function loadPuzzle(p){
  if(!p)return;
  currentPuzzle=p;puzzleSolveIdx=0;puzzleSolved=false;puzzleMode=true;
  parseFenToBoard(p.fen);
  document.getElementById('puzzle-title').textContent=p.title;
  document.getElementById('puzzle-desc').textContent=p.desc;
  document.getElementById('puzzle-theme-tag').textContent='🎯 '+p.theme;
  document.getElementById('puzzle-result').textContent='';
  document.getElementById('puzzle-hint-box').style.display='none';
  document.getElementById('puzzle-hint-box').textContent='💡 '+p.hint;
  document.getElementById('puzzle-panel')?.classList.add('active');
  flipped_=(turn==='b');render();
}
function parseFenToBoard(fen){
  const pts=fen.split(' ');board=[];sel=null;vmoves=[];over=false;hist=[];cap={w:[],b:[]};lastMv=null;
  for(const row of pts[0].split('/')){const r=[];for(const ch of row){if(/[1-8]/.test(ch))for(let i=0;i<parseInt(ch);i++)r.push(null);else{const cl=ch===ch.toUpperCase()?'w':'b';r.push({t:ch.toUpperCase(),cl});}}board.push(r);}
  turn=pts[1]==='w'?'w':'b';
  const cs=pts[2]||'-';castle={w:{k:cs.includes('K'),q:cs.includes('Q')},b:{k:cs.includes('k'),q:cs.includes('q')}};
  epTgt=null;if(pts[3]&&pts[3]!=='-'){const f=pts[3].charCodeAt(0)-97,r2=8-parseInt(pts[3][1]);epTgt=[r2,f];}
  stopClock();updateClockDisplay();
  setStatus(turn==='w'?"White to move — find the best move!":"Black to move — find the best move!");
}
function handlePuzzleClick(r,c){
  if(puzzleSolved||over)return;
  const p=board[r][c];
  if(sel){
    if(vmoves.some(([mr,mc])=>mr===r&&mc===c)){
      const solMove=currentPuzzle.sol[puzzleSolveIdx];
      if(solMove&&solMove[0]===sel[0]&&solMove[1]===sel[1]&&solMove[2]===r&&solMove[3]===c){
        execMove(sel[0],sel[1],r,c,'Q');puzzleSolveIdx++;
        if(puzzleSolveIdx>=currentPuzzle.sol.length){puzzleSolved=true;document.getElementById('puzzle-result').textContent='✅ Excellent! Puzzle solved!';document.getElementById('puzzle-result').style.color='#6dcc8a';playSound('correct');markPuzzleDone(currentPuzzle.id);}
      }else{document.getElementById('puzzle-result').textContent='❌ Not the best move — try again!';document.getElementById('puzzle-result').style.color='#e06060';playSound('wrong');sel=null;vmoves=[];render();}
      return;
    }
  }
  if(p&&p.cl===turn){sel=[r,c];vmoves=legalMoves(r,c);render();}else{sel=null;vmoves=[];render();}
}
function showPuzzleHint(){const h=document.getElementById('puzzle-hint-box');if(h)h.style.display='block';}
function closePuzzleMode(){puzzleMode=false;currentPuzzle=null;document.getElementById('puzzle-panel')?.classList.remove('active');flipped_=false;newGame();}
function nextPuzzle(){const idx=PUZZLES.findIndex(p=>p.id===(currentPuzzle?.id||0));loadPuzzle(PUZZLES[(idx+1)%PUZZLES.length]);}
function markPuzzleDone(id){let done=JSON.parse(localStorage.getItem('cm_pdone')||'[]');if(!done.includes(id)){done.push(id);localStorage.setItem('cm_pdone',JSON.stringify(done));}}

/* ═══════════════════════════════════════════════════════
   CHESS ENGINE
═══════════════════════════════════════════════════════ */
const SYM={K:{w:'♔',b:'♚'},Q:{w:'♕',b:'♛'},R:{w:'♖',b:'♜'},B:{w:'♗',b:'♝'},N:{w:'♘',b:'♞'},P:{w:'♙',b:'♟'}};
let board,turn,sel,vmoves,epTgt,castle,over,hist,cap,lastMv,mode;
let peer=null,conn=null,onlineRole=null,myOnlineColor=null,currentRoomCode=null,onlineConnected=false;

function newGame(){
  board=Array(8).fill(0).map(()=>Array(8).fill(null));
  const back=['R','N','B','Q','K','B','N','R'];
  for(let c=0;c<8;c++){board[0][c]={t:back[c],cl:'b'};board[1][c]={t:'P',cl:'b'};board[6][c]={t:'P',cl:'w'};board[7][c]={t:back[c],cl:'w'};}
  turn='w';sel=null;vmoves=[];epTgt=null;castle={w:{k:true,q:true},b:{k:true,q:true}};
  over=false;hist=[];cap={w:[],b:[]};lastMv=null;
  resetClock();moveKeys=[];
  const onEl=document.getElementById('opening-name');if(onEl){onEl.textContent='';onEl.style.display='none';}
  if(puzzleMode){puzzleMode=false;document.getElementById('puzzle-panel')?.classList.remove('active');}
  const eloChg=document.getElementById('elo-change');if(eloChg)eloChg.style.display='none';
  updateEloDisplay();
  render();setStatus(t('whiteTurn'));dots();updateHist();updateCap();
  document.getElementById('overlay')?.classList.remove('show');
  updateGameUI();
  showDifficultyBar(mode==='ai');
  if(mode==='ai')initStockfish();
  if(mode==='online'&&myOnlineColor==='b'){flipped_=true;render();}else if(mode!=='online'){flipped_=false;render();}
  playSound('start');
}

function showDifficultyBar(show){
  const bar=document.getElementById('diff-bar');
  if(bar)bar.style.display=show?'flex':'none';
}

function setMode(m){
  mode=m;
  document.getElementById('btn-h')?.classList.toggle('active',m==='human');
  document.getElementById('btn-a')?.classList.toggle('active',m==='ai');
  showChatBtn(false);
  newGame();
}

function updateGameUI(){
  if(!document.getElementById('board'))return;
  const bh=document.getElementById('btn-h'),ba=document.getElementById('btn-a');
  if(bh)bh.textContent=t('twoPlayers');if(ba)ba.textContent=t('vsAI');
  updateFSBtn();
  const wn=document.getElementById('pname-w'),bn=document.getElementById('pname-b');
  if(wn)wn.textContent='♔ '+t('white');if(bn)bn.textContent='♚ '+t('black');
  const ht=document.getElementById('hist-title');if(ht)ht.textContent=t('moveHistory');
  checkState_display();
}

/* ── MOVE GENERATION ── */
function inB(r,c){return r>=0&&r<8&&c>=0&&c<8;}
function rawMoves(r,c,bd,ep,cs){
  const p=bd[r][c];if(!p)return[];const{t:type,cl}=p;const en=cl==='w'?'b':'w';const moves=[];
  const add=(tr,tc)=>{if(inB(tr,tc)){const q=bd[tr][tc];if(!q||q.cl===en)moves.push([tr,tc]);}};
  const slide=(dr,dc)=>{let tr=r+dr,tc=c+dc;while(inB(tr,tc)){const q=bd[tr][tc];if(!q){moves.push([tr,tc]);}else{if(q.cl===en)moves.push([tr,tc]);break;}tr+=dr;tc+=dc;}};
  if(type==='P'){const d=cl==='w'?-1:1,sr=cl==='w'?6:1;if(inB(r+d,c)&&!bd[r+d][c]){moves.push([r+d,c]);if(r===sr&&!bd[r+2*d][c])moves.push([r+2*d,c]);}for(const dc of[-1,1]){const tr=r+d,tc=c+dc;if(inB(tr,tc)){if(bd[tr][tc]?.cl===en)moves.push([tr,tc]);if(ep&&ep[0]===tr&&ep[1]===tc)moves.push([tr,tc]);}}}
  if(type==='N')for(const[dr,dc]of[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]])add(r+dr,c+dc);
  if(type==='B'||type==='Q')for(const[dr,dc]of[[-1,-1],[-1,1],[1,-1],[1,1]])slide(dr,dc);
  if(type==='R'||type==='Q')for(const[dr,dc]of[[-1,0],[1,0],[0,-1],[0,1]])slide(dr,dc);
  if(type==='K'){for(const[dr,dc]of[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]])add(r+dr,c+dc);const row=cl==='w'?7:0;if(r===row&&c===4&&cs[cl]){if(cs[cl].k&&!bd[row][5]&&!bd[row][6]&&bd[row][7]?.t==='R')moves.push([row,6]);if(cs[cl].q&&!bd[row][3]&&!bd[row][2]&&!bd[row][1]&&bd[row][0]?.t==='R')moves.push([row,2]);}}
  return moves;
}
function attacked(r,c,byCl,bd){const cs={w:{k:false,q:false},b:{k:false,q:false}};for(let br=0;br<8;br++)for(let bc=0;bc<8;bc++){const p=bd[br][bc];if(p&&p.cl===byCl&&rawMoves(br,bc,bd,null,cs).some(([mr,mc])=>mr===r&&mc===c))return true;}return false;}
function kingPos(cl,bd){for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(bd[r][c]?.t==='K'&&bd[r][c]?.cl===cl)return[r,c];return null;}
function inCheck(cl,bd){const k=kingPos(cl,bd);return k?attacked(k[0],k[1],cl==='w'?'b':'w',bd):false;}
function legalMoves(r,c){
  const p=board[r][c];if(!p)return[];
  return rawMoves(r,c,board,epTgt,castle).filter(([tr,tc])=>{
    if(p.t==='K'&&Math.abs(tc-c)===2){const en=p.cl==='w'?'b':'w';if(attacked(r,c,en,board)||attacked(r,c+(tc>c?1:-1),en,board))return false;}
    const nb=board.map(row=>row.map(x=>x?{...x}:null));
    const isEP=p.t==='P'&&epTgt&&tr===epTgt[0]&&tc===epTgt[1]&&!board[tr][tc];
    nb[tr][tc]=nb[r][c];nb[r][c]=null;
    if(isEP)nb[p.cl==='w'?tr+1:tr-1][tc]=null;
    if(p.t==='K'&&Math.abs(tc-c)===2){if(tc===6){nb[r][5]=nb[r][7];nb[r][7]=null;}else{nb[r][3]=nb[r][0];nb[r][0]=null;}}
    return!inCheck(p.cl,nb);
  });
}
function anyLegal(cl){for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(board[r][c]?.cl===cl&&legalMoves(r,c).length>0)return true;return false;}

/* ── EXECUTE MOVE ── */
const FILES='abcdefgh',RANKS='87654321';
function execMove(fr,fc,tr,tc,promo,fromPeer=false){
  const p=board[fr][fc],captured=board[tr][tc];
  const isEP=p.t==='P'&&epTgt&&tr===epTgt[0]&&tc===epTgt[1]&&!board[tr][tc];
  let note='';
  if(p.t!=='P')note+=p.t;else if(captured||isEP)note+=FILES[fc];
  if(captured||isEP)note+='x';
  note+=FILES[tc]+RANKS[tr];
  const snap=board.map(row=>row.map(x=>x?{...x}:null));
  if(captured)cap[p.cl].push(captured.t);
  
  // ── ANIMATION ──
  animatePieceMove(fr,fc,tr,tc,()=>{});
  
  board[tr][tc]=board[fr][fc];board[fr][fc]=null;
  if(isEP){const cr=p.cl==='w'?tr+1:tr-1;cap[p.cl].push('P');board[cr][tc]=null;}
  if(p.t==='K'&&Math.abs(tc-fc)===2){if(tc===6){board[fr][5]=board[fr][7];board[fr][7]=null;note='O-O';}else{board[fr][3]=board[fr][0];board[fr][0]=null;note='O-O-O';}}
  epTgt=null;if(p.t==='P'&&Math.abs(tr-fr)===2)epTgt=[(fr+tr)/2,tc];
  if(p.t==='K'){castle[p.cl].k=false;castle[p.cl].q=false;}
  if(p.t==='R'){if(fc===0)castle[p.cl].q=false;if(fc===7)castle[p.cl].k=false;}
  if(p.t==='P'&&(tr===0||tr===7)){
    if(promo){board[tr][tc]={t:promo,cl:p.cl};note+='='+promo;}
    else{lastMv={from:[fr,fc],to:[tr,tc]};hist.push({snap,fr,fc,tr,tc,p:{...p},cap:captured?{...captured}:null,isEP,ep:epTgt,cs:JSON.parse(JSON.stringify(castle)),note});render();updateHist();showPromo(p.cl,tr,tc,fr,fc,fromPeer);return;}
  }
  if(mode==='online'&&!fromPeer)sendMoveOnline(fr,fc,tr,tc,promo||null);
  hist.push({snap,fr,fc,tr,tc,p:{...p},cap:captured?{...captured}:null,isEP,ep:epTgt,cs:JSON.parse(JSON.stringify(castle)),note});
  lastMv={from:[fr,fc],to:[tr,tc]};turn=turn==='w'?'b':'w';sel=null;vmoves=[];
  const wasCastle=p.t==='K'&&Math.abs(tc-fc)===2;
  const wasCapture=!!captured||isEP;
  if(!puzzleSolved){if(wasCastle)playSound('castle');else if(wasCapture)playSound('capture');else playSound('move');}
  if(!puzzleMode)switchClock();
  if(!puzzleMode&&!fromPeer){moveKeys.push(`${fr}${fc}${tr}${tc}`);if(moveKeys.length<=10)updateOpeningDisplay();}
  render();updateHist();updateCap();checkState();
  if(mode==='ai'&&turn==='b'&&!over)setTimeout(doAIMove,400);
}

function showPromo(cl,r,c,fr,fc,fromPeer=false){
  const row=document.getElementById('promo-row');if(!row)return;
  row.innerHTML='';const pt=document.getElementById('promo-title');if(pt)pt.textContent=t('choosePromo');
  for(const type of['Q','R','B','N']){
    const d=document.createElement('div');d.className='promo-p';d.textContent=SYM[type][cl];d.style.color=cl==='w'?'var(--white-piece)':'var(--black-piece)';
    d.onclick=()=>{board[r][c]={t:type,cl};if(mode==='online'&&!fromPeer)sendMoveOnline(fr,fc,r,c,type);document.getElementById('promo-wrap')?.classList.remove('show');turn=turn==='w'?'b':'w';sel=null;vmoves=[];playSound('promo');render();updateHist();updateCap();checkState();if(mode==='ai'&&turn==='b'&&!over)setTimeout(doAIMove,400);};
    row.appendChild(d);
  }
  document.getElementById('promo-wrap')?.classList.add('show');
}

function checkState(){
  const chk=inCheck(turn,board),has=anyLegal(turn);
  if(!has){
    over=true;stopClock();
    if(chk){const w=turn==='w'?t('black'):t('white');document.getElementById('ov-title').textContent=t('checkmate');document.getElementById('ov-msg').textContent=w+' '+t('winsGame');setStatus(t('checkmate')+' '+w+' '+t('winsGame'));playSound('checkmate');setTimeout(()=>updateEloAfterGame(turn==='w'?'b':'w'),500);}
    else{document.getElementById('ov-title').textContent=t('stalemate');document.getElementById('ov-msg').textContent=t('drawMsg');setStatus(t('stalemate'));playSound('draw');setTimeout(()=>updateEloAfterGame('draw'),500);}
    setTimeout(()=>document.getElementById('overlay')?.classList.add('show'),700);
  }else if(chk){playSound('check');setStatus(turn==='w'?t('whiteCheck'):t('blackCheck'));}
  else setStatus(turn==='w'?t('whiteTurn'):t('blackTurn'));
  dots();
}
function checkState_display(){if(!board||over)return;if(inCheck(turn,board))setStatus(turn==='w'?t('whiteCheck'):t('blackCheck'));else setStatus(turn==='w'?t('whiteTurn'):t('blackTurn'));}

/* ═══════════════════════════════════════════════════════
   ENHANCED AI ENGINE
═══════════════════════════════════════════════════════ */
const PV={P:100,N:320,B:330,R:500,Q:900,K:20000};
// Piece-square tables for all pieces (white perspective)
const PST={
  P:[[0,0,0,0,0,0,0,0],[50,50,50,50,50,50,50,50],[10,10,20,30,30,20,10,10],[5,5,10,25,25,10,5,5],[0,0,0,20,20,0,0,0],[5,-5,-10,0,0,-10,-5,5],[5,10,10,-20,-20,10,10,5],[0,0,0,0,0,0,0,0]],
  N:[[-50,-40,-30,-30,-30,-30,-40,-50],[-40,-20,0,0,0,0,-20,-40],[-30,0,10,15,15,10,0,-30],[-30,5,15,20,20,15,5,-30],[-30,0,15,20,20,15,0,-30],[-30,5,10,15,15,10,5,-30],[-40,-20,0,5,5,0,-20,-40],[-50,-40,-30,-30,-30,-30,-40,-50]],
  B:[[-20,-10,-10,-10,-10,-10,-10,-20],[-10,0,0,0,0,0,0,-10],[-10,0,5,10,10,5,0,-10],[-10,5,5,10,10,5,5,-10],[-10,0,10,10,10,10,0,-10],[-10,10,10,10,10,10,10,-10],[-10,5,0,0,0,0,5,-10],[-20,-10,-10,-10,-10,-10,-10,-20]],
  R:[[0,0,0,0,0,0,0,0],[5,10,10,10,10,10,10,5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[0,0,0,5,5,0,0,0]],
  Q:[[-20,-10,-10,-5,-5,-10,-10,-20],[-10,0,0,0,0,0,0,-10],[-10,0,5,5,5,5,0,-10],[-5,0,5,5,5,5,0,-5],[0,0,5,5,5,5,0,-5],[-10,5,5,5,5,5,0,-10],[-10,0,5,0,0,0,0,-10],[-20,-10,-10,-5,-5,-10,-10,-20]],
  K:[[-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30],[-20,-30,-30,-40,-40,-30,-30,-20],[-10,-20,-20,-20,-20,-20,-20,-10],[20,20,0,0,0,0,20,20],[20,30,10,0,0,10,30,20]]
};

function evalBoard(){
  let s=0;
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){
    const p=board[r][c];if(!p)continue;
    let v=PV[p.t];
    const pst=PST[p.t];
    if(pst)v+=p.cl==='w'?pst[r][c]:pst[7-r][c];
    s+=p.cl==='w'?v:-v;
  }
  return s;
}

function allMoves(cl){const ms=[];for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(board[r][c]?.cl===cl)for(const[tr,tc]of legalMoves(r,c))ms.push([r,c,tr,tc]);return ms;}

function simMove(fr,fc,tr,tc){
  const p=board[fr][fc];if(!p)return;
  const isEP=p.t==='P'&&epTgt&&tr===epTgt[0]&&tc===epTgt[1]&&!board[tr][tc];
  board[tr][tc]=board[fr][fc];board[fr][fc]=null;
  if(isEP)board[p.cl==='w'?tr+1:tr-1][tc]=null;
  if(p.t==='K'&&Math.abs(tc-fc)===2){if(tc===6){board[fr][5]=board[fr][7];board[fr][7]=null;}else{board[fr][3]=board[fr][0];board[fr][0]=null;}}
  epTgt=null;if(p.t==='P'&&Math.abs(tr-fr)===2)epTgt=[(fr+tr)/2,tc];
  if(p.t==='K'){castle[p.cl].k=false;castle[p.cl].q=false;}
  if(p.t==='P'&&(tr===0||tr===7))board[tr][tc]={t:'Q',cl:p.cl};
  turn=turn==='w'?'b':'w';
}

// Move ordering: captures first
function sortMoves(ms){
  return ms.sort((a,b)=>{const ca=board[a[2]][a[3]],cb=board[b[2]][b[3]];return(cb?PV[cb.t]:0)-(ca?PV[ca.t]:0);});
}

function minimax(depth,alpha,beta,max){
  if(depth===0)return evalBoard();
  const cl=max?'w':'b';const ms=sortMoves(allMoves(cl));
  if(!ms.length)return inCheck(cl,board)?(max?-99999:99999):0;
  if(max){let best=-Infinity;for(const[fr,fc,tr,tc]of ms){const sb=board.map(r=>r.map(x=>x?{...x}:null)),se=epTgt?[...epTgt]:null,sc=JSON.parse(JSON.stringify(castle)),st=turn;simMove(fr,fc,tr,tc);best=Math.max(best,minimax(depth-1,alpha,beta,false));board=sb;epTgt=se;castle=sc;turn=st;alpha=Math.max(alpha,best);if(beta<=alpha)break;}return best;}
  else{let best=Infinity;for(const[fr,fc,tr,tc]of ms){const sb=board.map(r=>r.map(x=>x?{...x}:null)),se=epTgt?[...epTgt]:null,sc=JSON.parse(JSON.stringify(castle)),st=turn;simMove(fr,fc,tr,tc);best=Math.min(best,minimax(depth-1,alpha,beta,true));board=sb;epTgt=se;castle=sc;turn=st;beta=Math.min(beta,best);if(beta<=alpha)break;}return best;}
}

async function doAIMove(){
  if(over||turn!=='b')return;
  const ms=allMoves('b');if(!ms.length)return;
  setStatus('🤖 Thinking…');
  await delay(30);
  
  // Random moves for low difficulty
  if(Math.random()<getRandomness()){
    const mv=ms[Math.floor(Math.random()*ms.length)];
    await delay(200+Math.random()*400);
    if(!over&&turn==='b')execMove(mv[0],mv[1],mv[2],mv[3],'Q');
    return;
  }
  
  // Try Stockfish for high difficulty
  if(aiDifficulty>=7&&sfReady&&sfWorker){
    try{
      const fen=boardToFEN();
      const depth=getSearchDepth();
      const mv=await Promise.race([sfSearch(fen,depth,2000+aiDifficulty*300),delay(8000).then(()=>null)]);
      if(mv&&!over&&turn==='b'){const m=sfMoveToIdx(mv);if(m&&!over&&turn==='b'){execMove(m.fr,m.fc,m.tr,m.tc,m.promo||'Q');return;}}
    }catch(e){}
  }
  
  // Enhanced minimax fallback
  const depth=Math.min(getSearchDepth(),aiDifficulty>=5?3:2);
  let best=null,bestV=Infinity;
  for(const[fr,fc,tr,tc]of sortMoves([...ms])){
    const sb=board.map(r=>r.map(x=>x?{...x}:null)),se=epTgt?[...epTgt]:null,sc=JSON.parse(JSON.stringify(castle)),st=turn;
    simMove(fr,fc,tr,tc);const v=minimax(depth-1,-Infinity,Infinity,true);
    board=sb;epTgt=se;castle=sc;turn=st;
    if(v<bestV){bestV=v;best=[fr,fc,tr,tc];}
  }
  if(best&&!over&&turn==='b')execMove(best[0],best[1],best[2],best[3],'Q');
}

function delay(ms){return new Promise(r=>setTimeout(r,ms));}

/* ── UNDO ── */
function undoMove(){
  if(!hist.length)return;
  const steps=mode==='ai'?2:1;
  for(let i=0;i<steps&&hist.length;i++){const h=hist.pop();board=h.snap;epTgt=h.ep;castle=h.cs;turn=h.p.cl;if(h.cap)cap[h.p.cl].pop();if(h.isEP)cap[h.p.cl].pop();}
  over=false;
  if(moveKeys.length>0)moveKeys.splice(mode==='ai'?-2:-1,mode==='ai'?2:1);
  updateOpeningDisplay();
  lastMv=hist.length?{from:[hist[hist.length-1].fr,hist[hist.length-1].fc],to:[hist[hist.length-1].tr,hist[hist.length-1].tc]}:null;
  sel=null;vmoves=[];render();updateHist();updateCap();dots();
  setStatus(turn==='w'?t('whiteTurn'):t('blackTurn'));
  document.getElementById('overlay')?.classList.remove('show');
}

/* ═══════════════════════════════════════════════════════
   NEW: POST-GAME ANALYSIS
═══════════════════════════════════════════════════════ */
let analysisData=[];
async function analyzeGame(){
  if(!hist.length){alert('No moves to analyze!');return;}
  const panel=document.getElementById('analysis-panel');
  if(panel)panel.style.display='block';
  const list=document.getElementById('analysis-list');
  if(list)list.innerHTML='<div class="analysis-loading">🔍 Analyzing game…</div>';
  
  analysisData=[];
  // Replay all positions and evaluate
  const savedBoard=board.map(r=>r.map(x=>x?{...x}:null));
  const savedTurn=turn,savedEp=epTgt?[...epTgt]:null,savedCastle=JSON.parse(JSON.stringify(castle));
  const savedOver=over;
  
  // Reset to start
  board=Array(8).fill(0).map(()=>Array(8).fill(null));
  const back=['R','N','B','Q','K','B','N','R'];
  for(let c=0;c<8;c++){board[0][c]={t:back[c],cl:'b'};board[1][c]={t:'P',cl:'b'};board[6][c]={t:'P',cl:'w'};board[7][c]={t:back[c],cl:'w'};}
  turn='w';epTgt=null;castle={w:{k:true,q:true},b:{k:true,q:true}};
  
  for(let i=0;i<hist.length;i++){
    const h=hist[i];
    const prevEval=evalBoard();
    simMove(h.fr,h.fc,h.tr,h.tc);
    const postEval=evalBoard();
    const delta=h.p.cl==='w'?(postEval-prevEval):(prevEval-postEval);
    let annotation='';
    if(delta>200)annotation='!!';
    else if(delta>50)annotation='!';
    else if(delta<-200)annotation='??';
    else if(delta<-50)annotation='?';
    else if(delta<-20)annotation='?!';
    analysisData.push({note:h.note,cl:h.p.cl,delta,annotation});
  }
  
  // Restore board
  board=savedBoard;turn=savedTurn;epTgt=savedEp;castle=savedCastle;over=savedOver;
  
  // Display results
  if(list){
    list.innerHTML='<div class="analysis-header">Move Analysis</div>'+
      analysisData.map((a,i)=>{
        const color=a.annotation==='!!'?'#ffd700':a.annotation==='!'?'#6dcc8a':a.annotation==='??'?'#e06060':a.annotation==='?'?'#e07050':a.annotation==='?!'?'#d0a050':'var(--text-dim)';
        return`<div class="analysis-row ${a.cl==='w'?'w-move':'b-move'}"><span class="an-num">${Math.floor(i/2)+1}${a.cl==='w'?'.':''}</span><span class="an-note">${a.note}</span><span class="an-ann" style="color:${color};font-weight:700">${a.annotation}</span></div>`;
      }).join('')+
      `<div class="analysis-summary">
        <span>✅ Excellent: ${analysisData.filter(a=>a.annotation==='!!').length}</span>
        <span>👍 Good: ${analysisData.filter(a=>a.annotation==='!').length}</span>
        <span>⚠️ Mistakes: ${analysisData.filter(a=>a.annotation==='?!').length}</span>
        <span>❌ Blunders: ${analysisData.filter(a=>a.annotation==='??' ||a.annotation==='?').length}</span>
      </div>`;
  }
}
function closeAnalysis(){const p=document.getElementById('analysis-panel');if(p)p.style.display='none';}

/* ═══════════════════════════════════════════════════════
   NEW: DRAG & DROP
═══════════════════════════════════════════════════════ */
let dragState=null;

function startDrag(e,r,c){
  if(over)return;
  if(puzzleMode&&board[r][c]?.cl!==turn)return;
  if(mode==='ai'&&turn!=='w')return;
  if(mode==='online'&&(!onlineConnected||turn!==myOnlineColor))return;
  const p=board[r][c];if(!p||p.cl!==turn)return;
  e.preventDefault();
  sel=[r,c];vmoves=legalMoves(r,c);render();
  const pos=e.touches?{x:e.touches[0].clientX,y:e.touches[0].clientY}:{x:e.clientX,y:e.clientY};
  const ghost=document.createElement('span');
  ghost.className='drag-ghost piece '+(p.cl==='w'?'wp':'bp');
  ghost.textContent=SYM[p.t][p.cl];
  ghost.style.left=(pos.x-28)+'px';ghost.style.top=(pos.y-28)+'px';
  document.body.appendChild(ghost);
  dragState={r,c,ghost};
  const onMove=ev=>{ev.preventDefault();const pt=ev.touches?ev.touches[0]:ev;ghost.style.left=(pt.clientX-28)+'px';ghost.style.top=(pt.clientY-28)+'px';const el=document.elementFromPoint(pt.clientX,pt.clientY);document.querySelectorAll('.sq.drag-hover').forEach(s=>s.classList.remove('drag-hover'));el?.closest('.sq')?.classList.add('drag-hover');};
  const onEnd=ev=>{
    ev.preventDefault();
    const pt=ev.changedTouches?ev.changedTouches[0]:ev;
    ghost.remove();document.querySelectorAll('.sq.drag-hover').forEach(s=>s.classList.remove('drag-hover'));
    const el=document.elementFromPoint(pt.clientX,pt.clientY);
    const sqEl=el?.closest('.sq');
    if(sqEl){
      const all=[...sqEl.parentNode.children];const idx=all.indexOf(sqEl);
      const dr=Math.floor(idx/8),dc=idx%8;
      const tr=flipped_?7-dr:dr,tc=flipped_?7-dc:dc;
      if(dragState&&vmoves.some(([mr,mc])=>mr===tr&&mc===tc)){
        if(puzzleMode)handlePuzzleClick(tr,tc);else if(!over&&!document.getElementById('promo-wrap')?.classList.contains('show'))execMove(dragState.r,dragState.c,tr,tc,null);
      }else{sel=null;vmoves=[];render();}
    }else{sel=null;vmoves=[];render();}
    dragState=null;
    document.removeEventListener('mousemove',onMove);document.removeEventListener('mouseup',onEnd);document.removeEventListener('touchmove',onMove);document.removeEventListener('touchend',onEnd);
  };
  document.addEventListener('mousemove',onMove,{passive:false});document.addEventListener('mouseup',onEnd);
  document.addEventListener('touchmove',onMove,{passive:false});document.addEventListener('touchend',onEnd);
}

/* ═══════════════════════════════════════════════════════
   NEW: PIECE ANIMATION
═══════════════════════════════════════════════════════ */
function animatePieceMove(fr,fc,tr,tc,cb){
  try{
    const boardEl=document.getElementById('board');if(!boardEl){cb();return;}
    const getDr=r=>flipped_?7-r:r,getDc=c=>flipped_?7-c:c;
    const fromSq=boardEl.children[getDr(fr)*8+getDc(fc)];
    const toSq=boardEl.children[getDr(tr)*8+getDc(tc)];
    if(!fromSq||!toSq){cb();return;}
    const p=board[fr][fc];if(!p){cb();return;}
    const fR=fromSq.getBoundingClientRect(),tR=toSq.getBoundingClientRect();
    const cl=document.createElement('span');
    cl.className='piece anim-piece '+(p.cl==='w'?'wp':'bp');
    cl.textContent=SYM[p.t][p.cl];
    cl.style.cssText=`position:fixed;left:${fR.left+fR.width/2}px;top:${fR.top+fR.height/2}px;transform:translate(-50%,-50%);pointer-events:none;z-index:999;transition:left .12s ease-out,top .12s ease-out;font-size:${fR.width*0.65}px;`;
    document.body.appendChild(cl);
    requestAnimationFrame(()=>{requestAnimationFrame(()=>{cl.style.left=(tR.left+tR.width/2)+'px';cl.style.top=(tR.top+tR.height/2)+'px';setTimeout(()=>cl.remove(),130);cb();});});
  }catch(e){cb();}
}

/* ── RENDER ── */
let flipped_=false;
function flipBoard(){flipped_=!flipped_;render();}
function render(){
  const el=document.getElementById('board');if(!el)return;
  el.innerHTML='';
  const chkCl=inCheck(turn,board)?turn:null;
  const kp=chkCl?kingPos(chkCl,board):null;
  for(let dr=0;dr<8;dr++)for(let dc=0;dc<8;dc++){
    const r=flipped_?7-dr:dr,c=flipped_?7-dc:dc;
    const sq=document.createElement('div');sq.className='sq '+((r+c)%2===0?'light':'dark');
    if(lastMv&&((r===lastMv.from[0]&&c===lastMv.from[1])||(r===lastMv.to[0]&&c===lastMv.to[1])))sq.classList.add('last-move');
    if(sel&&sel[0]===r&&sel[1]===c)sq.classList.add('selected');
    if(vmoves.some(([mr,mc])=>mr===r&&mc===c)){if(board[r][c]||(epTgt&&r===epTgt[0]&&c===epTgt[1]))sq.classList.add('ring');else sq.classList.add('dot');}
    if(kp&&r===kp[0]&&c===kp[1])sq.classList.add('in-check');
    // Coordinate labels on edges
    if(dc===0){const lbl=document.createElement('span');lbl.className='coord-r';lbl.textContent=flipped_?r+1:8-r;sq.appendChild(lbl);}
    if(dr===7){const lbl=document.createElement('span');lbl.className='coord-f';lbl.textContent=FILES[flipped_?7-c:c];sq.appendChild(lbl);}
    const p=board[r][c];
    if(p){
      const sp=document.createElement('span');sp.className='piece '+(p.cl==='w'?'wp':'bp');
      if(lastMv&&r===lastMv.to[0]&&c===lastMv.to[1])sp.classList.add('just-moved');
      sp.textContent=SYM[p.t][p.cl];sq.appendChild(sp);
      // Drag
      sq.addEventListener('mousedown',e=>{if(e.button===0)startDrag(e,r,c);},{passive:false});
      sq.addEventListener('touchstart',e=>startDrag(e,r,c),{passive:false});
    }
    sq.addEventListener('click',()=>handleClick(r,c));
    el.appendChild(sq);
  }
}

function handleClick(r,c){
  if(dragState)return; // handled by drag
  if(puzzleMode){handlePuzzleClick(r,c);return;}
  if(over||document.getElementById('promo-wrap')?.classList.contains('show'))return;
  if(mode==='online'){if(!onlineConnected)return;if(turn!==myOnlineColor)return;}
  const p=board[r][c];
  if(sel){if(vmoves.some(([mr,mc])=>mr===r&&mc===c)){execMove(sel[0],sel[1],r,c,null);return;}}
  if(p&&p.cl===turn){sel=[r,c];vmoves=legalMoves(r,c);render();}else{sel=null;vmoves=[];render();}
}

/* ── UI ── */
function setStatus(m){const el=document.getElementById('status');if(el)el.textContent=m;}
function dots(){document.getElementById('dot-w')?.classList.toggle('lit',turn==='w'&&!over);document.getElementById('dot-b')?.classList.toggle('lit',turn==='b'&&!over);updateClockDisplay();}
const PO=['Q','R','B','N','P'];
function updateCap(){const wc=document.getElementById('cap-w'),bc=document.getElementById('cap-b');if(wc)wc.innerHTML=cap.w.sort((a,b)=>PO.indexOf(a)-PO.indexOf(b)).map(t2=>`<span style="color:#bbb">${SYM[t2].b}</span>`).join('');if(bc)bc.innerHTML=cap.b.sort((a,b)=>PO.indexOf(a)-PO.indexOf(b)).map(t2=>`<span style="color:var(--white-piece)">${SYM[t2].w}</span>`).join('');}
function updateHist(){
  const el=document.getElementById('hist');if(!el)return;
  el.innerHTML='';let n=1;
  for(let i=0;i<hist.length;i++){
    const d=document.createElement('div');d.className='hm'+(hist[i].p.cl==='w'?' w':'');
    d.textContent=hist[i].p.cl==='w'?n+'. '+hist[i].note:hist[i].note;
    if(hist[i].p.cl==='b')n++;
    el.appendChild(d);
  }
  el.scrollTop=el.scrollHeight;
}

/* ═══════════════════════════════════════════════════════
   ONLINE MULTIPLAYER
═══════════════════════════════════════════════════════ */
function genCode(){const c='ABCDEFGHJKLMNPQRSTUVWXYZ2345679';let s='';for(let i=0;i<6;i++)s+=c[Math.floor(Math.random()*c.length)];return s;}
function peerId(code){return 'cm25-'+code.toLowerCase();}

function openOnlinePanel(){mode='online';['btn-h','btn-a'].forEach(id=>document.getElementById(id)?.classList.remove('active'));document.getElementById('btn-o')?.classList.add('active');showOStep('choose');document.getElementById('online-panel')?.classList.add('show');showChatBtn(false);}
function showOStep(s){['choose','create','join','connecting'].forEach(n=>{const el=document.getElementById('ostep-'+n);if(el)el.style.display=n===s?'flex':'none';});document.getElementById('online-err').textContent='';}
function cancelOnline(){if(peer){peer.destroy();peer=null;}conn=null;onlineRole=null;myOnlineColor=null;onlineConnected=false;currentRoomCode=null;mode='human';document.getElementById('btn-h')?.classList.add('active');document.getElementById('btn-o')?.classList.remove('active');document.getElementById('online-panel')?.classList.remove('show');setOnlineBadge('','');showChatBtn(false);}
function doCreateRoom(){mode='online';document.getElementById('online-panel')?.classList.add('show');showOStep('create');const code=genCode();currentRoomCode=code;onlineRole='host';myOnlineColor='w';document.getElementById('room-code-display').textContent=code;if(peer)peer.destroy();peer=new Peer(peerId(code),{debug:0});peer.on('open',()=>{});peer.on('connection',c=>{conn=c;setupConn();c.on('open',()=>{mode='online';c.send({type:'ready',color:'b'});document.getElementById('online-panel')?.classList.remove('show');onlineConnected=true;newGame();setOnlineBadge('🟢 Connected · You are White','#6dcc8a');showChatBtn(true);});});peer.on('error',err=>{const msg=err.type==='unavailable-id'?'Room code taken — try again.':'Error: '+err.message;document.getElementById('online-err').textContent=msg;showOStep('choose');});}
function doJoinRoom(){mode='online';const inp=document.getElementById('join-input');const code=(inp?.value||'').trim().toUpperCase();if(code.length!==6){document.getElementById('online-err').textContent='Please enter a 6-character code.';return;}showOStep('connecting');const cc=document.getElementById('connecting-code');if(cc)cc.textContent=code;currentRoomCode=code;onlineRole='guest';myOnlineColor='b';if(peer)peer.destroy();peer=new Peer({debug:0});peer.on('open',()=>{conn=peer.connect(peerId(code),{reliable:true});setupConn();conn.on('error',()=>{document.getElementById('online-err').textContent='Could not connect.';showOStep('join');});setTimeout(()=>{if(!onlineConnected){document.getElementById('online-err').textContent='Connection timed out.';showOStep('join');}},10000);});peer.on('error',err=>{document.getElementById('online-err').textContent='Error: '+err.message;showOStep('join');});}
function setupConn(){if(!conn)return;conn.on('data',data=>{if(data.type==='ready'){mode='online';document.getElementById('online-panel')?.classList.remove('show');onlineConnected=true;newGame();setOnlineBadge('🟢 Connected · You are Black','#6dcc8a');showChatBtn(true);}else if(data.type==='move')execMove(data.fr,data.fc,data.tr,data.tc,data.promo||null,true);else if(data.type==='newgame'){if(confirm('Opponent wants a new game. Accept?')){newGame();conn.send({type:'newgame-ok'});}}else if(data.type==='newgame-ok')newGame();else if(data.type==='chat'){addChatMsg('Opponent',data.msg);if(!document.getElementById('chat-panel')?.classList.contains('open')){const b=document.getElementById('chat-badge');if(b)b.style.display='inline';}}else if(data.type==='draw-offer'){if(!over&&confirm('Opponent offers a draw. Accept?')){conn.send({type:'draw-accept'});acceptDraw();}else conn.send({type:'draw-decline'});}else if(data.type==='draw-accept')acceptDraw();else if(data.type==='draw-decline'){setStatus('Draw declined.');setTimeout(()=>{if(!over)setStatus(turn==='w'?t('whiteTurn'):t('blackTurn'));},2000);}else if(data.type==='resign'){over=true;stopClock();document.getElementById('ov-title').textContent='🏳️ Opponent Resigned!';document.getElementById('ov-msg').textContent=(myOnlineColor==='w'?t('white'):t('black'))+' wins!';setStatus('Opponent resigned — you win!');setTimeout(()=>document.getElementById('overlay')?.classList.add('show'),300);playSound('promo');}});conn.on('close',()=>{onlineConnected=false;setOnlineBadge('🔴 Opponent disconnected','#e06060');setStatus('Opponent disconnected.');showChatBtn(false);});conn.on('error',()=>{setOnlineBadge('🔴 Connection error','#e06060');});}
function sendMoveOnline(fr,fc,tr,tc,promo){if(conn&&conn.open)conn.send({type:'move',fr,fc,tr,tc,promo:promo||null});}
function copyCode(){const code=document.getElementById('room-code-display')?.textContent||'';const btn=document.getElementById('copy-btn');navigator.clipboard.writeText(code).then(()=>{if(btn){btn.textContent='✅ Copied!';setTimeout(()=>btn.textContent='📋 Copy Code',2000);}}).catch(()=>{try{prompt('Copy this room code:',code);}catch(e){}});}
function setOnlineBadge(msg,color){const el=document.getElementById('online-badge');if(!el)return;el.textContent=msg;el.style.color=color||'var(--text-mid)';el.style.display=msg?'block':'none';}

/* ── QUICK MATCH ── */
let qmPeer=null,qmConn=null,qmTimerInt=null,qmSeconds=0,qmActive=false;
function qmSlotId(){return 'cm25-qm-'+Math.floor(Date.now()/30000);}
function setQmStatus(msg){const el=document.getElementById('qm-status');if(el)el.textContent=msg;}
function openQuickMatch(){['btn-h','btn-a','btn-o'].forEach(id=>document.getElementById(id)?.classList.remove('active'));document.getElementById('btn-qm')?.classList.add('active');mode='online';qmActive=true;qmSeconds=0;clearInterval(qmTimerInt);qmTimerInt=setInterval(()=>{qmSeconds++;const m=Math.floor(qmSeconds/60),s=qmSeconds%60;const el=document.getElementById('qm-timer');if(el)el.textContent=m+':'+(s<10?'0':'')+s;},1000);document.getElementById('qm-overlay')?.classList.add('show');setQmStatus('Looking for a player…');qmSearch();}
function qmSearch(){if(!qmActive)return;if(qmPeer){try{qmPeer.destroy();}catch(e){}qmPeer=null;}const slotId=qmSlotId();setQmStatus('Scanning for opponents…');const p=new Peer(slotId,{debug:0});qmPeer=p;p.on('open',()=>{if(!qmActive){p.destroy();return;}setQmStatus('Waiting for another player…');p.on('connection',c=>{if(!qmActive){p.destroy();return;}qmConn=c;c.on('open',()=>{c.send({type:'qm-ready',color:'b'});qmMatchFound('w');});});setTimeout(()=>{if(qmActive&&!qmConn)qmSearch();},28000);});p.on('error',err=>{if(!qmActive)return;if(err.type==='unavailable-id'){setQmStatus('Opponent found! Connecting…');try{p.destroy();}catch(e){}const p2=new Peer({debug:0});qmPeer=p2;p2.on('open',()=>{if(!qmActive){p2.destroy();return;}const c=p2.connect(slotId,{reliable:true});qmConn=c;c.on('data',data=>{if(data.type==='qm-ready'&&qmActive)qmMatchFound('b');else if(data.type==='move')execMove(data.fr,data.fc,data.tr,data.tc,data.promo||null,true);else if(data.type==='chat'){addChatMsg('Opponent',data.msg);const badge=document.getElementById('chat-badge');if(!document.getElementById('chat-panel')?.classList.contains('open')&&badge)badge.style.display='inline';}else if(data.type==='draw-offer'){if(!over&&confirm('Opponent offers draw. Accept?')){c.send({type:'draw-accept'});acceptDraw();}else c.send({type:'draw-decline'});}else if(data.type==='draw-accept')acceptDraw();else if(data.type==='resign'){over=true;stopClock();document.getElementById('ov-title').textContent='🏳️ Opponent Resigned!';document.getElementById('ov-msg').textContent=(myOnlineColor==='w'?t('white'):t('black'))+' wins!';setStatus('Opponent resigned!');setTimeout(()=>document.getElementById('overlay')?.classList.add('show'),300);playSound('promo');}});c.on('close',()=>{onlineConnected=false;setOnlineBadge('🔴 Disconnected','#e06060');setStatus('Opponent disconnected.');showChatBtn(false);});setTimeout(()=>{if(qmActive&&!onlineConnected)setTimeout(qmSearch,1500);},9000);});p2.on('error',()=>{if(qmActive)setTimeout(qmSearch,2500);});}else{setQmStatus('Network error. Retrying…');setTimeout(()=>{if(qmActive)qmSearch();},3000);}});}
function qmMatchFound(myColor){qmActive=false;clearInterval(qmTimerInt);conn=qmConn;peer=qmPeer;myOnlineColor=myColor;onlineRole=myColor==='w'?'host':'guest';if(myColor==='w'){conn.on('data',data=>{if(data.type==='move')execMove(data.fr,data.fc,data.tr,data.tc,data.promo||null,true);else if(data.type==='chat'){addChatMsg('Opponent',data.msg);const b=document.getElementById('chat-badge');if(!document.getElementById('chat-panel')?.classList.contains('open')&&b)b.style.display='inline';}else if(data.type==='draw-offer'){if(!over&&confirm('Accept draw?')){conn.send({type:'draw-accept'});acceptDraw();}else conn.send({type:'draw-decline'});}else if(data.type==='draw-accept')acceptDraw();else if(data.type==='resign'){over=true;stopClock();document.getElementById('ov-title').textContent='🏳️ Opponent Resigned!';document.getElementById('ov-msg').textContent=(myOnlineColor==='w'?t('white'):t('black'))+' wins!';setStatus('Opponent resigned!');setTimeout(()=>document.getElementById('overlay')?.classList.add('show'),300);playSound('promo');}});conn.on('close',()=>{onlineConnected=false;setOnlineBadge('🔴 Disconnected','#e06060');setStatus('Opponent disconnected.');showChatBtn(false);});}document.getElementById('qm-overlay')?.classList.remove('show');const badge=document.getElementById('qm-found-color-badge');if(badge)badge.textContent=myColor==='w'?'You are White ♔':'You are Black ♚';const flash=document.getElementById('qm-found-flash');flash?.classList.add('show');setTimeout(()=>{flash?.classList.remove('show');onlineConnected=true;newGame();setOnlineBadge('⚡ Quick Match · '+(myColor==='w'?'White ♔':'Black ♚'),'#6dcc8a');showChatBtn(true);},2200);}
function cancelQuickMatch(){qmActive=false;clearInterval(qmTimerInt);if(qmPeer){try{qmPeer.destroy();}catch(e){}qmPeer=null;}qmConn=null;conn=null;peer=null;myOnlineColor=null;onlineRole=null;onlineConnected=false;document.getElementById('qm-overlay')?.classList.remove('show');document.getElementById('qm-found-flash')?.classList.remove('show');document.getElementById('btn-qm')?.classList.remove('active');document.getElementById('btn-h')?.classList.add('active');mode='human';setOnlineBadge('','');showChatBtn(false);}

/* ── NAV ── */
function initNav(){const ham=document.querySelector('.hamburger'),nav=document.querySelector('.site-nav');if(ham&&nav){ham.addEventListener('click',e=>{e.stopPropagation();nav.classList.toggle('open');});document.addEventListener('click',e=>{if(!e.target.closest('.site-nav')&&!e.target.closest('.hamburger'))nav.classList.remove('open');});}document.addEventListener('click',e=>{if(!e.target.closest('.lang-wrap'))closeLangDropdown();if(!e.target.closest('.theme-wrap'))hideBoardThemePanel();});}

/* ── PWA REGISTRATION ── */
if('serviceWorker'in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});

/* ── INIT ── */
document.addEventListener('DOMContentLoaded',()=>{
  initLang();applyTheme(currentTheme);updateLangBtn();applyLangToPage();initNav();
  mode='human';
  if(document.getElementById('board')){
    newGame();
    applyBoardTheme(boardThemeKey);
    const sb=document.getElementById('sound-btn');if(sb)sb.textContent=soundEnabled?'🔊':'🔇';
    updateEloDisplay();
    document.querySelector('.tc-btn[data-tc="none"]')?.classList.add('active');
    // Restore difficulty
    const savedDiff=parseInt(localStorage.getItem('cm_difficulty')||'5');
    setDifficulty(savedDiff);
  }
});

/* ═══════════════════════════════════════════════════════════════
   UPGRADE PACK v3.0 — ALL NEW FEATURES
   1. Daily Puzzle Streak
   2. Blindfold Chess Mode
   3. Real-time Evaluation Bar
   4. Game History (Save + Replay)
   5. AI Personalities (4 styles)
   6. Opening Book for AI
   7. Coordinate Labels toggle
═══════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────────
   1. DAILY PUZZLE STREAK
───────────────────────────────────────────────────────────── */
function getStreak(){
  try{return JSON.parse(localStorage.getItem('cm_streak')||'{"count":0,"last":"","best":0}');}catch(e){return{count:0,last:'',best:0};}
}
function saveStreak(s){localStorage.setItem('cm_streak',JSON.stringify(s));}

function incrementStreak(){
  const today=new Date().toDateString();
  const s=getStreak();
  if(s.last===today)return s; // already updated today
  const yesterday=new Date(Date.now()-86400000).toDateString();
  if(s.last===yesterday){s.count++;}
  else if(s.last!==today){s.count=1;}
  s.last=today;
  s.best=Math.max(s.best||0,s.count);
  saveStreak(s);
  return s;
}

function updateStreakDisplay(){
  const s=getStreak();
  const el=document.getElementById('streak-badge');
  if(!el)return;
  if(s.count>0){
    el.textContent='🔥 '+s.count+' day streak';
    el.style.display='inline-flex';
    el.title='Current streak: '+s.count+' days | Best: '+(s.best||s.count)+' days';
  }else{
    el.textContent='🔥 Start a streak!';
    el.style.display='inline-flex';
  }
}

function checkDailyPuzzle(){
  const today=new Date().toDateString();
  const done=localStorage.getItem('cm_daily_done');
  const banner=document.getElementById('daily-puzzle-banner');
  if(!banner)return;
  if(done===today){
    banner.innerHTML='<span>✅ Daily puzzle done!</span><span class="daily-streak">'+
      '🔥 Streak: <strong>'+getStreak().count+'</strong></span>';
  }else{
    const idx=Math.floor(Date.now()/86400000)%PUZZLES.length;
    const dp=PUZZLES[idx];
    banner.innerHTML='<span>📅 Daily Puzzle: <strong>'+dp.title+'</strong> · '+dp.theme+'</span>'+
      '<button class="btn" style="padding:.2rem .65rem;font-size:.74rem;" onclick="startDailyPuzzle()">Solve →</button>';
  }
}

function startDailyPuzzle(){
  const idx=Math.floor(Date.now()/86400000)%PUZZLES.length;
  const dp=PUZZLES[idx];
  closePuzzleListModal();
  loadPuzzle(dp);
  // Hook into puzzle solved to mark daily done
  const origMark=markPuzzleDone;
  markPuzzleDone=function(id){
    origMark(id);
    if(id===dp.id){
      const today=new Date().toDateString();
      const s=getStreak();
      if(s.last!==today){
        incrementStreak();
        updateStreakDisplay();
      }
      localStorage.setItem('cm_daily_done',today);
      checkDailyPuzzle();
      setTimeout(()=>showStreakToast(),500);
    }
  };
}

function showStreakToast(){
  const s=getStreak();
  const toast=document.getElementById('streak-toast');
  if(!toast)return;
  toast.innerHTML='🔥 '+s.count+' Day Streak! '+(s.count===s.best?'🏆 New Best!':'');
  toast.classList.add('show');
  setTimeout(()=>toast.classList.remove('show'),3000);
}

/* ─────────────────────────────────────────────────────────────
   2. BLINDFOLD CHESS MODE
───────────────────────────────────────────────────────────── */
let blindfoldMode=false;

function toggleBlindfold(){
  blindfoldMode=!blindfoldMode;
  const btn=document.getElementById('blindfold-btn');
  if(btn)btn.textContent=blindfoldMode?'👁️ Show Pieces':'🙈 Blindfold';
  if(btn)btn.classList.toggle('active',blindfoldMode);
  render();
  if(blindfoldMode){
    setStatus('🙈 Blindfold mode — pieces hidden! Use coordinates to think.');
  }
}

/* ─────────────────────────────────────────────────────────────
   3. REAL-TIME EVALUATION BAR
───────────────────────────────────────────────────────────── */
let showEvalBar=localStorage.getItem('cm_evalbar')==='on';

function toggleEvalBar(){
  showEvalBar=!showEvalBar;
  localStorage.setItem('cm_evalbar',showEvalBar?'on':'off');
  const wrap=document.getElementById('eval-bar-wrap');
  if(wrap)wrap.style.display=showEvalBar?'flex':'none';
  const btn=document.getElementById('eval-toggle-btn');
  if(btn)btn.classList.toggle('active',showEvalBar);
  if(showEvalBar)updateEvalBar();
}

function updateEvalBar(){
  if(!showEvalBar||!board)return;
  const wrap=document.getElementById('eval-bar-wrap');
  if(!wrap)return;
  wrap.style.display='flex';
  const score=evalBoard(); // centipawns, + = white advantage
  // Clamp to ±800 for display
  const clamped=Math.max(-800,Math.min(800,score));
  // White fills from bottom, black from top
  // score +800 = 100% white, -800 = 0% white
  const whitePct=Math.round(((clamped+800)/1600)*100);
  const fill=document.getElementById('eval-fill-white');
  const lbl=document.getElementById('eval-score-label');
  if(fill)fill.style.height=whitePct+'%';
  if(lbl){
    const abs=Math.abs(score/100);
    const sign=score>0?'+':score<0?'-':'';
    lbl.textContent=score===0?'0.0':sign+abs.toFixed(1);
    lbl.style.color=score>0?'var(--light-sq)':score<0?'#aaa':'var(--text-dim)';
  }
  // Evaluation segments — advantage labels
  const advEl=document.getElementById('eval-adv');
  if(advEl){
    if(score>200)advEl.textContent='White +';
    else if(score<-200)advEl.textContent='Black +';
    else advEl.textContent='≈';
  }
}

/* ─────────────────────────────────────────────────────────────
   4. GAME HISTORY (Save & Replay)
───────────────────────────────────────────────────────────── */
let replayData=null,replayIdx=0;

function getCurrentResult(){
  if(!over)return'*';
  if(inCheck(turn,board)&&!anyLegal(turn))return turn==='w'?'0-1':'1-0';
  return'1/2-1/2';
}

function saveCompletedGame(){
  if(!hist||hist.length<2)return;
  const games=JSON.parse(localStorage.getItem('cm_game_history')||'[]');
  const modeLabel=mode==='ai'?'vs AI (Lvl '+aiDifficulty+')':mode==='online'||mode==='quickmatch'?'Online':'2 Players';
  games.unshift({
    id:Date.now(),
    date:new Date().toLocaleDateString(),
    time:new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}),
    mode:mode,
    modeLabel,
    personality:aiPersonality,
    result:getCurrentResult(),
    moves:hist.map(h=>h.note),
    snapshots:hist.map(h=>h.snap.map(r=>r.map(x=>x?{...x}:null)))
  });
  localStorage.setItem('cm_game_history',JSON.stringify(games.slice(0,25)));
}

function showGameHistory(){
  const games=JSON.parse(localStorage.getItem('cm_game_history')||'[]');
  const modal=document.getElementById('history-modal');
  const list=document.getElementById('history-list');
  if(!modal||!list)return;
  if(!games.length){
    list.innerHTML='<p style="text-align:center;color:var(--text-dim);padding:2rem">No saved games yet.<br>Play some games to build your history!</p>';
  }else{
    list.innerHTML=games.map((g,i)=>`
      <div class="hc-card">
        <div class="hc-top">
          <span class="hc-mode">${g.mode==='ai'?'🤖':g.mode==='online'||g.mode==='quickmatch'?'🌐':'👥'} ${g.modeLabel||g.mode}</span>
          <span class="hc-date">${g.date} ${g.time||''}</span>
        </div>
        <div class="hc-result-row">
          <span class="hc-result ${g.result==='1-0'?'w-win':g.result==='0-1'?'b-win':'draw-res'}">${g.result}</span>
          <span class="hc-moves-count">${g.moves.length} moves</span>
        </div>
        <div class="hc-notation">${g.moves.slice(0,12).join(' ')}${g.moves.length>12?'…':''}</div>
        <div class="hc-actions">
          <button class="btn" style="font-size:.74rem;padding:.22rem .6rem;" onclick="replayGameById(${g.id})">▶ Replay</button>
          <button class="btn" style="font-size:.74rem;padding:.22rem .6rem;" onclick="deleteGame(${g.id})">🗑</button>
        </div>
      </div>
    `).join('');
  }
  modal.classList.add('show');
}

function hideGameHistory(){document.getElementById('history-modal')?.classList.remove('show');}

function deleteGame(id){
  let games=JSON.parse(localStorage.getItem('cm_game_history')||'[]');
  games=games.filter(g=>g.id!==id);
  localStorage.setItem('cm_game_history',JSON.stringify(games));
  showGameHistory();
}

function replayGameById(id){
  const games=JSON.parse(localStorage.getItem('cm_game_history')||'[]');
  const game=games.find(g=>g.id===id);
  if(!game||!game.snapshots||!game.snapshots.length){alert('Cannot replay this game.');return;}
  hideGameHistory();
  replayData=game;
  replayIdx=0;
  startReplay();
}

function startReplay(){
  if(!replayData)return;
  over=false;sel=null;vmoves=[];
  // Load initial board
  board=Array(8).fill(0).map(()=>Array(8).fill(null));
  const back=['R','N','B','Q','K','B','N','R'];
  for(let c=0;c<8;c++){board[0][c]={t:back[c],cl:'b'};board[1][c]={t:'P',cl:'b'};board[6][c]={t:'P',cl:'w'};board[7][c]={t:back[c],cl:'w'};}
  turn='w';flipped_=false;lastMv=null;
  render();
  setStatus('▶ Replay: '+replayData.modeLabel+' — '+replayData.result);
  document.getElementById('replay-controls')?.classList.add('show');
  document.getElementById('replay-info').textContent='Move 0 / '+replayData.moves.length;
  document.getElementById('overlay')?.classList.remove('show');
}

function replayStep(dir){
  if(!replayData)return;
  const snaps=replayData.snapshots;
  const moves=replayData.moves;
  if(dir>0&&replayIdx>=snaps.length)return;
  if(dir<0&&replayIdx<=0)return;
  replayIdx+=dir;
  if(replayIdx<=0){
    replayIdx=0;
    board=Array(8).fill(0).map(()=>Array(8).fill(null));
    const back=['R','N','B','Q','K','B','N','R'];
    for(let c=0;c<8;c++){board[0][c]={t:back[c],cl:'b'};board[1][c]={t:'P',cl:'b'};board[6][c]={t:'P',cl:'w'};board[7][c]={t:back[c],cl:'w'};}
    lastMv=null;turn='w';
  }else{
    board=snaps[replayIdx-1].map(r=>r.map(x=>x?{...x}:null));
    turn=replayIdx%2===0?'w':'b';
    lastMv=null; // simplified
  }
  render();
  document.getElementById('replay-info').textContent='Move '+replayIdx+' / '+snaps.length+(replayIdx>0?' ('+moves[replayIdx-1]+')':'');
}

function replayJump(to){
  if(!replayData)return;
  replayIdx=to;
  replayStep(0);
  replayIdx=Math.max(0,Math.min(to,replayData.snapshots.length));
  if(replayIdx===0){
    board=Array(8).fill(0).map(()=>Array(8).fill(null));
    const back=['R','N','B','Q','K','B','N','R'];
    for(let c=0;c<8;c++){board[0][c]={t:back[c],cl:'b'};board[1][c]={t:'P',cl:'b'};board[6][c]={t:'P',cl:'w'};board[7][c]={t:back[c],cl:'w'};}
    lastMv=null;turn='w';
  }else{
    board=replayData.snapshots[replayIdx-1].map(r=>r.map(x=>x?{...x}:null));
    turn=replayIdx%2===0?'w':'b';
  }
  render();
  document.getElementById('replay-info').textContent='Move '+replayIdx+' / '+replayData.snapshots.length+(replayIdx>0?' ('+replayData.moves[replayIdx-1]+')':'');
}

let replayAutoInterval=null;
function toggleAutoReplay(){
  const btn=document.getElementById('replay-auto-btn');
  if(replayAutoInterval){
    clearInterval(replayAutoInterval);replayAutoInterval=null;
    if(btn)btn.textContent='▶▶ Auto';
  }else{
    replayAutoInterval=setInterval(()=>{
      if(!replayData||replayIdx>=replayData.snapshots.length){clearInterval(replayAutoInterval);replayAutoInterval=null;if(btn)btn.textContent='▶▶ Auto';return;}
      replayStep(1);
    },1000);
    if(btn)btn.textContent='⏸ Pause';
  }
}

function stopReplay(){
  if(replayAutoInterval){clearInterval(replayAutoInterval);replayAutoInterval=null;}
  replayData=null;replayIdx=0;
  document.getElementById('replay-controls')?.classList.remove('show');
  newGame();
}

/* ─────────────────────────────────────────────────────────────
   5. AI PERSONALITIES
───────────────────────────────────────────────────────────── */
let aiPersonality=localStorage.getItem('cm_ai_personality')||'balanced';

const AI_PERSONALITIES={
  balanced:{name:'⚖️ Balanced',desc:'Classical chess — solid all-round play',aggrBonus:0,safetyBonus:0},
  aggressive:{name:'⚔️ Aggressive',desc:'Attacks boldly, sacrifices for initiative',aggrBonus:60,safetyBonus:-30},
  defensive:{name:'🛡️ Defensive',desc:'Solid, positional — avoids risks',aggrBonus:-40,safetyBonus:50},
  gambiter:{name:'🎲 Gambiter',desc:'Offers pawns for dynamic play',aggrBonus:40,safetyBonus:-20}
};

function setPersonality(p){
  aiPersonality=p;
  localStorage.setItem('cm_ai_personality',p);
  document.querySelectorAll('.personality-btn').forEach(b=>b.classList.toggle('active',b.dataset.personality===p));
  const lbl=document.getElementById('personality-label');
  const info=AI_PERSONALITIES[p];
  if(lbl)lbl.textContent=info.desc;
}

function showPersonalityPanel(){
  document.getElementById('personality-panel')?.classList.toggle('show');
}

// Personality-adjusted eval (used in AI)
function evalBoardPersonality(){
  let s=evalBoard();
  const pers=AI_PERSONALITIES[aiPersonality]||AI_PERSONALITIES.balanced;
  // Aggression: bonus for having pieces near enemy king
  if(pers.aggrBonus!==0){
    const kp=kingPos('w',board);
    if(kp){
      let attackers=0;
      for(let r=0;r<8;r++)for(let c=0;c<8;c++){
        if(board[r][c]?.cl==='b'){
          const dist=Math.abs(r-kp[0])+Math.abs(c-kp[1]);
          if(dist<=3)attackers++;
        }
      }
      s+=-attackers*pers.aggrBonus; // more black pieces near white king = better for black AI
    }
  }
  return s;
}

/* ─────────────────────────────────────────────────────────────
   6. OPENING BOOK FOR AI
───────────────────────────────────────────────────────────── */
const OPENING_BOOK={
  // key = move sequence "fr,fc,tr,tc|..." → array of possible replies [fr,fc,tr,tc]
  '': [
    [6,4,4,4],[6,3,4,3],[6,2,4,2],[7,6,5,5],[7,1,5,2] // e4, d4, c4, Nf3, Nc3
  ],
  '6,4,4,4': [[1,4,3,4],[1,2,3,2],[1,3,2,3],[1,5,2,5],[0,6,2,5],[1,0,2,0]], // responses to e4
  '6,3,4,3': [[1,4,3,4],[1,3,3,3],[0,6,2,5],[1,5,2,5],[1,2,3,2]], // responses to d4
  '6,4,4,4|1,4,3,4': [[5,5,4,5],[7,6,5,5],[5,1,4,1],[6,5,4,5]], // after e4 e5
  '6,4,4,4|1,2,3,2': [[5,5,4,5],[7,6,5,5],[6,3,4,3]], // after e4 c5
  '6,4,4,4|1,3,2,3': [[5,5,4,5],[7,6,5,5]], // after e4 e6
};

let aiMoveHistory=[]; // track moves for opening book

function getBookMove(){
  if(aiMoveHistory.length>6)return null; // out of book after 3 moves each
  const key=aiMoveHistory.join('|');
  const moves=OPENING_BOOK[key];
  if(!moves||!moves.length)return null;
  // Filter legal moves
  const legal=moves.filter(([fr,fc,tr,tc])=>{
    const p=board[fr]?.[fc];
    if(!p||p.cl!=='b')return false;
    return legalMoves(fr,fc).some(([mr,mc])=>mr===tr&&mc===tc);
  });
  if(!legal.length)return null;
  return legal[Math.floor(Math.random()*legal.length)];
}

/* ─────────────────────────────────────────────────────────────
   7. COORDINATE LABELS TOGGLE
───────────────────────────────────────────────────────────── */
let showCoords=localStorage.getItem('cm_coords')!=='off';

function toggleCoords(){
  showCoords=!showCoords;
  localStorage.setItem('cm_coords',showCoords?'on':'off');
  const btn=document.getElementById('coords-btn');
  if(btn)btn.classList.toggle('active',showCoords);
  render();
}

/* ─────────────────────────────────────────────────────────────
   OVERRIDE: Extended render() with new feature support
───────────────────────────────────────────────────────────── */
const _origRender=render;
render=function(){
  const el=document.getElementById('board');if(!el)return;
  el.innerHTML='';
  const chkCl=inCheck(turn,board)?turn:null;
  const kp=chkCl?kingPos(chkCl,board):null;
  for(let dr=0;dr<8;dr++)for(let dc=0;dc<8;dc++){
    const r=flipped_?7-dr:dr,c=flipped_?7-dc:dc;
    const sq=document.createElement('div');sq.className='sq '+((r+c)%2===0?'light':'dark');
    if(lastMv&&((r===lastMv.from[0]&&c===lastMv.from[1])||(r===lastMv.to[0]&&c===lastMv.to[1])))sq.classList.add('last-move');
    if(sel&&sel[0]===r&&sel[1]===c)sq.classList.add('selected');
    if(vmoves.some(([mr,mc])=>mr===r&&mc===c)){if(board[r][c]||(epTgt&&r===epTgt[0]&&c===epTgt[1]))sq.classList.add('ring');else sq.classList.add('dot');}
    if(kp&&r===kp[0]&&c===kp[1])sq.classList.add('in-check');
    // Coordinate labels
    if(showCoords){
      if(dc===0){const lbl=document.createElement('span');lbl.className='coord-r';lbl.textContent=flipped_?r+1:8-r;sq.appendChild(lbl);}
      if(dr===7){const lbl=document.createElement('span');lbl.className='coord-f';lbl.textContent=FILES[flipped_?7-c:c];sq.appendChild(lbl);}
    }
    // Blindfold mode: show piece shapes only if selected/valid-move
    const p=board[r][c];
    if(p){
      const sp=document.createElement('span');
      sp.className='piece '+(p.cl==='w'?'wp':'bp');
      if(lastMv&&r===lastMv.to[0]&&c===lastMv.to[1])sp.classList.add('just-moved');
      if(blindfoldMode){
        // In blindfold mode: show only a small shape indicator, no full piece symbol
        sp.textContent='●';
        sp.style.opacity=sel&&sel[0]===r&&sel[1]===c?'0.7':'0.15';
        sp.style.fontSize='18px';
        sp.style.color=p.cl==='w'?'var(--light-sq)':'#888';
        // Reveal on hover
        sq.addEventListener('mouseenter',()=>{if(blindfoldMode)sp.textContent=SYM[p.t][p.cl];});
        sq.addEventListener('mouseleave',()=>{if(blindfoldMode)sp.textContent='●';});
      }else{
        sp.textContent=SYM[p.t][p.cl];
      }
      sq.appendChild(sp);
      sq.addEventListener('mousedown',e=>{if(e.button===0)startDrag(e,r,c);},{passive:false});
      sq.addEventListener('touchstart',e=>startDrag(e,r,c),{passive:false});
    }
    sq.addEventListener('click',()=>handleClick(r,c));
    el.appendChild(sq);
  }
  // Update eval bar after every render
  setTimeout(updateEvalBar,50);
};

/* ─────────────────────────────────────────────────────────────
   OVERRIDE: Extended checkState() to save game + trigger streak
───────────────────────────────────────────────────────────── */
const _origCheckState=checkState;
checkState=function(){
  _origCheckState();
  if(over){
    setTimeout(()=>saveCompletedGame(),300);
  }
};

/* ─────────────────────────────────────────────────────────────
   OVERRIDE: Extended doAIMove() to use opening book + personality
───────────────────────────────────────────────────────────── */
const _origDoAIMove=doAIMove;
doAIMove=async function(){
  if(over||turn!=='b')return;
  // Try opening book first (quick, no delay needed)
  if(aiMoveHistory.length<=6){
    const bookMv=getBookMove();
    if(bookMv){
      await delay(200+Math.random()*300);
      if(!over&&turn==='b'){
        const [fr,fc,tr,tc]=bookMv;
        aiMoveHistory.push(`${fr},${fc},${tr},${tc}`);
        execMove(fr,fc,tr,tc,'Q');
        return;
      }
    }
  }
  await _origDoAIMove();
};

/* ─────────────────────────────────────────────────────────────
   OVERRIDE: Extended newGame() to reset opening book tracking
───────────────────────────────────────────────────────────── */
const _origNewGame=newGame;
newGame=function(){
  aiMoveHistory=[];
  replayData=null;
  document.getElementById('replay-controls')?.classList.remove('show');
  _origNewGame();
  updateStreakDisplay();
  checkDailyPuzzle();
  setTimeout(updateEvalBar,200);
  // Update personality display
  const savedP=localStorage.getItem('cm_ai_personality')||'balanced';
  aiPersonality=savedP;
  document.querySelectorAll('.personality-btn').forEach(b=>b.classList.toggle('active',b.dataset.personality===savedP));
};

/* ─────────────────────────────────────────────────────────────
   OVERRIDE: execMove to track opening book moves
───────────────────────────────────────────────────────────── */
const _origExecMove=execMove;
execMove=function(fr,fc,tr,tc,promo,fromPeer=false){
  if(!fromPeer&&mode!=='ai'||turn==='w'){
    if(aiMoveHistory.length<=10){
      aiMoveHistory.push(`${fr},${fc},${tr},${tc}`);
    }
  }
  _origExecMove(fr,fc,tr,tc,promo,fromPeer);
};

/* ─────────────────────────────────────────────────────────────
   INIT: New features initialization
───────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded',()=>{
  // Eval bar init
  const wrap=document.getElementById('eval-bar-wrap');
  if(wrap)wrap.style.display=showEvalBar?'flex':'none';
  const evBtn=document.getElementById('eval-toggle-btn');
  if(evBtn)evBtn.classList.toggle('active',showEvalBar);
  // Coords init
  const coordBtn=document.getElementById('coords-btn');
  if(coordBtn)coordBtn.classList.toggle('active',showCoords);
  // Streak display
  updateStreakDisplay();
  // Daily puzzle
  setTimeout(checkDailyPuzzle,500);
  // Personality
  const savedP=localStorage.getItem('cm_ai_personality')||'balanced';
  setPersonality(savedP);
  // Keyboard replay shortcuts
  document.addEventListener('keydown',e=>{
    if(!replayData)return;
    if(e.key==='ArrowRight')replayStep(1);
    else if(e.key==='ArrowLeft')replayStep(-1);
    else if(e.key==='Home')replayJump(0);
    else if(e.key==='End')replayJump(replayData.snapshots.length);
  });
});

