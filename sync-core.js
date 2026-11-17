(function(root){
  'use strict';
  const copy=value=>JSON.parse(JSON.stringify(value));
  function canonical(value){
    if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
    if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
    return JSON.stringify(value);
  }
  const equal=(a,b)=>canonical(a)===canonical(b);
  function empty(data){return !Object.values(data.sheets).some(s=>Object.keys(s.problems).length||s.goal!==3)&&!data.activity.events.length&&!Object.keys(data.courses.checks).length&&!data.courses.events.length&&!data.courses.playlists.length&&!data.courses.removed.length;}
  function create(io){
    let user=null,generation=0,busy=false,conflict=null;
    const report=(status,message)=>io.status(status,message);
    const valid=row=>{if(!row)return {revision:0,payload:null};if(!Number.isSafeInteger(row.revision)||row.revision<0||(row.revision===0&&row.payload!==null))throw new Error('Invalid cloud revision.');return {revision:row.revision,payload:row.payload===null?null:io.validate(row.payload)};};
    function identity(next){if(next!==user){user=next;generation++;conflict=null;} }
    async function sync(choice){
      if(busy||!user)return;
      const who=user,epoch=generation,still=()=>user===who&&generation===epoch;
      const meta=io.readMeta();
      if(meta?.user&&meta.user!==who){report('account','This browser belongs to a different sync account. Sign in to that account or use a separate browser profile.');return;}
      if(!meta?.enabled){report('ready','Sign-in complete. Enable sync to connect this browser and migrate its saved progress.');return;}
      busy=true;report('working','Syncing…');
      try{
        let remote=valid(await io.get(who));if(!still())return;
        const local=io.validate(io.local());
        const baseline=meta.base?io.validate(meta.base):null;
        if(choice&&(!conflict||!equal(remote,conflict.remote))){choice=null;}
        if(equal(local,remote.payload)){
          io.writeMeta({user:who,enabled:true,revision:remote.revision,base:remote.payload});conflict=null;report('synced','All progress synced.');return;
        }
        const pull=remote.payload&&(choice==='cloud'||(!baseline&&empty(local))||(baseline&&equal(local,baseline)));
        const push=choice==='local'||(!remote.payload&&(!baseline||meta.revision===0))||(baseline&&equal(remote.payload,baseline));
        if(pull){
          io.backup(local,remote.payload);io.apply(remote.payload);
          io.writeMeta({user:who,enabled:true,revision:remote.revision,base:remote.payload});conflict=null;report('synced','Cloud progress loaded. All progress synced.');return;
        }
        if(!push){conflict={remote:copy(remote)};report('conflict','This browser and the cloud have different changes. Choose which complete copy to keep. Both copies will be saved in a recovery backup.');return;}
        if(choice==='local')io.backup(local,remote.payload);
        const response=await io.put(who,remote.revision,local);if(!still())return;
        const saved=valid(response);
        if(response.conflict){conflict={remote:copy(saved)};report('conflict','Another device saved changes. Review the two copies before replacing either one.');return;}
        io.writeMeta({user:who,enabled:true,revision:saved.revision,base:local});conflict=null;
        report(equal(io.local(),local)?'synced':'pending',equal(io.local(),local)?'All progress synced.':'New changes are saved locally and waiting to sync.');
      }catch(error){if(still())report('error',error.message||'Cloud sync failed. Your local progress is kept.');}
      finally{busy=false;}
    }
    function enable(){if(!user)return;const meta=io.readMeta();if(meta?.user&&meta.user!==user){report('account','Sign in to the account already linked to this browser.');return;}io.writeMeta({...meta,user,enabled:true});return sync();}
    return {identity,sync,enable};
  }
  root.SyncCore={create,equal,empty,canonical};
})(typeof window!=='undefined'?window:globalThis);
