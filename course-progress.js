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
  function watch(state,{key,course,id,date,at,seconds,manual=false}){
    if(!known(course,id)||!root.Workspace.validDate(date)||!Number.isInteger(seconds)||seconds<1||seconds>86400)throw new Error('Invalid watch time.');
    const existing=state.events.find(e=>e.key===key);
    if(existing){
      if(existing.sheet!==course||existing.id!==id||existing.date!==date||existing.action!=='watched'||manual||existing.seconds+seconds>86400)throw new Error('Invalid watch session.');
      existing.seconds+=seconds;
    }else state.events.push({key,sheet:course,id,action:manual?'manual-watch':'watched',date,at,seconds});
  }
  function seconds(state,course,id){return state.events.filter(e=>e.sheet===course&&(!id||e.id===id)&&['watched','manual-watch'].includes(e.action)).reduce((sum,e)=>sum+e.seconds,0);}
  function format(seconds){seconds=Math.floor(seconds);const h=Math.floor(seconds/3600),m=Math.floor(seconds%3600/60),s=seconds%60;return `${h?`${h}h `:''}${m?`${m}m `:''}${s||(!h&&!m)?`${s}s`:''}`.trim();}
  // Measure elapsed viewing time, not video position or unique content coverage.
  function credit(previous,current){
    if(!previous||!current||!previous.active||!current.active||previous.id!==current.id||previous.rate!==current.rate||previous.state!==1||current.state!==1)return 0;
    const elapsed=(current.clock-previous.clock)/1000,media=current.position-previous.position;
    if(!Number.isFinite(elapsed)||!Number.isFinite(media)||!Number.isFinite(current.rate)||current.rate<=0||elapsed<=0||elapsed>5||media<=0||Math.abs(media-elapsed*current.rate)>Math.max(.75,elapsed*current.rate*.35))return 0;
    return Math.min(elapsed,media/current.rate);
  }
  root.CourseProgress={KEY,fresh,validate,toggle,watch,seconds,format,credit,known};
})(typeof window!=='undefined'?window:globalThis);
