(function(root){
  'use strict';
  const KEY='daily-practice-kundan-v1';
  function day(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
  function fresh(){return {version:1,goal:3,problems:{}};}
  function validate(value,ids){
    if(!value||value.version!==1||!value.problems||typeof value.problems!=='object'||Array.isArray(value.problems))throw new Error('This is not a Daily Practice backup.');
    const result=fresh();result.goal=[1,2,3,5,10].includes(value.goal)?value.goal:3;
    for(const [id,item] of Object.entries(value.problems)){
      if(!ids.has(Number(id)))continue;
      if(!item||typeof item!=='object'||typeof item.done!=='boolean'||typeof item.review!=='boolean')throw new Error('The backup contains invalid progress.');
      if(item.completedOn!==null&&item.completedOn!==undefined&&(!/^\d{4}-\d{2}-\d{2}$/.test(item.completedOn)||Number.isNaN(Date.parse(item.completedOn))))throw new Error('The backup contains an invalid date.');
      result.problems[id]={done:item.done,review:item.review,completedOn:item.done?(item.completedOn||null):null};
    }
    return result;
  }
  function toggleDone(state,id,done,date=day()){
    const old=state.problems[id]||{done:false,review:false,completedOn:null};
    state.problems[id]={...old,done,completedOn:done?(old.done?old.completedOn:date):null};
    return state;
  }
  function toggleReview(state,id){const old=state.problems[id]||{done:false,review:false,completedOn:null};state.problems[id]={...old,review:!old.review};return state;}
  function stats(state,sections,date=day()){
    const rows=sections.flatMap(s=>s.rows),done=rows.filter(r=>state.problems[r.id]?.done).length;
    return {done,total:rows.length,percent:Math.round(done/rows.length*100),today:rows.filter(r=>state.problems[r.id]?.done&&state.problems[r.id].completedOn===date).length,topics:sections.filter(s=>s.rows.every(r=>state.problems[r.id]?.done)).length};
  }
  root.Progress={KEY,day,fresh,validate,toggleDone,toggleReview,stats};
})(typeof window!=='undefined'?window:globalThis);
