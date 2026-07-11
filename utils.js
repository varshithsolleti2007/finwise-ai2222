/* ============================================================
   FinWise AI — Shared Utilities
   Small helpers + finance math reused across every module.
   Loaded first so every other module can rely on these.
   ============================================================ */

const fmtINR = n => '₹' + Math.round(n).toLocaleString('en-IN');
const $ = id => document.getElementById(id);

/** Wire a <input type=range> to a label span that mirrors its value live. */
function bindRange(id, labelId, formatter){
  const el = $(id), lab = $(labelId);
  const update = () => lab.textContent = formatter(Number(el.value));
  el.addEventListener('input', update);
  update();
}

/** Standard reducing-balance EMI formula. */
function emiFor(principal, annualRatePct, months){
  const r = (annualRatePct/12)/100;
  if(r===0) return principal/months;
  const f = Math.pow(1+r, months);
  return principal * r * f / (f-1);
}

/** Inverse of emiFor — max principal serviceable by a given EMI. */
function principalFromEmi(emi, annualRatePct, months){
  const r = (annualRatePct/12)/100;
  if(r===0) return emi*months;
  const f = Math.pow(1+r, months);
  return emi*(f-1)/(r*f);
}

/** Small inline status note (used by AI Tips + Cloud History panels). */
function showNote(elId, text, tone){
  const el = $(elId);
  if(!el) return;
  el.textContent = text;
  el.className = 'inline-note' + (tone ? ' ' + tone : '');
  el.style.display = 'block';
}
