# Deployment Guide

This walks through taking FinWise AI from your local folder to a live public URL with the AI Tips and Cloud History features fully working. It has three parts: **push to GitHub**, **deploy to Netlify with your Claude API key**, and **connect Google Sheets**. The first two are required; Google Sheets is optional.

---

## Part 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: FinWise AI"
git branch -M main
git remote add origin https://github.com/<your-username>/finwise-ai.git
git push -u origin main
```

If you already have this repo pushed, just commit and push your changes as usual.

---

## Part 2 — Deploy to Netlify (required for AI Financial Tips)

Netlify is used here — not GitHub Pages — because the AI Tips tab needs a serverless function to keep your Claude API key off the client. GitHub Pages only serves static files and cannot run that function.

1. **Get a Claude API key.** Sign in at [console.anthropic.com](https://console.anthropic.com), create an API key, and make sure billing is enabled on the account (API usage is metered).
2. **Create the Netlify site.**
   - Go to [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project**.
   - Connect your GitHub account and pick the `finwise-ai` repo.
   - Build settings: leave the build command **empty**, publish directory **`.`** (Netlify will also read these from `netlify.toml` automatically).
   - Click **Deploy**.
3. **Add your API key.**
   - In the new site: **Site configuration → Environment variables → Add a variable**.
   - Key: `ANTHROPIC_API_KEY`
   - Value: your key from step 1.
   - Scope: all deploy contexts.
4. **Redeploy** so the function picks up the new variable: **Deploys → Trigger deploy → Deploy site**.
5. **Verify.** Open your site's URL, go to the **AI Financial Tips** tab, click **Generate AI Financial Tips**. You should see live, Claude-generated content within a few seconds.

If it fails, see Troubleshooting below.

### Alternative: Vercel instead of Netlify
Vercel works too and uses the same `/api/*` convention natively. Move `netlify/functions/financial-tips.js` to `api/financial-tips.js` at the repo root, and change its export from `exports.handler = async function(event) {...}` to Vercel's signature: `module.exports = async (req, res) => { ... res.status(200).json(data) }`. Set `ANTHROPIC_API_KEY` the same way in Vercel's Environment Variables. Everything else (frontend, `js/config.js`) stays the same since it already calls the platform-agnostic path `/api/financial-tips`.

### Alternative: GitHub Pages (static only)
If you only need the three deterministic tools (Loan, Credit, EMI) live and don't need AI Tips or Cloud History to work publicly:
1. Repo **Settings → Pages → Deploy from a branch → main → / (root)**.
2. Your site will be live at `https://<username>.github.io/finwise-ai/`.
3. The **AI Financial Tips** button will show a friendly "couldn't reach the AI backend" note instead of failing silently — this is expected on Pages.

---

## Part 3 — Connect Google Sheets (optional, for Cloud History)

1. Create a new Google Sheet (any name).
2. **Extensions → Apps Script.**
3. Delete the placeholder code, and paste in the entire contents of this repo's `google-apps-script/Code.gs`.
4. Save the project (any name).
5. **Deploy → New deployment → select type "Web app".**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Click **Deploy**, authorize the requested permissions (you'll see an "unverified app" warning since it's your own script — click **Advanced → Go to (project name)** to proceed), and copy the resulting URL (ends in `/exec`).
7. **Open that URL directly in a browser tab once.** This step matters — it completes Google's one-time authorization flow. You should see `{"ok":true,"message":"FinWise AI Sheets backend is running."}`.
8. Back in your code, open `js/config.js` and paste the URL:
   ```js
   SHEETS_ENDPOINT: 'https://script.google.com/macros/s/AKfycb.../exec'
   ```
9. Commit and push:
   ```bash
   git add js/config.js
   git commit -m "Connect Google Sheets cloud history"
   git push
   ```
   Netlify (or GitHub Pages) will auto-redeploy with the new config.
10. **Verify.** On the live site, go to **AI Financial Tips → Cloud History**, click **Save Session to Cloud**, then **Refresh History**. A row should also appear in your Google Sheet under a new `FinWiseHistory` tab.

---

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| AI Tips shows "Couldn't reach the AI backend" | `ANTHROPIC_API_KEY` isn't set in Netlify yet, or you didn't redeploy after adding it |
| AI Tips returns a 401/authentication error | The API key is invalid, or billing isn't enabled on your Anthropic account |
| AI Tips works locally with `netlify dev` but not live | The env var is set locally in `.env` but not in the Netlify dashboard — add it there too |
| Cloud History save does nothing | `SHEETS_ENDPOINT` is still blank in `js/config.js` |
| Cloud History save "succeeds" but nothing appears in the Sheet | You skipped opening the `/exec` URL once to authorize the script (step 7) |
| Function 404s on Netlify | Confirm `netlify.toml` is committed at the repo root — it tells Netlify where the function lives |
