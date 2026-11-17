(() => {
  'use strict';
  const $=id=>document.getElementById(id),T=window.TrackerState,config=window.SUPABASE_CONFIG;
  const status=$('cloud-status'),short=$('cloud-short-status');
  let client,engine,session=null,timer,applying=false,recovery=false,authBusy=false;
  const configured=config&&/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(config.url)&&/^sb_publishable_[A-Za-z0-9_-]+$/.test(config.publishableKey);
  const key=configured?`daily-practice-cloud-v1:${new URL(config.url).hostname}`:'',recoveryKey='daily-practice-cloud-recovery-v1';
  function message(state,text){
    status.textContent=text;short.textContent=({synced:'Cloud synced',working:'Syncing…',pending:'Sync pending',conflict:'Sync needs review',error:'Not synced',ready:'Sync not enabled',account:'Account mismatch'})[state]||'Browser only';
    $('cloud-conflict').hidden=state!=='conflict';
    if(state==='pending')schedule();
  }
  function readMeta(){const raw=localStorage.getItem(key);if(!raw)return null;const m=JSON.parse(raw);if(!m||typeof m.user!=='string'||typeof m.enabled!=='boolean')throw new Error('Sync settings could not be read. Export a backup before resetting browser data.');return m;}
  function schedule(){if(applying||!session)return;clearTimeout(timer);timer=setTimeout(()=>run(),1200);}
  async function run(choice){if(!engine||!session)return;if(!T.healthy()){message('error','Some saved browser data could not be read. Restore or export a backup before enabling cloud sync.');return;}try{await engine.sync(choice);}catch{message('error','Sync settings could not be read. Existing progress has been kept.');}}
  function backup(local,remote){localStorage.setItem(recoveryKey,JSON.stringify({savedAt:new Date().toISOString(),local,cloud:remote}));$('cloud-download-recovery').hidden=false;$('cloud-download-remote').hidden=!remote;}
  function downloadRecovery(which){const raw=localStorage.getItem(recoveryKey);if(!raw)return;const content=JSON.parse(raw)[which];if(!content)return;const url=URL.createObjectURL(new Blob([JSON.stringify(content,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=`practice-${which}-recovery.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  $('cloud-open').addEventListener('click',()=>{const d=$('cloud-dialog');if(typeof d.showModal==='function')d.showModal();else d.setAttribute('open','');});
  $('cloud-close').addEventListener('click',()=>$('cloud-dialog').close());
  $('cloud-download-recovery').addEventListener('click',()=>downloadRecovery('local'));
  $('cloud-download-remote').addEventListener('click',()=>downloadRecovery('cloud'));
  try{const stored=JSON.parse(localStorage.getItem(recoveryKey)||'null');$('cloud-download-recovery').hidden=!stored?.local;$('cloud-download-remote').hidden=!stored?.cloud;}catch{}
  if(!configured){$('cloud-auth').hidden=true;message('offline','Cloud sync is not configured yet. Your existing progress is still saved in this browser.');return;}
  // Load the pinned SDK only when configured; local-only use stays dependency-free.
  async function start(){
    if(!window.supabase){await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='supabase-sdk.js';s.onload=resolve;s.onerror=()=>reject(new Error('Could not load sign-in. Please reload and retry.'));document.head.appendChild(s);});}
    client=window.supabase.createClient(config.url,config.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'daily-practice-auth-'+new URL(config.url).hostname}});
    engine=window.SyncCore.create({
      local:()=>T.snapshot(),validate:T.validate,readMeta,writeMeta:m=>localStorage.setItem(key,JSON.stringify(m)),backup,status:message,
      apply:data=>{applying=true;try{T.apply(data);}finally{applying=false;}},
      async get(user){const {data,error}=await client.from('practice_state').select('revision,payload').eq('user_id',user).maybeSingle();if(error)throw new Error('Cloud data could not be loaded. Local progress is safe; retry when connected.');return data;},
      async put(user,revision,payload){const {data,error}=await client.rpc('save_practice_state',{p_user:user,p_revision:revision,p_payload:payload});if(error)throw new Error('Cloud save failed. Your changes remain in this browser; retry to sync.');return data;}
    });
    function authState(event,current){
      const previous=session?.user.id;session=current;engine.identity(current?.user.id||null);
      $('cloud-auth').hidden=!!current&&!recovery;$('cloud-account').hidden=!current;$('cloud-email-label').textContent=current?.user.email||'';
      if(event==='PASSWORD_RECOVERY'){$('cloud-email').value=current?.user.email||'';$('cloud-password').autocomplete='new-password';recovery=true;$('cloud-auth').hidden=false;$('cloud-update-password').hidden=false;}
      if(!current){clearTimeout(timer);message('offline','Sign in to sync your practice across devices. Existing progress stays on this browser.');}
      else if(previous!==current.user.id){setTimeout(()=>run(),0);}
    }
    client.auth.onAuthStateChange((event,current)=>authState(event,current));
    const {data,error}=await client.auth.getSession();if(error)throw error;authState('INITIAL_SESSION',data.session);
  }
  async function authenticate(action){
    if(!client||authBusy)return;const email=$('cloud-email').value.trim(),password=$('cloud-password').value;
    if(!email||!$('cloud-email').checkValidity()){message('error','Enter a valid email address.');return;}
    if(action!=='reset'&&password.length<8){message('error','Use a password with at least 8 characters.');return;}
    authBusy=true;for(const b of $('cloud-auth').querySelectorAll('button'))b.disabled=true;
    try{
      const redirectTo=location.origin+location.pathname;
      const result=action==='signup'?await client.auth.signUp({email,password,options:{emailRedirectTo:redirectTo}}):action==='reset'?await client.auth.resetPasswordForEmail(email,{redirectTo}):action==='password'?await client.auth.updateUser({password}):await client.auth.signInWithPassword({email,password});
      if(result.error)throw result.error;
      if(action==='signup'&&!result.data.session)message('ready','Check your email to confirm your account, then sign in here.');
      if(action==='reset')message('ready','If this account can receive recovery emails, a password reset link has been requested.');
      if(action==='password'){recovery=false;$('cloud-update-password').hidden=true;$('cloud-auth').hidden=!!session;message('ready','Password updated.');}
      $('cloud-password').value='';
    }catch(error){message('error',error.message||'Sign-in failed. Please retry.');}
    finally{authBusy=false;for(const b of $('cloud-auth').querySelectorAll('button'))b.disabled=false;}
  }
  $('cloud-auth').addEventListener('submit',e=>{e.preventDefault();authenticate('signin');});
  $('cloud-signup').addEventListener('click',()=>authenticate('signup'));$('cloud-reset').addEventListener('click',()=>authenticate('reset'));$('cloud-update-password').addEventListener('click',()=>authenticate('password'));
  $('cloud-enable').addEventListener('click',async()=>{if(!T.healthy()){message('error','Repair unreadable local data before syncing. Export a backup first.');return;}try{await engine.enable();}catch{message('error','Could not enable sync. Browser data has been kept.');}});
  $('cloud-sync-now').addEventListener('click',()=>run());
  $('cloud-use-local').addEventListener('click',()=>run('local'));$('cloud-use-cloud').addEventListener('click',()=>run('cloud'));
  $('cloud-signout').addEventListener('click',async()=>{if(!client)return;const {error}=await client.auth.signOut({scope:'local'});if(error)message('error','Could not sign out. Please retry.');});
  document.addEventListener('practicechange',schedule);document.addEventListener('coursechange',schedule);
  window.addEventListener('online',schedule);window.addEventListener('storage',e=>{if(Object.values(window.Workspace.KEYS).includes(e.key)||e.key===window.CourseProgress.KEY)schedule();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)run();});setInterval(()=>{if(!document.hidden)run();},60000);
  start().catch(error=>message('error',error.message||'Sign-in is unavailable. Your browser progress is safe.'));
})();
