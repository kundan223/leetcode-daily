const {JSDOM}=require('jsdom'),fs=require('node:fs'),assert=require('node:assert/strict');
async function boot(owns=true){
  const dom=new JSDOM(fs.readFileSync(__dirname+'/index.html','utf8'),{url:'https://kundan223.github.io/leetcode-daily/#courses',runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window,intervals=[],instances=new Map();let clock=0,hidden=false;
  w.setInterval=(fn,ms)=>{intervals.push({fn,ms});return intervals.length};w.setTimeout=()=>0;w.confirm=()=>true;
  Object.defineProperty(w.performance,'now',{value:()=>clock});Object.defineProperty(w.document,'hidden',{get:()=>hidden});
  Object.defineProperty(w.navigator,'locks',{value:{request:async(name,options,callback)=>callback(owns?{}:null)}});
  w.fetch=async()=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(__dirname+'/platform-data.json','utf8'))});
  w.YT={Player:class{
    constructor(node,{events}){this.course=node.dataset.courseFrame;this.id=this.course==='design'?'AK0hu0Zxua4':'0Rwb4Xmlcwc';this.state=2;this.position=0;this.rate=1;this.events=events;instances.set(this.course,this);}
    getVideoUrl(){return 'https://www.youtube.com/watch?v='+this.id}
    getCurrentTime(){return this.position}getPlayerState(){return this.state}getPlaybackRate(){return this.rate}
    loadVideoById(id){this.id=id;this.position=0;this.state=1;this.events.onStateChange({data:1,target:this})}
    pauseVideo(){if(this.state!==2){this.state=2;this.events.onStateChange({data:2,target:this})}}
    destroy(){this.destroyed=true}
  }};
  for(const script of w.document.querySelectorAll('script[src]'))w.eval(fs.readFileSync(__dirname+'/'+script.getAttribute('src').split('?')[0],'utf8'));
  for(const player of instances.values())player.events.onReady({target:player});await Promise.resolve();
  return {dom,w,instances,advance(ms,delta=ms/1000){clock+=ms;for(const player of instances.values())if(player.state===1)player.position+=delta;for(const timer of intervals)if(timer.ms===1000)timer.fn();},hide(){hidden=true;w.document.dispatchEvent(new w.Event('visibilitychange'));},show(){hidden=false;w.document.dispatchEvent(new w.Event('visibilitychange'));}};
}
(async()=>{
  let env=await boot(),{w,instances}=env,design=instances.get('design'),backend=instances.get('backend');
  const total=()=>w.CourseProgress.seconds(w.CourseView.snapshot(),'design');
  design.loadVideoById('AK0hu0Zxua4');for(let i=0;i<5;i++)env.advance(1000);assert.equal(total(),5);
  design.pauseVideo();env.advance(1000);assert.equal(total(),5);
  design.loadVideoById('AK0hu0Zxua4');env.advance(1000,100);assert.equal(total(),5); // seek is not viewing
  env.advance(1000,0);assert.equal(total(),5); // stalled playback
  design.rate=2;design.events.onPlaybackRateChange();env.advance(1000,2);env.advance(1000,2);assert.equal(total(),6); // one baseline interval, then 1 real second
  env.advance(20000,40);assert.equal(total(),6); // sleep / throttled gap
  env.hide();env.advance(1000,2);assert.equal(total(),6);assert.equal(design.state,2);
  await new Promise(r=>setImmediate(r));env.show();await new Promise(r=>setImmediate(r));
  backend.loadVideoById('0Rwb4Xmlcwc');env.advance(1000);env.advance(1000);w.CourseView.snapshot();assert.equal(w.CourseProgress.seconds(w.CourseView.snapshot(),'backend'),2);
  design.loadVideoById('QbGoqAgP_zg');assert.equal(backend.state,2);env.advance(1000,2);env.advance(1000,2);assert.equal(w.CourseProgress.seconds(w.CourseView.snapshot(),'design','QbGoqAgP_zg'),2);
  w.history.replaceState(null,'','#profile');w.dispatchEvent(new w.HashChangeEvent('hashchange'));assert.equal(design.destroyed,true);assert.ok(w.document.querySelector('#activity-ledger').textContent.includes('Tracked watch time'));
  assert.equal(w.CourseView.snapshot().checks['design:AK0hu0Zxua4'],undefined); // never silently completes a lecture
  const stored=JSON.parse(w.localStorage.getItem(w.CourseProgress.KEY));assert.equal(stored.events.filter(e=>e.action==='watched').reduce((n,e)=>n+e.seconds,0),10);
  env.dom.window.close();
  env=await boot(false);env.instances.get('design').loadVideoById('AK0hu0Zxua4');for(let i=0;i<6;i++)env.advance(1000);assert.equal(env.w.CourseView.snapshot().events.length,0);env.dom.window.close();
  console.log('PASS: mocked YouTube integration: checkpoints, pause, seek, stalled playback, rate changes, sleep, hidden tabs, exclusive timer ownership, video switching, teardown and ledger persistence.');
})().catch(e=>{console.error(e);process.exitCode=1});
