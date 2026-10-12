/* =====================================================================
   ICTD Daily Check — 08:15 Reminder · n8n Code node ("Build Reminder Email")
   Workflow v1.6 · email design v1.4
   Reads the Google Sheet (Apps Script Web App) and returns one item:
   { to, cc, subject, html, pending }
   ===================================================================== */

// ---------------- CONFIG (edit here) ----------------
const CONFIG = {
    PAGE_URL  : 'https://ictsru.github.io/daily/',        // GitHub Pages link of index.html
  LOGO_BASE : 'https://ictsru.github.io/daily/assets/', // ictd-logo.png · sru-logo.png · itoc-logo.png
  CC        : 'm.elmahdy@sr.edu.sa,nabounar@sr.edu.sa',   // comma-separated
  DEADLINE  : '09:00',
  TIMEZONE  : 'Asia/Riyadh',
  SSL_DAYS  : 60,
  TEST_TO   : '',   // put your own email here to send ONLY to yourself while testing
  UNITS : [
    { code:'DSSC', short:'DSSC', name:'Digital Services and Support Center', owner:'Mohamed Hassanein', email:'m.omar@sr.edu.sa', color:'#1f8a3b' },
    { code:'AAU',  short:'AAU',  name:'Application and Automation Unit',     owner:'Mohamed Saleh',     email:'m.saleh@sr.edu.sa',  color:'#e0a010', ssl:true },
    { code:'NSU',  short:'NOC & SOC', name:'Network and Security Unit',      owner:'Mohamed Nawaz',     email:'n.nawaz@sr.edu.sa', color:'#0d5fad' },  // code stays 'NSU' to match the Sheet
  ],
  SIGNATURE : 'Mohamed ElMahdy, IT Operations Manager, Sulaiman Al Rajhi University',
};
// ----------------------------------------------------

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const RANK = {Normal:0, Minor:1, Major:2, Critical:3};
const PILL = {
  Minor:'background:#fff8e6;color:#8a6400;', Major:'background:#fff0e6;color:#a34400;',
  Critical:'background:#fdecec;color:#c0272d;', Normal:'background:#eafaf0;color:#1f8a3b;'
};

// Today in Riyadh as YYYY-MM-DD (independent of the n8n server time zone)
const todayISO = new Intl.DateTimeFormat('en-CA', {timeZone: CONFIG.TIMEZONE, year:'numeric', month:'2-digit', day:'2-digit'}).format(new Date());
const d0 = s => { const [y,m,d] = s.split('-').map(Number); return Date.UTC(y, m-1, d); };
const daysBetween = (a, b) => Math.round((d0(b) - d0(a)) / 86400000);
const fmt = (iso, opts) => new Date(d0(iso)).toLocaleDateString('en-GB', Object.assign({timeZone:'UTC'}, opts));
const longDay  = iso => fmt(iso, {weekday:'long', day:'2-digit', month:'long', year:'numeric'});
const shortDay = iso => fmt(iso, {weekday:'short', day:'2-digit', month:'short'});
const dateOnly = iso => fmt(iso, {day:'2-digit', month:'short', year:'numeric'});
const host = u => String(u || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '');

// ---------- 1. Read every saved report from the Sheet ----------
// v1.4 — rows come from the "Read Daily tab" Google Sheets node (the Web App is no longer public)
let rows = $input.all().map(i => i.json).filter(r => r && r.Key);

const recs = rows.filter(r => r.Key && String(r.Key).includes('|')).map(r => {
  const [date, unit] = String(r.Key).split('|');
  let items = []; try { items = JSON.parse(r.Items || '[]'); } catch (e) {}
  return { date, unit, items, status: r.Status, by: r.SubmittedBy };
});
const forUnit = code => recs.filter(r => r.unit === code).sort((a, b) => b.date.localeCompare(a.date));

// ---------- 2. Status per unit, open items, SSL ----------
const status = CONFIG.UNITS.map(u => ({ u, done: recs.some(r => r.unit === u.code && r.date === todayISO) }));
const pending = status.filter(s => !s.done);

const openItems = [];
CONFIG.UNITS.forEach(u => {
  const list = forUnit(u.code).filter(r => r.date <= todayISO);
  if (!list.length) return;
  const last = list[0];
  last.items.filter(i => i.s && i.s !== 'Normal').forEach(i => {
    let since = last.date;                                  // walk back while still not Normal
    for (const r of list) { const it = r.items.find(x => x.n === i.n); if (it && it.s !== 'Normal') since = r.date; else break; }
    openItems.push({ u, i, since });
  });
});
openItems.sort((a, b) => RANK[b.i.s] - RANK[a.i.s] || a.since.localeCompare(b.since));

const ssl = [];
CONFIG.UNITS.filter(u => u.ssl).forEach(u => {
  const last = forUnit(u.code).find(r => r.date <= todayISO);
  if (!last) return;
  last.items.filter(i => i.e).forEach(i => {
    const days = daysBetween(todayISO, i.e);
    if (days <= CONFIG.SSL_DAYS) ssl.push({ i, days });
  });
});
ssl.sort((a, b) => a.days - b.days);

// ---------- 3. Build the HTML (email design v1.1) ----------
const label = t => `<div style="font-size:12px;font-weight:bold;color:${t.c};text-transform:uppercase;letter-spacing:.6px;margin-bottom:8px;">${t.t}</div>`;
const pill  = (txt, css) => `<span style="display:inline-block;padding:3px 11px;border-radius:20px;${css}font-weight:bold;font-size:12px;white-space:nowrap;">${txt}</span>`;

const statusRows = status.map(({u, done}) => `
  <tr>
    <td style="padding:11px 12px;border-top:1px solid #eee8f5;border-left:4px solid ${u.color};"><b>${esc(u.short)}</b><br><span style="color:#77678d;font-size:12px;">${esc(u.name)}</span></td>
    <td style="padding:11px 12px;border-top:1px solid #eee8f5;">${esc(u.owner)}</td>
    <td style="padding:11px 12px;border-top:1px solid #eee8f5;" align="center">${done ? pill('✅ Submitted', 'background:#eafaf0;color:#1f8a3b;') : pill('⏳ Pending', 'background:#fff8e6;color:#8a6400;')}</td>
  </tr>`).join('');

const openRows = openItems.map((x, k) => `
  <tr>
    <td style="padding:10px 12px;${k ? 'border-top:1px solid #f4e3e4;' : ''}" width="78">${pill(esc(x.i.s), PILL[x.i.s] || PILL.Minor)}</td>
    <td style="padding:10px 12px;${k ? 'border-top:1px solid #f4e3e4;' : ''}"><b>${esc(x.i.n)}</b> <span style="color:#77678d;">· ${esc(x.u.short)}</span>${x.i.t ? `<br><span style="color:#444;">${esc(x.i.t)}</span>` : ''}</td>
    <td style="padding:10px 12px;${k ? 'border-top:1px solid #f4e3e4;' : ''}color:#77678d;font-size:12px;white-space:nowrap;" align="right">since ${esc(shortDay(x.since))}</td>
  </tr>`).join('');

const sslRows = ssl.map((x, k) => `
  <tr>
    <td style="padding:10px 12px;${k ? 'border-top:1px solid #dcecf6;' : ''}"><b>${esc(x.i.n)}</b>${x.i.u ? `<br><span style="color:#0a6eaa;font-size:12px;">${esc(host(x.i.u))}</span>` : ''}</td>
    <td style="padding:10px 12px;${k ? 'border-top:1px solid #dcecf6;' : ''}" align="center">${esc(dateOnly(x.i.e))}</td>
    <td style="padding:10px 12px;${k ? 'border-top:1px solid #dcecf6;' : ''}" align="right">${pill(x.days < 0 ? 'Expired' : x.days + ' days', x.days <= 30 ? 'background:#fdecec;color:#c0272d;' : 'background:#fff0e6;color:#a34400;')}</td>
  </tr>`).join('');

const preheader = `Daily Health Check for ${shortDay(todayISO)} is due by ${CONFIG.DEADLINE}` +
  (openItems.length ? ` — ${openItems.length} open item${openItems.length > 1 ? 's' : ''} from the last report.` : '.');

const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Daily Check Reminder</title></head>
<body style="margin:0;padding:0;background:#f5f2fa;font-family:Tahoma,Arial,sans-serif;color:#241436;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f2fa;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e3dcef;">
  <tr><td style="padding:14px 22px;background:#ffffff;border-bottom:1px solid #eee8f5;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td align="left" valign="middle"><img src="${CONFIG.LOGO_BASE}ictd-logo.png" alt="ICTD" height="44" style="display:block;height:44px;width:auto;border:0;"></td>
      <td align="right" valign="middle"><img src="${CONFIG.LOGO_BASE}sru-logo.png" alt="Sulaiman Al Rajhi University" height="46" style="display:block;height:46px;width:auto;border:0;"></td>
    </tr></table></td></tr>
  <tr><td style="background:#3a1464;background-image:linear-gradient(120deg,#3a1464,#2c0f4d);padding:22px 26px;border-bottom:3px solid #7a3fc0;">
    <div style="font-size:12px;font-weight:bold;color:#d9c9f2;letter-spacing:1px;text-transform:uppercase;">Daily Reminder · 08:15</div>
    <div style="font-size:22px;font-weight:bold;color:#ffffff;margin-top:4px;">Daily Health Check is due today</div>
    <div style="font-size:14px;color:#e9e1f7;margin-top:4px;">${esc(longDay(todayISO))}</div>
  </td></tr>
  <tr><td style="padding:22px 26px 6px;font-size:14.5px;line-height:1.65;">
    Good morning team,<br>
    Please complete today's health check and save it on the Daily Check page by <b style="color:#c0272d;">${esc(CONFIG.DEADLINE)}</b>.
    The checklist is already prefilled from your last report, so you only need to update what changed.
  </td></tr>
  <tr><td style="padding:14px 26px 4px;">${label({t:"Today's submission status", c:'#501e8c'})}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e3dcef;border-radius:8px;border-collapse:separate;overflow:hidden;font-size:13.5px;">
      <tr style="background:#f0ebf8;">
        <td style="padding:9px 12px;font-weight:bold;font-size:11.5px;color:#3a1464;text-transform:uppercase;">Unit</td>
        <td style="padding:9px 12px;font-weight:bold;font-size:11.5px;color:#3a1464;text-transform:uppercase;">Owner</td>
        <td style="padding:9px 12px;font-weight:bold;font-size:11.5px;color:#3a1464;text-transform:uppercase;" align="center">Today</td>
      </tr>${statusRows}
    </table></td></tr>
  ${openItems.length ? `<tr><td style="padding:18px 26px 4px;">${label({t:'⚠ Open items from the last report — please re-check', c:'#c0272d'})}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #f1d6d7;border-radius:8px;border-collapse:separate;background:#fffafa;font-size:13.5px;">${openRows}</table></td></tr>` : ''}
  ${ssl.length ? `<tr><td style="padding:18px 26px 4px;">${label({t:'🔒 SSL certificates expiring within ' + CONFIG.SSL_DAYS + ' days', c:'#0a6eaa'})}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #cfe5f3;border-radius:8px;border-collapse:separate;background:#f5fafd;font-size:13.5px;">${sslRows}</table></td></tr>` : ''}
  <tr><td align="center" style="padding:26px 26px 8px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="background:#501e8c;border-radius:6px;"><a href="${CONFIG.PAGE_URL}" target="_blank" style="display:inline-block;padding:13px 30px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;">Open Daily Check Form →</a></td>
      <td width="10"></td>
      <td style="border:1.5px solid #501e8c;border-radius:6px;"><a href="${CONFIG.PAGE_URL}#dashboard" target="_blank" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:bold;color:#501e8c;text-decoration:none;">View Dashboard</a></td>
    </tr></table>
    <div style="font-size:12px;color:#77678d;margin-top:12px;">If you have already submitted, you can ignore this email.</div>
  </td></tr>
  <tr><td style="padding:18px 26px 22px;font-size:13.5px;line-height:1.6;border-top:1px solid #eee8f5;">Regards,<br><b>${esc(CONFIG.SIGNATURE)}</b></td></tr>
  <tr><td style="background:#f7f5fb;padding:14px 22px;border-top:1px solid #eee8f5;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td align="left" valign="middle"><a href="https://ictsru.github.io/ITOC/#forms" target="_blank"><img src="${CONFIG.LOGO_BASE}itoc-logo.png" alt="ITOC — IT Operations Center" height="30" style="display:block;height:30px;width:auto;border:0;"></a></td>
      <td align="right" valign="middle" style="font-size:11px;color:#77678d;line-height:1.5;">Automated reminder · Sun–Thu at 08:15 (Riyadh)<br>ICTD Daily Check Report · Email design v1.4</td>
    </tr></table></td></tr>
</table></td></tr></table></body></html>`;

// ---------- 4. Recipients ----------
// v1.5 — send only to real university addresses; placeholders or typos stop the run with a clear message
const validEmail = e => /^[a-z0-9._%+-]+@sr\.edu\.sa$/i.test(String(e || '').trim()) && !/OWNER_EMAIL|example/i.test(e);
const bad = CONFIG.UNITS.filter(u => !validEmail(u.email)).map(u => u.code + ' (' + (u.email || 'empty') + ')');
if (bad.length && !CONFIG.TEST_TO) throw new Error('Fix the owner e-mail in CONFIG before sending: ' + bad.join(', '));
if (CONFIG.TEST_TO && !validEmail(CONFIG.TEST_TO)) throw new Error('TEST_TO is not a valid @sr.edu.sa address: ' + CONFIG.TEST_TO);
const owners = CONFIG.UNITS.map(u => u.email).filter(validEmail).join(',');
return [{ json: {
  to: CONFIG.TEST_TO || owners,
  cc: CONFIG.TEST_TO ? '' : CONFIG.CC,
  subject: `Reminder: Daily Health Check due ${CONFIG.DEADLINE} — ${shortDay(todayISO)} ${todayISO.slice(0,4)}`,
  html,
  date: todayISO,
  pending: pending.map(p => p.u.code).join(', ') || 'none',
  openItems: openItems.length,
  sslAlerts: ssl.length,
}}];
