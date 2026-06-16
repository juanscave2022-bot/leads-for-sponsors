# Speed Syndicate — Sponsor Leads Dashboard

Live dashboard that pulls motorsport sponsor leads from Apify, scores them, and lets you filter and download as CSV. The Apify token stays server-side (never exposed in the browser), which also fixes the CORS error you get when calling Apify directly from a page.

## Files
- `index.html` — the dashboard (talks to `/api/leads`, no token in the browser)
- `server.js` — zero-dependency Node proxy + static server (run locally or any Node host)
- `api/leads.js` — serverless function for Vercel / Netlify
- 5 Apify dataset IDs are baked into `index.html` (Charlotte, Indianapolis, Atlanta, Daytona Beach, Austin)

## Run locally (Cursor terminal)
Requires Node 18+.
```
APIFY_TOKEN=your_apify_token node server.js
```
Open http://localhost:3000

(Windows PowerShell: `$env:APIFY_TOKEN="your_token"; node server.js`)

## Deploy to Vercel (recommended for sharing)
1. Push this folder to a Git repo, or `vercel` from the folder.
2. In Vercel → Project → Settings → Environment Variables, add:
   - `APIFY_TOKEN` = your Apify personal API token
3. Deploy. `index.html` is served statically and `/api/leads` runs as the serverless function automatically.

Netlify works the same way (set `APIFY_TOKEN` in Site settings → Environment variables; functions dir `api`).

## Get your Apify token
console.apify.com → Settings → Integrations → Personal API tokens.

## Notes
- "+ Load decision-makers" pulls the enriched contact (owner/exec name, title, verified email) on demand.
- To add more markets later, append `{id, city, state}` entries to the `DATASETS` array in `index.html`.
- Download buttons export exactly what's currently filtered, or the full set.
