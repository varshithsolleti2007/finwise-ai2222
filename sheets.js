/* ============================================================
   FinWise AI — Cloud History Module
   Persists a snapshot of the current session to a Google Sheet
   via a Google Apps Script Web App, and lists past snapshots.
   Fully optional: with SHEETS_ENDPOINT left blank in config.js,
   this just shows a setup note instead of failing.
   ============================================================ */

function hasSheetsEndpoint(){
  return !!(window.FINWISE_CONFIG && window.FINWISE_CONFIG.SHEETS_ENDPOINT);
}

async function saveSessionToCloud(){
  if(!hasSheetsEndpoint()){
    showNote('cloudNote', 'Cloud history isn\u2019t connected yet — see DEPLOYMENT.md to enable Google Sheets sync.', 'neu-note');
    return;
  }
  const summary = {
    loan: window.FinWiseState.loan,
    credit: window.FinWiseState.credit,
    emi: window.FinWiseState.emi,
    goal: window.FinWiseState.goal,
    risk: window.FinWiseState.risk
  };
  try{
    // Apps Script web apps don't reliably send CORS headers for POST,
    // so this is a fire-and-forget request (no readable response).
    await fetch(window.FINWISE_CONFIG.SHEETS_ENDPOINT, {
      method:'POST',
      mode:'no-cors',
      headers:{'Content-Type':'text/plain'},
      body: JSON.stringify({ tool:'session-snapshot', summary })
    });
    showNote('cloudNote', 'Saved to your cloud history.', 'pos-note');
    setTimeout(loadCloudHistory, 800); // give Sheets a moment to append the row
  }catch(err){
    showNote('cloudNote', `Could not save (${err.message}). Check SHEETS_ENDPOINT in js/config.js.`, 'neg-note');
  }
}

async function loadCloudHistory(){
  const el = $('historyList');
  if(!el) return;
  if(!hasSheetsEndpoint()){
    el.innerHTML = '<li><span class="tag neu">Setup</span><span>Cloud history isn\u2019t connected yet — see DEPLOYMENT.md.</span></li>';
    return;
  }
  try{
    const res = await fetch(window.FINWISE_CONFIG.SHEETS_ENDPOINT + '?action=history');
    const data = await res.json();
    if(!data.ok || !data.records || !data.records.length){
      el.innerHTML = '<li><span class="tag neu">Empty</span><span>No saved records yet — run some tools and save a snapshot.</span></li>';
      return;
    }
    el.innerHTML = data.records.map(r=>{
      const when = new Date(r.timestamp).toLocaleString('en-IN');
      const bits = [];
      if(r.summary?.loan) bits.push(`Loan: ${r.summary.loan.verdict}`);
      if(r.summary?.credit) bits.push(`Credit: ${r.summary.credit.band}`);
      if(r.summary?.emi) bits.push(`EMI: ${fmtINR(r.summary.emi.emi)}`);
      return `<li><span class="tag neu">${when}</span><span>${bits.join(' · ') || r.tool}</span></li>`;
    }).join('');
  }catch(err){
    el.innerHTML = `<li><span class="tag neg">Error</span><span>Could not load history (${err.message}).</span></li>`;
  }
}

$('saveToCloud').addEventListener('click', saveSessionToCloud);
$('refreshHistory').addEventListener('click', loadCloudHistory);
