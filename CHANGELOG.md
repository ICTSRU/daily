# Changelog — ICTD Daily Check Report

## v2.6 — 2026-10-05
- **Get from Sheet** now glows and pulses, with a spinner and "Loading…", whenever the page is reading from the Google Sheet: changing the date or unit, clicking the button, or loading the page. The connection dot pulses too.
- Fix: the "Restore a saved day" list could show another unit's name when the unit was changed while data was still loading. Out-of-date replies are now ignored, and the list shows "Loading saved reports for …" straight away.
- Day-Date and Unit no longer get restored by the browser on reload (autocomplete off), which kept them out of sync with the loaded data.

## v2.5 — 2026-10-05
- **Screenshots / Images for NSU**, in the Daily Summary panel: add several images, each with a type (**PRTG** by default, plus Firewall, Wireless / WLC, Switch / Core, UC, Other) and a caption. The PRTG caption is filled in automatically.
- Three ways to add an image: Choose image, drag and drop, or paste (Ctrl+V). Images over 1.5 MB are shrunk to at most 2000 px before upload.
- Images are stored in Google Drive (`ICTD Daily Check - Attachments/<date>/`); the report row keeps the file IDs in a new **Attachments** column.
- Dashboard card shows thumbnails; the Daily Report prints each image full width with its caption.
- **Code.gs v2.5**: new `upload` action and Drive folder handling; `Attachments` added to the headers. Needs a one-time update and **New version** deployment (same URL).

## v2.4 — 2026-10-05
- New unit **NSU — Network and Security Unit** (owner Atef Elnadi), built from the unit's Daily Health Check Report email. 36 checks in 6 groups:
  - Internet-WAN (5): STC, Mobily, KACST links, Site-to-Site VPN MOE, A10 - Published Servers
  - Infrastructure (11): P1–P5 access switches, distribution switches P1-P3-P5 and P2-P4, distribution CPU, Core Nexus, UCS Chassis, Storage - EMC
  - Wireless Network (9): WLC, SAC/FAC links, Student/Voice/Employee wireless, SAC/FAC/Campus APs (online counts in Notes)
  - Wireless Clients (3): client counts at SAC, FAC and SRC-Student (University)
  - UC (5): IP phones registration, SIP land lines, Cisco Jabber, UC contact center inside/outside
  - Firewalls (2): FAC and SAC Forti firewalls
- NSU uses the **Daily Summary** panel at the top (Main Tasks Today, Hot Issues Yesterday, Notes), the same as AAU.
- "Atef Elnadi" added to the team list.
- Dashboard cards show the saved time in local (Riyadh) time instead of UTC.
- Dashboard, trend, service history and Daily Report now cover 3 units. No Sheet or Apps Script change needed (unit code `NSU`).

## v2.3 — 2026-10-05
- Checklist: the **URL / Address** column is hidden in any group where no item has a URL. In DSSC that is Hosts and Physical Servers, Domains, Backup, Solutions and Quarantine Devices; Notes widens to use the space. Web Interface Access and all AAU groups keep the column.
- Added `assets/` (hosted logos for the n8n reminder email).

## v2.2 — 2026-10-05
- Renamed the DSSC unit to **DSSC — Digital Services and Support Center** everywhere it appears. Unit code `DSSC` is unchanged, so saved Sheet rows still match.

## v2.1 — 2026-10-05
- Renamed the AAU unit to **AAU — Application and Automation Unit** (unit picker, dashboard cards, trend, history, Daily Report, messages). Unit code `AAU` is unchanged, so saved Sheet rows still match.

## v2.0 — 2026-10-05
- The **Daily Summary & Team** panel moved to the top of the form, directly under Day-Date / Unit / Check Time and Restore a saved day, above the checklist.
- Order is now: Day & unit → Daily Summary & Team → Overall status → Checklist → Submitted By → Save.

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
