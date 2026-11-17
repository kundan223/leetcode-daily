(() => {
  'use strict';
  const $=id=>document.getElementById(id),W=window.Workspace,P=window.Progress;
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const lookup=Object.fromEntries(Object.entries({dsa:window.ROADMAP,sql:window.SQL_ROADMAP}).map(([sheet,data])=>[sheet,new Map(data.sections.flatMap(s=>s.rows).map(r=>[r.id,r]))]));
  for(const course of window.COURSES)lookup[course.id]=new Map(course.lessons.map(l=>[l.id,{...l,url:`https://www.youtube.com/watch?v=${l.id}&list=${course.playlist}`} ]));
  const names={dsa:'DSA',sql:'SQL',design:'System Design',backend:'Backend'};
  let journal={events:[]},states={dsa:P.fresh(),sql:P.fresh()},year=new Date().getFullYear(),filter='all',day=P.day();
  const pretty=date=>new Intl.DateTimeFormat(undefined,{dateStyle:'full'}).format(new Date(`${date}T12:00:00`));
  function render(value=journal,current=states){
    journal=value;states=current;
    const courses=window.CourseView.catalog();
    for(const course of courses){lookup[course.id]=new Map(course.lessons.map(l=>[l.id,{...l,url:`https://www.youtube.com/watch?v=${l.id}&list=${course.playlist}`} ]));names[course.id]=course.title;}
    if(!['all','dsa','sql',...courses.map(c=>c.id)].includes(filter))filter='all';
    $('activity-sheet').innerHTML=[['all','All practice'],['dsa','DSA'],['sql','SQL'],...courses.map(c=>[c.id,c.title])].map(([id,name])=>`<option value="${id}" ${id===filter?'selected':''}>${escape(name)}</option>`).join('');
    const combined=[...W.currentEntries(journal,states),...window.CourseView.events()];
    const today=P.day(),years=new Set([new Date().getFullYear(),year]);
    for(const e of combined)if(e.date)years.add(Number(e.date.slice(0,4)));
    $('activity-year').innerHTML=[...years].sort((a,b)=>b-a).map(y=>`<option value="${y}" ${y===year?'selected':''}>${y}</option>`).join('');
    const counts=W.daily(combined,filter),cells=W.calendar(year),visible=cells.filter(c=>c.inYear&&!c.future);
    const active=visible.filter(c=>counts.get(c.date)>0).length,total=visible.reduce((sum,c)=>sum+(counts.get(c.date)||0),0);
    const seconds=combined.filter(e=>e.seconds&&(filter==='all'||e.sheet===filter)&&e.date?.startsWith(`${year}-`)).reduce((sum,e)=>sum+e.seconds,0);
    $('activity-summary').textContent=`${active} active days · ${total} completed items · ${window.CourseProgress.format(seconds)} lecture credit in ${year}`;
    $('activity-grid').innerHTML=cells.map(c=>{
      if(!c.inYear||c.future)return '<span class="activity-cell blank" aria-hidden="true"></span>';
      const count=counts.get(c.date)||0,level=count===0?0:count===1?1:count===2?2:count<5?3:4;
      const label=`${pretty(c.date)}: ${count} completed item${count===1?'':'s'}`;
      return `<button class="activity-cell level-${level}" data-day="${c.date}" title="${escape(label)}" aria-label="${escape(label)}" aria-pressed="${day===c.date}"></button>`;
    }).join('');
    const months=[];
    for(let i=0;i<cells.length;i++)if(cells[i].month!==null&&cells[i].inYear)months.push(`<span style="grid-column:${Math.floor(i/7)+1}">${new Intl.DateTimeFormat('en',{month:'short'}).format(new Date(`${cells[i].date}T12:00:00`))}</span>`);
    $('activity-months').innerHTML=months.join('');$('activity-months').style.gridTemplateColumns=`repeat(${Math.ceil(cells.length/7)}, 13px)`;
    const entries=combined.filter(e=>(filter==='all'||e.sheet===filter));
    const dated=day==='unknown'?entries.filter(e=>!e.date):entries.filter(e=>e.date===day);
    const daySeconds=dated.reduce((sum,e)=>sum+(e.seconds||0),0);
    $('ledger-filter').textContent=`${day==='unknown'?'Date unknown':pretty(day)} · ${filter==='all'?'All practice':names[filter]}`;
    $('ledger-summary').textContent=`${dated.length} entries · ${window.CourseProgress.format(daySeconds)} lecture credit`;
    $('ledger-date').value=day==='unknown'?'':day;$('ledger-date').max=today;
    $('ledger-prev').disabled=day==='unknown'||day<='1970-01-01';$('ledger-next').disabled=day==='unknown'||day>=today;
    $('ledger-unknown').hidden=!entries.some(e=>!e.date);$('ledger-unknown').setAttribute('aria-pressed',day==='unknown');
    $('activity-ledger').innerHTML=dated.length?`<ul class="ledger-entries">${dated.slice().sort((a,b)=>(b.at||'').localeCompare(a.at||'')).map(e=>{
      const row=lookup[e.sheet].get(e.id),time=e.at?new Intl.DateTimeFormat(undefined,{hour:'2-digit',minute:'2-digit'}).format(new Date(e.at)):'Time not recorded';
      return `<li><span class="ledger-time">${escape(time)}</span><span class="ledger-sheet">${escape(names[e.sheet])}</span><div><a href="${escape(row.url)}" target="_blank" rel="noopener noreferrer">${row.position||row.id}. ${escape(row.title)} ↗</a><span class="ledger-action">${e.action==='review'?'Currently marked to revisit':'Completed'}${e.seconds?` · ${window.CourseProgress.format(e.seconds)} lecture duration credited`:''}</span></div></li>`;
    }).join('')}</ul>`:'<div class="activity-empty">No checked items for this day and filter. Use the day buttons to browse, or complete an item on a sheet or course.</div>';
  }
  function chooseDay(date){day=date;if(date!=='unknown')year=Number(date.slice(0,4));render();$('activity-ledger').scrollTop=0;}
  function moveDay(offset){if(day==='unknown')return;const next=new Date(`${day}T12:00:00`);next.setDate(next.getDate()+offset);const value=P.day(next);if(value<=P.day()&&value>='1970-01-01')chooseDay(value);}
  $('ledger-prev').addEventListener('click',()=>moveDay(-1));$('ledger-next').addEventListener('click',()=>moveDay(1));
  $('ledger-today').addEventListener('click',()=>chooseDay(P.day()));$('ledger-unknown').addEventListener('click',()=>chooseDay('unknown'));
  $('ledger-date').addEventListener('change',e=>{if(W.validDate(e.target.value)&&e.target.value<=P.day()&&e.target.value>='1970-01-01')chooseDay(e.target.value);else render();});
  $('activity-year').addEventListener('change',e=>{const y=Number(e.target.value);chooseDay(y===new Date().getFullYear()?P.day():`${y}-01-01`);});
  $('activity-sheet').addEventListener('change',e=>{filter=e.target.value;render();$('activity-ledger').scrollTop=0;});
  $('activity-grid').addEventListener('click',e=>{const b=e.target.closest('[data-day]');if(b){const clicked=b.dataset.day;chooseDay(clicked);$('activity-grid').querySelector(`[data-day="${clicked}"]`).focus();}});
  $('jump-ledger').addEventListener('click',()=>{$('ledger-title').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});$('ledger-title').focus({preventScroll:true});});
  window.ActivityView={render};
})();
