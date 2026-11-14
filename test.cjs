const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={window:{}};vm.createContext(ctx);for(const file of ['data.js','progress.js'])vm.runInContext(fs.readFileSync(__dirname+'/'+file,'utf8'),ctx);
const {ROADMAP:data,Progress:P}=ctx.window,rows=data.sections.flatMap(s=>s.rows),ids=new Set(rows.map(r=>r.id));
assert.equal(rows.length,242);assert.equal(ids.size,242);assert.equal(data.sections.length,22);
for(const row of rows){assert.match(row.url,/^https:\/\/leetcode.com\/problems\/[a-z0-9-]+\/$/);assert.ok(['E','M','H'].includes(row.difficulty));}
const s=P.fresh();P.toggleDone(s,27,true,'2026-11-13');assert.equal(P.stats(s,data.sections,'2026-11-13').today,1);P.toggleDone(s,27,true,'2026-11-14');assert.equal(s.problems[27].completedOn,'2026-11-13');
P.toggleReview(s,27);assert.equal(s.problems[27].review,true);P.toggleDone(s,27,false);assert.equal(s.problems[27].completedOn,null);assert.equal(s.problems[27].review,true);assert.equal(P.stats(s,data.sections).done,0);
for(const r of data.sections[0].rows)P.toggleDone(s,r.id,true,'2026-11-13');assert.equal(P.stats(s,data.sections,'2026-11-13').topics,1);assert.equal(P.stats(s,data.sections,'2026-11-14').today,0);
const restored=P.validate(JSON.parse(JSON.stringify(s)),ids);assert.equal(JSON.stringify(restored),JSON.stringify(s));assert.throws(()=>P.validate({version:1,problems:{27:{done:'yes',review:false}}},ids));assert.throws(()=>P.validate({version:2,problems:{}},ids));assert.throws(()=>P.validate({version:1,problems:[]},ids));
const unknown=P.validate({version:1,problems:{999999:{done:true,review:false,completedOn:null}}},ids);assert.equal(Object.keys(unknown.problems).length,0);
for(const r of rows)P.toggleDone(s,r.id,true,'2026-11-13');const final=P.stats(s,data.sections,'2026-11-13');assert.equal(final.percent,100);assert.equal(final.topics,22);assert.equal(final.done,242);
console.log('PASS: 242 unique questions; persistence validation; completion/revisit independence; daily counts; complete-topic and 100% totals.');
