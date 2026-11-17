(() => {
  'use strict';
  const C=window.CourseProgress,$=id=>document.getElementById(id);
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let state=C.fresh(),writable=true,active=false,busy=false;
  try{const saved=localStorage.getItem(C.KEY);if(saved){state=C.validate(JSON.parse(saved));if(state.playlists.some(c=>c.expired))localStorage.setItem(C.KEY,JSON.stringify(state));}}catch{writable=false;}
  const tracks=()=>C.catalog(state).filter(c=>!state.removed.includes(c.id));
  function notify(){document.dispatchEvent(new CustomEvent('coursechange'));}
  function update(){
    for(const track of tracks()){
      const done=track.lessons.filter(l=>state.checks[`${track.id}:${l.id}`]?.done).length;
      $(`${track.id}-course-summary`).textContent=`${done} / ${track.lessons.length} complete · ${C.format(C.seconds(state,track.id))} credited`;
      $(`${track.id}-progress`).value=done;
      for(const lesson of track.lessons){
        const checked=!!state.checks[`${track.id}:${lesson.id}`]?.done;
        $(`lesson-${track.id}-${lesson.id}`).checked=checked;
        $(`time-${track.id}-${lesson.id}`).textContent=checked?`${C.format(state.checks[`${track.id}:${lesson.id}`].seconds??C.duration(lesson))} credited`:'Not completed';
      }
    }
  }
  function save(){
    try{if(!writable)throw new Error();localStorage.setItem(C.KEY,JSON.stringify(state));$('course-save-state').textContent='Lecture completions saved in this browser.';}
    catch{$('course-save-state').textContent='Course changes are not saved. Export a backup before leaving. Existing unreadable data has been kept.';}
    update();notify();
  }
  function render(){
    $('playlist-grid').innerHTML=tracks().map((track,i)=>`<article class="course-card card" id="track-${track.id}"><div class="course-card-header"><span class="course-number">${String(i+1).padStart(2,'0')}</span><div><div class="eyebrow">${escape(track.creator||'LEARNING TRACK')}</div><h2>${escape(track.title)}</h2></div><button class="text-button remove-playlist" data-track="${track.id}" aria-label="Remove ${escape(track.title)} from tracking">Remove</button></div><div class="course-player"><iframe data-playlist-src="https://www.youtube-nocookie.com/embed/${track.id==='backend'?'0Rwb4Xmlcwc':'videoseries'}?list=${track.playlist}" id="${track.id}-player" data-course-frame="${track.id}" title="${escape(track.title)} playlist" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div><div class="course-card-body"><a class="button btn" href="https://www.youtube.com/playlist?list=${track.playlist}" target="_blank" rel="noopener noreferrer">Open on YouTube ↗</a>${track.fetchedAt?`<a class="metadata-source" href="https://playlistduration.com/playlist/${track.playlist}" target="_blank" rel="noopener noreferrer">Titles & durations: Playlist Duration ↗</a>`:''}</div><section class="lecture-checklist" aria-labelledby="${track.id}-checklist-title"><h3 id="${track.id}-checklist-title">Lecture checklist</h3><p id="${track.id}-course-summary" class="profile-note"></p><progress id="${track.id}-progress" class="progress" max="${track.lessons.length}" value="0" aria-label="${escape(track.title)} completion"></progress>${track.expired?`<p class="profile-note">Playlist details need a refresh. Your checkmarks and credited minutes are safe.</p><button class="button btn refresh-playlist" data-track="${track.id}">Refresh playlist</button>`:''}<ol id="${track.id}-checklist" class="lesson-list" tabindex="0" aria-label="${escape(track.title)} lectures">${track.lessons.map(l=>`<li><input class="checkbox" id="lesson-${track.id}-${l.id}" type="checkbox" data-course="${track.id}" data-lesson="${l.id}" ${track.expired?'disabled':''} aria-label="Mark ${escape(l.title)} complete"><div><label for="lesson-${track.id}-${l.id}">${l.position}. ${escape(l.title)}</label><span class="lesson-meta">Length ${escape(l.duration)} · <span id="time-${track.id}-${l.id}"></span></span></div><button class="text-button lesson-play" data-course="${track.id}" data-lesson="${l.id}" aria-label="Play ${escape(l.title)}">Play</button></li>`).join('')}</ol></section></article>`).join('')||'<div class="activity-empty">Your learning bay is empty. Drop a playlist above to start a new checklist.</div>';
    $('removed-playlists').hidden=!state.removed.length;
    $('removed-list').innerHTML=state.removed.map(id=>{const track=C.catalog(state).find(c=>c.id===id);return `<li><span>${escape(track.title)}</span><button class="text-button restore-playlist" data-track="${id}">Restore</button></li>`;}).join('');
    update();mountPlayers();
  }
  function mountPlayers(){document.querySelectorAll('iframe[data-playlist-src]').forEach(frame=>{if(active)frame.src=frame.dataset.playlistSrc;else frame.removeAttribute('src');});}
  function setActive(value){if(value===active)return;active=value;mountPlayers();}
  $('playlist-grid').addEventListener('change',e=>{if(e.target.matches('input[data-lesson]')){C.toggle(state,e.target.dataset.course,e.target.dataset.lesson,e.target.checked);save();}});
  $('playlist-grid').addEventListener('click',e=>{
    const remove=e.target.closest('.remove-playlist');if(remove){C.remove(state,remove.dataset.track);render();save();$('playlist-status').textContent='Playlist removed. Restore it below to recover all its checkmarks.';$('playlist-url').focus();return;}
    const refresh=e.target.closest('.refresh-playlist');if(refresh){const track=C.catalog(state).find(c=>c.id===refresh.dataset.track);add(track.playlist,true);return;}
    const button=e.target.closest('.lesson-play');if(!button)return;
    const track=tracks().find(c=>c.id===button.dataset.course);
    document.querySelectorAll('iframe[data-course-frame]').forEach(frame=>{if(frame.dataset.courseFrame===track.id)frame.src=`https://www.youtube-nocookie.com/embed/${button.dataset.lesson}?list=${track.playlist}&autoplay=1`;else frame.removeAttribute('src');});
  });
  $('removed-list').addEventListener('click',e=>{const button=e.target.closest('.restore-playlist');if(button){state.removed=state.removed.filter(id=>id!==button.dataset.track);render();save();$('playlist-status').textContent='Playlist restored with its saved progress.';$('playlist-url').focus();}});
  async function add(id,refresh=false){
    if(busy)return;
    const existing=C.catalog(state).find(c=>c.playlist===id);
    if(existing&&!refresh){state.removed=state.removed.filter(v=>v!==existing.id);render();save();$('playlist-status').textContent='This playlist is already saved. Its checklist is ready below.';return;}
    busy=true;$('add-playlist').disabled=true;$('playlist-form').setAttribute('aria-busy','true');$('playlist-status').textContent='Loading the full lecture checklist…';
    try{
      const {track,skipped}=await window.PlaylistImport.load(id);
      // Another tab or backup import may have changed the collection while loading.
      const current=C.catalog(state).find(c=>c.playlist===id);
      if(refresh&&current){
        // Retain removed videos as personal completion records, without stale API metadata.
        const missing=current.lessons.filter(l=>!track.lessons.some(n=>n.id===l.id)&&state.checks[`${current.id}:${l.id}`]);
        track.lessons.push(...missing.map((l,i)=>({...l,title:'Previously saved lecture',durationSeconds:0,duration:'Unavailable',position:track.lessons.length+i+1})));
        state.playlists=state.playlists.map(c=>c.id===track.id?track:c);
      }else C.add(state,track);
      render();save();$('playlist-url').value='';$('playlist-status').textContent=`Checklist ready: ${track.lessons.length} lectures.${skipped?` ${skipped} unavailable videos skipped.`:''}`;
    }catch(error){$('playlist-status').textContent=error.message;}
    finally{busy=false;$('add-playlist').disabled=false;$('playlist-form').removeAttribute('aria-busy');}
  }
  $('playlist-form').addEventListener('submit',e=>{e.preventDefault();try{add(window.PlaylistImport.parse($('playlist-url').value));}catch(error){$('playlist-status').textContent=error.message;}});
  const drop=$('playlist-drop');
  drop.addEventListener('dragover',e=>{e.preventDefault();drop.classList.add('dragging');});
  drop.addEventListener('dragleave',()=>drop.classList.remove('dragging'));
  drop.addEventListener('drop',e=>{e.preventDefault();drop.classList.remove('dragging');const text=e.dataTransfer.getData('text/uri-list').split('\n').find(s=>s&&!s.startsWith('#'))||e.dataTransfer.getData('text/plain');$('playlist-url').value=text.trim();$('playlist-url').focus();});
  window.addEventListener('storage',e=>{if(e.key===C.KEY)try{state=e.newValue?C.validate(JSON.parse(e.newValue)):C.fresh();writable=true;render();notify();}catch{$('course-save-state').textContent='Invalid course data from another tab was ignored.';}});
  window.CourseView={healthy:()=>writable,setActive,catalog:tracks,snapshot:()=>C.validate(JSON.parse(JSON.stringify(state))),events:()=>C.entries(state),restore(value){state=C.validate(value);writable=true;render();save();}};
  render();$('course-save-state').textContent=writable?'Lecture completions saved in this browser.':'Saved course data could not be loaded. Existing data has been kept.';
})();
