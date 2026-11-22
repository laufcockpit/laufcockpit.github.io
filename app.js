/* Lauf-Cockpit – Daten bleiben auf diesem Gerät (localStorage). Kein Tracking, keine Server. */
(function () {
'use strict';

// ============ Grundlagen ============
const $ = (s, el) => (el || document).querySelector(s);
const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else if (k === 'style') e.style.cssText = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(String(k)));
  return e;
}
const SVGNS = 'http://www.w3.org/2000/svg';
function s(tag, attrs, ...kids) {
  const e = document.createElementNS(SVGNS, tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) { if (v == null) continue; if (k === 'text') e.textContent = v; else if (k === 'style') e.setAttribute('style', v); else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v); }
  for (const k of kids.flat()) if (k) e.append(k);
  return e;
}
const icon = (id, cls) => { const sv = s('svg', { 'aria-hidden': 'true', class: cls || null }); sv.append(s('use', { href: '#i-' + id })); return sv; };
const motion = () => !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

const DAY = 864e5;
const MON = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
const MONL = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const WTAG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const TAGE = ['mo', 'di', 'mi', 'do', 'fr', 'sa', 'so'];
const TAGN = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const FERSE = ['ruhig', 'spürbar', 'deutlich', 'Schmerz'];
const FTAG = ['ok', 'warn', 'bad', 'bad'];
const ETAG = { gut: 'ok', normal: 'dusk', schwer: 'warn', kraftlos: 'bad' };
const TYPS = ['Locker', 'Long', 'Qualität'];
const TYPN = { Locker: 'Locker', Long: 'Long Run', Qualität: 'Qualität', Wettkampf: 'Wettkampf' };
const TYPC = { Locker: 'var(--apricot)', Long: 'var(--bahn-fill)', Qualität: 'var(--dusk-fill)' };
const typKey = (t) => (t === 'Wettkampf' ? 'Qualität' : t);

const de = (v, d) => (v == null || !isFinite(v) ? '–' : (+v).toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d }));
const parse = (x) => new Date(x + 'T00:00:00Z');
const iso = (d) => d.toISOString().slice(0, 10);
const todayIso = () => { const n = new Date(); return n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0') + '-' + String(n.getDate()).padStart(2, '0'); };
const monday = (x) => { const d = parse(x); return iso(new Date(+d - ((d.getUTCDay() + 6) % 7) * DAY)); };
const addDays = (x, n) => iso(new Date(+parse(x) + n * DAY));
const dNum = (x) => { const d = parse(x); return d.getUTCDate() + '.' + (d.getUTCMonth() + 1) + '.'; };
const dShort = (x) => { const d = parse(x); return d.getUTCDate() + '. ' + MON[d.getUTCMonth()]; };
const dLong = (x) => { const d = parse(x); return WTAG[d.getUTCDay()] + ', ' + d.getUTCDate() + '. ' + MONL[d.getUTCMonth()]; };
const dFull = (x) => { const d = parse(x); return d.getUTCDate() + '. ' + MONL[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); };
const isoWeek = (x) => { const d = parse(x); const t = new Date(+d + (3 - ((d.getUTCDay() + 6) % 7)) * DAY); const y = new Date(Date.UTC(t.getUTCFullYear(), 0, 4)); return 1 + Math.round(((+t - +y) / DAY - 3 + ((y.getUTCDay() + 6) % 7)) / 7); };
const pace = (sec) => { if (sec == null || !isFinite(sec)) return '–'; sec = Math.round(sec); return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'); };
const dur = (sec) => { if (sec == null || !isFinite(sec)) return '–'; sec = Math.round(sec); const hh = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), x = sec % 60; return hh ? hh + ':' + String(m).padStart(2, '0') + ':' + String(x).padStart(2, '0') : m + ':' + String(x).padStart(2, '0'); };
const durShort = (sec) => { if (!sec) return '–'; const m = Math.round(sec / 60); return m >= 60 ? Math.floor(m / 60) + ' h ' + String(m % 60).padStart(2, '0') : m + ' min'; };
const num = (v) => { if (v === '' || v == null) return null; const n = +String(v).replace(',', '.'); return isFinite(n) ? n : NaN; };
const parseDur = (t) => { t = String(t || '').trim().replace(',', '.'); if (!t) return null; if (/^\d+(\.\d+)?$/.test(t)) return Math.round(+t * 60); const p = t.split(/[:.]/).map(Number); if (p.some((x) => !isFinite(x))) return NaN; if (p.length === 2) return p[0] * 60 + p[1]; if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2]; return NaN; };
const parsePace = (t) => { t = String(t || '').trim(); if (!t) return null; const p = t.split(/[:.]/).map(Number); if (p.length !== 2 || p.some((x) => !isFinite(x))) return NaN; return p[0] * 60 + p[1]; };
const wordRuns = (n) => (n === 0 ? 'keinem Lauf' : n === 1 ? 'einem Lauf' : n + ' Läufen');
const plural = (n, a, b) => n + ' ' + (n === 1 ? a : b);

// ============ Speicher ============
const KEY = 'laufcockpit.v1';
const APP_VERSION = '5 (22.11.2026)';
const store = { laeufe: {}, ziele: {}, plan: {} };
function load() {
  try { const raw = localStorage.getItem(KEY); if (raw) { const d = JSON.parse(raw); store.laeufe = d.laeufe || {}; store.ziele = d.ziele || {}; store.plan = d.plan || {}; } }
  catch (e) { toast('Gespeicherte Daten ließen sich nicht lesen.'); }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify({ v: 1, laeufe: store.laeufe, ziele: store.ziele, plan: store.plan })); return true; }
  catch (e) { toast('Speichern fehlgeschlagen: Der Speicher des Browsers ist voll.'); return false; }
}
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

function runs() {
  return Object.entries(store.laeufe).map(([id, r]) => {
    const km = r.km == null ? null : +r.km, sec = r.dauer_s == null ? null : +r.dauer_s;
    return { ...r, id, km, dauer_s: sec, pace_s: km && sec ? sec / km : null };
  }).filter((r) => r.datum).sort((a, b) => (a.datum < b.datum ? -1 : a.datum > b.datum ? 1 : a.id < b.id ? -1 : 1));
}
const goals = () => Object.entries(store.ziele).map(([id, z]) => ({ ...z, id })).sort((a, b) => (a.datum < b.datum ? -1 : 1));
const planFor = (mo) => (store.plan[mo] && store.plan[mo].tage) || {};
const planDetails = (mo) => (store.plan[mo] && store.plan[mo].details) || {};
const isRunPlan = (p) => !!p && !/^(gym|ruhe|ruhetag|frei|pause|krafttraining|dienstreise|reise|urlaub|krank)\b|ausgefallen|^—$/i.test(p.trim());

// ============ Rechnen ============
function weeks(R, from, to) {
  const by = new Map();
  for (const r of R) { const k = monday(r.datum); const w = by.get(k) || { km: 0, n: 0, long: 0, t: {} }; w.km += r.km || 0; w.n++; w.long = Math.max(w.long, r.dauer_s || 0); const ty = typKey(r.typ); w.t[ty] = (w.t[ty] || 0) + (r.km || 0); by.set(k, w); }
  const out = [];
  for (let k = monday(from); k <= to; k = addDays(k, 7)) { const w = by.get(k) || { km: 0, n: 0, long: 0, t: {} }; out.push({ woche: k, km: Math.round(w.km * 10) / 10, n: w.n, long: w.long, t: w.t }); }
  return out;
}
function streak(R) { const m = R.filter((r) => r.ferse != null).reverse(); let n = 0; for (const r of m) { if (r.ferse <= 1) n++; else break; } return { n, total: m.length, last: m[0] }; }
const riegel = (t, d1, d2) => t * Math.pow(d2 / d1, 1.06);
function predict(R, goalKm, at) {
  const lim = at || todayIso(), lo = addDays(lim, -120), lo2 = addDays(lim, -42), est = [];
  const races = R.filter((r) => r.typ === 'Wettkampf' && r.km && r.dauer_s && r.datum <= lim && r.datum >= lo);
  if (races.length) { const b = races.map((r) => ({ t: riegel(r.dauer_s, r.km, goalKm), r })).sort((a, c) => a.t - c.t)[0]; est.push({ t: b.t, src: 'Wettkampf am ' + dShort(b.r.datum) + ' (' + de(b.r.km, 2) + ' km in ' + dur(b.r.dauer_s) + ')' }); }
  const thr = R.filter((r) => r.typ === 'Qualität' && ['Schwelle', 'Tempo', 'Progression'].includes(r.intensitaet) && r.kern_pace_s && r.datum <= lim && r.datum >= lo2);
  if (thr.length) { const b = thr.slice().sort((a, c) => a.kern_pace_s - c.kern_pace_s || (a.datum < c.datum ? 1 : -1))[0]; est.push({ t: riegel(3600, 3600 / b.kern_pace_s, goalKm), src: b.intensitaet + ' am ' + dShort(b.datum) + ' (' + pace(b.kern_pace_s) + ' /km)' }); }
  if (!est.length) return null;
  const ts = est.map((e) => e.t), c = ts.reduce((a, v) => a + v, 0) / ts.length;
  return { t: c, lo: Math.min(...ts) * 0.985, hi: Math.max(...ts) * 1.015, est };
}
function firstPred(R, km) { if (!R.length) return null; for (let k = addDays(monday(R[0].datum), 6); k <= todayIso(); k = addDays(k, 7)) { const p = predict(R, km, k); if (p) return { d: k, ...p }; } return null; }
function verdict(pred, g, wl) {
  if (!pred || !g.zielzeit_s) return { cls: '', txt: 'keine Daten', pw: null };
  const need = (pred.t - g.zielzeit_s) / pred.t;
  if (need <= 0) return { cls: 'ok', txt: 'auf Kurs', pw: 0 };
  if (wl <= 0) return { cls: 'bad', txt: 'vorbei', pw: null };
  const pw = (need / wl) * 100;
  if (pw <= 0.25) return { cls: 'ok', txt: 'auf Kurs', pw };
  if (pw <= 0.5) return { cls: 'warn', txt: 'ambitioniert', pw };
  return { cls: 'bad', txt: 'sehr ambitioniert', pw };
}
function peakKm(g) { const d = g.distanz_km, base = d <= 5.5 ? 28 : d <= 11 ? 35 : d <= 22 ? 42 : 60; return Math.round(base * Math.max(0.75, Math.min(1.25, 330 / (g.zielzeit_s / d)))); }
function nextGoal() { const t = todayIso(); return goals().find((z) => z.datum >= t) || null; }
const weeksLeft = (g) => Math.max(0, Math.round((+parse(g.datum) - +parse(todayIso())) / (7 * DAY)));

// ============ UI-Hilfen ============
let toastT = null;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2600); }
const tag = (txt, cls) => h('span', { class: 'tag' + (cls ? ' ' + cls : ''), text: txt });
const typDot = (t) => h('i', { class: 'dot t-' + typKey(t), 'aria-hidden': 'true' });
function topbar(id, title, sub, right) {
  return h('header', { class: 'topbar' }, h('div', { class: 't' }, h('h1', { id: 'h-' + id, text: title }), sub ? h('p', { class: 'sub', text: sub }) : null), right || null);
}
const dataBtn = () => h('button', { class: 'iconbtn', type: 'button', 'aria-label': 'Daten, Import und Backup', onclick: () => openData() }, icon('daten'));
function runTitle(r) { return (r.intensitaet && r.typ === 'Qualität' ? r.intensitaet : TYPN[r.typ] || r.typ) + (r.ort === 'Band' ? ', Band' : ''); }
function runRow(r, opts) {
  const d = parse(r.datum);
  const bits = [r.kern, r.pace_s ? pace(r.pace_s) + ' /km' : null, r.hf ? r.hf + ' bpm' : null].filter(Boolean).join(', ');
  return h('li', null, h('button', { class: 'row', type: 'button', onclick: () => openDetail(r.id), 'aria-label': dLong(r.datum) + ', ' + runTitle(r) + (r.km ? ', ' + de(r.km, 2) + ' Kilometer' : '') },
    h('span', { class: 'when' }, h('b', { text: d.getUTCDate() }), h('span', { text: MON[d.getUTCMonth()] })),
    h('span', { class: 'what' }, h('b', null, typDot(r.typ), h('span', { text: runTitle(r) })), h('small', { text: bits || (r.notiz || '') })),
    h('span', { class: 'amt' }, r.km ? de(r.km, 2) : '–', r.km ? h('small', { text: 'km' }) : null)));
}
function measure(host) { return Math.max(260, Math.round(host.clientWidth || host.parentElement.clientWidth || 340)); }
function drawLine(path) { if (!motion()) return; requestAnimationFrame(() => { const L = path.getTotalLength ? path.getTotalLength() : 0; if (!L) return; path.style.setProperty('--len', L); path.classList.add('drawn'); }); }

// ============ Navigation ============
const VIEWS = ['heute', 'training', 'koerper', 'ziel', 'verlauf'];
const R_ = { openDays: new Set(), wk: 0, view: 'heute', train: 'umfang', verlaufFilter: 'Alle', zielSel: null, strecke: null };
function go(v) {
  if (!VIEWS.includes(v)) v = 'heute';
  R_.view = v;
  VIEWS.forEach((n) => $('#v-' + n).classList.toggle('on', n === v));
  $$('.nav [data-go]').forEach((b) => { if (b.dataset.go === v) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  if (location.hash !== '#' + v) history.replaceState(history.state, '', '#' + v);
  render();
  window.scrollTo(0, 0);
}
$$('.nav [data-go]').forEach((b) => b.addEventListener('click', () => go(b.dataset.go)));
$('#fab').addEventListener('click', () => openRun(null));

function render() {
  const R = runs();
  const v = R_.view;
  try {
    if (v === 'heute') renderHeute(R);
    else if (v === 'training') renderTraining(R);
    else if (v === 'koerper') renderKoerper(R);
    else if (v === 'ziel') renderZiel(R);
    else renderVerlauf(R);
  } catch (e) { console.error(e); $('#v-' + v).replaceChildren(h('div', { class: 'screen' }, h('p', { class: 'empty', text: 'Beim Anzeigen ist ein Fehler aufgetreten: ' + e.message }))); }
}
let rzT, lastW = window.innerWidth;
window.addEventListener('resize', () => { if (Math.abs(window.innerWidth - lastW) < 20) return; lastW = window.innerWidth; clearTimeout(rzT); rzT = setTimeout(render, 160); });

// ============ HEUTE ============
function weekLabel(off, mo) { return off === 0 ? 'Diese Woche' : off === 1 ? 'Nächste Woche' : off === -1 ? 'Letzte Woche' : 'Woche ' + isoWeek(mo); }
function weekRange(mo) { const a = parse(mo), e = parse(addDays(mo, 6)); return a.getUTCDate() + '.' + (a.getUTCMonth() !== e.getUTCMonth() ? ' ' + MON[a.getUTCMonth()] : '') + ' bis ' + e.getUTCDate() + '. ' + MON[e.getUTCMonth()]; }
function weekNav(off, mo, onPrev, onNext, canPrev, canNext, onToday) {
  return h('div', { class: 'weeknav' },
    h('button', { class: 'arrow', type: 'button', 'aria-label': 'Vorherige Woche', disabled: !canPrev, onclick: onPrev }, h('span', { 'aria-hidden': 'true', text: '‹' })),
    h('div', { class: 'wl', 'aria-live': 'polite' }, h('b', { text: weekLabel(off, mo) }), h('span', { text: weekRange(mo) }), off !== 0 && onToday ? h('button', { class: 'link', type: 'button', onclick: onToday }, 'Zur aktuellen Woche') : null),
    h('button', { class: 'arrow', type: 'button', 'aria-label': 'Nächste Woche', disabled: !canNext, onclick: onNext }, h('span', { 'aria-hidden': 'true', text: '›' })));
}
const WK_MAX = 8;
function renderHeute(R) {
  const t = todayIso(), cmo = monday(t);
  const minOff = R.length ? Math.round((+parse(monday(R[0].datum)) - +parse(cmo)) / (7 * DAY)) : -1;
  R_.wk = Math.max(Math.min(R_.wk || 0, WK_MAX), Math.min(minOff, 0));
  const off = R_.wk, mo = addDays(cmo, 7 * off), isCur = off === 0;
  const di = isCur ? (parse(t).getUTCDay() + 6) % 7 : -1;
  const wk = R.filter((r) => monday(r.datum) === mo);
  const km = wk.reduce((a, r) => a + (r.km || 0), 0);
  const plan = planFor(mo);
  const planned = TAGE.filter((k) => isRunPlan(plan[k])).length;
  const doneRuns = new Set(wk.map((r) => r.datum)).size;
  let next = null;
  if (off >= 0) for (let i = Math.max(di, 0); i < 7; i++) { const day = addDays(mo, i); if (isRunPlan(plan[TAGE[i]]) && !wk.some((r) => r.datum === day)) { next = { i, p: plan[TAGE[i]] }; break; } }

  const root = h('div', { class: 'screen' });
  root.append(topbar('heute', 'Heute', dLong(t) + ', Woche ' + isoWeek(t), dataBtn()));

  // Hero: Wochenbahn mit Wochen-Navigation
  const hero = h('section', { class: 'hero', 'aria-label': weekLabel(off, mo) });
  const goWeek = (d) => { R_.wk = off + d; render(); };
  hero.append(weekNav(off, mo, () => goWeek(-1), () => goWeek(1), off > Math.min(minOff, 0), off < WK_MAX, () => { R_.wk = 0; render(); }));
  const future = off > 0;
  hero.append(h('div', { class: 'hero-top' },
    h('div', { class: 'hero-km' }, de(km, 1), h('small', { text: 'km' })),
    h('p', { class: 'hero-of' },
      future ? h('b', { text: plural(planned, 'Lauf', 'Läufe') }) : planned ? h('b', { text: Math.min(doneRuns, 99) + ' von ' + planned }) : h('b', { text: plural(wk.length, 'Lauf', 'Läufe') }),
      h('br'), future ? 'geplant' : planned ? 'geplanten Läufen' : (isCur ? 'diese Woche' : 'gelaufen'))));
  const lanes = h('div', { class: 'lanes' });
  let li = 0;
  for (let i = 0; i < 7; i++) {
    const day = addDays(mo, i), dr = wk.filter((r) => r.datum === day), p = plan[TAGE[i]] || '';
    const isNext = isCur && next && next.i === i, isToday = day === t;
    let cls = 'lane', content;
    if (dr.length) {
      const k = dr.reduce((a, r) => a + (r.km || 0), 0), main = dr.slice().sort((a, b2) => (b2.km || 0) - (a.km || 0))[0];
      content = [h('span', { class: 'dn', text: TAGN[i] }), h('span', { class: 'kv', text: de(k, k >= 10 ? 0 : 1) })];
      lanes.append(h('button', { class: 'lane run' + (isToday ? ' today' : ''), type: 'button', style: '--i:' + (li++) + ';--c:' + TYPC[typKey(main.typ)], 'aria-label': TAGN[i] + ': ' + runTitle(main) + ', ' + de(k, 1) + ' km', onclick: () => openDetail(main.id) }, content));
      continue;
    }
    if (isNext) { cls += ' next'; content = [h('span', { class: 'dn', text: TAGN[i] }), icon('run', 'ic')]; }
    else if (/gym|kraft/i.test(p)) { cls += ' gym'; content = [h('span', { class: 'dn', text: TAGN[i] }), icon('gym', 'ic')]; }
    else if (day < t && isRunPlan(p)) { cls += ' missed'; content = [h('span', { class: 'dn', text: TAGN[i] }), h('span', { class: 'kv', text: '–' })]; }
    else if (isRunPlan(p)) { cls += future ? ' next' : ''; content = [h('span', { class: 'dn', text: TAGN[i] }), icon('run', 'ic')]; }
    else { content = [h('span', { class: 'dn', text: TAGN[i] }), icon('moon', 'ic')]; }
    lanes.append(h('div', { class: cls + (isToday ? ' today' : ''), role: 'img', 'aria-label': TAGN[i] + ': ' + (p || 'nichts geplant') }, content));
  }
  const track = h('div', { class: 'track' }, lanes);
  // Wischen wechselt die Woche
  let sx = null, sy = null;
  track.addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; });
  track.addEventListener('pointerup', (e) => { if (sx == null) return; const dx = e.clientX - sx, dy = e.clientY - sy; sx = null; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) { const d = dx < 0 ? 1 : -1; const n = off + d; if (n <= WK_MAX && n >= Math.min(minOff, 0)) goWeek(d); } });
  hero.append(track);
  if (isCur) {
    if (next) hero.append(h('div', { class: 'hero-next' }, h('span', { class: 'ic' }, icon('run')), h('span', { class: 'tx' }, h('b', { text: next.p }), h('span', { text: next.i === di ? 'Heute' : 'Als Nächstes, ' + WTAG[(next.i + 1) % 7] }))));
    else hero.append(h('div', { class: 'hero-next' }, h('span', { class: 'ic' }, icon('ziel')), h('span', { class: 'tx' }, h('b', { text: Object.keys(plan).length ? 'Keine weiteren Läufe geplant' : 'Noch kein Plan für diese Woche' }), h('span', { text: Object.keys(plan).length ? 'Erholung zählt auch. Mit › siehst du die nächste Woche.' : 'Leg den Plan an, dann zeigt die Bahn deine Woche.' }))));
  }
  // Tagesplan der gewählten Woche
  if (Object.keys(plan).length || wk.length) {
    const ul = h('ul', { class: 'plan', 'aria-label': 'Plan ' + weekLabel(off, mo) });
    const det = planDetails(mo);
    for (let i = 0; i < 7; i++) {
      const day = addDays(mo, i), p = plan[TAGE[i]] || '', dr = wk.filter((r) => r.datum === day), dt = det[TAGE[i]] || '';
      const dot = dr.length ? 'done' : /gym|kraft/i.test(p) ? 'gym' : (isCur && next && next.i === i) ? 'next' : '';
      const status = dr.length ? tag('✓ ' + dr.map((x) => de(x.km, 1)).join(' + ') + ' km', 'ok') : (day < t && isRunPlan(p) ? tag('offen', '') : null);
      const cells = [h('span', { class: 'pd ' + dot, 'aria-hidden': 'true' }), h('span', { class: 'dd', text: TAGN[i] }), h('span', { class: 'tt' + (p || dr.length ? '' : ' none'), text: p || (dr.length ? runTitle(dr[0]) : '–') }), h('span', { class: 'st' }, status, (dt || dr.length || p) ? icon('chev', 'chev') : null)];
      if (!dt && !dr.length && !p) { ul.append(h('li', { class: day === t ? 'today' : null }, h('div', { class: 'prow' }, cells))); continue; }
      const open = R_.openDays.has(day);
      const pid = 'pd-' + day;
      const panel = h('div', { class: 'pdet', id: pid, hidden: !open },
        dt ? h('p', { class: 'ptxt', text: dt }) : (!dr.length ? h('p', { class: 'ptxt none' }, 'Für diesen Tag sind noch keine Details hinterlegt. ', h('button', { class: 'link', type: 'button', onclick: () => openPlan(mo) }, 'Details ergänzen')) : null),
        dr.map((r) => h('button', { class: 'prun', type: 'button', onclick: () => openDetail(r.id) }, typDot(r.typ), h('span', null, h('b', { text: 'Gelaufen: ' + runTitle(r) }), h('small', { text: [r.km ? de(r.km, 2) + ' km' : null, r.dauer_s ? dur(r.dauer_s) : null, r.pace_s ? pace(r.pace_s) + ' /km' : null, r.hf ? r.hf + ' bpm' : null].filter(Boolean).join(', ') })), h('span', { class: 'go', 'aria-hidden': 'true', text: '›' }))));
      const btn = h('button', { class: 'prow', type: 'button', 'aria-expanded': String(open), 'aria-controls': pid, onclick: () => { const o = btn.getAttribute('aria-expanded') !== 'true'; btn.setAttribute('aria-expanded', String(o)); panel.hidden = !o; if (o) R_.openDays.add(day); else R_.openDays.delete(day); } }, cells);
      ul.append(h('li', { class: (day === t ? 'today ' : '') + 'has-det' }, btn, panel));
    }
    hero.append(ul);
  }
  hero.append(h('div', { class: 'btnrow' }, h('button', { class: 'btn ghost', type: 'button', onclick: () => openPlan(mo) }, Object.keys(plan).length ? 'Plan bearbeiten' : 'Plan anlegen')));
  root.append(hero);
  const cwk = R.filter((r) => monday(r.datum) === cmo), ckm = cwk.reduce((a, r) => a + (r.km || 0), 0);

  // Kennzahlen
  const g = nextGoal(), gKm = g ? g.distanz_km : 21.0975, pred = predict(R, gKm);
  const st = streak(R);
  const thr = R.filter((r) => ['Schwelle', 'Progression'].includes(r.intensitaet) && r.kern_pace_s);
  const lt = thr[thr.length - 1];
  const W = weeks(R, addDays(cmo, -28), t), prev4 = W.slice(0, 4), avg4 = prev4.reduce((a, w) => a + w.km, 0) / 4;

  const sZ = h('button', { class: 'stat', type: 'button', onclick: () => go('ziel') }, h('span', { class: 'k', text: g ? g.name + ', Ziel ' + dur(g.zielzeit_s).replace(/:00$/, '') : 'Halbmarathon' }),
    h('span', { class: 'v' }, pred ? dur(pred.t) : '–'),
    g && pred ? h('span', { class: 'd' }, tag(verdict(pred, g, weeksLeft(g)).txt, verdict(pred, g, weeksLeft(g)).cls)) : h('span', { class: 'd', text: pred ? 'Schätzung heute' : 'Noch keine Schätzung' }));
  if (g && pred) { const p0 = firstPred(R, gKm); if (p0 && p0.t > g.zielzeit_s) sZ.append(goalBar(p0, pred, g, true)); }
  const sF = h('button', { class: 'stat', type: 'button', onclick: () => go('koerper') }, h('span', { class: 'k', text: 'Ferse' }), st.total ? h('span', { class: 'v' }, String(st.n), h('small', { text: st.n === 1 ? 'Lauf' : 'Läufe' })) : h('span', { class: 'v', text: '–' }), h('span', { class: 'd', text: st.total ? 'in Folge ohne deutliches Signal' : 'Noch keine Einträge' }), st.total ? fersenStrip(R, 14) : null);
  const sS = h('button', { class: 'stat', type: 'button', onclick: () => { R_.train = 'quali'; go('training'); } }, h('span', { class: 'k', text: 'Schwellentempo' }), h('span', { class: 'v' }, lt ? pace(lt.kern_pace_s) : '–', lt ? h('small', { text: '/km' }) : null), h('span', { class: 'd', text: lt ? dShort(lt.datum) + ', ' + (lt.kern || '') : 'Noch keine Schwelle' }));
  const sU = h('button', { class: 'stat', type: 'button', onclick: () => { R_.train = 'umfang'; go('training'); } }, h('span', { class: 'k', text: 'Vier-Wochen-Schnitt' }), h('span', { class: 'v' }, de(avg4, 1), h('small', { text: 'km/Woche' })), h('span', { class: 'd', text: R.length ? 'Obergrenze nächste Woche ' + de(Math.max(ckm, W[3] ? W[3].km : 0) * 1.1, 0) + ' km' : 'Noch keine Läufe' }));
  root.append(h('div', { class: 'grid2' }, sZ, sF, sS, sU));

  // Zuletzt
  const last = R.slice(-3).reverse();
  root.append(h('div', { class: 'panel-h', style: 'margin:6px 4px -6px' }, h('h2', { class: 'section-t', style: 'padding:0', text: 'Zuletzt gelaufen' }), R.length > 3 ? h('button', { class: 'link', type: 'button', onclick: () => go('verlauf') }, 'Alle anzeigen') : null));
  if (last.length) root.append(h('ul', { class: 'list' }, last.map((r) => runRow(r))));
  else root.append(h('div', { class: 'panel empty' }, h('p', { text: 'Noch keine Läufe auf diesem Gerät.' }), h('div', { class: 'btnrow', style: 'justify-content:center' }, h('button', { class: 'btn', type: 'button', onclick: () => openRun(null) }, 'Ersten Lauf eintragen'), h('button', { class: 'btn sec', type: 'button', onclick: () => openData() }, 'Backup laden'))));
  $('#v-heute').replaceChildren(root);
}
function goalBar(p0, pred, g, compact) {
  const pct = Math.max(0, Math.min(1, (p0.t - pred.t) / (p0.t - g.zielzeit_s)));
  const wrap = h('div', { class: 'goalbar', role: 'img', 'aria-label': 'Von ' + dur(p0.t) + ' am ' + dShort(p0.d) + ' Richtung Ziel ' + dur(g.zielzeit_s) + ': ' + Math.round(pct * 100) + ' Prozent des Wegs' });
  wrap.append(h('span', { class: 'rail' }), h('span', { class: 'fill', style: 'width:' + (pct * 100) + '%' }), h('span', { class: 'finish' }), h('span', { class: 'me', style: 'left:' + (pct * 100) + '%' }));
  if (!compact) wrap.append(h('span', { class: 'l', style: 'left:0', text: dShort(p0.d) + ': ' + dur(p0.t) }), h('span', { class: 'l r', text: 'Ziel ' + dur(g.zielzeit_s) }));
  return wrap;
}
function fersenStrip(R, n) {
  const F = R.filter((r) => r.ferse != null).slice(-n);
  const st = h('div', { class: 'strip', role: 'img', 'aria-label': 'Letzte ' + F.length + ' Fersenwerte: ' + F.map((r) => FERSE[r.ferse]).join(', ') });
  F.forEach((r) => st.append(h('i', { class: 'f' + r.ferse, title: dShort(r.datum) + ': ' + FERSE[r.ferse] })));
  return st;
}

// ============ TRAINING ============
function renderTraining(R) {
  const root = h('div', { class: 'screen' });
  const t = todayIso();
  const W = weeks(R, addDays(monday(t), -7 * 4), t), full = W.slice(0, 4), avg4 = full.reduce((a, w) => a + w.km, 0) / 4;
  root.append(topbar('training', 'Training', R.length ? 'Im Schnitt ' + de(avg4, 1) + ' km pro Woche über die letzten vier vollen Wochen' : 'Noch keine Läufe', dataBtn()));
  const tabs = [['umfang', 'Umfang'], ['quali', 'Qualität'], ['long', 'Long Runs'], ['strecken', 'Strecken']];
  root.append(h('div', { class: 'seg', role: 'group', 'aria-label': 'Ansicht' }, tabs.map(([k, n]) => h('button', { type: 'button', 'aria-pressed': String(R_.train === k), onclick: () => { R_.train = k; render(); } }, n))));
  const body = h('div', { style: 'display:flex;flex-direction:column;gap:14px' });
  root.append(body);
  $('#v-training').replaceChildren(root);
  if (!R.length) { body.append(h('div', { class: 'panel empty', text: 'Sobald Läufe eingetragen sind, siehst du hier Umfang, Qualitätseinheiten und Long Runs.' })); return; }

  if (R_.train === 'umfang') {
    const p = h('section', { class: 'panel' }, h('div', { class: 'panel-h' }, h('h2', { text: 'Kilometer pro Woche' }), h('span', { class: 'aside', text: '12 Wochen' })));
    const host = h('div', { class: 'chart' }); p.append(host); body.append(p);
    const ro = h('p', { class: 'readout', 'aria-live': 'polite' }); p.append(ro);
    p.append(h('div', { class: 'legend' }, TYPS.map((ty) => h('span', null, h('i', { class: 'dot t-' + ty }), TYPN[ty])), h('span', null, h('i', { class: 'dot', style: 'background:transparent;border:1.5px dashed var(--bahn)' }), 'Obergrenze +10 %')));
    chartWeeks(host, ro, R, 12);
    const cur = weeks(R, monday(t), t)[0], prev = W[3];
    body.append(h('dl', { class: 'kv k3' },
      h('div', null, h('dt', { text: 'Diese Woche' }), h('dd', null, de(cur.km, 1), h('small', { text: 'km' }))),
      h('div', null, h('dt', { text: 'Vorwoche' }), h('dd', null, de(prev ? prev.km : 0, 1), h('small', { text: 'km' }))),
      h('div', null, h('dt', { text: 'Gesamt' }), h('dd', null, de(R.reduce((a, r) => a + (r.km || 0), 0), 0), h('small', { text: 'km' })))));
  }
  if (R_.train === 'quali') {
    const Q = R.filter((r) => r.typ === 'Qualität');
    const groups = ['Schwelle', 'Progression', 'Tempo', 'VO2max', 'Fartlek', 'Berg', ''];
    body.append(h('p', { class: 'lede', text: 'Nach Format getrennt, denn vergleichen lassen sich nur gleiche Formate.' }));
    for (const gname of groups) {
      const rows = Q.filter((r) => (r.intensitaet || '') === gname).reverse();
      if (!rows.length) continue;
      body.append(h('h2', { class: 'section-t', text: gname || 'Ohne Format' }));
      body.append(h('ul', { class: 'list' }, rows.map((r) => {
        const d = parse(r.datum);
        return h('li', null, h('button', { class: 'row', type: 'button', onclick: () => openDetail(r.id) },
          h('span', { class: 'when' }, h('b', { text: d.getUTCDate() }), h('span', { text: MON[d.getUTCMonth()] })),
          h('span', { class: 'what' }, h('b', null, h('span', { text: r.kern || '–' })), h('small', { text: [r.ort === 'Band' ? 'Band' : 'draußen', r.hf_max ? 'Puls bis ' + r.hf_max : null, r.rpe ? 'RPE ' + r.rpe : null].filter(Boolean).join(', ') })),
          h('span', { class: 'amt' }, r.kern_pace_s ? pace(r.kern_pace_s) : '–', h('small', { text: '/km' }))));
      })));
    }
    if (!Q.length) body.append(h('div', { class: 'panel empty', text: 'Noch keine Qualitätseinheiten eingetragen.' }));
  }
  if (R_.train === 'long') {
    const L = R.filter((r) => r.typ === 'Long');
    const p = h('section', { class: 'panel' }, h('div', { class: 'panel-h' }, h('h2', { text: 'Dauer der Long Runs' }), h('span', { class: 'aside', text: 'Farbe: Energie' })));
    const host = h('div', { class: 'chart' }); p.append(host);
    const ro = h('p', { class: 'readout', 'aria-live': 'polite' }); p.append(ro); body.append(p);
    chartLongs(host, ro, L);
    body.append(h('ul', { class: 'list' }, L.slice().reverse().map((r) => {
      const d = parse(r.datum);
      return h('li', null, h('button', { class: 'row', type: 'button', onclick: () => openDetail(r.id) },
        h('span', { class: 'when' }, h('b', { text: d.getUTCDate() }), h('span', { text: MON[d.getUTCMonth()] })),
        h('span', { class: 'what' }, h('b', null, h('span', { text: durShort(r.dauer_s) + ', ' + de(r.km, 1) + ' km' }), r.energie ? tag(r.energie, ETAG[r.energie]) : null), h('small', { text: [r.pace_s ? pace(r.pace_s) + ' /km' : null, r.hf ? r.hf + ' bpm' : null, r.hm ? r.hm + ' Hm' : null].filter(Boolean).join(', ') })),
        h('span', { class: 'amt' }, r.hm != null ? String(r.hm) : '–', h('small', { text: 'Hm' }))));
    })));
  }
  if (R_.train === 'strecken') {
    const names = Array.from(new Set(R.map((r) => r.strecke).filter(Boolean))).sort();
    body.append(h('p', { class: 'lede', text: 'Dieselbe Runde an verschiedenen Tagen ist der fairste Vergleich, den hügeliges Gelände zulässt. Weniger Herzschläge pro Kilometer heißt: Die Grundlage wird besser.' }));
    if (!names.length) { body.append(h('div', { class: 'panel empty', text: 'Noch keine Strecke benannt. Gib beim Eintragen eines Laufs eine Strecke an, dann erscheint sie hier.' })); return; }
    if (!R_.strecke || !names.includes(R_.strecke)) R_.strecke = names[0];
    body.append(h('div', { class: 'chips', role: 'group', 'aria-label': 'Strecke' }, names.map((n) => h('button', { type: 'button', 'aria-pressed': String(n === R_.strecke), onclick: () => { R_.strecke = n; render(); } }, n))));
    const SR = R.filter((r) => r.strecke === R_.strecke).reverse();
    const best = Math.min(...SR.filter((r) => r.hf && r.pace_s).map((r) => r.hf * r.pace_s / 60));
    body.append(h('ul', { class: 'list' }, SR.map((r) => {
      const d = parse(r.datum), hk = r.hf && r.pace_s ? Math.round(r.hf * r.pace_s / 60) : null;
      return h('li', null, h('button', { class: 'row', type: 'button', onclick: () => openDetail(r.id) },
        h('span', { class: 'when' }, h('b', { text: d.getUTCDate() }), h('span', { text: MON[d.getUTCMonth()] })),
        h('span', { class: 'what' }, h('b', null, h('span', { text: (r.pace_s ? pace(r.pace_s) + ' /km' : '–') + (r.hf ? ' bei ' + r.hf + ' bpm' : '') }), hk && Math.round(best) === hk && SR.length > 1 ? tag('bester', 'ok') : null), h('small', { text: [TYPN[r.typ], r.km ? de(r.km, 2) + ' km' : null, r.notiz].filter(Boolean).join(', ') })),
        h('span', { class: 'amt' }, hk ? String(hk) : '–', h('small', { text: 'Schl./km' }))));
    })));
  }
}

function chartWeeks(host, ro, R, n) {
  const t = todayIso(), first = monday(R[0].datum);
  const start = [addDays(monday(t), -7 * (n - 1)), first].sort().pop();
  const W = weeks(R, start, t), cur = W[W.length - 1], lastFull = W.length > 1 ? W[W.length - 2] : null;
  const ghost = { woche: addDays(cur.woche, 7), km: Math.round(Math.max(cur.km, lastFull ? lastFull.km : 0) * 1.1 * 10) / 10, ghost: true };
  const pts = W.concat([ghost]);
  const w = measure(host), hgt = 220, m = { t: 26, r: 4, b: 26, l: 26 };
  const step = (w - m.l - m.r) / pts.length, bw = Math.min(34, step * 0.66);
  const max = Math.max(10, ...pts.map((p) => p.km)) * 1.12;
  const niceMax = Math.ceil(max / 10) * 10;
  const y = (v) => hgt - m.b - (v / niceMax) * (hgt - m.t - m.b);
  const x = (i) => m.l + step * i + (step - bw) / 2;
  const svg = s('svg', { viewBox: '0 0 ' + w + ' ' + hgt, role: 'img', 'aria-label': 'Kilometer pro Woche, gestapelt nach Art des Laufs' });
  for (let v = 0; v <= niceMax; v += niceMax > 40 ? 20 : 10) { svg.append(s('line', { class: 'gl', x1: m.l, x2: w - m.r, y1: y(v), y2: y(v) }), s('text', { x: m.l - 6, y: y(v) + 4, 'text-anchor': 'end', text: v })); }
  const rx = Math.min(7, bw / 3.2);
  const defs = s('defs'); svg.append(defs);
  let sel = W.length - 1;
  const groups = [];
  W.forEach((wk, i) => {
    const g = s('g', { class: motion() ? 'grow' : null, style: '--i:' + i + (wk === cur ? ';opacity:.55' : '') });
    if (wk.km) {
      const cid = 'cw' + i + Math.random().toString(36).slice(2, 6);
      defs.append(s('clipPath', { id: cid }, s('rect', { x: x(i), y: y(wk.km), width: bw, height: y(0) - y(wk.km) + rx, rx })));
      const inner = s('g', { 'clip-path': 'url(#' + cid + ')' });
      let acc = 0;
      TYPS.forEach((ty) => { const v = wk.t[ty] || 0; if (!v) return; inner.append(s('rect', { x: x(i), y: y(acc + v), width: bw, height: Math.max(0, y(acc) - y(acc + v)), fill: TYPC[ty] })); acc += v; });
      g.append(inner);
    }
    svg.append(g); groups.push(g);
  });
  const gi = pts.length - 1;
  svg.append(s('rect', { x: x(gi) + .75, y: y(ghost.km), width: bw - 1.5, height: y(0) - y(ghost.km), rx, fill: 'var(--bahn-soft)', stroke: 'var(--bahn)', 'stroke-width': 1.5, 'stroke-dasharray': '4 4' }));
  svg.append(s('text', { class: 'vl', x: x(gi) + bw / 2, y: y(ghost.km) - 8, 'text-anchor': 'middle', style: 'fill:var(--bahn)', text: '≤' + de(ghost.km, 0) }));
  const dense = step < 34, maxKm = Math.max(...W.map((p) => p.km));
  W.forEach((wk, i) => { if (wk.km && (!dense || wk === cur || wk.km === maxKm)) svg.append(s('text', { class: 'vl', x: x(i) + bw / 2, y: y(wk.km) - 8, 'text-anchor': 'middle', text: de(wk.km, wk.km >= 10 ? 0 : 1) })); });
  const every = Math.ceil(46 / step);
  pts.forEach((p, i) => { if ((pts.length - 1 - i) % every === 0) svg.append(s('text', { x: x(i) + bw / 2, y: hgt - 6, 'text-anchor': 'middle', style: p.ghost ? 'fill:var(--bahn);font-weight:600' : null, text: p.ghost ? 'nächste' : dNum(p.woche) })); });
  const show = (i) => {
    const wk = W[i]; sel = i;
    ro.replaceChildren(h('b', { text: 'Woche ab ' + dShort(wk.woche) + ': ' + de(wk.km, 1) + ' km' }), wk.n ? ' in ' + wordRuns(wk.n) : '', wk.n ? ' (' + TYPS.filter((ty) => wk.t[ty]).map((ty) => TYPN[ty] + ' ' + de(wk.t[ty], 1)).join(', ') + ')' : '', i === W.length - 1 ? '. Laufende Woche.' : '.');
    selBar.setAttribute('x', x(i)); selBar.setAttribute('width', bw);
  };
  const selBar = s('rect', { x: x(sel), y: hgt - m.b + 3, width: bw, height: 3, rx: 1.5, fill: 'var(--ink)' }); svg.append(selBar);
  W.forEach((wk, i) => svg.append(s('rect', { class: 'hit', x: m.l + step * i, y: m.t, width: step, height: hgt - m.t - m.b + 4, fill: 'transparent', tabindex: '0', role: 'button', 'aria-label': 'Woche ab ' + dShort(wk.woche) + ', ' + de(wk.km, 1) + ' Kilometer', onclick: () => show(i), onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(i); } } })));
  host.replaceChildren(svg);
  show(sel);
}

function chartLongs(host, ro, L) {
  if (!L.length) { host.replaceChildren(h('p', { class: 'empty', text: 'Noch keine Long Runs eingetragen.' })); ro.hidden = true; return; }
  ro.hidden = false;
  const D = L.slice(-14);
  const w = measure(host), hgt = 200, m = { t: 24, r: 4, b: 26, l: 30 };
  const step = (w - m.l - m.r) / D.length, bw = Math.min(30, step * 0.62);
  const maxMin = Math.max(90, ...D.map((r) => (r.dauer_s || 0) / 60));
  const top = Math.ceil(maxMin / 15) * 15;
  const y = (v) => hgt - m.b - (v / top) * (hgt - m.t - m.b);
  const x = (i) => m.l + step * i + (step - bw) / 2;
  const col = { gut: 'var(--ok-fill)', normal: 'var(--dusk-fill)', schwer: 'var(--apricot)', kraftlos: 'var(--bad)' };
  const svg = s('svg', { viewBox: '0 0 ' + w + ' ' + hgt, role: 'img', 'aria-label': 'Dauer der Long Runs in Minuten, eingefärbt nach Energiegefühl' });
  for (let v = 0; v <= top; v += 30) svg.append(s('line', { class: 'gl', x1: m.l, x2: w - m.r, y1: y(v), y2: y(v) }), s('text', { x: m.l - 6, y: y(v) + 4, 'text-anchor': 'end', text: v }));
  D.forEach((r, i) => {
    const mi = (r.dauer_s || 0) / 60;
    svg.append(s('rect', { class: motion() ? 'grow' : null, style: '--i:' + i, x: x(i), y: y(mi), width: bw, height: Math.max(0, y(0) - y(mi)), rx: Math.min(6, bw / 3), fill: col[r.energie] || 'var(--line-2)' }));
    if (step > 30 || i === D.length - 1) svg.append(s('text', { class: 'vl', x: x(i) + bw / 2, y: y(mi) - 7, 'text-anchor': 'middle', text: Math.round(mi) }));
    if (i % Math.ceil(52 / step) === (D.length - 1) % Math.ceil(52 / step)) svg.append(s('text', { x: x(i) + bw / 2, y: hgt - 6, 'text-anchor': 'middle', text: dShort(r.datum) }));
  });
  const show = (i) => { const r = D[i]; ro.replaceChildren(h('b', { text: dShort(r.datum) + ': ' + durShort(r.dauer_s) }), ', ' + de(r.km, 2) + ' km', r.hm ? ', ' + r.hm + ' Hm' : '', r.energie ? ', Energie ' + r.energie : '', r.notiz ? '. ' + r.notiz : ''); };
  D.forEach((r, i) => svg.append(s('rect', { class: 'hit', x: m.l + step * i, y: m.t, width: step, height: hgt - m.t - m.b, fill: 'transparent', tabindex: '0', role: 'button', 'aria-label': dShort(r.datum) + ', ' + durShort(r.dauer_s), onclick: () => show(i), onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(i); } } })));
  host.replaceChildren(svg);
  const lg = h('div', { class: 'legend' }, Object.entries(col).map(([k, c]) => h('span', null, h('i', { class: 'dot', style: 'background:' + c }), k)));
  host.append(lg);
  show(D.length - 1);
}

// ============ KÖRPER ============
function renderKoerper(R) {
  const st = streak(R);
  const root = h('div', { class: 'screen' });
  root.append(topbar('koerper', 'Körper', st.total ? plural(st.n, 'Lauf', 'Läufe') + ' in Folge ohne deutliches Fersensignal' : 'Noch keine Fersenwerte', dataBtn()));
  const p = h('section', { class: 'panel' }, h('div', { class: 'panel-h' }, h('h2', { text: 'Ferse nach jedem Lauf' }), h('span', { class: 'aside', text: 'Selbsteinschätzung' })));
  const host = h('div', { class: 'chart' }); p.append(host);
  const ro = h('p', { class: 'readout', 'aria-live': 'polite' }); p.append(ro);
  root.append(p);
  // Energie / Schlaf / Magen
  const E = R.filter((r) => r.energie || r.schlaf || r.magen).reverse();
  const L = R.filter((r) => r.typ === 'Long' && r.energie);
  const cnt = (k) => L.filter((r) => r.energie === k).length;
  root.append(h('h2', { class: 'section-t', text: 'Energie bei Long Runs' }));
  root.append(h('dl', { class: 'kv k4' }, ['gut', 'normal', 'schwer', 'kraftlos'].map((k) => h('div', null, h('dt', { text: k }), h('dd', { text: String(cnt(k)) })))));
  root.append(h('h2', { class: 'section-t', text: 'Notizen zu Energie, Schlaf und Magen' }));
  if (E.length) root.append(h('ul', { class: 'list' }, E.map((r) => {
    const d = parse(r.datum);
    return h('li', null, h('button', { class: 'row', type: 'button', onclick: () => openDetail(r.id) },
      h('span', { class: 'when' }, h('b', { text: d.getUTCDate() }), h('span', { text: MON[d.getUTCMonth()] })),
      h('span', { class: 'what' }, h('b', { style: 'flex-wrap:wrap' }, r.energie ? tag('Energie ' + r.energie, ETAG[r.energie]) : null, r.schlaf ? tag('Schlaf ' + r.schlaf, r.schlaf === 'gut' ? 'ok' : r.schlaf === 'schlecht' ? 'warn' : '') : null, r.magen ? tag('Magen ' + r.magen, r.magen === 'ok' ? 'ok' : 'warn') : null), h('small', { text: runTitle(r) + (r.notiz ? ', ' + r.notiz : '') })),
      h('span')));
  })));
  else root.append(h('div', { class: 'panel empty', text: 'Noch keine Einträge.' }));
  $('#v-koerper').replaceChildren(root);
  chartFerse(host, ro, R);
}
function chartFerse(host, ro, R) {
  const t = todayIso();
  const RR = R.filter((r) => r.datum >= addDays(t, -150));
  if (!RR.length) { host.replaceChildren(h('p', { class: 'empty', text: 'Noch keine Läufe.' })); ro.hidden = true; return; }
  ro.hidden = false;
  const w = measure(host), hgt = 200, m = { t: 12, r: 10, b: 26, l: 86 };
  const t0 = +parse(RR[0].datum), t1 = Math.max(+parse(RR[RR.length - 1].datum), t0 + DAY);
  const x = (d) => m.l + 8 + ((+parse(d) - t0) / (t1 - t0)) * (w - m.l - m.r - 16);
  const y = (lv) => m.t + (3 - lv) / 3.4 * (hgt - m.t - m.b - 18);
  const yNone = hgt - m.b - 4;
  const svg = s('svg', { class: 'fline', viewBox: '0 0 ' + w + ' ' + hgt, role: 'img', 'aria-label': 'Fersenwert nach jedem Lauf, von ruhig bis Schmerz' });
  const lc = ['var(--ok)', 'var(--warn)', 'var(--bad)', 'var(--bad)'], dc = ['var(--ok-fill)', 'var(--apricot)', 'var(--bad)', 'var(--bad)'];
  for (let lv = 0; lv <= 3; lv++) svg.append(s('line', { class: 'gl', x1: m.l, x2: w - m.r, y1: y(lv), y2: y(lv) }), s('text', { class: 'lv', x: 0, y: y(lv) + 4, style: 'fill:' + lc[lv], text: FERSE[lv] }));
  svg.append(s('text', { x: 0, y: yNone + 4, text: 'kein Eintrag' }));
  const M = RR.filter((r) => r.ferse != null);
  if (M.length > 1) { const path = s('path', { d: M.map((r, i) => (i ? 'L' : 'M') + x(r.datum).toFixed(1) + ' ' + y(r.ferse).toFixed(1)).join(' '), fill: 'none', stroke: 'var(--line-2)', 'stroke-width': 2, 'stroke-linejoin': 'round' }); svg.append(path); drawLine(path); }
  const months = []; for (let d = RR[0].datum.slice(0, 7) + '-01'; d <= t; d = iso(new Date(Date.UTC(+d.slice(0, 4), +d.slice(5, 7), 1)))) if (d >= RR[0].datum) months.push(d);
  months.forEach((d) => svg.append(s('text', { x: x(d), y: hgt - 6, 'text-anchor': 'middle', text: MON[parse(d).getUTCMonth()] })));
  const show = (r) => ro.replaceChildren(h('b', { text: dLong(r.datum) + ': ' }), r.ferse != null ? 'Ferse ' + FERSE[r.ferse] : 'kein Fersen-Eintrag', ', ' + runTitle(r) + (r.km ? ', ' + de(r.km, 1) + ' km' : ''), r.notiz ? '. ' + r.notiz : '');
  RR.forEach((r) => {
    const cy = r.ferse != null ? y(r.ferse) : yNone, cx = x(r.datum);
    if (r.ferse != null) svg.append(s('circle', { cx, cy, r: 6.5, fill: dc[r.ferse], stroke: '#fff', 'stroke-width': 2 }));
    else svg.append(s('circle', { cx, cy, r: 3.5, fill: 'none', stroke: 'var(--muted)', 'stroke-width': 1.3 }));
    svg.append(s('circle', { class: 'hit', cx, cy, r: 14, fill: 'transparent', tabindex: '0', role: 'button', 'aria-label': dShort(r.datum) + ': ' + (r.ferse != null ? FERSE[r.ferse] : 'kein Eintrag'), onclick: () => show(r), onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(r); } } }));
  });
  host.replaceChildren(svg);
  const lastM = M[M.length - 1] || RR[RR.length - 1];
  show(lastM);
}

// ============ ZIEL ============
function renderZiel(R) {
  const root = h('div', { class: 'screen' });
  const Z = goals();
  if (!R_.zielSel || !store.ziele[R_.zielSel]) R_.zielSel = (nextGoal() || Z[Z.length - 1] || {}).id || null;
  const g = R_.zielSel ? { ...store.ziele[R_.zielSel], id: R_.zielSel } : null;
  root.append(topbar('ziel', 'Ziel', g ? g.name + ', ' + dFull(g.datum) : 'Noch kein Wettkampf eingetragen', h('button', { class: 'iconbtn', type: 'button', 'aria-label': 'Wettkampf hinzufügen', onclick: () => openGoal(null) }, icon('plus'))));
  if (Z.length > 1) root.append(h('div', { class: 'chips', role: 'group', 'aria-label': 'Wettkampf' }, Z.map((z) => h('button', { type: 'button', 'aria-pressed': String(z.id === R_.zielSel), onclick: () => { R_.zielSel = z.id; render(); } }, z.name))));

  if (!g) {
    root.append(h('section', { class: 'panel' }, h('p', { class: 'lede', style: 'padding:0', text: 'Trag einen Wettkampf mit Datum und Zielzeit ein. Das Cockpit schätzt dann nach jedem Lauf neu, wo du stehst, wie groß die Lücke ist und ob dein Umfang bis zum Termin reicht.' }), h('div', { class: 'btnrow', style: 'margin-top:14px' }, h('button', { class: 'btn', type: 'button', onclick: () => openGoal(null) }, icon('plus'), 'Wettkampf hinzufügen'))));
    root.append(h('h2', { class: 'section-t', text: 'Schätzung heute' }));
    root.append(h('ul', { class: 'list' }, [['5 km', 5], ['10 km', 10], ['Halbmarathon', 21.0975], ['Marathon', 42.195]].map(([n, d]) => { const p = predict(R, d); return h('li', null, h('div', { class: 'row', style: 'grid-template-columns:minmax(0,1fr) auto' }, h('span', { class: 'what' }, h('b', { text: n }), h('small', { text: p ? 'Spanne ' + dur(p.lo) + ' bis ' + dur(p.hi) : 'zu wenig Daten' })), h('span', { class: 'amt', text: p ? dur(p.t) : '–' }))); })));
    root.append(methodBox());
    $('#v-ziel').replaceChildren(root);
    return;
  }
  const pred = predict(R, g.distanz_km), wl = weeksLeft(g), v = verdict(pred, g, wl);
  const gap = pred ? (pred.t - g.zielzeit_s) / g.distanz_km : null;
  const hero = h('section', { class: 'hero' });
  hero.append(h('div', { class: 'hero-top' }, h('div', null, h('p', { class: 'hint', text: 'Schätzung heute' }), h('div', { class: 'hero-km', text: pred ? dur(pred.t) : '–' })), h('p', { class: 'hero-of' }, tag(v.txt, v.cls), h('br'), 'Ziel ', h('b', { text: dur(g.zielzeit_s) }))));
  const p0 = firstPred(R, g.distanz_km);
  if (pred && p0 && p0.t > g.zielzeit_s) hero.append(goalBar(p0, pred, g, false));
  hero.append(h('dl', { class: 'kv k3' },
    h('div', null, h('dt', { text: 'Lücke' }), h('dd', null, gap == null ? '–' : String(Math.max(0, Math.round(gap))), h('small', { text: 's/km' }))),
    h('div', null, h('dt', { text: 'Noch' }), h('dd', null, String(wl), h('small', { text: wl === 1 ? 'Woche' : 'Wochen' }))),
    h('div', null, h('dt', { text: 'Zieltempo' }), h('dd', null, pace(g.zielzeit_s / g.distanz_km), h('small', { text: '/km' })))));
  if (pred) hero.append(h('p', { class: 'hint', text: 'Spanne ' + dur(pred.lo) + ' bis ' + dur(pred.hi) + '. Grundlage: ' + pred.est.map((e) => e.src).join('; ') + '.' + (v.pw ? ' Nötig sind etwa ' + de(v.pw, 2) + ' % Verbesserung pro Woche.' : '') }));
  hero.append(h('div', { class: 'btnrow' }, h('button', { class: 'btn ghost', type: 'button', onclick: () => openGoal(g) }, 'Wettkampf bearbeiten')));
  root.append(hero);

  const p1 = h('section', { class: 'panel' }, h('div', { class: 'panel-h' }, h('h2', { text: 'Wie sich die Schätzung entwickelt' })));
  const c1 = h('div', { class: 'chart' }); const r1 = h('p', { class: 'readout', 'aria-live': 'polite' }); p1.append(c1, r1); root.append(p1);
  const p2 = h('section', { class: 'panel' }, h('div', { class: 'panel-h' }, h('h2', { text: 'Reicht der Umfang bis zum Termin?' })));
  const t2 = h('p', { class: 'hint', style: 'margin-bottom:10px' }); const c2 = h('div', { class: 'chart' }); const r2 = h('p', { class: 'readout', 'aria-live': 'polite' });
  p2.append(t2, c2, r2); root.append(p2);
  root.append(methodBox());
  $('#v-ziel').replaceChildren(root);
  chartPrognose(c1, r1, R, g);
  chartPfad(c2, t2, r2, R, g, wl);
}
function methodBox() {
  return h('details', { class: 'panel' }, h('summary', { style: 'font-weight:700;cursor:pointer;min-height:28px' }, 'Wie die Schätzung entsteht'),
    h('div', { style: 'display:flex;flex-direction:column;gap:10px;margin-top:10px;font-size:15px;color:var(--ink-2)' },
      h('p', { text: 'Zwei Quellen fließen ein: Wettkämpfe der letzten 120 Tage, hochgerechnet mit der Riegel-Formel (Zeit × (Zieldistanz / Distanz) hoch 1,06), und das schnellste Kernteil-Tempo einer Schwellen-, Tempo- oder Progressionseinheit der letzten sechs Wochen, gelesen als Tempo für etwa eine Stunde. Liegen beide vor, zählt der Mittelwert.' }),
      h('p', { text: 'Die Einschätzung teilt die nötige Verbesserung durch die verbleibenden Wochen: bis 0,25 % pro Woche auf Kurs, bis 0,5 % ambitioniert, darüber sehr ambitioniert. Am meisten verbessert ein echter Testlauf über 5 oder 10 km die Schätzung.' }),
      h('p', { text: 'Der Umfangs-Richtwert hängt von Distanz und Zieltempo ab. Der Pfad steigert höchstens 10 % pro Woche, plant nach drei Aufbauwochen eine leichtere Woche und endet mit zwei Wochen Taper.' })));
}
function chartPrognose(host, ro, R, g) {
  const t = todayIso(), P = [];
  if (R.length) for (let k = addDays(monday(R[0].datum), 6); k <= addDays(t, 6); k = addDays(k, 7)) { const d = k > t ? t : k; const p = predict(R, g.distanz_km, d); if (p) P.push({ d, ...p }); }
  if (!P.length) { host.replaceChildren(h('p', { class: 'empty', text: 'Noch zu wenig Daten für einen Verlauf.' })); ro.hidden = true; return; }
  const w = measure(host), hgt = 210, m = { t: 14, r: 40, b: 26, l: 44 };
  const tA = +parse(P[0].d), tB = Math.max(+parse(g.datum), tA + 7 * DAY);
  const x = (d) => m.l + ((+parse(d) - tA) / (tB - tA)) * (w - m.l - m.r);
  const all = P.flatMap((p) => [p.lo, p.hi]).concat(g.zielzeit_s);
  let lo = Math.min(...all) * 0.985, hi = Math.max(...all) * 1.01;
  const stp = hi - lo > 2400 ? 600 : hi - lo > 720 ? 300 : 120;
  lo = Math.floor(lo / stp) * stp; hi = Math.ceil(hi / stp) * stp;
  const y = (v) => m.t + (hi - v) / (hi - lo) * (hgt - m.t - m.b);
  const svg = s('svg', { viewBox: '0 0 ' + w + ' ' + hgt, role: 'img', 'aria-label': 'Verlauf der Zeitschätzung bis zum Wettkampf' });
  for (let v = lo; v <= hi; v += stp) svg.append(s('line', { class: 'gl', x1: m.l, x2: w - m.r, y1: y(v), y2: y(v) }), s('text', { x: m.l - 6, y: y(v) + 4, 'text-anchor': 'end', text: dur(v).replace(/:00$/, '') }));
  for (let d = P[0].d.slice(0, 7) + '-01'; +parse(d) <= tB; d = iso(new Date(Date.UTC(+d.slice(0, 4), +d.slice(5, 7), 1)))) if (+parse(d) >= tA) svg.append(s('text', { x: x(d), y: hgt - 6, 'text-anchor': 'middle', text: MON[parse(d).getUTCMonth()] }));
  svg.append(s('line', { x1: m.l, x2: w - m.r, y1: y(g.zielzeit_s), y2: y(g.zielzeit_s), stroke: 'var(--dusk)', 'stroke-width': 1.5, 'stroke-dasharray': '5 4' }));
  svg.append(s('circle', { cx: x(g.datum), cy: y(g.zielzeit_s), r: 6, fill: 'var(--dusk)' }), s('text', { x: x(g.datum) + 10, y: y(g.zielzeit_s) + 4, style: 'fill:var(--dusk);font-weight:700', text: 'Ziel' }));
  if (P.length > 1) svg.append(s('path', { d: P.map((p, i) => (i ? 'L' : 'M') + x(p.d).toFixed(1) + ' ' + y(p.hi).toFixed(1)).join(' ') + ' ' + P.slice().reverse().map((p) => 'L' + x(p.d).toFixed(1) + ' ' + y(p.lo).toFixed(1)).join(' ') + 'Z', fill: 'var(--bahn-soft)' }));
  if (P.length > 1) { const pa = s('path', { d: P.map((p, i) => (i ? 'L' : 'M') + x(p.d).toFixed(1) + ' ' + y(p.t).toFixed(1)).join(' '), fill: 'none', stroke: 'var(--bahn)', 'stroke-width': 2.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }); svg.append(pa); drawLine(pa); }
  const show = (p) => ro.replaceChildren(h('b', { text: 'Stand ' + dShort(p.d) + ': ' + dur(p.t) }), ' (Spanne ' + dur(p.lo) + ' bis ' + dur(p.hi) + '). Grundlage: ' + p.est.map((e) => e.src).join('; ') + '.');
  P.forEach((p, i) => { const last = i === P.length - 1; svg.append(s('circle', { cx: x(p.d), cy: y(p.t), r: last ? 6 : 3.5, fill: 'var(--bahn)', stroke: '#fff', 'stroke-width': 2 })); svg.append(s('circle', { class: 'hit', cx: x(p.d), cy: y(p.t), r: 14, fill: 'transparent', tabindex: '0', role: 'button', 'aria-label': 'Stand ' + dShort(p.d) + ': ' + dur(p.t), onclick: () => show(p), onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(p); } } })); });
  host.replaceChildren(svg);
  show(P[P.length - 1]);
}
function chartPfad(host, txt, ro, R, g, wl) {
  const t = todayIso(), end = monday(g.datum);
  const W = R.length ? weeks(R, [addDays(monday(t), -7 * 8), monday(R[0].datum)].sort().pop(), t) : [];
  const full = W.slice(-5, -1), cur4 = full.reduce((a, w) => a + w.km, 0) / Math.max(1, full.length);
  const lastFull = full.length ? full[full.length - 1].km : 0, base = Math.max(cur4, lastFull), peak = peakKm(g);
  const steps = base > 0 ? Math.max(0, Math.ceil(Math.log(peak / base) / Math.log(1.1))) : null;
  const need = steps == null ? null : steps + Math.floor(steps / 3), avail = wl - 2;
  txt.textContent = 'Für ' + dur(g.zielzeit_s) + ' ist ein Spitzenumfang um ' + peak + ' km pro Woche ein vernünftiger Richtwert. Deine letzte volle Woche hatte ' + de(lastFull, 1) + ' km, der Vier-Wochen-Schnitt liegt bei ' + de(cur4, 1) + ' km. ' + (need == null ? '' : need <= avail ? 'Mit höchstens +10 % pro Woche und Entlastungswochen erreichst du ihn in etwa ' + need + ' Wochen, also vor dem Taper.' : 'Mit höchstens +10 % pro Woche bräuchtest du etwa ' + need + ' Wochen, es bleiben aber nur ' + Math.max(0, avail) + '.');
  if (!W.length || end <= monday(t)) { host.replaceChildren(h('p', { class: 'empty', text: !W.length ? 'Noch keine Läufe.' : 'Der Wettkampf liegt in dieser Woche oder ist vorbei.' })); ro.hidden = true; return; }
  ro.hidden = false;
  const path = []; let level = base, built = 0;
  for (let wk = addDays(monday(t), 7); wk <= end; wk = addDays(wk, 7)) {
    const left = Math.round((+parse(end) - +parse(wk)) / (7 * DAY)); let km;
    if (left <= 1) km = peak * (left === 1 ? 0.7 : 0.5);
    else { built++; if (built % 4 === 0) km = level * 0.8; else { level = Math.min(peak, level * 1.1); km = level; } }
    path.push({ woche: wk, km: Math.round(km * 10) / 10, plan: true });
  }
  const all = W.concat(path);
  const w = measure(host), hgt = 200, m = { t: 14, r: 44, b: 26, l: 28 };
  const step = (w - m.l - m.r) / all.length, bw = Math.max(3, Math.min(16, step * 0.6));
  const top = Math.ceil(Math.max(peak, ...all.map((p) => p.km)) * 1.1 / 10) * 10;
  const y = (v) => hgt - m.b - v / top * (hgt - m.t - m.b);
  const x = (i) => m.l + step * i + (step - bw) / 2;
  const svg = s('svg', { viewBox: '0 0 ' + w + ' ' + hgt, role: 'img', 'aria-label': 'Bisheriger Wochenumfang und möglicher Aufbaupfad bis zum Wettkampf' });
  for (let v = 0; v <= top; v += top > 50 ? 20 : 10) svg.append(s('line', { class: 'gl', x1: m.l, x2: w - m.r, y1: y(v), y2: y(v) }), s('text', { x: m.l - 6, y: y(v) + 4, 'text-anchor': 'end', text: v }));
  svg.append(s('line', { x1: m.l, x2: w - m.r, y1: y(peak), y2: y(peak), stroke: 'var(--dusk)', 'stroke-width': 1.5, 'stroke-dasharray': '5 4' }), s('text', { x: w - m.r + 6, y: y(peak) + 4, style: 'fill:var(--dusk);font-weight:700', text: peak + ' km' }));
  all.forEach((p, i) => svg.append(s('rect', { x: x(i), y: y(p.km), width: bw, height: Math.max(0, y(0) - y(p.km)), rx: Math.min(4, bw / 2.5), fill: p.plan ? 'var(--bahn-soft)' : 'var(--bahn-fill)', stroke: p.plan ? 'var(--bahn-fill)' : null, 'stroke-width': p.plan ? 1 : null, 'stroke-dasharray': p.plan ? '3 2' : null })));
  let lastM = -1; all.forEach((p, i) => { const mo = parse(p.woche).getUTCMonth(); if (mo !== lastM) { lastM = mo; svg.append(s('text', { x: x(i) + bw / 2, y: hgt - 6, 'text-anchor': 'start', text: MON[mo] })); } });
  const show = (i) => { const p = all[i]; ro.replaceChildren(h('b', { text: 'Woche ab ' + dShort(p.woche) + ': ' + de(p.km, 1) + ' km' }), p.plan ? ' als möglicher Pfad, kein Plan.' : ' gelaufen.'); };
  all.forEach((p, i) => svg.append(s('rect', { class: 'hit', x: m.l + step * i, y: m.t, width: step, height: hgt - m.t - m.b, fill: 'transparent', onclick: () => show(i) })));
  host.replaceChildren(svg);
  host.append(h('div', { class: 'legend' }, h('span', null, h('i', { class: 'dot', style: 'background:var(--bahn-fill);border-radius:3px' }), 'gelaufen'), h('span', null, h('i', { class: 'dot', style: 'background:var(--bahn-soft);border:1px dashed var(--bahn-fill);border-radius:3px' }), 'möglicher Pfad'), h('span', null, h('i', { class: 'dot', style: 'background:var(--dusk);height:2px;border-radius:0' }), 'Richtwert')));
  show(W.length - 1);
}

// ============ VERLAUF ============
function renderVerlauf(R) {
  const root = h('div', { class: 'screen' });
  const km = R.reduce((a, r) => a + (r.km || 0), 0);
  root.append(topbar('verlauf', 'Verlauf', R.length ? plural(R.length, 'Lauf', 'Läufe') + ', ' + de(km, 0) + ' km seit ' + dFull(R[0].datum) : 'Noch keine Läufe', dataBtn()));
  const filters = ['Alle', 'Locker', 'Long', 'Qualität', 'Wettkampf'];
  root.append(h('div', { class: 'seg', role: 'group', 'aria-label': 'Filter' }, filters.map((f) => h('button', { type: 'button', 'aria-pressed': String(R_.verlaufFilter === f), onclick: () => { R_.verlaufFilter = f; render(); } }, f === 'Long' ? 'Long' : f))));
  const F = R.filter((r) => R_.verlaufFilter === 'Alle' || r.typ === R_.verlaufFilter).reverse();
  if (!F.length) root.append(h('div', { class: 'panel empty' }, h('p', { text: R.length ? 'Keine Läufe in dieser Auswahl.' : 'Noch keine Läufe auf diesem Gerät. Trag deinen ersten Lauf ein oder lade ein Backup.' }), !R.length ? h('div', { class: 'btnrow', style: 'justify-content:center;margin-top:12px' }, h('button', { class: 'btn sec', type: 'button', onclick: () => openData() }, 'Backup laden')) : null));
  let curM = null, ul = null;
  F.forEach((r) => {
    const mk = r.datum.slice(0, 7);
    if (mk !== curM) {
      curM = mk; const inM = F.filter((x) => x.datum.slice(0, 7) === mk), mkm = inM.reduce((a, x) => a + (x.km || 0), 0);
      root.append(h('p', { class: 'month', text: MONL[+mk.slice(5, 7) - 1] + ' ' + mk.slice(0, 4) + ': ' + de(mkm, 0) + ' km in ' + wordRuns(inM.length) }));
      ul = h('ul', { class: 'list' }); root.append(ul);
    }
    ul.append(runRow(r));
  });
  $('#v-verlauf').replaceChildren(root);
}

// ============ Sheets ============
let openSheetEl = null;
function openSheet(d) {
  if (openSheetEl && openSheetEl !== d) closeSheet(openSheetEl, true, true);
  d.classList.remove('closing');
  if (!d.open) d.showModal();
  openSheetEl = d;
  history.pushState({ sheet: d.id }, '', location.hash);
  const b = $('.sheet-b', d); if (b) b.scrollTop = 0;
}
function closeSheet(d, fromPop, instant) {
  if (!d || !d.open) return;
  if (!fromPop && history.state && history.state.sheet === d.id) { history.back(); return; }
  const done = () => { d.classList.remove('closing'); d.close(); if (openSheetEl === d) openSheetEl = null; };
  if (instant || !motion()) { done(); return; }
  d.classList.add('closing');
  setTimeout(done, 190);
}
window.addEventListener('popstate', () => { if (openSheetEl) closeSheet(openSheetEl, true); });
$$('dialog.sheet').forEach((d) => {
  d.addEventListener('cancel', (e) => { e.preventDefault(); closeSheet(d); });
  d.addEventListener('click', (e) => { if (e.target === d) closeSheet(d); });
  $$('[data-close]', d).forEach((b) => b.addEventListener('click', () => closeSheet(d)));
});

// Chips
function chipsGet(name, root) { const b = $('[data-chips="' + name + '"] [aria-pressed="true"]', root); return b ? b.dataset.v : null; }
function chipsSet(name, val, root) { $$('[data-chips="' + name + '"] button', root).forEach((b) => b.setAttribute('aria-pressed', String(val != null && b.dataset.v === String(val)))); }
$$('[data-chips]').forEach((grp) => {
  const single = ['typ', 'ort', 'dist'].includes(grp.dataset.chips);
  $$('button', grp).forEach((b) => { b.setAttribute('aria-pressed', 'false'); b.addEventListener('click', () => {
    const on = b.getAttribute('aria-pressed') === 'true';
    if (on && single) return;
    $$('button', grp).forEach((x) => x.setAttribute('aria-pressed', 'false'));
    if (!on) b.setAttribute('aria-pressed', 'true');
    grp.dispatchEvent(new Event('change'));
  }); });
});

// ---- Lauf ----
let editRun = null;
const fr = $('#f-run');
function syncQ() { $('#r-q').hidden = chipsGet('typ', fr) !== 'Qualität'; }
$('[data-chips="typ"]', fr).addEventListener('change', syncQ);
function openRun(id) {
  const r = id ? store.laeufe[id] : null; editRun = id || null;
  $('#s-run-t').textContent = r ? 'Lauf vom ' + dShort(r.datum) : 'Lauf eintragen';
  $('#r-datum').value = r ? r.datum : todayIso();
  chipsSet('typ', r ? r.typ : 'Locker', fr); chipsSet('ort', r ? r.ort || 'draußen' : 'draußen', fr);
  $('#r-km').value = r && r.km != null ? de(r.km, 2).replace(/,00$/, '') : '';
  $('#r-dauer').value = r && r.dauer_s ? dur(r.dauer_s) : '';
  $('#r-hf').value = r && r.hf != null ? r.hf : ''; $('#r-hfmax').value = r && r.hf_max != null ? r.hf_max : ''; $('#r-hm').value = r && r.hm != null ? r.hm : '';
  chipsSet('intensitaet', r ? r.intensitaet : null, fr); $('#r-kern').value = r && r.kern ? r.kern : ''; $('#r-kernpace').value = r && r.kern_pace_s ? pace(r.kern_pace_s) : '';
  chipsSet('rpe', r ? r.rpe : null, fr); chipsSet('ferse', r ? r.ferse : null, fr); chipsSet('energie', r ? r.energie : null, fr); chipsSet('schlaf', r ? r.schlaf : null, fr); chipsSet('magen', r ? r.magen : null, fr);
  $('#r-strecke').value = r && r.strecke ? r.strecke : ''; $('#r-notiz').value = r && r.notiz ? r.notiz : '';
  $('#dl-strecken').replaceChildren(...Array.from(new Set(Object.values(store.laeufe).map((x) => x.strecke).filter(Boolean))).map((n) => h('option', { value: n })));
  const del = $('#r-del'); del.hidden = !r; del.dataset.armed = ''; del.lastChild.textContent = 'Löschen';
  $('#r-err').textContent = '';
  syncQ();
  openSheet($('#s-run'));
}
fr.addEventListener('submit', (e) => {
  e.preventDefault();
  const err = $('#r-err'); err.textContent = '';
  const datum = $('#r-datum').value;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datum)) { err.textContent = 'Bitte ein Datum wählen.'; return; }
  const km = num($('#r-km').value), ds = parseDur($('#r-dauer').value), kp = parsePace($('#r-kernpace').value);
  const hf = num($('#r-hf').value), hfm = num($('#r-hfmax').value), hm = num($('#r-hm').value);
  if (Number.isNaN(km) || (km != null && (km <= 0 || km > 300))) { err.textContent = 'Distanz bitte als Zahl in Kilometern, z. B. 10,71.'; return; }
  if (Number.isNaN(ds)) { err.textContent = 'Dauer bitte als mm:ss oder h:mm:ss, z. B. 1:10:41.'; return; }
  if (Number.isNaN(kp)) { err.textContent = 'Pace bitte als m:ss, z. B. 4:50.'; return; }
  if ([hf, hfm, hm].some(Number.isNaN)) { err.textContent = 'Puls und Höhenmeter bitte als ganze Zahlen.'; return; }
  if (km == null && ds == null) { err.textContent = 'Trag mindestens Distanz oder Dauer ein.'; return; }
  const typ = chipsGet('typ', fr) || 'Locker', q = typ === 'Qualität';
  const rpe = chipsGet('rpe', fr), ferse = chipsGet('ferse', fr);
  const doc = { datum, typ, ort: chipsGet('ort', fr) || 'draußen', km, dauer_s: ds, hf, hf_max: hfm, hm, rpe: rpe ? +rpe : null,
    intensitaet: q ? chipsGet('intensitaet', fr) : null, kern: q ? ($('#r-kern').value.trim() || null) : null, kern_pace_s: q ? kp : null,
    ferse: ferse != null ? +ferse : null, energie: chipsGet('energie', fr), schlaf: chipsGet('schlaf', fr), magen: chipsGet('magen', fr),
    strecke: $('#r-strecke').value.trim() || null, notiz: $('#r-notiz').value.trim() || null, geaendert: new Date().toISOString() };
  Object.keys(doc).forEach((k) => { if (doc[k] == null) delete doc[k]; });
  let id = editRun;
  if (!id) { id = datum; let n = 2; while (store.laeufe[id]) id = datum + '-' + n++; }
  else if (store.laeufe[id] && store.laeufe[id].datum !== datum && id.startsWith(store.laeufe[id].datum)) { delete store.laeufe[id]; id = datum; let n = 2; while (store.laeufe[id]) id = datum + '-' + n++; }
  store.laeufe[id] = doc;
  if (!save()) return;
  closeSheet($('#s-run'));
  toast(editRun ? 'Lauf gespeichert' : 'Lauf eingetragen');
  render();
});
$('#r-del').addEventListener('click', () => {
  const b = $('#r-del');
  if (!b.dataset.armed) { b.dataset.armed = '1'; b.lastChild.textContent = 'Wirklich löschen?'; return; }
  delete store.laeufe[editRun]; save(); closeSheet($('#s-run')); toast('Lauf gelöscht'); render();
});

// ---- Details ----
let detailId = null;
function openDetail(id) {
  const raw = store.laeufe[id]; if (!raw) return; detailId = id;
  const r = runs().find((x) => x.id === id);
  $('#s-detail-t').textContent = dLong(r.datum);
  const b = $('#detail-b');
  const cells = [['Distanz', r.km != null ? de(r.km, 2) : null, 'km'], ['Dauer', r.dauer_s ? dur(r.dauer_s) : null, ''], ['Pace', r.pace_s ? pace(r.pace_s) : null, '/km'], ['Ø Puls', r.hf ? String(r.hf) : null, 'bpm'], ['Max. Puls', r.hf_max ? String(r.hf_max) : null, 'bpm'], ['Höhenmeter', r.hm != null ? String(r.hm) : null, 'm'], ['RPE', r.rpe ? String(r.rpe) : null, ''], ['Schläge/km', r.hf && r.pace_s ? String(Math.round(r.hf * r.pace_s / 60)) : null, '']].filter((c) => c[1]);
  b.replaceChildren(...[
    h('div', { class: 'fs' }, h('div', { style: 'display:flex;align-items:center;gap:10px;flex-wrap:wrap' }, typDot(r.typ), h('b', { style: 'font-size:18px', text: runTitle(r) }), r.strecke ? tag(r.strecke, 'dusk') : null),
      r.kern ? h('p', { style: 'font-size:17px' }, h('b', { text: r.kern }), r.kern_pace_s ? ', Ø ' + pace(r.kern_pace_s) + ' /km' : '') : null,
      h('dl', { class: 'kv k3' }, cells.map(([k, v, u]) => h('div', null, h('dt', { text: k }), h('dd', null, v, u ? h('small', { text: u }) : null))))),
    (r.ferse != null || r.energie || r.schlaf || r.magen) ? h('div', { class: 'fs' }, h('span', { class: 'lab', text: 'Körper' }), h('div', { style: 'display:flex;gap:8px;flex-wrap:wrap' }, r.ferse != null ? tag('Ferse ' + FERSE[r.ferse], FTAG[r.ferse]) : null, r.energie ? tag('Energie ' + r.energie, ETAG[r.energie]) : null, r.schlaf ? tag('Schlaf ' + r.schlaf, r.schlaf === 'gut' ? 'ok' : r.schlaf === 'schlecht' ? 'warn' : '') : null, r.magen ? tag('Magen ' + r.magen, r.magen === 'ok' ? 'ok' : 'warn') : null)) : null,
    r.notiz ? h('div', { class: 'fs' }, h('span', { class: 'lab', text: 'Notiz' }), h('p', { style: 'color:var(--ink-2)', text: r.notiz })) : null].filter(Boolean));
  openSheet($('#s-detail'));
}
$('#d-edit').addEventListener('click', () => { const id = detailId; closeSheet($('#s-detail'), false, true); setTimeout(() => openRun(id), 30); });

// ---- Wettkampf ----
let editGoal = null;
const fg = $('#f-goal');
$('[data-chips="dist"]', fg).addEventListener('change', () => { $('#g-km-f').hidden = chipsGet('dist', fg) !== 'x'; });
function openGoal(g) {
  editGoal = g ? g.id : null;
  $('#s-goal-t').textContent = g ? 'Wettkampf bearbeiten' : 'Wettkampf hinzufügen';
  $('#g-name').value = g ? g.name : ''; $('#g-datum').value = g ? g.datum : '';
  const std = ['5', '10', '21.0975', '42.195'], d = g ? String(g.distanz_km) : '21.0975';
  chipsSet('dist', std.includes(d) ? d : 'x', fg); $('#g-km').value = std.includes(d) ? '' : de(+d, 1); $('#g-km-f').hidden = std.includes(d);
  $('#g-zeit').value = g ? dur(g.zielzeit_s) : '';
  const del = $('#g-del'); del.hidden = !g; del.dataset.armed = ''; del.lastChild.textContent = 'Löschen';
  $('#g-err').textContent = '';
  openSheet($('#s-goal'));
}
fg.addEventListener('submit', (e) => {
  e.preventDefault(); const err = $('#g-err'); err.textContent = '';
  const name = $('#g-name').value.trim(), datum = $('#g-datum').value;
  const dc = chipsGet('dist', fg), dist = dc === 'x' ? num($('#g-km').value) : +dc;
  const zt = parseDur($('#g-zeit').value);
  if (!name) { err.textContent = 'Gib dem Wettkampf einen Namen.'; return; }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datum)) { err.textContent = 'Bitte ein Datum wählen.'; return; }
  if (!dist || Number.isNaN(dist) || dist <= 0) { err.textContent = 'Bitte eine Distanz wählen.'; return; }
  if (!zt || Number.isNaN(zt)) { err.textContent = 'Zielzeit bitte als h:mm:ss, z. B. 1:35:00.'; return; }
  const id = editGoal || 'z' + Date.now().toString(36);
  store.ziele[id] = { name, datum, distanz_km: dist, zielzeit_s: zt };
  if (!save()) return;
  R_.zielSel = id; closeSheet($('#s-goal')); toast('Wettkampf gespeichert'); render();
});
$('#g-del').addEventListener('click', () => {
  const b = $('#g-del');
  if (!b.dataset.armed) { b.dataset.armed = '1'; b.lastChild.textContent = 'Wirklich löschen?'; return; }
  delete store.ziele[editGoal]; R_.zielSel = null; save(); closeSheet($('#s-goal')); toast('Wettkampf gelöscht'); render();
});

// ---- Plan ----
let planWeek = null;
const growTa = (el) => { el.style.height = 'auto'; el.style.height = Math.max(64, el.scrollHeight + 3) + 'px'; };
function openPlan(mo) { planWeek = mo; fillPlan(); openSheet($('#s-plan')); requestAnimationFrame(() => $$('.pdtl').forEach(growTa)); }
function fillPlan() {
  const cur = monday(todayIso()), off = Math.round((+parse(planWeek) - +parse(cur)) / (7 * DAY));
  const sw = (d) => { planWeek = addDays(planWeek, d); fillPlan(); requestAnimationFrame(() => $$('.pdtl').forEach(growTa)); };
  $('#p-week').replaceChildren(weekNav(off, planWeek, () => sw(-7), () => sw(7), off > -52, off < WK_MAX, null));
  const p = planFor(planWeek), dt = planDetails(planWeek);
  $('#p-days').replaceChildren(...TAGE.map((k, i) => {
    const ta = h('textarea', { id: 'pd-' + k, class: 'pdtl', maxlength: '1500', rows: '2', placeholder: 'Details, z. B. Einlaufen, Tempo, Pace, Auslaufen', 'aria-label': 'Details ' + WTAG[(i + 1) % 7] });
    ta.value = dt[k] || ''; ta.addEventListener('input', () => growTa(ta));
    return h('div', { class: 'f pday' }, h('label', { for: 'p-' + k, text: WTAG[(i + 1) % 7] + ', ' + dShort(addDays(planWeek, i)) }), h('input', { id: 'p-' + k, type: 'text', maxlength: '80', value: p[k] || '', placeholder: i === 0 ? 'z. B. Ruhetag' : '' }), ta);
  }));
}
$('#f-plan').addEventListener('submit', (e) => {
  e.preventDefault();
  const tage = {}, details = {};
  TAGE.forEach((k) => { const v = $('#p-' + k).value.trim(); if (v) tage[k] = v; const d = $('#pd-' + k).value.trim(); if (d) details[k] = d; });
  if (Object.keys(tage).length || Object.keys(details).length) store.plan[planWeek] = Object.keys(details).length ? { tage, details } : { tage }; else delete store.plan[planWeek];
  if (!save()) return;
  closeSheet($('#s-plan')); toast('Plan gespeichert'); render();
});

// ---- Daten ----
function openData() {
  const n = Object.keys(store.laeufe).length, z = Object.keys(store.ziele).length;
  $('#m-info').textContent = 'Auf diesem Gerät: ' + plural(n, 'Lauf', 'Läufe') + ', ' + plural(z, 'Wettkampf', 'Wettkämpfe') + ', ' + plural(Object.keys(store.plan).length, 'Wochenplan', 'Wochenpläne') + '. Die Daten verlassen das Gerät nur, wenn du ein Backup speicherst oder die Woche kopierst. App-Version ' + APP_VERSION + '.';
  const w = $('#m-wipe'); w.dataset.armed = ''; $('#m-wipe-t').textContent = 'Alle Daten löschen'; $('#m-wipe-s').textContent = 'Läufe, Wettkämpfe und Pläne auf diesem Gerät';
  openSheet($('#s-data'));
}
$('#m-import').addEventListener('click', () => { closeSheet($('#s-data'), false, true); setTimeout(() => openImport(''), 30); });
$('#m-week').addEventListener('click', async () => {
  const txt = weekSummary();
  try { await navigator.clipboard.writeText(txt); toast('Woche kopiert. Jetzt im Chat einfügen.'); }
  catch (e) { closeSheet($('#s-data'), false, true); setTimeout(() => { openImport(''); $('#s-import-t').textContent = 'Woche an Claude'; $('#i-code').value = txt; $('#i-err').textContent = 'Kopieren wurde blockiert. Markiere den Text und kopiere ihn von Hand.'; $('#i-apply').hidden = true; $('#i-paste').hidden = true; }, 30); }
});
$('#m-backup').addEventListener('click', () => {
  const data = { app: 'laufcockpit', version: 1, exportiert: new Date().toISOString(), laeufe: store.laeufe, ziele: store.ziele, plan: store.plan };
  const blob = new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' });
  const a = h('a', { href: URL.createObjectURL(blob), download: 'laufcockpit-backup-' + todayIso() + '.json' });
  document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  toast('Backup gespeichert');
});
$('#m-restore').addEventListener('click', () => $('#m-file').click());
$('#m-file').addEventListener('change', async (e) => {
  const f = e.target.files && e.target.files[0]; e.target.value = '';
  if (!f) return;
  try {
    const d = JSON.parse(await f.text());
    if (!d || typeof d !== 'object' || !d.laeufe) throw new Error('kein Lauf-Cockpit-Backup');
    const payload = { laeufe: Array.isArray(d.laeufe) ? d.laeufe : Object.entries(d.laeufe).map(([id, r]) => ({ ...r, id })), ziele: d.ziele ? (Array.isArray(d.ziele) ? d.ziele : Object.entries(d.ziele).map(([id, z]) => ({ ...z, id }))) : [], plan: d.plan || {} };
    closeSheet($('#s-data'), false, true);
    setTimeout(() => { openImport(''); $('#s-import-t').textContent = 'Backup laden'; showPreview(payload); }, 30);
  } catch (er) { toast('Die Datei ist kein gültiges Backup.'); }
});
$('#m-wipe').addEventListener('click', () => {
  const w = $('#m-wipe');
  if (!w.dataset.armed) { w.dataset.armed = '1'; $('#m-wipe-t').textContent = 'Wirklich alles löschen?'; $('#m-wipe-s').textContent = 'Noch einmal tippen. Speichere vorher ein Backup, wenn du die Daten behalten willst.'; return; }
  store.laeufe = {}; store.ziele = {}; store.plan = {}; save(); closeSheet($('#s-data')); toast('Alle Daten gelöscht'); render();
});

function weekSummary() {
  const R = runs(), t = todayIso(), mo = monday(t), prev = addDays(mo, -7);
  const line = (r) => {
    const bits = [runTitle(r)];
    const m = [r.km ? de(r.km, 2) + ' km' : null, r.dauer_s ? dur(r.dauer_s) : null, r.pace_s ? pace(r.pace_s) + ' /km' : null, r.hf ? 'Ø ' + r.hf + (r.hf_max ? ' / max ' + r.hf_max : '') + ' bpm' : null, r.hm != null ? r.hm + ' Hm' : null].filter(Boolean).join(', ');
    const k = [r.kern ? 'Kern: ' + r.kern + (r.kern_pace_s ? ' (Ø ' + pace(r.kern_pace_s) + ')' : '') : null, r.rpe ? 'RPE ' + r.rpe : null, r.ferse != null ? 'Ferse ' + FERSE[r.ferse] : null, r.energie ? 'Energie ' + r.energie : null, r.schlaf ? 'Schlaf ' + r.schlaf : null, r.magen ? 'Magen ' + r.magen : null].filter(Boolean).join(', ');
    return '- ' + TAGN[(parse(r.datum).getUTCDay() + 6) % 7] + ' ' + dShort(r.datum) + ': ' + bits.join('') + (m ? ': ' + m : '') + (k ? '. ' + k : '') + (r.notiz ? '. Notiz: ' + r.notiz : '');
  };
  const block = (start, label) => {
    const wk = R.filter((r) => monday(r.datum) === start), km = wk.reduce((a, r) => a + (r.km || 0), 0);
    const p = planFor(start);
    return [label + ' (' + dShort(start) + ' bis ' + dShort(addDays(start, 6)) + '): ' + de(km, 1) + ' km in ' + wordRuns(wk.length),
      Object.keys(p).length ? 'Plan: ' + TAGE.filter((k) => p[k]).map((k) => TAGN[TAGE.indexOf(k)] + ' ' + p[k]).join(' | ') : null,
      ...wk.map(line)].filter(Boolean).join('\n');
  };
  const st = streak(R), g = nextGoal(), pr = g ? predict(R, g.distanz_km) : null;
  return ['Lauf-Cockpit, Stand ' + dFull(t), '', block(mo, 'Diese Woche'), '', block(prev, 'Vorwoche'), '',
    'Ferse: ' + plural(st.n, 'Lauf', 'Läufe') + ' in Folge ohne deutliches Signal',
    g ? 'Ziel: ' + g.name + ' am ' + dFull(g.datum) + ', Zielzeit ' + dur(g.zielzeit_s) + (pr ? ', Schätzung heute ' + dur(pr.t) : '') : null].filter((x) => x != null).join('\n');
}

// ---- Import-Code ----
let pending = null;
function b64urlDecode(str) { str = str.replace(/-/g, '+').replace(/_/g, '/'); while (str.length % 4) str += '='; const bin = atob(str); const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0)); return new TextDecoder().decode(bytes); }
function decodeCode(raw) {
  const m = String(raw || '').replace(/\s+/g, '').match(/LC1\.([A-Za-z0-9_\-+/=]+)/);
  if (!m) throw new Error('Kein Import-Code gefunden. Er beginnt mit „LC1.“.');
  let d; try { d = JSON.parse(b64urlDecode(m[1])); } catch (e) { throw new Error('Der Code ist unvollständig. Kopiere ihn noch einmal komplett aus dem Chat.'); }
  return d;
}
const TYPOK = ['Locker', 'Long', 'Qualität', 'Wettkampf'];
function cleanRun(r) {
  if (!r || !/^\d{4}-\d{2}-\d{2}$/.test(r.datum) || !TYPOK.includes(r.typ)) return null;
  const o = { datum: r.datum, typ: r.typ, ort: r.ort === 'Band' ? 'Band' : 'draußen' };
  ['km', 'dauer_s', 'hf', 'hf_max', 'hm', 'rpe', 'kern_pace_s', 'ferse'].forEach((k) => { if (r[k] != null && isFinite(+r[k])) o[k] = +r[k]; });
  ['intensitaet', 'kern', 'energie', 'schlaf', 'magen', 'strecke', 'notiz', 'geaendert'].forEach((k) => { if (typeof r[k] === 'string' && r[k].trim()) o[k] = r[k].trim().slice(0, 500); });
  if (o.ferse != null && ![0, 1, 2, 3].includes(o.ferse)) delete o.ferse;
  return o;
}
function openImport(code) {
  $('#s-import-t').textContent = 'Von Claude einfügen';
  $('#i-code').value = code || ''; $('#i-err').textContent = ''; $('#i-prev').hidden = true; $('#i-apply').disabled = true; $('#i-apply').hidden = false; $('#i-paste').hidden = !(navigator.clipboard && navigator.clipboard.readText);
  pending = null;
  openSheet($('#s-import'));
  if (code) tryCode();
}
function tryCode() {
  const err = $('#i-err'); err.textContent = ''; $('#i-prev').hidden = true; $('#i-apply').disabled = true; pending = null;
  const raw = $('#i-code').value.trim(); if (!raw) return;
  try { showPreview(decodeCode(raw)); } catch (e) { err.textContent = e.message; }
}
function showPreview(d) {
  const L = (d.laeufe || []).map((r) => ({ id: r.id, r: cleanRun(r) })).filter((x) => x.r);
  const Z = (d.ziele || []).filter((z) => z && z.name && /^\d{4}-\d{2}-\d{2}$/.test(z.datum) && +z.distanz_km > 0 && +z.zielzeit_s > 0);
  const P = d.plan && typeof d.plan === 'object' ? Object.entries(d.plan).filter(([k, v]) => /^\d{4}-\d{2}-\d{2}$/.test(k) && v && v.tage) : [];
  if (!L.length && !Z.length && !P.length) { $('#i-err').textContent = 'Der Code enthält keine Daten, die sich übernehmen lassen.'; return; }
  const items = [];
  L.forEach(({ id, r }) => {
    let tid = id && /^[\w\-]+$/.test(id) ? id : r.datum;
    const exists = !!store.laeufe[tid] || (!id && Object.values(store.laeufe).some((x) => x.datum === r.datum && x.typ === r.typ));
    if (!id && exists) tid = Object.entries(store.laeufe).find(([, x]) => x.datum === r.datum && x.typ === r.typ)[0];
    items.push({ kind: 'lauf', id: tid, data: r, label: dShort(r.datum) + ', ' + (TYPN[r.typ] || r.typ) + (r.km ? ', ' + de(r.km, 2) + ' km' : ''), neu: !store.laeufe[tid] });
  });
  Z.forEach((z) => { const id = z.id && /^[\w\-]+$/.test(z.id) ? z.id : 'z' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); items.push({ kind: 'ziel', id, data: { name: String(z.name).slice(0, 80), datum: z.datum, distanz_km: +z.distanz_km, zielzeit_s: +z.zielzeit_s }, label: 'Wettkampf: ' + z.name, neu: !store.ziele[id] }); });
  P.forEach(([k, v]) => {
    const tage = {}, details = {};
    TAGE.forEach((d2) => { if (typeof v.tage[d2] === 'string' && v.tage[d2].trim()) tage[d2] = v.tage[d2].trim().slice(0, 80); if (v.details && typeof v.details[d2] === 'string' && v.details[d2].trim()) details[d2] = v.details[d2].trim().slice(0, 1500); });
    const nd = Object.keys(details).length;
    items.push({ kind: 'plan', id: monday(k), data: nd ? { tage, details } : { tage }, label: 'Wochenplan ab ' + dShort(monday(k)) + (nd ? ' mit Details' : ''), neu: !store.plan[monday(k)] });
  });
  pending = items;
  const shown = items.slice(0, 40);
  $('#i-list').replaceChildren(...[...shown.map((it) => h('li', null, h('span', { text: it.label }), tag(it.neu ? 'neu' : 'ersetzt', it.neu ? 'ok' : 'warn'))), items.length > shown.length ? h('li', null, h('span', { text: 'und ' + (items.length - shown.length) + ' weitere' })) : null].filter(Boolean));
  $('#i-prev').hidden = false; $('#i-apply').disabled = false;
  $('#i-apply').textContent = items.length === 1 ? 'Übernehmen' : plural(items.length, 'Eintrag', 'Einträge') + ' übernehmen';
}
$('#i-code').addEventListener('input', () => { clearTimeout(tryCode.t); tryCode.t = setTimeout(tryCode, 250); });
$('#i-paste').addEventListener('click', async () => { try { $('#i-code').value = await navigator.clipboard.readText(); tryCode(); } catch (e) { $('#i-err').textContent = 'Kein Zugriff auf die Zwischenablage. Füge den Code von Hand ins Feld ein.'; } });
$('#i-apply').addEventListener('click', () => {
  if (!pending) return;
  pending.forEach((it) => { if (it.kind === 'lauf') store.laeufe[it.id] = it.data; else if (it.kind === 'ziel') store.ziele[it.id] = it.data; else store.plan[it.id] = it.data; });
  if (!save()) return;
  const n = pending.length; pending = null;
  closeSheet($('#s-import')); toast(plural(n, 'Eintrag', 'Einträge') + ' übernommen'); render();
});

// ============ Start ============
load();
const hash = location.hash.slice(1);
if (hash.startsWith('import=')) {
  const code = decodeURIComponent(hash.slice(7));
  history.replaceState(null, '', '#heute');
  go('heute');
  setTimeout(() => openImport(code), 60);
} else go(hash || 'heute');
window.addEventListener('hashchange', () => { const v = location.hash.slice(1); if (v.startsWith('import=')) { const code = decodeURIComponent(v.slice(7)); history.replaceState(null, '', '#' + R_.view); openImport(code); } else if (VIEWS.includes(v) && v !== R_.view) go(v); });

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then((reg) => {
      reg.update().catch(() => {});
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}); });
    }).catch(() => {});
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (reloaded || openSheetEl) return; reloaded = true; location.reload(); });
  });
}
window.__lc = { store, runs, save, render, weekSummary };
})();
