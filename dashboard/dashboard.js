/* Sindbad Inside — Dashboard (staff content & operations console)
   Reads and writes the same demo store as the portal (../assets/js/store.js).
   All data here is sample data that lives in this browser only. */
(function(){
"use strict";
const D={lang:"ar",view:"overview",me:null,mini:false,mbox:"",mfold:"inbox",mthread:null,mq:"",
  rq:{st:"open",type:"all",branch:"all",q:"",mode:"table"},emp:{tab:"all",q:"",dept:"all"},news:{cat:"all",q:""},act:{q:""},pend:{}};
try{D.lang=localStorage.getItem("sbd_lang")||localStorage.getItem("sb_lang")||"ar";D.mini=localStorage.getItem("sbd_mini")==="1";const v=localStorage.getItem("sbd_rqmode");if(v)D.rq.mode=v}catch(e){}

/* ---------- helpers ---------- */
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const AR=()=>D.lang==="ar",tx=(a,e)=>AR()?a:e,P=p=>Array.isArray(p)?(AR()?p[0]:p[1]):p;
const L=(o,k)=>o?(AR()?(o[k+"_ar"]||o[k+"_en"]||""):(o[k+"_en"]||o[k+"_ar"]||"")):"";
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const loc=()=>AR()?"ar-OM-u-nu-latn":"en-GB";
const fmt=n=>Number(n||0).toLocaleString(loc(),{maximumFractionDigits:2});
const fdate=t=>t?new Date(t).toLocaleDateString(loc(),{day:"numeric",month:"short",year:"numeric"}):"—";
const fdt=t=>new Date(t).toLocaleString(loc(),{day:"numeric",month:"short",hour:"numeric",minute:"2-digit"});
const DAY=864e5;
function ago(t){if(!t)return"—";const s=(Date.now()-t)/1e3;if(s<60)return tx("الآن","just now");if(s<3600)return tx(`قبل ${Math.floor(s/60)} د`,`${Math.floor(s/60)}m ago`);if(s<86400)return tx(`قبل ${Math.floor(s/3600)} س`,`${Math.floor(s/3600)}h ago`);if(s<7*86400)return tx(`قبل ${Math.floor(s/86400)} يوم`,`${Math.floor(s/86400)}d ago`);return fdate(t)}
const fsize=b=>b>1048576?(b/1048576).toFixed(1)+" MB":Math.max(1,Math.round((b||0)/1024))+" KB";
const can=p=>SB.can(D.me,p);
const isAdmin=()=>can("*");
const IMGS={team:"team.webp",onboarding:"onboarding.webp",design:"design.webp",leadership:"leadership.webp",workspace:"workspace.webp",kitchen:"kitchen.jpg",living:"living.jpg",wardrobe:"wardrobe.jpg",shelves:"shelves.jpg",bedroom:"bedroom.jpg"};
const img=k=>"../assets/images/"+(IMGS[k]||IMGS.team);
function fileUrl(u){if(!u)return"";u=String(u);if(u.startsWith("idb:"))return SB.files.cached(u);if(/^https:\/\//i.test(u))return u;if(u.startsWith("assets/"))return"../"+u;if(u.startsWith("blob:"))return u;return""}
function toast(m){const e=$("#toast");e.innerHTML=I("check")+"<span></span>";e.querySelector("span").textContent=m;e.classList.add("on");clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove("on"),2600)}
const IC={
 panel:'<rect x="3" y="3" width="7" height="9" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="16" width="7" height="5" rx="2"/>',
 home:'<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',bell:'<path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4Z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
 grid:'<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
 folder:'<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',shield:'<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6Z"/><path d="m9 12 2 2 4-4"/>',
 building:'<path d="M4 21V5l8-3 8 3v16"/><path d="M9 21v-5h6v5M8 8h.01M12 8h.01M16 8h.01M8 12h.01M12 12h.01M16 12h.01"/>',chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
 inbox:'<path d="M3 13h5l2 3h4l2-3h5"/><path d="M5 5h14l2 8v6H3v-6Z"/>',palette:'<path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5S14 15 15 15h2a4 4 0 0 0 4-4c0-4.5-4-8-9-8Z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/>',
 cog:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z"/>',
 search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',close:'<path d="M6 6l12 12M18 6 6 18"/>',
 moon:'<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
 mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',cap:'<path d="m2 9 10-5 10 5-10 5Z"/><path d="M6 11v5c3 2.5 9 2.5 12 0v-5"/>',
 globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',pin:'<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
 finger:'<path d="M12 11v4M8.5 7.5A5 5 0 0 1 17 11v2M7 11a5 5 0 0 1 .3-1.7M7 14v-3M10 19c.6-1.2 1-2.6 1-4M14 19.5c.6-1.5 1-3.2 1-5M17 17c.1-.6.1-1.3.1-2M5 17c.5-1 1-2 1-4"/>',
 file:'<path d="M14 3H6v18h12V7Z"/><path d="M14 3v4h4M9 13h6M9 17h6"/>',ext:'<path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/>',arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',edit:'<path d="M4 20h4L19 9l-4-4L4 16Z"/>',trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
 exit:'<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>',coin:'<circle cx="12" cy="12" r="9"/><path d="M15 9h-4a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4H9M12 6v2M12 16v2"/>',
 cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 check:'<path d="m5 12 5 5 9-10"/>',list:'<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.3-5.5 6.5-5.5s5.7 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5c2 .7 3.2 2.6 3.5 5.5"/>',
 star:'<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z"/>',heart:'<path d="M12 20s-8-4.5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6.5-8 11-8 11Z"/>',
 sparkle:'<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
 alert:'<path d="M12 3 2 20h20Z"/><path d="M12 10v4M12 17h.01"/>',copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
 more:'<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',upload:'<path d="M12 16V4M7 9l5-5 5 5M4 16v4h16v-4"/>',download:'<path d="M12 4v12M7 11l5 5 5-5M4 16v4h16v-4"/>',
 pinned:'<path d="M9 4h6l-1 6 3 3H7l3-3ZM12 13v7"/>',send:'<path d="M4 12 20 4l-6 16-3-7Z"/><path d="m11 13 9-9"/>',reply:'<path d="M9 7 4 12l5 5"/><path d="M4 12h10a6 6 0 0 1 6 6v1"/>',
 archive:'<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v10h14V9M10 13h4"/>',clip:'<path d="m20 11-8.5 8.5a5 5 0 0 1-7-7L13 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L14 7"/>',
 user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
 eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',side:'<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16"/>',
 up:'<path d="m6 15 6-6 6 6"/>',down:'<path d="m6 9 6 6 6-6"/>',undo:'<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',back:'<path d="M19 12H5M11 6l-6 6 6 6"/>',
 kanban:'<rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="10" y="4" width="5" height="10" rx="1.5"/><rect x="17" y="4" width="4" height="13" rx="1.5"/>',table:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M9 4v16"/>',
 activity:'<path d="M3 12h4l3-8 4 16 3-8h4"/>',image:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',link:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
 phone:'<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',refresh:'<path d="M20 11a8 8 0 0 0-14.5-4.5L3 9M4 13a8 8 0 0 0 14.5 4.5L21 15"/><path d="M3 4v5h5M21 20v-5h-5"/>',
 key:'<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M14 9l2 2"/>',megaphone:'<path d="M3 11v2a1 1 0 0 0 1 1h3l6 4V6L7 10H4a1 1 0 0 0-1 1Z"/><path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/>'
};
const I=(n,c="",st="")=>`<svg class="${c}" ${st?`style="${st}"`:""} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]||IC.file}</svg>`;
function waves(op=1){let p="";const W=2400;for(let i=0;i<24;i++){const y=14+i*22;let d=`M0 ${y}`;for(let x=0;x<=W;x+=300){const a=i%3?7:12;d+=` Q${x+75} ${y-a} ${x+150} ${y} T${x+300} ${y}`}p+=`<path d="${d}" stroke="rgba(255,255,255,${(i%4?.09:.17)*op})" stroke-width="${i%5?5:9}" fill="none" stroke-linecap="round"/>`}return `<svg viewBox="0 0 ${W} 540" preserveAspectRatio="none" aria-hidden="true">${p}</svg>`}
const logo=(v="white")=>`<span class="brand-logo"><img src="../assets/brand/sindbad-logo-${v}.svg" width="222" height="84" alt="السندباد · Sindbad"></span>`;
const uname=u=>u?(AR()?(u.name_ar||u.name_en):(u.name_en||u.name_ar))||u.email:"";
const dname=e=>SB.displayName(e,D.lang);
const userOf=e=>SB.list("users").find(u=>u.email===e);
function av(u,s=36){const src=u&&fileUrl(u.avatar);const ini=(uname(u)||"S").trim().charAt(0);return src?`<img class="av" src="${esc(src)}" alt="" style="width:${s}px;height:${s}px">`:`<span class="av" style="width:${s}px;height:${s}px;font-size:${Math.round(s*.42)}px">${esc(ini)}</span>`}
function addrAv(e,s=38){const u=userOf(e);if(u)return av(u,s);const d=SB.DEPTS.find(x=>x.k+"@"+SB.domain()===e);const c=d?d.c:(e.startsWith("all@")?"#9CAA12":"#62777B");return `<span class="av" style="width:${s}px;height:${s}px;background:${c}">${I(d?deptIcon(d.k):e.startsWith("all@")?"megaphone":"user","",`width:${Math.round(s*.45)}px;height:${Math.round(s*.45)}px`)}</span>`}
const deptIcon=k=>({management:"building",hr:"users",it:"grid",accounts:"coin",sales:"chart",operations:"pin",marketing:"megaphone",training:"cap",support:"cog"})[k]||"mail";
const DEPT=k=>SB.DEPTS.find(d=>d.k===k);
const dlabel=k=>{const d=DEPT(k);return d?(AR()?d.ar:d.en):(k||"—")};
const RT=k=>SB.REQ_TYPES[k];
const stChip=s=>{const x=SB.STATUS[s]||SB.STATUS.pending;return `<span class="chip ${x.tone}"><i class="d"></i>${AR()?x.ar:x.en}</span>`};
const roleChip=r=>{const x=SB.ROLES[r]||SB.ROLES.employee;return `<span class="chip ${r==="admin"?"dk":r==="employee"?"n":"b"}">${AR()?x.ar:x.en}</span>`};
const ustChip=s=>s==="active"?`<span class="chip g"><i class="d"></i>${tx("نشط","Active")}</span>`:s==="pending"?`<span class="chip w"><i class="d"></i>${tx("بانتظار التفعيل","Pending")}</span>`:`<span class="chip n"><i class="d"></i>${tx("موقوف","Disabled")}</span>`;
const branchNames=()=>SB.list("branches").slice().sort((a,b)=>(a.order||99)-(b.order||99)).map(b=>b.name_ar).concat("المقر الرئيسي");
const emptyBox=(i,t,s)=>`<div class="empty"><div class="ill">${I(i)}</div><b>${t}</b>${s?`<span class="sm">${s}</span>`:""}</div>`;
const NCATS={training_oppein:{c:"#F26B21",ar:"تدريب OPPEIN",en:"OPPEIN training"},training_sindbad:{c:"#0A8BA0",ar:"تدريبات السندباد",en:"Sindbad training"},training_external:{c:"#7B61C9",ar:"تدريبات خارجية",en:"External training"},general:{c:"#0A8BA0",ar:"عام",en:"General"},hr:{c:"#7B61C9",ar:"الموارد البشرية",en:"HR"},sales:{c:"#077585",ar:"المبيعات",en:"Sales"},training:{c:"#F26B21",ar:"التدريب",en:"Training"},celebrate:{c:"#9CAA12",ar:"تهنئة",en:"Celebration"}};
const CATS={references:{c:"#B07A4A",ar:"كتب ومراجع",en:"Books & references"},policies:{c:"#0A8BA0",ar:"اللوائح",en:"Policies"},sales:{c:"#077585",ar:"المبيعات",en:"Sales"},roles:{c:"#4FA9B8",ar:"المهام الوظيفية",en:"Job roles"},forms:{c:"#383837",ar:"النماذج",en:"Forms"},training:{c:"#F26B21",ar:"التدريب",en:"Training"},brand:{c:"#9CAA12",ar:"الهوية",en:"Brand"},other:{c:"#6B7E82",ar:"أخرى",en:"Other"}};
const NIMG={training_oppein:"onboarding",training_sindbad:"leadership",training_external:"workspace",general:"team",hr:"onboarding",sales:"design",training:"leadership",celebrate:"team"};
const byOrder=(a,b)=>(a.order||99)-(b.order||99);

/* ---------- data views ---------- */
const myDepts=()=>{const r=SB.ROLES[D.me.role];return r.depts==="*"?SB.DEPTS.map(d=>d.k):(r.depts||[])};
const visReqs=()=>{const ds=myDepts();return SB.list("requests").filter(r=>ds.includes(r.dept)).sort((a,b)=>b.createdAt-a.createdAt)};
const openReqs=()=>visReqs().filter(r=>["pending","review"].includes(r.status));
const boxes=()=>SB.boxesFor(D.me);
const unreadAll=()=>boxes().reduce((s,b)=>s+SB.mail.unread(b),0);
const pendingUsers=()=>SB.list("users").filter(u=>u.status==="pending");

/* ---------- navigation ---------- */
const NAV=[
 {g:null,it:[["overview","panel",["نظرة عامة","Overview"],null]]},
 {g:["التواصل","Communication"],it:[["mail","mail",["البريد","Mail"],null,"a"],["requests","inbox",["الطلبات","Requests"],"requests"]]},
 {g:["الأشخاص","People"],it:[["employees","users",["الموظفون","Employees"],"employees"]]},
 {g:["محتوى البوابة","Portal content"],it:[["news","bell",["الأخبار والإعلانات","News"],"content"],["docs","folder",["المكتبة","Library"],"content"],["home","home",["الصفحة الرئيسية","Home page"],"homepage"],["apps","grid",["الأنظمة والروابط","Systems & links"],"systems"],["branches","pin",["الفروع","Branches"],"content"],["company","building",["عن الشركة","Company"],"content"],["contact","phone",["التواصل والروابط","Contact & social"],"content"]]},
 {g:["النظام","System"],it:[["activity","activity",["سجل النشاط","Activity log"],"*"],["settings","cog",["الإعدادات","Settings"],"*"]]}
];
function allowed(p){if(!p)return true;if(p==="systems")return can("systems")||can("content");if(p==="homepage")return can("content")||can("eotm");return can(p)}
const navItems=()=>NAV.flatMap(g=>g.it).filter(i=>allowed(i[3]));
const TITLE=k=>{const i=NAV.flatMap(g=>g.it).find(x=>x[0]===k);return i?P(i[2]):""};
function badge(k){if(k==="mail")return unreadAll();if(k==="requests")return openReqs().length;if(k==="employees")return pendingUsers().length;return 0}
function isDark(){const h=document.documentElement;return h.dataset.theme==="dark"||(!h.dataset.theme&&matchMedia("(prefers-color-scheme:dark)").matches)}

function shell(){
  if(D.sideOpen)closeSide();
  const h=document.documentElement;h.lang=D.lang;h.dir=AR()?"rtl":"ltr";
  if(!D.me){$("#root").innerHTML=loginView();return}
  const R=SB.ROLES[D.me.role];
  $("#root").innerHTML=`<div class="app ${D.mini?"mini":""}" id="app">
  <aside class="side" id="side" role="dialog" aria-modal="true" aria-label="${tx("القائمة","Menu")}" aria-hidden="true" inert><div class="waves">${waves()}</div>
   <div class="sb-top">${logo()}<img class="sym" src="../assets/brand/sindbad-symbol.svg" alt="Sindbad"><button class="ds-side-close" data-closemenu aria-label="${tx("إغلاق القائمة","Close menu")}">${I("close")}</button></div>
   <nav id="snav" aria-label="${tx("القائمة","Navigation")}"></nav>
   <div class="sb-foot"><div class="ucard">${av(D.me,38)}<div class="nfo"><b>${esc(uname(D.me))}</b><small>${AR()?R.ar:R.en}</small></div><button data-logout title="${tx("تسجيل الخروج","Sign out")}" aria-label="${tx("تسجيل الخروج","Sign out")}">${I("exit")}</button></div></div>
  </aside>
  <div class="main"><header class="top" id="top">
   <div class="tbar">
    <button class="ib menu" data-menu aria-label="${tx("القائمة","Menu")}">${I("menu")}</button>
    <a class="tlogo" href="#overview" data-go="overview" aria-label="Sindbad">${logo()}</a>
    <nav class="tnav" id="tnav" aria-label="${tx("الأقسام","Sections")}"></nav>
    <div class="tact">
     <button class="ib" data-search aria-label="${tx("بحث","Search")}" title="${tx("بحث","Search")}">${I("search")}</button>
     <button class="ib" data-lang aria-label="Language">${AR()?"EN":"ع"}</button>
     <button class="ib" data-themebtn aria-label="Theme">${I(isDark()?"sun":"moon")}</button>
     <button class="ib" data-go="${can("requests")?"requests":"mail"}" id="bell" aria-label="${tx("التنبيهات","Notifications")}">${I("bell")}<span class="dot" id="bdot" hidden></span></button>
     <div class="tme"><button class="tav" data-meopen aria-haspopup="menu" aria-expanded="false" aria-label="${esc(uname(D.me))}">${av(D.me,40)}</button>
      <div class="tmenu" id="tmenu" role="menu" hidden><div class="tmh">${av(D.me,44)}<div><b>${esc(uname(D.me))}</b><small>${AR()?R.ar:R.en}</small></div></div>
       <a class="tmi" href="../index.html" target="_blank" rel="noopener">${I("eye")}${tx("عرض البوابة","View portal")}</a>
       <button class="tmi" data-themebtn>${I(isDark()?"sun":"moon")}${isDark()?tx("الوضع الفاتح","Light mode"):tx("الوضع الداكن","Dark mode")}</button>
       <button class="tmi" data-lang>${I("globe")}${AR()?"English":"العربية"}</button>
       <button class="tmi out" data-logout>${I("exit")}${tx("تسجيل الخروج","Sign out")}</button></div></div>
    </div>
   </div>
   <div class="ttl"><div class="crumb">${tx("لوحة التحكم","Dashboard")}<span>/</span><span id="crumb"></span></div><h1 id="ttl"></h1></div>
  </header><main class="content" id="view"></main></div></div>`;
  navRender();
  window.removeEventListener("scroll",onScroll);window.addEventListener("scroll",onScroll,{passive:true});
}
function navRender(){
  const n=$("#snav");if(!n)return;
  n.innerHTML=NAV.map(g=>{const its=g.it.filter(i=>allowed(i[3]));if(!its.length)return"";return (g.g?`<div class="grp">${P(g.g)}</div>`:"")+its.map(([k,ic,l,,a])=>{const b=badge(k);return `<button class="ni ${D.view===k?"on":""} ${b?"dot":""}" data-go="${k}" title="${P(l)}">${I(ic)}<span>${P(l)}</span>${b?`<em class="${a||""}">${b>99?"99+":b}</em>`:""}</button>`}).join("")}).join("");
  const bd=$("#bdot");if(bd)bd.hidden=!(openReqs().length&&can("requests"));
  const tn=$("#tnav");if(tn){const gs=NAV.map(g=>({g:g.g,its:g.it.filter(i=>allowed(i[3]))})).filter(g=>g.its.length);
   const pill=([k,ic,l])=>{const b=badge(k);return `<button class="npill ${D.view===k?"on":""}" data-go="${k}" ${D.view===k?'aria-current="page"':""}>${I(ic)}<span>${P(l)}</span>${b?`<em>${b>99?"99+":b}</em>`:""}</button>`};
   tn.innerHTML=gs.map((g,gi)=>gi<=2||g.its.length<2?g.its.map(pill).join(""):(()=>{const on=g.its.some(i=>i[0]===D.view),cur=g.its.find(i=>i[0]===D.view);return `<div class="tdd"><button class="npill ${on?"on":""}" data-tdd aria-haspopup="menu" aria-expanded="false">${I((cur||g.its[0])[1])}<span>${on?P(cur[2]):P(g.g)}</span>${I("down","chev")}</button><div class="tddm" role="menu">${g.its.map(([k,ic,l])=>`<button class="tdi ${D.view===k?"on":""}" data-go="${k}" role="menuitem">${I(ic)}<span>${P(l)}</span></button>`).join("")}</div></div>`})()).join("")}
}
function onScroll(){const t=$("#top");if(t)t.classList.toggle("sc",window.scrollY>4)}
function go(v,replace=false){if(!VIEWS[v]||!navItems().some(i=>i[0]===v))v="overview";D.view=v;if(v!=="mail")D.mthread=null;try{if(location.hash!=="#"+v)history[replace?"replaceState":"pushState"](null,"","#"+v)}catch(e){}closeSide();render(true);window.scrollTo({top:0,behavior:"instant"})}
function render(anim){
  if(!D.me){shell();return}
  if(!$("#view"))shell();
  $("#ttl").textContent=TITLE(D.view);$("#crumb").textContent=TITLE(D.view);{const ap=$("#app");if(ap)ap.dataset.view=D.view}
  const el=$("#view");el.classList.remove("view-enter");el.innerHTML=VIEWS[D.view]();
  if(anim){void el.offsetWidth;el.classList.add("view-enter")}
  (AFTER[D.view]||(()=>{}))();navRender();
}
function softRender(){if($("#drawer").classList.contains("open")){navRender();return}const y=window.scrollY;render(false);window.scrollTo({top:y,behavior:"instant"})}
function openSide(){if(D.sideOpen)return;D.sideOpen=true;D.sideFocus=document.activeElement;D.sideOverflow=document.body.style.overflow;$("#app").classList.add("open");$("#scrim").classList.add("on");$("#side").inert=false;$("#side").setAttribute("aria-hidden","false");$(".main").inert=true;document.body.style.overflow="hidden";$("[data-closemenu]").focus()}
function closeSide(){const a=$("#app");if(a)a.classList.remove("open");const side=$("#side"),main=$(".main");if(side){side.inert=true;side.setAttribute("aria-hidden","true")}if(main)main.inert=false;if(D.sideOpen){document.body.style.overflow=D.sideOverflow||"";D.sideOpen=false;if(D.sideFocus?.isConnected)D.sideFocus.focus()}if(!$("#drawer").classList.contains("open"))$("#scrim").classList.remove("on")}

/* ---------- drawer / confirm / palette ---------- */
function drawer(title,body,foot,o={}){$("#dTitle").textContent=title;$("#dSub").textContent=o.sub||"";$("#dBody").innerHTML=body;$("#dFoot").innerHTML=foot||"";$("#dFoot").hidden=!foot;$("#drawer").classList.toggle("wide",!!o.wide);$("#drawer").classList.add("open");$("#scrim").classList.add("on");$("#dClose").innerHTML=I("close");$("#dBody").scrollTop=0}
function closeDrawer(){$("#drawer").classList.remove("open");$("#scrim").classList.remove("on");setTimeout(()=>{if(!$("#drawer").classList.contains("open"))$("#dBody").innerHTML=""},350);softRender()}
function confirmBox(t,p,yes){return new Promise(r=>{$("#cfmT").textContent=t;$("#cfmP").textContent=p;$("#cfmY").textContent=yes||tx("حذف","Delete");$("#cfmN").textContent=tx("إلغاء","Cancel");const d=$("#cfm");d.showModal();$("#cfmY").onclick=()=>{d.close();r(true)};$("#cfmN").onclick=()=>{d.close();r(false)}})}
let PI=[],PS=0;
function pindex(){const it=[];
 navItems().forEach(([k,ic,l])=>it.push({i:ic,c:"#08343B",l:P(l),k:tx("صفحة","Page"),a:()=>go(k)}));
 if(can("employees"))SB.list("users").forEach(u=>it.push({i:"user",c:"#0A8BA0",l:uname(u),kw:u.email+" "+u.name_ar+" "+u.name_en+" "+(u.empNo||""),k:tx("موظف","Employee"),a:()=>{go("employees");editUser(u.id)}}));
 if(can("requests"))visReqs().forEach(r=>it.push({i:RT(r.type).i,c:RT(r.type).c,l:(AR()?RT(r.type).ar:RT(r.type).en)+" · "+r.no,kw:r.no+" "+dname(r.email),k:tx("طلب","Request"),a:()=>{go("requests");openReq(r.id)}}));
 if(can("content")){SB.list("news").forEach(n=>it.push({i:"bell",c:"#7B61C9",l:L(n,"title"),k:tx("خبر","News"),a:()=>{go("news");editNews(n.id)}}));SB.list("docs").forEach(d=>it.push({i:"file",c:"#383837",l:L(d,"title"),k:tx("مستند","Document"),a:()=>{go("docs");editDoc(d.id)}}))}
 it.push({i:"edit",c:"#2F9E57",l:tx("رسالة جديدة","New message"),k:tx("البريد","Mail"),a:()=>compose()});
 return it}
function rPal(){const q=$("#palQ").value.trim().toLowerCase();PI=pindex().filter(i=>!q||(i.l+" "+(i.kw||"")+" "+i.k).toLowerCase().includes(q)).slice(0,14);PS=Math.min(PS,Math.max(0,PI.length-1));
 $("#palL").innerHTML=PI.length?PI.map((i,n)=>`<li class="${n===PS?"sel":""}" data-pi="${n}"><span class="ic sm" style="background:${esc(i.c)}">${I(i.i)}</span><span>${esc(i.l)}</span><em>${i.k}</em></li>`).join(""):`<li class="muted">${tx("لا نتائج.","No results.")}</li>`;
 const s=$("#palL .sel");if(s)s.scrollIntoView({block:"nearest"})}
function openPal(){if(!D.me)return;$("#palI").innerHTML=I("search");$("#palQ").value="";$("#palQ").placeholder=tx("ابحث في لوحة التحكم…","Search the dashboard…");PS=0;rPal();$("#pal").showModal();$("#palQ").focus()}
function runPal(n){const i=PI[n];if(!i)return;$("#pal").close();setTimeout(i.a,40)}

/* ---------- login ---------- */
const DEMO=[["admin","Admin@2026",["مدير النظام — كل الصلاحيات","Administrator — full access"]],["maryam.albalushi","Sindbad@2026",["الموارد البشرية — الطلبات والموظفون","HR — requests & people"]],["salim.alharthi","Sindbad@2026",["التقنية — الحسابات والأنظمة","IT — accounts & systems"]],["noura.alkindi","Sindbad@2026",["محررة المحتوى — الأخبار والمكتبة","Content editor — news & library"]]];
function loginView(){
 const pend=SB.list("requests").filter(r=>["pending","review"].includes(r.status)).length,acts=SB.list("users").filter(u=>u.status==="active").length;
 const wave=(y,a,ph)=>{let d="";for(let x=-300;x<=1100;x+=16){d+=(d?" L":"M")+x+" "+(y+a*Math.sin((x+ph)/160*Math.PI*2)).toFixed(1)}return d};
 const lines=Array.from({length:16},(_,i)=>`<path pathLength="1" d="${wave(150+i*38,6+(i%4)*3,i*37)}" style="--i:${i}"/>`).join("");
 return `<section class="signin">
 <aside class="sg-art" aria-hidden="true">
  <svg class="sg-w" viewBox="0 0 800 900" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="sgG" x1="0" x2="1"><stop offset="0" stop-color="#70CDDD"/><stop offset="1" stop-color="#0A8BA0"/></linearGradient></defs>${lines}</svg>
  <div class="sg-top">${logo()}</div>
  <div class="sg-card">
   <div class="sg-ch"><span class="sg-dot"></span>${tx("اليوم في البوابة","Today on the portal")}</div>
   <div class="sg-stats"><div><b class="tnum">${pend}</b><span>${tx("طلبات تنتظر القرار","requests awaiting a decision")}</span></div><div><b class="tnum">${acts}</b><span>${tx("موظفًا نشطًا","active employees")}</span></div></div>
  </div>
  <div class="sg-copy"><h2>${tx("مكان واحد لإدارة البوابة الداخلية للسندباد.","One place to run Sindbad’s internal portal.")}</h2><p>${tx("الطلبات، والبريد، والموظفون، وكل محتوى البوابة.","Requests, mail, people and every page of the portal.")}</p></div>
 </aside>
 <main class="sg-pane">
  <div class="sg-bar"><a class="sg-back" href="../index.html">${I("arrow")}<span>${tx("العودة للبوابة","Back to portal")}</span></a><div class="sg-tools"><button class="sg-ib" data-lang aria-label="Language">${AR()?"EN":"ع"}</button><button class="sg-ib" data-themebtn aria-label="Theme">${I(isDark()?"sun":"moon")}</button></div></div>
  <div class="sg-form">
   <img class="sg-sym" src="../assets/brand/sindbad-symbol.svg" alt="">
   <h1>${tx("تسجيل الدخول","Sign in")}</h1>
   <p class="sg-sub">${tx("لوحة التحكم مخصصة للموظفين الإداريين.","The dashboard is for admin staff.")}</p>
   <form id="dlogin" novalidate><div id="derr"></div>
    <label class="sg-f"><span class="sg-l">${tx("البريد الإلكتروني","Work email")}</span><span class="sg-in sg-em" dir="ltr"><input id="dE" autocomplete="username" placeholder="name" spellcheck="false"><em>@${esc(SB.domain())}</em></span></label>
    <div class="sg-f"><span class="sg-lr"><label class="sg-l" for="dP">${tx("كلمة المرور","Password")}</label><button type="button" class="sg-link" data-forgot>${tx("نسيت كلمة المرور؟","Forgot password?")}</button></span><span class="sg-in"><input id="dP" type="password" autocomplete="current-password" dir="ltr"><button type="button" class="sg-eye" data-dpw aria-label="${tx("إظهار كلمة المرور","Show password")}">${I("eye")}</button></span></div>
    <label class="sg-rem"><input type="checkbox" checked><span>${tx("تذكرني على هذا الجهاز","Keep me signed in on this device")}</span></label>
    <button class="sg-go" type="submit"><span>${tx("دخول","Sign in")}</span>${I("arrow","flip")}</button>
   </form>
   <div class="sg-or"><span>${tx("أو جرّب بحساب تجريبي","or try a demo account")}</span></div>
   <div class="sg-demo">${DEMO.map(([e,p,l])=>{const [role,scope]=P(l).split(" — ");return `<button type="button" data-demo="${e}|${p}" title="${esc(e)}@${esc(SB.domain())}"><span class="sg-av">${esc((e[0]||"").toUpperCase())}</span><span class="sg-dt"><b>${esc(role)}</b><small>${esc(scope||"")}</small></span></button>`}).join("")}</div>
  </div>
  <p class="sg-foot">${tx("موظف جديد؟","New employee?")} <a href="../index.html#register">${tx("أنشئ حسابك من البوابة","Create your account on the portal")}</a></p>
 </main>
</section>`}
document.addEventListener("click",e=>{const t=e.target.closest("[data-dpw],.signin [data-forgot]");if(!t)return;
 if(t.matches("[data-dpw]")){const i=$("#dP");i.type=i.type==="password"?"text":"password";t.setAttribute("aria-pressed",i.type==="text")}
 else toast(tx("لإعادة تعيين كلمة المرور راسل قسم التقنية: it@","To reset your password, email IT: it@")+SB.domain())});
async function doLogin(){const e=$("#dE").value.trim(),p=$("#dP").value,box=$("#derr");if(!e||!p){box.innerHTML=ferr(tx("أدخل البريد وكلمة المرور.","Enter email and password."));return}
 try{D.me=await SB.auth.login(e,p,"dashboard");D.mbox="";shell();go(location.hash.slice(1)||"overview");toast(tx("أهلًا ","Welcome, ")+uname(D.me))}
 catch(er){box.innerHTML=ferr({invalid:tx("البريد أو كلمة المرور غير صحيحة.","Wrong email or password."),forbidden:tx("هذا الحساب لا يملك صلاحية لوحة التحكم.","This account has no dashboard access."),pending:tx("الحساب بانتظار التفعيل.","Account awaiting activation."),disabled:tx("الحساب موقوف.","Account disabled.")}[er.code]||tx("تعذّر الدخول.","Couldn’t sign in."))}}
const ferr=m=>`<div class="ferr" role="alert">${I("alert")}<span>${esc(m)}</span></div>`;

/* ================= VIEWS ================= */
const VIEWS={},AFTER={};

/* ---- charts ---- */
function series(items,days,keyAt="createdAt"){const out=Array(days).fill(0);const start=new Date();start.setHours(0,0,0,0);const s0=start.getTime()-(days-1)*DAY;items.forEach(x=>{const t=x[keyAt];if(!t||t<s0)return;const i=Math.floor((t-s0)/DAY);if(i>=0&&i<days)out[i]++});return out}
function spark(arr,c="#0A8BA0"){const w=200,h=56,mx=Math.max(1,...arr),st=w/(arr.length-1||1);const pts=arr.map((v,i)=>[i*st,h-6-(v/mx)*(h-16)]);const d=pts.map((p,i)=>(i?"L":"M")+p[0].toFixed(1)+" "+p[1].toFixed(1)).join(" ");const id="g"+Math.random().toString(36).slice(2,7);
 return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}" stop-opacity=".22"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></linearGradient></defs><path d="${d} L${w} ${h} L0 ${h}Z" fill="url(#${id})"/><path d="${d}" fill="none" stroke="${c}" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>`}
function stacked(reqs,days){const types=Object.keys(SB.REQ_TYPES);const start=new Date();start.setHours(0,0,0,0);const s0=start.getTime()-(days-1)*DAY;
 const cols=Array.from({length:days},()=>Object.fromEntries(types.map(t=>[t,0])));reqs.forEach(r=>{const i=Math.floor((r.createdAt-s0)/DAY);if(i>=0&&i<days)cols[i][r.type]++});
 const mx=Math.max(2,...cols.map(c=>types.reduce((s,t)=>s+c[t],0)));const W=720,H=220,pl=26,pb=26,cw=(W-pl)/days,bw=Math.max(6,cw*.56);
 let g="";for(let k=0;k<=mx;k+=Math.max(1,Math.ceil(mx/4))){const y=H-pb-(k/mx)*(H-pb-14);g+=`<line class="gl" x1="${pl}" x2="${W}" y1="${y}" y2="${y}"/><text class="axis" x="${AR()?W:0}" y="${y+3}" text-anchor="${AR()?"end":"start"}">${k}</text>`}
 let b="";cols.forEach((c,i)=>{let y=H-pb;const x=AR()?W-(i+1)*cw+(cw-bw)/2-0:pl+i*cw+(cw-bw)/2;types.forEach(t=>{if(!c[t])return;const h=(c[t]/mx)*(H-pb-14);y-=h;b+=`<rect class="b" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(2,h-1.5).toFixed(1)}" rx="3" fill="${RT(t).c}"><title>${AR()?RT(t).ar:RT(t).en}: ${c[t]}</title></rect>`});
  if(i%5===0||i===days-1){const d=new Date(s0+i*DAY);b+=`<text class="axis" x="${(x+bw/2).toFixed(1)}" y="${H-8}" text-anchor="middle">${d.toLocaleDateString(loc(),{day:"numeric",month:"short"})}</text>`}});
 return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${tx("الطلبات اليومية","Daily requests")}">${g}${b}</svg>`}
function donut(parts){const tot=parts.reduce((s,p)=>s+p.v,0)||1;const R=62,C=2*Math.PI*R;let off=0;
 const segs=parts.filter(p=>p.v).map(p=>{const l=p.v/tot*C;const s=`<circle cx="85" cy="85" r="${R}" fill="none" stroke="${p.c}" stroke-width="20" stroke-dasharray="${Math.max(0,l-3)} ${C}" stroke-dashoffset="${-off}" transform="rotate(-90 85 85)"><title>${p.l}: ${p.v}</title></circle>`;off+=l;return s}).join("");
 return `<svg viewBox="0 0 170 170"><circle cx="85" cy="85" r="${R}" fill="none" stroke="var(--surface2)" stroke-width="20"/>${segs}<text x="85" y="82" text-anchor="middle" font-family="Alexandria" font-weight="200" font-size="34" fill="var(--ink)">${tot===1&&!parts.some(p=>p.v)?0:parts.reduce((s,p)=>s+p.v,0)}</text><text x="85" y="104" text-anchor="middle" font-size="11" fill="var(--muted)">${tx("طلب","requests")}</text></svg>`}
function delta(arr){const a=arr.slice(-7).reduce((s,v)=>s+v,0),b=arr.slice(-14,-7).reduce((s,v)=>s+v,0);if(!a&&!b)return"";if(!b)return `<span class="delta up">${I("up","","width:14px;height:14px")}+${a} <span class="muted" style="font-weight:400">${tx("هذا الأسبوع","this week")}</span></span>`;const up=a>=b;const p=Math.min(999,Math.round((a-b)/b*100));return `<span class="delta ${up?"up":"dn"}">${I(up?"up":"down","","width:14px;height:14px")}${Math.abs(p)}% <span class="muted" style="font-weight:400">${tx("عن الأسبوع الماضي","vs last week")}</span></span>`}

/* ---- OVERVIEW ---- */
const ACT={login:["سجّل الدخول للبوابة","signed in to the portal","user","#62777B"],login_dash:["دخل لوحة التحكم","opened the dashboard","panel","#08343B"],register:["أنشأ حسابًا جديدًا","created an account","user","#0A8BA0"],request_new:["قدّم طلبًا","submitted a request","inbox","#0A8BA0"],request_approved:["اعتمد طلبًا","approved a request","check","#3E9B2F"],request_rejected:["رفض طلبًا","declined a request","close","#D93B41"],request_review:["حوّل طلبًا للمراجعة","moved a request to review","clock","#C98A12"],request_cancelled:["ألغى طلبًا","cancelled a request","close","#62777B"],request_pending:["أعاد فتح طلب","reopened a request","undo","#0A8BA0"],news_new:["نشر خبرًا","published news","bell","#7B61C9"],news_edit:["عدّل خبرًا","edited news","edit","#7B61C9"],news_del:["حذف خبرًا","deleted news","trash","#D93B41"],doc_new:["أضاف مستندًا","added a document","file","#383837"],doc_edit:["عدّل مستندًا","edited a document","file","#383837"],doc_del:["حذف مستندًا","deleted a document","trash","#D93B41"],app_new:["أضاف نظامًا","added a system","grid","#0A8BA0"],app_edit:["عدّل نظامًا","edited a system","grid","#0A8BA0"],app_del:["حذف نظامًا","deleted a system","trash","#D93B41"],branch_new:["أضاف فرعًا","added a branch","pin","#2F9E57"],branch_edit:["عدّل فرعًا","edited a branch","pin","#2F9E57"],branch_del:["حذف فرعًا","deleted a branch","trash","#D93B41"],reminder_new:["أضاف شريحة للرئيسية","added a home slide","home","#B07A4A"],reminder_edit:["عدّل شريحة الرئيسية","edited a home slide","home","#B07A4A"],reminder_del:["حذف شريحة","deleted a slide","trash","#D93B41"],reminder_order:["أعاد ترتيب الشرائح","reordered slides","home","#B07A4A"],eotm:["حدّث موظف الشهر","updated employee of the month","star","#9CAA12"],company:["عدّل صفحة الشركة","edited the company page","building","#08343B"],leader_edit:["عدّل القيادة","edited leadership","users","#08343B"],contact:["عدّل بيانات التواصل","edited contact details","phone","#08343B"],settings:["عدّل الإعدادات","changed settings","cog","#383837"],user_new:["أضاف موظفًا","added an employee","user","#0A8BA0"],user_edit:["عدّل بيانات موظف","edited an employee","user","#0A8BA0"],user_approve:["فعّل حسابًا","activated an account","check","#3E9B2F"],user_reject:["رفض تسجيلًا","rejected a registration","close","#D93B41"],user_del:["حذف حسابًا","deleted an account","trash","#D93B41"],password:["غيّر كلمة المرور","changed password","lock","#62777B"],reset_pw:["أعاد تعيين كلمة مرور","reset a password","key","#C98A12"],mail:["أرسل رسالة","sent a message","mail","#2F9E57"],broadcast:["أرسل تعميمًا لكل الموظفين","sent a staff-wide notice","megaphone","#E08A1E"]};
function actRow(a){const x=ACT[a.action]||["قام بإجراء","did something","sparkle","#62777B"];return `<div class="fi"><span class="ic" style="background:${x[3]}">${I(x[2])}</span><p><b>${esc(dname(a.actor))}</b> ${P([x[0],x[1]])}${a.target?` <span class="${/[\u0600-\u06FF]/.test(a.target)?"":"mono "}muted">${esc(a.target)}</span>`:""}</p><time>${ago(a.at)}</time></div>`}
VIEWS.overview=()=>{
 const hasR=can("requests"),hasE=can("employees"),hasC=can("content"),me=D.me,now=new Date();
 const first=uname(me).split(/\s+/)[0],reqs=visReqs(),open=openReqs().sort((a,b)=>a.createdAt-b.createdAt),un=unreadAll();
 const people=SB.users().filter(u=>u.status==="active"),pending=pendingUsers(),news=SB.list("news"),docs=SB.list("docs");
 const allMsgs=SB.list("messages").filter(m=>boxes().some(b=>m.to.includes(b)));
 const threads=boxes().flatMap(b=>SB.mail.threads(b,"inbox").map(t=>({...t,box:b}))).sort((a,b)=>b.last.at-a.last.at).filter((t,i,a)=>a.findIndex(x=>x.id===t.id)===i).slice(0,4);
 const acts=SB.list("activity").filter(a=>isAdmin()||a.actor===me.email||a.action.startsWith("request_")&&reqs.some(r=>r.no===a.target)).sort((a,b)=>b.at-a.at).slice(0,4);
 const oldest=open[0],oldDays=oldest?Math.max(0,Math.floor((Date.now()-oldest.createdAt)/DAY)):0;
 const metrics=[];
 const metric=(view,icon,label,n,note,tone="sea",extra="")=>`<button class="ds-metric ${tone}" data-go="${view}" ${extra}><span class="ds-metric-head"><span>${label}</span><i>${I(icon)}</i></span><b>${fmt(n)}</b><span class="ds-metric-foot">${note}${I("arrow","flip")}</span></button>`;
 if(hasR)metrics.push(metric("requests","inbox",tx("بانتظار القرار","Awaiting a decision"),open.length,oldest?tx(`أقدم طلب منذ ${oldDays} يوم`, `Oldest request: ${oldDays} days`):tx("كل الطلبات محسومة","All caught up"),"sea"));
 metrics.push(metric("mail","mail",tx("محادثات غير مقروءة","Unread conversations"),un,tx("في صناديقك الداخلية","Across your mailboxes"),"blue"));
 if(hasE){metrics.push(metric("employees","users",tx("زملاء نشطون","Active colleagues"),people.length,tx("دليل فريق السندباد","Your Sindbad team"),"olive"));metrics.push(metric("employees","user",tx("بانتظار التفعيل","Awaiting activation"),pending.length,tx("راجع الحسابات الجديدة","Review new accounts"),"sand",'data-pending-users="true"'))}
 if(hasC&&metrics.length<4){metrics.push(metric("news","bell",tx("أخبار منشورة","Published news"),news.filter(n=>!n.draft).length,tx("آخر أخبار الشركة","Latest company updates"),"olive"));metrics.push(metric("docs","folder",tx("مستندات المكتبة","Library documents"),docs.length,tx("معرفة متاحة للفريق","Knowledge for the team"),"sand"));if(metrics.length<4)metrics.push(metric("news","edit",tx("مسودات الأخبار","News drafts"),news.filter(n=>n.draft).length,tx("تنتظر المراجعة والنشر","Ready for review"),"sea"))}
 const series14=hasR?series(reqs,14):series(allMsgs,14,"at"),max=Math.max(1,...series14),sum=series14.reduce((a,b)=>a+b,0);
 const chart=series14.map((n,i)=>{const d=new Date();d.setDate(d.getDate()-13+i);const label=d.toLocaleDateString(loc(),{day:"numeric",month:"short"});return `<div class="ds-bar-col" tabindex="0" aria-label="${esc(label)}: ${n}"><span class="ds-chart-tip">${esc(label)} · ${n}</span><div class="ds-bar-slot"><i style="height:${n?Math.max(5,n/max*100):2}%" class="${n===max&&n?"peak":""} ${!n?"zero":""}"></i></div><small>${i%3===0||i===13?d.getDate():""}</small></div>`}).join("");
 const statuses=Object.entries(SB.STATUS).map(([k,v])=>({key:k,name:AR()?v.ar:v.en,n:reqs.filter(r=>r.status===k).length,color:{pending:"#C3A45C",review:"#0A8BA0",approved:"#618F72",rejected:"#BA6970",cancelled:"#99AAA7"}[k]}));
 let stop=0;const conic=statuses.filter(x=>x.n).map(x=>{const from=stop;stop+=x.n/Math.max(1,reqs.length)*100;return `${x.color} ${from}% ${stop}%`}).join(",")||"var(--surface3) 0% 100%";
 const branches={};people.forEach(u=>{const b=u.branch||tx("غير محدد","Unassigned");branches[b]=(branches[b]||0)+1});
 const branchRows=Object.entries(branches).sort((a,b)=>b[1]-a[1]).slice(0,5);
 const cardHead=(label,sub,view)=>`<header class="ds-card-head"><div><h3>${label}</h3><p>${sub}</p></div>${view?`<button class="ds-link" data-go="${view}">${tx("عرض الكل","View all")}${I("arrow","flip")}</button>`:""}</header>`;
 const queue=hasR?`<section class="ds-card ds-queue">${cardHead(tx("يحتاج انتباهك","Needs your attention"),tx("الطلبات المفتوحة، الأقدم أولًا","Open requests, oldest first"),"requests")}<div class="ds-queue-list">${open.length?open.slice(0,5).map(r=>{const u=userOf(r.email),days=Math.max(0,Math.floor((Date.now()-r.createdAt)/DAY));return `<button class="ds-task" data-req="${r.id}">${av(u||{name_ar:r.email},38)}<span class="ds-task-person"><b>${esc(uname(u)||r.email)}</b><small>${esc(r.branch||"")}</small></span><span class="ds-task-type">${AR()?RT(r.type).ar:RT(r.type).en}<small class="mono">${esc(r.no)}</small></span><span class="ds-task-status">${stChip(r.status)}<small>${days?tx(`منذ ${days} يوم`,`${days} days ago`):tx("اليوم","Today")}</small></span><span class="ds-task-arrow">${I("arrow","flip")}</span></button>`}).join(""):emptyBox("check",tx("أنجزت كل ما ينتظرك","You are all caught up"),tx("ستظهر الطلبات الجديدة هنا فور وصولها.","New requests will appear here as they arrive."))}</div>${oldest?`<div class="ds-queue-footer"><span><i></i>${tx("ابدأ بالأقدم لتقليل وقت الانتظار","Start with the oldest to shorten waiting time")}</span><button data-req="${oldest.id}">${tx("مراجعة الطلب","Review request")}${I("arrow","flip")}</button></div>`:""}</section>`:
 `<section class="ds-card ds-queue">${cardHead(tx("غرفة التحرير","Your editorial desk"),tx("أحدث محتوى الشركة في مكان واحد","The latest company content in one place"),"news")}<div class="ds-editor-list">${news.slice().sort((a,b)=>(b.at||b.createdAt)-(a.at||a.createdAt)).slice(0,4).map(n=>`<button data-editnews="${esc(n.id)}"><span class="ds-news-symbol">${I("bell")}</span><span><b>${esc(L(n,"title"))}</b><small>${fdate(n.at||n.createdAt)}</small></span><span class="chip ${n.draft?"w":"g"}">${n.draft?tx("مسودة","Draft"):tx("منشور","Published")}</span></button>`).join("")||emptyBox("bell",tx("ابدأ أول خبر للفريق","Publish the team's first update"))}</div></section>`;
 return `<div class="ds-overview">
  <div class="ds-page-label"><span>${tx("مساحة الإدارة","Management workspace")}<i>/</i>${tx("نظرة عامة","Overview")}</span><span>${now.toLocaleDateString(loc(),{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</span></div>
  <section class="ds-welcome"><div class="ds-welcome-pattern" aria-hidden="true">${waves(.6)}</div><div class="ds-welcome-copy"><span class="ds-eyebrow"><i></i> SINDBAD INSIDE</span><h2>${now.getHours()<12?tx("صباح الخير، ","Good morning, "):tx("مساء الخير، ","Good evening, ")}<strong>${esc(first)}.</strong></h2><p>${hasR?tx(`لديك ${open.length} طلب قيد المتابعة. لنمنح فريقك بداية أفضل.`,`${open.length} requests need follow-up. Give your team a better start.`):tx("مساحتك لصناعة تجربة أفضل لكل زميل في السندباد.","Your space to create a better experience for every colleague.")}</p><div class="ds-welcome-actions"><button class="ds-primary" data-go="${hasR?"requests":"news"}">${tx(hasR?"راجع الطلبات":"إدارة المحتوى",hasR?"Review requests":"Manage content")}${I("arrow","flip")}</button><button class="ds-secondary" ${hasC?"data-newnews":"data-compose"}>${I(hasC?"plus":"edit")}${hasC?tx("خبر جديد","New announcement"):tx("رسالة جديدة","New message")}</button></div></div><div class="ds-welcome-aside"><span class="ds-welcome-symbol"><img src="../assets/brand/sindbad-symbol.svg" alt=""></span><span>${tx("فريق واحد. رؤية واحدة.","One team. One vision.")}</span><small>BUILD YOUR DREAM</small></div></section>
  <div class="ds-metrics">${metrics.slice(0,4).join("")}</div>
  <div class="ds-main-grid">${queue}<section class="ds-card ds-volume">${cardHead(hasR?tx("حركة الطلبات","Request activity"):tx("حركة الرسائل","Message activity"),tx("آخر 14 يومًا · العدد اليومي","Last 14 days · daily count"),null)}<div class="ds-volume-total"><b>${fmt(sum)}</b><span>${hasR?tx("طلب وارد","requests received"):tx("رسالة واردة","messages received")}</span><span class="ds-period">14 ${tx("يومًا","days")}</span></div><div class="ds-chart" role="group" aria-label="${tx("العدد اليومي خلال آخر 14 يومًا","Daily count for the last 14 days")}"><div class="ds-chart-axis"><span>${max}</span><span>${max/2}</span><span>0</span></div><div class="ds-bars">${chart}</div></div><div class="ds-chart-note"><i></i>${hasR?tx("عدد الطلبات التي وصلت يوميًا","Number of requests received each day"):tx("عدد الرسائل التي وصلت يوميًا","Number of messages received each day")}</div></section></div>
  <div class="ds-lower-grid">
   <section class="ds-card ds-inbox">${cardHead(tx("آخر المحادثات","Recent conversations"),tx("ابقَ قريبًا من فريقك","Stay close to your team"),"mail")}<div class="ds-conversations">${threads.length?threads.map(t=>{const cp=t.last.from===t.box?t.people.find(p=>p!==t.box)||t.box:t.last.from;return `<button class="ds-conversation" data-openmail="${esc(t.box)}|${esc(t.id)}">${addrAv(cp,38)}<span><b>${esc(t.subject)}</b><small>${esc(dname(cp))} · ${esc(dname(t.box))}</small></span><span class="ds-conv-time">${ago(t.last.at)}${t.unread?'<i class="ds-unread"></i>':""}</span></button>`}).join(""):emptyBox("mail",tx("لا محادثات بعد","No conversations yet"))}</div></section>
   ${hasR?`<section class="ds-card ds-status">${cardHead(tx("الصورة الكاملة","At a glance"),tx("حالات الطلبات في نطاقك","Request statuses in your scope"),null)}<div class="ds-donut" role="img" aria-label="${esc(statuses.map(x=>x.name+": "+x.n).join("، "))}" style="--segments:${conic}"><div><b>${fmt(reqs.length)}</b><span>${tx("إجمالي الطلبات","Total requests")}</span></div></div><div class="ds-status-key">${statuses.filter(x=>x.n).map(x=>`<span><i style="background:${x.color}"></i>${x.name}<b>${x.n}</b></span>`).join("")}</div></section>`:""}
   ${hasE?`<section class="ds-card ds-team">${cardHead(tx("فريقنا عبر الفروع","Our team across branches"),tx("الحسابات النشطة فقط","Active accounts only"),"employees")}<div class="ds-branches">${branchRows.map(([b,n])=>`<div><span>${esc(b)}<b>${n}</b></span><i><em style="width:${n/Math.max(1,people.length)*100}%"></em></i></div>`).join("")}</div>${pending.length?`<button class="ds-pending" data-go="employees" data-pending-users="true">${I("user")}<span>${tx(`${pending.length} حساب ينتظر التفعيل`,`${pending.length} accounts awaiting activation`)}</span>${I("arrow","flip")}</button>`:""}</section>`:`<section class="ds-card ds-activity">${cardHead(tx("آخر النشاطات","Recent activity"),tx("ما حدث في نطاقك","Activity in your scope"),isAdmin()?"activity":null)}<div class="feed">${acts.map(actRow).join("")||emptyBox("activity",tx("لا نشاط بعد","No activity yet"))}</div></section>`}
  </div>
  ${hasC?`<section class="ds-card ds-content">${cardHead(tx("بوابة تستحق فريقك","A portal for your team"),tx("اختصارات إدارة المحتوى","Content management shortcuts"),null)}<div class="ds-content-links">${[["news","bell",tx("الأخبار","News"),news.length],["docs","folder",tx("المكتبة","Library"),docs.length],["apps","grid",tx("الأنظمة","Systems"),SB.list("apps").length],["home","home",tx("الرئيسية","Home"),SB.list("reminders").length],["branches","pin",tx("الفروع","Branches"),SB.list("branches").length],["company","building",tx("الشركة","Company"),null]].map(([v,i,l,n])=>`<button data-go="${v}"><span>${I(i)}</span><b>${l}</b><small>${n??I("arrow","flip")}</small></button>`).join("")}</div></section>`:""}
  <div class="ds-endnote"><span>SINDBAD INSIDE</span><span>${tx("المؤشرات ضمن صلاحيتك · بيانات المعاينة محفوظة في هذا المتصفح","Metrics reflect your access · preview data is stored in this browser")}</span></div>
 </div>`;
};
document.addEventListener("click",e=>{const t=e.target.closest("[data-tdd]"),m=e.target.closest("[data-meopen]");
 document.querySelectorAll(".tdd.open").forEach(d=>{if(!t||d!==t.parentElement){d.classList.remove("open");d.querySelector("[data-tdd]").setAttribute("aria-expanded","false")}});
 if(t){const d=t.parentElement,o=d.classList.toggle("open");t.setAttribute("aria-expanded",String(o))}
 const tm=document.getElementById("tmenu");if(tm){if(m){tm.hidden=!tm.hidden;m.setAttribute("aria-expanded",String(!tm.hidden))}else if(!e.target.closest("#tmenu"))tm.hidden=true}},true);
document.addEventListener("keydown",e=>{if(e.key==="Escape"){document.querySelectorAll(".tdd.open").forEach(d=>d.classList.remove("open"));const tm=document.getElementById("tmenu");if(tm)tm.hidden=true}});
AFTER.overview=()=>{};

/* ---- MAIL ---- */
const MF=[["inbox","inbox",["الوارد","Inbox"]],["starred","star",["المميزة","Starred"]],["sent","send",["المرسلة","Sent"]],["archive","archive",["الأرشيف","Archive"]],["trash","trash",["المحذوفات","Trash"]]];
function curBox(){const bs=boxes();if(!bs.includes(D.mbox)){const firstDept=bs.find(b=>b!==D.me.email&&SB.mail.unread(b))||bs.find(b=>b!==D.me.email)||bs[0];D.mbox=firstDept}return D.mbox}
VIEWS.mail=()=>{
 const box=curBox(),bs=boxes(),q=D.mq.trim().toLowerCase();
 let th=SB.mail.threads(box,D.mfold);if(q)th=th.filter(t=>SB.mail.thread(t.id,box).some(m=>(m.subject+" "+m.body+" "+m.from+" "+dname(m.from)).toLowerCase().includes(q)));
 const dep=bs.filter(b=>b!==D.me.email);
 return `<div class="ph"><p>${tx("صناديق الأقسام التي تتابعها، وبريدك الشخصي. الرد يُرسل باسم الصندوق المختار.","Department mailboxes you handle, plus your own. Replies are sent from the selected mailbox.")}</p></div>
 <p class="mail-scope">${tx("معاينة المراسلات الداخلية على هذا المتصفح فقط. لم يتم تفعيل الإرسال إلى البريد الخارجي.","Internal messaging preview in this browser only. External email delivery is not connected.")}</p>
 <div class="mail ${D.mthread?"reading":""}">
  <aside class="mbx"><button class="btn p" data-compose aria-label="${tx("رسالة جديدة","New message")}">${I("edit")}<span>${tx("رسالة جديدة","Compose")}</span></button>
   ${dep.length?`<div class="gl">${tx("صناديق الأقسام","Department mailboxes")}</div>`+dep.map(b=>{const k=b.split("@")[0],d=DEPT(k),n=SB.mail.unread(b);return `<button class="f ${box===b?"on":""}" data-mbox="${esc(b)}" title="${esc(b)}"><span class="bx" style="background:${d?d.c:"#62777B"}">${I(deptIcon(k))}</span><span>${esc(dname(b))}</span>${n?`<em>${n}</em>`:""}</button>`}).join(""):""}
   <div class="gl">${tx("بريدي","My mail")}</div><button class="f ${box===D.me.email?"on":""}" data-mbox="${esc(D.me.email)}" title="${esc(D.me.email)}">${av(D.me,26)}<span>${tx("بريدي الشخصي","Personal")}</span>${SB.mail.unread(D.me.email)?`<em>${SB.mail.unread(D.me.email)}</em>`:""}</button>
   <div class="gl">${tx("المجلدات","Folders")}</div>${MF.map(([k,i,l])=>`<button class="f ${D.mfold===k?"on":""}" data-mfold="${k}" title="${P(l)}">${I(i)}<span>${P(l)}</span></button>`).join("")}
  </aside>
  <section class="mlist"><div class="mlh"><div class="top2"><b>${esc(dname(box))} · ${P(MF.find(f=>f[0]===D.mfold)[2])}</b><span class="mono muted">${esc(box)}</span></div><input class="inp" id="mq" aria-label="${tx("ابحث في البريد","Search mail")}" type="search" placeholder="${tx("ابحث…","Search…")}" value="${esc(D.mq)}"></div><div class="mrows" id="mrows">${mrows(th,box)}</div></section>
  <section class="mread">${D.mthread?thread(D.mthread,box):`<div class="mempty"><div><div class="ill">${I("mail")}</div><b style="color:var(--ink);font-weight:500">${tx("اختر محادثة","Select a conversation")}</b><p class="sm" style="margin:6px 0 0">${tx("رسائل الموظفين للقسم تظهر هنا.","Messages employees send to this department appear here.")}</p></div></div>`}</section>
 </div>`};
function mrows(th,box){if(!th.length)return emptyBox("inbox",tx("لا رسائل","No messages"));
 return th.map(t=>{const cp=t.last.from!==box?t.last.from:(t.people.find(p=>p!==box)||box);return `<div class="mrow ${t.unread?"un":""} ${D.mthread===t.id?"sel":""}" data-thread="${esc(t.id)}" tabindex="0">${addrAv(cp,38)}<div style="min-width:0"><div class="tp"><span class="nm">${esc(dname(cp))}${t.count>1?` <span class="muted" style="font-weight:400">(${t.count})</span>`:""}</span><time>${ago(t.last.at)}</time></div><div class="sb">${esc(t.subject)}</div><div class="sn">${esc(t.last.body.replace(/\s+/g," ").slice(0,110))}</div>${t.kind==="request"||t.star||t.hasFiles||t.kind==="system"?`<div class="tg">${t.kind==="request"?`<span class="chip xs">${tx("طلب","Request")}</span>`:""}${t.kind==="system"?`<span class="chip xs n">${tx("نظام","System")}</span>`:""}${t.star?I("star","","color:#E0A400"):""}${t.hasFiles?I("clip"):""}</div>`:""}</div></div>`}).join("")}
function thread(id,box){const ms=SB.mail.thread(id,box);if(!ms.length)return"";const st=m=>m.state[box]||{};
 const star=ms.some(m=>st(m).star),arch=ms.some(m=>st(m).arch),trash=ms.every(m=>st(m).trash);
 const ref=ms[0].ref&&ms[0].ref.type==="request"?SB.get("requests",ms[0].ref.id):null;
 return `<div class="mrh"><div style="display:flex;gap:10px;min-width:0"><button class="btn o icon mback" data-mback aria-label="${tx("رجوع","Back")}">${I("back","flip")}</button><div style="min-width:0"><h2>${esc(ms[0].subject)}</h2><div class="muted sm">${ms.length} ${tx("رسالة","messages")} · ${tx("في","in")} ${esc(dname(box))}</div></div></div>
  <div class="ac"><button class="btn icon sm ${star?"on":""}" data-mact="${star?"unstar":"star"}" title="${tx("تمييز","Star")}">${I("star")}</button>${trash?`<button class="btn icon sm" data-mact="restore" title="${tx("استعادة","Restore")}">${I("undo")}</button>`:`<button class="btn icon sm" data-mact="${arch?"unarchive":"archive"}" title="${tx("أرشفة","Archive")}">${I(arch?"inbox":"archive")}</button><button class="btn icon sm" data-mact="unread" title="${tx("غير مقروءة","Mark unread")}">${I("mail")}</button><button class="btn icon sm" data-mact="trash" title="${tx("حذف","Delete")}">${I("trash")}</button>`}</div></div>
 <div class="mth" id="mth">${ref?`<div class="reqcard"><span class="ic sm" style="background:${RT(ref.type).c}">${I(RT(ref.type).i)}</span><div><b>${AR()?RT(ref.type).ar:RT(ref.type).en} · <span class="mono">${esc(ref.no)}</span></b><small>${stChip(ref.status)}</small></div>${can("requests")?`<button class="btn s sm" data-req="${ref.id}">${tx("فتح الطلب","Open request")}${I("arrow","flip")}</button>`:""}</div>`:""}
 ${ms.map(m=>`<article class="msg ${m.from===box?"out":""}"><div class="mh">${addrAv(m.from,38)}<div style="min-width:0"><b>${esc(dname(m.from))}</b><small><span class="mono">${esc(m.from)}</span> → ${m.to.map(x=>esc(dname(x))).join("، ")}</small></div><time>${fdt(m.at)}</time></div><div class="mb">${esc(m.body)}</div>${m.attachments&&m.attachments.length?`<div class="atts">${m.attachments.map(f=>`<button class="att" data-att="${esc(f.ref)}" data-name="${esc(f.name)}">${I("clip")}<span>${esc(f.name)}</span><small class="muted">${fsize(f.size)}</small></button>`).join("")}</div>`:""}</article>`).join("")}</div>
 ${trash||!SB.mail.replyRecipients(id,box).length?"":`<div class="mrep"><form id="dreply"><div class="from">${tx("الرد من","Reply from")} <b>${esc(box)}</b></div><div class="reply-to">${tx("إلى: ","To: ")}${SB.mail.replyRecipients(id,box).map(x=>esc(dname(x))).join("، ")}</div><textarea id="drBody" aria-label="${tx("الرد","Reply")}" placeholder="${tx("اكتب ردك…","Write a reply…")}">${esc(D.replyDraft&&D.replyDraft.id===id&&D.replyDraft.box===box?D.replyDraft.v:"")}</textarea><div class="rb">${[[ "تم استلام رسالتك وجارٍ المتابعة.","We received your message and are on it."],["تمت معالجة طلبك، شكرًا لتواصلك.","This has been handled — thank you."],["يرجى إرفاق المستند المطلوب للمتابعة.","Please attach the required document to proceed."]].map(t=>`<button type="button" class="tpl" data-tpl="${esc(P(t))}">${esc(P(t)).slice(0,26)}…</button>`).join("")}<button class="btn p sm" type="submit">${I("send","flip")}${tx("إرسال","Send")}</button></div></form></div>`}`}
AFTER.mail=()=>{if(D.mthread){const box=curBox(),ms=SB.mail.thread(D.mthread,box);if(ms.some(m=>(m.to.includes(box)||m.to.includes("all@"+SB.domain()))&&m.from!==box&&!(m.state[box]||{}).read))SB.mail.markThread(D.mthread,box,{read:true});const t=$("#mth");if(t)t.scrollTop=t.scrollHeight}};
function compose(to,subject,body){const from=curBox(),opts=SB.DEPTS.map(d=>`<option value="${d.k}@${SB.domain()}">${AR()?d.ar:d.en}</option>`).join("")+SB.list("users").filter(u=>u.status==="active").map(u=>`<option value="${esc(u.email)}">${esc(uname(u))}</option>`).join("");
 const canAll=isAdmin()||D.me.role==="hr";D.pend.cm=[];
 drawer(tx("رسالة جديدة","New message"),`<div class="field"><label for="cF">${tx("من","From")}</label><select class="inp ltr" id="cF">${boxes().map(b=>`<option value="${esc(b)}" ${b===from?"selected":""}>${esc(dname(b))} — ${esc(b)}</option>`).join("")}</select></div>
  <div class="field"><label for="cTo">${tx("إلى","To")}</label><input class="inp ltr" id="cTo" list="cRc" value="${esc(to||"")}" placeholder="name@${SB.domain()}"><datalist id="cRc">${opts}</datalist></div>
  ${canAll?`<label class="tgl" style="padding-top:0"><div><b>${tx("تعميم لجميع الموظفين","Send to all staff")}</b><small>${tx(`يصل إلى صندوق كل موظف نشط عبر <bdi dir="ltr">all@${SB.domain()}</bdi>`,`Delivered to every active employee via all@${SB.domain()}`)}</small></div><input type="checkbox" class="sw" id="cAll"></label>`:""}
  <div class="field" style="margin-top:12px"><label for="cSu">${tx("الموضوع","Subject")}</label><input class="inp" id="cSu" value="${esc(subject||"")}"></div>
  <div class="field"><label for="cBo">${tx("الرسالة","Message")}</label><textarea class="inp" id="cBo" rows="9">${esc(body||"")}</textarea></div>
  <label class="drop">${I("clip")}<div><b>${tx("إرفاق ملفات","Attach files")}</b>${tx("حتى 15 ميجابايت لكل ملف","Up to 15 MB each")}</div><input type="file" id="cmAtt" multiple></label><div class="atts" id="cmFiles" style="padding:0"></div>`,
  `<button class="btn o" data-dclose>${tx("إلغاء","Cancel")}</button><button class="btn p" data-send>${I("send","flip")}${tx("إرسال","Send")}</button>`)}
async function sendCompose(){
 if(D.sendingCompose)return;
 const all=$("#cAll")&&$("#cAll").checked,d=SB.domain();
 const to=all?["all@"+d]:$("#cTo").value.split(/[,،;\s]+/).filter(Boolean).map(x=>x.toLowerCase().includes("@")?x.toLowerCase():x.toLowerCase()+"@"+d);
 if(!to.length)return toast(tx("أضف مستلمًا.","Add a recipient."));
 if(to.includes("all@"+d)&&!isAdmin()&&D.me.role!=="hr")return toast(tx("التعميم متاح للإدارة والموارد البشرية فقط.","Only administration and HR can send staff-wide notices."));
 const bad=to.filter(x=>x!=="all@"+d&&!SB.DEPTS.some(k=>k.k+"@"+d===x)&&!SB.users().some(u=>u.email===x&&u.status==="active"));if(bad.length)return toast(tx("عنوان غير نشط أو غير معروف: ","Inactive or unknown address: ")+bad[0]);
 const su=$("#cSu").value.trim(),bo=$("#cBo").value.trim(),from=$("#cF").value;if(!su&&!bo)return toast(tx("اكتب رسالة.","Write a message."));
 if(!boxes().includes(from))return;
 const button=$("[data-send]");button.disabled=true;D.sendingCompose=true;
 try{const atts=[];for(const f of D.pend.cm||[])atts.push(await SB.files.put(f));
 const m=SB.mail.send({from,to,subject:su,body:bo,attachments:atts});D.pend.cm=[];
 SB.log(D.me.email,to.includes("all@"+d)?"broadcast":"mail",su.slice(0,40));D.mbox=from;D.mfold="sent";D.mthread=m.threadId;closeDrawer();if(D.view!=="mail")go("mail");toast(tx("تم الإرسال","Sent"));}
 catch(e){button.disabled=false;toast(tx("تعذّر الإرسال. احتفظنا بالرسالة والمرفقات للمحاولة مجددًا.","Couldn’t send. Your message and attachments are preserved for retry."))}
 finally{D.sendingCompose=false}
}
function pendList(k){const b=$("#"+k+"Files");if(b)b.innerHTML=(D.pend[k]||[]).map((f,i)=>`<span class="att">${I("clip")}<span>${esc(f.name)}</span><button type="button" data-rmp="${k}:${i}" style="all:unset;cursor:pointer;color:var(--muted)">${I("close","","width:13px;height:13px")}</button></span>`).join("")}
async function openAtt(ref,name){const u=String(ref).startsWith("idb:")?await SB.files.get(ref):fileUrl(ref);if(!u)return toast(tx("الملف غير متاح في هذه النسخة التجريبية.","File not available in this demo."));const a=document.createElement("a");a.href=u;a.target="_blank";a.rel="noopener";if(!/\.(pdf|png|jpe?g|webp|gif)$/i.test(name||""))a.download=name||"file";document.body.appendChild(a);a.click();a.remove()}

/* ---- REQUESTS ---- */
VIEWS.requests=()=>{
 const all=visReqs(),f=D.rq;
 const cnt=s=>s==="open"?all.filter(r=>["pending","review"].includes(r.status)).length:s==="all"?all.length:all.filter(r=>r.status===s).length;
 const q=f.q.trim().toLowerCase();
 const list=all.filter(r=>(f.st==="all"||(f.st==="open"?["pending","review"].includes(r.status):r.status===f.st))&&(f.type==="all"||r.type===f.type)&&(f.branch==="all"||r.branch===f.branch)&&(!q||(r.no+" "+dname(r.email)+" "+r.email+" "+JSON.stringify(r.data)).toLowerCase().includes(q)));
 const stats=[["open",["مفتوحة","Open"],"#0A8BA0"],["pending",["جديدة","New"],"#C98A12"],["review",["قيد المراجعة","In review"],"#077585"],["approved",["معتمدة","Approved"],"#3E9B2F"],["rejected",["مرفوضة","Declined"],"#D93B41"]];
 const brs=[...new Set(all.map(r=>r.branch).filter(Boolean))];
 return `<div class="ph"><p>${tx("طلبات الموظفين المقدّمة من البوابة. القرار يصل للموظف فورًا على بريده وفي صفحة طلباته.","Requests employees submit in the portal. Your decision reaches them instantly by mail and on their requests page.")}</p><div class="acts"><button class="btn o" data-csv="requests">${I("download")}${tx("تصدير CSV","Export CSV")}</button></div></div>
 <div class="rstats">${stats.map(([k,l,c])=>`<button class="rs ${f.st===k?"on":""}" data-rqst="${k}"><b class="tnum">${cnt(k)}</b><span><i style="background:${c}"></i>${P(l)}</span></button>`).join("")}</div>
 <div class="bar"><div class="sbox">${I("search")}<input class="inp" id="rqQ" type="search" placeholder="${tx("ابحث برقم الطلب أو اسم الموظف…","Search by number or employee…")}" value="${esc(f.q)}"></div>
  <select class="inp" id="rqType"><option value="all">${tx("كل الأنواع","All types")}</option>${Object.keys(SB.REQ_TYPES).filter(t=>myDepts().includes(RT(t).dept)).map(t=>`<option value="${t}" ${f.type===t?"selected":""}>${AR()?RT(t).ar:RT(t).en}</option>`).join("")}</select>
  <select class="inp" id="rqBr"><option value="all">${tx("كل الفروع","All branches")}</option>${brs.map(b=>`<option ${f.branch===b?"selected":""}>${esc(b)}</option>`).join("")}</select>
  ${f.st!=="all"?`<button class="btn s sm" data-rqst="all">${tx("عرض الكل","Show all")}</button>`:""}<span class="grow"></span>
  <div class="seg"><button class="${f.mode==="table"?"on":""}" data-rqmode="table">${I("table")}${tx("جدول","Table")}</button><button class="${f.mode==="board"?"on":""}" data-rqmode="board">${I("kanban")}${tx("لوحة","Board")}</button></div></div>
 ${f.mode==="board"?board(all.filter(r=>(f.type==="all"||r.type===f.type)&&(f.branch==="all"||r.branch===f.branch)&&(!q||(r.no+" "+dname(r.email)).toLowerCase().includes(q)))):list.length?`<div class="tw"><table class="t"><thead><tr><th>${tx("الطلب","Request")}</th><th>${tx("الموظف","Employee")}</th><th>${tx("التفاصيل","Details")}</th><th>${tx("التاريخ","Date")}</th><th>${tx("الحالة","Status")}</th><th></th></tr></thead><tbody>
  ${list.map(r=>{const u=userOf(r.email);return `<tr class="click" data-req="${r.id}"><td><div class="who"><span class="ic sm" style="background:${RT(r.type).c}">${I(RT(r.type).i)}</span><div><b>${AR()?RT(r.type).ar:RT(r.type).en}</b><small class="mono">${esc(r.no)}</small></div></div></td><td><div class="who">${av(u||{name_ar:r.email},34)}<div><b>${esc(uname(u)||r.email)}</b><small>${esc(r.branch||"—")}</small></div></div></td><td class="muted" style="max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(reqLine(r))}</td><td class="muted" style="white-space:nowrap">${ago(r.createdAt)}</td><td>${stChip(r.status)}</td><td><div class="acts">${["pending","review"].includes(r.status)?`<button class="btn icon sm" data-quick="review:${r.id}" title="${tx("مراجعة التفاصيل","Review details")}">${I("eye")}</button>`:""}<button class="btn icon sm" title="${tx("فتح","Open")}">${I("arrow","flip")}</button></div></td></tr>`}).join("")}</tbody></table><div class="tfoot"><span>${list.length} ${tx("طلب","requests")}</span><span>${tx("يتم التحديث لحظيًا","Live updates")}</span></div></div>`:`<div class="card">${emptyBox("inbox",tx("لا طلبات مطابقة","No matching requests"),tx("غيّر الفلاتر أو انتظر طلبات جديدة.","Change filters or wait for new requests."))}</div>`}`};
function reqLine(r){const d=r.data||{};if(r.type==="leave")return `${d.kindLabel||""} · ${d.from||""} → ${d.to||""} · ${d.days||"?"} ${tx("يوم","d")}`;if(r.type==="exit")return `${d.date||""} · ${d.fromTime||""}–${d.toTime||""}`;if(r.type==="advance")return `${fmt(d.amount)} ${tx("ر.ع","OMR")} / ${d.months} ${tx("أقساط","inst.")}`;if(r.type==="letter")return `${d.kindLabel||""} · ${d.to||""}`;if(r.type==="account")return `${d.name_ar||""} · ${d.job||""}`;return d.reason||""}
function board(all){const cols=[["pending","#C98A12"],["review","#0A8BA0"],["approved","#3E9B2F"],["rejected","#D93B41"]];
 return `<div class="board">${cols.map(([s,c])=>{const its=all.filter(r=>r.status===s);return `<div class="bcol"><div class="bh"><span><i style="background:${c}"></i>${AR()?SB.STATUS[s].ar:SB.STATUS[s].en}</span><span class="chip n">${its.length}</span></div>${its.map(r=>{const u=userOf(r.email);return `<div class="bcard" data-req="${r.id}" tabindex="0"><div class="bt"><span class="chip" style="background:${RT(r.type).c}1f;color:${RT(r.type).c}">${I(RT(r.type).i)}${AR()?RT(r.type).ar:RT(r.type).en}</span><span class="mono muted">${esc(r.no.slice(-4))}</span></div><div class="who">${av(u||{name_ar:r.email},30)}<div><b>${esc(uname(u)||r.email)}</b><small>${esc(r.branch||"")}</small></div></div><div class="bd">${esc(reqLine(r))}</div><div class="bf"><span>${ago(r.createdAt)}</span>${r.attachments&&r.attachments.length?I("clip","","width:14px;height:14px"):""}</div></div>`}).join("")||`<div class="muted sm" style="text-align:center;padding:24px 8px">${tx("فارغ","Empty")}</div>`}</div>`}).join("")}</div>`}

function requestProgress(r){
 const done=["approved","rejected","cancelled"].includes(r.status),steps=[tx("تم الاستلام","Received"),tx("قيد المراجعة","In review"),done?(AR()?SB.STATUS[r.status].ar:SB.STATUS[r.status].en):tx("القرار","Decision")];
 return `<div class="chain" aria-label="${tx("حالة الطلب","Request status")}">${steps.map((l,i)=>`<span class="${i===0?"ok":i===1&&r.status==="review"?"on":i===2&&done?"on":""}">${l}</span>`).join(I("arrow"))}</div><p class="muted sm">${tx("المسار وفق السياسة: ","Policy route: ")}${RT(r.type).chain.map(P).join(" ← ")}. ${tx("الاعتمادات الفردية تُوثّق في سجل الطلب؛ ليست مراحل آلية مستقلة في هذه النسخة.","Individual approvals must be documented in the timeline; they are not separate automated stages in this version.")}</p>`;
}

function openReq(id){const r=visReqs().find(r=>r.id===id);if(!r)return;const T=RT(r.type),d=r.data||{},u=userOf(r.email);
 const done=r.status==="approved"?T.chain.length:r.status==="review"?2:1;
 const rows=[];const K=(a,e,v)=>{if(v||v===0)rows.push([tx(a,e),v])};
 if(r.type==="leave"){K("النوع","Type",d.kindLabel);K("من","From",d.from);K("إلى","To",d.to);K("أيام العمل","Working days",d.days);K("البديل","Cover",d.cover)}
 if(r.type==="exit"){K("التاريخ","Date",d.date);K("من","From",d.fromTime);K("إلى","Until",d.toTime)}
 if(r.type==="advance"){K("المبلغ","Amount",fmt(d.amount)+" "+tx("ر.ع","OMR"));K("الأقساط","Installments",d.months);K("القسط الشهري","Monthly",fmt(d.amount/(d.months||1))+" "+tx("ر.ع","OMR"))}
 if(r.type==="letter"){K("النوع","Type",d.kindLabel);K("موجّه إلى","To",d.to);K("اللغة","Language",d.lang)}
 if(r.type==="account"){K("الاسم","Name",d.name_ar);K("بالإنجليزية","English",d.name_en);K("المسمى","Job",d.job);K("القسم","Dept",d.dept);K("الفرع","Branch",d.branch);K("البريد المقترح","Address",d.email||SB.suggestEmail(d.name_en||""))}
 K("السبب / الملاحظات","Reason / notes",d.reason);
 const act={submitted:["قدّم الطلب","Submitted","b","send"],review:["حُوّل للمراجعة","Moved to review","b","clock"],approved:["اعتُمد","Approved","g","check"],rejected:["رُفض","Declined","r","close"],cancelled:["ألغاه الموظف","Cancelled by employee","","close"],pending:["أُعيد فتحه","Reopened","b","undo"]};
 const open=["pending","review"].includes(r.status);
 const mine=SB.list("requests").filter(x=>x.userId===r.userId).length;
 drawer(`${AR()?T.ar:T.en}`,`<div class="ucard2">${av(u||{name_ar:r.email},50)}<div style="min-width:0"><b style="font-weight:600;display:block">${esc(uname(u)||r.email)}</b><small class="muted">${esc(u?u.job:"")}${u&&u.branch?" · "+esc(u.branch):""}</small><div class="mono muted" style="font-size:12px">${esc(r.email)}</div></div><div class="mini"><div><b class="tnum">${u?(u.leaveBalance??30):"—"}</b><span>${tx("رصيد إجازة","leave left")}</span></div><div><b class="tnum">${mine}</b><span>${tx("طلبات","requests")}</span></div></div></div>
  <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px"><span style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span class="mono muted">${esc(r.no)}</span><span class="muted sm">${fdt(r.createdAt)}</span></span>${stChip(r.status)}</div>
  ${requestProgress(r)}
  <div class="card flat" style="padding:18px;margin-bottom:16px"><dl class="kv">${rows.map(([a,b])=>`<dt>${a}</dt><dd>${esc(b)}</dd>`).join("")}</dl>${r.attachments&&r.attachments.length?`<div class="atts" style="padding:12px 0 0">${r.attachments.map(f=>`<button class="att" data-att="${esc(f.ref)}" data-name="${esc(f.name)}">${I("clip")}<span>${esc(f.name)}</span></button>`).join("")}</div>`:""}</div>
  ${open&&r.type==="leave"&&d.kind==="annual"&&u?`<div class="ferr" style="background:var(--soft);color:var(--soft-ink)">${I("cal")}<span>${tx(`بعد الاعتماد يصبح رصيد الموظف ${(u.leaveBalance??30)-(+d.days||0)} يومًا.`,`After approval the balance becomes ${(u.leaveBalance??30)-(+d.days||0)} days.`)}</span></div>`:""}
  ${r.type==="account"&&open&&can("employees")?`<button class="btn s" data-mkacc="${r.id}" style="width:100%;margin-bottom:16px">${I("user")}${tx("إنشاء الحساب الآن","Create the account now")}</button>`:""}
  <div class="sect">${tx("سجل الطلب","Timeline")}</div>
  <div class="tline">${(r.history||[]).map(h=>{const a=act[h.action]||act.submitted;return `<div class="tli ${a[2]}"><i>${I(a[3])}</i><div><b>${P([a[0],a[1]])}</b><small>${esc(dname(h.by))} · ${fdt(h.at)}</small>${h.note?`<p>${esc(h.note)}</p>`:""}</div></div>`}).join("")}</div>
  ${open?`<div class="decide" style="margin:10px -24px -22px"><textarea class="inp" id="rqNote" rows="2" placeholder="${tx("ملاحظة للموظف (تظهر في بريده وسجل الطلب)…","Note to the employee (shown in their mail and timeline)…")}"></textarea><div class="row">${r.status==="pending"?`<button class="btn o" data-decide="review:${r.id}">${I("clock")}${tx("قيد المراجعة","In review")}</button>`:""}<button class="btn bad" data-decide="rejected:${r.id}">${I("close")}${tx("رفض","Decline")}</button><button class="btn ok" data-decide="approved:${r.id}">${I("check")}${tx("اعتماد","Approve")}</button></div></div>`:""}`,
  `${r.threadId?`<button class="btn o" data-openmail="${T.dept}@${SB.domain()}|${esc(r.threadId)}">${I("mail")}${tx("المحادثة","Conversation")}</button>`:""}${!open&&r.status!=="cancelled"?`<button class="btn s" data-decide="pending:${r.id}">${I("undo")}${tx("إعادة فتح","Reopen")}</button>`:""}`,{sub:tx("طلب موظف","Employee request")})}
function decide(status,id){const note=$("#rqNote")?$("#rqNote").value.trim():"";if(status==="rejected"&&!note&&$("#rqNote")){$("#rqNote").focus();$("#rqNote").placeholder=tx("اكتب سبب الرفض ليصل للموظف…","Write the reason so the employee knows why…");return toast(tx("أضف سبب الرفض.","Add a reason for declining."))}
 try{SB.req.decide(id,D.me,status,note)}catch(e){return toast(e.code==="balance"?tx("رصيد الإجازات غير كافٍ. راجع الطلب مع الموظف.","Insufficient leave balance. Review this with the employee."):tx("تعذّر تحديث الطلب. راجع حالته وصلاحيتك ثم حاول مجددًا.","Couldn’t update. Check the status and your permissions, then retry."))}toast({approved:tx("تم الاعتماد وإبلاغ الموظف","Approved — employee notified"),rejected:tx("تم الرفض وإبلاغ الموظف","Declined — employee notified"),review:tx("حُوّل للمراجعة","Moved to review"),pending:tx("أُعيد فتح الطلب","Reopened")}[status]);openReq(id)}

/* ---- EMPLOYEES ---- */
VIEWS.employees=()=>{const all=SB.list("users"),f=D.emp,q=f.q.trim().toLowerCase();
 const cnt=t=>t==="all"?all.length:all.filter(u=>u.status===t).length;
 const list=all.filter(u=>(f.tab==="all"||u.status===f.tab)&&(f.dept==="all"||u.dept===f.dept)&&(!q||[u.name_ar,u.name_en,u.email,u.empNo,u.job,u.branch].join(" ").toLowerCase().includes(q))).sort((a,b)=>(a.status==="pending"?-1:0)-(b.status==="pending"?-1:0)||(b.createdAt-a.createdAt));
 return `<div class="ph"><p>${tx(`حسابات الموظفين في البوابة وبريدهم <bdi dir="ltr">@${SB.domain()}</bdi>. فعّل التسجيلات الجديدة، وعدّل البيانات والصلاحيات.`,`Employee portal accounts and <bdi>@${SB.domain()}</bdi> mailboxes. Activate sign-ups, edit details and roles.`)}</p><div class="acts"><button class="btn o" data-csv="users">${I("download")}${tx("تصدير","Export")}</button><button class="btn p" data-newuser>${I("plus")}${tx("إضافة موظف","Add employee")}</button></div></div>
 <div class="bar"><div class="tabs">${[["all",["الكل","All"]],["active",["نشط","Active"]],["pending",["بانتظار التفعيل","Pending"]],["disabled",["موقوف","Disabled"]]].map(([k,l])=>`<button class="${f.tab===k?"on":""}" data-etab="${k}">${P(l)}<em>${cnt(k)}</em></button>`).join("")}</div><span class="grow"></span>
  <div class="sbox">${I("search")}<input class="inp" id="eQ" type="search" placeholder="${tx("ابحث بالاسم أو البريد أو الرقم…","Search name, email, number…")}" value="${esc(f.q)}"></div>
  <select class="inp" id="eDept"><option value="all">${tx("كل الأقسام","All departments")}</option>${SB.DEPTS.map(d=>`<option value="${d.k}" ${f.dept===d.k?"selected":""}>${AR()?d.ar:d.en}</option>`).join("")}</select></div>
 ${list.length?`<div class="tw"><table class="t"><thead><tr><th>${tx("الموظف","Employee")}</th><th>${tx("الرقم","No.")}</th><th>${tx("القسم","Department")}</th><th>${tx("الفرع","Branch")}</th><th>${tx("الصلاحية","Role")}</th><th>${tx("الحالة","Status")}</th><th>${tx("آخر دخول","Last sign-in")}</th><th></th></tr></thead><tbody>
 ${list.map(u=>`<tr class="click" data-user="${u.id}"><td><div class="who">${av(u,38)}<div><b>${esc(uname(u))}</b><small class="mono">${esc(u.email)}</small></div></div></td><td class="mono muted">${esc(u.empNo||"—")}</td><td>${esc(dlabel(u.dept))}<div class="muted sm">${esc(u.job||"")}</div></td><td>${esc(u.branch||"—")}</td><td>${roleChip(u.role)}</td><td>${ustChip(u.status)}</td><td class="muted" style="white-space:nowrap">${ago(u.lastLogin)}</td>
  <td><div class="acts">${u.status==="pending"?`<button class="btn icon sm" data-ureject="${u.id}" title="${tx("رفض","Reject")}" style="color:var(--bad)">${I("close")}</button><button class="btn ok sm" data-uapprove="${u.id}">${I("check")}${tx("تفعيل","Activate")}</button>`:`<button class="btn icon sm" title="${tx("تعديل","Edit")}">${I("edit")}</button>`}</div></td></tr>`).join("")}</tbody></table><div class="tfoot"><span>${list.length} ${tx("موظف","people")}</span><span>${tx("النطاق","Domain")} <span class="mono">@${esc(SB.domain())}</span></span></div></div>`:`<div class="card">${emptyBox("users",tx("لا نتائج","No results"))}</div>`}`};
function genPw(){const c="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";let s="";const a=new Uint32Array(10);crypto.getRandomValues(a);a.forEach(n=>s+=c[n%c.length]);return "Sb-"+s}
function editUser(id,pre){const u=id?SB.get("users",id):{role:"employee",status:"active",leaveBalance:SB.cfg("settings",{}).annualLeaveDays??30,...(pre||{})};if(!u)return;const self=id===D.me.id;
 const roleOpts=Object.entries(SB.ROLES).map(([k,r])=>`<option value="${k}" ${u.role===k?"selected":""}>${AR()?r.ar:r.en}</option>`).join("");
 const brs=branchNames();
 drawer(id?tx("تعديل موظف","Edit employee"):tx("إضافة موظف","Add employee"),`${id?`<div class="ucard2">${av(u,54)}<div style="min-width:0"><b style="font-weight:600;display:block">${esc(uname(u))}</b><span class="mono muted" style="font-size:12.5px">${esc(u.email)}</span><div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap">${roleChip(u.role)}${ustChip(u.status)}</div></div><div class="mini"><div><b class="tnum">${SB.list("requests").filter(r=>r.userId===u.id).length}</b><span>${tx("طلبات","requests")}</span></div></div></div>`:""}
  <div class="sect">${tx("البيانات الشخصية","Personal details")}</div>
  <div class="pair"><div class="field"><label for="uAr">${tx("الاسم","Name")} <span class="lang">AR</span></label><input class="inp" id="uAr" dir="rtl" value="${esc(u.name_ar||"")}"></div><div class="field"><label for="uEn">${tx("الاسم","Name")} <span class="lang">EN</span></label><input class="inp ltr" id="uEn" dir="ltr" value="${esc(u.name_en||"")}"></div></div>
  <div class="field"><label for="uEm">${tx("البريد الرسمي","Official email")}</label>${id?`<input class="inp ltr" id="uEm" value="${esc(u.email)}" disabled>`:`<div class="inpg"><input class="inp ltr" id="uEm" placeholder="${tx("يُقترح تلقائيًا من الاسم","Suggested from the name")}" style="padding-inline-end:116px"><span class="suf">@${esc(SB.domain())}</span></div>`}</div>
  <div class="g2"><div class="field"><label for="uNo">${tx("الرقم الوظيفي","Employee no.")}</label><input class="inp ltr" id="uNo" value="${esc(u.empNo||"")}"></div><div class="field"><label for="uPh">${tx("الهاتف","Phone")}</label><input class="inp ltr" id="uPh" value="${esc(u.phone||"")}"></div></div>
  <div class="sect">${tx("العمل","Work")}</div>
  <div class="g2"><div class="field"><label for="uDp">${tx("القسم","Department")}</label><select class="inp" id="uDp">${SB.DEPTS.map(d=>`<option value="${d.k}" ${u.dept===d.k?"selected":""}>${AR()?d.ar:d.en}</option>`).join("")}</select></div><div class="field"><label for="uBr">${tx("الفرع","Branch")}</label><select class="inp" id="uBr">${brs.map(b=>`<option ${u.branch===b?"selected":""}>${esc(b)}</option>`).join("")}</select></div></div>
  <div class="g2"><div class="field"><label for="uJob">${tx("المسمى الوظيفي","Job title")}</label><input class="inp" id="uJob" value="${esc(u.job||"")}"></div><div class="field"><label for="uLv">${tx("رصيد الإجازة (يوم)","Leave balance (days)")}</label><input class="inp ltr" type="number" id="uLv" min="0" max="90" value="${esc(u.leaveBalance??30)}"></div></div>
  <div class="sect">${tx("الصلاحيات والحالة","Access & status")}</div>
  <div class="g2"><div class="field"><label for="uRole">${tx("الصلاحية","Role")}</label><select class="inp" id="uRole" ${self||!isAdmin()?"disabled":""}>${roleOpts}</select></div><div class="field"><label for="uSt">${tx("الحالة","Status")}</label><select class="inp" id="uSt" ${self?"disabled":""}><option value="active" ${u.status==="active"?"selected":""}>${tx("نشط","Active")}</option><option value="pending" ${u.status==="pending"?"selected":""}>${tx("بانتظار التفعيل","Pending")}</option><option value="disabled" ${u.status==="disabled"?"selected":""}>${tx("موقوف","Disabled")}</option></select></div></div>
  <p class="muted sm" style="margin:-4px 0 0" id="roleHint">${roleHint(u.role)}</p>
  <div class="sect">${tx("الأمان","Security")}</div>
  ${id?`<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><button class="btn o" data-resetpw="${u.id}">${I("key")}${tx("إعادة تعيين كلمة المرور","Reset password")}</button><span class="muted sm">${tx("آخر دخول:","Last sign-in:")} ${ago(u.lastLogin)}</span></div>`:`<div class="field"><label for="uPw">${tx("كلمة مرور مؤقتة","Temporary password")}</label><div style="display:flex;gap:8px"><input class="inp ltr" id="uPw" value="${genPw()}"><button class="btn o icon" type="button" data-genpw title="${tx("توليد","Generate")}">${I("refresh")}</button></div><small class="muted">${tx("شاركها مع الموظف ليغيّرها بعد أول دخول. ستصله رسالة ترحيب على بريده الجديد.","Share it with the employee to change after first sign-in. A welcome email is sent to the new mailbox.")}</small></div>`}`,
  `${id&&!self&&isAdmin()?`<button class="btn bad" data-deluser="${u.id}" style="margin-inline-end:auto">${I("trash")}${tx("حذف","Delete")}</button>`:""}<button class="btn o" data-dclose>${tx("إلغاء","Cancel")}</button><button class="btn p" data-saveuser="${id||""}">${id?tx("حفظ التغييرات","Save changes"):tx("إنشاء الحساب","Create account")}</button>`,{sub:id?u.email:tx("حساب بوابة وبريد رسمي","Portal account and official mailbox")});
 const rs=$("#uRole");if(rs)rs.onchange=()=>{$("#roleHint").innerHTML=roleHint(rs.value)};
 if(!id){const en=$("#uEn");en.oninput=()=>{const s=SB.suggestEmail(en.value);$("#uEm").placeholder=s?s.split("@")[0]:tx("يُقترح تلقائيًا من الاسم","Suggested from the name")}}
}
function roleHint(r){return {employee:tx("يستخدم البوابة فقط: البريد والطلبات والمحتوى.","Portal only: mail, requests and content."),editor:tx("يدير الأخبار والمكتبة والصفحة الرئيسية وصفحة الشركة، ويقرأ صندوق التسويق.","Manages news, library, home and company pages; reads the marketing mailbox."),hr:tx("يعالج طلبات الموارد البشرية، يفعّل الحسابات، يدير موظف الشهر، ويقرأ صندوقي الموارد البشرية والإدارة.","Handles HR requests, activates accounts, manages employee of the month; reads HR and management mailboxes."),it:tx("يعالج طلبات الحسابات، يدير روابط الأنظمة، ويقرأ صندوقي التقنية والدعم الفني.","Handles account requests and system links; reads IT and support mailboxes."),admin:tx("صلاحية كاملة على البوابة ولوحة التحكم وكل الصناديق.","Full access to the portal, dashboard and every mailbox.")}[r]||""}
async function saveUser(id){const v=s=>$(s)?$(s).value.trim():"";
 const f={name_ar:v("#uAr"),name_en:v("#uEn"),empNo:v("#uNo"),phone:v("#uPh"),dept:v("#uDp"),branch:v("#uBr"),job:v("#uJob"),leaveBalance:+v("#uLv")||0};
 if(!f.name_ar||!f.name_en)return toast(tx("أدخل الاسم بالعربية والإنجليزية.","Enter both names."));
 if(id){const old=SB.get("users",id);const patch={id,...f};if($("#uRole")&&!$("#uRole").disabled)patch.role=v("#uRole");if(!$("#uSt").disabled)patch.status=v("#uSt");SB.put("users",patch);
  if(old.status==="pending"&&patch.status==="active")SB.auth.welcome(SB.get("users",id));SB.log(D.me.email,patch.status==="active"&&old.status==="pending"?"user_approve":"user_edit",old.email);closeDrawer();toast(tx("تم الحفظ","Saved"));return}
 try{const em=v("#uEm");const u=await SB.auth.create({...f,email:em?em+(em.includes("@")?"":"@"+SB.domain()):"",role:v("#uRole")||"employee",password:v("#uPw")},D.me);closeDrawer();toast(tx("تم إنشاء ","Created ")+u.email);
  if(D.mkFrom){SB.req.decide(D.mkFrom,D.me,"approved",tx("تم إنشاء الحساب: ","Account created: ")+u.email);D.mkFrom=null}}
 catch(e){toast({taken:tx("هذا البريد مستخدم.","That address is taken."),weak:tx("كلمة المرور 8 أحرف على الأقل.","Password must be 8+ characters."),name:tx("تحقق من الاسم الإنجليزي.","Check the English name.")}[e.code]||tx("تعذّر الإنشاء.","Couldn’t create."))}}

/* ---- NEWS ---- */
VIEWS.news=()=>{const f=D.news,q=f.q.trim().toLowerCase();const all=SB.list("news").slice().sort((a,b)=>(b.pinned?1:0)-(a.pinned?1:0)||(b.at||b.createdAt)-(a.at||a.createdAt));
 const list=all.filter(n=>(f.cat==="all"||n.cat===f.cat||(f.cat==="draft"&&n.draft))&&(!q||(n.title_ar+" "+n.title_en+" "+n.body_ar).toLowerCase().includes(q)));
 return `<div class="ph"><p>${tx("ما تنشره هنا يظهر في الرئيسية وصفحة الأخبار فورًا، مع تنبيه في جرس البوابة.","Anything you publish appears on the portal home and news page instantly, with a bell alert.")}</p><div class="acts"><a class="btn o" href="../index.html#news" target="_blank" rel="noopener">${I("eye")}${tx("معاينة","Preview")}</a><button class="btn p" data-newnews>${I("plus")}${tx("خبر جديد","New announcement")}</button></div></div>
 <div class="bar"><div class="tabs">${[["all",["الكل","All"]],...Object.entries(NCATS).map(([k,v])=>[k,[v.ar,v.en]]),["draft",["المسودات","Drafts"]]].map(([k,l])=>`<button class="${f.cat===k?"on":""}" data-ncat="${k}">${P(l)}</button>`).join("")}</div><span class="grow"></span><div class="sbox">${I("search")}<input class="inp" id="nQ" type="search" placeholder="${tx("ابحث في الأخبار…","Search news…")}" value="${esc(f.q)}"></div></div>
 <div class="ngrid"><button class="ncard add" data-newnews><span class="ic">${I("plus")}</span><b style="color:var(--ink);font-weight:500">${tx("إعلان جديد","New announcement")}</b><span class="sm">${tx("عنوان ونص بالعربية والإنجليزية وصورة غلاف","Title, text and a cover photo")}</span></button>
 ${list.map(n=>{const c=NCATS[n.cat]||NCATS.general;const cov=fileUrl(n.cover)||img(NIMG[n.cat]||"team");return `<article class="ncard"><div class="cv"><img src="${esc(cov)}" ${String(n.cover||"").startsWith("idb:")?`data-ref="${esc(n.cover)}"`:""} alt=""><div class="tg"><span class="chip">${AR()?c.ar:c.en}</span>${n.pinned?`<span class="chip">${I("pinned")}${tx("مثبّت","Pinned")}</span>`:""}${n.draft?`<span class="chip" style="background:rgba(201,138,18,.85)">${tx("مسودة","Draft")}</span>`:""}</div></div><div class="bd"><h4>${esc(L(n,"title"))}</h4><p>${esc(L(n,"body"))}</p></div><div class="ft"><span>${fdate(n.at||n.createdAt)}</span><div class="acts"><button class="btn icon sm" data-pin="${n.id}" title="${n.pinned?tx("إلغاء التثبيت","Unpin"):tx("تثبيت","Pin")}" style="${n.pinned?"color:var(--sea)":""}">${I("pinned")}</button><button class="btn icon sm" data-editnews="${n.id}" title="${tx("تعديل","Edit")}">${I("edit")}</button><button class="btn icon sm" data-del="news:${n.id}" title="${tx("حذف","Delete")}">${I("trash")}</button></div></div></article>`}).join("")}</div>`};
function imgPicker(id,cur){return `<div class="imgpick" id="${id}">${Object.keys(IMGS).map(k=>`<button type="button" class="${cur===k||cur==="assets/images/"+IMGS[k]?"on":""}" data-pick="${k}" title="${k}"><img src="${img(k)}" alt="" loading="lazy"></button>`).join("")}</div>`}
function editNews(id){const n=id?SB.get("news",id):{cat:"general",at:Date.now()};if(!n)return;D.pend.cover=null;D.pend.coverVal=n.cover||"";
 const cov=fileUrl(n.cover)||img(NIMG[n.cat]||"team");const dt=new Date(n.at||Date.now());const ds=new Date(dt.getTime()-dt.getTimezoneOffset()*6e4).toISOString().slice(0,10);
 drawer(id?tx("تعديل إعلان","Edit announcement"):tx("إعلان جديد","New announcement"),`<div class="prev" id="nPrev"><img src="${esc(cov)}" alt=""></div>
  <label class="drop">${I("image")}<div><b>${tx("ارفع صورة غلاف","Upload a cover photo")}</b>${tx("أو اختر من صور البوابة بالأسفل","or pick a portal photo below")}</div><input type="file" id="nCov" accept="image/*"></label>
  <div style="margin:10px 0 0">${imgPicker("nPick",n.cover)}</div>
  <div class="sect" style="margin-top:22px">${tx("المحتوى","Content")}</div>
  <div class="pair"><div class="field"><label for="nTa">${tx("العنوان","Title")} <span class="lang">AR</span></label><input class="inp" id="nTa" dir="rtl" value="${esc(n.title_ar||"")}"></div><div class="field"><label for="nTe">${tx("العنوان","Title")} <span class="lang">EN</span></label><input class="inp" id="nTe" dir="ltr" value="${esc(n.title_en||"")}"></div></div>
  <div class="pair"><div class="field"><label for="nBa">${tx("النص","Body")} <span class="lang">AR</span></label><textarea class="inp" id="nBa" dir="rtl" rows="7">${esc(n.body_ar||"")}</textarea></div><div class="field"><label for="nBe">${tx("النص","Body")} <span class="lang">EN</span></label><textarea class="inp" id="nBe" dir="ltr" rows="7">${esc(n.body_en||"")}</textarea></div></div>
  <div class="g2"><div class="field"><label for="nC">${tx("التصنيف","Category")}</label><select class="inp" id="nC">${Object.entries(NCATS).map(([k,v])=>`<option value="${k}" ${n.cat===k?"selected":""}>${AR()?v.ar:v.en}</option>`).join("")}</select></div><div class="field"><label for="nD">${tx("تاريخ النشر","Publish date")}</label><input class="inp" type="date" id="nD" value="${ds}"></div></div>
  <label class="tgl"><div><b>${tx("تثبيت في الأعلى","Pin to top")}</b><small>${tx("يظهر كخبر رئيسي في البوابة","Shown as the featured story")}</small></div><input type="checkbox" class="sw" id="nPin" ${n.pinned?"checked":""}></label>
  <label class="tgl"><div><b>${tx("حفظ كمسودة","Save as draft")}</b><small>${tx("لا يظهر للموظفين حتى تنشره","Hidden from employees until published")}</small></div><input type="checkbox" class="sw" id="nDr" ${n.draft?"checked":""}></label>
  <label class="tgl"><div><b>${tx("إرسال تعميم بالبريد","Also email all staff")}</b><small>${tx(`رسالة إلى <bdi dir="ltr">all@${SB.domain()}</bdi> بعنوان الخبر`,`A message to all@${SB.domain()} with the headline`)}</small></div><input type="checkbox" class="sw" id="nMail"></label>`,
  `${id?`<button class="btn bad" data-del="news:${id}" style="margin-inline-end:auto">${I("trash")}</button>`:""}<button class="btn o" data-dclose>${tx("إلغاء","Cancel")}</button><button class="btn p" data-savenews="${id||""}">${I("send","flip")}${tx("نشر","Publish")}</button>`,{wide:true,sub:tx("يظهر في البوابة فورًا","Goes live instantly")});
}
async function saveNews(id){const v=s=>$(s).value.trim();const t={title_ar:v("#nTa"),title_en:v("#nTe"),body_ar:v("#nBa"),body_en:v("#nBe"),cat:v("#nC"),pinned:$("#nPin").checked,draft:$("#nDr").checked};
 if(!t.title_ar&&!t.title_en)return toast(tx("أضف عنوانًا.","Add a title."));
 let cover=D.pend.coverVal||"";if(D.pend.cover){try{cover=(await SB.files.put(D.pend.cover)).ref}catch(e){return toast(tx("تعذّر رفع الصورة.","Upload failed."))}}
 const d=$("#nD").value;const at=d?new Date(d+"T"+new Date().toTimeString().slice(0,8)).getTime():Date.now();
 try{const n=SB.put("news",{...(id?{id}:{}),...t,cover,at});SB.log(D.me.email,id?"news_edit":"news_new",(t.title_ar||t.title_en).slice(0,40));
  if($("#nMail").checked&&!t.draft)SB.mail.send({from:"management@"+SB.domain(),to:["all@"+SB.domain()],subject:t.title_ar||t.title_en,body:(t.body_ar||t.body_en)+"\n\n— "+tx("منشور في أخبار البوابة","Posted in portal news")});
  closeDrawer();toast(t.draft?tx("حُفظت المسودة","Draft saved"):tx("تم النشر في البوابة","Published to the portal"))}catch(e){toast(e.code==="quota"?tx("امتلأت مساحة التخزين التجريبية.","Demo storage is full."):tx("تعذّر الحفظ.","Couldn’t save."))}}

/* ---- DOCS ---- */
VIEWS.docs=()=>{const l=SB.list("docs").slice().sort(byOrder);
 return `<div class="ph"><p>${tx("المستندات المعتمدة التي تعرضها مكتبة البوابة. ارفع نسخة جديدة لاستبدال الملف دون تغيير الرابط.","Approved documents shown in the portal library. Upload a new version to replace a file in place.")}</p><div class="acts"><button class="btn p" data-newdoc>${I("upload")}${tx("رفع مستند","Upload document")}</button></div></div>
 <div class="tw"><table class="t"><thead><tr><th style="width:60px">#</th><th>${tx("المستند","Document")}</th><th>${tx("التصنيف","Category")}</th><th>${tx("الصفحات","Pages")}</th><th>${tx("الإصدار","Edition")}</th><th>${tx("الملف","File")}</th><th>${tx("آخر تحديث","Updated")}</th><th></th></tr></thead><tbody>
 ${l.map((d,i)=>{const c=CATS[d.cat]||CATS.other;return `<tr><td><div class="srow" style="all:unset;display:grid;gap:2px"><div class="mv" style="display:grid"><button data-mvdoc="${d.id}:-1" ${i?"":"disabled"} aria-label="up" style="all:unset;cursor:pointer;color:var(--muted)">${I("up","","width:15px;height:15px")}</button><button data-mvdoc="${d.id}:1" ${i<l.length-1?"":"disabled"} aria-label="down" style="all:unset;cursor:pointer;color:var(--muted)">${I("down","","width:15px;height:15px")}</button></div></div></td>
  <td><div class="who"><span class="ic" style="background:linear-gradient(165deg,${c.c},#04212A)">${I("file")}</span><div style="max-width:340px"><b>${esc(L(d,"title"))}</b><small>${esc(L(d,"desc"))}</small></div></div></td><td><span class="chip" style="background:${c.c}1c;color:${c.c}">${AR()?c.ar:c.en}</span></td><td class="tnum">${d.pages||"—"}</td><td class="muted">${esc(L(d,"edition")||"—")}</td>
  <td>${String(d.url||"").startsWith("idb:")?`<span class="chip g">${I("upload")}${tx("مرفوع","Uploaded")}</span>`:d.url?`<span class="chip n mono" style="font-weight:500">${esc(d.url.split("/").pop())}</span>`:`<span class="chip w">${tx("بلا ملف","No file")}</span>`}</td><td class="muted">${ago(d.updatedAt)}</td>
  <td><div class="acts"><button class="btn icon sm" data-viewdoc="${d.id}" title="${tx("معاينة","Preview")}">${I("eye")}</button><button class="btn icon sm" data-editdoc="${d.id}" title="${tx("تعديل","Edit")}">${I("edit")}</button><button class="btn icon sm" data-del="docs:${d.id}" title="${tx("حذف","Delete")}">${I("trash")}</button></div></td></tr>`}).join("")}</tbody></table></div>`};
function editDoc(id){const d=id?SB.get("docs",id):{cat:"policies",order:SB.list("docs").length+1};if(!d)return;D.pend.doc=null;
 drawer(id?tx("تعديل مستند","Edit document"):tx("رفع مستند","Upload document"),`<label class="drop" id="dDrop">${I("upload")}<div><b id="dFn">${id&&d.url?esc(String(d.url).startsWith("idb:")?tx("ملف مرفوع — اختر ملفًا لاستبداله","Uploaded file — choose one to replace it"):d.url.split("/").pop()):tx("اختر ملف PDF","Choose a PDF file")}</b>${tx("PDF أو صورة · حتى 15 ميجابايت","PDF or image · up to 15 MB")}</div><input type="file" id="dF" accept="application/pdf,image/*"></label>
  <div class="sect" style="margin-top:22px">${tx("البيانات","Details")}</div>
  <div class="pair"><div class="field"><label for="dTa">${tx("الاسم","Title")} <span class="lang">AR</span></label><input class="inp" id="dTa" dir="rtl" value="${esc(d.title_ar||"")}"></div><div class="field"><label for="dTe">${tx("الاسم","Title")} <span class="lang">EN</span></label><input class="inp" id="dTe" dir="ltr" value="${esc(d.title_en||"")}"></div></div>
  <div class="pair"><div class="field"><label for="dDa">${tx("الوصف","Description")} <span class="lang">AR</span></label><textarea class="inp" id="dDa" dir="rtl" rows="3">${esc(d.desc_ar||"")}</textarea></div><div class="field"><label for="dDe">${tx("الوصف","Description")} <span class="lang">EN</span></label><textarea class="inp" id="dDe" dir="ltr" rows="3">${esc(d.desc_en||"")}</textarea></div></div>
  <div class="g3"><div class="field"><label for="dC">${tx("التصنيف","Category")}</label><select class="inp" id="dC">${Object.entries(CATS).map(([k,v])=>`<option value="${k}" ${d.cat===k?"selected":""}>${AR()?v.ar:v.en}</option>`).join("")}</select></div><div class="field"><label for="dP">${tx("الصفحات","Pages")}</label><input class="inp ltr" type="number" id="dP" value="${esc(d.pages||"")}"></div><div class="field"><label for="dO">${tx("الترتيب","Order")}</label><input class="inp ltr" type="number" id="dO" value="${esc(d.order||"")}"></div></div>
  <div class="pair"><div class="field"><label for="dEa">${tx("الإصدار","Edition")} <span class="lang">AR</span></label><input class="inp" id="dEa" value="${esc(d.edition_ar||"")}" placeholder="سبتمبر 2026"></div><div class="field"><label for="dEe">${tx("الإصدار","Edition")} <span class="lang">EN</span></label><input class="inp" id="dEe" dir="ltr" value="${esc(d.edition_en||"")}" placeholder="Sep 2026"></div></div>`,
  `${id?`<button class="btn bad" data-del="docs:${id}" style="margin-inline-end:auto">${I("trash")}</button>`:""}<button class="btn o" data-dclose>${tx("إلغاء","Cancel")}</button><button class="btn p" data-savedoc="${id||""}">${tx("حفظ","Save")}</button>`,{wide:true})}
async function saveDoc(id){const v=s=>$(s).value.trim();const old=id?SB.get("docs",id):null;
 const t={title_ar:v("#dTa"),title_en:v("#dTe"),desc_ar:v("#dDa"),desc_en:v("#dDe"),cat:v("#dC"),pages:+v("#dP")||null,order:+v("#dO")||99,edition_ar:v("#dEa"),edition_en:v("#dEe")};
 if(!t.title_ar&&!t.title_en)return toast(tx("أضف اسم المستند.","Add a title."));
 let url=old?old.url:"";if(D.pend.doc){try{url=(await SB.files.put(D.pend.doc)).ref;if(old&&String(old.url).startsWith("idb:"))SB.files.del(old.url)}catch(e){return toast(tx("تعذّر رفع الملف.","Upload failed."))}}
 if(!url)return toast(tx("اختر ملفًا.","Choose a file."));
 SB.put("docs",{...(id?{id}:{}),...t,url});SB.log(D.me.email,id?"doc_edit":"doc_new",(t.title_ar||t.title_en).slice(0,40));closeDrawer();toast(tx("تم الحفظ — المكتبة محدّثة","Saved — library updated"))}
async function viewDoc(id){const d=SB.get("docs",id);if(!d)return;const u=String(d.url).startsWith("idb:")?await SB.files.get(d.url):fileUrl(d.url);drawer(L(d,"title"),u?`<iframe src="${esc(u)}" style="width:100%;height:calc(100vh - 170px);border:0;border-radius:14px;background:#525659" title="PDF"></iframe>`:emptyBox("file",tx("الملف غير متاح","File unavailable")),`<a class="btn o" href="${esc(u)}" target="_blank" rel="noopener">${I("ext")}${tx("فتح في تبويب","Open in tab")}</a>`,{wide:true})}
function move(col,id,dir,act){const l=SB.list(col).slice().sort(byOrder);const i=l.findIndex(x=>x.id===id),j=i+dir;if(i<0||j<0||j>=l.length)return;[l[i],l[j]]=[l[j],l[i]];l.forEach((x,k)=>{if(x.order!==k+1)SB.put(col,{id:x.id,order:k+1})});if(act)SB.log(D.me.email,act,"");}

/* ---- HOME PAGE ---- */
VIEWS.home=()=>{const rs=SB.list("reminders").slice().sort(byOrder),e=SB.cfg("eotm",{})||{};const ph=fileUrl(e.photo);
 return `<div class="ph"><p>${tx("تحكّم في شرائح الواجهة المتحركة وتذكيرات اللائحة، وبطاقة موظف الشهر في الرئيسية.","Control the hero slideshow, policy reminders and the employee-of-the-month card on the portal home.")}</p><div class="acts"><a class="btn o" href="../index.html#home" target="_blank" rel="noopener">${I("eye")}${tx("معاينة الرئيسية","Preview home")}</a></div></div>
 <div class="g12">${can("content")?`<div class="card c7"><div class="ch"><div><h3>${tx("شرائح الواجهة","Hero slides")}</h3><p>${tx("تتبدل كل 7 ثوانٍ بانتقال الشرائط. رتّبها بالأسهم.","Rotate every 7 seconds with the stripe wipe. Reorder with the arrows.")}</p></div><button class="btn p sm" data-newrem>${I("plus")}${tx("شريحة","Slide")}</button></div>
  <div class="sortl">${rs.map((r,i)=>`<div class="srow"><div class="mv"><button data-mvrem="${r.id}:-1" ${i?"":"disabled"} aria-label="up">${I("up")}</button><button data-mvrem="${r.id}:1" ${i<rs.length-1?"":"disabled"} aria-label="down">${I("down")}</button></div><div class="th"><img src="${img(r.img)}" alt=""></div><div style="min-width:0"><b><span class="muted tnum" style="font-family:var(--display);font-weight:200">${String(i+1).padStart(2,"0")}</span> · ${esc(L(r,"title"))}</b><small>${esc(L(r,"sub"))}</small></div><div class="acts"><button class="btn icon sm" data-editrem="${r.id}">${I("edit")}</button><button class="btn icon sm" data-del="reminders:${r.id}">${I("trash")}</button></div></div>`).join("")||emptyBox("home",tx("لا شرائح","No slides"))}</div></div>`:""}
 <div class="card ${can("content")?"c5":"c12"}"><div class="ch"><div><h3>${tx("موظف الشهر","Employee of the month")}</h3><p>${tx("بطاقة تكريم في الرئيسية، مع زر تهنئة يراسل الموظف مباشرة","An award card on the portal home, with a button to congratulate the employee")}</p></div></div>
  <div id="eoPrev">${eoPrev(e)}</div>
  <div style="margin-top:18px"><div class="field"><label for="eU">${tx("اختر من الموظفين","Pick an employee")}</label><select class="inp" id="eU"><option value="">${tx("— اختيار سريع —","— quick pick —")}</option>${SB.list("users").filter(u=>u.status==="active").map(u=>`<option value="${u.id}">${esc(uname(u))} · ${esc(u.branch||"")}</option>`).join("")}</select></div>
  <div class="pair"><div class="field"><label for="eNa">${tx("الاسم","Name")} <span class="lang">AR</span></label><input class="inp" id="eNa" value="${esc(e.name_ar||"")}"></div><div class="field"><label for="eNe">${tx("الاسم","Name")} <span class="lang">EN</span></label><input class="inp" id="eNe" dir="ltr" value="${esc(e.name_en||"")}"></div></div>
  <div class="pair"><div class="field"><label for="eRa">${tx("المسمى","Role")} <span class="lang">AR</span></label><input class="inp" id="eRa" value="${esc(e.role_ar||"")}"></div><div class="field"><label for="eRe">${tx("المسمى","Role")} <span class="lang">EN</span></label><input class="inp" id="eRe" dir="ltr" value="${esc(e.role_en||"")}"></div></div>
  <div class="g2"><div class="field"><label for="eBr">${tx("الفرع","Branch")}</label><select class="inp" id="eBr"><option value="">—</option>${branchNames().map(b=>`<option ${e.branch===b?"selected":""}>${esc(b)}</option>`).join("")}</select></div><div class="field"><label for="eMo">${tx("الشهر","Month")}</label><input class="inp" id="eMo" value="${esc(e.month||new Date().toLocaleDateString("ar-OM-u-nu-latn",{month:"long",year:"numeric"}))}"></div></div>
  <div class="pair"><div class="field"><label for="eWa">${tx("سبب التكريم","Why they were chosen")} <span class="lang">AR</span></label><textarea class="inp" id="eWa" rows="3" placeholder="${tx("جملة أو جملتان عن الإنجاز","One or two sentences on the achievement")}">${esc(e.reason_ar||"")}</textarea></div><div class="field"><label for="eWe">${tx("سبب التكريم","Why they were chosen")} <span class="lang">EN</span></label><textarea class="inp" id="eWe" rows="3" dir="ltr">${esc(e.reason_en||"")}</textarea></div></div>
  <label class="drop" style="margin-bottom:14px">${I("image")}<div><b>${tx("صورة الموظف (اختياري)","Photo (optional)")}</b>${tx("صورة طولية تظهر بأفضل شكل","A portrait photo works best")}</div><input type="file" id="eF" accept="image/*"></label>
  <div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn o" data-cleareo>${tx("إخفاء البطاقة","Hide card")}</button><button class="btn p" data-saveeo>${tx("حفظ ونشر","Save & publish")}</button></div></div></div></div>`};
const GO_OPTS=[["policies:hours",["اللوائح · الدوام","Policies · hours"]],["policies:penalty",["اللوائح · الجزاءات","Policies · penalties"]],["policies:leave",["اللوائح · الإجازات","Policies · leave"]],["policies:conduct",["اللوائح · السلوك","Policies · conduct"]],["sales:cycle",["المبيعات · الدورة","Sales · cycle"]],["sales:transfer",["المبيعات · التحويل","Sales · transfers"]],["sales:comm",["المبيعات · العمولة","Sales · commission"]],["library:",["المكتبة","Library"]],["requests:",["الطلبات","Requests"]],["mail:",["البريد","Mail"]],["news:",["الأخبار","News"]],["company:",["الشركة","Company"]],["",["بدون رابط","No link"]]];
function editRem(id){const r=id?SB.get("reminders",id):{img:"team",go:"policies:hours",order:SB.list("reminders").length+1};D.pend.remImg=r.img;
 drawer(id?tx("تعديل شريحة","Edit slide"):tx("شريحة جديدة","New slide"),`<div class="prev" id="rPrev" style="aspect-ratio:16/7"><img src="${img(r.img)}" alt=""></div>${imgPicker("rPick",r.img)}
  <div class="sect" style="margin-top:22px">${tx("النص","Text")}</div>
  <div class="pair"><div class="field"><label for="rTa">${tx("العنوان","Title")} <span class="lang">AR</span></label><input class="inp" id="rTa" value="${esc(r.title_ar||"")}"></div><div class="field"><label for="rTe">${tx("العنوان","Title")} <span class="lang">EN</span></label><input class="inp" id="rTe" dir="ltr" value="${esc(r.title_en||"")}"></div></div>
  <div class="pair"><div class="field"><label for="rSa">${tx("الوصف","Subtitle")} <span class="lang">AR</span></label><textarea class="inp" id="rSa" rows="2">${esc(r.sub_ar||"")}</textarea></div><div class="field"><label for="rSe">${tx("الوصف","Subtitle")} <span class="lang">EN</span></label><textarea class="inp" id="rSe" rows="2" dir="ltr">${esc(r.sub_en||"")}</textarea></div></div>
  <div class="field"><label for="rGo">${tx("زر «التفاصيل» يفتح","“Details” button opens")}</label><select class="inp" id="rGo">${GO_OPTS.map(([k,l])=>`<option value="${k}" ${r.go===k?"selected":""}>${P(l)}</option>`).join("")}</select></div>`,
  `<button class="btn o" data-dclose>${tx("إلغاء","Cancel")}</button><button class="btn p" data-saverem="${id||""}">${tx("حفظ","Save")}</button>`,{wide:true})}
function saveRem(id){const v=s=>$(s).value.trim();const t={title_ar:v("#rTa"),title_en:v("#rTe"),sub_ar:v("#rSa"),sub_en:v("#rSe"),go:v("#rGo"),img:D.pend.remImg||"team"};if(!t.title_ar&&!t.title_en)return toast(tx("أضف عنوانًا.","Add a title."));
 if(!id)t.order=SB.list("reminders").length+1;SB.put("reminders",{...(id?{id}:{}),...t});SB.log(D.me.email,id?"reminder_edit":"reminder_new",(t.title_ar||"").slice(0,40));closeDrawer();toast(tx("تم الحفظ","Saved"))}
function eoPrev(e){const ph=D.pend.eoPhoto||fileUrl(e.photo),n=L(e,"name");return `<div class="eotmp2"><div class="waves">${waves()}</div><div class="ph">${ph?`<img src="${esc(ph)}" alt="">`:`<span>${esc((n||"؟").trim().charAt(0))}</span>`}<i>${I("star")}</i></div><div style="min-width:0"><span class="lbl"><i></i>${tx("موظف الشهر","Employee of the month")}${e.month?" · "+esc(e.month):""}</span><h3>${esc(n||tx("اختر موظفًا","Pick an employee"))}</h3><p>${esc(L(e,"role"))}${e.branch?" • "+esc(e.branch):""}</p>${L(e,"reason")?`<q>${esc(L(e,"reason"))}</q>`:""}</div></div>`}
function eoLive(){const v=s=>$(s)?$(s).value.trim():"";const b=$("#eoPrev");if(b)b.innerHTML=eoPrev({name_ar:v("#eNa"),name_en:v("#eNe"),role_ar:v("#eRa"),role_en:v("#eRe"),branch:v("#eBr"),month:v("#eMo"),reason_ar:v("#eWa"),reason_en:v("#eWe"),photo:(SB.cfg("eotm",{})||{}).photo})}
async function saveEo(){const v=s=>$(s).value.trim();const e=SB.cfg("eotm",{})||{};let photo=e.photo||"";const f=$("#eF").files[0];if(f){try{photo=(await SB.files.put(f)).ref}catch(_){return toast(tx("تعذّر رفع الصورة.","Upload failed."))}}
 if(!v("#eNa")&&!v("#eNe"))return toast(tx("اختر الموظف أو اكتب اسمه.","Pick the employee or enter a name."));SB.setCfg("eotm",{name_ar:v("#eNa"),name_en:v("#eNe"),email:D.pend.eoEmail!==undefined?D.pend.eoEmail:(e.email||""),role_ar:v("#eRa"),role_en:v("#eRe"),branch:v("#eBr"),month:v("#eMo"),reason_ar:v("#eWa"),reason_en:v("#eWe"),photo});D.pend.eoEmail=undefined;D.pend.eoPhoto=null;SB.log(D.me.email,"eotm",v("#eNa"));toast(tx("تم النشر في الرئيسية","Published on home"));render(false)}

/* ---- APPS ---- */
const APP_ICONS=["chart","finger","mail","cap","globe","pin","grid","users","file","cal","clock","shield","star","heart","link","folder","coin","phone"];
const COLORS=["#0A8BA0","#08343B","#714B67","#E08A1E","#F26B21","#2F9E57","#383837","#7B61C9","#B07A4A","#D93B41"];
VIEWS.apps=()=>{const l=SB.list("apps").slice().sort(byOrder);
 return `<div class="ph"><p>${tx("روابط الأنظمة في صفحة «الأنظمة» وفي الخدمات السريعة بالرئيسية. الأنظمة بلا رابط تظهر للموظف بشارة «الرابط قريبًا».","System links on the portal Systems page and home quick actions. Systems without a link show “Link coming”.")}</p><div class="acts"><button class="btn p" data-newapp>${I("plus")}${tx("نظام جديد","New system")}</button></div></div>
 <div class="agrid">${l.map((a,i)=>`<div class="card acard"><span class="ic" style="background:${esc(a.color)};width:52px;height:52px;border-radius:16px">${I(a.icon)}</span><div style="min-width:0;flex:1"><h4>${esc(L(a,"name"))}</h4><p>${esc(L(a,"desc"))}</p>${a.internal?`<span class="chip b" style="margin-top:8px">${tx("داخل البوابة","Inside the portal")}</span>`:a.url?`<span class="u ltr">${esc(a.url)}</span>`:`<span class="chip w" style="margin-top:8px">${tx("الرابط غير مضبوط","Link not set")}</span>`}</div><div class="acts"><button class="btn icon sm" data-mvapp="${a.id}:-1" ${i?"":"disabled"}>${I("up")}</button><button class="btn icon sm" data-editapp="${a.id}">${I("edit")}</button>${a.internal?"":`<button class="btn icon sm" data-del="apps:${a.id}">${I("trash")}</button>`}</div></div>`).join("")}</div>`};
function editApp(id){const a=id?SB.get("apps",id):{icon:"grid",color:"#0A8BA0",order:SB.list("apps").length+1};D.pend.icon=a.icon;D.pend.color=a.color;
 drawer(id?tx("تعديل نظام","Edit system"):tx("نظام جديد","New system"),`<div class="pair"><div class="field"><label for="aNa">${tx("الاسم","Name")} <span class="lang">AR</span></label><input class="inp" id="aNa" value="${esc(a.name_ar||"")}"></div><div class="field"><label for="aNe">${tx("الاسم","Name")} <span class="lang">EN</span></label><input class="inp" id="aNe" dir="ltr" value="${esc(a.name_en||"")}"></div></div>
  <div class="pair"><div class="field"><label for="aDa">${tx("الوصف","Description")} <span class="lang">AR</span></label><input class="inp" id="aDa" value="${esc(a.desc_ar||"")}"></div><div class="field"><label for="aDe">${tx("الوصف","Description")} <span class="lang">EN</span></label><input class="inp" id="aDe" dir="ltr" value="${esc(a.desc_en||"")}"></div></div>
  ${a.internal?"":`<div class="field"><label for="aU">${tx("الرابط","Link")}</label><input class="inp ltr" id="aU" value="${esc(a.url||"")}" placeholder="https://"></div>`}
  <div class="field"><span class="lbl">${tx("الأيقونة","Icon")}</span><div class="icpick" id="aIc">${APP_ICONS.map(k=>`<button type="button" class="${a.icon===k?"on":""}" data-icon="${k}">${I(k)}</button>`).join("")}</div></div>
  <div class="field"><span class="lbl">${tx("اللون","Color")}</span><div class="swatchs" id="aCl">${COLORS.map(c=>`<button type="button" class="${a.color===c?"on":""}" data-color="${c}" style="background:${c}" aria-label="${c}"></button>`).join("")}<input type="color" id="aCc" value="${esc(a.color)}" aria-label="custom"></div></div>`,
  `<button class="btn o" data-dclose>${tx("إلغاء","Cancel")}</button><button class="btn p" data-saveapp="${id||""}">${tx("حفظ","Save")}</button>`)}
function saveApp(id){const v=s=>$(s)?$(s).value.trim():"";const u=v("#aU");if(u&&!/^https:\/\//i.test(u))return toast(tx("يجب أن يبدأ الرابط بـ https://","Link must start with https://"));
 const t={name_ar:v("#aNa"),name_en:v("#aNe"),desc_ar:v("#aDa"),desc_en:v("#aDe"),icon:D.pend.icon,color:D.pend.color};if($("#aU"))t.url=u;if(!t.name_ar&&!t.name_en)return toast(tx("أضف اسمًا.","Add a name."));
 if(!id)t.order=SB.list("apps").length+1;SB.put("apps",{...(id?{id}:{}),...t});SB.log(D.me.email,id?"app_edit":"app_new",t.name_en||t.name_ar);closeDrawer();toast(tx("تم الحفظ","Saved"))}

/* ---- BRANCHES ---- */
VIEWS.branches=()=>{const l=SB.list("branches").slice().sort(byOrder);
 return `<div class="ph"><p>${tx("تظهر في صفحة الشركة وقوائم الفروع في التسجيل والطلبات.","Shown on the Company page and in branch pickers across the portal.")}</p><div class="acts"><button class="btn p" data-newbranch>${I("plus")}${tx("فرع جديد","New branch")}</button></div></div>
 <div class="agrid">${l.map((b,i)=>`<div class="card acard"><span class="ic" style="background:var(--soft);color:var(--soft-ink);border-radius:50%">${I("pin")}</span><div style="min-width:0;flex:1"><h4>${esc(L(b,"name"))}</h4><p>${esc(L(b,"addr")||tx("العنوان غير مضاف","No address yet"))}</p><div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap"><span class="chip n">${esc(L(b,"region"))}</span><span class="chip n">${SB.list("users").filter(u=>u.branch===b.name_ar).length} ${tx("موظف","staff")}</span>${b.phone?`<span class="chip n ltr">${esc(b.phone)}</span>`:""}</div></div><div class="acts"><button class="btn icon sm" data-mvbranch="${b.id}:-1" ${i?"":"disabled"}>${I("up")}</button><button class="btn icon sm" data-editbranch="${b.id}">${I("edit")}</button><button class="btn icon sm" data-del="branches:${b.id}">${I("trash")}</button></div></div>`).join("")}</div>`};
function editBranch(id){const b=id?SB.get("branches",id):{};
 drawer(id?tx("تعديل فرع","Edit branch"):tx("فرع جديد","New branch"),["name","region","addr"].map(k=>`<div class="pair"><div class="field"><label for="b_${k}_ar">${{name:tx("الاسم","Name"),region:tx("المحافظة","Region"),addr:tx("العنوان","Address")}[k]} <span class="lang">AR</span></label><input class="inp" id="b_${k}_ar" value="${esc(b[k+"_ar"]||"")}"></div><div class="field"><label for="b_${k}_en">${{name:tx("الاسم","Name"),region:tx("المحافظة","Region"),addr:tx("العنوان","Address")}[k]} <span class="lang">EN</span></label><input class="inp" id="b_${k}_en" dir="ltr" value="${esc(b[k+"_en"]||"")}"></div></div>`).join("")+`<div class="field"><label for="bPh">${tx("هاتف الفرع","Branch phone")}</label><input class="inp ltr" id="bPh" value="${esc(b.phone||"")}" placeholder="+968"></div>`,
  `<button class="btn o" data-dclose>${tx("إلغاء","Cancel")}</button><button class="btn p" data-savebranch="${id||""}">${tx("حفظ","Save")}</button>`)}
function saveBranch(id){const v=s=>$(s).value.trim();const t={phone:v("#bPh")};["name","region","addr"].forEach(k=>{t[k+"_ar"]=v(`#b_${k}_ar`);t[k+"_en"]=v(`#b_${k}_en`)});if(!t.name_ar)return toast(tx("أضف اسم الفرع.","Add the branch name."));
 if(!id)t.order=SB.list("branches").length+1;SB.put("branches",{...(id?{id}:{}),...t});SB.log(D.me.email,id?"branch_edit":"branch_new",t.name_ar);closeDrawer();toast(tx("تم الحفظ","Saved"))}

/* ---- COMPANY ---- */
VIEWS.company=()=>{const c=SB.cfg("company",{}),ld=SB.list("leaders").slice().sort(byOrder);
 return `<div class="ph"><p>${tx("محتوى صفحة «عن السندباد» في البوابة.","Content of the portal’s About page.")}</p><div class="acts"><a class="btn o" href="../index.html#company" target="_blank" rel="noopener">${I("eye")}${tx("معاينة","Preview")}</a></div></div>
 <div class="g12"><div class="card c7"><div class="ch"><h3>${tx("الرؤية والرسالة","Vision & mission")}</h3></div>
  <div class="pair"><div class="field"><label for="cVa">${tx("الرؤية","Vision")} <span class="lang">AR</span></label><textarea class="inp" id="cVa" rows="3">${esc(c.vision_ar||"")}</textarea></div><div class="field"><label for="cVe">${tx("الرؤية","Vision")} <span class="lang">EN</span></label><textarea class="inp" id="cVe" rows="3" dir="ltr">${esc(c.vision_en||"")}</textarea></div></div>
  <div class="pair"><div class="field"><label for="cMa">${tx("الرسالة","Mission")} <span class="lang">AR</span></label><textarea class="inp" id="cMa" rows="3">${esc(c.mission_ar||"")}</textarea></div><div class="field"><label for="cMe">${tx("الرسالة","Mission")} <span class="lang">EN</span></label><textarea class="inp" id="cMe" rows="3" dir="ltr">${esc(c.mission_en||"")}</textarea></div></div>
  <div class="sect">${tx("الأرقام","Key numbers")}</div><div class="listed" id="facts">${(c.facts||[]).map(f=>factRow(f)).join("")}</div><button class="btn s sm" data-addfact style="margin-top:10px">${I("plus")}${tx("رقم","Number")}</button>
  <div class="sect">${tx("الأهداف القادمة (سطر لكل هدف)","Goals (one per line)")}</div>
  <div class="pair"><div class="field"><label for="cGa"><span class="lang">AR</span></label><textarea class="inp" id="cGa" rows="4">${esc((c.goals_ar||[]).join("\n"))}</textarea></div><div class="field"><label for="cGe"><span class="lang">EN</span></label><textarea class="inp" id="cGe" rows="4" dir="ltr">${esc((c.goals_en||[]).join("\n"))}</textarea></div></div>
  <div style="display:flex;justify-content:flex-end"><button class="btn p" data-savecompany>${tx("حفظ الصفحة","Save page")}</button></div></div>
 <div class="card c5"><div class="ch"><div><h3>${tx("القيادة","Leadership")}</h3><p>${tx("بالترتيب الظاهر في البوابة","In display order")}</p></div><button class="btn p sm" data-newleader>${I("plus")}${tx("إضافة","Add")}</button></div>
  <div class="sortl">${ld.map((l,i)=>`<div class="srow" style="grid-template-columns:auto 52px minmax(0,1fr) auto"><div class="mv"><button data-mvleader="${l.id}:-1" ${i?"":"disabled"}>${I("up")}</button><button data-mvleader="${l.id}:1" ${i<ld.length-1?"":"disabled"}>${I("down")}</button></div><span class="av" style="width:48px;height:48px;font-size:19px;background:linear-gradient(135deg,var(--aqua),var(--deep))">${esc(L(l,"name").charAt(0))}</span><div style="min-width:0"><b>${esc(L(l,"name"))}</b><small>${esc(L(l,"role"))}</small></div><div class="acts"><button class="btn icon sm" data-editleader="${l.id}">${I("edit")}</button><button class="btn icon sm" data-del="leaders:${l.id}">${I("trash")}</button></div></div>`).join("")}</div></div></div>`};
const factRow=f=>`<div class="li f4"><input class="inp ltr" data-f="n" type="number" value="${esc(f.n??"")}" placeholder="20"><input class="inp ltr" data-f="p" value="${esc(f.p||"")}" placeholder="+"><input class="inp" data-f="ar" value="${esc(f.ar||"")}" placeholder="عامًا في السوق"><input class="inp" data-f="en" dir="ltr" value="${esc(f.en||"")}" placeholder="years in Oman"><button class="btn icon sm o" data-rmrow>${I("close")}</button></div>`;
function saveCompany(){const v=s=>$(s).value.trim();const facts=$$("#facts .li").map(r=>({n:+r.querySelector('[data-f="n"]').value||0,p:r.querySelector('[data-f="p"]').value.trim(),ar:r.querySelector('[data-f="ar"]').value.trim(),en:r.querySelector('[data-f="en"]').value.trim()})).filter(f=>f.ar||f.en);
 SB.setCfg("company",{vision_ar:v("#cVa"),vision_en:v("#cVe"),mission_ar:v("#cMa"),mission_en:v("#cMe"),facts,goals_ar:v("#cGa").split("\n").map(s=>s.trim()).filter(Boolean),goals_en:v("#cGe").split("\n").map(s=>s.trim()).filter(Boolean)});SB.log(D.me.email,"company","");toast(tx("تم الحفظ","Saved"))}
function editLeader(id){const l=id?SB.get("leaders",id):{};drawer(id?tx("تعديل","Edit"):tx("إضافة قائد","Add leader"),`<div class="pair"><div class="field"><label for="lNa">${tx("الاسم","Name")} <span class="lang">AR</span></label><input class="inp" id="lNa" value="${esc(l.name_ar||"")}"></div><div class="field"><label for="lNe">${tx("الاسم","Name")} <span class="lang">EN</span></label><input class="inp" id="lNe" dir="ltr" value="${esc(l.name_en||"")}"></div></div><div class="pair"><div class="field"><label for="lRa">${tx("المنصب","Position")} <span class="lang">AR</span></label><input class="inp" id="lRa" value="${esc(l.role_ar||"")}"></div><div class="field"><label for="lRe">${tx("المنصب","Position")} <span class="lang">EN</span></label><input class="inp" id="lRe" dir="ltr" value="${esc(l.role_en||"")}"></div></div>`,`<button class="btn o" data-dclose>${tx("إلغاء","Cancel")}</button><button class="btn p" data-saveleader="${id||""}">${tx("حفظ","Save")}</button>`)}
function saveLeader(id){const v=s=>$(s).value.trim();const t={name_ar:v("#lNa"),name_en:v("#lNe"),role_ar:v("#lRa"),role_en:v("#lRe")};if(!t.name_ar)return toast(tx("أضف الاسم.","Add a name."));if(!id)t.order=SB.list("leaders").length+1;SB.put("leaders",{...(id?{id}:{}),...t});SB.log(D.me.email,"leader_edit",t.name_ar);closeDrawer();toast(tx("تم الحفظ","Saved"))}

/* ---- CONTACT ---- */
VIEWS.contact=()=>{const c=SB.cfg("contact",{});
 return `<div class="ph"><p>${tx("بيانات التواصل وروابط المنصات في فوتر البوابة وصفحة الشركة.","Contact details and social links in the portal footer and Company page.")}</p></div>
 <div class="g12"><div class="card c6"><div class="ch"><h3>${tx("بيانات التواصل","Contact details")}</h3></div>
  <div class="field"><label for="kPh">${tx("أرقام الهاتف (سطر لكل رقم)","Phone numbers (one per line)")}</label><textarea class="inp ltr" id="kPh" rows="3">${esc((c.phones||[]).join("\n"))}</textarea></div>
  <div class="field"><label for="kEm">${tx("البريد العام","Public email")}</label><input class="inp ltr" id="kEm" value="${esc(c.email||"")}"></div>
  <div class="pair"><div class="field"><label for="kHa">${tx("ساعات العمل","Hours")} <span class="lang">AR</span></label><input class="inp" id="kHa" value="${esc(c.hours_ar||"")}"></div><div class="field"><label for="kHe">${tx("ساعات العمل","Hours")} <span class="lang">EN</span></label><input class="inp" id="kHe" dir="ltr" value="${esc(c.hours_en||"")}"></div></div>
  <div class="pair"><div class="field"><label for="kAa">${tx("العنوان","Address")} <span class="lang">AR</span></label><input class="inp" id="kAa" value="${esc(c.address_ar||"")}"></div><div class="field"><label for="kAe">${tx("العنوان","Address")} <span class="lang">EN</span></label><input class="inp" id="kAe" dir="ltr" value="${esc(c.address_en||"")}"></div></div>
  <div class="field"><label for="kMp">${tx("رابط خريطة الفروع","Branch map link")}</label><input class="inp ltr" id="kMp" value="${esc(c.maps||"")}"></div></div>
 <div class="card c6"><div class="ch"><h3>${tx("المنصات والروابط","Social & links")}</h3><button class="btn s sm" data-addsoc>${I("plus")}${tx("رابط","Link")}</button></div><div class="listed" id="socs">${(c.socials||[]).map(s=>socRow(s)).join("")}</div>
  <div style="display:flex;justify-content:flex-end;margin-top:22px"><button class="btn p" data-savecontact>${tx("حفظ كل البيانات","Save all")}</button></div></div></div>`};
const socRow=s=>`<div class="li s2"><input class="inp" data-s="n" value="${esc(s[0]||"")}" placeholder="Instagram"><input class="inp ltr" data-s="u" value="${esc(s[1]||"")}" placeholder="https://"><button class="btn icon sm o" data-rmrow>${I("close")}</button></div>`;
function saveContact(){const v=s=>$(s).value.trim();const socials=$$("#socs .li").map(r=>[r.querySelector('[data-s="n"]').value.trim(),r.querySelector('[data-s="u"]').value.trim()]).filter(s=>s[0]&&/^https:\/\//i.test(s[1]));
 SB.setCfg("contact",{phones:v("#kPh").split("\n").map(s=>s.trim()).filter(Boolean),email:v("#kEm"),hours_ar:v("#kHa"),hours_en:v("#kHe"),address_ar:v("#kAa"),address_en:v("#kAe"),maps:v("#kMp"),socials});SB.log(D.me.email,"contact","");toast(tx("تم الحفظ","Saved"))}

/* ---- ACTIVITY ---- */
VIEWS.activity=()=>{const q=D.act.q.trim().toLowerCase();const l=SB.list("activity").slice().sort((a,b)=>b.at-a.at).filter(a=>!q||(a.actor+" "+dname(a.actor)+" "+a.action+" "+a.target+" "+P((ACT[a.action]||["",""]).slice(0,2))).toLowerCase().includes(q));
 return `<div class="ph"><p>${tx("كل ما يحدث في البوابة ولوحة التحكم، من الأحدث للأقدم.","Everything that happens in the portal and dashboard, newest first.")}</p></div>
 <div class="bar"><div class="sbox">${I("search")}<input class="inp" id="aQ" type="search" placeholder="${tx("ابحث في السجل…","Search the log…")}" value="${esc(D.act.q)}"></div></div>
 <div class="card"><div class="feed">${l.slice(0,120).map(actRow).join("")||emptyBox("activity",tx("لا نشاط","No activity"))}</div></div>`};

/* ---- SETTINGS ---- */
VIEWS.settings=()=>{const s=SB.cfg("settings",{});const perms=[["requests",["معالجة الطلبات","Handle requests"]],["employees",["إدارة الموظفين","Manage people"]],["content",["تحرير المحتوى","Edit content"]],["systems",["روابط الأنظمة","System links"]],["mail",["صناديق الأقسام","Dept mailboxes"]],["*",["الإعدادات والسجل","Settings & log"]]];
 return `<div class="ph"><p>${tx("إعدادات البوابة العامة، صناديق البريد والصلاحيات، والبيانات التجريبية.","General portal settings, mailboxes and roles, and the demo data.")}</p></div>
 <div class="g12"><div class="card c6"><div class="ch"><h3>${tx("عام","General")}</h3></div>
  <div class="field"><label for="sNm">${tx("اسم البوابة","Portal name")}</label><input class="inp" id="sNm" value="${esc(s.portalName||"")}"></div>
  <div class="field"><label>${tx("نطاق البريد الرسمي","Official mail domain")}</label><div class="inpg"><input class="inp ltr" value="@${esc(s.emailDomain||SB.DOMAIN)}" disabled></div><small class="muted">${tx("كل حساب يحصل على بريد بهذا النطاق. تغييره يحتاج ربط خادم البريد.","Every account gets a mailbox on this domain. Changing it requires the mail server.")}</small></div>
  <div class="g3"><div class="field"><label for="sLv">${tx("الإجازة السنوية (يوم)","Annual leave (days)")}</label><input class="inp ltr" type="number" id="sLv" value="${esc(s.annualLeaveDays??30)}"></div><div class="field"><label for="sWs">${tx("بداية الدوام","Opens")}</label><input class="inp ltr" type="number" id="sWs" min="0" max="23" value="${esc(s.workStart??9)}"></div><div class="field"><label for="sWe">${tx("نهاية الدوام","Closes")}</label><input class="inp ltr" type="number" id="sWe" min="0" max="23" value="${esc(s.workEnd??21)}"></div></div>
  <label class="tgl"><div><b>${tx("تفعيل الحسابات الجديدة يدويًا","Approve new accounts manually")}</b><small>${tx("الموظف الذي يسجّل من البوابة ينتظر تفعيل الموارد البشرية","Employees who sign up wait for HR activation")}</small></div><input type="checkbox" class="sw" id="sAp" ${s.requireApproval!==false?"checked":""}></label>
  <div style="display:flex;justify-content:flex-end;margin-top:14px"><button class="btn p" data-saveset>${tx("حفظ","Save")}</button></div></div>
 <div class="card c6"><div class="ch"><div><h3>${tx("صناديق الأقسام","Department mailboxes")}</h3><p>${tx("عناوين يراسلها الموظفون من البوابة","Addresses employees can write to")}</p></div></div>
  <div style="display:grid;gap:8px">${SB.DEPTS.map(d=>`<div class="who" style="padding:8px 10px;border-radius:14px;background:var(--surface2)"><span class="ic sm" style="background:${d.c}">${I(deptIcon(d.k))}</span><div style="flex:1"><b>${AR()?d.ar:d.en}</b><small class="mono">${d.k}@${esc(SB.domain())}</small></div><span class="chip n">${Object.entries(SB.ROLES).filter(([k,r])=>r.boxes==="*"||(r.boxes||[]).includes(d.k)).map(([k,r])=>AR()?r.ar:r.en).join("، ")}</span></div>`).join("")}</div></div>
 <div class="card c7"><div class="ch"><h3>${tx("الصلاحيات","Roles & permissions")}</h3></div><div class="tw" style="box-shadow:none"><table class="t matrix" style="min-width:560px"><thead><tr><th>${tx("الصلاحية","Role")}</th>${perms.map(p=>`<th>${P(p[1])}</th>`).join("")}</tr></thead><tbody>${Object.entries(SB.ROLES).map(([k,r])=>`<tr><td>${roleChip(k)}</td>${perms.map(([p])=>{const y=r.perms.includes("*")||r.perms.includes(p)||(p==="mail"&&r.boxes&&r.boxes.length);return `<td><span class="${y?"yes":"no2"}">${I(y?"check":"close")}</span></td>`}).join("")}</tr>`).join("")}</tbody></table></div></div>
 <div class="card c5"><div class="ch"><div><h3>${tx("البيانات التجريبية","Demo data")}</h3><p>${tx("كل البيانات وهمية ومحفوظة في هذا المتصفح فقط","All data is sample data stored in this browser only")}</p></div></div>
  <div style="display:grid;gap:10px"><button class="btn o" data-export>${I("download")}${tx("تصدير البيانات دون المرفقات","Export data without attachments")}</button><label class="btn o" style="position:relative">${I("upload")}${tx("استيراد نسخة","Import snapshot")}<input type="file" id="impF" accept="application/json" style="position:absolute;inset:0;opacity:0;cursor:pointer"></label><button class="btn bad" data-reset>${I("refresh")}${tx("إعادة البيانات التجريبية للبداية","Reset demo data")}</button></div></div></div>`};

/* ---------- CSV ---------- */
function csv(kind){let rows;if(kind==="users"){rows=[["name_ar","name_en","email","emp_no","department","branch","job","role","status"]].concat(SB.list("users").map(u=>[u.name_ar,u.name_en,u.email,u.empNo,u.dept,u.branch,u.job,u.role,u.status]))}else{rows=[["no","type","employee","branch","status","created","details"]].concat(visReqs().map(r=>[r.no,r.type,r.email,r.branch,r.status,new Date(r.createdAt).toISOString(),reqLine(r)]))}
 const s="﻿"+rows.map(r=>r.map(c=>`"${String(c??"").replace(/"/g,'""')}"`).join(",")).join("\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([s],{type:"text/csv"}));a.download=`sindbad-${kind}.csv`;document.body.appendChild(a);a.click();a.remove()}

/* ================= events ================= */
document.addEventListener("click",async e=>{
 const q=s=>e.target.closest(s);let x;
 if(x=q("[data-demo]")){const[a,p]=x.dataset.demo.split("|");$("#dE").value=a;$("#dP").value=p;doLogin();return}
 if(q("[data-lang]")){D.lang=AR()?"en":"ar";try{localStorage.setItem("sbd_lang",D.lang)}catch(_){}shell();if(D.me)render(false);return}
 if(q("[data-themebtn]")){const h=document.documentElement;h.dataset.theme=isDark()?"light":"dark";try{localStorage.setItem("sbd_theme",h.dataset.theme)}catch(_){}shell();if(D.me)render(false);return}
 if(q("[data-logout]")){SB.auth.logout("dashboard");D.me=null;shell();return}
 if(q("[data-menu]")){openSide();return}
 if(q("[data-closemenu]")){closeSide();return}
 if(q("[data-mini]")){D.mini=!D.mini;try{localStorage.setItem("sbd_mini",D.mini?"1":"0")}catch(_){}$("#app").classList.toggle("mini",D.mini);return}
 if(q("[data-search]")){openPal();return}
 if(x=q("[data-pi]")){runPal(+x.dataset.pi);return}
 if(q("[data-dclose]")){closeDrawer();return}
 if(x=q("[data-go]")){if(x.hasAttribute("data-pending-users"))D.emp.tab="pending";go(x.dataset.go);return}
 // mail
 if(x=q("[data-compose]")){compose();return}
 if(q("[data-send]")){sendCompose();return}
 if(x=q("[data-mbox]")){D.mbox=x.dataset.mbox;D.mthread=null;D.mfold="inbox";render(false);return}
 if(x=q("[data-mfold]")){D.mfold=x.dataset.mfold;D.mthread=null;render(false);return}
 if(x=q("[data-thread]")){D.mthread=x.dataset.thread;render(false);return}
 if(q("[data-mback]")){D.mthread=null;render(false);return}
 if(x=q("[data-mact]")){const p={star:{star:true},unstar:{star:false},archive:{arch:true},unarchive:{arch:false},trash:{trash:true},restore:{trash:false},unread:{read:false}}[x.dataset.mact];const id=D.mthread;if(["archive","trash","unread"].includes(x.dataset.mact))D.mthread=null;SB.mail.markThread(id,curBox(),p);render(false);return}
 if(x=q("[data-tpl]")){const t=$("#drBody");t.value=(t.value?t.value+"\n":"")+x.dataset.tpl;D.replyDraft={id:D.mthread,box:curBox(),v:t.value};t.focus();return}
 if(x=q("[data-openmail]")){const[b,t]=x.dataset.openmail.split("|");$("#drawer").classList.remove("open");$("#scrim").classList.remove("on");D.mbox=b;D.mfold="inbox";D.mthread=t;go("mail");return}
 if(x=q("[data-att]")){openAtt(x.dataset.att,x.dataset.name);return}
 if(x=q("[data-rmp]")){const[k,i]=x.dataset.rmp.split(":");D.pend[k].splice(+i,1);pendList(k);return}
 // requests
 if(x=q("[data-quick]")){openReq(x.dataset.quick.split(":")[1]);return}
 if(x=q("[data-decide]")){const[s,id]=x.dataset.decide.split(":");decide(s,id);return}
 if(x=q("[data-mkacc]")){const r=SB.get("requests",x.dataset.mkacc);D.mkFrom=r.id;const dep=SB.DEPTS.find(d=>d.ar===r.data.dept||d.en===r.data.dept);editUser(null,{name_ar:r.data.name_ar,name_en:r.data.name_en,job:r.data.job,branch:r.data.branch,dept:dep?dep.k:"sales"});return}
 if(x=q("[data-req]")){openReq(x.dataset.req);return}
 if(x=q("[data-rqst]")){D.rq.st=x.dataset.rqst;render(false);return}
 if(x=q("[data-rqmode]")){D.rq.mode=x.dataset.rqmode;try{localStorage.setItem("sbd_rqmode",D.rq.mode)}catch(_){}render(false);return}
 if(x=q("[data-csv]")){csv(x.dataset.csv);return}
 // employees
 if(q("[data-newuser]")){D.mkFrom=null;editUser(null);return}
 if(x=q("[data-uapprove]")){const u=SB.get("users",x.dataset.uapprove);SB.put("users",{id:u.id,status:"active"});SB.auth.welcome(SB.get("users",u.id));SB.log(D.me.email,"user_approve",u.email);toast(tx("تم تفعيل ","Activated ")+u.email);return}
 if(x=q("[data-ureject]")){const u=SB.get("users",x.dataset.ureject);if(await confirmBox(tx("رفض التسجيل؟","Reject this sign-up?"),tx(`سيُحذف حساب ${u.name_ar} ويتحرر عنوان ${u.email}.`,`${u.name_en}'s account is removed and ${u.email} is freed.`),tx("رفض","Reject"))){SB.remove("users",u.id);SB.log(D.me.email,"user_reject",u.email);toast(tx("تم الرفض","Rejected"))}return}
 if(x=q("[data-user]")){editUser(x.dataset.user);return}
 if(x=q("[data-saveuser]")){saveUser(x.dataset.saveuser);return}
 if(q("[data-genpw]")){$("#uPw").value=genPw();return}
 if(x=q("[data-resetpw]")){const pw=genPw();await SB.auth.changePassword(x.dataset.resetpw,null,pw);const u=SB.get("users",x.dataset.resetpw);SB.log(D.me.email,"reset_pw",u.email);$("#cfmT").textContent=tx("كلمة المرور المؤقتة","Temporary password");$("#cfmP").innerHTML=`${tx("شاركها مع","Share it with")} ${esc(uname(u))}:<div class="mono" style="margin-top:12px;padding:12px;border-radius:12px;background:var(--soft);color:var(--soft-ink);font-size:16px;text-align:center">${pw}</div>`;$("#cfmY").textContent=tx("نسخ","Copy");$("#cfmN").textContent=tx("إغلاق","Close");const d=$("#cfm");d.showModal();$("#cfmY").onclick=()=>{try{navigator.clipboard.writeText(pw)}catch(_){}d.close();toast(tx("تم النسخ","Copied"))};$("#cfmN").onclick=()=>d.close();return}
 if(x=q("[data-deluser]")){const u=SB.get("users",x.dataset.deluser);if(await confirmBox(tx("حذف الحساب؟","Delete account?"),tx(`سيُحذف حساب ${u.name_ar} نهائيًا من البوابة.`,`${u.name_en}'s account is removed from the portal.`))){SB.remove("users",u.id);SB.log(D.me.email,"user_del",u.email);closeDrawer();toast(tx("تم الحذف","Deleted"))}return}
 // content
 if(q("[data-newnews]")){if(D.view!=="news")go("news");editNews(null);return}
 if(x=q("[data-editnews]")){editNews(x.dataset.editnews);return}
 if(x=q("[data-savenews]")){saveNews(x.dataset.savenews);return}
 if(x=q("[data-pin]")){const n=SB.get("news",x.dataset.pin);SB.put("news",{id:n.id,pinned:!n.pinned});toast(n.pinned?tx("أُلغي التثبيت","Unpinned"):tx("تم التثبيت","Pinned"));return}
 if(x=q("[data-pick]")){const k=x.dataset.pick,box=x.closest(".imgpick");box.querySelectorAll("button").forEach(b=>b.classList.toggle("on",b===x));
  if(box.id==="nPick"){D.pend.cover=null;D.pend.coverVal="assets/images/"+IMGS[k];$("#nPrev img").src=img(k)}if(box.id==="rPick"){D.pend.remImg=k;$("#rPrev img").src=img(k)}return}
 if(q("[data-newdoc]")){editDoc(null);return}
 if(x=q("[data-editdoc]")){editDoc(x.dataset.editdoc);return}
 if(x=q("[data-savedoc]")){saveDoc(x.dataset.savedoc);return}
 if(x=q("[data-viewdoc]")){viewDoc(x.dataset.viewdoc);return}
 if(x=q("[data-mvdoc]")){const[id,d]=x.dataset.mvdoc.split(":");move("docs",id,+d,"doc_edit");return}
 if(q("[data-newrem]")){editRem(null);return}
 if(x=q("[data-editrem]")){editRem(x.dataset.editrem);return}
 if(x=q("[data-saverem]")){saveRem(x.dataset.saverem);return}
 if(x=q("[data-mvrem]")){const[id,d]=x.dataset.mvrem.split(":");move("reminders",id,+d,"reminder_order");return}
 if(q("[data-saveeo]")){saveEo();return}
 if(q("[data-cleareo]")){SB.setCfg("eotm",{});SB.log(D.me.email,"eotm","—");toast(tx("أُخفيت البطاقة","Card hidden"));render(false);return}
 if(q("[data-newapp]")){editApp(null);return}
 if(x=q("[data-editapp]")){editApp(x.dataset.editapp);return}
 if(x=q("[data-saveapp]")){saveApp(x.dataset.saveapp);return}
 if(x=q("[data-mvapp]")){const[id,d]=x.dataset.mvapp.split(":");move("apps",id,+d,"app_edit");return}
 if(x=q("[data-icon]")){D.pend.icon=x.dataset.icon;$$("#aIc button").forEach(b=>b.classList.toggle("on",b===x));return}
 if(x=q("[data-color]")){D.pend.color=x.dataset.color;$$("#aCl button").forEach(b=>b.classList.toggle("on",b===x));$("#aCc").value=x.dataset.color;return}
 if(q("[data-newbranch]")){editBranch(null);return}
 if(x=q("[data-editbranch]")){editBranch(x.dataset.editbranch);return}
 if(x=q("[data-savebranch]")){saveBranch(x.dataset.savebranch);return}
 if(x=q("[data-mvbranch]")){const[id,d]=x.dataset.mvbranch.split(":");move("branches",id,+d,"branch_edit");return}
 if(q("[data-addfact]")){$("#facts").insertAdjacentHTML("beforeend",factRow({}));return}
 if(q("[data-addsoc]")){$("#socs").insertAdjacentHTML("beforeend",socRow([]));return}
 if(x=q("[data-rmrow]")){x.closest(".li").remove();return}
 if(q("[data-savecompany]")){saveCompany();return}
 if(q("[data-newleader]")){editLeader(null);return}
 if(x=q("[data-editleader]")){editLeader(x.dataset.editleader);return}
 if(x=q("[data-saveleader]")){saveLeader(x.dataset.saveleader);return}
 if(x=q("[data-mvleader]")){const[id,d]=x.dataset.mvleader.split(":");move("leaders",id,+d,"leader_edit");return}
 if(q("[data-savecontact]")){saveContact();return}
 if(x=q("[data-del]")){const[col,id]=x.dataset.del.split(":");const o=SB.get(col,id);const nm=o?(L(o,"title")||L(o,"name")||""):"";
  if(await confirmBox(tx("تأكيد الحذف","Confirm delete"),tx(`سيُحذف «${nm}» من البوابة لجميع الموظفين.`,`“${nm}” will be removed from the portal for everyone.`))){if(o&&o.cover)SB.files.del(o.cover);if(o&&o.url)SB.files.del(o.url);SB.remove(col,id);SB.log(D.me.email,{news:"news_del",docs:"doc_del",apps:"app_del",branches:"branch_del",reminders:"reminder_del",leaders:"leader_edit"}[col]||"settings",nm.slice(0,40));if($("#drawer").classList.contains("open"))closeDrawer();toast(tx("تم الحذف","Deleted"))}return}
 // settings
 if(q("[data-saveset]")){const start=Number($("#sWs").value),end=Number($("#sWe").value),leave=Number($("#sLv").value);if(!Number.isInteger(start)||!Number.isInteger(end)||start<0||end>23||end<=start||!Number.isInteger(leave)||leave<0||leave>366)return toast(tx("راجع ساعات العمل ورصيد الإجازة؛ النهاية يجب أن تكون بعد البداية.","Check working hours and leave allowance; closing must follow opening."));const s=SB.cfg("settings",{});SB.setCfg("settings",{...s,portalName:$("#sNm").value.trim(),annualLeaveDays:leave,workStart:+$("#sWs").value,workEnd:+$("#sWe").value,requireApproval:$("#sAp").checked});SB.log(D.me.email,"settings","");toast(tx("تم الحفظ","Saved"));return}
 if(q("[data-export]")){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(SB.exportAll(),null,1)],{type:"application/json"}));a.download="sindbad-demo-data.json";document.body.appendChild(a);a.click();a.remove();return}
 if(q("[data-reset]")){if(await confirmBox(tx("إعادة البيانات التجريبية؟","Reset demo data?"),tx("ستعود كل البيانات (الحسابات، الطلبات، الرسائل، المحتوى) إلى الحالة الأولى، وستحتاج لتسجيل الدخول مجددًا.","All accounts, requests, messages and content return to the initial demo state. You’ll need to sign in again."),tx("إعادة الضبط","Reset"))){await SB.reset();D.me=null;shell();toast(tx("تمت إعادة الضبط","Reset complete"))}return}
});
document.addEventListener("submit",e=>{e.preventDefault();if(e.target.id==="dlogin")doLogin();
 if(e.target.id==="dreply"){const v=$("#drBody").value.trim();if(!v)return;try{SB.mail.reply(D.mthread,curBox(),v,[]);D.replyDraft=null;SB.log(D.me.email,"mail","");toast(tx("تم إرسال الرد","Reply sent"));render(false)}catch(_){toast(tx("تعذّر الإرسال، حاول مجددًا.","Couldn’t send. Please retry."))}}});
document.addEventListener("input",e=>{const id=e.target.id;
 if(id==="drBody")D.replyDraft={id:D.mthread,box:curBox(),v:e.target.value};
 if(id==="mq"){D.mq=e.target.value;const box=curBox(),q=D.mq.trim().toLowerCase();let th=SB.mail.threads(box,D.mfold);if(q)th=th.filter(t=>SB.mail.thread(t.id,box).some(m=>(m.subject+" "+m.body+" "+m.from+" "+dname(m.from)).toLowerCase().includes(q)));$("#mrows").innerHTML=mrows(th,box)}
 if(id==="rqQ"){D.rq.q=e.target.value;clearTimeout(D._t);D._t=setTimeout(()=>{render(false);const i=$("#rqQ");i.focus();i.setSelectionRange(i.value.length,i.value.length)},250)}
 if(id==="eQ"){D.emp.q=e.target.value;clearTimeout(D._t);D._t=setTimeout(()=>{render(false);const i=$("#eQ");i.focus();i.setSelectionRange(i.value.length,i.value.length)},250)}
 if(id==="nQ"){D.news.q=e.target.value;clearTimeout(D._t);D._t=setTimeout(()=>{render(false);const i=$("#nQ");i.focus();i.setSelectionRange(i.value.length,i.value.length)},250)}
 if(id==="aQ"){D.act.q=e.target.value;clearTimeout(D._t);D._t=setTimeout(()=>{render(false);const i=$("#aQ");i.focus();i.setSelectionRange(i.value.length,i.value.length)},250)}
 if(["eNa","eNe","eRa","eRe","eMo","eWa","eWe"].includes(id))eoLive();
 if(id==="aCc"){D.pend.color=e.target.value;$$("#aCl button").forEach(b=>b.classList.remove("on"))}
});
document.addEventListener("change",async e=>{const id=e.target.id;
 if(id==="rqType"){D.rq.type=e.target.value;render(false)}if(id==="rqBr"){D.rq.branch=e.target.value;render(false)}
 if(id==="eDept"){D.emp.dept=e.target.value;render(false)}
 if(id==="cmAtt"){D.pend.cm=(D.pend.cm||[]).concat([...e.target.files].filter(f=>f.size<=15*1048576)).slice(0,6);pendList("cm");e.target.value=""}
 if(id==="nCov"&&e.target.files[0]){D.pend.cover=e.target.files[0];$("#nPrev img").src=URL.createObjectURL(D.pend.cover);$$("#nPick button").forEach(b=>b.classList.remove("on"))}
 if(id==="dF"&&e.target.files[0]){D.pend.doc=e.target.files[0];$("#dFn").textContent=D.pend.doc.name+" · "+fsize(D.pend.doc.size)}
 if(id==="eU"&&e.target.value){const u=SB.get("users",e.target.value);$("#eNa").value=u.name_ar;$("#eNe").value=u.name_en;$("#eRa").value=u.job||"";$("#eBr").value=u.branch||"";$("#eRe").value="";$("#eWa").value="";$("#eWe").value="";D.pend.eoEmail=u.email;eoLive()}
 if(id==="eF"&&e.target.files[0]){D.pend.eoPhoto=URL.createObjectURL(e.target.files[0]);eoLive()}
 if(id==="eBr")eoLive();
 if(id==="impF"&&e.target.files[0]){try{const snapshot=JSON.parse(await e.target.files[0].text());if(!await confirmBox(tx("استبدال بيانات المعاينة؟","Replace preview data?"),tx("ستُستبدل الحسابات والطلبات والرسائل الحالية بمحتوى الملف. صدّر نسخة من بياناتك أولًا. المرفقات غير مشمولة.","Current accounts, requests and messages will be replaced by the file. Export your current data first. Attachments are not included."),tx("استبدال البيانات","Replace data")))return;SB.importAll(snapshot);toast(tx("تم الاستيراد","Imported"));render(false)}catch(_){toast(tx("ملف غير صالح.","Invalid file."))}}
});
document.addEventListener("keydown",e=>{
 if(D.sideOpen&&e.key==="Tab"){const f=[...$("#side").querySelectorAll("button,a[href]")].filter(el=>el.getClientRects().length&&!el.disabled);if(e.shiftKey&&document.activeElement===f[0]){e.preventDefault();f.at(-1).focus()}else if(!e.shiftKey&&document.activeElement===f.at(-1)){e.preventDefault();f[0].focus()}}
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();openPal();return}
 if(e.key==="Escape"){if($("#drawer").classList.contains("open"))closeDrawer();closeSide()}
 if(e.key==="Enter"&&e.target.matches("[data-req],[data-thread],[data-go].kpi,.bcard")&&!/button|a|tr/i.test(e.target.tagName)){e.target.click()}
});
$("#palQ").oninput=()=>{PS=0;rPal()};
$("#palQ").onkeydown=e=>{if(e.key==="ArrowDown"){PS=Math.min(PS+1,PI.length-1);rPal();e.preventDefault()}else if(e.key==="ArrowUp"){PS=Math.max(PS-1,0);rPal();e.preventDefault()}else if(e.key==="Enter")runPal(PS)};
$("#pal").addEventListener("click",e=>{if(e.target.id==="pal")$("#pal").close()});
window.addEventListener("hashchange",()=>{const h=location.hash.slice(1);if(D.me&&VIEWS[h]&&h!==D.view)go(h,true)});
$("#dClose").onclick=closeDrawer;$("#scrim").onclick=()=>{if($("#drawer").classList.contains("open"))closeDrawer();closeSide()};

/* live sync with the portal */
let lastOpen=0;
SB.on((k,local)=>{
 if(k==="files"){$$("[data-ref]").forEach(el=>{const u=SB.files.cached(el.dataset.ref);if(u)el.src=u});return}
 if(k==="session:dashboard"){const was=!!D.me;D.me=SB.auth.current("dashboard");if(was!==!!D.me){shell();if(D.me)render(false)}return}
 if(!D.me)return;
 if(k==="c:users"){D.me=SB.auth.current("dashboard");if(!D.me){shell();return}}
 if(k==="c:requests"&&!local){const n=openReqs().length;if(n>lastOpen)toast(tx("وصل طلب جديد من البوابة","New request from the portal"));lastOpen=n}
 if(k==="c:messages"&&!local){const n=unreadAll();if(n>(D.lastUnread??n))toast(tx("رسالة جديدة في صناديقك","New message in your mailboxes"));D.lastUnread=n}
 if(k.startsWith("c:")||k.startsWith("cfg:"))softRender();
});

/* boot */
SB.ready.then(()=>{D.me=SB.auth.current("dashboard");shell();if(D.me){lastOpen=openReqs().length;D.lastUnread=unreadAll();const h=location.hash.slice(1);go(VIEWS[h]?h:"overview")}});
})();
