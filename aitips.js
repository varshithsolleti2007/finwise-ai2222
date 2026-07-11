/* ============================================================
   FinWise AI — AI Financial Tips Module
   Two layers:
     1. Quick Snapshot — deterministic needs/wants/savings split,
        emergency-fund target and risk-based allocation. Always
        works, no network call.
     2. AI-Generated Tips — sends the combined session state
        (loan + credit + EMI + goal/risk) to a secure serverless
        function which calls the real Claude API and returns a
        structured recommendation set. Requires ANTHROPIC_API_KEY
        to be configured on the deployment (see DEPLOYMENT.md).
   ============================================================ */

bindRange('ainc','v_ainc', v=>fmtINR(v));
bindRange('aexp','v_aexp', v=>fmtINR(v));
bindRange('adebt','v_adebt', v=>fmtINR(v));
bindRange('asav','v_asav', v=>fmtINR(v));

let budgetChart;

const riskAllocations = {
  conservative:{equity:25, debt:55, gold:12, cash:8},
  moderate:{equity:50, debt:30, gold:10, cash:10},
  aggressive:{equity:75, debt:12, gold:8, cash:5}
};

function refreshAiTipsAvailability(){
  const have = ['loan','credit','emi'].filter(k => window.FinWiseState[k]).length;
  const el = $('aiTipsContext');
  if(el) el.textContent = `Using data from ${have} of 3 tools run so far (Loan, Credit, EMI). Run more for richer tips, or generate now with what you have.`;
}

function runBudgetSnapshot(){
  const inc = Number($('ainc').value);
  const exp = Number($('aexp').value);
  const debt = Number($('adebt').value);
  const sav = Number($('asav').value);
  const goal = $('goal').value;
  const risk = $('risk').value;

  const needs = exp + debt;
  const surplus = inc - needs;
  const dti = debt/inc;

  const needsPct = Math.min(70, Math.round((needs/inc)*100));
  let savingsPct = Math.max(10, Math.round(((inc*0.20))/inc*100));
  let wantsPct = 100 - needsPct - savingsPct;
  if(wantsPct<5){ wantsPct=5; savingsPct = 100-needsPct-wantsPct; }

  const emergencyTarget = exp*6;

  const allocBars = $('allocBars');
  const rows = [
    {label:'Needs (rent, bills, debt)', pct:needsPct},
    {label:'Wants (lifestyle, discretionary)', pct:wantsPct},
    {label:'Savings & Investing', pct:savingsPct},
  ];
  allocBars.innerHTML = rows.map(r=>`
    <div class="bar-row">
      <div class="bl"><span>${r.label}</span><span>${r.pct}%</span></div>
      <div class="bar-track"><div class="bar-fill" style="width:${r.pct}%"></div></div>
    </div>
  `).join('');

  const ctx = document.getElementById('budgetChart');
  const data = {
    labels:['Needs','Wants','Savings'],
    datasets:[{
      data:[needsPct, wantsPct, savingsPct],
      backgroundColor:['#A63D33','#B4791F','#2F6F4E'],
      borderColor:'#123437', borderWidth:3
    }]
  };
  const opts = {
    responsive:true,
    plugins:{ legend:{ labels:{color:'#ECE7D8', font:{family:'Public Sans', size:12}} } },
    cutout:'62%'
  };
  if(budgetChart){ budgetChart.data=data; budgetChart.options=opts; budgetChart.update(); }
  else { budgetChart = new Chart(ctx, {type:'doughnut', data, options:opts}); }

  const alloc = riskAllocations[risk];
  const notes = [];
  notes.push({tag: dti<=0.36?'pos':dti<=0.5?'neu':'neg',
    text:`Debt-to-income is ${(dti*100).toFixed(1)}%. ${dti<=0.36?'This is within the healthy range lenders prefer (under 36%).':dti<=0.5?'This is elevated — prioritise paying down high-interest debt before taking on more.':'This is high risk territory — a debt paydown plan should come before new borrowing or investing.'}`});
  notes.push({tag: sav>=emergencyTarget?'pos':'neu',
    text:`Emergency fund target is ${fmtINR(emergencyTarget)} (6 months of expenses). You currently hold ${fmtINR(sav)}${sav>=emergencyTarget?' — target met.':`, a gap of ${fmtINR(emergencyTarget-sav)}.`}`});
  notes.push({tag:'neu',
    text:`Suggested investment mix for a ${risk} risk appetite: ${alloc.equity}% equity, ${alloc.debt}% debt/fixed income, ${alloc.gold}% gold, ${alloc.cash}% cash equivalents.`});
  notes.push({tag: surplus>0?'pos':'neg',
    text: surplus>0 ? `Monthly surplus after fixed needs is ${fmtINR(surplus)} — this is your working capital for goals.` : `Expenses and debt exceed income by ${fmtINR(-surplus)} — this needs to be addressed before any savings plan will hold.`});

  $('advisoryNotes').innerHTML = notes.map(n=>{
    const tagText = n.tag==='pos'?'Good':n.tag==='neg'?'Alert':'Note';
    return `<li><span class="tag ${n.tag}">${tagText}</span><span>${n.text}</span></li>`;
  }).join('');

  window.FinWiseState.goal = goal;
  window.FinWiseState.risk = risk;
  window.FinWiseState.budget = { inc, exp, debt, sav, needsPct, wantsPct, savingsPct, emergencyTarget, surplus };
  refreshAiTipsAvailability();
}

/* ---------------- Real Claude AI call ---------------- */
async function generateAiTips(){
  const btn = $('generateAiTips');
  const resultsEl = $('aiTipsResults');
  btn.disabled = true;
  btn.textContent = 'Thinking…';
  showNote('aiTipsStatus', 'Contacting Claude for a personalized read on your session…', 'neu-note');
  resultsEl.innerHTML = '';

  const payload = {
    loan: window.FinWiseState.loan,
    credit: window.FinWiseState.credit,
    emi: window.FinWiseState.emi,
    goal: window.FinWiseState.goal || $('goal').value,
    risk: window.FinWiseState.risk || $('risk').value
  };

  try{
    const res = await fetch(window.FINWISE_CONFIG.AI_TIPS_ENDPOINT, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if(!res.ok || data.error){
      throw new Error(data.error || `Request failed (${res.status})`);
    }
    renderAiTips(data);
    showNote('aiTipsStatus', 'Generated live by Claude based on your current session.', 'pos-note');
  }catch(err){
    showNote('aiTipsStatus',
      `Couldn't reach the AI backend (${err.message}). If you haven't deployed the Netlify function with an ANTHROPIC_API_KEY yet, see DEPLOYMENT.md — the rest of the app works fine without it.`,
      'neg-note');
  }finally{
    btn.disabled = false;
    btn.textContent = 'Generate AI Financial Tips';
  }
}

function renderAiTips(data){
  const el = $('aiTipsResults');
  const riskTag = data.risk_classification?.tier === 'Low' ? 'pos' : data.risk_classification?.tier === 'Medium' ? 'neu' : 'neg';

  const section = (title, items) => `
    <div class="ai-section">
      <div class="ai-section-title">${title}</div>
      <ul class="factor-list">
        ${(items||[]).map(i=>`<li><span class="tag neu">Tip</span><span>${i}</span></li>`).join('') || '<li><span>No suggestions returned.</span></li>'}
      </ul>
    </div>`;

  el.innerHTML = `
    <div class="ai-section">
      <div class="ai-section-title">Risk Classification</div>
      <p><span class="tag ${riskTag}">${data.risk_classification?.tier || 'Unknown'}</span> ${data.risk_classification?.summary || ''}</p>
    </div>
    <div class="ai-section">
      <div class="ai-section-title">Loan Eligibility Summary</div>
      <p>${data.loan_eligibility_summary || 'Run the Loan Eligibility tool for a tailored read.'}</p>
    </div>
    <div class="ai-section">
      <div class="ai-section-title">Credit Evaluation Summary</div>
      <p>${data.credit_evaluation_summary || 'Run the Credit Analyzer for a tailored read.'}</p>
    </div>
    ${section('Personalized Recommendations', data.personalized_recommendations)}
    ${section('Credit Improvement Strategies', data.credit_improvement_strategies)}
    ${section('EMI Optimization Suggestions', data.emi_optimization_suggestions)}
  `;
}

$('runBudgetSnapshot').addEventListener('click', runBudgetSnapshot);
$('generateAiTips').addEventListener('click', generateAiTips);
