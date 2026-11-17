(function(root){
  'use strict';
  const KEY='daily-practice-kundan-courses-v1';
  const catalog=state=>[...root.COURSES,...(state.playlists||[])];
  const known=(course,id,state={})=>catalog(state).some(c=>c.id===course&&c.lessons.some(l=>l.id===id));
  const fresh=()=>({version:1,checks:{},events:[],playlists:[],removed:[]});
  function validate(value){
    if(!value||value.version!==1||!value.checks||typeof value.checks!=='object'||Array.isArray(value.checks)||!Array.isArray(value.events))throw new Error('Invalid course backup.');
    const result=fresh(),seen=new Set();
    if(value.playlists!==undefined){
      if(!Array.isArray(value.playlists)||value.playlists.length>100)throw new Error('Invalid playlist collection.');
      result.playlists=value.playlists.map(validateTrack);
      if(new Set(catalog(result).map(c=>c.id)).size!==catalog(result).length)throw new Error('Duplicate playlist.');
    }
    if(value.removed!==undefined){
      if(!Array.isArray(value.removed)||value.removed.some(id=>!catalog(result).some(c=>c.id===id)))throw new Error('Invalid removed playlists.');
      result.removed=[...new Set(value.removed)];
    }
    for(const [key,item] of Object.entries(value.checks)){
      const [course,id]=key.split(':');
      if(!known(course,id,result)||key!==`${course}:${id}`||!item||typeof item.done!=='boolean'||(item.date!==null&&!root.Workspace.validDate(item.date)))throw new Error('Invalid lecture completion.');
      if(item.seconds!==undefined&&(!Number.isInteger(item.seconds)||item.seconds<0||item.seconds>604800))throw new Error('Invalid lecture credit.');
      result.checks[key]={done:item.done,date:item.date,...(item.seconds!==undefined?{seconds:item.seconds}:{})};
    }
    for(const e of value.events){
      const timed=['watched','manual-watch'].includes(e?.action);
      if(!e||!known(e.sheet,e.id,result)||typeof e.key!=='string'||!e.key||seen.has(e.key)||!['completed','reopened','watched','manual-watch'].includes(e.action)||!root.Workspace.validDate(e.date)||typeof e.at!=='string'||!Number.isFinite(Date.parse(e.at))||(timed&&(!Number.isInteger(e.seconds)||e.seconds<1||e.seconds>86400)))throw new Error('Invalid course activity.');
      seen.add(e.key);result.events.push({key:e.key,sheet:e.sheet,id:e.id,action:e.action,date:e.date,at:e.at,...(timed?{seconds:e.seconds}:{})});
    }
    return result;
  }
  function toggle(state,course,id,done,now=new Date()){
    if(!known(course,id,state)||typeof done!=='boolean')throw new Error('Unknown lecture.');
    if(!!state.checks[`${course}:${id}`]?.done===done)return;
    const date=root.Progress.day(now);
    state.checks[`${course}:${id}`]={done,date:done?date:null,seconds:done?duration(catalog(state).find(c=>c.id===course).lessons.find(l=>l.id===id)):0};
    state.events.push({key:root.crypto.randomUUID(),sheet:course,id,action:done?'completed':'reopened',date,at:now.toISOString()});
  }
  function duration(lesson){return Math.ceil(lesson.durationSeconds/60)*60;}
  function entries(state){
    return catalog(state).filter(c=>!(state.removed||[]).includes(c.id)).flatMap(course=>course.lessons.filter(l=>state.checks[`${course.id}:${l.id}`]?.done).map(l=>{
      const date=state.checks[`${course.id}:${l.id}`].date;
      const event=state.events.filter(e=>e.sheet===course.id&&e.id===l.id&&e.action==='completed'&&e.date===date).at(-1);
      return {key:`checked:${course.id}:${l.id}`,sheet:course.id,id:l.id,action:'completed',date,at:event?.at||null,seconds:state.checks[`${course.id}:${l.id}`].seconds??duration(l)};
    }));
  }
  function seconds(state,course,id){return entries(state).filter(e=>e.sheet===course&&(!id||e.id===id)).reduce((sum,e)=>sum+e.seconds,0);}
  function format(seconds){seconds=Math.floor(seconds);const h=Math.floor(seconds/3600),m=Math.floor(seconds%3600/60),s=seconds%60;return `${h?`${h}h `:''}${m?`${m}m `:''}${s||(!h&&!m)?`${s}s`:''}`.trim();}
  // Old watch events remain readable in backups but do not contribute to totals.
  function validateTrack(track){
    if(!track||!/^PL[A-Za-z0-9_-]{10,100}$|^UU[A-Za-z0-9_-]{10,100}$|^OLAK5uy_[A-Za-z0-9_-]{10,100}$/.test(track.playlist)||track.id!==`yt_${track.playlist}`||typeof track.title!=='string'||track.title.length>500||typeof track.creator!=='string'||track.creator.length>500||!Number.isFinite(track.fetchedAt)||track.fetchedAt>Date.now()+86400000||!Array.isArray(track.lessons)||!track.lessons.length||track.lessons.length>5000)throw new Error('Invalid playlist metadata.');
    const seen=new Set(),expired=Date.now()-track.fetchedAt>30*86400000;
    const lessons=track.lessons.map((l,i)=>{
      if(!l||! /^[A-Za-z0-9_-]{11}$/.test(l.id)||seen.has(l.id)||typeof l.title!=='string'||l.title.length>1000||!Number.isInteger(l.durationSeconds)||l.durationSeconds<0||l.durationSeconds>604800||typeof l.duration!=='string'||l.duration.length>30)throw new Error('Invalid playlist lecture.');
      seen.add(l.id);return {id:l.id,title:expired?`Saved lecture ${i+1}`:l.title,duration:expired?'Refresh needed':l.duration,durationSeconds:expired?0:l.durationSeconds,position:i+1};
    });
    return {id:track.id,playlist:track.playlist,title:expired?'Saved playlist':track.title,creator:expired?'':track.creator,fetchedAt:track.fetchedAt,expired,lessons};
  }
  function add(state,track){
    const existing=catalog(state).find(c=>c.playlist===track.playlist);
    if(existing){state.removed=(state.removed||[]).filter(id=>id!==existing.id);return existing.id;}
    if(state.playlists.length>=100)throw new Error('You can track up to 100 added playlists.');
    const valid=validateTrack(track);state.playlists.push(valid);return valid.id;
  }
  function remove(state,id){if(!catalog(state).some(c=>c.id===id))throw new Error('Unknown playlist.');if(!state.removed.includes(id))state.removed.push(id);}
  root.CourseProgress={catalog,validateTrack,add,remove,KEY,fresh,validate,toggle,duration,entries,seconds,format,known};
})(typeof window!=='undefined'?window:globalThis);
