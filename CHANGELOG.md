# Changelog — ICTD Daily Check Report

## v1.9 — 2026-10-05
- Main Tasks Today, Hot Issues Yesterday, Notes, Events / 7 AM Morning Support and Team Members Not Available Today now sit on a separate light-blue **Daily Summary & Team** panel (blue accent edge, white fields, blue buttons), so they stand apart from the checklist.

## v1.8 — 2026-10-05
- Removed the "Open Google Sheet" and "Copy browser entries to Sheet" buttons from the connection bar.
- New **Get from Sheet** button next to Day-Date: reads that day's saved report for the selected unit straight from the Google Sheet, or says which units have saved that day.
- Changing the Day-Date now always reads the latest data from the Sheet, not the cached copy.

## v1.7 — 2026-10-05
- Google Sheet Web App URL hardcoded in `GAS_URL`; every user connects automatically, with no setup per browser.
- The hardcoded URL takes priority over any per-browser connection saved earlier; the Connect button is hidden while a URL is built in.

## v1.6 — 2026-10-05
- **Google Sheets connection.** New Sheet "ICTD Daily Check Report - Data" (ID 1BxNsw79z9XsyPBS6mC78TcsuQooyAzDpDkzLQcCu7lM) and an Apps Script Web App backend (`Code.gs`): read all, insert or update by Key, delete. It adds missing headers itself and uses a lock so two people saving at once don't clash.
- Connection bar: shows Connected / Not connected / Error, an **Open Google Sheet** link, a **Connect** button (paste the Web App URL; verified before saving) and **Copy browser entries to Sheet**.
- **Restore a saved day** selector on the Submit tab, listing all saved days for the unit with status and submitter.
- **Copy to today** (use a past day as today's starting point) and **Delete entry**.
- Dashboard unit cards: **Open / edit** and **Daily report** buttons, plus a saved-at time.
- The n8n workflow now points to the new Sheet ID (alternative backend).

## v1.5 — 2026-10-05
- DSSC: "Events / 7 AM Morning Support" changed from a free-text box to rows with a team-member **drop-down**, an optional task/event note, and an **Add team member** button.
- "Other (type name)…" option for people not in the team list (e.g., Shatha).
- Notes now spans the full width; the dashboard card and Daily Report list each support member.
- Storage unchanged (MorningSupport column, one numbered line per member: "Name — task").

## v1.4 — 2026-10-05
- DSSC — Systems & CCCU: new section **Team Members Not Available Today** (name with team suggestions, reason, optional note; add/remove rows). Starts empty each day.
- Shown on the dashboard unit card and in the Daily Report ("All team members available" when empty).
- Backend: new Sheet column **NotAvailable** (after HotIssues) — added to `sheet-headers.csv` and the n8n workflow mapping. If the Sheet already exists, insert this column header.

## v1.3 — 2026-10-05
- AAU — Applications: removed the "Events / 7 AM Morning Support" field (Notes now spans the full width). Still shown for DSSC — Systems & CCCU.
- Renamed "Hot Issues" to "Hot Issues Yesterday" on the form, dashboard cards and Daily Report.

## v1.2 — 2026-10-05
- Every URL in the checklist is now a clickable link (↗) that opens the service in a new tab; a ✎ button beside it switches to edit mode.
- Alternate addresses (e.g., IP / reverse-proxy links) are clickable in the Daily Report.
- Links are restricted to http/https (addresses without a scheme open as http://).

## v1.1 — 2026-10-05
- Checklist rows now sit on a single line: Service · URL / Address · Notes · SSL Expiry (date + days badge side by side) · Operation State · remove.
- Added a "URL / Address" column header; long names and URLs show in full on hover.

## v1.0 — 2026-10-05
- First release, built on the ICTD Weekly Status Report (v4.5) pattern: same header, logos, navigation, ITOC footer and n8n + Google Sheets backend.
- **Submit Daily Check**: one entry per unit per day (upsert key `YYYY-MM-DD|UNIT`).
  - Two units: DSSC — Systems & CCCU (22 checks) and AAU — Applications & Web Services (23 checks, with SSL expiry dates), taken from the 04 Oct 2026 report emails.
  - Each day starts from the unit's last saved report; an existing entry for the day opens for editing.
  - Overall status set automatically from the worst item (Normal / Minor / Major / Critical), with live counts.
  - "All Normal" button for the whole list or one group; add or remove items and groups.
  - SSL Valid/Expired and days left worked out from the expiry date.
  - Main Tasks, Hot Issues (flagged red), Notes, Events / 7 AM support, Submitted By.
- **Dashboard**: pick any day or step between report days; KPI strip; unit cards; exceptions table showing how many report days each issue has been open; SSL watch (next 90 days); 14-working-day status trend; per-service health history. Click a dot to open that day.
- **Daily Report**: the day's report in the email layout, ready to print or save as PDF.
- Local demo mode when `API_BASE` is empty (data stays in this browser, with the 04 Oct 2026 reports preloaded).
