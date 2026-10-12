# ICTD Daily Check Report — v3.3 (SRU Secure Access Kit v1.4)

The Daily Check is now a **secure platform**. Only Sulaiman Al Rajhi University Google accounts (@sr.edu.sa) on the access list can open it, and every sign-in is logged.

```
ictsru.github.io/daily/  →  Google sign-in (@sr.edu.sa)  →  Apps Script Web App (Daily Check app)
 (branded ITOC landing)      (Google's own page)             (access list checked on every call)
```

## Package
| Folder / file | Goes to | Purpose |
|---|---|---|
| `apps-script/Code.gs` | Apps Script project of **ICTD Daily Check Report - Data** | Access control, access list, sign-in log, data API (`apiList`, `apiSave`, `apiDelete`, `apiUpload`) |
| `apps-script/Index.html` | same project, HTML file **Index** | Page layout (Submit · Dashboard · Daily Report) |
| `apps-script/AppStyles.html` | HTML file **AppStyles** | Page styles |
| `apps-script/AppScript.html` | HTML file **AppScript** | Page logic |
| `apps-script/Logos.html`, `Denied.html` | same project, HTML files **Logos**, **Denied** | Kit logos and the "access restricted" page |
| `github-landing/` | GitHub repo **ictsru/daily** (replaces the old `index.html`) | Branded sign-in page; `#dashboard` and `#report` open those tabs |
| `n8n/ictd-daily-check-reminder.workflow.json` | n8n | 08:15 reminder v1.4: reads the Sheet directly, because the Web App is no longer public |

## Go-live (about 15 minutes)
1. **Apps Script:** open the Sheet → **Extensions ▸ Apps Script**.
   - Replace `Code.gs` with the new one.
   - Add five HTML files (**＋ ▸ HTML**) named exactly `Index`, `AppStyles`, `AppScript`, `Logos` and `Denied`. Each one except Logos ends with an `<!-- END OF … -->` line; check it is there after pasting, and paste the content of each.
2. **Access list:** in `Code.gs`, check `DEFAULT_ALLOWED` and remove anyone who doesn't need the Daily Check.
3. **Run `setup`** (▶). It now checks each step separately and prints ✓ / ✗ per step in the Execution log. If one step fails, the others still finish. Run `setupDrive` to retry only the Drive step, or paste a folder ID into `ATT_FOLDER_ID`. Approve the permissions: Sheets, **Drive** and your e-mail address. This creates the tabs **AllowedUsers** and **AccessLog**, plus the attachments folder. It also fixes the earlier Drive upload error.
4. **Deploy:** go to **Deploy ▸ Manage deployments ▸ ✏️ Edit**.
   - Set **Version: New version**, **Execute as: Me**, and **Who has access: Anyone within Sulaiman Al Rajhi University**, then click **Deploy**.
   - The URL stays the same, and it is already set in `github-landing/index.html`.
   - If the access setting can't be changed there, make a **New deployment** with those settings instead. Paste its URL into `WEB_APP_URL` in the landing page, then **Archive** the old deployment.
   - The old "Anyone" deployment must not stay active.
5. **GitHub `ictsru/daily`:** replace `index.html` with `github-landing/index.html`, upload `assets/` (the reminder e-mail uses the same logo names) and `.nojekyll`.
6. **n8n:** import `n8n/ictd-daily-check-reminder.workflow.json`, or in the existing workflow:
   - add a **Google Sheets ▸ Get row(s)** node named `Read Daily tab` (Sheet ID `1BxNsw79z9XsyPBS6mC78TcsuQooyAzDpDkzLQcCu7lM`, tab `Daily`, *Always Output Data* on) between the triggers and **Build Reminder Email**
   - paste `n8n/build-email.js` into **Build Reminder Email**
   - put the owner e-mails back
7. **Test:**
   - your account ✓
   - Incognito → Google sign-in ✓
   - a personal Gmail account → refused ✓
   - an @sr.edu.sa account not on the list → "الوصول مقيّد" ✓
   - upload an NSU screenshot ✓

## Managing access
- **AllowedUsers** tab: add a row to grant access, untick `active` to suspend, delete the row to remove. Changes apply within 2 minutes.
- `OWNER_EMAILS` (m.elmahdy@sr.edu.sa) is always allowed.
- **AccessLog** tab: e-mail, date, time and day for every sign-in (repeat visits within 30 minutes count once). Refused and not-listed attempts are logged too.
- Sheet menu **ICTD Daily Check Report** offers a 30-day summary and a purge of old entries.

## What changed for users
- They open `ictsru.github.io/daily/` and sign in with their university account. The app opens with their e-mail shown in the header.
- **Submitted By** defaults to the signed-in person (where the account is mapped to a team name). Every save also records the account in the new **SavedBy** column.
- Screenshots are shared **inside sr.edu.sa only**, no longer with anyone who has the link.

## Updating later
Deploy ▸ Manage deployments ▸ ✏️ ▸ Version: New version. The URL stays the same.
