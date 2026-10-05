/**
 * ICTD Daily Check Report — Google Sheets backend (Apps Script Web App)
 * Version 1.6 · Sulaiman Al Rajhi University · ICTD
 *
 * Sheet : "ICTD Daily Check Report - Data"
 * Tab   : "Daily"  (the first tab is renamed automatically on first run)
 *
 * GET  <webapp-url>                 -> all saved reports (JSON array of rows)
 * GET  <webapp-url>?date=YYYY-MM-DD -> reports for one day
 * POST <webapp-url>  body {action:'save',   row:{...}}  -> insert or update by Key (YYYY-MM-DD|UNIT)
 * POST <webapp-url>  body {action:'delete', key:'...'}  -> delete one report
 *
 * Deploy: Deploy > New deployment > Web app
 *         Execute as: Me   ·   Who has access: Anyone
 */

const SHEET_ID = '1BxNsw79z9XsyPBS6mC78TcsuQooyAzDpDkzLQcCu7lM';
const TAB      = 'Daily';
const HEADERS  = ['Key','Date','Unit','Status','CheckTime','Items','Normal','Minor','Major','Critical',
                  'MainTasks','HotIssues','NotAvailable','Notes','MorningSupport','SubmittedBy','Timestamp'];

function getSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sh = ss.getSheetByName(TAB);
  if (!sh) { sh = ss.getSheets()[0]; sh.setName(TAB); }
  // make sure every header exists (adds new columns at the end if the page adds fields later)
  const lastCol = Math.max(sh.getLastColumn(), 1);
  const have = sh.getRange(1, 1, 1, lastCol).getDisplayValues()[0].filter(String);
  const missing = HEADERS.filter(h => have.indexOf(h) === -1);
  if (have.length === 0) {
    sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  } else if (missing.length) {
    sh.getRange(1, have.length + 1, 1, missing.length).setValues([missing]);
  }
  sh.setFrozenRows(1);
  sh.getRange('A:E').setNumberFormat('@');   // keep Key / Date / time as plain text
  return sh;
}

function headers_(sh) {
  return sh.getRange(1, 1, 1, sh.getLastColumn()).getDisplayValues()[0];
}

function readAll_(sh) {
  const n = sh.getLastRow() - 1;
  if (n < 1) return [];
  const head = headers_(sh);
  return sh.getRange(2, 1, n, head.length).getDisplayValues()
    .filter(r => r[0])
    .map(r => { const o = {}; head.forEach((h, i) => { if (h) o[h] = r[i]; }); return o; });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  try {
    const sh = getSheet_();
    let rows = readAll_(sh);
    const date = e && e.parameter && e.parameter.date;
    if (date) rows = rows.filter(r => String(r.Key).indexOf(date + '|') === 0);
    return json_(rows);
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const sh = getSheet_();
    const head = headers_(sh);
    const keys = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 1).getDisplayValues().map(r => r[0]) : [];

    if (body.action === 'delete') {
      const i = keys.indexOf(String(body.key || ''));
      if (i === -1) return json_({ ok: false, error: 'Not found' });
      sh.deleteRow(i + 2);
      return json_({ ok: true, deleted: body.key });
    }

    const row = body.row || body;                 // action 'save' (default)
    if (!row.Key) return json_({ ok: false, error: 'Missing Key' });
    const values = [head.map(h => (row[h] === undefined || row[h] === null) ? '' : String(row[h]))];
    const i = keys.indexOf(String(row.Key));
    if (i === -1) sh.getRange(sh.getLastRow() + 1, 1, 1, head.length).setValues(values);
    else          sh.getRange(i + 2, 1, 1, head.length).setValues(values);
    return json_({ ok: true, key: row.Key, mode: i === -1 ? 'inserted' : 'updated' });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/** Run once from the editor (▶ Run > setup) to authorise the script and prepare the tab. */
function setup() {
  const sh = getSheet_();
  Logger.log('Ready: ' + sh.getParent().getUrl() + ' · tab "' + sh.getName() + '" · ' + (sh.getLastRow() - 1) + ' saved reports');
}
