(() => {
  'use strict';
  const $=id=>document.getElementById(id),W=window.Workspace;
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const catalog={dsa:window.ROADMAP,sql:window.SQL_ROADMAP};
  const lookup=Object.fromEntries(Object.entries(catalog).map(([sheet,data])=>[sheet,new Map(data.sections.flatMap(s=>s.rows).map(r=>[r.id,r]))]));
  for(const course of window.COURSES)lookup[course.id]=new Map(course.lessons.map(l=>[l.id,{...l,url:`https://www.youtube.com/watch?v=${l.id}&list=${course.playlist}`} ]));
  const names={dsa:'DSA',sql:'SQL',design:'System Design',backend:'Backend'};
  const labels={completed:'Marked complete',reopened:'Reopened',review:'Added to revisit',unreview:'Removed from revisit',recovered:'Saved completion',watched:'Tracked watch time','manual-watch':'Manually logged watch time'};
  let journal={events:[]},year=new Date().getFullYear(),filter='all',day=null,limit=20;
  const pretty=date=>new Intl.DateTimeFormat(undefined,{dateStyle:'full'}).format(new Date(`${date}T12:00:00`));
  function render(value=journal){
    journal=value;
    const combined=[...journal.events,...window.CourseView.events()];
    const current=new Date().getFullYear(),years=new Set([current,year]);
    for(const e of combined)if(e.date)years.add(Number(e.date.slice(0,4)));
    $('activity-year').innerHTML=[...years].sort((a,b)=>b-a).map(y=>`<option value="${y}" ${y===year?'selected':''}>${y}</option>`).join('');
    const counts=W.daily(combined,filter),cells=W.calendar(year),visible=cells.filter(c=>c.inYear&&!c.future);
    const active=visible.filter(c=>counts.get(c.date)>0).length,total=visible.reduce((sum,c)=>sum+(counts.get(c.date)||0),0);
    const watchSeconds=combined.filter(e=>e.seconds&&(filter==='all'||e.sheet===filter)&&e.date?.startsWith(`${year}-`)).reduce((sum,e)=>sum+e.seconds,0);
    $('activity-summary').textContent=`${active} active days · ${total} daily learning items · ${window.CourseProgress.format(watchSeconds)} watched in ${year}`;
    $('activity-grid').innerHTML=cells.map(c=>{
      if(!c.inYear||c.future)return '<span class="activity-cell blank" aria-hidden="true"></span>';
      const count=counts.get(c.date)||0,level=count===0?0:count===1?1:count===2?2:count<5?3:4;
      const label=`${pretty(c.date)}: ${count} learning item${count===1?'':'s'}`;
      return `<button class="activity-cell level-${level}" data-day="${c.date}" title="${escape(label)}" aria-label="${escape(label)}" aria-pressed="${day===c.date}"></button>`;
    }).join('');
    const months=[];
    for(let i=0;i<cells.length;i++)if(cells[i].month!==null&&cells[i].inYear)months.push(`<span style="grid-column:${Math.floor(i/7)+1}">${new Intl.DateTimeFormat('en',{month:'short'}).format(new Date(`${cells[i].date}T12:00:00`))}</span>`);
    $('activity-months').innerHTML=months.join('');
    $('activity-months').style.gridTemplateColumns=`repeat(${Math.ceil(cells.length/7)}, 13px)`;
    $('ledger-filter').textContent=day?pretty(day):`${year} · ${filter==='all'?'All practice':names[filter]}`;
    $('clear-activity-day').hidden=day===null;
    const groups=new Map();
    const events=combined.filter(e=>(filter==='all'||e.sheet===filter)&&(day?e.date===day:!e.date||Number(e.date.slice(0,4))===year));
    for(const e of events){const key=e.date||'unknown';if(!groups.has(key))groups.set(key,[]);groups.get(key).push(e);}
    const dates=[...groups.keys()].sort((a,b)=>a==='unknown'?1:b==='unknown'?-1:b.localeCompare(a));
    $('activity-ledger').innerHTML=dates.length?dates.slice(0,limit).map(date=>`<section class="ledger-day"><h3>${date==='unknown'?'Date unknown':escape(pretty(date))}<span>${groups.get(date).length} entries</span></h3><ul>${groups.get(date).slice().sort((a,b)=>(b.at||'').localeCompare(a.at||'')).map(e=>{
      const row=lookup[e.sheet].get(e.id);
      const time=e.action==='manual-watch'?`Logged ${new Intl.DateTimeFormat(undefined,{dateStyle:'short',timeStyle:'short'}).format(new Date(e.at))}`:e.at?new Intl.DateTimeFormat(undefined,{hour:'2-digit',minute:'2-digit'}).format(new Date(e.at)):'Time not recorded';
      return `<li><span class="ledger-time">${escape(time)}</span><span class="ledger-sheet">${names[e.sheet]}</span><div><a href="${escape(row.url)}" target="_blank" rel="noopener noreferrer">${row.position||row.id}. ${escape(row.title)} ↗</a><span class="ledger-action">${labels[e.action]}${e.seconds?` · ${window.CourseProgress.format(e.seconds)}`:''}${e.action==='recovered'?' · recovered from saved progress':''}</span></div></li>`;
    }).join('')}</ul></section>`).join(''):'<div class="activity-empty">No activity recorded for this selection. Practice a problem, complete a lecture, or log watch time to start your ledger.</div>';
    $('activity-more').hidden=dates.length<=limit;
  }
  $('activity-year').addEventListener('change',e=>{year=Number(e.target.value);day=null;limit=20;render();});
  $('activity-sheet').addEventListener('change',e=>{filter=e.target.value;limit=20;render();});
  $('activity-grid').addEventListener('click',e=>{const b=e.target.closest('[data-day]');if(b){const clicked=b.dataset.day;day=day===clicked?null:clicked;limit=20;render();$('activity-grid').querySelector(`[data-day="${clicked}"]`).focus();}});
  $('clear-activity-day').addEventListener('click',()=>{day=null;render();});
  $('activity-more').addEventListener('click',()=>{limit+=20;render();});
  $('jump-ledger').addEventListener('click',()=>{
    $('ledger-title').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
    $('ledger-title').focus({preventScroll:true});
  });
  window.ActivityView={render};
})();
