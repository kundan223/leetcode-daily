(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const number=n=>Number.isFinite(n)?new Intl.NumberFormat('en').format(Math.round(n)):'—';
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const time=t=>new Intl.DateTimeFormat(undefined,{dateStyle:'medium',timeStyle:'short'}).format(new Date(t));
  function freshness(block){
    if(!block?.updatedAt)return 'Unavailable — awaiting a successful platform refresh.';
    const stale=Date.now()-Date.parse(block.updatedAt)>24*60*60*1000;
    return `${block.error||stale?'Stale snapshot · ':''}Updated ${time(block.updatedAt)}${block.error?' · latest refresh failed':''}`;
  }
  function metrics(items){return `<dl class="platform-metrics">${items.map(([label,value])=>`<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl>`;}
  let snapshot;
  function renderContests(){
    if(!snapshot)return;
    const zone=Intl.DateTimeFormat().resolvedOptions().timeZone;
    $('contest-zone').textContent=`Times in ${zone}. Schedules may change; confirm on the platform.`;
    for(const platform of ['leetcode','codeforces']){
      const block=snapshot[`${platform}Contests`];
      const contests=window.Insights.upcoming(block?.data).slice(0,6);
      $(`${platform}-contests-status`).textContent=freshness(block);
      $(`${platform}-contests`).innerHTML=contests.length?contests.map(c=>{
        const url=platform==='leetcode'?`https://leetcode.com/contest/${encodeURIComponent(c.slug)}/`:`https://codeforces.com/contest/${encodeURIComponent(c.id)}`;
        return `<li><a href="${url}" target="_blank" rel="noopener noreferrer">${escape(c.title)} ↗</a><span><time datetime="${new Date(c.startTime*1000).toISOString()}">${escape(time(c.startTime*1000))}</time> · ${number(c.duration/60)} min</span></li>`;
      }).join(''):`<li>${block?.updatedAt?'No future contests in this snapshot. Check the official schedule.':'Schedule unavailable. Use the official schedule below.'}</li>`;
    }
  }
  async function load(){
    $('refresh-profile').disabled=true;
    $('refresh-contests').disabled=true;
    try{
      const response=await fetch(`platform-data.json?t=${Date.now()}`,{cache:'no-store'});
      if(!response.ok)throw new Error('Snapshot unavailable');
      snapshot=await response.json();
      const lc=snapshot.leetcode;
      $('leetcode-status').textContent=freshness(lc);
      $('leetcode-metrics').innerHTML=lc?.data?metrics([['Solved',number(lc.data.solved)],['Easy',number(lc.data.easy)],['Medium',number(lc.data.medium)],['Hard',number(lc.data.hard)],['Global rank',number(lc.data.ranking)],['Contest rating',lc.data.rating==null?'Unrated':number(lc.data.rating)],['Contests',number(lc.data.contests)]]):'';
      const cf=snapshot.codeforces;
      $('codeforces-handle').textContent=snapshot.handles?.codeforces||'Handle not provided';
      $('codeforces-status').textContent=snapshot.handles?.codeforces?freshness(cf):'Your Codeforces handle is needed to connect this profile. No account has been assumed.';
      $('codeforces-link').hidden=!snapshot.handles?.codeforces;
      if(snapshot.handles?.codeforces)$('codeforces-link').href=`https://codeforces.com/profile/${encodeURIComponent(snapshot.handles.codeforces)}`;
      $('codeforces-metrics').innerHTML=cf?.data?metrics([['Rating',cf.data.rating==null?'Unrated':number(cf.data.rating)],['Best rating',number(cf.data.maxRating)],['Rank',cf.data.rank||'Unrated'],['Rated contests',number(cf.data.contests)]]):'';
      $('profile-message').textContent='Public platform snapshots refresh every 6 hours when GitHub Actions is available. Reload checks the latest published snapshot. Roadmap checkmarks remain yours.';
      renderContests();
    }catch{
      $('profile-message').textContent='Could not load the published snapshot. Your saved roadmap is unaffected. Try reloading later.';
      for(const id of ['leetcode-status','codeforces-status','leetcode-contests-status','codeforces-contests-status'])$(id).textContent='Data unavailable — check the official platform links.';
    }finally{$('refresh-profile').disabled=false;$('refresh-contests').disabled=false;}
  }
  $('refresh-profile').addEventListener('click',load);
  const refreshContests=$('refresh-contests');
  if(refreshContests)refreshContests.addEventListener('click',load);
  setInterval(renderContests,60000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)renderContests();});
  load();
})();
