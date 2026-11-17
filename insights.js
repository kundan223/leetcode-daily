(function(root){
  'use strict';
  function score(state,sections,now=new Date()){
    const rows=sections.flatMap(s=>s.rows),done=rows.filter(r=>state.problems[r.id]?.done);
    const covered=sections.filter(s=>s.rows.some(r=>state.problems[r.id]?.done)).length;
    const dates=new Set();
    for(let i=0;i<14;i++){const d=new Date(now);d.setDate(d.getDate()-i);dates.add(root.Progress.day(d));}
    const active=new Set(done.map(r=>state.problems[r.id].completedOn).filter(d=>dates.has(d))).size;
    const completion=rows.length?60*done.length/rows.length:0;
    const breadth=sections.length?25*covered/sections.length:0;
    const consistency=15*active/14;
    return {total:Math.round(completion+breadth+consistency),completion,breadth,consistency,done:done.length,covered,active};
  }
  function upcoming(contests,now=Date.now()){
    return (Array.isArray(contests)?contests:[]).filter(c=>Number.isFinite(c.startTime)&&c.startTime*1000>now).sort((a,b)=>a.startTime-b.startTime);
  }
  root.Insights={score,upcoming};
})(typeof window!=='undefined'?window:globalThis);
