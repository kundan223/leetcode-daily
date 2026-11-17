const {JSDOM}=require('jsdom'),fs=require('node:fs'),assert=require('node:assert/strict');
const copy=x=>JSON.parse(JSON.stringify(x)),tick=async()=>{for(let i=0;i<4;i++)await new Promise(r=>setImmediate(r));};
function boot(configured=true){
 const dom=new JSDOM(fs.readFileSync(__dirname+'/index.html','utf8'),{url:'https://kundan223.github.io/leetcode-daily/',runScripts:'outside-only'}),w=dom.window;
 w.setInterval=()=>0;w.matchMedia=()=>({matches:true});w.HTMLElement.prototype.scrollIntoView=function(){};
 w.fetch=async()=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(__dirname+'/platform-data.json','utf8'))});
 const key='daily-practice-kundan-v1',legacy={version:1,goal:3,problems:{27:{done:true,review:false,completedOn:'2026-11-17'}}};w.localStorage.setItem(key,JSON.stringify(legacy));
 let session={user:{id:'owner',email:'owner@example.com'}},callback;
 const service={row:null,puts:0};
 w.supabase={createClient:(url,publicKey)=>{
  assert.equal(url,'https://exampleproject.supabase.co');assert.equal(publicKey,'sb_publishable_test');
  return {auth:{onAuthStateChange:fn=>callback=fn,getSession:async()=>({data:{session}}),signOut:async()=>{session=null;callback('SIGNED_OUT',null);return{};},signInWithPassword:async({password})=>{assert.equal(password,'password123');session={user:{id:'owner',email:'owner@example.com'}};callback('SIGNED_IN',session);return {data:{session}};}},
  from:table=>{assert.equal(table,'practice_state');return{select:()=>({eq:(_,id)=>{assert.equal(id,'owner');return{maybeSingle:async()=>({data:copy(service.row)})};}})};},
  rpc:async(name,args)=>{assert.equal(name,'save_practice_state');assert.equal(args.p_user,'owner');service.puts++;service.row={revision:(service.row?.revision||0)+1,payload:copy(args.p_payload)};return{data:{...copy(service.row),conflict:false}};}};
 }};
 for(const script of w.document.querySelectorAll('script[src]')){const name=script.getAttribute('src').split('?')[0];w.eval(fs.readFileSync(__dirname+'/'+name,'utf8'));if(name==='supabase-config.js')w.SUPABASE_CONFIG=configured?{url:'https://exampleproject.supabase.co',publishableKey:'sb_publishable_test'}:{url:'',publishableKey:''};}
 return {dom,w,service,legacy};
}
(async()=>{
 let {dom,w,service,legacy}=boot(false);await tick();assert.equal(w.document.querySelector('#cloud-auth').hidden,true);assert.match(w.document.querySelector('#cloud-status').textContent,/not configured/);assert.deepEqual(JSON.parse(w.localStorage.getItem(w.Progress.KEY)),legacy);assert.equal(w.document.querySelector('script[src="supabase-sdk.js"]'),null);dom.window.close();
 ({dom,w,service,legacy}=boot());let $=s=>w.document.querySelector(s);await tick();assert.equal(service.puts,0);assert.match($('#cloud-status').textContent,/Enable sync/);
 $('#cloud-enable').click();await tick();assert.equal(service.puts,1);assert.equal(service.row.payload.sheets.dsa.problems[27].done,true);assert.match($('#cloud-short-status').textContent,/Cloud synced/);
 const checkbox=$('.problem-check[data-id="27"]');checkbox.checked=false;checkbox.dispatchEvent(new w.Event('change',{bubbles:true}));$('#cloud-sync-now').click();await tick();assert.equal(service.row.payload.sheets.dsa.problems[27].done,false);
 service.row.payload.sheets.sql.problems[1757]={done:true,review:false,completedOn:'2026-11-17'};service.row.revision++;$('#cloud-sync-now').click();await tick();assert.equal(w.TrackerState.snapshot().sheets.sql.problems[1757].done,true);assert.equal($('#cloud-download-recovery').hidden,false);
 const before=w.TrackerState.snapshot();assert.throws(()=>w.TrackerState.apply({version:3,sheets:{}}));assert.deepEqual(w.TrackerState.snapshot(),before);
 $('#cloud-signout').click();await tick();assert.equal($('#cloud-auth').hidden,false);assert.equal(w.TrackerState.snapshot().sheets.sql.problems[1757].done,true);
 $('#cloud-email').value='owner@example.com';$('#cloud-password').value='password123';$('#cloud-auth').dispatchEvent(new w.Event('submit',{cancelable:true}));await tick();assert.equal($('#cloud-password').value,'');assert.equal($('#cloud-account').hidden,false);
 dom.window.close();console.log('PASS: real app adapter, configured sign-in UI, explicit migration, cloud unchecks, cloud download, backup preservation, malformed-cloud protection, local-copy retention on sign-out and password clearing.');
})().catch(e=>{console.error(e);process.exitCode=1;});
