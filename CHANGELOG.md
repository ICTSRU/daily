# Changelog — ICTD Daily Check Report

## v3.3 — 2026-10-12
### Fixed
- The error reporter showed the general "did not load completely" message and hid the real script error. It now keeps and shows the **first real error, with line:column and stack**. The watchdog adds to it instead of replacing it.
- Failed image or font loads are no longer reported as page errors.
### Changed
- Index.html split into **Index** (13 KB), **AppStyles** (29 KB) and **AppScript** (65 KB), joined by `include()`. Smaller files are much less likely to be cut off when pasting, and each ends with an `<!-- END OF … -->` line to check.

## v3.2 — 2026-10-12
### Fixed
- Page stuck on "Checking connection…" with empty Day-Date and Unit: the main script didn't run, most likely because the very large Index.html (about 160 KB, with logos embedded on extremely long lines) didn't paste completely into the Apps Script editor.
- **Index.html is now about 4× smaller**: the logos come from the kit's `Logos.html` (`<?!= include('Logos') ?>`). Header: ICTD directorate logo left, SRU logo right; ITOC logo in the footer.
### Added
- Built-in error reporter: any script error, or a page that didn't load completely, now shows a red message in the status bar instead of hanging.
- Clear message if the page is opened outside the Apps Script Web App.

## v3.1 — 2026-10-12
### Fixed
- `setup` stopped with Google's generic "An unknown error has occurred". It now runs **five separate steps** (Daily tab · AllowedUsers · AccessLog · Drive folder · signed-in e-mail) and logs ✓ / ✗ with the reason for each, so one failing step no longer stops the rest.
- Drive folder: if the Sheet's folder can't be read, the folder is created in My Drive instead. The folder ID is remembered (Script Properties), so it isn't looked up again on every upload.
### Added
- `setupDrive()`: retry only the Drive step.
- `ATT_FOLDER_ID`: optional fixed Drive folder for screenshots.
### n8n reminder v1.6
- CC now: m.elmahdy@sr.edu.sa, **nabounar@sr.edu.sa** (CIO).
### n8n reminder v1.5
- Owner e-mails filled in: DSSC → m.omar@sr.edu.sa · AAU → m.saleh@sr.edu.sa · NOC & SOC → n.nawaz@sr.edu.sa (the earlier `OWNER_EMAIL_…` placeholders bounced).
- Guard: the run stops with a clear message if any owner e-mail is a placeholder or not an @sr.edu.sa address, so nothing is sent to a bad address.

## v3.0 — 2026-10-12 — Secure access (SRU Secure Access Kit v1.4)
### Security
- The app is now served by **Apps Script** with *Who has access: Anyone within Sulaiman Al Rajhi University*, plus a server-side **access list** (`AllowedUsers`, `ACCESS_MODE = 'LIST'`, owner always allowed).
- **Public JSON API removed** (no more `doGet` JSON / `doPost`). The page calls `apiList`, `apiSave`, `apiDelete` and `apiUpload` through `google.script.run`, and each call checks the user first (`requireSruUser_()`).
- **Sign-in log** (`AccessLog`): e-mail, date, time (Asia/Riyadh), day and result (دخول / مرفوض / غير مدرج), with 30-minute de-duplication, plus a sheet menu for the summary and purge.
- New **SavedBy** column: the server stamps the signed-in account on every save.
- Screenshots are shared **inside sr.edu.sa** (`DOMAIN_WITH_LINK`), no longer "anyone with the link".
- Saved keys are validated (`YYYY-MM-DD|UNIT`).
### Added
- **GitHub landing page** (`ictsru.github.io/daily/`): branded ITOC sign-in screen before Google's login, a "skip next time" option, and `#dashboard` / `#report` deep links (used by the reminder e-mail).
- Header shows the signed-in e-mail; the connection bar shows "🔒 Secure access — signed in as …".
- **Submitted By** defaults to the signed-in user (e-mail → team-name map).
- `setup()` now prepares everything in one run: Daily tab, Drive folder (fixes the DriveApp permission error), AllowedUsers and AccessLog.
- Clear message when Drive permission is missing.
### Changed
- 08:15 reminder (n8n v1.4) reads the `Daily` tab through a Google Sheets node, because the Web App is no longer public.
