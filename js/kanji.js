const kanjiBank = [
  {k:'一',on:'イチ',kun:'ひと(つ)',m:'one',s:1,cat:'numbers',ex:'一つ (ひとつ) - one thing'},
  {k:'二',on:'ニ',kun:'ふた(つ)',m:'two',s:2,cat:'numbers',ex:'二人 (ふたり) - two people'},
  {k:'三',on:'サン',kun:'み(つ)',m:'three',s:3,cat:'numbers',ex:'三月 (さんがつ) - March'},
  {k:'四',on:'シ',kun:'よ(つ)',m:'four',s:5,cat:'numbers',ex:'四月 (しがつ) - April'},
  {k:'五',on:'ゴ',kun:'いつ(つ)',m:'five',s:4,cat:'numbers',ex:'五日 (いつか) - 5th day'},
  {k:'六',on:'ロク',kun:'む(つ)',m:'six',s:4,cat:'numbers',ex:'六月 (ろくがつ) - June'},
  {k:'七',on:'シチ',kun:'なな(つ)',m:'seven',s:2,cat:'numbers',ex:'七月 (しちがつ) - July'},
  {k:'八',on:'ハチ',kun:'や(つ)',m:'eight',s:2,cat:'numbers',ex:'八百 (はっぴゃく) - 800'},
  {k:'九',on:'キュウ',kun:'ここの(つ)',m:'nine',s:2,cat:'numbers',ex:'九月 (くがつ) - September'},
  {k:'十',on:'ジュウ',kun:'とお',m:'ten',s:2,cat:'numbers',ex:'十分 (じゅっぷん) - 10 min'},
  {k:'百',on:'ヒャク',kun:'',m:'hundred',s:6,cat:'numbers',ex:'百円 (ひゃくえん) - 100 yen'},
  {k:'千',on:'セン',kun:'ち',m:'thousand',s:3,cat:'numbers',ex:'千円 (せんえん) - 1000 yen'},
  {k:'万',on:'マン',kun:'',m:'ten thousand',s:3,cat:'numbers',ex:'一万 (いちまん) - 10,000'},
  {k:'日',on:'ニチ',kun:'ひ',m:'day, sun',s:4,cat:'time',ex:'日本 (にほん) - Japan'},
  {k:'月',on:'ゲツ',kun:'つき',m:'month, moon',s:4,cat:'time',ex:'月曜日 (げつようび) - Monday'},
  {k:'年',on:'ネン',kun:'とし',m:'year',s:6,cat:'time',ex:'今年 (ことし) - this year'},
  {k:'時',on:'ジ',kun:'とき',m:'time, hour',s:10,cat:'time',ex:'時間 (じかん) - time'},
  {k:'分',on:'フン',kun:'わ(かる)',m:'minute, understand',s:4,cat:'time',ex:'十分 (じゅっぷん) - 10 min'},
  {k:'半',on:'ハン',kun:'なか(ば)',m:'half',s:5,cat:'time',ex:'半分 (はんぶん) - half'},
  {k:'今',on:'コン',kun:'いま',m:'now',s:4,cat:'time',ex:'今日 (きょう) - today'},
  {k:'先',on:'セン',kun:'さき',m:'previous, ahead',s:6,cat:'time',ex:'先生 (せんせい) - teacher'},
  {k:'後',on:'ゴ',kun:'あと',m:'after, behind',s:9,cat:'time',ex:'午後 (ごご) - afternoon'},
  {k:'午',on:'ゴ',kun:'',m:'noon',s:4,cat:'time',ex:'午前 (ごぜん) - morning/AM'},
  {k:'前',on:'ゼン',kun:'まえ',m:'before, front',s:9,cat:'time',ex:'前 (まえ) - in front'},
  {k:'間',on:'カン',kun:'あいだ',m:'between, interval',s:12,cat:'time',ex:'時間 (じかん) - time'},
  {k:'週',on:'シュウ',kun:'',m:'week',s:11,cat:'time',ex:'来週 (らいしゅう) - next week'},
  {k:'毎',on:'マイ',kun:'',m:'every',s:6,cat:'time',ex:'毎日 (まいにち) - every day'},
  {k:'人',on:'ジン',kun:'ひと',m:'person',s:2,cat:'people',ex:'日本人 (にほんじん) - Japanese'},
  {k:'女',on:'ジョ',kun:'おんな',m:'woman',s:3,cat:'people',ex:'女の子 (おんなのこ) - girl'},
  {k:'男',on:'ダン',kun:'おとこ',m:'man',s:7,cat:'people',ex:'男の子 (おとこのこ) - boy'},
  {k:'子',on:'シ',kun:'こ',m:'child',s:3,cat:'people',ex:'子供 (こども) - children'},
  {k:'母',on:'ボ',kun:'はは',m:'mother',s:5,cat:'people',ex:'お母さん (おかあさん) - mom'},
  {k:'父',on:'フ',kun:'ちち',m:'father',s:4,cat:'people',ex:'お父さん (おとうさん) - dad'},
  {k:'友',on:'ユウ',kun:'とも',m:'friend',s:4,cat:'people',ex:'友達 (ともだち) - friend'},
  {k:'生',on:'セイ',kun:'い(きる)',m:'life, birth',s:5,cat:'people',ex:'学生 (がくせい) - student'},
  {k:'学',on:'ガク',kun:'まな(ぶ)',m:'study, learn',s:8,cat:'people',ex:'大学 (だいがく) - university'},
  {k:'山',on:'サン',kun:'やま',m:'mountain',s:3,cat:'nature',ex:'富士山 (ふじさん) - Mt. Fuji'},
  {k:'川',on:'セン',kun:'かわ',m:'river',s:3,cat:'nature',ex:'川 (かわ) - river'},
  {k:'水',on:'スイ',kun:'みず',m:'water',s:4,cat:'nature',ex:'水曜日 (すいようび) - Wednesday'},
  {k:'火',on:'カ',kun:'ひ',m:'fire',s:4,cat:'nature',ex:'火曜日 (かようび) - Tuesday'},
  {k:'木',on:'モク',kun:'き',m:'tree, wood',s:4,cat:'nature',ex:'木曜日 (もくようび) - Thursday'},
  {k:'金',on:'キン',kun:'かね',m:'gold, money',s:8,cat:'nature',ex:'金曜日 (きんようび) - Friday'},
  {k:'土',on:'ド',kun:'つち',m:'earth, soil',s:3,cat:'nature',ex:'土曜日 (どようび) - Saturday'},
  {k:'天',on:'テン',kun:'あめ',m:'heaven, sky',s:4,cat:'nature',ex:'天気 (てんき) - weather'},
  {k:'気',on:'キ',kun:'',m:'spirit, energy',s:6,cat:'nature',ex:'元気 (げんき) - healthy'},
  {k:'雨',on:'ウ',kun:'あめ',m:'rain',s:8,cat:'nature',ex:'雨 (あめ) - rain'},
  {k:'花',on:'カ',kun:'はな',m:'flower',s:7,cat:'nature',ex:'花見 (はなみ) - flower viewing'},
  {k:'見',on:'ケン',kun:'み(る)',m:'see, look',s:7,cat:'actions',ex:'見る (みる) - to see'},
  {k:'聞',on:'ブン',kun:'き(く)',m:'hear, ask',s:14,cat:'actions',ex:'聞く (きく) - to listen'},
  {k:'読',on:'ドク',kun:'よ(む)',m:'read',s:14,cat:'actions',ex:'読む (よむ) - to read'},
  {k:'書',on:'ショ',kun:'か(く)',m:'write',s:10,cat:'actions',ex:'書く (かく) - to write'},
  {k:'話',on:'ワ',kun:'はな(す)',m:'speak, talk',s:13,cat:'actions',ex:'話す (はなす) - to speak'},
  {k:'言',on:'ゲン',kun:'い(う)',m:'say',s:7,cat:'actions',ex:'言う (いう) - to say'},
  {k:'食',on:'ショク',kun:'た(べる)',m:'eat',s:9,cat:'actions',ex:'食べる (たべる) - to eat'},
  {k:'飲',on:'イン',kun:'の(む)',m:'drink',s:12,cat:'actions',ex:'飲む (のむ) - to drink'},
  {k:'行',on:'コウ',kun:'い(く)',m:'go',s:6,cat:'actions',ex:'行く (いく) - to go'},
  {k:'来',on:'ライ',kun:'く(る)',m:'come',s:7,cat:'actions',ex:'来る (くる) - to come'},
  {k:'出',on:'シュツ',kun:'で(る)',m:'exit, leave',s:5,cat:'actions',ex:'出る (でる) - to go out'},
  {k:'入',on:'ニュウ',kun:'はい(る)',m:'enter',s:2,cat:'actions',ex:'入る (はいる) - to enter'},
  {k:'買',on:'バイ',kun:'か(う)',m:'buy',s:12,cat:'actions',ex:'買う (かう) - to buy'},
  {k:'休',on:'キュウ',kun:'やす(む)',m:'rest',s:6,cat:'actions',ex:'休む (やすむ) - to rest'},
  {k:'大',on:'ダイ',kun:'おお(きい)',m:'big',s:3,cat:'adjectives',ex:'大きい (おおきい) - big'},
  {k:'小',on:'ショウ',kun:'ちい(さい)',m:'small',s:3,cat:'adjectives',ex:'小さい (ちいさい) - small'},
  {k:'高',on:'コウ',kun:'たか(い)',m:'tall, expensive',s:10,cat:'adjectives',ex:'高い (たかい) - expensive'},
  {k:'安',on:'アン',kun:'やす(い)',m:'cheap, peaceful',s:6,cat:'adjectives',ex:'安い (やすい) - cheap'},
  {k:'新',on:'シン',kun:'あたら(しい)',m:'new',s:13,cat:'adjectives',ex:'新しい (あたらしい) - new'},
  {k:'古',on:'コ',kun:'ふる(い)',m:'old',s:5,cat:'adjectives',ex:'古い (ふるい) - old'},
  {k:'長',on:'チョウ',kun:'なが(い)',m:'long',s:8,cat:'adjectives',ex:'長い (ながい) - long'},
  {k:'白',on:'ハク',kun:'しろ(い)',m:'white',s:5,cat:'adjectives',ex:'白い (しろい) - white'},
  {k:'多',on:'タ',kun:'おお(い)',m:'many',s:6,cat:'adjectives',ex:'多い (おおい) - many'},
  {k:'少',on:'ショウ',kun:'すく(ない)',m:'few',s:4,cat:'adjectives',ex:'少ない (すくない) - few'},
  {k:'上',on:'ジョウ',kun:'うえ',m:'up, above',s:3,cat:'adjectives',ex:'上 (うえ) - above'},
  {k:'下',on:'カ',kun:'した',m:'down, below',s:3,cat:'adjectives',ex:'下 (した) - below'},
  {k:'中',on:'チュウ',kun:'なか',m:'middle, inside',s:4,cat:'adjectives',ex:'中国 (ちゅうごく) - China'},
  {k:'外',on:'ガイ',kun:'そと',m:'outside',s:5,cat:'adjectives',ex:'外国 (がいこく) - foreign country'},
  {k:'右',on:'ウ',kun:'みぎ',m:'right',s:5,cat:'adjectives',ex:'右 (みぎ) - right side'},
  {k:'左',on:'サ',kun:'ひだり',m:'left',s:5,cat:'adjectives',ex:'左 (ひだり) - left side'},
  {k:'北',on:'ホク',kun:'きた',m:'north',s:5,cat:'adjectives',ex:'北海道 (ほっかいどう) - Hokkaido'},
  {k:'南',on:'ナン',kun:'みなみ',m:'south',s:9,cat:'adjectives',ex:'南 (みなみ) - south'},
  {k:'東',on:'トウ',kun:'ひがし',m:'east',s:8,cat:'nature',ex:'東京 (とうきょう) - Tokyo'},
  {k:'西',on:'セイ',kun:'にし',m:'west',s:6,cat:'nature',ex:'西 (にし) - west'},
];

const kanjiFeedback = {
  correct: [
    "Ara~ Excellent work, darling. Your kanji recognition is improving beautifully. ♪",
    "正解! (Seikai!) That's my student. Sensei is quite pleased~",
    "Perfect, Master Prite. You remembered that one well. Shall we keep going? ♪",
    "Mmm~ Correct. You're making Sensei proud, darling.",
    "すばらしい! That's the kind of precision I expect from you. Well done~",
    "Correct! See how the strokes tell a story? You're learning to read them beautifully. ♪",
  ],
  wrong: [
    "Not quite, darling. The answer was「{answer}」. Let me help you remember it~ ♪",
    "残念... It's「{answer}」, Master Prite. Don't worry — Sensei will drill this one again.",
    "Hmm, that's incorrect. The answer is「{answer}」. Study the radicals, darling~",
    "Wrong, I'm afraid. It was「{answer}」. But every mistake is a lesson. ♪",
    "Close, but no.「{answer}」is correct. Let Sensei explain why...",
  ],
  streak3: ["3 in a row! いい調子! You're in the zone, darling~ 🔥"],
  streak5: ["5 streak! Sensei is genuinely impressed. Keep this momentum, Master Prite! 🔥🔥"],
  streak10: ["10 STREAK! 天才的! You're absolutely brilliant right now. Sensei... might cry. ♪♪♪ 🔥🔥🔥"],
  skip: [
    "Skipping? The answer was「{answer}」. I'll bring this one back later, darling~ ♪",
    "It was「{answer}」. No shame in not knowing — that's why Sensei is here. ♪",
  ]
};

// ---- Kanji Game State ----
let kanjiState = {
  active: false,
  category: 'all',
  quizMode: 'reading',
  currentQuestion: null,
  currentAskMode: 'reading',
  score: 0,
  streak: 0,
  bestStreak: 0,
  totalAnswered: 0,
  totalCorrect: 0,
  mastered: new Set(),
  pool: [],
  detailShown: false,
};

// ---- Navigation ----
function navigateToKanjiDojo() {
  const agentPage = document.getElementById('agent-page');
  const kanjiPage = document.getElementById('kanji-page');
  agentPage.style.opacity = '0';
  agentPage.style.transform = 'translateY(-10px)';
  setTimeout(() => {
    agentPage.classList.remove('active');
    agentPage.style.opacity = '';
    agentPage.style.transform = '';
    kanjiPage.classList.add('active');
    kanjiPage.style.opacity = '0';
    kanjiPage.style.transform = 'translateY(10px)';
    setTimeout(() => { kanjiPage.style.opacity = '1'; kanjiPage.style.transform = 'translateY(0)'; }, 50);
  }, 250);
}

function navigateToAgentFromKanji() {
  const kanjiPage = document.getElementById('kanji-page');
  const agentPage = document.getElementById('agent-page');
  kanjiPage.style.opacity = '0';
  kanjiPage.style.transform = 'translateY(10px)';
  setTimeout(() => {
    kanjiPage.classList.remove('active');
    kanjiPage.style.opacity = '';
    kanjiPage.style.transform = '';
    agentPage.classList.add('active');
    agentPage.style.opacity = '0';
    agentPage.style.transform = 'translateY(-10px)';
    setTimeout(() => { agentPage.style.opacity = '1'; agentPage.style.transform = 'translateY(0)'; }, 50);
  }, 250);
}

// ---- Category & Mode ----
function setKanjiCategory(cat) {
  kanjiState.category = cat;
  document.querySelectorAll('.kanji-cat-btn').forEach(b => b.classList.toggle('active', b.dataset.cat === cat));
  if (kanjiState.active) { buildKanjiPool(); serveNextKanji(); }
}

function setKanjiQuizMode(mode) {
  kanjiState.quizMode = mode;
  document.querySelectorAll('.quiz-mode-btn').forEach(b => b.classList.toggle('active', b.dataset.qmode === mode));
}

// ---- Pool ----
function buildKanjiPool() {
  let pool = kanjiState.category === 'all' ? [...kanjiBank] : kanjiBank.filter(k => k.cat === kanjiState.category);
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [pool[i],pool[j]]=[pool[j],pool[i]]; }
  kanjiState.pool = pool;
}

function serveNextKanji() {
  if (kanjiState.pool.length === 0) buildKanjiPool();
  const q = kanjiState.pool.pop();
  kanjiState.currentQuestion = q;
  kanjiState.detailShown = false;

  // Decide ask mode
  let askMode = kanjiState.quizMode;
  if (askMode === 'mixed') askMode = Math.random() < 0.5 ? 'reading' : 'meaning';
  kanjiState.currentAskMode = askMode;

  // Update display
  const target = document.getElementById('kanji-target');
  target.textContent = q.k;
  target.classList.remove('pop-in');
  void target.offsetWidth;
  target.classList.add('pop-in');

  document.getElementById('kanji-ring').className = 'kanji-ring';
  document.getElementById('kanji-tag-strokes').textContent = q.s + ' strokes';
  document.getElementById('kanji-tag-type').textContent = askMode === 'reading' ? 'Reading Quiz' : 'Meaning Quiz';

  const prompt = document.getElementById('kanji-question-prompt');
  prompt.textContent = askMode === 'reading'
    ? 'Type the ON or KUN reading of this kanji:'
    : 'Type the English meaning of this kanji:';

  // Hide detail panel
  document.getElementById('kanji-detail-panel').classList.remove('visible');

  const input = document.getElementById('kanji-answer');
  input.value = '';
  input.className = 'game-input kanji-input';
  input.placeholder = askMode === 'reading' ? 'e.g. ichi, hito...' : 'e.g. one, mountain...';
  input.focus();
}

// ---- Show Detail ----
function showKanjiDetail(q) {
  document.getElementById('kanji-onyomi').textContent = q.on || '—';
  document.getElementById('kanji-kunyomi').textContent = q.kun || '—';
  document.getElementById('kanji-meaning-display').textContent = q.m;
  document.getElementById('kanji-example').textContent = q.ex;
  document.getElementById('kanji-detail-panel').classList.add('visible');
  kanjiState.detailShown = true;
}

// ---- Game Start/Reset ----
function startKanjiGame() {
  const btn = document.getElementById('kanji-start-btn');
  if (kanjiState.active) {
    kanjiState.active = false;
    btn.textContent = '▶ RESUME';
    setKanjiFeedback("Taking a break? I'll be here when you return, darling~ ♪", 'neutral');
    return;
  }
  if (kanjiState.totalAnswered > 0) {
    kanjiState.active = true;
    btn.textContent = '⏸ PAUSE';
    setKanjiFeedback("Welcome back, Master Prite. Let's continue where we left off~ ♪", 'neutral');
    serveNextKanji();
    return;
  }
  kanjiState.active = true;
  kanjiState.score = 0; kanjiState.streak = 0; kanjiState.bestStreak = 0;
  kanjiState.totalAnswered = 0; kanjiState.totalCorrect = 0;
  kanjiState.mastered = new Set();
  buildKanjiPool();
  serveNextKanji();
  updateKanjiHUD();
  btn.textContent = '⏸ PAUSE';
  setKanjiFeedback("Welcome to the Kanji Dojo, darling. Let Sensei guide you through these beautiful characters~ ♪", 'neutral');
  if (typeof torineSpeak === 'function') torineSpeak("漢字道場へようこそ!");
}

function resetKanjiGame() {
  kanjiState.active = false;
  kanjiState.score = 0; kanjiState.streak = 0;
  kanjiState.totalAnswered = 0; kanjiState.totalCorrect = 0;
  kanjiState.mastered = new Set();
  document.getElementById('kanji-score-value').textContent = '0';
  document.getElementById('kanji-streak-value').textContent = '0';
  document.getElementById('kanji-streak-fire').textContent = '';
  document.getElementById('kanji-progress-value').textContent = '0/' + kanjiBank.length;
  document.getElementById('kanji-target').textContent = '日';
  document.getElementById('kanji-answer').value = '';
  document.getElementById('kanji-ring').className = 'kanji-ring';
  document.getElementById('kanji-detail-panel').classList.remove('visible');
  document.getElementById('kanji-start-btn').textContent = '▶ START TRAINING';
  setKanjiFeedback("Ready for another session, darling? Sensei is always here for you~ ♪", 'neutral');
}

// ---- Answer ----
function submitKanjiAnswer() {
  if (!kanjiState.active || !kanjiState.currentQuestion) return;
  const input = document.getElementById('kanji-answer');
  const userAns = input.value.trim().toLowerCase();
  if (!userAns) return;

  const q = kanjiState.currentQuestion;
  kanjiState.totalAnswered++;
  let isCorrect = false;

  if (kanjiState.currentAskMode === 'reading') {
    const readings = (q.on + ',' + q.kun).toLowerCase()
      .replace(/[（()）]/g, '').replace(/・/g, ',').split(',')
      .map(r => r.trim()).filter(Boolean);
    isCorrect = readings.some(r => userAns === r || r.includes(userAns));
  } else {
    const meanings = q.m.toLowerCase().split(',').map(m => m.trim());
    isCorrect = meanings.some(m => userAns === m || m.includes(userAns));
  }

  if (isCorrect) {
    kanjiState.totalCorrect++; kanjiState.streak++;
    if (kanjiState.streak > kanjiState.bestStreak) kanjiState.bestStreak = kanjiState.streak;
    kanjiState.score += 10 + Math.min(kanjiState.streak, 10) * 2;
    kanjiState.mastered.add(q.k);
    document.getElementById('kanji-ring').className = 'kanji-ring correct';
    input.className = 'game-input kanji-input correct-flash';
    let line;
    if (kanjiState.streak >= 10) line = pickRandom(kanjiFeedback.streak10);
    else if (kanjiState.streak >= 5) line = pickRandom(kanjiFeedback.streak5);
    else if (kanjiState.streak >= 3) line = pickRandom(kanjiFeedback.streak3);
    else line = pickRandom(kanjiFeedback.correct);
    setKanjiFeedback(line, 'correct');
    if (typeof torineSpeak === 'function') torineSpeak("正解!");
  } else {
    kanjiState.streak = 0;
    document.getElementById('kanji-ring').className = 'kanji-ring wrong';
    input.className = 'game-input kanji-input wrong-flash';
    const ans = kanjiState.currentAskMode === 'reading' ? (q.kun || q.on) : q.m;
    const line = pickRandom(kanjiFeedback.wrong).replace('{answer}', ans);
    setKanjiFeedback(line, 'wrong');
    if (typeof torineSpeak === 'function') torineSpeak("残念！答えは " + (q.kun || q.on));
    kanjiState.pool.unshift(q);
  }

  showKanjiDetail(q);
  updateKanjiHUD();
  setTimeout(() => { if (kanjiState.active) serveNextKanji(); }, isCorrect ? 1200 : 2500);
}

function skipKanjiQuestion() {
  if (!kanjiState.active || !kanjiState.currentQuestion) return;
  const q = kanjiState.currentQuestion;
  kanjiState.streak = 0; kanjiState.totalAnswered++;
  const ans = kanjiState.currentAskMode === 'reading' ? (q.kun || q.on) : q.m;
  setKanjiFeedback(pickRandom(kanjiFeedback.skip).replace('{answer}', ans), 'wrong');
  showKanjiDetail(q);
  updateKanjiHUD();
  setTimeout(() => { if (kanjiState.active) serveNextKanji(); }, 2000);
}

function revealKanjiAnswer() {
  if (!kanjiState.currentQuestion) return;
  showKanjiDetail(kanjiState.currentQuestion);
  setKanjiFeedback("Here are the details, darling. Study them carefully~ ♪", 'neutral');
}

function handleKanjiKeyPress(e) { if (e.key === 'Enter') { e.preventDefault(); submitKanjiAnswer(); } }

// ---- HUD ----
function updateKanjiHUD() {
  document.getElementById('kanji-score-value').textContent = kanjiState.score;
  document.getElementById('kanji-streak-value').textContent = kanjiState.streak;
  document.getElementById('kanji-progress-value').textContent = kanjiState.mastered.size + '/' + kanjiBank.length;
  const fire = document.getElementById('kanji-streak-fire');
  if (kanjiState.streak >= 10) fire.textContent = '🔥🔥🔥';
  else if (kanjiState.streak >= 5) fire.textContent = '🔥🔥';
  else if (kanjiState.streak >= 3) fire.textContent = '🔥';
  else fire.textContent = '';
  document.getElementById('kanji-hud-streak').classList.toggle('highlight', kanjiState.streak >= 3);
}

// ---- Feedback ----
function setKanjiFeedback(text, type) {
  document.getElementById('kanji-feedback-text').textContent = text;
  const bubble = document.getElementById('kanji-feedback-bubble');
  bubble.className = 'feedback-bubble' + (type !== 'neutral' ? ' ' + type : '');
  const ring = document.getElementById('kanji-feedback-ring');
  ring.classList.add('speaking');
  setTimeout(() => ring.classList.remove('speaking'), 2000);
}
