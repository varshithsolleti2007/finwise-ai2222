# FinWise AI

**Intelligent Loan Eligibility, Credit Analysis & Financial Advisory Platform** — a Generative-AI-powered fintech demo built with HTML, CSS and JavaScript, backed by a real Claude API integration and optional Google Sheets cloud storage.

## Features — Four Core Tools

1. **Loan Eligibility Checker** — Derives an eligible loan ceiling from income, existing obligations and credit-tier income multipliers, and classifies borrower risk as **Low / Medium / High**. Optionally plan a specific amount + tenure to see an indicative EMI and whether it fits your ceiling.
2. **Credit Score Analyzer** — *Quick Classify*: type a score you already know (300–900) for an instant band + actionable recommendations. *Detailed Analyzer*: a FICO-style five-factor simulator (payment history, utilization, credit age, account mix, inquiries) that computes a score and renders it as a radar chart.
3. **EMI Calculator** — Standalone, fully manual: principal, annual rate and tenure → monthly EMI, total interest and total payment, with a principal-vs-interest chart.
4. **AI Financial Tips** — A deterministic needs/wants/savings snapshot plus a **live Claude API call** that reads your session (loan + credit + EMI results, goal, risk appetite) and generates a personalized recommendation set, credit improvement strategies, EMI optimization suggestions and a risk classification report.

A **Cloud History** panel (Google Sheets + Apps Script) lets you save a session snapshot and reload past ones.

## Architecture

```
Browser (index.html, css/, js/)
   │
   ├── Deterministic calculators run entirely client-side
   │   (Loan, Credit, EMI, Quick Snapshot)
   │
   ├── AI Financial Tips  →  POST /api/financial-tips
   │                         (Netlify Function)
   │                              │
   │                              └── calls api.anthropic.com
   │                                  with a server-side API key
   │
   └── Cloud History  →  Google Apps Script Web App
                          (bound to your own Google Sheet)
```

The Claude API key never reaches the browser — it lives only in the serverless function's environment variables. This is why the AI Tips feature needs a real deploy target (Netlify or Vercel); GitHub Pages can host the static files but cannot run the secure backend.

## Tech Stack

- HTML5 / CSS3 (custom properties, no framework)
- Vanilla JavaScript (ES6, no build tooling)
- [Chart.js](https://www.chartjs.org/) via CDN for radar/doughnut charts
- Netlify Functions (Node) as a secure proxy to the Anthropic API
- Google Apps Script + Google Sheets as a lightweight cloud database
- Google Fonts: Fraunces, Public Sans, JetBrains Mono

## Project Structure

```
finwise-ai/
├── index.html                          # App shell for all 4 tabs
├── css/
│   └── styles.css                      # All styling
├── js/
│   ├── state.js                         # Shared session state (loan/credit/emi/goal/risk)
│   ├── config.js                         # Endpoint URLs — fill in SHEETS_ENDPOINT after deploy
│   ├── utils.js                           # Shared helpers + EMI math
│   ├── loan.js                             # Loan eligibility + risk tier logic
│   ├── credit.js                            # Quick classify + detailed credit analyzer
│   ├── emi.js                                # Standalone EMI calculator
│   ├── aitips.js                              # Budget snapshot + Claude API call + rendering
│   ├── sheets.js                               # Cloud History save/load
│   └── main.js                                  # Tabs, session header, first paint (loads last)
├── netlify/functions/
│   └── financial-tips.js               # Secure serverless proxy to the real Claude API
├── google-apps-script/
│   └── Code.gs                         # Paste into Apps Script to enable Cloud History
├── netlify.toml                        # Netlify build + function + redirect config
├── .env.example                        # Documents ANTHROPIC_API_KEY (no real secret)
├── README.md
├── DEPLOYMENT.md                       # Full step-by-step: GitHub → Netlify → API key → Sheets
├── .gitignore
└── LICENSE
```

Script load order in `index.html` matters: `state.js` and `config.js` define globals other modules read; `utils.js` defines shared helpers; the four tool modules come next; `main.js` loads last because it calls functions the other modules define.

## Running Locally

**Quick preview (calculators only, no AI Tips / Cloud History):**
Open `index.html` directly, or serve it:
```bash
python3 -m http.server 8000
```

**Full-featured local dev (with the AI backend):**
Requires the [Netlify CLI](https://docs.netlify.com/cli/get-started/):
```bash
npm install -g netlify-cli
netlify dev
```
This serves the site and runs `netlify/functions/financial-tips.js` locally. Put your key in a local `.env` file first (never commit it):
```
ANTHROPIC_API_KEY=sk-ant-...
```

For full deployment instructions (GitHub → Netlify → environment variable → Google Sheets), see **[DEPLOYMENT.md](./DEPLOYMENT.md)**.

## Disclaimer

FinWise AI mixes transparent rule-based calculators with live Claude-generated content. It is not a real credit bureau, lender, or licensed financial advisor. AI-generated text can be wrong — verify anything financially significant with a licensed professional.

## License

MIT — see [LICENSE](./LICENSE).
