/* Sindbad app prompt (pop.js)
   API: SindbadAppPrompt.open(), .close(), .reset(), .config
   Override settings before this script: window.SindbadAppPromptConfig = { downloadUrl: "https://..." } */
(function () {
  "use strict";
  var CONFIG = Object.assign({
    downloadUrl: "",   // direct link to the app file or download page (e.g. https://sindbad.om/app)
    autoOpen: true,
    alwaysShow: false, // true = ignore the saved choice (useful while testing)
    delay: 400,
    storageKey: "sindbad:appPrompt:v2",
    snoozeDays: 7
  }, window.SindbadAppPromptConfig || {});

  var root = document.getElementById("sbAppPrompt");
  if (!root) return;
  var status = root.querySelector("#sbpStatus"), lastFocus = null, timer = 0, installEvent = null;

  /* if the site is installable (PWA), use the browser's own install prompt as a fallback */
  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); installEvent = e; });

  function read() { try { return JSON.parse(localStorage.getItem(CONFIG.storageKey) || "null"); } catch (e) { return null; } }
  function write(v) { try { localStorage.setItem(CONFIG.storageKey, JSON.stringify(v)); } catch (e) {} }
  function link() { try { var u = new URL(CONFIG.downloadUrl, location.href); return /^https?:$/.test(u.protocol) && CONFIG.downloadUrl ? u.href : ""; } catch (e) { return ""; } }

  function focusables() {
    return Array.prototype.filter.call(root.querySelectorAll("button,a[href],input"), function (el) { return !el.hidden && el.getClientRects().length; });
  }
  function onKey(e) {
    if (e.key === "Escape") { e.preventDefault(); choose("browser"); return; }
    if (e.key !== "Tab") return;
    var f = focusables(); if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  }
  function open() {
    clearTimeout(timer); status.textContent = "";
    if (root.classList.contains("is-open")) return;
    lastFocus = document.activeElement;
    root.hidden = false; root.tabIndex = -1;
    document.documentElement.classList.add("sbp-lock");
    requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add("is-open"); root.focus({ preventScroll: true }); }); });
    document.addEventListener("keydown", onKey);
  }
  function close() {
    root.classList.remove("is-open");
    document.documentElement.classList.remove("sbp-lock");
    document.removeEventListener("keydown", onKey);
    timer = setTimeout(function () { root.hidden = true; }, 300);
    if (lastFocus && lastFocus.isConnected && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  function choose(kind) {
    var cb = root.querySelector("#sbpRemember"), forever = !!(cb && cb.checked);
    write({ choice: kind, forever: forever, at: Date.now() });
    root.dispatchEvent(new CustomEvent("sbp:choice", { detail: { choice: kind, remember: forever }, bubbles: true }));
    close();
  }
  function download() {
    var u = link();
    if (u) { window.open(u, "_blank", "noopener"); choose("app"); return; }
    if (installEvent) {
      installEvent.prompt();
      installEvent.userChoice.then(function (r) { installEvent = null; if (r && r.outcome === "accepted") choose("app"); });
      return;
    }
    status.textContent = "The download link isn’t ready yet. You can keep using the portal in your browser.";
  }
  function shouldShow() {
    if (CONFIG.alwaysShow || /[?&]sbp=show\b/.test(location.search)) return true;
    var s = read();
    if (!s) return true;
    if (s.forever || s.choice === "app") return false;
    return Date.now() - (s.at || 0) > CONFIG.snoozeDays * 864e5;
  }

  root.addEventListener("click", function (e) {
    if (e.target.closest("[data-sbp-browser]")) { choose("browser"); return; }
    if (e.target.closest("[data-sbp-download]")) download();
  });
  document.addEventListener("click", function (e) { if (e.target.closest("[data-sbp-open]")) open(); });

  window.SindbadAppPrompt = { open: open, close: close, config: CONFIG, reset: function () { try { localStorage.removeItem(CONFIG.storageKey); } catch (e) {} } };
  if (CONFIG.autoOpen && shouldShow()) timer = setTimeout(open, CONFIG.delay);
})();
