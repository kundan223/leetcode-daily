const {JSDOM}=require('jsdom'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=__dirname;
function boot(saved={},hash=''){
  const dom=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'),{url:'https://kundan223.github.io/leetcode-daily/'+hash,runScripts:'outside-only'});
  const w=dom.window;for(const [k,v] of Object.entries(saved))w.localStorage.setItem(k,v);
  w.setInterval=()=>0;w.confirm=()=>true;w.matchMedia=()=>({matches:true});w.scrollTo=()=>{};
  w.HTMLElement.prototype.scrollIntoView=function(){};
  w.Blob=class{constructor(parts){this.content=parts.join('');}};
  w.URL.createObjectURL=b=>{w.exported=JSON.parse(b.content);return 'blob:test'};w.URL.revokeObjectURL=()=>{};
  w.HTMLAnchorElement.prototype.click=function(){};
  w.fetch=async()=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(path.join(root,'platform-data.json'),'utf8'))});
  for(const script of w.document.querySelectorAll('script[src]'))w.eval(fs.readFileSync(path.join(root,script.getAttribute('src').split('?')[0]),'utf8'));
  return dom;
}
function route(w,hash){w.history.replaceState(null,'',hash);w.dispatchEvent(new w.HashChangeEvent('hashchange'));}
function change(w,id,value){const el=w.document.querySelector(id);el.value=value;el.dispatchEvent(new w.Event('change',{bubbles:true}));}
function check(w,id,done){const el=w.document.querySelector(`.problem-check[data-id="${id}"]`);assert.ok(el);el.checked=done;el.dispatchEvent(new w.Event('change',{bubbles:true}));}
async function restore(w,backup){const input=w.document.querySelector('#import');Object.defineProperty(input,'files',{value:[{size:100,text:async()=>JSON.stringify(backup)}],configurable:true});input.dispatchEvent(new w.Event('change'));await new Promise(r=>setImmediate(r));}
(async()=>{
  const yesterday=new Date();yesterday.setDate(yesterday.getDate()-1);const stamp=`${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`;
  const old={version:1,goal:5,problems:{27:{done:true,review:true,completedOn:stamp}}},oldJSON=JSON.stringify(old);
  let dom=boot({'daily-practice-kundan-v1':oldJSON}),w=dom.window,$=s=>w.document.querySelector(s);
  assert.equal($('#problems').children.length,242);assert.equal($('#topics').children.length,23);assert.equal($('#done').textContent,'1');
  assert.equal(w.localStorage.getItem(w.Progress.KEY),oldJSON);assert.equal(JSON.parse(w.localStorage.getItem(w.Workspace.KEYS.activity)).events[0].date,stamp);
  const score=$('#practice-score').textContent;
  route(w,'#sql');assert.equal($('#problems').children.length,50);assert.equal($('#topics').children.length,8);assert.equal($('#overall-bar').max,50);assert.equal($('#done').textContent,'0');assert.equal($('#goal').value,'3');
  assert.equal($('#sql-tab').getAttribute('aria-current'),'page');assert.ok($('#topics').textContent.includes('Basic Joins'));assert.equal($('#sql-source').hidden,false);
  check(w,1757,true);check(w,1757,false);check(w,1757,true);
  assert.equal(w.localStorage.getItem(w.Progress.KEY),oldJSON);assert.equal($('#practice-score').textContent,score);
  assert.equal(JSON.parse(w.localStorage.getItem(w.Workspace.KEYS.sql)).problems[1757].done,true);
  $('.review-button[data-id="1757"]').click();change(w,'#goal','2');
  const journal=JSON.parse(w.localStorage.getItem(w.Workspace.KEYS.activity));assert.equal(journal.events.length,5);
  const day=w.Progress.day();assert.equal(w.Workspace.daily(journal.events,'sql').get(day),1);
  $('#search').value='tweets';$('#search').dispatchEvent(new w.Event('input'));assert.equal($('#problems').children.length,1);
  route(w,'#sheet');assert.equal($('#done').textContent,'1');assert.equal($('#goal').value,'5');assert.equal($('#problems').children.length,242);assert.equal($('.problem-check[data-id="27"]').checked,true);
  route(w,'#sql');assert.equal($('#search').value,'tweets');assert.equal($('#problems').children.length,1);assert.equal($('#goal').value,'2');
  route(w,'#contests');assert.equal($('#contests-panel').hidden,false);assert.equal($('#sheet-panel').hidden,true);assert.equal($('#contests-tab').getAttribute('aria-current'),'page');
  assert.ok($('#contests-panel').contains($('#leetcode-contests')));assert.ok($('#contests-panel').contains($('#codeforces-contests')));assert.equal($('#sheet-panel').querySelector('.contest-section'),null);
  route(w,'#courses');assert.equal($('#courses-panel').hidden,false);assert.equal($('#contests-panel').hidden,true);assert.equal($('#courses-tab').getAttribute('aria-current'),'page');
  const players=[...w.document.querySelectorAll('iframe[data-playlist-src]')];assert.equal(players.length,2);
  assert.ok(players[0].src.includes('list=PLQEaRBV9gAFvzp6XhcNFpk1WdOcyVo9qT'));assert.ok(players[1].src.includes('0Rwb4Xmlcwc?list=PLui3EUkuMTPgZcV0QhQrOcwMPcBCcd_Q1'));
  for(const player of players){assert.match(player.src,/^https:\/\/www.youtube-nocookie.com\/embed\//);assert.ok(player.title);}
  assert.equal(w.localStorage.getItem(w.Progress.KEY),oldJSON);
  route(w,'#sql');assert.equal($('#search').value,'tweets');assert.equal($('#goal').value,'2');assert.equal($('#problems').children.length,1);assert.ok(players.every(p=>!p.hasAttribute('src')));
  route(w,'#profile');assert.equal($('#sheet-panel').hidden,true);assert.equal($('#profile-panel').hidden,false);
  assert.equal($('#profile-panel').lastElementChild.className,'ledger-section');assert.ok($('#profile-panel').firstElementChild.contains($('#activity-grid')));assert.ok($('#profile-panel').lastElementChild.contains($('#activity-ledger')));
  $('#jump-ledger').click();assert.equal(w.document.activeElement.id,'ledger-title');
  assert.ok($('#activity-ledger').textContent.includes('Reopened'));assert.ok($('#activity-ledger').textContent.includes('Added to revisit'));
  change(w,'#activity-sheet','sql');assert.ok(!$('#activity-ledger').textContent.includes('Remove Element'));
  $(`[data-day="${day}"]`).click();assert.equal($('#clear-activity-day').hidden,false);assert.ok($('#activity-ledger').textContent.includes('Recyclable and Low Fat Products'));
  $('#export').click();assert.equal(w.exported.version,2);assert.equal(w.exported.sheets.sql.problems[1757].review,true);assert.equal(w.exported.activity.events.length,5);
  const fullBackup=JSON.parse(JSON.stringify(w.exported)),sqlBefore=w.localStorage.getItem(w.Workspace.KEYS.sql);
  await restore(w,{version:1,goal:1,problems:{27:{done:false,review:false,completedOn:null}}});assert.equal(w.localStorage.getItem(w.Workspace.KEYS.sql),sqlBefore);assert.equal(JSON.parse(w.localStorage.getItem(w.Progress.KEY)).problems[27].done,false);
  await restore(w,fullBackup);assert.equal(JSON.parse(w.localStorage.getItem(w.Progress.KEY)).problems[27].done,true);
  const snapshot=Object.fromEntries(Object.keys(w.Workspace.KEYS).map(k=>[w.Workspace.KEYS[k],w.localStorage.getItem(w.Workspace.KEYS[k])]));
  await restore(w,{version:2,app:'daily-practice',sheets:{}});assert.equal(w.localStorage.getItem(w.Progress.KEY),snapshot[w.Progress.KEY]);
  dom.window.close();dom=boot(snapshot,'#sql');w=dom.window;
  assert.equal(w.document.querySelector('#done').textContent,'1');assert.equal(JSON.parse(w.localStorage.getItem(w.Workspace.KEYS.activity)).events.length,5);
  dom.window.close();
  const invalid='broken-json';dom=boot({'daily-practice-kundan-v1':invalid});w=dom.window;check(w,27,true);assert.equal(w.localStorage.getItem(w.Progress.KEY),invalid);assert.match(w.document.querySelector('#save-state').textContent,/Not saved/);dom.window.close();
  console.log('PASS: full DOM integration: legacy progress, SQL switching/sidebar, isolated goals/filters, completion/reopen/revisit journal, heatmap filtering, v1/v2 backup import/export, reload and corrupt-storage protection.');
})().catch(e=>{console.error(e);process.exitCode=1});
