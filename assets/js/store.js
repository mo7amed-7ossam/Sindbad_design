/* =====================================================================
   Sindbad Inside — shared data layer
   Used by the portal (index.html) and the dashboard (dashboard/).
   Prototype backend: data lives in the browser (localStorage + IndexedDB
   for files) and syncs live between open tabs of the same origin.
   To move to a real server, re-implement the functions below with the
   same signatures (see README → "Connecting a backend").
   ===================================================================== */
(function (global) {
  "use strict";
  const NS = "sbx:v2:";
  const DOMAIN = "sindbad.om";
  const now = () => Date.now();
  const uid = () => now().toString(36) + Math.random().toString(36).slice(2, 7);
  const listeners = new Set();

  /* ---------- low-level storage ---------- */
  function read(k, d) { try { const v = localStorage.getItem(NS + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function write(k, v) {
    try { localStorage.setItem(NS + k, JSON.stringify(v)); }
    catch (e) { const err = new Error("quota"); err.code = "quota"; throw err; }
    emit(k);
  }
  let queuedEvents = null;
  function emit(k) { if (queuedEvents) { queuedEvents.add(k); return; } listeners.forEach(f => { try { f(k, true); } catch (e) { console.error(e); } }); }
  global.addEventListener("storage", e => {
    if (!e.key || !e.key.startsWith(NS)) return;
    const k = e.key.slice(NS.length);
    listeners.forEach(f => { try { f(k, false); } catch (err) { console.error(err); } });
  });

  function transaction(run) {
    if (queuedEvents) return run();
    const keys = COLS.map(c => NS + "c:" + c).concat(["seq","settings","company","contact","eotm"].map(k=>NS+"cfg:"+k),[NS+"seeded"]);
    const before = keys.map(k => [k, localStorage.getItem(k)]);
    queuedEvents = new Set();
    try {
      const result = run(), events = queuedEvents;
      queuedEvents = null; events.forEach(emit); return result;
    } catch (error) {
      queuedEvents = null;
      before.forEach(([k,v]) => { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k,v); } catch (_) {} });
      throw error;
    }
  }

  /* ---------- reference data ---------- */
  const DEPTS = [
    { k: "management", ar: "الإدارة العليا", en: "Management", c: "#08343B" },
    { k: "hr", ar: "الموارد البشرية", en: "Human Resources", c: "#7B61C9" },
    { k: "it", ar: "التقنية", en: "Technology", c: "#0A8BA0" },
    { k: "accounts", ar: "الحسابات", en: "Accounts", c: "#B07A4A" },
    { k: "sales", ar: "المبيعات والتصميم", en: "Sales & Design", c: "#077585" },
    { k: "operations", ar: "العمليات واللوجستيات", en: "Operations & Logistics", c: "#2F9E57" },
    { k: "marketing", ar: "التسويق", en: "Marketing", c: "#E08A1E" },
    { k: "training", ar: "التدريب والتطوير", en: "Training & Development", c: "#F26B21" },
    { k: "support", ar: "الدعم الفني", en: "Technical Support", c: "#383837" }
  ];
  const RESERVED = DEPTS.map(d => d.k).concat(["all", "admin", "info", "noreply", "postmaster"]);
  const ROLES = {
    employee: { ar: "موظف", en: "Employee", perms: [], boxes: [] },
    editor: { ar: "محرر محتوى", en: "Content editor", perms: ["content"], boxes: ["marketing"] },
    hr: { ar: "الموارد البشرية", en: "HR officer", perms: ["requests", "employees", "mail", "eotm"], boxes: ["hr", "management"], depts: ["hr"] },
    it: { ar: "التقنية", en: "IT officer", perms: ["requests", "employees", "mail", "systems"], boxes: ["it", "support"], depts: ["it"] },
    admin: { ar: "مدير النظام", en: "Administrator", perms: ["*"], boxes: "*", depts: "*" }
  };
  const REQ_TYPES = {
    leave: { dept: "hr", i: "cal", c: "#0A8BA0", ar: "طلب إجازة", en: "Leave request",
      chain: [["الموظف", "Employee"], ["المدير المباشر", "Direct manager"], ["الموارد البشرية", "HR"], ["المدير العام", "General manager"]] },
    exit: { dept: "hr", i: "exit", c: "#7B61C9", ar: "إذن انصراف", en: "Exit permission",
      chain: [["الموظف", "Employee"], ["المدير المباشر", "Direct manager"], ["الموارد البشرية", "HR"]] },
    advance: { dept: "hr", i: "coin", c: "#B07A4A", ar: "سلفة مالية", en: "Salary advance",
      chain: [["الموظف", "Employee"], ["المدير المباشر", "Direct manager"], ["الموارد البشرية", "HR"], ["مدير الأفرع", "Head of branches"]] },
    letter: { dept: "hr", i: "file", c: "#383837", ar: "شهادة أو خطاب", en: "Letter / certificate",
      chain: [["الموظف", "Employee"], ["الموارد البشرية", "HR"]] },
    account: { dept: "it", i: "mail", c: "#2F9E57", ar: "حساب لموظف جديد", en: "New staff account",
      chain: [["مقدم الطلب", "Requester"], ["التقنية", "Technology"], ["إنشاء الحساب", "Account created"]] }
  };
  const STATUS = {
    pending: { ar: "جديد", en: "New", tone: "w" },
    review: { ar: "قيد المراجعة", en: "In review", tone: "b" },
    approved: { ar: "معتمد", en: "Approved", tone: "g" },
    rejected: { ar: "مرفوض", en: "Declined", tone: "r" },
    cancelled: { ar: "ملغى", en: "Cancelled", tone: "n" }
  };

  /* ---------- hashing (prototype only — real auth must live on a server) ---------- */
  async function hash(pw, salt) {
    const s = salt + "::" + pw;
    if (global.crypto && crypto.subtle && global.TextEncoder) {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
      return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
    }
    let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return "f" + (h >>> 0).toString(16);
  }

  /* ---------- generic collections ---------- */
  const COLS = ["users", "news", "docs", "apps", "branches", "reminders", "leaders", "requests", "messages", "activity"];
  function list(col) { return read("c:" + col, []); }
  function get(col, id) { return list(col).find(x => x.id === id) || null; }
  function saveAll(col, arr) { write("c:" + col, arr); }
  function put(col, obj) {
    const arr = list(col); const t = now();
    if (obj.id) {
      const i = arr.findIndex(x => x.id === obj.id);
      if (i > -1) { arr[i] = { ...arr[i], ...obj, updatedAt: t }; saveAll(col, arr); return arr[i]; }
    }
    const o = { ...obj, id: obj.id || uid(), createdAt: obj.createdAt || t, updatedAt: t };
    arr.push(o); saveAll(col, arr); return o;
  }
  function remove(col, id) { saveAll(col, list(col).filter(x => x.id !== id)); }
  function cfg(k, d) { return read("cfg:" + k, d); }
  function setCfg(k, v) { write("cfg:" + k, v); }

  /* ---------- activity log ---------- */
  function log(actor, action, target, meta) {
    const arr = list("activity");
    arr.push({ id: uid(), at: now(), actor: actor || "system", action, target: target || "", meta: meta || null });
    saveAll("activity", arr.slice(-400));
  }

  /* ---------- users & auth ---------- */
  const addr = local => local.includes("@") ? local.toLowerCase().trim() : (local.toLowerCase().trim() + "@" + domain());
  function domain() { return (cfg("settings", {}).emailDomain || DOMAIN).replace(/^@/, ""); }
  function slug(name) { return String(name || "").toLowerCase().normalize("NFKD").replace(/[^a-z\s-]/g, "").trim().split(/\s+/).filter(Boolean); }
  function suggestEmail(nameEn, exceptId) {
    const w = slug(nameEn).filter(x => !["bin", "bint", "ibn"].includes(x));
    if (!w.length) return "";
    let base = w[0];
    if (w.length > 1) {
      let last = w[w.length - 1];
      if (w.length > 2 && ["al", "el"].includes(w[w.length - 2])) last = "al" + last;
      if (last !== "al") base = w[0] + "." + last;
    }
    let cand = base, n = 2;
    const taken = new Set(list("users").filter(u => u.id !== exceptId).map(u => u.email.split("@")[0]));
    while (taken.has(cand) || RESERVED.includes(cand)) cand = base + n++;
    return cand + "@" + domain();
  }
  function publicUser(u) { if (!u) return null; const { password, salt, ...rest } = u; return rest; }
  function users() { return list("users").map(publicUser); }
  function userByEmail(e) { const a = addr(e); return list("users").find(u => u.email === a) || null; }
  function displayName(email, lang) {
    const d = DEPTS.find(x => x.k + "@" + domain() === email);
    if (d) return lang === "en" ? d.en : d.ar;
    if (email === "all@" + domain()) return lang === "en" ? "All staff" : "جميع الموظفين";
    if (email === "noreply@" + domain()) return lang === "en" ? "Portal system" : "نظام البوابة";
    const u = list("users").find(x => x.email === email);
    if (u) return (lang === "en" ? (u.name_en || u.name_ar) : (u.name_ar || u.name_en)) || email;
    return email;
  }

  async function register(f) {
    const s = cfg("settings", {});
    if (!f.name_ar || !f.name_en) throw err("name");
    if (!f.password || f.password.length < 8) throw err("weak");
    const email = suggestEmail(f.name_en);
    if (!email) throw err("name");
    const salt = uid();
    const u = put("users", {
      email, salt, password: await hash(f.password, salt),
      name_ar: f.name_ar.trim(), name_en: f.name_en.trim(), empNo: (f.empNo || "").trim(),
      branch: f.branch || "", dept: f.dept || "", job: (f.job || "").trim(), phone: (f.phone || "").trim(),
      role: "employee", status: s.requireApproval === false ? "active" : "pending", leaveBalance: Number(s.annualLeaveDays ?? 30), avatar: ""
    });
    log(email, "register", email);
    send({ from: "noreply@" + domain(), to: ["hr@" + domain()], subject: "تسجيل حساب جديد: " + u.name_ar, kind: "system",
      body: `سجّل ${u.name_ar} (${u.name_en}) حسابًا جديدًا في البوابة.\nالبريد: ${email}\nالفرع: ${u.branch || "—"}\nالقسم: ${u.dept || "—"}\nالمسمى: ${u.job || "—"}\n\n${u.status === "pending" ? "الحساب بانتظار التفعيل من لوحة التحكم." : "تم تفعيل الحساب تلقائيًا."}` });
    if (u.status === "active") welcome(u);
    return publicUser(u);
  }
  function welcome(u) {
    send({ from: "management@" + domain(), to: [u.email], kind: "system",
      subject: "أهلًا بك في السندباد",
      body: `أهلًا ${u.name_ar}،\n\nتم تفعيل حسابك في البوابة الداخلية، وهذا بريدك الرسمي في الشركة: ${u.email}\nاستخدمه للتواصل مع الإدارة والأقسام وتقديم الطلبات ومتابعتها.\n\nابدأ بقراءة دليل الموظف العام (إصدار سبتمبر 2026) ووقّع إقرار الاستلام مع مديرك المباشر.\n\nمع التحية،\nإدارة السندباد` });
  }
  async function createUser(f, actor) {
    if (!f.name_ar || !f.name_en) throw err("name");
    if (!f.password || f.password.length < 8) throw err("weak");
    let email = f.email ? addr(f.email) : suggestEmail(f.name_en);
    if (!email) throw err("name");
    if (list("users").some(u => u.email === email) || RESERVED.includes(email.split("@")[0])) throw err("taken");
    const salt = uid();
    const u = put("users", { email, salt, password: await hash(f.password, salt), name_ar: f.name_ar.trim(), name_en: f.name_en.trim(),
      empNo: f.empNo || "", branch: f.branch || "", dept: f.dept || "", job: f.job || "", phone: f.phone || "",
      role: f.role || "employee", status: "active", leaveBalance: Number.isFinite(Number(f.leaveBalance ?? 30)) ? Math.max(0, Number(f.leaveBalance ?? 30)) : 30, avatar: "" });
    log(actor ? actor.email : "system", "user_new", email);
    welcome(u);
    return publicUser(u);
  }
  function err(code) { const e = new Error(code); e.code = code; return e; }
  async function login(email, pw, scope) {
    const u = userByEmail(email || "");
    if (!u || (await hash(pw || "", u.salt)) !== u.password) throw err("invalid");
    if (u.status === "pending") throw err("pending");
    if (u.status === "disabled") throw err("disabled");
    if (scope === "dashboard" && (!ROLES[u.role] || !ROLES[u.role].perms.length)) throw err("forbidden");
    write("session:" + scope, { uid: u.id, at: now() });
    put("users", { id: u.id, lastLogin: now() });
    log(u.email, scope === "dashboard" ? "login_dash" : "login", "");
    return publicUser(get("users", u.id));
  }
  function current(scope) {
    const s = read("session:" + scope, null); if (!s) return null;
    const u = get("users", s.uid);
    if (!u || u.status !== "active") return null;
    if (scope === "dashboard" && (!ROLES[u.role] || !ROLES[u.role].perms.length)) return null;
    return publicUser(u);
  }
  function logout(scope) { try { localStorage.removeItem(NS + "session:" + scope); } catch (e) {} emit("session:" + scope); }
  async function changePassword(id, oldPw, newPw) {
    const u = get("users", id); if (!u) throw err("invalid");
    if (oldPw !== null && (await hash(oldPw, u.salt)) !== u.password) throw err("invalid");
    if (!newPw || newPw.length < 8) throw err("weak");
    const salt = uid(); put("users", { id, salt, password: await hash(newPw, salt) });
    log(u.email, "password", u.email);
  }
  function can(user, perm) {
    if (!user) return false; const r = ROLES[user.role]; if (!r) return false;
    return r.perms.includes("*") || r.perms.includes(perm);
  }
  function boxesFor(user) {
    if (!user) return [];
    const r = ROLES[user.role] || ROLES.employee;
    const dept = r.boxes === "*" ? DEPTS.map(d => d.k) : (r.boxes || []);
    return [user.email].concat(dept.map(k => k + "@" + domain()));
  }

  /* ---------- internal mail ---------- */
  function send(m) {
    const all = list("messages"); const t = now();
    const msg = {
      id: uid(), threadId: m.threadId || uid(), from: addr(m.from), to: [...new Set((m.to || []).map(addr))],
      subject: (m.subject || "").trim() || "(بدون عنوان)", body: m.body || "", at: m.at || t,
      attachments: m.attachments || [], kind: m.kind || "mail", ref: m.ref || null, state: {}
    };
    msg.state[msg.from] = { read: true };
    all.push(msg); saveAll("messages", all.slice(-1500));
    return msg;
  }
  const involves = (m, a) => m.from === a || m.to.includes(a) || (m.to.includes("all@" + domain()) && a !== m.from && !DEPTS.some(d => d.k + "@" + domain() === a));
  const received = (m, a) => m.to.includes(a) || (m.to.includes("all@" + domain()) && !DEPTS.some(d => d.k + "@" + domain() === a));
  function st(m, a) { return m.state[a] || {}; }
  function threads(a, folder) {
    const msgs = list("messages").filter(m => involves(m, a));
    const by = {};
    msgs.forEach(m => { (by[m.threadId] = by[m.threadId] || []).push(m); });
    const out = [];
    Object.values(by).forEach(ms => {
      ms.sort((x, y) => x.at - y.at);
      const any = f => ms.some(f);
      const trash = ms.every(m => st(m, a).trash);
      const arch = ms.filter(m => received(m, a)).length > 0 && ms.filter(m => received(m, a)).every(m => st(m, a).arch);
      const star = any(m => st(m, a).star);
      const inbox = any(m => received(m, a) && !st(m, a).trash && !st(m, a).arch);
      const sent = any(m => m.from === a && !st(m, a).trash);
      const ok = folder === "inbox" ? inbox && !trash
        : folder === "sent" ? sent
        : folder === "starred" ? star && !trash
        : folder === "archive" ? arch && !trash
        : folder === "trash" ? any(m => st(m, a).trash) : false;
      if (!ok) return;
      const last = ms[ms.length - 1];
      const unread = ms.filter(m => received(m, a) && m.from !== a && !st(m, a).read && !st(m, a).trash && !st(m, a).arch).length;
      out.push({ id: last.threadId, subject: ms[0].subject, last, count: ms.length, unread, star, kind: ms[0].kind, ref: ms[0].ref,
        people: [...new Set(ms.map(m => m.from).concat(...ms.map(m => m.to)))], hasFiles: any(m => m.attachments && m.attachments.length) });
    });
    return out.sort((x, y) => y.last.at - x.last.at);
  }
  function thread(threadId, mailbox) { if (!mailbox) return []; return list("messages").filter(m => m.threadId === threadId && involves(m, addr(mailbox))).sort((x, y) => x.at - y.at); }
  function markThread(threadId, a, patch) {
    const all = list("messages");
    all.forEach(m => { if (m.threadId === threadId && involves(m, a)) m.state[a] = { ...(m.state[a] || {}), ...patch }; });
    saveAll("messages", all);
  }
  function unread(a) { return threads(a, "inbox").reduce((s, t) => s + (t.unread ? 1 : 0), 0); }
  function replyRecipients(threadId, from) {
    const f = addr(from), ms = thread(threadId, f);
    if (!ms.length) return [];
    // A broadcast reply goes to the author, never to all staff.
    const first = ms[0];
    const recipients = first.to.includes("all@" + domain())
      ? [first.from === f ? ms.slice().reverse().find(m=>m.from!==f)?.from : first.from]
      : [first.from, ...first.to];
    return [...new Set(recipients)].filter(a => a && a !== f && a !== "all@" + domain() && !a.startsWith("noreply@"));
  }
  function reply(threadId, from, body, attachments) {
    const f = addr(from), ms = thread(threadId, f), to = replyRecipients(threadId, f);
    if (!ms.length || !to.length) throw err("recipient");
    const first = ms[0];
    return send({ threadId, from: f, to, subject: /^(Re:|رد:)/.test(first.subject) ? first.subject : "رد: " + first.subject,
      body, attachments: attachments || [], ref: first.ref, kind: "mail" });
  }

  /* ---------- requests ---------- */
  function nextReqNo() {
    const y = new Date().getFullYear(); const n = (cfg("seq", {})[y] || 0) + 1;
    const s = cfg("seq", {}); s[y] = n; setCfg("seq", s);
    return `REQ-${y}-${String(n).padStart(4, "0")}`;
  }
  function workingDays(from, to) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from || "") || !/^\d{4}-\d{2}-\d{2}$/.test(to || "")) return 0;
    const a = new Date(from + "T12:00:00Z"), b = new Date(to + "T12:00:00Z");
    if (!Number.isFinite(+a) || !Number.isFinite(+b) || a.toISOString().slice(0,10) !== from || b.toISOString().slice(0,10) !== to || b < a || b-a > 366*864e5) return 0;
    const weekend = cfg("settings", {}).weekend || [5]; let n = 0;
    for (let d = +a; d <= +b; d += 864e5) if (!weekend.includes(new Date(d).getUTCDay())) n++;
    return n;
  }
  function createRequest(user, type, data, attachments) { return transaction(() => {
    const owner = user && get("users", user.id);
    if (!owner || owner.status !== "active") throw err("forbidden");
    user = owner; data = { ...(data || {}) };
    if (type === "leave") {
      data.days = workingDays(data.from, data.to);
      if (!data.days) throw err("dates");
      if (data.kind === "annual" && data.days > (owner.leaveBalance ?? 30)) throw err("balance");
      if (list("requests").some(r => r.userId === user.id && r.type === "leave" && !["rejected","cancelled"].includes(r.status) && r.data.from <= data.to && r.data.to >= data.from)) throw err("overlap");
    }
    const T = REQ_TYPES[type]; if (!T) throw err("type");
    const r = put("requests", { no: nextReqNo(), type, userId: user.id, email: user.email, dept: T.dept, branch: user.branch || "", data: data || {},
      attachments: attachments || [], status: "pending", history: [{ at: now(), by: user.email, action: "submitted", note: data && data.reason || "" }] });
    const m = send({ from: user.email, to: [T.dept + "@" + domain()], kind: "request", ref: { type: "request", id: r.id },
      subject: `${T.ar} · ${r.no}`, body: summarize(r, "ar"), attachments: attachments || [] });
    put("requests", { id: r.id, threadId: m.threadId });
    log(user.email, "request_new", r.no);
    return get("requests", r.id);
  }); }
  function summarize(r, lang) {
    const d = r.data || {}, ar = lang !== "en";
    const rows = [];
    const L = (a, e) => ar ? a : e;
    if (r.type === "leave") { rows.push([L("النوع", "Type"), d.kindLabel || d.kind], [L("من", "From"), d.from], [L("إلى", "To"), d.to], [L("عدد الأيام", "Days"), d.days], [L("البديل", "Cover"), d.cover]); }
    if (r.type === "exit") { rows.push([L("التاريخ", "Date"), d.date], [L("من الساعة", "From"), d.fromTime], [L("إلى الساعة", "To"), d.toTime]); }
    if (r.type === "advance") { rows.push([L("المبلغ", "Amount"), d.amount ? d.amount + L(" ر.ع", " OMR") : ""], [L("عدد الأقساط", "Installments"), d.months]); }
    if (r.type === "letter") { rows.push([L("النوع", "Type"), d.kindLabel || d.kind], [L("موجّه إلى", "Addressed to"), d.to], [L("اللغة", "Language"), d.lang]); }
    if (r.type === "account") { rows.push([L("الاسم", "Name"), d.name_ar], [L("بالإنجليزية", "English"), d.name_en], [L("المسمى", "Job"), d.job], [L("القسم", "Dept"), d.dept], [L("الفرع", "Branch"), d.branch]); }
    rows.push([L("السبب / التفاصيل", "Reason / details"), d.reason]);
    return rows.filter(x => x[1]).map(x => x[0] + ": " + x[1]).join("\n");
  }
  function decide(id, actor, status, note) { return transaction(() => {
    const r = get("requests", id); if (!r) throw err("missing");
    const currentActor = actor && get("users", actor.id);
    const role = currentActor && ROLES[currentActor.role];
    if (!currentActor || currentActor.status !== "active" || !can(currentActor,"requests") || !(role.depts === "*" || (role.depts || []).includes(r.dept))) throw err("forbidden");
    actor = currentActor;
    if (r.status === status) return r;
    const transitions = { pending: ["review","approved","rejected"], review: ["approved","rejected"], approved: ["pending"], rejected: ["pending"], cancelled: [] };
    if (!(transitions[r.status] || []).includes(status)) throw err("transition");
    if (status === "rejected" && !String(note || "").trim()) throw err("reason");
    const T = REQ_TYPES[r.type];
    const h = (r.history || []).concat({ at: now(), by: actor.email, action: status, note: note || "" });
    const patch = { id, status, history: h };
    if (r.type === "leave" && r.data && /annual|سنوية/.test(r.data.kind || "")) {
      const u = get("users", r.userId), days = Number(r.data.days);
      if (!u || !Number.isFinite(days) || days <= 0) throw err("dates");
      // Legacy approved requests already deducted their days in v2.
      const previousDebit = r.leaveDebit ?? (r.status === "approved" ? days : 0);
      const nextDebit = status === "approved" ? days : 0;
      const available = Number(u.leaveBalance ?? 30) + previousDebit;
      if (nextDebit > available) throw err("balance");
      if (previousDebit !== nextDebit) put("users", { id: u.id, leaveBalance: available - nextDebit });
      patch.leaveDebit = nextDebit;
    }
    put("requests", patch);
    const lab = STATUS[status] ? STATUS[status].ar : status;
    const body = `تم تحديث حالة طلبك ${r.no} (${T.ar}) إلى: ${lab}.${note ? "\n\nملاحظة " + displayName(actor.email) + ":\n" + note : ""}\n\nيمكنك متابعة الطلب من صفحة «الطلبات» في البوابة.`;
    if (r.threadId) send({ threadId: r.threadId, from: T.dept + "@" + domain(), to: [r.email], subject: `${T.ar} · ${r.no}`, body, kind: "request", ref: { type: "request", id } });
    else send({ from: T.dept + "@" + domain(), to: [r.email], subject: `${T.ar} · ${r.no}`, body, kind: "request", ref: { type: "request", id } });
    log(actor.email, "request_" + status, r.no);
    return get("requests", id);
  }); }
  function cancelRequest(id, user) {
    const r = get("requests", id); if (!r || r.userId !== user.id || !["pending", "review"].includes(r.status)) return null;
    put("requests", { id, status: "cancelled", history: r.history.concat({ at: now(), by: user.email, action: "cancelled", note: "" }) });
    log(user.email, "request_cancelled", r.no);
    return get("requests", id);
  }

  /* ---------- files (IndexedDB) ---------- */
  let dbp = null; const urlCache = {}; const pending = {};
  function idb() {
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      if (!global.indexedDB) return rej(err("noidb"));
      const r = indexedDB.open("sindbad-files", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("files", { keyPath: "id" });
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    });
    return dbp;
  }
  async function filePut(file) {
    if (file.size > 15 * 1024 * 1024) throw err("too_big");
    const db = await idb(); const id = uid();
    await new Promise((res, rej) => { const tx = db.transaction("files", "readwrite"); tx.objectStore("files").put({ id, blob: file, name: file.name, type: file.type, size: file.size, at: now() }); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
    return { ref: "idb:" + id, name: file.name, size: file.size, type: file.type };
  }
  async function fileGet(ref) {
    if (!ref || !ref.startsWith("idb:")) return ref || "";
    if (urlCache[ref]) return urlCache[ref];
    const db = await idb();
    const rec = await new Promise((res, rej) => { const q = db.transaction("files").objectStore("files").get(ref.slice(4)); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); });
    if (!rec) return "";
    return (urlCache[ref] = URL.createObjectURL(rec.blob));
  }
  function fileCached(ref) {
    if (!ref) return "";
    if (!ref.startsWith("idb:")) return ref;
    if (urlCache[ref]) return urlCache[ref];
    if (!pending[ref]) pending[ref] = fileGet(ref).then(u => { delete pending[ref]; if (u) emit("files"); }).catch(() => { delete pending[ref]; });
    return "";
  }
  async function fileDel(ref) {
    if (!ref || !ref.startsWith("idb:")) return;
    try { const db = await idb(); db.transaction("files", "readwrite").objectStore("files").delete(ref.slice(4)); } catch (e) {}
    if (urlCache[ref]) { URL.revokeObjectURL(urlCache[ref]); delete urlCache[ref]; }
  }

  /* Upgrade the system catalogue once, without resetting employee data.
     Future dashboard edits are kept. Importing an older snapshot upgrades it on next load. */
  const SYSTEM_APPS = [
  {
    "id": "sindflow",
    "order": 1,
    "icon": "list",
    "color": "#0A8BA0",
    "url": "https://oracleapex.com/ords/r/sindbad_sales/sindbad-sales-panal134338/login",
    "name_ar": "Sindflow",
    "name_en": "Sindflow",
    "desc_ar": "تنظيم مهام موظفي الشركة وتوزيعها ومتابعة تنفيذها.",
    "desc_en": "Organize, assign and track employee tasks."
  },
  {
    "id": "ayun",
    "order": 2,
    "icon": "pin",
    "color": "#2F9E57",
    "url": "https://server.ayunts.com/",
    "name_ar": "Ayun",
    "name_en": "Ayun",
    "desc_ar": "متابعة سيارات النقل وحركة أسطول الشركة.",
    "desc_en": "Track transport vehicles and the company fleet."
  },
  {
    "id": "company-dashboard",
    "order": 3,
    "icon": "building",
    "color": "#08343B",
    "url": "https://www.sindbadom.work/admin/login",
    "name_ar": "Dashboard",
    "name_en": "Dashboard",
    "desc_ar": "نظام الإدارة الداخلية للشركة.",
    "desc_en": "The company’s internal administration system."
  },
  {
    "id": "project-manager",
    "order": 4,
    "icon": "folder",
    "color": "#B07A4A",
    "url": "https://sindbadom.work/pm/login",
    "name_ar": "Project Manager",
    "name_en": "Project Manager",
    "desc_ar": "إدارة مشاريع الشركة ومتابعة سير العمل.",
    "desc_en": "Manage company projects and follow their progress."
  },
  {
    "id": "odoo",
    "order": 5,
    "icon": "chart",
    "color": "#714B67",
    "url": "https://sindbad-home.odoo.com/odoo",
    "name_ar": "Odoo",
    "name_en": "Odoo",
    "desc_ar": "تسجيل العملاء ومتابعتهم وإدارة المحاسبة.",
    "desc_en": "Customer registration, follow-up and accounting."
  },
  {
    "id": "training",
    "order": 6,
    "icon": "cap",
    "color": "#F26B21",
    "url": "",
    "internal": "training",
    "name_ar": "مركز التدريب",
    "name_en": "Training hub",
    "desc_ar": "منصات التعلم والأدلة وأخبار التدريب في مكان واحد.",
    "desc_en": "Learning platforms, guides and training updates in one place."
  }
];
  /* Mobile apps published by Sindbad (store links). Managed from Dashboard → Systems & links. */
  const MOBILE_APPS = [
    { id: "sindbad-care", order: 1, color: "#0A8BA0",
      name_ar: "Sindbad Care", name_en: "Sindbad Care",
      audience_ar: "للعملاء والفنيين", audience_en: "For customers & technicians",
      desc_ar: "طلبات تركيب وصيانة المطابخ: يرسل العميل طلبه بالصور والموقع ويحجز موعدًا ويتابع الحالة، ويستلم الفني مهامه ويوثّق العمل.",
      desc_en: "Kitchen installation and maintenance requests: customers send photos and location, book a slot and track status; technicians receive jobs and document the work.",
      android: "https://play.google.com/store/apps/details?id=om.sindbad.app", ios: "" }
  ];
  function migrateMobile() {
    const seeded = read("seeded", {});
    if (seeded.mobileApps === 1) return;
    const old = list("mobile"), have = new Set(old.map(a => a.id));
    saveAll("mobile", old.concat(MOBILE_APPS.filter(a => !have.has(a.id)).map(a => ({ ...a, createdAt: now(), updatedAt: now() }))));
    write("seeded", { ...read("seeded", {}), mobileApps: 1 });
  }
  function migrateSystems() {
    const seeded = read("seeded", {});
    if (seeded.systemsCatalog === 1) return;
    return transaction(() => {
      const old = list("apps"), ids = new Set(SYSTEM_APPS.map(a => a.id));
      const retained = old.filter(a => !ids.has(a.id) && !(a.id === "attendance" && !a.url && a.name_en === "Attendance app"))
        .map(a => a.id === "elearn" ? {...a, group:"training", order:10} : ["mail","web","map"].includes(a.id) ? {...a, order:{mail:7,web:8,map:9}[a.id]} : a);
      const configured = SYSTEM_APPS.map(a => ({...old.find(x => x.id === a.id), ...a, createdAt:old.find(x => x.id === a.id)?.createdAt || now(), updatedAt:now()}));
      saveAll("apps", configured.concat(retained));
      write("seeded", {...seeded, systemsCatalog:1});
    });
  }

  /* ---------- seed ---------- */
  async function seed(force) {
    if (!force && read("seeded", null)) return false;
    const D = "@" + DOMAIN, day = 864e5, t = now();
    setCfg("settings", { portalName: "Sindbad Inside", emailDomain: DOMAIN, requireApproval: true, workStart: 9, workEnd: 21, weekend: [5], annualLeaveDays: 30 });
    setCfg("company", {
      vision_ar: "أن نكون الشركة الرائدة في سلطنة عُمان في تقديم حلول متكاملة للبيت من مكان واحد، مع تعزيز التصنيع المحلي.",
      vision_en: "To be Oman’s leading company for complete one-stop home solutions, while strengthening local manufacturing.",
      mission_ar: "رسالتنا: نقدّم منتجات عالية الجودة للبيت المتكامل من مكان واحد بالشراكة مع OPPEIN، مع التركيز على تلبية احتياجات السوق المحلي بشكل عملي وفعّال.",
      mission_en: "Our mission: high-quality products for the complete home from one place, in partnership with OPPEIN, meeting local needs practically and effectively.",
      facts: [{ n: 20, p: "+", ar: "عامًا في السوق العماني", en: "years in Oman" }, { n: 7, p: "", ar: "فروع ومعارض", en: "branches" }, { n: 10, p: "", ar: "سنوات ضمان مكتوب", en: "year warranty" }, { n: 7, p: "", ar: "إدارات رئيسية", en: "main departments" }],
      goals_ar: ["نمو مستدام للمبيعات في السوق المحلي", "توسيع الانتشار في السلطنة", "الدخول في مشاريع تجارية وحكومية", "نظام إلكتروني متكامل مدعوم بالذكاء الاصطناعي"],
      goals_en: ["Sustainable local sales growth", "Wider reach across Oman", "Commercial and government projects", "An integrated, AI-powered electronic system"]
    });
    setCfg("contact", {
      phones: ["+968 7115 5500", "+968 7115 5577"], email: "info@sindbadom.com",
      hours_ar: "السبت – الخميس · 9 ص – 9 م", hours_en: "Sat – Thu · 9 AM – 9 PM",
      address_ar: "السيب، المنطقة الصناعية بالمعبيلة · ص.ب 10، ر.ب 615", address_en: "Al Seeb, Maabela Industrial Estate · P.O. Box 10, PC 615",
      maps: "https://www.google.com/maps/d/u/0/viewer?mid=1EFI4TSnIcKnIwLoCsuzvZSDMNwY5Bm4",
      socials: [["Instagram", "https://www.instagram.com/sindbad.oppein/"], ["TikTok", "https://www.tiktok.com/@sindbad.oppein"], ["Snapchat", "https://www.snapchat.com/@sindbad_oppein"], ["YouTube", "https://www.youtube.com/@SINDBAD.OPPEIN"], ["sindbadom.com", "https://sindbadom.com/"]]
    });
    const S = (col, arr) => saveAll(col, arr.map((o, i) => ({ id: o.id || uid(), createdAt: t - (arr.length - i) * day, updatedAt: t - (arr.length - i) * day, ...o })));
    S("docs", [
      { id: "handbook", order: 1, cat: "policies", pages: 15, url: "assets/docs/employee-handbook.pdf", title_ar: "دليل الموظف العام", title_en: "General Employee Handbook", desc_ar: "الرؤية والرسالة، الهيكل التنظيمي، اللائحة الداخلية، ساعات العمل، الإجازات، الحضور والجزاءات.", desc_en: "Vision, structure, internal regulations, hours, leave, attendance and penalties.", edition_ar: "سبتمبر 2026", edition_en: "Sep 2026" },
      { id: "sales", order: 2, cat: "sales", pages: 26, url: "assets/docs/sales-design-procedures.pdf", title_ar: "دليل إجراءات المبيعات والتصميم", title_en: "Sales & Design Procedures Manual", desc_ar: "توحيد الفروع، تحويل العملاء، دورة المبيعات، الـ Pipeline، المؤشرات، العمولة والإنذارات.", desc_en: "Branch unification, transfers, sales cycle, pipeline, KPIs, commission and warnings.", edition_ar: "سبتمبر 2026", edition_en: "Sep 2026" },
      { id: "manager", order: 3, cat: "roles", pages: 2, url: "assets/docs/team-manager-responsibilities.pdf", title_ar: "مهام ومسؤوليات مدير الفريق", title_en: "Team Manager – Duties", desc_ar: "المستهدفات، قيادة الفريق والحضور، صالة العرض، جودة المبيعات، والتنسيق مع التسويق.", desc_en: "Targets, team and attendance, showroom, sales quality, marketing coordination.", edition_ar: "فرع العذيبة", edition_en: "Al Azaiba" },
      { id: "forms", order: 4, cat: "forms", pages: 6, url: "assets/docs/request-forms.pdf", title_ar: "نماذج الطلبات الإدارية", title_en: "Administrative request forms", desc_ar: "إذن انصراف، طلب سلفة مالية، وطلب إجازة — بالعربية والإنجليزية.", desc_en: "Exit permission, salary advance and leave request — Arabic and English.", edition_ar: "عربي / English", edition_en: "AR / EN" },
      { id: "elearn", order: 5, cat: "training", pages: 20, url: "assets/docs/oppein-elearning-guide.pdf", title_ar: "دليل منصة OPPEIN للتدريب", title_en: "OPPEIN E-Learning guide", desc_ar: "حضور التدريب المباشر من المتصفح أو التطبيق، التسجيلات، والمهام والاختبارات.", desc_en: "Live training on web or app, replays, tasks and exams.", edition_ar: "OPPEIN", edition_en: "OPPEIN" },
      { id: "brand", order: 6, cat: "brand", pages: 1, url: "assets/docs/brand-sheet.pdf", title_ar: "دليل الهوية المختصر", title_en: "Mini brand sheet", desc_ar: "الشعار على الخلفيات المختلفة ولوحة الألوان الرسمية.", desc_en: "The logo on different backgrounds and the official palette.", edition_ar: "الهوية", edition_en: "Identity" }
    ]);
    S("apps", [
      { id: "odoo", order: 1, icon: "chart", color: "#714B67", url: "", name_ar: "Odoo", name_en: "Odoo", desc_ar: "CRM، مراحل الصفقات، الفواتير والدفعات.", desc_en: "CRM, deal stages, invoices and payments." },
      { id: "attendance", order: 2, icon: "finger", color: "#0A8BA0", url: "", name_ar: "تطبيق الحضور", name_en: "Attendance app", desc_ar: "مع البصمة، الوسيلة المعتمدة لتسجيل الحضور.", desc_en: "With the fingerprint, the approved way to clock in." },
      { id: "mail", order: 3, icon: "mail", color: "#E08A1E", url: "", name_ar: "بريد السندباد", name_en: "Sindbad Mail", desc_ar: "بريدك الرسمي @sindbad.om داخل البوابة.", desc_en: "Your official @sindbad.om mailbox, inside the portal.", internal: "mail" },
      { id: "elearn", order: 4, icon: "cap", color: "#F26B21", url: "https://oppein.yunxuetang.cn/login.html?isadmin=1", name_ar: "تدريب OPPEIN", name_en: "OPPEIN training", desc_ar: "البث المباشر والتسجيلات والاختبارات.", desc_en: "Live sessions, replays and exams." },
      { id: "web", order: 5, icon: "globe", color: "#383837", url: "https://sindbadom.com/", name_ar: "موقع السندباد", name_en: "Sindbad website", desc_ar: "الموقع الرسمي للعملاء والمنتجات.", desc_en: "The customer site and products." },
      { id: "map", order: 6, icon: "pin", color: "#2F9E57", url: "https://www.google.com/maps/d/u/0/viewer?mid=1EFI4TSnIcKnIwLoCsuzvZSDMNwY5Bm4", name_ar: "خريطة الفروع", name_en: "Branch map", desc_ar: "مواقع الفروع لمشاركتها مع العملاء.", desc_en: "Branch locations to share with clients." }
    ]);
    S("branches", [
      { order: 1, name_ar: "المعبيلة", name_en: "Al Maabilah", region_ar: "مسقط", region_en: "Muscat", addr_ar: "المعبيلة السابعة، مقابل مدرسة الأجيال العصرية الخاصة", addr_en: "Maabilah 7, opposite Al Ajyal Modern Private School" },
      { order: 2, name_ar: "العذيبة", name_en: "Al Azaiba", region_ar: "مسقط", region_en: "Muscat", addr_ar: "شارع 18 نوفمبر، بناية فيفا ماركت", addr_en: "18th November St, Viva Market building" },
      { order: 3, name_ar: "صحار", name_en: "Sohar", region_ar: "شمال الباطنة", region_en: "North Batinah", addr_ar: "", addr_en: "" },
      { order: 4, name_ar: "عبري", name_en: "Ibri", region_ar: "الظاهرة", region_en: "Al Dhahirah", addr_ar: "مقابل جامع السلطان قابوس، بجوار بنك ظفار", addr_en: "Opposite Sultan Qaboos Mosque, next to Bank Dhofar" },
      { order: 5, name_ar: "نزوى", name_en: "Nizwa", region_ar: "الداخلية", region_en: "Ad Dakhiliyah", addr_ar: "", addr_en: "" },
      { order: 6, name_ar: "إبراء", name_en: "Ibra", region_ar: "شمال الشرقية", region_en: "North Sharqiyah", addr_ar: "سفالة إبراء، بجوار مكة هايبر ماركت", addr_en: "Safalat Ibra, next to Makkah Hypermarket" },
      { order: 7, name_ar: "صلالة", name_en: "Salalah", region_ar: "ظفار", region_en: "Dhofar", addr_ar: "مقابل بلدية ظفار واللولو القديم", addr_en: "Opposite Dhofar Municipality and old Lulu" }
    ]);
    S("reminders", [
      { order: 1, img: "team", title_ar: "سجّل حضورك بالبصمة أو تطبيق السندباد", title_en: "Clock in by fingerprint or the Sindbad app", sub_ar: "هما الوسيلتان الوحيدتان المعتمدتان لإثبات الحضور والانصراف.", sub_en: "They are the only approved ways to record attendance.", go: "policies:hours" },
      { order: 2, img: "onboarding", title_ar: "فترة السماح 15 دقيقة، مرة واحدة في الأسبوع", title_en: "A 15-minute grace period, once a week", sub_ar: "المرة الثانية في الأسبوع نفسه تُحتسب تأخيرًا وتُخصم دقائقها من الراتب.", sub_en: "A second time in the same week counts as lateness and is deducted.", go: "policies:penalty" },
      { order: 3, img: "workspace", title_ar: "قدّم طلب الإجازة السنوية قبل شهرين", title_en: "Request annual leave two months ahead", sub_ar: "بدون موافقة نهائية مسبقة تُحسب أيام الإجازة انقطاعًا عن العمل.", sub_en: "Without prior final approval, the days count as absence.", go: "policies:leave" },
      { order: 4, img: "design", title_ar: "سجّل كل عميل في CRM خلال 30 دقيقة", title_en: "Log every client in the CRM within 30 minutes", sub_ar: "العميل غير المسجّل يُحسب للفرع الذي يبدأ معه المعاملة.", sub_en: "An unregistered client goes to whichever branch starts the deal.", go: "sales:transfer" },
      { order: 5, img: "leadership", title_ar: "ردّ على العميل خلال 3 ساعات كحد أقصى", title_en: "Reply to every client within 3 hours", sub_ar: "الرد خلال أول 15 دقيقة يرفع فرصة تحويل العميل حتى 5 أضعاف.", sub_en: "A reply within 15 minutes is up to 5× more likely to convert.", go: "sales:cycle" }
    ]);
    S("leaders", [
      { order: 1, name_ar: "مصطفى بن سليمان بن سالم الفهدي", name_en: "Mustafa bin Sulaiman bin Salim Al Fahdi", role_ar: "المالك والمؤسس", role_en: "Owner & Founder" },
      { order: 2, name_ar: "أحمد صابر محمد عطية", name_en: "Ahmed Saber Mohammed Attia", role_ar: "المدير العام للأفرع", role_en: "General Manager of Branches" }
    ]);
    S("news", [
      { id: "welcome", cat: "general", pinned: true, at: t - 2 * day, title_ar: "أهلًا بكم في البوابة الداخلية للسندباد", title_en: "Welcome to the Sindbad employee portal", body_ar: "من هنا تجدون الأدلة المعتمدة، ونماذج الطلبات، وروابط الأنظمة، وبريدكم الرسمي على نطاق الشركة.\nيرجى مراجعة دليل الموظف العام (إصدار سبتمبر 2026) وتوقيع إقرار الاستلام مع المدير المباشر.", body_en: "Here you’ll find approved manuals, request forms, system links and your official @sindbad.om mailbox.\nPlease review the General Employee Handbook (Sep 2026) and sign the acknowledgment with your manager." },
      { cat: "hr", at: t - 5 * day, title_ar: "الطلبات الإدارية أصبحت إلكترونية بالكامل", title_en: "Administrative requests are now fully online", body_ar: "يمكن تقديم طلبات الإجازة وإذن الانصراف والسلفة والشهادات من صفحة «الطلبات»، ومتابعة حالتها لحظة بلحظة. تصلكم كل التحديثات على بريدكم الرسمي.", body_en: "Leave, exit permission, advance and letter requests can now be submitted from the Requests page and tracked live. All updates reach your official mailbox." },
      { cat: "training", at: t - 9 * day, title_ar: "جلسات OPPEIN المباشرة لفريق المبيعات والتصميم", title_en: "OPPEIN live sessions for sales and design", body_ar: "يرسل المقر رابط كل جلسة قبل بدئها. راجعوا دليل منصة OPPEIN في المكتبة لتفعيل حساباتكم من المتصفح أو التطبيق.", body_en: "HQ sends each session link before it starts. See the OPPEIN guide in the library to activate your account on web or app." },
      { cat: "sales", at: t - 14 * day, title_ar: "تذكير: تسجيل العميل في CRM خلال 30 دقيقة", title_en: "Reminder: log every client in the CRM within 30 minutes", body_ar: "العميل غير المسجّل يُحسب للفرع الذي يبدأ معه المعاملة. التزموا بالتسجيل قبل أي إجراء آخر.", body_en: "An unregistered client counts for whichever branch starts the deal. Register before any other action." }
    ]);
    // demo accounts
    const mk = async (o, pw) => { const salt = uid(); return { id: uid(), salt, password: await hash(pw, salt), status: "active", leaveBalance: 30, avatar: "", createdAt: t - 40 * day, updatedAt: t - 40 * day, ...o }; };
    const U = await Promise.all([
      mk({ email: "admin" + D, name_ar: "مدير النظام", name_en: "System Admin", role: "admin", dept: "management", job: "مدير البوابة", branch: "المقر الرئيسي", empNo: "SB-0001" }, "Admin@2026"),
      mk({ email: "maryam.albalushi" + D, name_ar: "مريم البلوشي", name_en: "Maryam Al Balushi", role: "hr", dept: "hr", job: "أخصائية موارد بشرية", branch: "المقر الرئيسي", empNo: "SB-0102", phone: "+968 9000 0102" }, "Sindbad@2026"),
      mk({ email: "salim.alharthi" + D, name_ar: "سالم الحارثي", name_en: "Salim Al Harthi", role: "it", dept: "it", job: "مسؤول التقنية", branch: "المقر الرئيسي", empNo: "SB-0115", phone: "+968 9000 0115" }, "Sindbad@2026"),
      mk({ email: "noura.alkindi" + D, name_ar: "نورة الكندي", name_en: "Noura Al Kindi", role: "editor", dept: "marketing", job: "منسقة التسويق والمحتوى", branch: "المقر الرئيسي", empNo: "SB-0121" }, "Sindbad@2026"),
      mk({ email: "khalid.alrawahi" + D, name_ar: "خالد الرواحي", name_en: "Khalid Al Rawahi", role: "employee", dept: "sales", job: "مستشار مبيعات", branch: "العذيبة", empNo: "SB-0210", phone: "+968 9000 0210", leaveBalance: 24 }, "Sindbad@2026"),
      mk({ email: "fatma.alsaadi" + D, name_ar: "فاطمة السعدي", name_en: "Fatma Al Saadi", role: "employee", dept: "sales", job: "مصممة داخلية", branch: "المعبيلة", empNo: "SB-0233" }, "Sindbad@2026"),
      mk({ email: "yousuf.almamari" + D, name_ar: "يوسف المعمري", name_en: "Yousuf Al Mamari", role: "employee", dept: "sales", job: "مدير فريق", branch: "صحار", empNo: "SB-0241" }, "Sindbad@2026"),
      mk({ email: "aisha.alhinai" + D, name_ar: "عائشة الهنائي", name_en: "Aisha Al Hinai", role: "employee", dept: "accounts", job: "محاسبة", branch: "المقر الرئيسي", empNo: "SB-0150" }, "Sindbad@2026"),
      mk({ email: "said.albusaidi" + D, name_ar: "سعيد البوسعيدي", name_en: "Said Al Busaidi", role: "employee", dept: "operations", job: "منسق تركيبات", branch: "نزوى", empNo: "SB-0305" }, "Sindbad@2026"),
      mk({ email: "hamad.alshukaili" + D, name_ar: "حمد الشكيلي", name_en: "Hamad Al Shukaili", role: "employee", dept: "sales", job: "مستشار مبيعات", branch: "عبري", empNo: "SB-0412", status: "pending", createdAt: t - 3600e3 * 5 }, "Sindbad@2026")
    ]);
    saveAll("users", U);
    saveAll("messages", []); saveAll("requests", []); saveAll("activity", []);
    setCfg("seq", {});
    const by = e => U.find(u => u.email === e + D);
    // sample requests across the last month
    const sample = [
      ["khalid.alrawahi", "leave", 26, "approved", { kind: "annual", kindLabel: "سنوية", from: "2026-12-20", to: "2026-12-26", days: 6, cover: "فاطمة السعدي", reason: "إجازة عائلية" }],
      ["fatma.alsaadi", "letter", 22, "approved", { kind: "salary", kindLabel: "شهادة راتب", to: "بنك مسقط", lang: "العربية", reason: "لفتح حساب" }],
      ["yousuf.almamari", "exit", 18, "rejected", { date: "2026-10-07", fromTime: "13:00", toTime: "15:00", reason: "موعد في الدائرة الحكومية" }],
      ["aisha.alhinai", "advance", 15, "approved", { amount: 400, months: 4, reason: "ظرف عائلي" }],
      ["said.albusaidi", "leave", 12, "review", { kind: "sick", kindLabel: "مرضية", from: "2026-10-13", to: "2026-10-14", days: 2, reason: "مرفق تقرير طبي" }],
      ["yousuf.almamari", "account", 9, "approved", { name_ar: "حمد الشكيلي", name_en: "Hamad Al Shukaili", job: "مستشار مبيعات", dept: "المبيعات والتصميم", branch: "عبري", reason: "موظف جديد ينضم الأحد" }],
      ["khalid.alrawahi", "exit", 6, "approved", { date: "2026-10-19", fromTime: "16:00", toTime: "18:00", reason: "مراجعة طبية" }],
      ["fatma.alsaadi", "leave", 4, "pending", { kind: "annual", kindLabel: "سنوية", from: "2027-01-03", to: "2027-01-09", days: 6, cover: "خالد الرواحي", reason: "سفر" }],
      ["aisha.alhinai", "letter", 3, "pending", { kind: "experience", kindLabel: "شهادة خبرة", to: "لمن يهمه الأمر", lang: "English", reason: "" }],
      ["said.albusaidi", "advance", 2, "pending", { amount: 250, months: 3, reason: "إصلاح السيارة" }],
      ["yousuf.almamari", "leave", 1, "pending", { kind: "emergency", kindLabel: "طارئة", from: "2026-10-27", to: "2026-10-27", days: 1, cover: "", reason: "ظرف عائلي طارئ" }],
      ["khalid.alrawahi", "advance", 0.2, "pending", { amount: 300, months: 3, reason: "" }]
    ];
    const hrU = by("maryam.albalushi"), itU = by("salim.alharthi");
    sample.forEach(([e, type, ago, status, data]) => {
      const u = by(e); const at = t - ago * day; const T = REQ_TYPES[type];
      const y = new Date(at).getFullYear(); const s = cfg("seq", {}); s[y] = (s[y] || 0) + 1; setCfg("seq", s);
      const no = `REQ-${y}-${String(s[y]).padStart(4, "0")}`;
      const rid = uid(), th = uid();
      const decider = T.dept === "it" ? itU : hrU;
      const hist = [{ at, by: u.email, action: "submitted", note: data.reason || "" }];
      if (status !== "pending") hist.push({ at: at + 3600e3 * 4, by: decider.email, action: status, note: status === "rejected" ? "يرجى تقديم الطلب قبل يوم على الأقل." : status === "review" ? "بانتظار اعتماد المدير المباشر." : "" });
      const r = { id: rid, no, type, userId: u.id, email: u.email, dept: T.dept, branch: u.branch, data, attachments: [], status, history: hist, threadId: th, createdAt: at, updatedAt: hist[hist.length - 1].at };
      const arr = list("requests"); arr.push(r); saveAll("requests", arr);
      const m1 = send({ threadId: th, from: u.email, to: [T.dept + D], subject: `${T.ar} · ${no}`, body: summarize(r, "ar"), at, kind: "request", ref: { type: "request", id: rid } });
      if (status !== "pending") {
        const all = list("messages"); const mm = all.find(x => x.id === m1.id); mm.state[T.dept + D] = { read: true }; saveAll("messages", all);
        const m2 = send({ threadId: th, from: T.dept + D, to: [u.email], subject: `${T.ar} · ${no}`, at: at + 3600e3 * 4, kind: "request", ref: { type: "request", id: rid },
          body: `تم تحديث حالة طلبك ${no} (${T.ar}) إلى: ${STATUS[status].ar}.${hist[1].note ? "\n\nملاحظة:\n" + hist[1].note : ""}` });
        if (ago > 5) { const all2 = list("messages"); all2.find(x => x.id === m2.id).state[u.email] = { read: true }; saveAll("messages", all2); }
      }
    });
    // sample conversations
    const conv = [
      [by("khalid.alrawahi").email, "management" + D, "اقتراح: ركن عرض لخامات الأبواب في فرع العذيبة", "السلام عليكم،\nكثير من العملاء يطلبون رؤية خامات الأبواب الداخلية مع المطبخ. أقترح تخصيص ركن صغير بعينات الخامات والألوان بجانب منطقة المطابخ.\n\nخالد", 1.4],
      [by("fatma.alsaadi").email, "it" + D, "مشكلة في الدخول إلى منصة OPPEIN", "مرحبًا،\nلا أستطيع الدخول إلى منصة التدريب من التطبيق، تظهر رسالة أن الحساب غير مفعّل. هل يمكن مراجعة الحساب؟\n\nفاطمة", 0.6],
      [by("said.albusaidi").email, "hr" + D, "استفسار عن رصيد الإجازات", "السلام عليكم،\nأرجو إفادتي برصيدي المتبقي من الإجازة السنوية لهذا العام.\n\nشكرًا", 0.15]
    ];
    conv.forEach(([f, to, s, b, ago]) => send({ from: f, to: [to], subject: s, body: b, at: t - ago * day }));
    send({ from: "management" + D, to: ["all" + D], subject: "إطلاق البريد الرسمي للشركة", at: t - 2 * day, kind: "mail",
      body: "زملاءنا الأعزاء،\n\nيسعدنا إطلاق البريد الرسمي للشركة داخل البوابة الداخلية، ويحصل كل موظف على عنوان خاص باسمه على نطاق الشركة. سيكون هذا البريد القناة الرسمية للتواصل مع الإدارة والأقسام، ولتقديم الطلبات ومتابعتها.\n\nمع التحية،\nالإدارة العليا" });
    setCfg("eotm", { name_ar: "فاطمة السعدي", name_en: "Fatma Al Saadi", email: "fatma.alsaadi@sindbad.om", role_ar: "مصممة داخلية", role_en: "Interior designer", branch: "المعبيلة", month: "أكتوبر 2026", photo: "", reason_ar: "التزام دائم بمواعيد التسليم، وتصاميم مطابخ وخزائن نالت إعجاب العملاء ورفعت جودة الملفات المسلّمة للقسم الفني.", reason_en: "Consistently on-time deliveries and kitchen and wardrobe designs that delighted clients and raised the quality of technical handovers." });
    const acts = [["maryam.albalushi", "request_approved", 26], ["noura.alkindi", "news_new", 14], ["salim.alharthi", "request_approved", 9], ["noura.alkindi", "news_new", 9], ["maryam.albalushi", "request_rejected", 18], ["noura.alkindi", "news_new", 5], ["maryam.albalushi", "request_review", 12], ["admin", "settings", 2]];
    saveAll("activity", acts.map(([a, act, ago]) => ({ id: uid(), at: t - ago * day, actor: a + D, action: act, target: "" })).sort((x, y) => x.at - y.at));
    write("seeded", { at: t, v: 2 });
    return true;
  }
  async function reset() {
    Object.keys(localStorage).filter(k => k.startsWith(NS)).forEach(k => localStorage.removeItem(k));
    try { const db = await idb(); db.transaction("files", "readwrite").objectStore("files").clear(); } catch (e) {}
    await seed(true);
    migrateSystems();
    migrateMobile();
  }
  function exportAll() {
    const o = { v: 2, at: now(), systemsCatalog: read("seeded", {}).systemsCatalog || 0, cfg: {}, cols: {} };
    COLS.forEach(c => o.cols[c] = list(c));
    o.cols.mobile = list("mobile");
    ["settings", "company", "contact", "eotm", "seq"].forEach(k => o.cfg[k] = cfg(k, null));
    return o;
  }
  function importAll(o) {
    if (!o || o.v !== 2 || !o.cols || !o.cfg || COLS.some(c=>!Array.isArray(o.cols[c]) || o.cols[c].some(x=>!x || typeof x.id!=="string") || new Set(o.cols[c].map(x=>x.id)).size!==o.cols[c].length)) throw err("format");
    if (o.cols.users.some(u=>!ROLES[u.role] || typeof u.email!=="string" || !["active","pending","disabled"].includes(u.status)) ||
        o.cols.requests.some(r=>!REQ_TYPES[r.type] || !STATUS[r.status] || !r.data || !Array.isArray(r.history)) ||
        o.cols.messages.some(m=>typeof m.from!=="string" || !Array.isArray(m.to) || m.to.some(a=>typeof a!=="string") || !m.state || typeof m.body!=="string" || typeof m.subject!=="string" || !m.threadId)) throw err("format");
    return transaction(()=>{
      COLS.forEach(c => write("c:" + c, o.cols[c]));
      if (Array.isArray(o.cols.mobile) && o.cols.mobile.every(x => x && typeof x.id === "string")) write("c:mobile", o.cols.mobile);
      ["settings","company","contact","eotm","seq"].forEach(k=>{if(o.cfg[k]!=null)setCfg(k,o.cfg[k])});
      write("seeded", { at: now(), v: 2, systemsCatalog: o.systemsCatalog === 1 ? 1 : 0, mobileApps: Array.isArray(o.cols.mobile) ? 1 : 0 });
    });
  }

  const ready = seed(false).then(migrateSystems).then(migrateMobile).catch(e => console.error("seed", e));

  global.SB = {
    ready, DOMAIN, DEPTS, ROLES, REQ_TYPES, STATUS, domain, addr,
    on: f => { listeners.add(f); return () => listeners.delete(f); },
    list, get, put, remove, cfg, setCfg, log,
    users, userByEmail: e => publicUser(userByEmail(e)), suggestEmail, displayName, can, boxesFor,
    auth: { register, login, current, logout, changePassword, welcome, hash, create: createUser },
    mail: { send, threads, thread, markThread, unread, reply, replyRecipients },
    req: { create: createRequest, decide, cancel: cancelRequest, summarize, workingDays },
    files: { put: filePut, get: fileGet, cached: fileCached, del: fileDel },
    reset, exportAll, importAll, uid
  };
})(window);
