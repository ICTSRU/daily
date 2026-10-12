/**
 * =====================================================================
 *  ICTD Daily Check Report — v3.3  (built on SRU Secure Access Kit v1.4)
 *  Access: Sulaiman Al Rajhi University Google accounts (@sr.edu.sa) on the AllowedUsers list
 *  ICTD — ITOC
 * ---------------------------------------------------------------------
 *  Files:  Code.gs · Index.html (the Daily Check app) · Logos.html · Denied.html
 *  Deploy: Deploy ▸ Manage deployments ▸ ✏️ Edit  (or New deployment) ▸ Web app
 *          Execute as: Me  ·  Who has access: Anyone within Sulaiman Al Rajhi University
 *  Data:   tab "Daily" (one row per unit per day, Key = YYYY-MM-DD|UNIT)
 *  Images: Drive folder "ICTD Daily Check - Attachments/<date>/" (shared inside sr.edu.sa)
 *  Access log: every sign-in → tab "AccessLog" · Access list: tab "AllowedUsers"
 *  There is NO public JSON API any more: the page talks to the server with
 *  google.script.run, and every server function starts with requireSruUser_().
 * =====================================================================
 */

/* ▼▼▼ CONFIG ▼▼▼ */
const APP_NAME       = 'تقرير الفحص اليومي';
const APP_NAME_EN    = 'ICTD Daily Check Report';
const APP_VERSION    = '3.3';
const ALLOWED_DOMAIN = 'sr.edu.sa';
const FAVICON_URL    = 'https://ictsru.github.io/ITOC/assets/itoc-logo.png';

/* Data */
const SHEET_ID = '1BxNsw79z9XsyPBS6mC78TcsuQooyAzDpDkzLQcCu7lM';   // ICTD Daily Check Report - Data
const TAB      = 'Daily';
const HEADERS  = ['Key','Date','Unit','Status','CheckTime','Items','Normal','Minor','Major','Critical',
                  'MainTasks','HotIssues','NotAvailable','Notes','MorningSupport','SubmittedBy','Timestamp','Attachments','SavedBy'];
const ATT_FOLDER    = 'ICTD Daily Check - Attachments';
const ATT_FOLDER_ID = '';   // optional: paste a Drive folder ID to store screenshots there (skips the folder lookup)
const MAX_UPLOAD_MB = 10;

/* Access log */
const LOG_ENABLED        = true;
const LOG_SPREADSHEET_ID = SHEET_ID;
const SHEET_LOG          = 'AccessLog';
const LOG_TIMEZONE       = 'Asia/Riyadh';
const LOG_DEDUP_MINUTES  = 30;
const LOG_RETENTION_DAYS = 180;
/* Access list */
const ACCESS_MODE           = 'LIST';      // 'LIST' = only active emails in AllowedUsers · 'DOMAIN' = any @sr.edu.sa
const ACCESS_SPREADSHEET_ID = SHEET_ID;
const SHEET_ACCESS          = 'AllowedUsers';
const OWNER_EMAILS          = ['m.elmahdy@sr.edu.sa'];
const DEFAULT_ALLOWED = [
  // [email, name, role, notes] — trim to the people who need the Daily Check before running setup
  ['nabounar@sr.edu.sa',    'Nasser Abounar',     'admin', 'CIO'],
  ['m.elmahdy@sr.edu.sa',   'Mohamed ElMahdy',    'admin', 'Owner — IT Operations Manager'],
  ['m.omar@sr.edu.sa',      'Mohamed Hassanein',  'user',  'DSSC'],
  ['m.saleh@sr.edu.sa',     'Mohamed Saleh',      'user',  'AAU'],
  ['n.nawaz@sr.edu.sa',     'Mohamed Nawaz',      'user',  'NOC & SOC'],
  ['a.elnadi@sr.edu.sa',    'Atef Elnadi',        'user',  'NOC & SOC'],
  ['a.alrowedan@sr.edu.sa', 'Ammar Al Rowedan',   'user',  ''],
  ['n.alrashidi@sr.edu.sa', 'Nayed Alrashidi',    'user',  ''],
  ['a.alawaji@sr.edu.sa',   'Abd Alazez Al Awaji','user',  ''],
  ['a.alaqeel@sr.edu.sa',   'Azzam Al Aqeel',     'user',  ''],
  ['a.alolayan@sr.edu.sa',  '',                   'user',  ''],
  ['s.albusayli@sr.edu.sa', '',                   'user',  ''],
  ['i.almutairi@sr.edu.sa', '',                   'user',  '']
];
const ACCESS_CACHE_SECONDS = 120;
/* ▲▲▲ CONFIG ▲▲▲ */

const LOG_HEADERS = ['timestamp', 'date', 'time', 'day', 'email', 'result', 'version'];
const DAYS_AR_    = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

/* ============================== Web app ============================== */

function doGet(e) {
  const email = currentEmail_();
  const status = accessStatus_(email);
  if (status !== 'ok') {
    logAccess_(email || '(unknown)', status === 'list' ? 'not-listed' : 'denied');
    const d = HtmlService.createTemplateFromFile('Denied');
    d.appName = APP_NAME; d.appNameEn = APP_NAME_EN;
    d.userEmail = email || '';
    d.reason = status;
    return d.evaluate().setTitle(APP_NAME + ' | غير مصرح')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }
  logAccess_(email, 'granted');

  const view = String((e && e.parameter && e.parameter.view) || '').replace(/[^a-z]/g, '');
  const t = HtmlService.createTemplateFromFile('Index');
  t.bootJson = safeJson_({ email: email, version: APP_VERSION, view: view });
  const out = t.evaluate().setTitle(APP_NAME_EN + ' | ' + APP_NAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  if (FAVICON_URL) out.setFaviconUrl(FAVICON_URL);
  return out;
}

/* ===================== Server calls from the page ===================== */
/* Every function below starts with requireSruUser_() — the page check alone is not enough. */

/** All saved reports (array of row objects keyed by header). */
function apiList() {
  requireSruUser_();
  return readAll_(getSheet_());
}

/** Insert or update one report (matched by Key). Stamps SavedBy with the signed-in account. */
function apiSave(row) {
  const email = requireSruUser_();
  if (!row || !row.Key || !/^\d{4}-\d{2}-\d{2}\|[A-Z]+$/.test(String(row.Key))) return { ok: false, error: 'Missing or invalid Key' };
  row.SavedBy = email;
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sh = getSheet_();
    const head = headers_(sh);
    const i = keys_(sh).indexOf(String(row.Key));
    const values = [head.map(h => (row[h] === undefined || row[h] === null) ? '' : String(row[h]))];
    if (i === -1) sh.getRange(sh.getLastRow() + 1, 1, 1, head.length).setValues(values);
    else          sh.getRange(i + 2, 1, 1, head.length).setValues(values);
    return { ok: true, key: row.Key, mode: i === -1 ? 'inserted' : 'updated' };
  } finally {
    lock.releaseLock();
  }
}

/** Delete one report. */
function apiDelete(key) {
  requireSruUser_();
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sh = getSheet_();
    const i = keys_(sh).indexOf(String(key || ''));
    if (i === -1) return { ok: false, error: 'Not found' };
    sh.deleteRow(i + 2);
    return { ok: true, deleted: key };
  } finally {
    lock.releaseLock();
  }
}

/** Save one image (base64) into ATT_FOLDER/<date>/ — shared view-only inside sr.edu.sa. */
function apiUpload(b) {
  const email = requireSruUser_();
  b = b || {};
  if (!b.data) return { ok: false, error: 'No image data' };
  const bytes = Utilities.base64Decode(b.data);
  if (bytes.length > MAX_UPLOAD_MB * 1024 * 1024) return { ok: false, error: 'Image larger than ' + MAX_UPLOAD_MB + ' MB' };
  const mime = /^image\//.test(b.mime || '') ? b.mime : 'image/png';
  const name = String(b.name || ('screenshot-' + Date.now())).replace(/[\\/:*?"<>|]+/g, '-');
  const day = /^\d{4}-\d{2}-\d{2}$/.test(String(b.date || '')) ? String(b.date)
            : Utilities.formatDate(new Date(), LOG_TIMEZONE, 'yyyy-MM-dd');
  const file = subFolder_(rootFolder_(), day).createFile(Utilities.newBlob(bytes, mime, name));
  file.setDescription('ICTD Daily Check · ' + (b.unit || '') + ' · ' + day + ' · uploaded by ' + email);
  try { file.setSharing(DriveApp.Access.DOMAIN_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) { /* stays private to the owner */ }
  return { ok: true, id: file.getId(), url: file.getUrl(), name: file.getName() };
}

/* ============================ Data helpers ============================ */

function getSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sh = ss.getSheetByName(TAB);
  if (!sh) {
    // first run: rename the original first tab (never AccessLog / AllowedUsers)
    sh = ss.getSheets().find(s => [SHEET_LOG, SHEET_ACCESS].indexOf(s.getName()) === -1) || ss.insertSheet(TAB);
    sh.setName(TAB);
  }
  const lastCol = Math.max(sh.getLastColumn(), 1);
  const have = sh.getRange(1, 1, 1, lastCol).getDisplayValues()[0].filter(String);
  const missing = HEADERS.filter(h => have.indexOf(h) === -1);
  if (have.length === 0) sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  else if (missing.length) sh.getRange(1, have.length + 1, 1, missing.length).setValues([missing]);
  return sh;
}
function headers_(sh) { return sh.getRange(1, 1, 1, sh.getLastColumn()).getDisplayValues()[0]; }
function keys_(sh) {
  return sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 1).getDisplayValues().map(r => r[0]) : [];
}
function readAll_(sh) {
  const n = sh.getLastRow() - 1;
  if (n < 1) return [];
  const head = headers_(sh);
  return sh.getRange(2, 1, n, head.length).getDisplayValues()
    .filter(r => r[0])
    .map(r => { const o = {}; head.forEach((h, i) => { if (h) o[h] = r[i]; }); return o; });
}
function rootFolder_() {
  if (ATT_FOLDER_ID) return DriveApp.getFolderById(ATT_FOLDER_ID);
  const cached = PropertiesService.getScriptProperties().getProperty('ATT_FOLDER_ID');
  if (cached) { try { return DriveApp.getFolderById(cached); } catch (e) { /* folder removed — recreate */ } }
  let parent;
  try {
    const parents = DriveApp.getFileById(SHEET_ID).getParents();
    parent = parents.hasNext() ? parents.next() : DriveApp.getRootFolder();
  } catch (e) {
    console.warn('Sheet folder not readable (' + e + ') — using My Drive root');
    parent = DriveApp.getRootFolder();
  }
  const it = parent.getFoldersByName(ATT_FOLDER);
  const folder = it.hasNext() ? it.next() : parent.createFolder(ATT_FOLDER);
  PropertiesService.getScriptProperties().setProperty('ATT_FOLDER_ID', folder.getId());
  return folder;
}
function subFolder_(root, name) {
  const it = root.getFoldersByName(name);
  return it.hasNext() ? it.next() : root.createFolder(name);
}

/* =============================== Access =============================== */

function currentEmail_() { return String(Session.getActiveUser().getEmail() || '').toLowerCase(); }
function isAllowed_(email) { return !!email && email.endsWith('@' + ALLOWED_DOMAIN); }
function requireSruUser_() {
  const email = currentEmail_();
  const status = accessStatus_(email);
  if (status === 'domain') throw new Error('غير مصرح — الدخول لمنسوبي الجامعة فقط');
  if (status === 'list') throw new Error('غير مصرح — حسابك غير مضاف إلى قائمة المصرّح لهم');
  return email;
}

const ACCESS_HEADERS = ['email', 'name', 'role', 'active', 'notes'];

function accessStatus_(email) {
  if (!isAllowed_(email)) return 'domain';
  if (ACCESS_MODE !== 'LIST') return 'ok';
  if (OWNER_EMAILS.map(e => e.toLowerCase()).indexOf(email) !== -1) return 'ok';
  return allowedEmails_().indexOf(email) !== -1 ? 'ok' : 'list';
}
function allowedEmails_() {
  const cache = CacheService.getScriptCache();
  const hit = cache.get('acl_v1');
  if (hit) return JSON.parse(hit);
  let list = [];
  try {
    const sh = accessSheet_(false);
    if (sh && sh.getLastRow() > 1) {
      list = sh.getRange(2, 1, sh.getLastRow() - 1, 4).getValues()
        .filter(r => r[0] && r[3] !== false && String(r[3]).toUpperCase() !== 'FALSE')
        .map(r => String(r[0]).trim().toLowerCase());
    }
  } catch (e) { console.error('allowedEmails_ failed: ' + e); }
  cache.put('acl_v1', JSON.stringify(list), ACCESS_CACHE_SECONDS);
  return list;
}
function accessSheet_(create) {
  const ss = SpreadsheetApp.openById(ACCESS_SPREADSHEET_ID);
  let sh = ss.getSheetByName(SHEET_ACCESS);
  if (!sh && create) {
    sh = ss.insertSheet(SHEET_ACCESS);
    sh.getRange(1, 1, 1, ACCESS_HEADERS.length).setValues([ACCESS_HEADERS])
      .setFontWeight('bold').setFontColor('#ffffff').setBackground('#501e8c');
    sh.setFrozenRows(1);
    sh.setRightToLeft(true);
    [260, 200, 100, 70, 260].forEach((w, i) => sh.setColumnWidth(i + 1, w));
    sh.getRange(2, 4, 300, 1).insertCheckboxes();
    sh.getRange('A1').setNote('البريد الجامعي كاملًا — name@sr.edu.sa');
    sh.getRange('C1').setNote('admin / user');
    sh.getRange('D1').setNote('ألغِ العلامة لإيقاف الوصول دون حذف الصف');
  }
  return sh;
}
/** Creates/refreshes the AllowedUsers tab (keeps existing rows; writes from row 2 — kit v1.4 fix). */
function setupAccessList() {
  const sh = accessSheet_(true);
  const n = Math.max(sh.getLastRow() - 1, 0);
  const data = n ? sh.getRange(2, 1, n, 5).getValues() : [];
  const kept = data.filter(r => String(r[0]).trim())
    .map(r => [String(r[0]).trim(), r[1], r[2], r[3] === true || String(r[3]).toUpperCase() === 'TRUE', r[4]]);
  const have = kept.map(r => r[0].toLowerCase());
  const seed = OWNER_EMAILS.map(e => [e, 'Owner', 'admin', 'owner']).concat(DEFAULT_ALLOWED);
  let added = 0;
  seed.forEach(r => {
    const e = String(r[0]).trim().toLowerCase();
    if (e && have.indexOf(e) === -1) { kept.push([e, r[1] || '', r[2] || 'user', true, r[3] || 'added by setupAccessList']); have.push(e); added++; }
  });
  if (n) sh.getRange(2, 1, n, 5).clearContent();
  const rows = Math.max(n, kept.length, 50);
  sh.getRange(2, 4, rows, 1).insertCheckboxes();
  if (kept.length) sh.getRange(2, 1, kept.length, 5).setValues(kept);
  CacheService.getScriptCache().remove('acl_v1');
  console.log('AllowedUsers ready: ' + kept.length + ' entries (' + added + ' added).');
  try { SpreadsheetApp.getActive().toast('قائمة المصرّح لهم جاهزة: ' + kept.length + ' بريدًا (أُضيف ' + added + ').', SHEET_ACCESS, 8); } catch (e) {}
}

/* ============================= Access log ============================= */

function logAccess_(email, result) {
  if (!LOG_ENABLED) return;
  try {
    if (LOG_DEDUP_MINUTES > 0 && result === 'granted') {
      const cache = CacheService.getScriptCache();
      const key = 'log_' + email;
      if (cache.get(key)) return;
      cache.put(key, '1', LOG_DEDUP_MINUTES * 60);
    }
    const now = new Date();
    const f = p => Utilities.formatDate(now, LOG_TIMEZONE, p);
    getLogSheet_().appendRow([now, f('yyyy-MM-dd'), f('HH:mm:ss'), DAYS_AR_[Number(f('u')) % 7],
      email, result === 'granted' ? 'دخول' : (result === 'not-listed' ? 'غير مدرج' : 'مرفوض'), APP_VERSION]);
  } catch (e) { console.error('logAccess_ failed: ' + e); }
}
function getLogSheet_() {
  const ss = SpreadsheetApp.openById(LOG_SPREADSHEET_ID);
  let sh = ss.getSheetByName(SHEET_LOG);
  if (!sh) {
    sh = ss.insertSheet(SHEET_LOG);
    sh.getRange(1, 1, 1, LOG_HEADERS.length).setValues([LOG_HEADERS])
      .setFontWeight('bold').setFontColor('#ffffff').setBackground('#3a1464');
    sh.setFrozenRows(1);
    sh.setRightToLeft(true);
    sh.getRange('A:A').setNumberFormat('yyyy-mm-dd hh:mm:ss');
    [170, 100, 80, 80, 260, 80, 70].forEach((w, i) => sh.setColumnWidth(i + 1, w));
  }
  return sh;
}
function showLogSummary() {
  const sh = getLogSheet_();
  const ui = SpreadsheetApp.getUi();
  const last = sh.getLastRow();
  if (last < 2) { ui.alert('سجل الدخول', 'لا توجد سجلات بعد.', ui.ButtonSet.OK); return; }
  const since = new Date(Date.now() - 30 * 864e5);
  const rows = sh.getRange(2, 1, last - 1, LOG_HEADERS.length).getValues()
    .filter(r => r[0] instanceof Date && r[0] >= since && r[5] === 'دخول');
  const users = {};
  rows.forEach(r => { users[r[4]] = (users[r[4]] || 0) + 1; });
  const top = Object.keys(users).sort((a, b) => users[b] - users[a]).slice(0, 10)
    .map((u, i) => (i + 1) + '. ' + u + ' — ' + users[u]).join('\n');
  ui.alert('سجل الدخول — آخر 30 يومًا — ' + APP_NAME,
    'عدد الزيارات: ' + rows.length + '\nعدد المستخدمين: ' + Object.keys(users).length + '\n\nالأكثر دخولًا:\n' + (top || '—'),
    ui.ButtonSet.OK);
}
function purgeOldLogs() {
  const sh = getLogSheet_();
  const last = sh.getLastRow();
  let removed = 0;
  if (last > 1) {
    const cutoff = new Date(Date.now() - LOG_RETENTION_DAYS * 864e5);
    const stamps = sh.getRange(2, 1, last - 1, 1).getValues();
    for (let i = stamps.length - 1; i >= 0; i--) {
      if (stamps[i][0] instanceof Date && stamps[i][0] < cutoff) { sh.deleteRow(i + 2); removed++; }
    }
  }
  SpreadsheetApp.getActive().toast('حُذف ' + removed + ' سجل أقدم من ' + LOG_RETENTION_DAYS + ' يومًا.', APP_NAME_EN, 6);
}

/* ======================= Setup & sheet menu ======================= */

/** Run once from the editor (▶ Run ▸ setup): approves Sheet + Drive permissions and prepares every tab. */
function setup() {
  const steps = [
    ['1. Daily tab',            () => { const sh = getSheet_(); return 'tab "' + sh.getName() + '" · ' + (sh.getLastRow() - 1) + ' saved reports'; }],
    ['2. AllowedUsers tab',     () => { setupAccessList(); return 'ready'; }],
    ['3. AccessLog tab',        () => { getLogSheet_(); return 'ready'; }],
    ['4. Drive (screenshots)',  () => { const f = rootFolder_(); return 'folder "' + f.getName() + '" · ' + f.getUrl(); }],
    ['5. Signed-in e-mail',     () => currentEmail_() || '(empty — check the deployment "Execute as / Who has access")'],
  ];
  let failed = 0;
  steps.forEach(([name, fn]) => {
    try { console.log('✓ ' + name + ' — ' + fn()); }
    catch (e) { failed++; console.error('✗ ' + name + ' — ' + (e && e.message ? e.message : e)); }
  });
  console.log(failed ? ('Finished with ' + failed + ' problem(s) — send these lines to the platform owner.') : 'All steps OK — now deploy a New version.');
}

/** Run alone to retry only the Drive step (screenshots folder). */
function setupDrive() {
  const f = rootFolder_();
  console.log('✓ Drive folder ready: ' + f.getName() + ' · ' + f.getUrl());
}

function onOpen() {
  try {
    SpreadsheetApp.getUi().createMenu(APP_NAME_EN)
      .addItem('إعداد قائمة المصرّح لهم (AllowedUsers)', 'setupAccessList')
      .addSeparator()
      .addItem('ملخص سجل الدخول (30 يومًا)', 'showLogSummary')
      .addItem('حذف سجلات الدخول القديمة', 'purgeOldLogs')
      .addSeparator()
      .addItem('عرض رابط المنصة', 'showWebAppUrl')
      .addToUi();
  } catch (e) {}
}
function showWebAppUrl() {
  const ui = SpreadsheetApp.getUi();
  ui.alert('رابط ' + APP_NAME, ScriptApp.getService().getUrl() || 'لم يُنشر بعد: Deploy ▸ New deployment ▸ Web app', ui.ButtonSet.OK);
}

/* ============================== Helpers ============================== */

function include(name) { return HtmlService.createHtmlOutputFromFile(name).getContent(); }
function safeJson_(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}
