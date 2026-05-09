// =====================================================================
// 経費管理システム - クラウド版
// Firebase Authentication + Realtime Database + Tesseract.js OCR
// =====================================================================

import { firebaseConfig, isConfigured } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js';
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';
import {
  getDatabase, ref as dbRef, set, update, push, remove, onValue, off, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js';

// =====================================================================
// State
// =====================================================================
let currentUser = null;
let app, auth, db;
let unsubExpenses = null, unsubSettings = null;

let state = {
  expenses: [],
  categories: [
    '旅費交通費','会議費','交際費','消耗品費','通信費','水道光熱費',
    '家賃地代','広告宣伝費','支払手数料','新聞図書費','福利厚生費',
    '租税公課','外注費','雑費'
  ],
  settings: { companyName: '', fiscalStart: 4 },
  rules: getDefaultRules()
};
let charts = {};

// =====================================================================
// 自動仕分けルール(デフォルト)
// =====================================================================
function getDefaultRules() {
  return {
    '旅費交通費': ['JR','東京メトロ','地下鉄','タクシー','TAXI','ETC','ガソリン','ENEOS','出光','コスモ石油','SHELL','駅','新幹線','航空券','ANA','JAL','飛行機','空港','バス','電車','スイカ','SUICA','PASMO','パスモ','レンタカー'],
    '会議費': ['スターバックス','STARBUCKS','ドトール','タリーズ','TULLYS','コメダ','エクセルシオール','ベローチェ','コーヒー','カフェ','喫茶'],
    '交際費': ['居酒屋','レストラン','寿司','焼肉','ラーメン','料亭','BAR','和食','日本料理','ホテル','料理','酒'],
    '消耗品費': ['コンビニ','ローソン','LAWSON','セブン-イレブン','セブンイレブン','7-ELEVEN','ファミリーマート','ファミマ','ミニストップ','文房具','コクヨ','無印良品','MUJI','ニトリ','東急ハンズ','ロフト','LOFT','ダイソー','カインズ','コーナン','ホームセンター'],
    '通信費': ['NTT','ドコモ','DOCOMO','ソフトバンク','SOFTBANK','au','KDDI','楽天モバイル','RAKUTEN','WiFi','インターネット','光回線','フレッツ'],
    '水道光熱費': ['電気料金','東京電力','TEPCO','関西電力','中部電力','ガス料金','東京ガス','大阪ガス','水道料金','水道局'],
    '家賃地代': ['家賃','賃料','賃貸','駐車場','月極','テナント'],
    '広告宣伝費': ['Google広告','Yahoo広告','Meta広告','Facebook広告','Instagram広告','広告','印刷','チラシ','名刺','ポスター'],
    '支払手数料': ['振込手数料','手数料','PayPal','Stripe','Square','銀行手数料'],
    '新聞図書費': ['新聞','書店','書籍','本','BOOK','紀伊國屋','ジュンク堂','丸善','TSUTAYA','蔦屋','日経'],
    '福利厚生費': ['健康診断','人間ドック','社員旅行','歓送迎会','慶弔'],
    '租税公課': ['印紙','収入印紙','登記','登録免許税','自動車税','固定資産税']
  };
}

// =====================================================================
// Utilities
// =====================================================================
const $ = id => document.getElementById(id);
const yen = n => '¥' + Number(n||0).toLocaleString('ja-JP');
const num = n => Number(n||0).toLocaleString('ja-JP');
const ymKey = d => d ? d.slice(0,7) : '';
const yearOf = d => d ? Number(d.slice(0,4)) : null;
const monthOf = d => d ? Number(d.slice(5,7)) : null;

function toast(msg, type='') {
  const t = $('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  setTimeout(() => t.className = 'toast', 2800);
}

// =====================================================================
// Initialize Firebase
// =====================================================================
function initFirebase() {
  if (!isConfigured) {
    $('loading').style.display = 'none';
    $('login').style.display = 'flex';
    $('configWarning').style.display = 'block';
    $('googleSignIn').disabled = true;
    $('googleSignIn').style.opacity = '0.5';
    $('googleSignIn').style.cursor = 'not-allowed';
    return false;
  }
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getDatabase(app);
    return true;
  } catch (e) {
    console.error(e);
    $('loading').style.display = 'none';
    $('login').style.display = 'flex';
    $('configWarning').style.display = 'block';
    $('configWarning').innerHTML = `<strong>⚠ Firebase初期化エラー</strong>${e.message}`;
    return false;
  }
}

// =====================================================================
// Authentication
// =====================================================================
function setupAuth() {
  const provider = new GoogleAuthProvider();

  $('googleSignIn').addEventListener('click', async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error(e);
      toast('ログインに失敗しました: ' + e.message, 'error');
    }
  });

  $('signOutBtn').addEventListener('click', async () => {
    if (unsubExpenses) { unsubExpenses(); unsubExpenses = null; }
    if (unsubSettings) { unsubSettings(); unsubSettings = null; }
    await signOut(auth);
  });

  onAuthStateChanged(auth, user => {
    $('loading').style.display = 'none';
    if (user) {
      currentUser = user;
      $('login').style.display = 'none';
      $('app').style.display = 'block';
      $('userName').textContent = user.displayName || user.email;
      if (user.photoURL) {
        $('userPhoto').src = user.photoURL;
        $('userPhoto').style.display = 'block';
      }
      subscribeData();
    } else {
      currentUser = null;
      $('app').style.display = 'none';
      $('login').style.display = 'flex';
    }
  });
}

// =====================================================================
// Realtime Database subscriptions
// =====================================================================
function subscribeData() {
  const uid = currentUser.uid;

  // Subscribe to expenses
  const expensesRef = dbRef(db, `users/${uid}/expenses`);
  unsubExpenses = onValue(expensesRef, snap => {
    state.expenses = [];
    const data = snap.val() || {};
    Object.keys(data).forEach(id => {
      state.expenses.push({ id, ...data[id] });
    });
    refreshAll();
  }, err => {
    console.error('RTDB error:', err);
    toast('データ読込エラー: ' + err.message, 'error');
  });

  // Subscribe to settings
  const settingsRef = dbRef(db, `users/${uid}/meta/settings`);
  unsubSettings = onValue(settingsRef, snap => {
    const data = snap.val();
    if (data) {
      if (data.categories) state.categories = data.categories;
      if (data.settings) state.settings = { ...state.settings, ...data.settings };
      if (data.rules) state.rules = data.rules;
    } else {
      // First time - save defaults
      saveSettingsDoc();
    }
    renderCategoryOptions();
    if ($('view-settings').classList.contains('active')) renderSettings();
  });
}

async function saveSettingsDoc() {
  if (!currentUser) return;
  const settingsRef = dbRef(db, `users/${currentUser.uid}/meta/settings`);
  await set(settingsRef, {
    categories: state.categories,
    settings: state.settings,
    rules: state.rules,
    updatedAt: serverTimestamp()
  });
}

async function saveExpense(expense) {
  if (!currentUser) return;
  const uid = currentUser.uid;
  if (expense.id) {
    const id = expense.id;
    const data = { ...expense };
    delete data.id;
    data.updatedAt = serverTimestamp();
    await update(dbRef(db, `users/${uid}/expenses/${id}`), data);
    return id;
  } else {
    const data = { ...expense };
    delete data.id;
    data.createdAt = serverTimestamp();
    data.updatedAt = serverTimestamp();
    const newRef = push(dbRef(db, `users/${uid}/expenses`));
    await set(newRef, data);
    return newRef.key;
  }
}

async function deleteExpenseDoc(id) {
  if (!currentUser) return;
  await remove(dbRef(db, `users/${currentUser.uid}/expenses/${id}`));
}

function refreshAll() {
  if ($('view-dashboard').classList.contains('active')) renderDashboard();
  if ($('view-list').classList.contains('active')) renderList();
  if ($('view-summary').classList.contains('active')) renderSummary();
}

// =====================================================================
// Navigation
// =====================================================================
document.querySelectorAll('nav button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    btn.classList.add('active');
    $('view-' + btn.dataset.view).classList.add('active');
    if (btn.dataset.view === 'dashboard') renderDashboard();
    if (btn.dataset.view === 'list') renderList();
    if (btn.dataset.view === 'summary') renderSummary();
    if (btn.dataset.view === 'settings') renderSettings();
  });
});

// =====================================================================
// Categories
// =====================================================================
function renderCategoryOptions() {
  const ec = $('entryCategory');
  const sel = ec.value;
  ec.innerHTML = state.categories.map(c => `<option>${c}</option>`).join('');
  if (sel) ec.value = sel;
  const fc = $('filterCategory');
  fc.innerHTML = '<option value="">勘定科目: すべて</option>' +
    state.categories.map(c => `<option>${c}</option>`).join('');
}

// =====================================================================
// OCR (Tesseract.js)
// =====================================================================
const ocrZone = $('ocrZone');
const ocrFile = $('ocrFile');

ocrZone.addEventListener('click', () => ocrFile.click());
ocrZone.addEventListener('dragover', e => {
  e.preventDefault();
  ocrZone.classList.add('dragging');
});
ocrZone.addEventListener('dragleave', () => ocrZone.classList.remove('dragging'));
ocrZone.addEventListener('drop', e => {
  e.preventDefault();
  ocrZone.classList.remove('dragging');
  const f = e.dataTransfer.files[0];
  if (f) processReceipt(f);
});
ocrFile.addEventListener('change', e => {
  const f = e.target.files[0];
  if (f) processReceipt(f);
  e.target.value = '';
});

async function processReceipt(file) {
  $('ocrProgress').classList.add('show');
  $('ocrResult').classList.remove('show');
  $('ocrLabel').textContent = '日本語データを読み込んでいます...';
  $('ocrPercent').textContent = '0%';
  $('ocrBar').style.width = '0%';

  try {
    const { data: { text } } = await Tesseract.recognize(file, 'jpn', {
      logger: m => {
        if (m.status === 'loading tesseract core') {
          $('ocrLabel').textContent = 'OCRエンジンを読み込んでいます...';
        } else if (m.status === 'loading language traineddata') {
          $('ocrLabel').textContent = '日本語データを読み込んでいます(初回のみ ~15MB)...';
          updateBar(m.progress * 50);
        } else if (m.status === 'initializing api') {
          $('ocrLabel').textContent = 'OCRを初期化しています...';
          updateBar(50 + m.progress * 10);
        } else if (m.status === 'recognizing text') {
          $('ocrLabel').textContent = '文字を認識しています...';
          updateBar(60 + m.progress * 40);
        }
      }
    });
    updateBar(100);
    $('ocrLabel').textContent = '完了';
    setTimeout(() => $('ocrProgress').classList.remove('show'), 600);
    handleOcrResult(text);
  } catch (e) {
    console.error(e);
    $('ocrProgress').classList.remove('show');
    toast('OCR処理に失敗しました: ' + e.message, 'error');
  }
}

function updateBar(p) {
  const v = Math.min(100, Math.max(0, p));
  $('ocrBar').style.width = v + '%';
  $('ocrPercent').textContent = Math.round(v) + '%';
}

function handleOcrResult(text) {
  const date = extractDate(text);
  const amount = extractAmount(text);
  const tax = extractTax(text, amount);
  const vendor = extractVendor(text);
  const category = autoCategorize(text);

  // Display result
  $('ocrText').textContent = text;
  $('ocrSummary').innerHTML = `
    <span><strong>日付:</strong> ${date || '未検出'}</span>
    <span><strong>金額:</strong> ${amount ? yen(amount) : '未検出'}</span>
    <span><strong>消費税:</strong> ${tax ? yen(tax) : '0'}</span>
    <span><strong>取引先:</strong> ${vendor || '未検出'}</span>
    <span><strong>勘定科目:</strong> ${category} <span class="badge auto">自動仕分け</span></span>
  `;
  $('ocrResult').classList.add('show');

  // Auto-fill form
  if (date) $('entryDate').value = date;
  if (amount) $('entryAmount').value = amount;
  if (tax) $('entryTax').value = tax;
  if (vendor) $('entryVendor').value = vendor;
  if (state.categories.includes(category)) $('entryCategory').value = category;
  $('entryMemo').value = `OCR読取: ${vendor || '(取引先不明)'}`;

  toast('レシートを読み取りました - 内容を確認して登録してください', 'success');
  $('entryForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function extractDate(text) {
  // 令和X年MM月DD日
  let m = text.match(/[令和RrＲ]\s*(\d{1,2})\s*[年.\/\-]\s*(\d{1,2})\s*[月.\/\-]\s*(\d{1,2})/);
  if (m) {
    const y = 2018 + parseInt(m[1]);
    return `${y}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
  }
  // 平成X年MM月DD日
  m = text.match(/[平成HhＨ]\s*(\d{1,2})\s*[年.\/\-]\s*(\d{1,2})\s*[月.\/\-]\s*(\d{1,2})/);
  if (m) {
    const y = 1988 + parseInt(m[1]);
    return `${y}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
  }
  // YYYY年MM月DD日
  m = text.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
  if (m) return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
  // YYYY/MM/DD or YYYY-MM-DD or YYYY.MM.DD
  m = text.match(/(20\d{2})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
  return null;
}

function extractAmount(text) {
  const cleaned = text.replace(/\s/g, '');
  const patterns = [
    /(?:合計|合 計|TOTAL|お会計|お買上げ計|お支払い|お支払合計|計|請求金額)[\s:：\.]*[¥￥]?\s*([\d,]+)/i,
    /[¥￥]\s*([\d,]+)/g,
    /([\d,]+)\s*円/g
  ];
  let candidates = [];
  for (const p of patterns) {
    if (p.global) {
      const matches = [...cleaned.matchAll(p)];
      matches.forEach(mm => {
        const n = parseInt(mm[1].replace(/,/g, ''));
        if (n > 0 && n < 10000000) candidates.push(n);
      });
    } else {
      const m = cleaned.match(p);
      if (m) {
        const n = parseInt(m[1].replace(/,/g, ''));
        if (n > 0 && n < 10000000) return n;
      }
    }
  }
  if (candidates.length) return Math.max(...candidates);
  // Fallback: largest number in text
  const nums = (text.match(/[\d,]{3,}/g) || [])
    .map(n => parseInt(n.replace(/,/g, '')))
    .filter(n => n > 0 && n < 10000000);
  return nums.length ? Math.max(...nums) : 0;
}

function extractTax(text, total) {
  const m = text.match(/(?:消費税|内消費税|内税|外税|tax)[\s:：（\(]*(?:10\s*%|8\s*%)?[）\)]?[\s:：]*[¥￥]?\s*([\d,]+)/i);
  if (m) {
    const n = parseInt(m[1].replace(/,/g, ''));
    if (n > 0 && n < total) return n;
  }
  return 0;
}

function extractVendor(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 1);
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const l = lines[i];
    if (l.length > 25) continue;
    if (/^[\d\s\-\/\.]+$/.test(l)) continue;
    if (/^〒|^TEL|^FAX|^電話/.test(l)) continue;
    if (/[都道府県市区町村]\s*\d/.test(l)) continue;
    return l;
  }
  return lines[0] || '';
}

function autoCategorize(text) {
  const upperText = text.toUpperCase();
  let bestCat = '雑費';
  let bestScore = 0;
  for (const [cat, keywords] of Object.entries(state.rules)) {
    let score = 0;
    for (const k of keywords) {
      if (upperText.includes(k.toUpperCase())) score += k.length;
    }
    if (score > bestScore) {
      bestScore = score;
      bestCat = cat;
    }
  }
  return bestCat;
}

// =====================================================================
// Entry form
// =====================================================================
$('entryForm').addEventListener('submit', async e => {
  e.preventDefault();
  const id = $('entryId').value;
  const expense = {
    id: id || undefined,
    date: $('entryDate').value,
    category: $('entryCategory').value,
    vendor: $('entryVendor').value.trim(),
    amount: Number($('entryAmount').value || 0),
    tax: Number($('entryTax').value || 0),
    payment: $('entryPayment').value,
    person: $('entryPerson').value.trim(),
    receipt: $('entryReceipt').value.trim(),
    memo: $('entryMemo').value.trim()
  };
  $('entrySubmit').disabled = true;
  $('entrySubmit').textContent = '保存中...';
  try {
    await saveExpense(expense);
    toast(id ? '経費を更新しました' : '経費を登録しました', 'success');
    resetEntryForm();
  } catch (err) {
    console.error(err);
    toast('保存に失敗しました: ' + err.message, 'error');
  } finally {
    $('entrySubmit').disabled = false;
    $('entrySubmit').textContent = id ? '更新する' : '登録する';
  }
});

function resetEntryForm() {
  $('entryForm').reset();
  $('entryId').value = '';
  $('entryTitle').textContent = '📷 レシート / 請求書から自動仕分け';
  $('entrySubmit').textContent = '登録する';
  $('entryDate').value = new Date().toISOString().slice(0,10);
  $('ocrResult').classList.remove('show');
}
$('entryReset').addEventListener('click', resetEntryForm);

window.editExpense = function(id) {
  const e = state.expenses.find(x => x.id === id);
  if (!e) return;
  $('entryId').value = e.id;
  $('entryDate').value = e.date;
  $('entryCategory').value = e.category;
  $('entryVendor').value = e.vendor || '';
  $('entryAmount').value = e.amount;
  $('entryTax').value = e.tax || '';
  $('entryPayment').value = e.payment || '現金';
  $('entryPerson').value = e.person || '';
  $('entryReceipt').value = e.receipt || '';
  $('entryMemo').value = e.memo || '';
  $('entryTitle').textContent = '経費を編集';
  $('entrySubmit').textContent = '更新する';
  document.querySelector('nav button[data-view="entry"]').click();
};

window.deleteExpense = async function(id) {
  if (!confirm('この経費を削除しますか?')) return;
  try {
    await deleteExpenseDoc(id);
    toast('削除しました');
  } catch (e) {
    toast('削除に失敗しました: ' + e.message, 'error');
  }
};

// =====================================================================
// List view
// =====================================================================
function renderListFilters() {
  const monthSel = $('filterMonth');
  const months = [...new Set(state.expenses.map(e => ymKey(e.date)).filter(Boolean))].sort().reverse();
  const cur = monthSel.value;
  monthSel.innerHTML = '<option value="">月: すべて</option>' +
    months.map(m => `<option value="${m}">${m.replace('-','年')}月</option>`).join('');
  monthSel.value = cur;
}

function renderList() {
  renderListFilters();
  const text = $('filterText').value.toLowerCase();
  const month = $('filterMonth').value;
  const cat = $('filterCategory').value;
  const pay = $('filterPayment').value;

  let rows = [...state.expenses].sort((a,b) => (b.date || '').localeCompare(a.date || ''));
  if (text) rows = rows.filter(r =>
    (r.vendor || '').toLowerCase().includes(text) ||
    (r.memo || '').toLowerCase().includes(text) ||
    (r.receipt || '').toLowerCase().includes(text)
  );
  if (month) rows = rows.filter(r => ymKey(r.date) === month);
  if (cat) rows = rows.filter(r => r.category === cat);
  if (pay) rows = rows.filter(r => r.payment === pay);

  const body = $('listBody');
  if (rows.length === 0) {
    body.innerHTML = '<tr><td colspan="9" class="empty">該当する経費がありません</td></tr>';
  } else {
    body.innerHTML = rows.map(r => `
      <tr>
        <td>${r.date || '-'}</td>
        <td><span class="badge">${r.category || '-'}</span></td>
        <td>${escape(r.vendor) || '-'}</td>
        <td>${escape(r.memo) || '-'}</td>
        <td>${r.payment || '-'}</td>
        <td>${escape(r.person) || '-'}</td>
        <td class="num">${yen(r.amount)}</td>
        <td class="num">${yen(r.tax)}</td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="editExpense('${r.id}')">編集</button>
          <button class="btn btn-danger btn-sm" onclick="deleteExpense('${r.id}')">削除</button>
        </td>
      </tr>
    `).join('');
  }
  const total = rows.reduce((s,r) => s + Number(r.amount||0), 0);
  $('listCount').textContent = `${rows.length}件 / 合計 ${yen(total)}`;
}

function escape(s) {
  if (s == null) return '';
  return String(s).replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c]));
}

['filterText','filterMonth','filterCategory','filterPayment'].forEach(id => {
  $(id).addEventListener('input', renderList);
});
$('clearFilter').addEventListener('click', () => {
  $('filterText').value = '';
  $('filterMonth').value = '';
  $('filterCategory').value = '';
  $('filterPayment').value = '';
  renderList();
});

// =====================================================================
// Dashboard
// =====================================================================
function fillYearSelect(selId) {
  const years = [...new Set(state.expenses.map(e => yearOf(e.date)).filter(Boolean))];
  const cy = new Date().getFullYear();
  if (!years.includes(cy)) years.push(cy);
  years.sort((a,b) => b - a);
  const sel = $(selId);
  const cur = sel.value || cy;
  sel.innerHTML = years.map(y => `<option value="${y}">${y}年</option>`).join('');
  sel.value = cur;
}

function renderDashboard() {
  fillYearSelect('dashYear');
  const year = Number($('dashYear').value);
  const yearExpenses = state.expenses.filter(e => yearOf(e.date) === year);

  const now = new Date();
  const tm = now.toISOString().slice(0,7);
  const lmDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lm = lmDate.toISOString().slice(0,7);

  const tmTotal = state.expenses.filter(e => ymKey(e.date) === tm).reduce((s,e) => s + Number(e.amount||0), 0);
  const lmTotal = state.expenses.filter(e => ymKey(e.date) === lm).reduce((s,e) => s + Number(e.amount||0), 0);
  const yearTotal = yearExpenses.reduce((s,e) => s + Number(e.amount||0), 0);

  $('statThisMonth').textContent = yen(tmTotal);
  $('statThisMonthSub').textContent = `${tm.replace('-','年')}月`;
  $('statLastMonth').textContent = yen(lmTotal);
  $('statLastMonthSub').textContent = `${lm.replace('-','年')}月`;
  if (lmTotal > 0) {
    const diff = ((tmTotal - lmTotal) / lmTotal * 100).toFixed(1);
    const sign = diff >= 0 ? '+' : '';
    $('statThisMonthSub').textContent += ` (前月比 ${sign}${diff}%)`;
  }
  $('statYearTotal').textContent = yen(yearTotal);
  $('statYearTotalSub').textContent = `${year}年合計`;
  $('statCount').textContent = num(state.expenses.length);

  // Monthly bar
  const monthlyTotals = Array(12).fill(0);
  yearExpenses.forEach(e => { monthlyTotals[monthOf(e.date) - 1] += Number(e.amount||0); });
  upsertChart('chartMonthly', 'bar', {
    labels: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
    datasets: [{ label: `${year}年 月次支出`, data: monthlyTotals, backgroundColor: '#2a5298' }]
  }, { plugins: { legend: { display: false } }, scales: { y: { ticks: { callback: v => yen(v) } } } });

  // Category doughnut
  const catMap = {};
  yearExpenses.forEach(e => { catMap[e.category] = (catMap[e.category] || 0) + Number(e.amount || 0); });
  const catLabels = Object.keys(catMap);
  const catData = catLabels.map(l => catMap[l]);
  const palette = ['#1e3c72','#2a5298','#3182ce','#4299e1','#63b3ed','#805ad5','#9f7aea','#d53f8c','#dd6b20','#d69e2e','#38a169','#319795','#e53e3e','#718096'];
  upsertChart('chartCategory', 'doughnut', {
    labels: catLabels,
    datasets: [{ data: catData, backgroundColor: catLabels.map((_,i) => palette[i % palette.length]) }]
  }, { plugins: { legend: { position: 'right' } } });

  // Payment bar
  const payMap = {};
  yearExpenses.forEach(e => {
    const p = e.payment || '未設定';
    payMap[p] = (payMap[p] || 0) + Number(e.amount || 0);
  });
  const payLabels = Object.keys(payMap);
  upsertChart('chartPayment', 'bar', {
    labels: payLabels,
    datasets: [{ label: '支払方法別', data: payLabels.map(l => payMap[l]), backgroundColor: '#38a169' }]
  }, { indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { ticks: { callback: v => yen(v) } } } });
}

function upsertChart(id, type, data, options) {
  if (charts[id]) charts[id].destroy();
  const ctx = $(id).getContext('2d');
  charts[id] = new Chart(ctx, { type, data, options: { responsive: true, maintainAspectRatio: false, ...options } });
}
$('dashYear').addEventListener('change', renderDashboard);

// =====================================================================
// Summary
// =====================================================================
function renderSummary() {
  fillYearSelect('summaryYear');
  const year = Number($('summaryYear').value);
  $('summaryYearLabel').textContent = year;
  const yearExpenses = state.expenses.filter(e => yearOf(e.date) === year);

  const yearTotal = yearExpenses.reduce((s,e) => s + Number(e.amount||0), 0);
  const monthly = Array(12).fill(0);
  yearExpenses.forEach(e => { monthly[monthOf(e.date) - 1] += Number(e.amount||0); });
  const usedMonths = monthly.filter(v => v > 0).length || 1;
  const avg = Math.round(yearTotal / usedMonths);
  const maxIdx = monthly.indexOf(Math.max(...monthly));

  $('sumYearTotal').textContent = yen(yearTotal);
  $('sumMonthAvg').textContent = yen(avg);
  $('sumMaxMonth').textContent = monthly[maxIdx] > 0 ? `${maxIdx+1}月 (${yen(monthly[maxIdx])})` : '-';
  $('sumYearCount').textContent = num(yearExpenses.length);

  const cats = [...new Set(yearExpenses.map(e => e.category))].sort();
  const matrix = {};
  cats.forEach(c => matrix[c] = Array(12).fill(0));
  yearExpenses.forEach(e => { matrix[e.category][monthOf(e.date) - 1] += Number(e.amount||0); });

  let html = '<thead><tr><th>勘定科目</th>';
  for (let i = 1; i <= 12; i++) html += `<th class="num">${i}月</th>`;
  html += '<th class="num">合計</th></tr></thead><tbody>';

  if (cats.length === 0) {
    html += '<tr><td colspan="14" class="empty">該当データがありません</td></tr>';
  } else {
    cats.forEach(c => {
      const row = matrix[c];
      const total = row.reduce((s,v) => s + v, 0);
      html += `<tr><td>${c}</td>`;
      row.forEach(v => html += `<td class="num">${v ? num(v) : '-'}</td>`);
      html += `<td class="num"><strong>${yen(total)}</strong></td></tr>`;
    });
    const colTotals = Array(12).fill(0);
    cats.forEach(c => matrix[c].forEach((v,i) => colTotals[i] += v));
    html += '<tr class="total-row"><td>合計</td>';
    colTotals.forEach(v => html += `<td class="num">${v ? num(v) : '-'}</td>`);
    html += `<td class="num">${yen(yearTotal)}</td></tr>`;
  }
  html += '</tbody>';
  $('summaryMatrix').innerHTML = html;
}
$('summaryYear').addEventListener('change', renderSummary);

// =====================================================================
// Settings view
// =====================================================================
function renderSettings() {
  $('companyName').value = state.settings.companyName || '';
  $('fiscalStart').value = state.settings.fiscalStart || 4;

  const body = $('categoryBody');
  body.innerHTML = state.categories.map(c => `
    <tr>
      <td>${escape(c)}</td>
      <td><button class="btn btn-danger btn-sm" data-cat="${escape(c)}" onclick="window._delCat(this.dataset.cat)">削除</button></td>
    </tr>
  `).join('');

  const editor = $('rulesEditor');
  editor.innerHTML = state.categories.map(cat => {
    const kw = (state.rules[cat] || []).join('、');
    return `
      <div style="margin-bottom:12px;">
        <label style="display:block;font-size:13px;font-weight:600;color:#4a5568;margin-bottom:4px;">${escape(cat)}</label>
        <textarea data-cat="${escape(cat)}" rows="2" style="width:100%;padding:8px 10px;border:1px solid #cbd5e0;border-radius:5px;font-size:13px;font-family:inherit;">${escape(kw)}</textarea>
      </div>
    `;
  }).join('');
}

window._delCat = function(c) {
  const used = state.expenses.some(e => e.category === c);
  if (used) { toast('使用中のため削除できません', 'error'); return; }
  state.categories = state.categories.filter(x => x !== c);
  delete state.rules[c];
  saveSettingsDoc().then(() => toast('削除しました', 'success'));
};

$('addCategory').addEventListener('click', async () => {
  const inp = $('newCategory');
  const v = inp.value.trim();
  if (!v) return;
  if (state.categories.includes(v)) { toast('既に存在します', 'error'); return; }
  state.categories.push(v);
  if (!state.rules[v]) state.rules[v] = [];
  await saveSettingsDoc();
  inp.value = '';
  toast('追加しました', 'success');
});

$('saveSettings').addEventListener('click', async () => {
  state.settings.companyName = $('companyName').value.trim();
  state.settings.fiscalStart = Number($('fiscalStart').value);
  await saveSettingsDoc();
  toast('設定を保存しました', 'success');
});

$('saveRules').addEventListener('click', async () => {
  const newRules = {};
  document.querySelectorAll('#rulesEditor textarea').forEach(ta => {
    const cat = ta.dataset.cat;
    const keywords = ta.value.split(/[、,\n]/).map(s => s.trim()).filter(Boolean);
    if (keywords.length) newRules[cat] = keywords;
  });
  state.rules = newRules;
  await saveSettingsDoc();
  toast('仕分けルールを保存しました', 'success');
});

$('resetRules').addEventListener('click', async () => {
  if (!confirm('仕分けルールをデフォルトに戻しますか?')) return;
  state.rules = getDefaultRules();
  await saveSettingsDoc();
  toast('デフォルトに戻しました', 'success');
});

// =====================================================================
// CSV Export
// =====================================================================
$('exportCsv').addEventListener('click', () => {
  const rows = [['日付','勘定科目','取引先','摘要','支払方法','担当者','領収書No','税込金額','消費税']];
  state.expenses.forEach(e => {
    rows.push([
      e.date, e.category, e.vendor || '', e.memo || '',
      e.payment || '', e.person || '', e.receipt || '',
      e.amount || 0, e.tax || 0
    ]);
  });
  const csv = rows.map(r => r.map(c => {
    const s = String(c).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  }).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `経費データ_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast('CSVを出力しました', 'success');
});

// =====================================================================
// Boot
// =====================================================================
$('entryDate').value = new Date().toISOString().slice(0,10);
if (initFirebase()) {
  setupAuth();
}
