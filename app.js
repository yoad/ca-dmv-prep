// === CA DMV Test Prep App Logic ===

const CATEGORIES = {
  signs: { name: 'Road Signs', icon: '🚧', he: 'תמרורים וסימוני כביש' },
  speed: { name: 'Speed Limits', icon: '⚡', he: 'מגבלות מהירות' },
  right_of_way: { name: 'Right-of-Way', icon: '🚦', he: 'זכות קדימה' },
  lanes: { name: 'Lanes & Turning', icon: '↩️', he: 'נתיבים ופניות' },
  parking: { name: 'Parking', icon: '🅿️', he: 'חניה' },
  alcohol: { name: 'Alcohol & Drugs', icon: '🚫', he: 'אלכוהול וסמים' },
  freeway: { name: 'Freeway Driving', icon: '🛣️', he: 'נהיגה בכביש מהיר' },
  safety: { name: 'Safety', icon: '🛡️', he: 'בטיחות וחירום' },
  equipment: { name: 'Equipment', icon: '🔧', he: 'ציוד הרכב' },
  special: { name: 'Special Situations', icon: '⚠️', he: 'מצבים מיוחדים' }
};

// State
let state = {
  screen: 'home',
  studyCat: null,
  studyIdx: 0,
  studyAnswered: false,
  testQuestions: [],
  testIdx: 0,
  testAnswers: [],
  testStartTime: null,
  testTimerId: null,
  refTab: 'speed',
  progress: loadProgress()
};

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem('dmv_progress')) || { studied: {}, tests: [] };
  } catch { return { studied: {}, tests: [] }; }
}

function saveProgress() {
  localStorage.setItem('dmv_progress', JSON.stringify(state.progress));
}

function markStudied(qId) {
  state.progress.studied[qId] = true;
  saveProgress();
}

function getStudiedCount(cat) {
  if (!cat) return Object.keys(state.progress.studied).length;
  return QUESTIONS.filter(q => q.cat === cat && state.progress.studied[q.id]).length;
}

function getCatQuestions(cat) {
  return QUESTIONS.filter(q => q.cat === cat);
}

// Render
function render() {
  const app = document.getElementById('app');
  switch(state.screen) {
    case 'home': app.innerHTML = renderHome(); break;
    case 'study': app.innerHTML = renderStudy(); break;
    case 'study_q': app.innerHTML = renderStudyQ(); break;
    case 'test_start': app.innerHTML = renderTestStart(); break;
    case 'test': app.innerHTML = renderTest(); break;
    case 'results': app.innerHTML = renderResults(); break;
    case 'review': app.innerHTML = renderReview(); break;
    case 'reference': app.innerHTML = renderReference(); break;
  }
  app.innerHTML += renderNav();
}

function renderHome() {
  const totalQ = QUESTIONS.length;
  const studied = getStudiedCount();
  const testsDone = state.progress.tests.length;
  const bestScore = testsDone > 0 ? Math.max(...state.progress.tests.map(t => t.score)) : 0;
  const pct = Math.round((studied / totalQ) * 100);

  return `
    <div class="screen active">
      <div class="header">
        <div class="logo">🚗</div>
        <h1>CA DMV Test Prep</h1>
        <p>הכנה למבחן התאוריה בקליפורניה</p>
      </div>
      <div class="stats-grid">
        <div class="stat-card"><div class="num">${studied}</div><div class="label">שאלות נלמדו</div></div>
        <div class="stat-card"><div class="num">${totalQ}</div><div class="label">סה״כ שאלות</div></div>
        <div class="stat-card"><div class="num">${testsDone}</div><div class="label">מבחנים</div></div>
        <div class="stat-card"><div class="num">${bestScore}%</div><div class="label">ציון הכי טוב</div></div>
      </div>
      <div class="progress-bar"><div class="fill" style="width:${pct}%"></div></div>
      <p style="text-align:center;color:var(--text3);font-size:.8rem;margin-bottom:16px">${pct}% הושלם</p>
      
      <div class="card" onclick="navigate('study')">
        <div class="card-icon">📚</div>
        <h3>Study Mode / מצב לימוד</h3>
        <p>לימוד שאלות לפי קטגוריה עם הסברים בעברית</p>
        <div class="badge">${studied}/${totalQ}</div>
      </div>
      
      <div class="card" onclick="navigate('test_start')">
        <div class="card-icon">📝</div>
        <h3>Practice Test / מבחן תרגול</h3>
        <p>סימולציה של המבחן האמיתי — 46 שאלות, 83% מעבר</p>
        ${testsDone > 0 ? `<div class="badge">Best: ${bestScore}%</div>` : ''}
      </div>
      
      <div class="card" onclick="navigate('reference')">
        <div class="card-icon">📋</div>
        <h3>Quick Reference / טבלאות עזר</h3>
        <p>מהירויות, מרחקים, תמרורים — עם המרה לק״מ</p>
      </div>
    </div>`;
}

function renderStudy() {
  const cats = Object.entries(CATEGORIES);
  return `
    <div class="screen active">
      <button class="btn-back" onclick="navigate('home')">← חזרה לדף הבית</button>
      <h2 style="font-size:1.4rem;font-weight:800;margin:12px 0">📚 בחר קטגוריה</h2>
      <p style="color:var(--text2);font-size:.85rem;margin-bottom:16px">בחר נושא ללימוד. השאלות באנגלית, ההסברים בעברית.</p>
      ${cats.map(([key, cat]) => {
        const total = getCatQuestions(key).length;
        const done = getStudiedCount(key);
        const pct = Math.round((done / total) * 100);
        return `
        <div class="card" onclick="startStudy('${key}')">
          <div class="card-icon">${cat.icon}</div>
          <h3>${cat.name}</h3>
          <p>${cat.he}</p>
          <div class="badge">${done}/${total}</div>
          <div class="progress-bar"><div class="fill" style="width:${pct}%"></div></div>
        </div>`;
      }).join('')}
    </div>`;
}

function renderStudyQ() {
  const questions = getCatQuestions(state.studyCat);
  const q = questions[state.studyIdx];
  const cat = CATEGORIES[state.studyCat];
  const letters = ['A', 'B', 'C', 'D'];
  const isStudied = state.progress.studied[q.id];
  
  return `
    <div class="screen active">
      <button class="btn-back" onclick="navigate('study')">← חזרה לקטגוריות</button>
      <div class="q-header">
        <span class="q-num">${state.studyIdx + 1} / ${questions.length}</span>
        <span class="q-cat">${cat.icon} ${cat.name}</span>
      </div>
      <div class="progress-bar"><div class="fill" style="width:${((state.studyIdx + 1) / questions.length) * 100}%"></div></div>
      <div class="q-text">${q.q}</div>
      <div class="options" id="study-options">
        ${q.o.map((opt, i) => `
          <button class="option ${state.studyAnswered ? (i === q.a ? 'correct' : (document.querySelector('.option.wrong') ? '' : '')) : ''}" 
            onclick="answerStudy(${i})" ${state.studyAnswered ? 'disabled' : ''}>
            <span class="option-letter">${letters[i]}</span>
            <span>${opt}</span>
          </button>
        `).join('')}
      </div>
      <div id="study-explanation"></div>
      <div style="display:flex;gap:8px;margin-top:16px">
        <button class="btn btn-secondary" onclick="prevStudy()" ${state.studyIdx === 0 ? 'disabled style="opacity:.4"' : ''}>← הקודם</button>
        <button class="btn btn-primary" style="flex:1" onclick="nextStudy()">${state.studyIdx < questions.length - 1 ? 'הבא →' : 'סיום ✓'}</button>
      </div>
    </div>`;
}

function renderTestStart() {
  return `
    <div class="screen active">
      <button class="btn-back" onclick="navigate('home')">← חזרה לדף הבית</button>
      <div style="text-align:center;padding:32px 0">
        <div style="font-size:4rem;margin-bottom:16px">📝</div>
        <h2 style="font-size:1.5rem;font-weight:800;margin-bottom:8px">Practice Test</h2>
        <h3 style="font-size:1.1rem;font-weight:600;color:var(--text2);margin-bottom:24px">מבחן תרגול</h3>
        
        <div style="background:var(--surface);border-radius:var(--radius);padding:20px;text-align:right;direction:rtl;margin-bottom:24px">
          <p style="margin-bottom:8px">📌 <strong>46 שאלות</strong> אקראיות מכל הקטגוריות</p>
          <p style="margin-bottom:8px">⏱️ <strong>ללא הגבלת זמן</strong> (אבל עם טיימר למעקב)</p>
          <p style="margin-bottom:8px">✅ <strong>83% נדרש למעבר</strong> (38 מתוך 46)</p>
          <p>📊 תקבל סקירה מפורטת של כל תשובה שגויה</p>
        </div>
        
        <button class="btn btn-primary btn-block" onclick="startTest()" style="font-size:1.1rem;padding:18px">
          🚀 התחל מבחן
        </button>
      </div>
    </div>`;
}

function renderTest() {
  const q = state.testQuestions[state.testIdx];
  const letters = ['A', 'B', 'C', 'D'];
  const answered = state.testAnswers[state.testIdx] !== undefined;
  const elapsed = Math.floor((Date.now() - state.testStartTime) / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  return `
    <div class="screen active">
      <div class="q-header">
        <span class="q-num">שאלה ${state.testIdx + 1} / 46</span>
        <span class="timer" id="test-timer">⏱ ${mins}:${secs.toString().padStart(2, '0')}</span>
      </div>
      <div class="progress-bar"><div class="fill" style="width:${((state.testIdx + 1) / 46) * 100}%"></div></div>
      <div class="q-cat" style="margin-bottom:12px">${CATEGORIES[q.cat].icon} ${CATEGORIES[q.cat].name}</div>
      <div class="q-text">${q.q}</div>
      <div class="options">
        ${q.o.map((opt, i) => `
          <button class="option ${answered ? (i === q.a ? 'correct' : (state.testAnswers[state.testIdx] === i && i !== q.a ? 'wrong' : 'disabled')) : ''}" 
            onclick="answerTest(${i})" ${answered ? 'disabled' : ''}>
            <span class="option-letter">${letters[i]}</span>
            <span>${opt}</span>
          </button>
        `).join('')}
      </div>
      ${answered ? `
        <div class="explanation">
          <h4>💡 הסבר</h4>
          <p>${q.he}</p>
          ${q.tip ? `<div class="tip">💡 ${q.tip}</div>` : ''}
        </div>
        <button class="btn btn-primary btn-block" style="margin-top:16px" onclick="nextTest()">
          ${state.testIdx < 45 ? 'שאלה הבאה →' : '📊 הצג תוצאות'}
        </button>
      ` : ''}
    </div>`;
}

function renderResults() {
  const correct = state.testAnswers.filter((ans, i) => ans === state.testQuestions[i].a).length;
  const pct = Math.round((correct / 46) * 100);
  const passed = pct >= 83;
  const elapsed = Math.floor((Date.now() - state.testStartTime) / 1000);
  const mins = Math.floor(elapsed / 60);
  
  if (state.testTimerId) { clearInterval(state.testTimerId); state.testTimerId = null; }

  return `
    <div class="screen active">
      <div style="text-align:center;padding:24px 0">
        <div style="font-size:4rem;margin-bottom:8px">${passed ? '🎉' : '📖'}</div>
        <div class="result-circle ${passed ? 'pass' : 'fail'}">
          <span class="score">${pct}%</span>
          <span class="label">${correct}/46</span>
        </div>
        <div class="result-msg ${passed ? 'pass' : 'fail'}">
          ${passed ? '!עברת בהצלחה 🎊' : 'צריך עוד תרגול 💪'}
        </div>
        <p style="color:var(--text2);font-size:.9rem">זמן: ${mins} דקות | נדרש: 83% (38/46)</p>
      </div>
      
      <div style="display:flex;gap:8px;margin:20px 0">
        <button class="btn btn-secondary" style="flex:1" onclick="navigate('review')">📋 סקירת שאלות</button>
        <button class="btn btn-primary" style="flex:1" onclick="navigate('test_start')">🔄 מבחן חדש</button>
      </div>
      <button class="btn btn-secondary btn-block" onclick="navigate('home')">🏠 דף הבית</button>
    </div>`;
}

function renderReview() {
  const wrong = [];
  const right = [];
  state.testAnswers.forEach((ans, i) => {
    const q = state.testQuestions[i];
    const isCorrect = ans === q.a;
    const item = { q: q.q, userAns: q.o[ans], correctAns: q.o[q.a], isCorrect, he: q.he };
    if (isCorrect) right.push(item); else wrong.push(item);
  });

  return `
    <div class="screen active">
      <button class="btn-back" onclick="navigate('results')">← חזרה לתוצאות</button>
      <h2 style="font-size:1.3rem;font-weight:800;margin:12px 0;direction:rtl">📋 סקירת תשובות</h2>
      ${wrong.length > 0 ? `
        <h3 style="color:var(--red);font-size:1rem;margin:16px 0 8px;direction:rtl">❌ תשובות שגויות (${wrong.length})</h3>
        ${wrong.map(item => `
          <div class="review-item wrong">
            <div class="q">${item.q}</div>
            <div class="ans wrong-ans">Your answer: <span>${item.userAns}</span></div>
            <div class="ans correct-ans">Correct: <span>${item.correctAns}</span></div>
            <div class="explanation" style="margin-top:10px"><p>${item.he}</p></div>
          </div>
        `).join('')}
      ` : ''}
      <h3 style="color:var(--green);font-size:1rem;margin:16px 0 8px;direction:rtl">✅ תשובות נכונות (${right.length})</h3>
      ${right.map(item => `
        <div class="review-item right">
          <div class="q">${item.q}</div>
          <div class="ans correct-ans">✓ <span>${item.correctAns}</span></div>
        </div>
      `).join('')}
    </div>`;
}

function renderReference() {
  return `
    <div class="screen active">
      <button class="btn-back" onclick="navigate('home')">← חזרה לדף הבית</button>
      <h2 style="font-size:1.3rem;font-weight:800;margin:12px 0">📋 Quick Reference / טבלאות עזר</h2>
      
      <div class="tabs">
        <div class="tab ${state.refTab === 'speed' ? 'active' : ''}" onclick="setRefTab('speed')">מהירויות</div>
        <div class="tab ${state.refTab === 'distance' ? 'active' : ''}" onclick="setRefTab('distance')">מרחקים</div>
        <div class="tab ${state.refTab === 'curbs' ? 'active' : ''}" onclick="setRefTab('curbs')">צבעי מדרכה</div>
        <div class="tab ${state.refTab === 'bac' ? 'active' : ''}" onclick="setRefTab('bac')">אלכוהול</div>
      </div>
      
      ${state.refTab === 'speed' ? renderSpeedRef() : ''}
      ${state.refTab === 'distance' ? renderDistanceRef() : ''}
      ${state.refTab === 'curbs' ? renderCurbRef() : ''}
      ${state.refTab === 'bac' ? renderBACRef() : ''}
    </div>`;
}

function renderSpeedRef() {
  return `
    <table class="ref-table">
      <tr><th>Location / מיקום</th><th>MPH</th><th>קמ״ש</th></tr>
      <tr><td>🏘️ Residential / אזור מגורים</td><td>25</td><td>~40</td></tr>
      <tr><td>🏢 Business / אזור עסקי</td><td>25</td><td>~40</td></tr>
      <tr><td>🏫 School zone / אזור בית ספר</td><td>25</td><td>~40</td></tr>
      <tr><td>🚶 Alley / סמטה</td><td>15</td><td>~24</td></tr>
      <tr><td>🔲 Blind intersection / צומת עיוור</td><td>15</td><td>~24</td></tr>
      <tr><td>🚂 Railroad (no view) / מסילת רכבת</td><td>15</td><td>~24</td></tr>
      <tr><td>🛤️ Two-lane highway / כביש דו-נתיבי</td><td>55</td><td>~88</td></tr>
      <tr><td>🛣️ Freeway / כביש מהיר</td><td>65</td><td>~105</td></tr>
      <tr><td>🛣️ Some freeways / כבישים מהירים מסוימים</td><td>70</td><td>~113</td></tr>
    </table>
    <div class="explanation" style="margin-top:12px">
      <h4>💡 טיפ חשוב</h4>
      <p>בארה״ב המהירות נמדדת במיילים לשעה (mph). מייל אחד = 1.6 ק״מ. הכלל הפשוט: כפול ב-1.6 כדי לקבל קמ״ש.</p>
    </div>`;
}

function renderDistanceRef() {
  return `
    <table class="ref-table">
      <tr><th>Rule / כלל</th><th>Feet</th><th>מטרים</th></tr>
      <tr><td>🚂 Stop before railroad / עצור לפני מסילה</td><td>15 ft</td><td>~4.5 מ׳</td></tr>
      <tr><td>📏 Signal before turn / איתות לפני פניה</td><td>100 ft</td><td>~30 מ׳</td></tr>
      <tr><td>↩️ Center turn lane / נתיב פניה</td><td>200 ft</td><td>~60 מ׳</td></tr>
      <tr><td>🔥 Park from fire hydrant / חניה מהידרנט</td><td>15 ft</td><td>~4.5 מ׳</td></tr>
      <tr><td>🚂 Railroad view needed / שדה ראיה מסילה</td><td>400 ft</td><td>~120 מ׳</td></tr>
      <tr><td>🏫 School zone / אזור בית ספר</td><td>500-1000 ft</td><td>~150-300 מ׳</td></tr>
      <tr><td>💡 Headlight visibility / נראות פנסים</td><td>1000 ft</td><td>~300 מ׳</td></tr>
      <tr><td>🔊 Horn audibility / שמיעת צופר</td><td>200 ft</td><td>~60 מ׳</td></tr>
    </table>
    <div class="explanation" style="margin-top:12px">
      <h4>💡 טיפ חשוב</h4>
      <p>פוט אחד (foot) = כ-30 ס״מ. 100 פוט ≈ 30 מטר. 1000 פוט ≈ 300 מטר.</p>
    </div>`;
}

function renderCurbRef() {
  return `
    <table class="ref-table">
      <tr><th>Color / צבע</th><th>Meaning / משמעות</th></tr>
      <tr><td style="color:#ef4444;font-weight:700">🔴 Red / אדום</td><td>No stopping, standing, or parking / אסור לעצור, לעמוד, או לחנות</td></tr>
      <tr><td style="color:#eab308;font-weight:700">🟡 Yellow / צהוב</td><td>Loading/unloading only / פריקה וטעינה בלבד (לפעמים עם הגבלת זמן)</td></tr>
      <tr><td style="font-weight:700">⚪ White / לבן</td><td>5-minute passenger loading / עד 5 דקות להורדה והעלאת נוסעים</td></tr>
      <tr><td style="color:#22c55e;font-weight:700">🟢 Green / ירוק</td><td>Limited time parking / חניה מוגבלת בזמן (בדוק שלט)</td></tr>
      <tr><td style="color:#3b82f6;font-weight:700">🔵 Blue / כחול</td><td>Disabled parking only / חניית נכים בלבד (צריך תג)</td></tr>
    </table>`;
}

function renderBACRef() {
  return `
    <table class="ref-table">
      <tr><th>Driver Type / סוג נהג</th><th>BAC Limit</th><th>הסבר</th></tr>
      <tr><td>👤 21+ Regular / רגיל</td><td>0.08%</td><td>גבול אלכוהול בדם לנהג רגיל</td></tr>
      <tr><td>🧑 Under 21 / מתחת ל-21</td><td>0.01%</td><td>אפס סובלנות! כמעט כל כמות אסורה</td></tr>
      <tr><td>🚛 Commercial / מסחרי</td><td>0.04%</td><td>גבול מחמיר לנהגי משא ואוטובוס</td></tr>
      <tr><td>🚕 Rideshare / הסעות</td><td>0.04%</td><td>נהגי אובר/ליפט וכד׳</td></tr>
    </table>
    <div class="explanation" style="margin-top:12px">
      <h4>💡 מידע חשוב</h4>
      <p>בקליפורניה חל חוק "הסכמה משתמעת" (Implied Consent) — ברגע שיש לך רישיון נהיגה, הסכמת מראש לבדיקת אלכוהול. סירוב = השעיית רישיון מיידית.</p>
    </div>`;
}

function renderNav() {
  const items = [
    { screen: 'home', icon: '🏠', label: 'ראשי' },
    { screen: 'study', icon: '📚', label: 'לימוד' },
    { screen: 'test_start', icon: '📝', label: 'מבחן' },
    { screen: 'reference', icon: '📋', label: 'עזר' }
  ];
  return `
    <nav class="nav-bottom">
      ${items.map(item => `
        <button class="nav-btn ${state.screen === item.screen || (item.screen === 'test_start' && ['test','results','review'].includes(state.screen)) ? 'active' : ''}" 
          onclick="navigate('${item.screen}')">
          <span class="icon">${item.icon}</span>
          ${item.label}
        </button>
      `).join('')}
    </nav>`;
}

// Navigation
function navigate(screen) {
  if (state.testTimerId && screen !== 'test') {
    // Don't clear timer when navigating within test flow
    if (!['results', 'review'].includes(screen)) {
      clearInterval(state.testTimerId);
      state.testTimerId = null;
    }
  }
  state.screen = screen;
  state.studyAnswered = false;
  render();
  window.scrollTo(0, 0);
}

function setRefTab(tab) {
  state.refTab = tab;
  render();
}

// Study mode
function startStudy(cat) {
  state.studyCat = cat;
  state.studyIdx = 0;
  state.studyAnswered = false;
  state.screen = 'study_q';
  render();
}

function answerStudy(idx) {
  if (state.studyAnswered) return;
  state.studyAnswered = true;
  const questions = getCatQuestions(state.studyCat);
  const q = questions[state.studyIdx];
  markStudied(q.id);

  const options = document.querySelectorAll('#study-options .option');
  options.forEach((opt, i) => {
    opt.classList.add('disabled');
    if (i === q.a) opt.classList.add('correct');
    if (i === idx && idx !== q.a) opt.classList.add('wrong');
  });

  const expDiv = document.getElementById('study-explanation');
  expDiv.innerHTML = `
    <div class="explanation">
      <h4>💡 הסבר</h4>
      <p>${q.he}</p>
      ${q.tip ? `<div class="tip">💡 ${q.tip}</div>` : ''}
    </div>`;
}

function nextStudy() {
  const questions = getCatQuestions(state.studyCat);
  if (state.studyIdx < questions.length - 1) {
    state.studyIdx++;
    state.studyAnswered = false;
    render();
  } else {
    navigate('study');
  }
}

function prevStudy() {
  if (state.studyIdx > 0) {
    state.studyIdx--;
    state.studyAnswered = false;
    render();
  }
}

// Test mode
function startTest() {
  const shuffled = [...QUESTIONS].sort(() => Math.random() - 0.5);
  state.testQuestions = shuffled.slice(0, 46);
  state.testIdx = 0;
  state.testAnswers = [];
  state.testStartTime = Date.now();
  state.screen = 'test';

  if (state.testTimerId) clearInterval(state.testTimerId);
  state.testTimerId = setInterval(() => {
    const timer = document.getElementById('test-timer');
    if (timer) {
      const elapsed = Math.floor((Date.now() - state.testStartTime) / 1000);
      const mins = Math.floor(elapsed / 60);
      const secs = elapsed % 60;
      timer.textContent = `⏱ ${mins}:${secs.toString().padStart(2, '0')}`;
    }
  }, 1000);

  render();
}

function answerTest(idx) {
  if (state.testAnswers[state.testIdx] !== undefined) return;
  state.testAnswers[state.testIdx] = idx;
  const q = state.testQuestions[state.testIdx];

  const options = document.querySelectorAll('.options .option');
  options.forEach((opt, i) => {
    opt.classList.add('disabled');
    if (i === q.a) opt.classList.add('correct');
    if (i === idx && idx !== q.a) opt.classList.add('wrong');
  });

  // Re-render to show explanation and next button
  render();
}

function nextTest() {
  if (state.testIdx < 45) {
    state.testIdx++;
    render();
    window.scrollTo(0, 0);
  } else {
    // Save test result
    const correct = state.testAnswers.filter((ans, i) => ans === state.testQuestions[i].a).length;
    const pct = Math.round((correct / 46) * 100);
    state.progress.tests.push({ date: new Date().toISOString(), score: pct, correct, total: 46 });
    saveProgress();
    navigate('results');
  }
}

// Reset progress
function resetProgress() {
  if (confirm('האם אתה בטוח שברצונך לאפס את כל ההתקדמות?')) {
    state.progress = { studied: {}, tests: [] };
    saveProgress();
    navigate('home');
  }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  render();
});
