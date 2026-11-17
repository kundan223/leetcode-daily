const {PGlite}=require('@electric-sql/pglite'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const db=new PGlite();
 try{
 await db.exec(`create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;`);
 for(const file of fs.readdirSync(__dirname+'/supabase/migrations').filter(f=>f.endsWith('.sql')).sort())await db.exec(fs.readFileSync(__dirname+'/supabase/migrations/'+file,'utf8').replace(/^\uFEFF/,''));
 const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222';
 await db.query('insert into auth.users(id) values($1),($2)',[a,b]);
 const payload={app:'daily-practice',version:3,sheets:{dsa:{done:true}},activity:{events:[]},courses:{checks:{}}};
 async function as(role,user){await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[user||'']);await db.exec(`set role ${role}`);}
 async function save(user,revision,data=payload){return (await db.query('select public.save_practice_state($1,$2,$3::jsonb) as value',[user,revision,JSON.stringify(data)])).rows[0].value;}
 await as('authenticated',a);let r=await save(a,0);assert.equal(r.revision,1);assert.equal(r.conflict,false);
 r=await save(a,0,{...payload,sheets:{}});assert.equal(r.conflict,true);assert.equal(r.payload.sheets.dsa.done,true);
 assert.equal((await db.query('select * from public.practice_state')).rows.length,1);
 await assert.rejects(()=>db.query('update public.practice_state set revision=9'));
 await assert.rejects(()=>save(b,0));
 await as('authenticated',b);assert.equal((await db.query('select * from public.practice_state')).rows.length,0);r=await save(b,0);assert.equal(r.revision,1);
 await assert.rejects(()=>save(b,1,{app:'wrong',version:3}));
 await as('anon',null);await assert.rejects(()=>db.query('select * from public.practice_state'));await assert.rejects(()=>save(a,1));
 await as('authenticated',null);await assert.rejects(()=>save(a,1));
 await as('authenticated',a);r=await save(a,1,{...payload,sheets:{dsa:{done:false}}});assert.equal(r.revision,2);assert.equal(r.payload.sheets.dsa.done,false);
 console.log('PASS: actual PostgreSQL migration, per-account RLS reads, blocked direct writes/anonymous RPC, ownership checks, revision conflicts, validation and saved unchecks.');
 }finally{await db.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
