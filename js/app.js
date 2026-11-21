/* Bierkollektion – App-Logik (läuft komplett im Browser, keine Server) */
(function(){
"use strict";
const { STYLES, REGIONS, RAW, version } = window.KATALOG;

/* ---------- Katalog aufbereiten ---------- */
const slug = s => s.toLowerCase().replace(/ä/g,"ae").replace(/ö/g,"oe").replace(/ü/g,"ue").replace(/ß/g,"ss").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const BRANDS = RAW.map(([id,name,short,color,reg,city,vars]) => ({
  id,name,short,color,reg,city,
  vars: vars.map(([n,s]) => ({id:id+"--"+slug(n), name:n, style:s, brand:id}))
})).sort((a,b) => a.name.localeCompare(b.name,"de"));
const BY_ID = Object.fromEntries(BRANDS.map(b => [b.id,b]));
const ALL_VARS = BRANDS.flatMap(b => b.vars);
const VAR_IDS = new Set(ALL_VARS.map(v => v.id));

/* ---------- Zustand ---------- */
const LS = "bierkollektion.v1";
let st = {b:{}, v:{}};          // id -> Zeitstempel (ms)
const ui = {mode:"marken", q:"", status:"all", reg:"", style:"", flash:null, sheet:null};

const vGot = v => !!st.v[v.id];
const bGot = b => !!st.b[b.id] || b.vars.some(vGot);
const bCount = b => b.vars.filter(vGot).length;

function clean(d){   // nur bekannte IDs übernehmen
  const o = {b:{}, v:{}};
  for(const [k,t] of Object.entries((d && d.b) || {})) if(BY_ID[k]) o.b[k] = Number(t) || Date.now();
  for(const [k,t] of Object.entries((d && d.v) || {})) if(VAR_IDS.has(k)) o.v[k] = Number(t) || Date.now();
  return o;
}
let storageOk = true;
function save(){
  try{ localStorage.setItem(LS, JSON.stringify(st)); storageOk = true; }
  catch(_){ storageOk = false; }
  renderStore();
}
function load(){
  try{ const d = JSON.parse(localStorage.getItem(LS) || "null"); if(d) st = clean(d); }
  catch(_){ storageOk = false; }
}

/* ---------- Emblem (Platzhalter-Logo) ---------- */
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function emblem(b){
  const fs = b.short.length <= 2 ? 34 : b.short.length === 3 ? 27 : 21;
  return `<svg viewBox="0 0 100 100" aria-hidden="true">
    <circle cx="50" cy="50" r="48" fill="${b.color}"/>
    <circle cx="50" cy="50" r="48" fill="url(#gl)"/>
    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1.6"/>
    <circle cx="50" cy="50" r="36.5" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="1" stroke-dasharray="2 3"/>
    <text x="50" y="${50+fs*0.34}" text-anchor="middle" font-family="Fraunces,Georgia,serif" font-weight="800" font-size="${fs}" fill="#fff" letter-spacing="0.5">${esc(b.short)}</text>
    <text x="50" y="80" text-anchor="middle" font-family="Inter,sans-serif" font-weight="600" font-size="8" fill="rgba(255,255,255,.75)" letter-spacing="1.5">${b.reg}</text>
  </svg>`;
}

/* ---------- Filter ---------- */
function matchQ(b, v){
  if(!ui.q) return true;
  const hay = (b.name+" "+b.city+" "+(v ? v.name : b.vars.map(x=>x.name).join(" "))).toLowerCase();
  return ui.q.toLowerCase().split(/\s+/).every(t => hay.includes(t));
}
function brandList(){
  return BRANDS.filter(b =>
    (!ui.reg || b.reg === ui.reg) &&
    (!ui.style || b.vars.some(v => v.style === ui.style)) &&
    (ui.status === "all" || (ui.status === "got") === bGot(b)) &&
    matchQ(b));
}
function varList(b){
  return b.vars.filter(v =>
    (!ui.style || v.style === ui.style) &&
    (ui.status === "all" || (ui.status === "got") === vGot(v)) &&
    matchQ(b, v));
}

/* ---------- Rendern ---------- */
const $ = id => document.getElementById(id);
function renderStats(){
  const nb = BRANDS.filter(bGot).length, nv = ALL_VARS.filter(vGot).length;
  const pb = Math.round(100*nb/BRANDS.length), pv = Math.round(100*nv/ALL_VARS.length);
  $("nB").innerHTML = `${nb} <small>/ ${BRANDS.length}</small>`; $("pB").textContent = pb+" %"; $("bB").style.width = pb+"%";
  $("nV").innerHTML = `${nv} <small>/ ${ALL_VARS.length}</small>`; $("pV").textContent = pv+" %"; $("bV").style.width = pv+"%";
}
function renderStore(){
  const n = Object.keys(st.b).length + Object.keys(st.v).length;
  $("store").textContent = storageOk
    ? `Gespeichert in diesem Browser · ${n} Einträge · Backup regelmäßig sichern`
    : "Speichern im Browser nicht möglich (privater Modus?) – bitte Backup nutzen";
}
function brandTile(b){
  const got = bGot(b), c = bCount(b), n = b.vars.length;
  const label = n > 1 ? `${c}/${n}` : "";
  return `<div class="tile${got?" got":""}${c===n?" complete":""}${ui.flash===b.id?" flash":""}" role="button" tabindex="0" aria-pressed="${got}" data-b="${b.id}" title="${esc(b.name)}">
    <span class="star">★</span>
    ${label ? `<span class="cnt" data-more="${b.id}" title="Sorten anzeigen">${label}</span>` : ""}
    <div class="emb">${emblem(b)}</div>
    <div class="nm">${esc(b.name)}</div>
    <div class="meta">${esc(b.city)}</div>
  </div>`;
}
function varTile(v){
  const got = vGot(v), [sn, sc] = STYLES[v.style];
  return `<div class="vt${got?" got":""}${ui.flash===v.id?" flash":""}" style="--sc:${sc}" role="button" tabindex="0" aria-pressed="${got}" data-v="${v.id}">
    <span class="dot">${got?"✓":""}</span>
    <div><div class="vn">${esc(v.name)}</div><div class="vs">${sn}</div></div>
  </div>`;
}
function render(){
  renderStats();
  const main = $("main");
  if(ui.mode === "marken"){
    const brands = brandList();
    main.innerHTML = brands.length ? `<div class="grid">${brands.map(brandTile).join("")}</div>`
      : `<div class="empty">Keine Marke passt zu diesen Filtern.</div>`;
  } else {
    // Sorten-Modus: Status- und Stilfilter wirken auf Sorten
    const secs = BRANDS.filter(b => !ui.reg || b.reg === ui.reg).map(b => {
      const vs = varList(b);
      if(!vs.length) return "";
      return `<section class="sec"><div class="sech${bGot(b)?"":" off"}" data-more="${b.id}">
        <div class="mini">${emblem(b)}</div><b>${esc(b.name)}</b><span>${esc(b.city)} · ${bCount(b)}/${b.vars.length}</span></div>
        <div class="vgrid">${vs.map(varTile).join("")}</div></section>`;
    }).join("");
    main.innerHTML = secs || `<div class="empty">Keine Sorte passt zu diesen Filtern.</div>`;
  }
  if(ui.sheet) renderSheet();
  ui.flash = null;
}
function renderSheet(){
  const b = BY_ID[ui.sheet]; if(!b) return;
  const flagOn = !!st.b[b.id];
  $("sheet").innerHTML = `
    <div class="sh-top${bGot(b)?"":" off"}">
      <div class="emb">${emblem(b)}</div>
      <div><h2>${esc(b.name)}</h2><div class="meta">${esc(b.city)} · ${REGIONS[b.reg]} · ${bCount(b)}/${b.vars.length} Sorten</div></div>
      <button class="x" data-close aria-label="Schließen">✕</button>
    </div>
    ${b.vars.length > 1 ? `<div class="flag${flagOn?" on":""}" role="button" tabindex="0" data-sb="${b.id}">
      <span class="dot">${flagOn?"✓":""}</span><span>Marke probiert, Sorte unbekannt</span></div>` : ""}
    <div class="vgrid">${b.vars.map(varTile).join("")}</div>`;
}

/* ---------- Aktionen ---------- */
function toast(msg){
  const t = $("toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 2200);
}
function changed(){ save(); render(); }
function toggleVar(id){
  if(!VAR_IDS.has(id)) return;
  if(st.v[id]) delete st.v[id]; else { st.v[id] = Date.now(); ui.flash = id; }
  changed();
}
function toggleBrandFlag(id){
  if(st.b[id]) delete st.b[id]; else { st.b[id] = Date.now(); ui.flash = id; }
  changed();
}
function brandClick(id){
  const b = BY_ID[id];
  if(b.vars.length === 1){            // nur eine Sorte: direkt die Sorte markieren
    const v = b.vars[0];
    if(st.v[v.id]){ delete st.v[v.id]; delete st.b[id]; }
    else { st.v[v.id] = Date.now(); ui.flash = id; toast(`${b.name} gesammelt 🍺`); }
    return changed();
  }
  if(bCount(b) > 0){                  // über Sorten gesammelt: Details öffnen statt abwählen
    openSheet(id); toast("Über Sorten gesammelt – hier bearbeiten");
    return;
  }
  const was = !!st.b[id];
  toggleBrandFlag(id);
  if(!was) toast(`${b.name} gesammelt 🍺`);
}
function openSheet(id){ ui.sheet = id; renderSheet(); $("ov").classList.add("open"); }
function closeSheet(){ ui.sheet = null; $("ov").classList.remove("open"); }

/* ---------- Backup ---------- */
function downloadBackup(blob, name){
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast("Backup gespeichert");
}
async function exportBackup(){
  const data = {app:"bierkollektion", schema:1, katalog:version, exported:new Date().toISOString(), b:st.b, v:st.v};
  const json = JSON.stringify(data, null, 1);
  const name = `bierkollektion-${new Date().toISOString().slice(0,10)}.json`;
  const blob = new Blob([json], {type:"application/json"});
  // Auf Handys bevorzugt über das Teilen-Menü (In Dateien sichern, AirDrop, Messenger …).
  // Downloads aus installierten Web-Apps sind auf iOS unzuverlässig.
  let file = null;
  try{ file = new File([json], name, {type:"application/json"}); }catch(_){}
  if(file && navigator.share && navigator.canShare && navigator.canShare({files:[file]})){
    try{
      await navigator.share({files:[file], title:"Bierkollektion – Backup"});
      toast("Backup geteilt");
      return;
    }catch(e){
      if(e && e.name === "AbortError") return;   // Nutzer hat abgebrochen
      // sonst: auf Download zurückfallen
    }
  }
  downloadBackup(blob, name);
}
function importBackup(file){
  const r = new FileReader();
  r.onload = () => {
    try{
      const d = JSON.parse(r.result);
      if(d.app !== "bierkollektion") throw new Error("kein Bierkollektion-Backup");
      const inc = clean(d);
      let added = 0;
      // Zusammenführen: nichts geht verloren, ältester Zeitstempel gewinnt
      for(const k of ["b","v"]) for(const [id,t] of Object.entries(inc[k])){
        if(!st[k][id]) added++;
        st[k][id] = st[k][id] ? Math.min(st[k][id], t) : t;
      }
      changed();
      toast(added ? `${added} Einträge aus dem Backup übernommen` : "Backup enthielt nichts Neues");
    }catch(e){ toast("Datei konnte nicht gelesen werden"); }
  };
  r.readAsText(file);
}

/* ---------- Events ---------- */
function activate(e){
  const t = e.target;
  if(t.closest("[data-close]")) return closeSheet();
  const more = t.closest("[data-more]");
  if(more){ e.stopPropagation(); return openSheet(more.dataset.more); }
  const v = t.closest("[data-v]"); if(v) return toggleVar(v.dataset.v);
  const sb = t.closest("[data-sb]"); if(sb) return toggleBrandFlag(sb.dataset.sb);
  const b = t.closest("[data-b]"); if(b) return brandClick(b.dataset.b);
}
$("main").addEventListener("click", activate);
$("sheet").addEventListener("click", activate);
$("ov").addEventListener("click", e => { if(e.target === $("ov")) closeSheet(); });
document.addEventListener("keydown", e => {
  if(e.key === "Escape" && ui.sheet) return closeSheet();
  if((e.key === "Enter" || e.key === " ") && e.target.matches("[role=button]")){ e.preventDefault(); activate(e); }
});
$("mode").addEventListener("click", e => { const m = e.target.closest("[data-m]"); if(!m) return;
  ui.mode = m.dataset.m; [...$("mode").children].forEach(x => x.classList.toggle("on", x === m)); render(); });
$("status").addEventListener("click", e => { const s = e.target.closest("[data-s]"); if(!s) return;
  ui.status = s.dataset.s; [...$("status").children].forEach(x => x.classList.toggle("on", x === s)); render(); });
$("q").addEventListener("input", e => { ui.q = e.target.value.trim(); render(); });
$("reg").addEventListener("change", e => { ui.reg = e.target.value; render(); });
$("chips").addEventListener("click", e => { const c = e.target.closest("[data-st]"); if(!c) return;
  ui.style = ui.style === c.dataset.st ? "" : c.dataset.st;
  [...$("chips").children].forEach(x => x.classList.toggle("on", x.dataset.st === ui.style)); render(); });
$("exp").addEventListener("click", exportBackup);
$("imp").addEventListener("click", () => $("impFile").click());
$("impFile").addEventListener("change", e => { const f = e.target.files[0]; if(f) importBackup(f); e.target.value = ""; });
// Änderungen aus einem anderen Tab übernehmen
window.addEventListener("storage", e => { if(e.key === LS){ load(); render(); renderStore(); } });

/* ---------- Start ---------- */
(function init(){
  const used = new Set(BRANDS.map(b => b.reg));
  $("reg").innerHTML += Object.entries(REGIONS).filter(([k]) => used.has(k))
    .map(([k,n]) => `<option value="${k}">${n}</option>`).join("");
  const usedS = new Set(ALL_VARS.map(v => v.style));
  $("chips").innerHTML = Object.entries(STYLES).filter(([k]) => usedS.has(k))
    .map(([k,[n,c]]) => `<button class="chip" data-st="${k}"><i style="background:${c}"></i>${n}</button>`).join("");
  $("cat").textContent = `Katalog v${version} · ${BRANDS.length} Marken · ${ALL_VARS.length} Sorten · Platzhalter-Logos`;
  load(); render(); renderStore();
  // Browser bitten, die Daten nicht automatisch zu löschen
  if(navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  // Offline-Fähigkeit / Installierbarkeit
  if("serviceWorker" in navigator && location.protocol === "https:"){
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
})();
