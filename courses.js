(() => {
  'use strict';
  const C=window.CourseProgress,tracks=window.COURSES,$=id=>document.getElementById(id);
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let state=C.fresh(),writable=true,active=false;
  try{const saved=localStorage.getItem(C.KEY);if(saved)state=C.validate(JSON.parse(saved));}catch{writable=false;}
  function notify(){document.dispatchEvent(new CustomEvent('coursechange'));}
  function update(){
    for(const track of tracks){
      const done=track.lessons.filter(l=>state.checks[`${track.id}:${l.id}`]?.done).length;
      $(`${track.id}-course-summary`).textContent=`${done} / ${track.lessons.length} complete · ${C.format(C.seconds(state,track.id))} credited`;
      for(const lesson of track.lessons){
        const checked=!!state.checks[`${track.id}:${lesson.id}`]?.done;
        $(`lesson-${track.id}-${lesson.id}`).checked=checked;
        $(`time-${track.id}-${lesson.id}`).textContent=checked?`${C.format(C.duration(lesson))} credited`:'Not completed';
      }
    }
  }
  function save(){
    try{if(!writable)throw new Error();localStorage.setItem(C.KEY,JSON.stringify(state));$('course-save-state').textContent='Lecture completions saved in this browser.';}
    catch{$('course-save-state').textContent='Course changes are not saved. Export a backup before leaving. Existing unreadable data has been kept.';}
    update();notify();
  }
  for(const track of tracks){
    const list=$(`${track.id}-checklist`);
    list.innerHTML=track.lessons.map(l=>`<li><input id="lesson-${track.id}-${l.id}" type="checkbox" data-course="${track.id}" data-lesson="${l.id}" aria-label="Mark ${escape(l.title)} complete"><div><label for="lesson-${track.id}-${l.id}">${l.position}. ${escape(l.title)}</label><span class="lesson-meta">Length ${escape(l.duration)} · <span id="time-${track.id}-${l.id}"></span></span></div><button class="text-button lesson-play" data-lesson="${l.id}" aria-label="Play ${escape(l.title)}">Play</button></li>`).join('');
    list.addEventListener('change',e=>{if(e.target.matches('input[data-lesson]')){C.toggle(state,track.id,e.target.dataset.lesson,e.target.checked);save();}});
    list.addEventListener('click',e=>{
      const button=e.target.closest('.lesson-play');if(!button)return;
      document.querySelectorAll('iframe[data-course-frame]').forEach(frame=>{
        if(frame.dataset.courseFrame===track.id)frame.src=`https://www.youtube-nocookie.com/embed/${button.dataset.lesson}?list=${track.playlist}&autoplay=1`;
        else frame.removeAttribute('src');
      });
    });
  }
  function setActive(value){
    if(value===active)return;active=value;
    document.querySelectorAll('iframe[data-playlist-src]').forEach(frame=>{if(active)frame.src=frame.dataset.playlistSrc;else frame.removeAttribute('src');});
  }
  window.addEventListener('storage',e=>{if(e.key===C.KEY)try{state=e.newValue?C.validate(JSON.parse(e.newValue)):C.fresh();writable=true;update();notify();}catch{$('course-save-state').textContent='Invalid course data from another tab was ignored.';}});
  update();$('course-save-state').textContent=writable?'Lecture completions saved in this browser.':'Saved course data could not be loaded. Existing data has been kept.';
  window.CourseView={setActive,snapshot:()=>JSON.parse(JSON.stringify(state)),events:()=>C.entries(state),restore(value){state=C.validate(value);writable=true;save();}};
})();
