(() => {
  'use strict';
  const $=s=>document.querySelector(s),P=window.Progress,W=window.Workspace;
  const sheets={dsa:window.ROADMAP,sql:window.SQL_ROADMAP};
  const catalog=Object.fromEntries(Object.entries(sheets).map(([key,data])=>[key,new Set(data.sections.flatMap(s=>s.rows).map(r=>r.id))]));
  const states={dsa:P.fresh(),sql:P.fresh()},writable={dsa:true,sql:true,activity:true};
  let sheet='dsa',data=sheets.dsa,rows=[],ids=catalog.dsa,state=states.dsa,journal={version:1,events:[]};
  let topic=-1,status='all',search='',difficulty='all',storageOK=true,toastTimer;
  const views={dsa:{topic:-1,status:'all',search:'',difficulty:'all'},sql:{topic:-1,status:'all',search:'',difficulty:'all'}};
  function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),4200);}
  for(const key of ['dsa','sql'])try{const saved=localStorage.getItem(W.KEYS[key]);if(saved)states[key]=P.validate(JSON.parse(saved),catalog[key]);}catch{writable[key]=false;toast(`${key.toUpperCase()} progress could not be loaded. Existing storage has been kept; restore a backup to enable saving.`);}
  try{const saved=localStorage.getItem(W.KEYS.activity);if(saved)journal=W.validateActivity(JSON.parse(saved),catalog);}catch{writable.activity=false;toast('Activity could not be loaded. Existing history has been kept; export your current session before leaving.');}
  W.recover(journal,states);
  if(writable.activity)try{localStorage.setItem(W.KEYS.activity,JSON.stringify(journal));}catch{writable.activity=false;}
  function selectSheet(next){
    views[sheet]={topic,status,search,difficulty};sheet=next;data=sheets[sheet];state=states[sheet];ids=catalog[sheet];
    rows=data.sections.flatMap((s,i)=>s.rows.map(r=>({...r,topic:i,topicTitle:s.title})));
    ({topic,status,search,difficulty}=views[sheet]);storageOK=writable[sheet]&&writable.activity;
    $('#search').value=search;$('#difficulty').value=difficulty;
  }
  selectSheet('dsa');
  function save(){
    states[sheet]=state;storageOK=writable[sheet]&&writable.activity;
    try{if(writable[sheet])localStorage.setItem(W.KEYS[sheet],JSON.stringify(state));if(writable.activity)localStorage.setItem(W.KEYS.activity,JSON.stringify(journal));}
    catch{storageOK=false;}
    if(!storageOK)toast('Some changes are only in this session. Export a backup before leaving.');
    $('#save-state').textContent=storageOK?'Automatically saved':'Not saved - export a backup';
  }
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function filtered(){return rows.filter(r=>(topic<0||r.topic===topic)&&(difficulty==='all'||r.difficulty===difficulty)&&(status==='all'||status==='done'&&state.problems[r.id]?.done||status==='todo'&&!state.problems[r.id]?.done||status==='review'&&state.problems[r.id]?.review)&&`${r.id} ${r.title} ${r.focus} ${r.topicTitle}`.toLowerCase().includes(search));}
  function renderStats(){
    const practice=window.Insights.score(states.dsa,sheets.dsa.sections);
    $('#practice-score').textContent=practice.total;$('#practice-score-bar').value=practice.total;
    $('#score-breakdown').innerHTML=`<li>Completion: ${practice.completion.toFixed(1)} / 60 (${practice.done} / 242 DSA problems solved)</li><li>Topic coverage: ${practice.breadth.toFixed(1)} / 25 (${practice.covered} / 22 DSA topics)</li><li>Consistency: ${practice.consistency.toFixed(1)} / 15 (${practice.active} / 14 active days)</li>`;
    window.ActivityView.render(journal);
    $('#topic-count').textContent=`${data.sections.length} TOPICS`;
    $('#roadmap-name').textContent=sheet==='sql'?'SQL 50':'DSA ROADMAP';
    $('#solved-total').textContent=`/ ${rows.length} solved`;$('#topics-total').textContent=`/ ${data.sections.length} topics`;
    $('#overall-bar').max=rows.length;
    $('#sheet-name').textContent=sheet==='sql'?'SQL 50':'DSA practice sheet';
    $('#sql-source').hidden=sheet!=='sql';
    const s=P.stats(state,data.sections);$('#done').textContent=s.done;$('#overall-bar').value=s.done;$('#percent').textContent=`${s.percent}% complete`;$('#remaining').textContent=`${s.total-s.done} to explore`;$('#today-done').textContent=s.today;$('#goal-label').textContent=`/ ${state.goal} problems`;$('#goal').value=state.goal;$('#topics-done').textContent=s.topics;
    $('#goal-track').innerHTML=Array.from({length:state.goal},(_,i)=>`<span class="${i<s.today?'filled':''}"></span>`).join('');
    $('#topic-message').textContent=s.topics===data.sections.length?'Every topic complete. Time to revisit and refine.':s.today>=state.goal?'Daily goal reached. Keep that momentum.':'Build a foundation, then move forward.';
    $('#save-state').textContent=storageOK?'Automatically saved':'Not saved · export a backup';
    $('#topics').innerHTML=`<button class="topic-button ${topic===-1?'active':''}" data-topic="-1" aria-pressed="${topic===-1}"><span class="topic-icon">▦</span><span class="topic-name">All problems</span><span class="topic-number">${s.done} / ${rows.length}</span></button>`+data.sections.map((section,i)=>{const count=section.rows.filter(r=>state.problems[r.id]?.done).length;return `<button class="topic-button ${topic===i?'active':''}" data-topic="${i}" aria-pressed="${topic===i}"><span class="topic-icon">${String(i+1).padStart(2,'0')}</span><span class="topic-name">${escape(section.title)}</span><span class="topic-number ${count===section.rows.length?'topic-complete':''}">${count===section.rows.length?'✓':`${count} / ${section.rows.length}`}</span></button>`;}).join('');
  }
  function renderList(){
    const list=filtered();$('#section-title').innerHTML=`${topic===-1?'All problems':escape(data.sections[topic].title)} <span>${topic===-1?rows.length:data.sections[topic].rows.length}</span>`;
    $('#topic-description').textContent=topic===-1?`A clear path through ${data.sections.length} ${sheet==='sql'?'SQL':'DSA'} topics. Start at the beginning or choose your focus.`:`Topic ${String(topic+1).padStart(2,'0')} of ${data.sections.length} · Follow the order below. Use the learning target to guide your approach.`;
    $('#results-count').textContent=`${list.length} problem${list.length===1?'':'s'}`;
    $('#list-footer').textContent=`Showing ${list.length} of ${topic===-1?rows.length:data.sections[topic].rows.length} problems. Every solved problem is a step forward.`;
    $('#problems').innerHTML=list.map(r=>{const item=state.problems[r.id]||{};return `<tr class="${item.done?'done-row':''}" data-id="${r.id}"><td><input type="checkbox" class="problem-check" data-id="${r.id}" ${item.done?'checked':''} aria-label="Mark ${escape(r.title)} completed"></td><td><a class="problem-title" href="${escape(r.url)}" target="_blank" rel="noopener noreferrer"><span class="problem-id">${r.id}.</span><span class="title-text">${escape(r.title)}</span></a><span class="problem-concept">${escape(r.focus)}</span></td><td><span class="badge ${r.difficulty}">${{E:'Easy',M:'Medium',H:'Hard'}[r.difficulty]}</span></td><td class="topic-cell"><span class="topic-pill">${escape(r.topicTitle)}</span></td><td class="review-cell"><button class="review-button" data-id="${r.id}" aria-label="Revisit ${escape(r.title)}" aria-pressed="${!!item.review}" title="${item.review?'Remove from revisit list':'Save for another attempt'}">${item.review?'★':'☆'}</button></td><td class="external-cell"><a class="external" href="${escape(r.url)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${escape(r.title)} on LeetCode">↗</a></td></tr>`;}).join('');
    $('#empty').hidden=list.length>0;document.querySelectorAll('[data-status]').forEach(b=>{const active=b.dataset.status===status;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active);});
  }
  function render(){renderStats();renderList();}
  $('#topics').addEventListener('click',e=>{const b=e.target.closest('[data-topic]');if(!b)return;topic=Number(b.dataset.topic);render();});
  $('#problems').addEventListener('change',e=>{if(!e.target.matches('.problem-check'))return;const id=Number(e.target.dataset.id),checked=e.target.checked;W.record(journal,sheet,id,checked?'completed':'reopened');P.toggleDone(state,id,checked);save();renderStats();if(status==='all'||status==='review'){e.target.closest('tr').classList.toggle('done-row',checked);}else{renderList();}if(checked&&P.stats(state,data.sections).today===state.goal)toast('Daily goal reached. Nicely done!');});
  $('#problems').addEventListener('click',e=>{const b=e.target.closest('.review-button');if(!b)return;const id=Number(b.dataset.id);P.toggleReview(state,id);W.record(journal,sheet,id,state.problems[id].review?'review':'unreview');save();window.ActivityView.render(journal);if(status==='review'){renderList();}else{const active=state.problems[id].review;b.setAttribute('aria-pressed',active);b.textContent=active?'★':'☆';b.title=active?'Remove from revisit list':'Save for another attempt';}});
  $('.tabs').addEventListener('click',e=>{const b=e.target.closest('[data-status]');if(b){status=b.dataset.status;renderList();}});
  $('#search').addEventListener('input',e=>{search=e.target.value.trim().toLowerCase();renderList();});
  $('#difficulty').addEventListener('change',e=>{difficulty=e.target.value;renderList();});
  $('#goal').addEventListener('change',e=>{state.goal=Number(e.target.value);save();renderStats();});
  $('#clear-filters').addEventListener('click',()=>{search='';difficulty='all';status='all';$('#search').value='';$('#difficulty').value='all';renderList();});
  $('#next').addEventListener('click',()=>{const candidate=filtered().find(r=>!state.problems[r.id]?.done);if(!candidate){toast('No unfinished problems in this view. Try All problems or another topic.');return;}window.open(candidate.url,'_blank','noopener,noreferrer');});
  $('#back-top').addEventListener('click',()=>window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}));
  $('#export').addEventListener('click',()=>{const content={app:'daily-practice',version:3,sheets:states,activity:journal,courses:window.CourseView.snapshot(),account:data.account,exportedAt:new Date().toISOString()};const url=URL.createObjectURL(new Blob([JSON.stringify(content,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`daily-practice-${P.day()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Progress backup downloaded.');});
  $('#import').addEventListener('change',async e=>{
    const file=e.target.files[0];if(!file)return;
    try{
      if(file.size>10000000)throw new Error('Please choose a backup smaller than 10 MB.');
      const incoming=W.validateBackup(JSON.parse(await file.text()),catalog);
      if(!confirm(incoming.legacy?'Restore this original backup to DSA only? SQL progress and the activity ledger will be kept. Export your current progress first if needed.':(incoming.courses?'Replace both sheets, course checklists, watch time and activity with this backup? Export your current progress first if needed.':'Restore both sheets and their activity? Course checklists and watch time will be kept.')))return;
      states.dsa=incoming.dsa;writable.dsa=true;
      if(!incoming.legacy){states.sql=incoming.sql;journal=incoming.activity;writable.sql=true;writable.activity=true;}
      W.recover(journal,states);state=states[sheet];storageOK=true;
      try{localStorage.setItem(W.KEYS.dsa,JSON.stringify(states.dsa));if(!incoming.legacy)localStorage.setItem(W.KEYS.sql,JSON.stringify(states.sql));if(writable.activity)localStorage.setItem(W.KEYS.activity,JSON.stringify(journal));else storageOK=false;}catch{storageOK=false;}
      if(incoming.courses)window.CourseView.restore(incoming.courses);
      render();toast(storageOK?'Backup restored.':'Backup restored for this session. Export before leaving.');
    }catch(error){toast(error instanceof SyntaxError?'That file is not valid JSON.':error.message);}finally{e.target.value='';}
  });
  window.addEventListener('storage',e=>{
    const key=Object.keys(W.KEYS).find(k=>W.KEYS[k]===e.key);if(!key)return;
    try{
      if(key==='activity')journal=e.newValue?W.validateActivity(JSON.parse(e.newValue),catalog):{version:1,events:[]};
      else states[key]=e.newValue?P.validate(JSON.parse(e.newValue),catalog[key]):P.fresh();
      writable[key]=true;state=states[sheet];storageOK=writable[sheet]&&writable.activity;render();
    }catch{toast('Another tab wrote invalid data. Your current view has been kept.');}
  });
  function updateDate(){const date=new Date();$('#date').textContent=new Intl.DateTimeFormat('en',{weekday:'short',month:'short',day:'numeric',year:'numeric'}).format(date);renderStats();}
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateDate();});
  setInterval(updateDate,60000);updateDate();renderList();
  function renderView(){
    const route=location.hash.slice(1);
    const view=['profile','contests','courses'].includes(route)?route:'sheet';
    const next=route==='sql'?'sql':view!=='sheet'?sheet:'dsa';
    if(next!==sheet)selectSheet(next);
    render();
    for(const name of ['sheet','profile','contests','courses'])$(`#${name}-panel`).hidden=name!==view;
    $('#view-name').textContent=view==='sheet'?(sheet==='sql'?'SQL 50':'DSA roadmap'):{profile:'Profile',contests:'Contests',courses:'System Design + Backend'}[view];
    for(const name of ['sheet','sql','profile','contests','courses']){
      const link=$(`#${name}-tab`);
      if(name===(view==='sheet'?(sheet==='sql'?'sql':'sheet'):view))link.setAttribute('aria-current','page');
      else link.removeAttribute('aria-current');
    }
    window.CourseView.setActive(view==='courses');
  }
  document.addEventListener('coursechange',()=>window.ActivityView.render(journal));
  window.addEventListener('hashchange',renderView);
  $('#topics').addEventListener('click',e=>{if(e.target.closest('[data-topic]'))location.hash=sheet==='sql'?'sql':'sheet';});
  renderView();
})();
