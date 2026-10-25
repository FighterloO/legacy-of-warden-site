/* Legacy of Warden promo page. Data in data/*.json comes from tools/build-data.cjs (the game's own code). */
'use strict';

// Links in the footer. Fill in the Play Store and other URLs when they exist; empty ones are hidden.
const LINKS = [
  { label: 'Google Play', url: '' },
  { label: 'YouTube trailer', url: 'https://youtu.be/UXdxQr5TOxw' },
  { label: 'Contact', url: '' },
];

const SHOTS = [
  ['01-expedition-board', 'Explore the Planes', 'Roll the dice, walk the board, loot what you find.'],
  ['02-moonhaven', 'Moonhaven', 'The city hub, lit by the last lantern.'],
  ['03-ritual', 'Build your Ritual', 'Slot spells and runes before the Guardian wakes.'],
  ['04-combo', 'Chain the Combo', 'Ailments stack, hits chain, numbers climb.'],
  ['05-forbidden-art-sunfall', 'Forbidden Art: Sunfall', 'A pillar of sunlight, a rain of meteors, a falling sun.'],
  ['06-realm', 'The Endless Realm', 'An island under fog, full of lairs, towns and rivals.'],
  ['07-realm-map', 'Map of the Realm', 'One island, many regions, thirty bosses.'],
  ['08-ritual-duel', 'Ritual Duel', 'Your own spells, played as cards against rival Wardens.'],
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

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- Immersive backdrop: each section names its art in data-bg; the fixed layer crossfades as it comes into view ----------
const bdLayers = [$('#bd-a'), $('#bd-b')];
let bdFront = 0, bdUrl = null;
function setBackdrop(url) {
  if (url === bdUrl) return;
  bdUrl = url;
  const next = bdLayers[1 - bdFront];
  const show = () => {
    next.style.backgroundImage = url ? `url("${url}")` : 'none';
    next.classList.add('on');
    bdLayers[bdFront].classList.remove('on');
    bdFront = 1 - bdFront;
  };
  if (!url) return show();
  const img = new Image();
  img.onload = () => { if (bdUrl === url) show(); };
  img.src = url;
}
const bgSections = [...document.querySelectorAll('[data-bg]')];
const bgObserver = new IntersectionObserver(entries => {
  for (const e of entries) if (e.isIntersecting) {
    setBackdrop(e.target.dataset.bg || null);
    document.body.classList.toggle('tint-blood', e.target.dataset.tint === 'blood');
  }
}, { rootMargin: '-45% 0px -45% 0px' });
bgSections.forEach(s => bgObserver.observe(s));

// The nav link of the section in the middle of the screen is lit.
const navLinks = [...document.querySelectorAll('.nav-links a')];
const spy = new IntersectionObserver(entries => {
  for (const e of entries) if (e.isIntersecting)
    navLinks.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id));
}, { rootMargin: '-45% 0px -45% 0px' });
navLinks.forEach(a => { const s = document.querySelector(a.getAttribute('href')); if (s) spy.observe(s); });

// The hero video only plays while the hero is on screen.
const heroVideo = document.querySelector('.hero-bg');
if (heroVideo) new IntersectionObserver(([e]) => { if (e.isIntersecting) heroVideo.play().catch(() => {}); else heroVideo.pause(); }).observe(heroVideo);

// ---- Scroll reveal ----------------------------------------------------------------------------------------------------------
const revealObserver = new IntersectionObserver(entries => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); revealObserver.unobserve(e.target); }
}, { rootMargin: '0px 0px -8% 0px' });
const watchReveal = root => root.querySelectorAll('.reveal:not(.in)').forEach(el => reduced ? el.classList.add('in') : revealObserver.observe(el));
watchReveal(document);

// ---- Embers: a few warm motes drifting up over the backdrop (paused when the tab is hidden) -----------------------------------
(function embers() {
  const cv = $('#embers'), cx = cv.getContext('2d');
  if (reduced || !cx) return;
  // Kept cheap on purpose: 1x resolution, at most 36 motes, about 30 frames a second.
  let w, h, dpr, motes = [], lastDraw = 0;
  const count = () => Math.round(Math.min(36, (innerWidth * innerHeight) / 40000));
  const spawn = (y) => ({ x: Math.random() * w, y: y ?? h + 10, r: .6 + Math.random() * 1.8, vy: .15 + Math.random() * .45, vx: (Math.random() - .5) * .2, a: .25 + Math.random() * .55, p: Math.random() * 6.28, hue: 28 + Math.random() * 20 });
  function size() {
    dpr = 1;
    w = innerWidth; h = innerHeight;
    cv.width = w * dpr; cv.height = h * dpr;
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    motes = Array.from({ length: count() }, () => spawn(Math.random() * h));
  }
  function frame(t) {
    if (document.hidden) return;
    requestAnimationFrame(frame);
    if (t - lastDraw < 32) return;
    lastDraw = t;
    cx.clearRect(0, 0, w, h);
    const blood = document.body.classList.contains('tint-blood');
    for (const m of motes) {
      m.y -= m.vy; m.x += m.vx + Math.sin(t / 1400 + m.p) * .15;
      if (m.y < -10) Object.assign(m, spawn());
      const a = m.a * (.6 + .4 * Math.sin(t / 500 + m.p));
      cx.fillStyle = `hsla(${blood ? 355 : m.hue},100%,${blood ? 55 : 65}%,${a})`;
      cx.fillRect(m.x, m.y, m.r * 1.6, m.r * 1.6);
    }
  }
  size();
  addEventListener('resize', size);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) requestAnimationFrame(frame); });
  requestAnimationFrame(frame);
})();

// ---- Screenshot showcase: big slide with caption, thumbnails, swipe, auto-advance -------------------------------------------------
(function showcase() {
  const stage = $('#show-stage'), thumbs = $('#show-thumbs');
  stage.innerHTML = SHOTS.map(([f, t, d], i) =>
    `<div class="show-slide${i ? '' : ' on'}"><img src="img/shots/${f}.webp" alt="${esc(t)}" ${i ? 'loading="lazy"' : ''} width="1280" height="720"><div class="show-cap"><b>${esc(t)}</b><span>${esc(d)}</span></div></div>`).join('');
  thumbs.innerHTML = SHOTS.map(([f, t], i) =>
    `<button type="button" data-i="${i}" aria-label="${esc(t)}" aria-current="${i === 0}"><img src="img/shots/${f}.webp" alt="" loading="lazy"></button>`).join('');
  const slides = [...stage.children], tb = [...thumbs.children];
  let cur = 0, timer = null;
  function go(i) {
    cur = (i + SHOTS.length) % SHOTS.length;
    slides.forEach((s, k) => s.classList.toggle('on', k === cur));
    tb.forEach((b, k) => b.setAttribute('aria-current', k === cur));
    tb[cur].scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
  }
  const auto = () => { clearInterval(timer); if (!reduced) timer = setInterval(() => go(cur + 1), 5000); };
  thumbs.addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (b) { go(+b.dataset.i); auto(); } });
  $('#show').addEventListener('click', e => { const b = e.target.closest('[data-step]'); if (b) { go(cur + +b.dataset.step); auto(); } });
  let x0 = null, moved = false;
  stage.addEventListener('pointerdown', e => { x0 = e.clientX; moved = false; });
  stage.addEventListener('pointerup', e => {
    if (x0 === null) return;
    const dx = e.clientX - x0; x0 = null;
    if (Math.abs(dx) > 40) { moved = true; go(cur + (dx < 0 ? 1 : -1)); auto(); }
  });
  stage.addEventListener('click', () => {
    if (moved) return;
    const [f, t, d] = SHOTS[cur];
    openSheet(`<img src="img/shots/${f}.webp" alt="${esc(t)}"><p style="padding:10px 14px"><b style="color:var(--gold-hi);font-family:var(--serif)">${esc(t)}</b> <span style="color:var(--mute)">${esc(d)}</span></p>`, true);
  });
  // Only advance while the showcase is on screen.
  new IntersectionObserver(([e]) => e.isIntersecting ? auto() : clearInterval(timer)).observe(stage);
})();
document.documentElement.classList.remove('no-js');
$('#planes-list').innerHTML = PLANES.map((n, i) =>
  `<li><img src="img/art/plane-wide-${i + 1}.webp" alt="" loading="lazy"><span><small>Plane ${i + 1}</small>${esc(n)}</span></li>`).join('');
$('#links').innerHTML = LINKS.filter(l => l.url).map(l => `<a href="${esc(l.url)}" rel="noopener">${esc(l.label)}</a>`).join('') ||
  '<span class="fine" style="margin:0">Store page coming soon.</span>';

// The trailer and job overview videos live on YouTube. Only the local poster shows until the viewer presses play; then the privacy-enhanced
// player (youtube-nocookie) is loaded in its place, so the page makes no YouTube request before that.
document.querySelectorAll('button.yt').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('video').forEach(v => v.pause());
  const f = document.createElement('iframe');
  f.src = `https://www.youtube-nocookie.com/embed/${b.dataset.yt}?autoplay=1&rel=0&playsinline=1&modestbranding=1`;
  f.title = b.getAttribute('aria-label');
  f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
  f.allowFullscreen = true;
  f.className = 'yt-frame';
  b.replaceWith(f);
}));


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
    // The backdrop shows this job's sanctum while the Jobs section is on screen.
    const sec = $('#jobs');
    sec.dataset.bg = 'img/bg/job-' + j.id + '.webp';
    if (bdUrl && bdUrl.includes('/job-')) setBackdrop(sec.dataset.bg);
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
    card: (s, i) => `<button type="button" class="card" data-i="${i}" data-frame="${s.kind === 'Signature' ? 'spike' : s.kind === 'Skill' ? 'notch' : 'silver'}" style="--c:${elColor(s.element)}">
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
    card: (it, i) => `<button type="button" class="card" data-i="${i}" data-frame="${it.rarity >= 5 ? 'spike' : it.rarity >= 3 ? 'notch' : 'silver'}" style="--c:${TIER_COLOR[it.rarity]}">
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
