const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
async function render(response){
  const nodes=new Map(),get=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',innerHTML:'',hidden:false,disabled:false,addEventListener(){}});return nodes.get(id);};
  const ctx={document:{getElementById:get,addEventListener(){}},window:{},Intl,Date,console,setInterval(){},fetch:async()=>response};
  vm.createContext(ctx);vm.runInContext(fs.readFileSync(__dirname+'/insights.js','utf8'),ctx);vm.runInContext(fs.readFileSync(__dirname+'/profile.js','utf8'),ctx);
  await new Promise(resolve=>setImmediate(resolve));return get;
}
(async()=>{
  const snapshot=JSON.parse(fs.readFileSync(__dirname+'/platform-data.json','utf8'));
  let get=await render({ok:true,json:async()=>snapshot});
  assert.equal(get('codeforces-handle').textContent,'nonChalak');
  assert.equal(get('codeforces-link').href,'https://codeforces.com/profile/nonChalak');
  assert.match(get('leetcode-metrics').innerHTML,/Solved/);assert.match(get('codeforces-metrics').innerHTML,/Rated contests/);
  assert.equal(get('refresh-profile').disabled,false);
  snapshot.handles.codeforces=null;snapshot.codeforces={data:null};
  snapshot.leetcodeContests={data:[{title:'<img onerror=alert(1)>',slug:'test',startTime:9999999999,duration:5400}],updatedAt:new Date().toISOString()};
  get=await render({ok:true,json:async()=>snapshot});
  assert.equal(get('codeforces-link').hidden,true);assert.match(get('codeforces-status').textContent,/No account has been assumed/);
  assert.match(get('leetcode-contests').innerHTML,/&lt;img/);assert.ok(!get('leetcode-contests').innerHTML.includes('<img'));
  get=await render({ok:false});assert.match(get('profile-message').textContent,/saved roadmap is unaffected/);assert.equal(get('refresh-profile').disabled,false);
  console.log('PASS: profile rendering, confirmed handle, no-handle state, unavailable data, escaped contest titles and reload recovery.');
})().catch(error=>{console.error(error);process.exitCode=1;});
