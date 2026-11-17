(() => {
  'use strict';
  const C=window.CourseProgress,P=window.Progress,tracks=window.COURSES;
  const $=id=>document.getElementById(id);
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let state=C.fresh(),writable=true,active=false,apiRequested=false,lockHeld=false,lockPending=false,releaseLock=null,lastSave=0;
  const players=new Map(),frames=new Map();
  const status=message=>{$('course-tracking-status').textContent=message;};
  try{const saved=localStorage.getItem(C.KEY);if(saved)state=C.validate(JSON.parse(saved));}catch{writable=false;}
  function notify(){document.dispatchEvent(new CustomEvent('coursechange'));}
  function save(){
    try{if(!writable)throw new Error();localStorage.setItem(C.KEY,JSON.stringify(state));$('course-save-state').textContent='Course progress and watch time saved in this browser.';}
    catch{$('course-save-state').textContent='Course changes are not saved. Export a backup before leaving. Existing unreadable data has been kept.';}
    update();notify();
  }
  function update(){
    for(const track of tracks){
      const done=track.lessons.filter(l=>state.checks[`${track.id}:${l.id}`]?.done).length;
      $(`${track.id}-course-summary`).textContent=`${done} / ${track.lessons.length} complete · ${C.format(C.seconds(state,track.id))} watched`;
      for(const lesson of track.lessons){
        $(`lesson-${track.id}-${lesson.id}`).checked=!!state.checks[`${track.id}:${lesson.id}`]?.done;
        $(`time-${track.id}-${lesson.id}`).textContent=`${C.format(C.seconds(state,track.id,lesson.id))} watched`;
      }
    }
  }
  for(const track of tracks){
    const list=$(`${track.id}-checklist`);
    list.innerHTML=track.lessons.map(l=>`<li><input id="lesson-${track.id}-${l.id}" type="checkbox" data-course="${track.id}" data-lesson="${l.id}" aria-label="Mark ${escape(l.title)} complete"><div><label for="lesson-${track.id}-${l.id}">${l.position}. ${escape(l.title)}</label><span class="lesson-meta">Length ${escape(l.duration)} · <span id="time-${track.id}-${l.id}">0s watched</span></span></div><button class="text-button lesson-play" data-course="${track.id}" data-lesson="${l.id}" aria-label="Play ${escape(l.title)}">Play</button></li>`).join('');
    list.addEventListener('change',e=>{if(!e.target.matches('input[data-lesson]'))return;flushAll();C.toggle(state,track.id,e.target.dataset.lesson,e.target.checked);save();});
    list.addEventListener('click',e=>{
      const b=e.target.closest('.lesson-play');if(!b)return;
      const rec=players.get(track.id);flushAll();
      if(rec?.ready){rec.previous=null;rec.session=null;rec.player.loadVideoById(b.dataset.lesson);}
      else status('Player is still loading or unavailable. Use the YouTube link and manually log watched time if needed.');
    });
    const form=$(`${track.id}-manual-time`);
    form.elements.lesson.innerHTML=track.lessons.map(l=>`<option value="${l.id}">${l.position}. ${escape(l.title)}</option>`).join('');
    form.elements.date.value=P.day();form.elements.date.max=P.day();
    form.addEventListener('submit',e=>{
      e.preventDefault();const date=form.elements.date.value,seconds=Math.round(Number(form.elements.minutes.value)*60);
      if(!window.Workspace.validDate(date)||date>P.day()||seconds<1||seconds>86400){status('Choose a valid date through today and between 0.1 and 1440 minutes.');return;}
      C.watch(state,{key:crypto.randomUUID(),course:track.id,id:form.elements.lesson.value,date,at:new Date().toISOString(),seconds,manual:true});
      save();form.elements.minutes.value='';status('Manual watch time added to the ledger. Completion checkboxes are separate.');
    });
    const iframe=document.querySelector(`[data-course-frame="${track.id}"]`);frames.set(track.id,{node:iframe,template:iframe.cloneNode(true),parent:iframe.parentNode});
  }
  function flush(rec){
    if(!rec.session)return false;
    const seconds=Math.floor(rec.session.pending);if(!seconds)return false;
    C.watch(state,{...rec.session,seconds});rec.session.pending-=seconds;return true;
  }
  function flushAll(){let changed=false;for(const rec of players.values())changed=flush(rec)||changed;if(changed)save();}
  function videoId(player){try{return new URL(player.getVideoUrl()).searchParams.get('v');}catch{return null;}}
  function sample(rec,ending=false){
    const id=videoId(rec.player),now=new Date();
    const current={id,position:rec.player.getCurrentTime(),rate:rec.player.getPlaybackRate(),state:rec.player.getPlayerState(),clock:performance.now(),active:active&&!document.hidden&&lockHeld};
    if(ending&&rec.previous?.state===1)current.state=1;
    if(!C.known(rec.course,id)){rec.previous=null;return;}
    const date=P.day(now);
    if(rec.session&&(rec.session.id!==id||rec.session.date!==date)){if(flush(rec))save();rec.session=null;}
    const amount=C.credit(rec.previous,current);
    if(amount){
      if(!rec.session)rec.session={key:crypto.randomUUID(),course:rec.course,id,date,at:now.toISOString(),pending:0};
      rec.session.pending+=amount;
    }
    rec.previous=current;
  }
  function tick(){
    if(!active||document.hidden||!lockHeld){for(const rec of players.values())rec.previous=null;return;}
    for(const rec of players.values())if(rec.ready)try{sample(rec);}catch{rec.previous=null;}
    if(performance.now()-lastSave>=5000){flushAll();lastSave=performance.now();}
  }
  function acquireLock(){
    if(!active||document.hidden||lockHeld||lockPending)return;
    if(!navigator.locks){status('Automatic timing is unavailable in this browser. Use manual watch-time entries.');return;}
    lockPending=true;
    navigator.locks.request('daily-practice-course-timer',{ifAvailable:true},async lock=>{
      if(!lock||!active||document.hidden){if(active&&!lock)status('Another tracker tab owns the watch timer. Close or leave its course tab to track here.');return;}
      lockHeld=true;status([...players.values()].some(rec=>rec.ready)?'Timer ready: counts advancing playback while this browser tab is visible. Pauses, buffering and seeking do not count.':'Watch timer reserved. Waiting for the YouTube player to finish loading.');
      await new Promise(resolve=>{releaseLock=resolve;});lockHeld=false;releaseLock=null;
    }).catch(()=>status('Automatic timing is unavailable. You can still use the checklists and manually log time.')).finally(()=>{lockPending=false;});
  }
  function release(){flushAll();for(const rec of players.values())rec.previous=null;if(releaseLock)releaseLock();lockHeld=false;}
  function attach(){
    if(!active||!window.YT?.Player)return;
    for(const track of tracks){
      if(players.has(track.id))continue;
      const rec={course:track.id,ready:false,previous:null,session:null,player:null};players.set(track.id,rec);
      rec.player=new YT.Player(frames.get(track.id).node, {events:{
        onReady:()=>{if(players.get(track.id)!==rec)return;rec.ready=true;if(lockHeld)status('Timer ready: counts advancing playback while this browser tab is visible.');else acquireLock();},
        onStateChange:event=>{
          if(players.get(track.id)!==rec)return;
          if(rec.ready&&event.data!==1)try{sample(rec,true);}catch{}
          flush(rec);rec.previous=null;
          if(event.data===1){
            for(const other of players.values())if(other!==rec&&other.ready){flush(other);other.player.pauseVideo();other.previous=null;}
            if(!active||document.hidden)rec.player.pauseVideo();else {acquireLock();tick();}
          }
          if(event.data!==1)rec.session=null;
          save();
        },
        onPlaybackRateChange:()=>{flush(rec);rec.previous=null;save();},
        onError:()=>{flush(rec);rec.previous=null;save();status('YouTube could not play this lecture here. Open it on YouTube and log your watched minutes manually.');}
      }});
    }
  }
  function loadAPI(){
    if(window.YT?.Player){attach();return;}
    if(apiRequested)return;apiRequested=true;
    window.onYouTubeIframeAPIReady=attach;
    const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.async=true;
    script.onerror=()=>{status('YouTube timing could not load. Checklists and manual watch-time entries still work.');apiRequested=false;};document.head.append(script);
    setTimeout(()=>{if(active&&!window.YT?.Player)status('YouTube timing is unavailable or still loading. Use manual watch-time entries if it stays unavailable.');},12000);
  }
  function setActive(value){
    if(value===active)return;
    if(!value){
      tick();flushAll();active=false;release();
      for(const rec of players.values())try{rec.player.destroy();}catch{}
      players.clear();
      for(const frame of frames.values()){frame.node.removeAttribute('src');frame.node=frame.template.cloneNode(true);frame.parent.replaceChildren(frame.node);}
      return;
    }
    active=true;
    for(const track of tracks)$(`${track.id}-manual-time`).elements.date.max=P.day();
    for(const frame of frames.values()){
      const url=new URL(frame.node.dataset.playlistSrc);url.searchParams.set('enablejsapi','1');url.searchParams.set('origin',location.origin);url.searchParams.set('playsinline','1');frame.node.src=url.href;
    }
    status('Loading YouTube watch-time tracking…');loadAPI();acquireLock();
  }
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){release();for(const rec of players.values())if(rec.ready)rec.player.pauseVideo();}
    else if(active)acquireLock();
  });
  window.addEventListener('pagehide',()=>{flushAll();release();});
  window.addEventListener('storage',e=>{if(e.key===C.KEY)try{state=e.newValue?C.validate(JSON.parse(e.newValue)):C.fresh();writable=true;update();notify();}catch{status('Invalid course data from another tab was ignored.');}});
  setInterval(tick,1000);setInterval(acquireLock,3000);
  update();$('course-save-state').textContent=writable?'Course progress and watch time saved in this browser.':'Saved course data could not be loaded. Existing data has been kept; export your session before leaving.';
  window.CourseView={setActive,snapshot(){tick();flushAll();return JSON.parse(JSON.stringify(state));},events:()=>state.events,restore(value){setActive(false);state=C.validate(value);writable=true;save();if(location.hash==='#courses')setActive(true);}};
})();
