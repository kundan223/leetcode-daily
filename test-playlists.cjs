const {JSDOM}=require('jsdom'),fs=require('node:fs'),assert=require('node:assert/strict');
const id='PLabcdefghijk123456789',link=`https://www.youtube.com/playlist?list=${id}`;
const payload={id,title:'<img src=x onerror=alert(1)> Course',channel:{title:'Test creator'},itemCount:120,truncated:false,videos:Array.from({length:120},(_,i)=>({id:`test${String(i).padStart(7,'0')}`,title:`Lecture ${i+1}`,seconds:2461,n:i+1}))};
function boot(saved){
 const dom=new JSDOM(fs.readFileSync(__dirname+'/index.html','utf8'),{url:'https://kundan223.github.io/leetcode-daily/#courses',runScripts:'outside-only'}),w=dom.window;
 if(saved)w.localStorage.setItem('daily-practice-kundan-courses-v1',JSON.stringify(saved));
 w.setInterval=()=>0;w.confirm=()=>true;w.matchMedia=()=>({matches:true});w.HTMLElement.prototype.scrollIntoView=function(){};
 w.calls=[];w.response=payload;w.fetch=async(url,options)=>{if(url.includes('playlistduration.com')){w.calls.push({url,options});if(w.failure)throw new TypeError('offline');return {ok:true,json:async()=>w.response};}return {ok:true,json:async()=>JSON.parse(fs.readFileSync(__dirname+'/platform-data.json','utf8'))};};
 for(const script of w.document.querySelectorAll('script[src]'))w.eval(fs.readFileSync(__dirname+'/'+script.getAttribute('src').split('?')[0],'utf8'));
 return dom;
}
const settle=()=>new Promise(r=>setImmediate(r));
async function submit(w,url=link){w.document.getElementById('playlist-url').value=url;w.document.getElementById('playlist-form').dispatchEvent(new w.Event('submit',{cancelable:true}));await settle();}
(async()=>{
 let dom=boot(),w=dom.window,$=s=>w.document.querySelector(s),C=w.CourseProgress;
 const original=C.fresh();C.toggle(original,'design','AK0hu0Zxua4',true);w.CourseView.restore(original);
 assert.throws(()=>w.PlaylistImport.parse('https://evil.example/?list='+id));assert.throws(()=>w.PlaylistImport.parse('javascript:alert(1)'));
 const event=new w.Event('drop',{bubbles:true,cancelable:true});Object.defineProperty(event,'dataTransfer',{value:{getData:type=>type==='text/uri-list'?link:''}});$('#playlist-drop').dispatchEvent(event);assert.equal($('#playlist-url').value,link);
 await submit(w);assert.equal(w.CourseView.catalog().length,3);assert.equal($(`#yt_${id}-checklist`).children.length,120);assert.equal($('#playlist-grid img'),null);assert.ok($('#playlist-grid').textContent.includes(payload.title));
 assert.equal(w.calls.length,1);assert.equal(w.calls[0].options.credentials,'omit');assert.equal(w.calls[0].options.referrerPolicy,'no-referrer');
 const lesson=`#lesson-yt_${id}-test0000000`;$(lesson).click();assert.equal(C.seconds(w.CourseView.snapshot(),`yt_${id}`),2520);assert.ok($('#activity-ledger').textContent.includes('Lecture 1'));assert.ok($('#activity-ledger').textContent.includes('42m'));
 $(lesson).click();assert.equal(C.seconds(w.CourseView.snapshot(),`yt_${id}`),0);assert.ok(!$('#activity-ledger').textContent.includes('Lecture 1'));$(lesson).click();
 $(`.remove-playlist[data-track="yt_${id}"]`).click();assert.equal(w.CourseView.catalog().length,2);assert.equal(C.seconds(w.CourseView.snapshot(),`yt_${id}`),0);assert.equal(w.CourseView.snapshot().checks[`yt_${id}:test0000000`].done,true);
 $(`.restore-playlist[data-track="yt_${id}"]`).click();assert.equal($(lesson).checked,true);assert.equal(C.seconds(w.CourseView.snapshot(),`yt_${id}`),2520);
 await submit(w);assert.equal(w.calls.length,1);assert.equal(w.CourseView.catalog().length,3);assert.equal(C.seconds(w.CourseView.snapshot(),'design'),1500);
 const saved=JSON.parse(w.localStorage.getItem(C.KEY));const old={version:1,checks:original.checks,events:original.events};assert.equal(C.seconds(C.validate(old),'design'),1500);assert.equal(C.validate(old).playlists.length,0);
 assert.equal(C.validate(saved).playlists[0].lessons.length,120);assert.throws(()=>C.validate({...saved,playlists:[{...saved.playlists[0],id:'__proto__'}]}));
 const expired=JSON.parse(JSON.stringify(saved));expired.playlists[0].fetchedAt=Date.now()-31*86400000;const pruned=C.validate(expired);assert.equal(pruned.playlists[0].expired,true);assert.equal(pruned.playlists[0].title,'Saved playlist');assert.equal(C.seconds(pruned,`yt_${id}`),2520);
 assert.throws(()=>w.PlaylistImport.convert({...payload,truncated:true},id));assert.throws(()=>w.PlaylistImport.convert({...payload,itemCount:121},id));
 const partial=w.PlaylistImport.convert({...payload,itemCount:2,videos:[payload.videos[0],{id:'private0000',unavailable:true,seconds:0}]},id);assert.equal(partial.skipped,1);assert.equal(partial.track.lessons.length,1);
 const before=JSON.stringify(w.CourseView.snapshot());w.response={...payload,id:'PLfailure123456789',truncated:true};await submit(w,'https://www.youtube.com/playlist?list=PLfailure123456789');assert.equal(JSON.stringify(w.CourseView.snapshot()),before);assert.match($('#playlist-status').textContent,/incomplete/);assert.equal($('#add-playlist').disabled,false);
 w.failure=true;await submit(w,'https://www.youtube.com/playlist?list=PLfailure123456789');assert.match($('#playlist-status').textContent,/connection/);assert.equal(JSON.stringify(w.CourseView.snapshot()),before);
 dom.window.close();dom=boot(saved);w=dom.window;assert.equal(w.CourseView.catalog().length,3);assert.equal(w.CourseProgress.seconds(w.CourseView.snapshot(),`yt_${id}`),2520);dom.window.close();
 console.log('PASS: link drop and validation; 120-lecture import; title escaping; duplicate prevention; remove/restore; duration credits and ledger updates; legacy and custom backup/reload; metadata expiry; incomplete/offline import leaves progress intact.');
})().catch(error=>{console.error(error);process.exitCode=1;});
