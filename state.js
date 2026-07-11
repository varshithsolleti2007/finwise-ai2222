/* ============================================================
   FinWise AI — Shared Session State
   The Loan, Credit and EMI modules write their latest result
   here; the AI Tips and Cloud History modules read from it.
   Loaded before every feature module.
   ============================================================ */

window.FinWiseState = {
  loan: null,    // { income, obl, cs, riskTier, verdict, eligibleCeiling, rate, ... }
  credit: null,  // { score, band, source: 'quick'|'detailed', ... }
  emi: null,     // { principal, rate, months, emi, totalInterest, totalPayment }
  goal: null,
  risk: null
};
