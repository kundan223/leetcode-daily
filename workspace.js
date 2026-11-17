(function(root){
  'use strict';
  const KEYS={dsa:root.Progress.KEY,sql:'daily-practice-kundan-sql-v1',activity:'daily-practice-kundan-activity-v1'};
  const actions=['completed','reopened','review','unreview','recovered'];
  function validDate(value){
    if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
    const date=new Date(`${value}T12:00:00`);
    return Number.isFinite(date.getTime())&&root.Progress.day(date)===value;
  }
  function validateActivity(value,catalog){
    if(!value||value.version!==1||!Array.isArray(value.events))throw new Error('Invalid activity backup.');
    const seen=new Set();
    const events=value.events.map(e=>{
      if(!e||typeof e.key!=='string'||seen.has(e.key)||!catalog[e.sheet]?.has(e.id)||!actions.includes(e.action)||(e.date!==null&&!validDate(e.date))||(e.at!==null&&(typeof e.at!=='string'||!Number.isFinite(Date.parse(e.at)))))throw new Error('Invalid activity entry.');
      seen.add(e.key);
      return {key:e.key,sheet:e.sheet,id:e.id,action:e.action,date:e.date,at:e.at};
    });
    return {version:1,events};
  }
  function recover(journal,states){
    for(const [sheet,state] of Object.entries(states))for(const [id,item] of Object.entries(state.problems)){
      if(!item.done||journal.events.some(e=>e.sheet===sheet&&e.id===Number(id)&&['completed','recovered'].includes(e.action)&&e.date===(validDate(item.completedOn)?item.completedOn:null)))continue;
      journal.events.push({key:`recovered:${sheet}:${id}:${item.completedOn||'unknown'}`,sheet,id:Number(id),action:'recovered',date:validDate(item.completedOn)?item.completedOn:null,at:null});
    }
    return journal;
  }
  function record(journal,sheet,id,action,now=new Date()){
    journal.events.push({key:root.crypto.randomUUID(),sheet,id,action,date:root.Progress.day(now),at:now.toISOString()});
  }
  function daily(events,sheet='all'){
    const counts=new Map();
    for(const e of events){
      if(!e.date||(sheet!=='all'&&e.sheet!==sheet)||!['completed','recovered'].includes(e.action))continue;
      if(!counts.has(e.date))counts.set(e.date,new Set());
      counts.get(e.date).add(`${e.sheet}:${e.id}`);
    }
    return new Map([...counts].map(([date,ids])=>[date,ids.size]));
  }
  function calendar(year,now=new Date()){
    const first=new Date(year,0,1,12),end=new Date(year,11,31,12),start=new Date(first);
    start.setDate(first.getDate()-first.getDay());
    const cells=[],today=root.Progress.day(now);
    for(const d=new Date(start);d<=end;d.setDate(d.getDate()+1)){
      const date=root.Progress.day(d);cells.push({date,inYear:d.getFullYear()===year,future:date>today,month:d.getDate()===1?d.getMonth():null});
    }
    return cells;
  }
  function validateBackup(value,catalog){
    // Original v1 exports always belong to DSA, regardless of the selected sheet.
    if(value?.version===1)return {legacy:true,dsa:root.Progress.validate(value,catalog.dsa)};
    if(value?.version!==2||value.app!=='daily-practice'||!value.sheets)throw new Error('This is not a Daily Practice backup.');
    return {legacy:false,dsa:root.Progress.validate(value.sheets.dsa,catalog.dsa),sql:root.Progress.validate(value.sheets.sql,catalog.sql),activity:validateActivity(value.activity,catalog)};
  }
  root.Workspace={KEYS,validDate,validateActivity,recover,record,daily,calendar,validateBackup};
})(typeof window!=='undefined'?window:globalThis);
