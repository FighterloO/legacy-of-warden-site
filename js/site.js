/* Legacy of Warden promo page. Data in data/*.json comes from tools/build-data.cjs (the game's own code). */
'use strict';

// Links in the footer. Fill in the Play Store and other URLs when they exist; empty ones are hidden.
const LINKS = [
  { label: 'Google Play', url: '' },
  { label: 'YouTube trailer', url: '' },
  { label: 'Contact', url: '' },
];

const SHOTS = [
  ['01-expedition-board', 'Expedition board'],
  ['02-moonhaven', 'Moonhaven'],
  ['03-ritual', 'Building the ritual'],
  ['04-combo', 'A Guardian fight'],
  ['05-forbidden-art-sunfall', 'Forbidden Art: Sunfall'],
  ['06-realm', 'The Endless Realm'],
  ['07-realm-map', 'Map of the Realm'],
  ['08-ritual-duel', 'Ritual Duel'],
];
const PLANES = ['The Verdant Reach', 'Sands of the Eclipse', 'The Astral Glacier', 'Emberfall Dominion', 'Crown of the Void', 'The Scarlet Rift'];
const EL = { fire: 'Fire', ice: 'Ice', lightning: 'Lightning', chaos: 'Chaos', physical: 'Physical', ward: 'Ward' };
const TIER_COLOR = ['#b8c4cc', '#82d997', '#c19aff', '#ffa64d', '#e86ad6', '#ff6a3d'];
const PAGE = 24;

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const elColor = el => el ? `var(--${el})` : 'var(--gold)';
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : '';

// ---- Detail sheet ------------------------------------------------------------------------------------------------------
const sheet = $('#sheet'), sheetBody = $('#sheet-body');
function openSheet(html, wide) {
  sheetBody.innerHTML = html;
  sheet.classList.toggle('sheet-wide', !!wide);
  sheet.showModal();
  sheetBody.scrollTop = 0;
}
sheet.addEventListener('click', e => { if (e.target === sheet || e.target.closest('[data-close]')) sheet.close(); });

// ---- Static parts ---------------------------------------------------------------------------------------------------------
$('#gallery-grid').innerHTML = SHOTS.map(([f, t], i) =>
  `<button type="button" data-shot="${i}" aria-label="${esc(t)}"><img src="img/shots/${f}.webp" alt="${esc(t)}" loading="lazy" width="1280" height="720"></button>`).join('');
$('#gallery-grid').addEventListener('click', e => {
  const b = e.target.closest('[data-shot]');
  if (!b) return;
  const [f, t] = SHOTS[+b.dataset.shot];
  openSheet(`<img src="img/shots/${f}.webp" alt="${esc(t)}"><p style="padding:10px 14px;color:var(--mute)">${esc(t)}</p>`, true);
});
$('#planes-list').innerHTML = PLANES.map((n, i) =>
  `<li><img src="img/art/plane-wide-${i + 1}.webp" alt="" loading="lazy"><span><small>Plane ${i + 1}</small>${esc(n)}</span></li>`).join('');
$('#links').innerHTML = LINKS.filter(l => l.url).map(l => `<a href="${esc(l.url)}" rel="noopener">${esc(l.label)}</a>`).join('') ||
  '<span class="fine" style="margin:0">Store page coming soon.</span>';

// Only one video plays at a time.
document.querySelectorAll('video').forEach(v => v.addEventListener('play', () =>
  document.querySelectorAll('video').forEach(o => { if (o !== v) o.pause(); })));

// ---- Chips --------------------------------------------------------------------------------------------------------------
function chips(root, options, onChange) {
  root.innerHTML = options.map((o, i) =>
    `<button type="button" class="chip" data-v="${esc(o.v)}" aria-pressed="${i === 0}">${o.c ? `<i style="--c:${o.c}"></i>` : ''}${esc(o.t)}</button>`).join('');
  root.addEventListener('click', e => {
    const b = e.target.closest('.chip');
    if (!b) return;
    root.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', c === b));
    onChange(b.dataset.v);
  });
}

// A filtered, paged card grid.
function cardGrid({ grid, count, noun, list, match, card, detail }) {
  let shown = PAGE, items = list;
  function render() {
    items = list.filter(match);
    count.textContent = `${items.length} ${noun}${items.length === 1 ? '' : 's'}`;
    grid.innerHTML = items.slice(0, shown).map((x, i) => card(x, i)).join('') +
      (items.length > shown ? `<button type="button" class="btn more" data-more>Show more (${items.length - shown})</button>` : '');
  }
  grid.addEventListener('click', e => {
    if (e.target.closest('[data-more]')) { shown += PAGE * 2; render(); return; }
    const c = e.target.closest('[data-i]');
    if (c) openSheet(detail(items[+c.dataset.i]));
  });
  return { render, reset() { shown = PAGE; render(); } };
}

// ---- Data -----------------------------------------------------------------------------------------------------------------
const load = f => fetch('data/' + f).then(r => r.json());
Promise.all(['skills.json', 'items.json', 'sets.json', 'jobs.json', 'stats.json'].map(load)).then(([skills, items, sets, jobs, stats]) => {
  heroStats(stats);
  jobsSection(jobs);
  skillsSection(skills, jobs);
  itemsSection(items, sets, jobs);
}).catch(err => {
  console.error(err);
  for (const id of ['#skill-count', '#item-count']) $(id).textContent = 'Data could not load. Open the page through a web server (see README).';
});

function heroStats(s) {
  const rows = [[s.skills + s.signatures, 'Skills'], [s.rites, 'Rites'], [s.items, 'Items'], [s.jobs, 'Jobs']];
  $('#hero-stats').innerHTML = rows.map(([n, t]) => `<li><b>${n}</b><span>${t}</span></li>`).join('');
}

// ---- Jobs -----------------------------------------------------------------------------------------------------------------
function jobsSection(jobs) {
  const tabs = $('#job-tabs'), panel = $('#job-panel');
  tabs.innerHTML = jobs.map((j, i) =>
    `<button type="button" class="tab" role="tab" data-j="${i}" aria-selected="${i === 0}"><img src="${j.icon}" alt="">${esc(j.name)}</button>`).join('');
  const node = (n, cls = '') => n ? `<div class="node ${cls}"><img src="${n.img}" alt="" loading="lazy"><div><b>${esc(n.name)}</b><span>${esc(n.text)}</span></div></div>` : '';
  function show(i) {
    const j = jobs[i];
    tabs.querySelectorAll('.tab').forEach((t, k) => t.setAttribute('aria-selected', k === i));
    panel.style.setProperty('--jc', j.color);
    panel.innerHTML = `
      <div class="job-portrait"><img src="${j.portrait}" alt="${esc(j.name)}" loading="lazy"></div>
      <div>
        <h3>${esc(j.name)}</h3>
        <p class="job-gauge">Gauge: ${esc(j.gauge)}</p>
        <p class="job-about">${esc(j.about)}</p>
        <p class="job-lore">${esc(j.lore)}</p>
        <div class="job-block"><h4>Signature skill</h4><div class="nodes">${node(j.signature, 'node-sig')}</div></div>
        <div class="job-block"><h4>Capstones</h4><div class="nodes">${j.capstones.map(n => node(n)).join('')}</div></div>
        ${j.art ? `<div class="job-block"><h4>Forbidden Art</h4><div class="art-card" style="--ac:${j.art.color}"><b>${esc(j.art.name)}</b><p>${esc(j.art.text)}</p><i>${esc(j.art.lore)}</i></div></div>` : ''}
      </div>`;
  }
  tabs.addEventListener('click', e => { const t = e.target.closest('[data-j]'); if (t) show(+t.dataset.j); });
  show(0);
}

// ---- Skills ---------------------------------------------------------------------------------------------------------------
function skillsSection(skills, jobs) {
  const jobName = id => (jobs.find(j => j.id === id) || {}).name || cap(id);
  const f = { q: '', el: 'all', kind: 'all' };
  const els = ['fire', 'ice', 'lightning', 'chaos', 'physical', 'ward'];
  const g = cardGrid({
    grid: $('#skill-grid'), count: $('#skill-count'), noun: 'skill', list: skills,
    match: s => (f.el === 'all' || s.element === f.el) && (f.kind === 'all' || s.kind.startsWith(f.kind)) &&
      (!f.q || (s.name + ' ' + s.text + ' ' + s.tags.join(' ')).toLowerCase().includes(f.q)),
    card: (s, i) => `<button type="button" class="card" data-i="${i}" style="--c:${elColor(s.element)}">
      <span class="card-top"><img src="${s.img}" alt="" loading="lazy"><span><b>${esc(s.name)}</b><small>${EL[s.element] || ''} · ${s.job ? jobName(s.job) : s.kind}</small></span></span>
      <p>${esc(s.text)}</p></button>`,
    detail: s => `<div style="--c:${elColor(s.element)}">
      <div class="d-head"><img src="${s.img}" alt=""><div><h3>${esc(s.name)}</h3><small style="color:var(--c);text-transform:uppercase;letter-spacing:.08em">${EL[s.element] || ''} ${esc(s.kind)}${s.job ? ' · ' + esc(jobName(s.job)) : ''}</small></div></div>
      <p class="d-text">${esc(s.text)}</p>
      <div class="d-tags"><span>Cost ${s.cost} Charge</span>${s.hits ? `<span>${s.hits} hit${s.hits > 1 ? 's' : ''}</span>` : ''}${s.tags.map(t => `<span>${esc(t)}</span>`).join('')}</div></div>`,
  });
  chips($('#skill-el'), [{ v: 'all', t: 'All elements' }, ...els.map(e => ({ v: e, t: EL[e], c: elColor(e) }))], v => { f.el = v; g.reset(); });
  chips($('#skill-kind'), [{ v: 'all', t: 'All kinds' }, { v: 'Skill', t: 'Skills' }, { v: 'Rite', t: 'Rites' }, { v: 'Ward', t: 'Ward rites' }, { v: 'Signature', t: 'Signatures' }], v => { f.kind = v; g.reset(); });
  $('#skill-q').addEventListener('input', e => { f.q = e.target.value.trim().toLowerCase(); g.reset(); });
  g.render();
}

// ---- Items ----------------------------------------------------------------------------------------------------------------
function itemsSection(items, sets, jobs) {
  const jobName = id => (jobs.find(j => j.id === id) || {}).name || cap(id);
  const f = { q: '', slot: 'all', tier: 'all' };
  // Strongest first inside each tier looks best in a showcase: Mythical, Set, Legendary, Epic, Regular, Apprentice.
  const order = [...items].sort((a, b) => b.rarity - a.rarity);
  const setBox = it => {
    const s = it.set && sets[it.set];
    if (!s) return '';
    const head = s.kind === 'mythic' ? `${esc(s.name)} <span style="color:var(--mute)">· Mythic set for the ${esc(jobName(s.job))}</span>` : esc(s.name);
    return `<div class="d-set"><b>${head}</b>${s.two ? `<p>2 pieces: ${esc(s.two)}</p>` : ''}${s.three ? `<p>3 pieces: ${esc(s.three)}</p>` : ''}${s.awakened ? `<p>Awakened: ${esc(s.awakened)}</p>` : ''}</div>`;
  };
  const g = cardGrid({
    grid: $('#item-grid'), count: $('#item-count'), noun: 'item', list: order,
    match: it => (f.slot === 'all' || it.slot === f.slot) && (f.tier === 'all' || it.rarity === +f.tier) &&
      (!f.q || (it.name + ' ' + it.stats.join(' ') + ' ' + (it.unique ? it.unique.text : '') + ' ' + (it.set ? (sets[it.set] || {}).name : '')).toLowerCase().includes(f.q)),
    card: (it, i) => `<button type="button" class="card" data-i="${i}" style="--c:${TIER_COLOR[it.rarity]}">
      <span class="card-top"><img src="${it.img}" alt="" loading="lazy"><span><b>${esc(it.name)}</b><small>${esc(it.tier)} ${cap(it.slot)}</small></span></span>
      <p>${esc(it.unique ? it.unique.text : it.stats.join(' · ') || it.flavor)}</p></button>`,
    detail: it => `<div style="--c:${TIER_COLOR[it.rarity]}">
      <div class="d-head"><img src="${it.img}" alt=""><div><h3>${esc(it.name)}</h3><small style="color:var(--c);text-transform:uppercase;letter-spacing:.08em">${esc(it.tier)} ${cap(it.slot)}${it.element ? ' · ' + EL[it.element] : ''}</small></div></div>
      ${it.power ? `<div class="d-tags"><span>Power ${it.power}</span></div>` : ''}
      ${it.stats.length ? `<ul class="d-list">${it.stats.map(s => `<li>${esc(s)}</li>`).join('')}</ul>` : ''}
      ${it.unique ? `<div class="d-unique"><b>${esc(it.unique.name)}</b><p>${esc(it.unique.text)}</p></div>` : ''}
      ${setBox(it)}
      <p class="d-flavor">${esc(it.flavor)}</p></div>`,
  });
  chips($('#item-slot'), [{ v: 'all', t: 'All slots' }, { v: 'weapon', t: 'Weapons' }, { v: 'robe', t: 'Robes' }, { v: 'charm', t: 'Charms' }], v => { f.slot = v; g.reset(); });
  chips($('#item-tier'), [{ v: 'all', t: 'All tiers' }, ...[5, 4, 3, 2, 1].map(r => ({ v: r, t: ['Apprentice', 'Regular', 'Epic', 'Legendary', 'Set', 'Mythical'][r], c: TIER_COLOR[r] }))], v => { f.tier = v; g.reset(); });
  $('#item-q').addEventListener('input', e => { f.q = e.target.value.trim().toLowerCase(); g.reset(); });
  g.render();
}
