// Run with Node: node --test tests/store.test.cjs. All fixtures stay in memory.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const {webcrypto}=require('node:crypto');
async function fixture(initial){
 const values=new Map(initial);let failKey=null;
 const storage={getItem:k=>values.get(k)??null,setItem(k,v){if(failKey===k){failKey=null;throw Error('quota')}values.set(k,v)},removeItem:k=>values.delete(k)};
 const context={localStorage:storage,crypto:webcrypto,TextEncoder,console,addEventListener(){}};context.window=context;
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/js/store.js'),'utf8'),context);
 await context.SB.ready;const sb=context.SB;
 return {sb,values,fail:key=>failKey=key,employee:sb.userByEmail('khalid.alrawahi'),hr:sb.userByEmail('maryam.albalushi'),it:sb.userByEmail('salim.alharthi')};
}
test('colleague mail is visible to sender and recipient, with reply and isolated state',async()=>{
 const {sb,employee,hr,it}=await fixture();
 const m=sb.mail.send({from:employee.email,to:[hr.email],subject:'UX review',body:'Hello'});
 assert.equal(sb.mail.thread(m.threadId,hr.email).length,1);
 assert.equal(sb.mail.thread(m.threadId,it.email).length,0);
 assert.equal(sb.mail.thread(m.threadId).length,0);
 sb.mail.markThread(m.threadId,hr.email,{read:true});
 assert.equal(sb.mail.threads(hr.email,'inbox').find(t=>t.id===m.threadId).unread,0);
 sb.mail.markThread(m.threadId,hr.email,{read:false});
 assert.equal(sb.mail.threads(hr.email,'inbox').find(t=>t.id===m.threadId).unread,1);
 sb.mail.reply(m.threadId,hr.email,'Reply',[]);
 assert.equal(sb.mail.thread(m.threadId,employee.email).length,2);
 sb.mail.markThread(m.threadId,hr.email,{trash:true});
 assert(sb.mail.threads(hr.email,'trash').some(t=>t.id===m.threadId));
 assert(sb.mail.threads(employee.email,'inbox').some(t=>t.id===m.threadId));
 sb.mail.markThread(m.threadId,hr.email,{trash:false});
 assert(sb.mail.threads(hr.email,'inbox').some(t=>t.id===m.threadId));
});
test('broadcast reply does not reach everyone or reveal another employee reply',async()=>{
 const {sb,employee,hr}=await fixture();
 const m=sb.mail.send({from:'management@sindbad.om',to:['all@sindbad.om'],body:'Notice'});
 const reply=sb.mail.reply(m.threadId,employee.email,'Question',[]);
 assert.deepEqual(Array.from(reply.to),['management@sindbad.om']);
 assert.equal(sb.mail.thread(m.threadId,hr.email).length,1);
 assert.equal(sb.mail.thread(m.threadId,'management@sindbad.om').length,2);
 const response=sb.mail.reply(m.threadId,'management@sindbad.om','Private response',[]);
 assert.deepEqual(Array.from(response.to),[employee.email]);
 assert.equal(sb.mail.thread(m.threadId,hr.email).length,1);
 assert.throws(()=>sb.mail.reply('missing',hr.email,'Reply',[]),{code:'recipient'});
});
test('working days follow configured weekends and reject invalid dates',async()=>{
 const {sb}=await fixture();
 assert.equal(sb.req.workingDays('2027-01-01','2027-01-07'),6);
 sb.setCfg('settings',{...sb.cfg('settings'),weekend:[5,6]});
 assert.equal(sb.req.workingDays('2027-01-01','2027-01-07'),5);
 assert.equal(sb.req.workingDays('2027-02-30','2027-03-02'),0);
 assert.equal(sb.req.workingDays('2027-01-07','2027-01-01'),0);
});
test('annual approval is idempotent and reopen returns the exact debit',async()=>{
 const {sb,employee,hr}=await fixture();const balance=employee.leaveBalance;
 const r=sb.req.create(employee,'leave',{kind:'annual',from:'2027-01-03',to:'2027-01-05',days:999},[]);
 assert.equal(r.data.days,3);
 sb.req.decide(r.id,hr,'approved','Reviewed');
 assert.equal(sb.get('users',employee.id).leaveBalance,balance-3);
 const messages=sb.list('messages').length;
 sb.req.decide(r.id,hr,'approved','Retry');
 assert.equal(sb.list('messages').length,messages);
 assert.equal(sb.get('users',employee.id).leaveBalance,balance-3);
 sb.req.decide(r.id,hr,'pending','Reopen');
 assert.equal(sb.get('users',employee.id).leaveBalance,balance);
 sb.req.decide(r.id,hr,'approved','Approved again');
 assert.equal(sb.get('users',employee.id).leaveBalance,balance-3);
});
test('decision scope, valid transitions, overlap, and insufficient balance are enforced',async()=>{
 const {sb,employee,hr,it}=await fixture();
 const r=sb.req.create(employee,'leave',{kind:'annual',from:'2027-02-07',to:'2027-02-09'},[]);
 assert.throws(()=>sb.req.decide(r.id,it,'approved',''),{code:'forbidden'});
 assert.throws(()=>sb.req.decide(r.id,employee,'approved',''),{code:'forbidden'});
 assert.throws(()=>sb.req.decide(r.id,hr,'rejected',''),{code:'reason'});
 assert.throws(()=>sb.req.create(employee,'leave',{kind:'annual',from:'2027-02-08',to:'2027-02-10'},[]),{code:'overlap'});
 sb.put('users',{id:employee.id,leaveBalance:1});
 assert.throws(()=>sb.req.decide(r.id,hr,'approved',''),{code:'balance'});
 assert.equal(sb.get('requests',r.id).status,'pending');
 assert.equal(sb.get('users',employee.id).leaveBalance,1);
 sb.req.cancel(r.id,employee);
 assert.throws(()=>sb.req.decide(r.id,hr,'approved',''),{code:'transition'});
});
test('failed request update rolls back balance and status before publishing changes',async()=>{
 const {sb,employee,hr,fail}=await fixture();
 const r=sb.req.create(employee,'leave',{kind:'annual',from:'2027-03-07',to:'2027-03-09'},[]);
 const before=JSON.stringify(sb.exportAll().cols);let events=0;
 const off=sb.on(()=>events++);fail('sbx:v2:c:requests');
 assert.throws(()=>sb.req.decide(r.id,hr,'approved','Reviewed'),{code:'quota'});
 assert.equal(JSON.stringify(sb.exportAll().cols),before);assert.equal(events,0);off();
});
test('a new employee can have zero leave balance',async()=>{
 const {sb,hr}=await fixture();
 const u=await sb.auth.create({name_ar:'حساب اختبار',name_en:'Test Zero',password:'TestOnly2026!',leaveBalance:0},hr);
 assert.equal(u.leaveBalance,0);
});
test('staff and employee sign-in scopes remain separate',async()=>{
 const {sb}=await fixture();
 await sb.auth.login('khalid.alrawahi','Sindbad@2026','portal');
 await sb.auth.login('maryam.albalushi','Sindbad@2026','dashboard');
 assert.equal(sb.auth.current('portal').role,'employee');assert.equal(sb.auth.current('dashboard').role,'hr');
 await assert.rejects(sb.auth.login('khalid.alrawahi','Sindbad@2026','dashboard'),{code:'forbidden'});
});
test('invalid imports do not replace any current data; valid snapshots round-trip',async()=>{
 const {sb}=await fixture();const before=JSON.stringify(sb.exportAll().cols);
 const snapshot=sb.exportAll();snapshot.cols.messages[0].to=null;
 assert.throws(()=>sb.importAll(snapshot),{code:'format'});
 assert.equal(JSON.stringify(sb.exportAll().cols),before);
 sb.importAll(sb.exportAll());assert.equal(JSON.stringify(sb.exportAll().cols),before);
});

test('company systems use the supplied destinations and training is internal',async()=>{
 const {sb}=await fixture();
 const expected={sindflow:'https://oracleapex.com/ords/r/sindbad_sales/sindbad-sales-panal134338/login',ayun:'https://server.ayunts.com/','company-dashboard':'https://www.sindbadom.work/admin/login','project-manager':'https://sindbadom.work/pm/login',odoo:'https://sindbad-home.odoo.com/odoo'};
 for(const [id,url] of Object.entries(expected))assert.equal(sb.get('apps',id).url,url);
 assert.equal(sb.get('apps','training').internal,'training');
 assert.equal(sb.get('apps','elearn').group,'training');
 assert.equal(sb.get('apps','attendance'),null);
});

test('catalogue upgrade preserves business data, custom systems and later edits',async()=>{
 const {sb,values}=await fixture();
 sb.put('apps',{id:'custom',name_en:'Custom tool',url:'https://example.com/team'});
 sb.put('apps',{id:'attendance',name_en:'Attendance app',url:'https://example.com/attendance'});
 sb.remove('apps','sindflow');
 const seeded=JSON.parse(values.get('sbx:v2:seeded'));delete seeded.systemsCatalog;
 values.set('sbx:v2:seeded',JSON.stringify(seeded));
 const untouched=[...values].filter(([k])=>k!=='sbx:v2:seeded'&&k!=='sbx:v2:c:apps');
 const migrated=await fixture(values);
 for(const [k,v] of untouched)assert.equal(migrated.values.get(k),v,k);
 assert.equal(migrated.sb.get('apps','custom').url,'https://example.com/team');
 assert.equal(migrated.sb.get('apps','attendance').url,'https://example.com/attendance');
 assert(migrated.sb.get('apps','sindflow'));
 migrated.sb.put('apps',{id:'odoo',url:'https://example.com/reconfigured'});
 const reloaded=await fixture(migrated.values);
 assert.equal(reloaded.sb.get('apps','odoo').url,'https://example.com/reconfigured');
 assert.equal(reloaded.sb.list('apps').filter(a=>a.id==='training').length,1);
 reloaded.sb.importAll(reloaded.sb.exportAll());
 const restored=await fixture(reloaded.values);
 assert.equal(restored.sb.get('apps','odoo').url,'https://example.com/reconfigured');
});
