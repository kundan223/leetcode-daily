(function(root){
  'use strict';
  const KEY='daily-practice-kundan-courses-v1';
  const ids=new Map(root.COURSES.map(c=>[c.id,new Set(c.lessons.map(l=>l.id))]));
  const known=(course,id)=>ids.get(course)?.has(id);
  const fresh=()=>({version:1,checks:{},events:[]});
  function validate(value){
    if(!value||value.version!==1||!value.checks||typeof value.checks!=='object'||Array.isArray(value.checks)||!Array.isArray(value.events))throw new Error('Invalid course backup.');
    const result=fresh(),seen=new Set();
    for(const [key,item] of Object.entries(value.checks)){
      const [course,id]=key.split(':');
      if(!known(course,id)||key!==`${course}:${id}`||!item||typeof item.done!=='boolean'||(item.date!==null&&!root.Workspace.validDate(item.date)))throw new Error('Invalid lecture completion.');
      result.checks[key]={done:item.done,date:item.date};
    }
    for(const e of value.events){
      const timed=['watched','manual-watch'].includes(e?.action);
      if(!e||!known(e.sheet,e.id)||typeof e.key!=='string'||!e.key||seen.has(e.key)||!['completed','reopened','watched','manual-watch'].includes(e.action)||!root.Workspace.validDate(e.date)||typeof e.at!=='string'||!Number.isFinite(Date.parse(e.at))||(timed&&(!Number.isInteger(e.seconds)||e.seconds<1||e.seconds>86400)))throw new Error('Invalid course activity.');
      seen.add(e.key);result.events.push({key:e.key,sheet:e.sheet,id:e.id,action:e.action,date:e.date,at:e.at,...(timed?{seconds:e.seconds}:{})});
    }
    return result;
  }
  function toggle(state,course,id,done,now=new Date()){
    if(!known(course,id)||typeof done!=='boolean')throw new Error('Unknown lecture.');
    if(!!state.checks[`${course}:${id}`]?.done===done)return;
    const date=root.Progress.day(now);
    state.checks[`${course}:${id}`]={done,date:done?date:null};
    state.events.push({key:root.crypto.randomUUID(),sheet:course,id,action:done?'completed':'reopened',date,at:now.toISOString()});
  }
  function duration(lesson){return Math.ceil(lesson.durationSeconds/60)*60;}
  function entries(state){
    return root.COURSES.flatMap(course=>course.lessons.filter(l=>state.checks[`${course.id}:${l.id}`]?.done).map(l=>{
      const date=state.checks[`${course.id}:${l.id}`].date;
      const event=state.events.filter(e=>e.sheet===course.id&&e.id===l.id&&e.action==='completed'&&e.date===date).at(-1);
      return {key:`checked:${course.id}:${l.id}`,sheet:course.id,id:l.id,action:'completed',date,at:event?.at||null,seconds:duration(l)};
    }));
  }
  function seconds(state,course,id){return entries(state).filter(e=>e.sheet===course&&(!id||e.id===id)).reduce((sum,e)=>sum+e.seconds,0);}
  function format(seconds){seconds=Math.floor(seconds);const h=Math.floor(seconds/3600),m=Math.floor(seconds%3600/60),s=seconds%60;return `${h?`${h}h `:''}${m?`${m}m `:''}${s||(!h&&!m)?`${s}s`:''}`.trim();}
  // Old watch events remain readable in backups but do not contribute to totals.
  root.CourseProgress={KEY,fresh,validate,toggle,duration,entries,seconds,format,known};
})(typeof window!=='undefined'?window:globalThis);
