# ICTD Daily Check Report — v2.3

A daily health-check form, dashboard and printable report for SRU ICTD units, saved in Google Sheets.

## Files
| File | Purpose |
|---|---|
| `index.html` | The app (Submit · Dashboard · Daily Report) |
| `Code.gs` | Google Apps Script backend: reads all days, saves (insert or update by Key) and deletes |
| `sheet-headers.csv` | Header row of the Sheet (already applied) |
| `n8n-workflow-ictd-daily-check.json` | Alternative backend, the same setup as the Weekly Report |
| `assets/` | Logos used by the 08:15 reminder email (ictd-logo.png, sru-logo.png, itoc-logo.png) |
| `CHANGELOG.md` | Version history |

## Google Sheet
**ICTD Daily Check Report - Data**: https://docs.google.com/spreadsheets/d/1BxNsw79z9XsyPBS6mC78TcsuQooyAzDpDkzLQcCu7lM/edit
One row per unit per day. `Key` = `YYYY-MM-DD|UNIT`.

## Connection
Web App URL (hardcoded in `index.html` as `GAS_URL`):
`https://script.google.com/macros/s/AKfycbwoT0b3mQyrZ0lnNw3kVETG5kxdZexUW6Q0RnQPdX2oKBMkkQCdK4-P6pRYeq-9Xq5TNw/exec`

## Original setup steps (already done)
1. Open the Sheet, then go to **Extensions → Apps Script**. Delete the sample code, paste **`Code.gs`** and save.
2. Choose **`setup`** in the function list, click **Run**, and approve access. This renames the tab to `Daily`.
3. Go to **Deploy → New deployment → Web app**. Set **Execute as: Me** and **Who has access: Anyone**. Click **Deploy** and copy the URL that ends in `/exec`.
4. Do one of the following:
   - **For the whole team:** paste the URL into `const GAS_URL = '...'` in `index.html` and publish the folder to GitHub Pages.
   - **For one browser:** click **Connect** in the green/amber bar at the top of the page and paste the URL.
5. The bar turns green: **Connected to Google Sheet**.

> If you change `Code.gs` later, go to **Deploy → Manage deployments → Edit → New version**. This keeps the same URL.

## Save and restore
- **Save:** pick the day and unit, then **Save Daily Check**. Saving the same day again updates that row.
- **Get from Sheet:** pick a Day-Date and click **Get from Sheet** (changing the date also loads that day's latest data from the Sheet).
- **Restore any day:** use **Restore a saved day** on the Submit tab, pick a date in the Submit or Dashboard tab, or click **Open / edit** on a dashboard card.
- **Copy to today:** opens a past day's report as a starting point for today.
- **Delete entry:** removes that day's row from the Sheet.
