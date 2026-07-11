/* ============================================================
   FinWise AI — App Entry
   Session header, tab navigation, and first paint. Loaded last,
   after every feature module has defined the functions this
   file calls on startup.
   ============================================================ */

/* ---------------- Session header ---------------- */
document.getElementById('sessId').textContent = 'FW-' + Math.floor(1000+Math.random()*9000);
document.getElementById('sessDate').textContent = new Date().toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'numeric'});

/* ---------------- Tabs ---------------- */
document.querySelectorAll('.tab-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('page-'+btn.dataset.tab).classList.add('active');
  });
});

/* ---------------- Run once on load with defaults ---------------- */
runQuickClassify();
runCreditAnalysis();
runEmiCalculator();
runBudgetSnapshot();
refreshAiTipsAvailability();
loadCloudHistory();
