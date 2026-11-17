const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync(__dirname+'/sync-core.js','utf8'),ctx);const C=ctx.SyncCore,copy=x=>JSON.parse(JSON.stringify(x));
const fresh=()=>({app:'daily-practice',version:3,sheets:{dsa:{goal:3,problems:{}},sql:{goal:3,problems:{}}},activity:{events:[]},courses:{checks:{},events:[],playlists:[],removed:[]}});
let server=null,fail=false,holdGet=null,holdPut=null;
function device(local=fresh()){
 const d={local:copy(local),meta:null,status:'',backups:[],writes:0};
 d.engine=C.create({local:()=>copy(d.local),validate:x=>{assert.equal(x?.version,3);return copy(x);},readMeta:()=>d.meta,writeMeta:m=>d.meta=copy(m),apply:x=>d.local=copy(x),backup:(a,b)=>d.backups.push([copy(a),copy(b)]),status:s=>d.status=s,
 async get(){if(fail)throw Error('offline');if(holdGet)await holdGet;return copy(server);},async put(user,revision,payload){d.writes++;if(holdPut)await holdPut;if(fail)throw Error('offline');if((server?.revision||0)!==revision)return {...copy(server),conflict:true};server={revision:revision+1,payload:copy(payload)};return {...copy(server),conflict:false};}});d.engine.identity('owner');return d;
}
(async()=>{
 const a=device();a.local.sheets.dsa.problems[27]={done:true};await a.engine.sync();assert.equal(a.status,'ready');assert.equal(server,null);await a.engine.enable();assert.equal(server.revision,1);assert.equal(server.payload.sheets.dsa.problems[27].done,true);
 const b=device();await b.engine.enable();assert.equal(b.status,'synced');assert.ok(C.equal(a.local,b.local));assert.equal(b.backups.length,1);
 a.local.sheets.dsa.problems[27].done=false;await a.engine.sync();assert.equal(server.revision,2);await b.engine.sync();assert.equal(b.local.sheets.dsa.problems[27].done,false);
 a.local.sheets.sql.problems[1757]={done:true};b.local.sheets.dsa.problems[27].done=true;await a.engine.sync();await b.engine.sync();assert.equal(b.status,'conflict');assert.equal(server.payload.sheets.dsa.problems[27].done,false);await b.engine.sync('cloud');assert.equal(b.local.sheets.dsa.problems[27].done,false);assert.equal(b.local.sheets.sql.problems[1757].done,true);
 b.local.sheets.sql.problems[1757].done=false;a.local.courses.removed=['design'];await a.engine.sync();await b.engine.sync();assert.equal(b.status,'conflict');await b.engine.sync('local');assert.equal(server.payload.sheets.sql.problems[1757].done,false);assert.ok(b.backups.length>=3);
 fail=true;a.local.sheets.sql.goal=5;const previous=copy(a.local);await a.engine.sync();assert.equal(a.status,'error');assert.deepEqual(a.local,previous);fail=false;
 const other=device();other.meta=copy(a.meta);other.engine.identity('someone-else');await other.engine.sync();assert.equal(other.status,'account');assert.equal(other.writes,0);
 let release;holdGet=new Promise(r=>release=r);const pending=a.engine.sync();a.engine.identity(null);release();await pending;holdGet=null;assert.deepEqual(a.local,previous);
 // First sign-in with two populated copies requires an explicit choice.
 const c=device();c.local.sheets.sql.goal=7;await c.engine.enable();assert.equal(c.status,'conflict');assert.equal(c.writes,0);
 // A local edit arriving while a write is pending is retained for the next sync.
 const d=device();await d.engine.enable();d.local.sheets.dsa.goal=4;holdPut=new Promise(r=>release=r);const writing=d.engine.sync();await new Promise(r=>setImmediate(r));d.local.sheets.dsa.goal=6;release();await writing;holdPut=null;assert.equal(d.status,'pending');assert.equal(d.local.sheets.dsa.goal,6);await d.engine.sync();assert.equal(server.payload.sheets.dsa.goal,6);
 // A conflicting server revision never overwrites either side.
 const e=device();await e.engine.enable();e.local.sheets.sql.goal=2;holdPut=new Promise(r=>release=r);const racing=e.engine.sync();await new Promise(r=>setImmediate(r));server={revision:server.revision+1,payload:copy(server.payload)};server.payload.sheets.sql.goal=9;release();await racing;holdPut=null;assert.equal(e.status,'conflict');assert.equal(server.payload.sheets.sql.goal,9);assert.equal(e.local.sheets.sql.goal,2);
 console.log('PASS: first-device migration; new-device download; unchecks; offline retention; two-device conflict recovery; account isolation; sign-out during reads; edits during uploads; revision race protection.');
})().catch(e=>{console.error(e);process.exitCode=1;});
