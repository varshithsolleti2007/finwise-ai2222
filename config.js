/* ============================================================
   FinWise AI — Deployment Configuration
   Fill these in after you deploy the backend pieces (see
   DEPLOYMENT.md). The app runs fine with both left blank —
   the AI Tips and Cloud History panels just show a setup note.
   ============================================================ */

window.FINWISE_CONFIG = {
  // Netlify Function endpoint for live Claude-generated tips.
  // Same-origin relative path works once deployed on Netlify — leave as is.
  AI_TIPS_ENDPOINT: '/api/financial-tips',

  // Paste your deployed Google Apps Script Web App URL here to enable
  // cloud history (Extensions > Apps Script > Deploy > Web app > Anyone).
  // Example: 'https://script.google.com/macros/s/AKfycb.../exec'
  SHEETS_ENDPOINT: ''
};
