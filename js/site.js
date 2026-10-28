/* Legacy of Warden promo page. Data in data/*.json comes from tools/build-data.cjs (the game's own code). */
'use strict';

// Links in the footer. Fill in the Play Store and other URLs when they exist; empty ones are hidden.
const LINKS = [
  { label: 'Google Play', url: '' },
  { label: 'YouTube trailer', url: 'https://youtu.be/bfzNsBtPULc' },
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
const EL = { fire: 'Fire', ice: 'Ice', lightning: 'Lightning', chaos: 'Chaos', physical: 'Physical', ward: 'Ward' };
const TIER_COLOR = ['#b8c4cc', '#82d997', '#c19aff', '#ffa64d', '#e86ad6', '#ff6a3d'];
// Talent tier colours, as in the game (talents.js RARITIES).
const TALENT_COLOR = ['#82d997', '#7ebaff', '#c19aff', '#f3ce77'];
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
    `<button type="button" class="chip" data-v="${esc(o.v)}" aria-pressed="${i === 0}">${o.icon ? `<img class="chip-icon" src="${o.icon}" alt="">` : o.c ? `<i style="--c:${o.c}"></i>` : ''}${esc(o.t)}</button>`).join('');
  root.addEventListener('click', e => {
    const b = e.target.closest('.chip');
    if (!b) return;
    root.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', c === b));
    onChange(b.dataset.v);
  });
}

// A filtered, paged card grid.
// ---- Hover panel ----------------------------------------------------------------------------------------------------------
const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
const tip = document.createElement('div');
tip.className = 'tip';
tip.setAttribute('role', 'tooltip');
document.body.appendChild(tip);
let tipFor = null;
function showTip(card, html) {
  tipFor = card;
  tip.innerHTML = html;
  tip.classList.add('on');
  const r = card.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight, gap = 12;
  // Beside the card, on the side with room; kept inside the window.
  let x = r.right + gap;
  if (x + w > innerWidth - 8) x = r.left - gap - w;
  if (x < 8) x = Math.max(8, Math.min(innerWidth - w - 8, r.left));
  let y = Math.max(70, Math.min(r.top, innerHeight - h - 8));
  tip.style.transform = `translate(${Math.round(x)}px,${Math.round(y)}px)`;
}
function hideTip() { tipFor = null; tip.classList.remove('on'); }
addEventListener('scroll', hideTip, { passive: true });

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
    if (c) { hideTip(); openSheet(detail(items[+c.dataset.i])); }
  });
  // With a mouse, hovering a card shows the same detail in a floating panel; touch screens use the tap sheet.
  if (canHover) {
    grid.addEventListener('mouseover', e => {
      const c = e.target.closest('[data-i]');
      if (c && c !== tipFor) showTip(c, detail(items[+c.dataset.i]));
    });
    grid.addEventListener('mouseleave', hideTip);
  }
  return { render, reset() { shown = PAGE; render(); } };
}

// A #link (./#release from the Bloodmoon page) is lost while the splash locks the page and the grids above are still empty,
// so it is followed again once the data is in and once the splash is gone.
function jumpToHash() {
  const target = location.hash.length > 1 && document.getElementById(location.hash.slice(1));
  if (target) setTimeout(() => target.scrollIntoView({ block: 'start', behavior: 'instant' }), 50);
}

// ---- Data -----------------------------------------------------------------------------------------------------------------
// no-cache: the browser re-checks the file with the server, so new data shows right after a push.
const load = f => fetch('data/' + f, { cache: 'no-cache' }).then(r => r.json());
const dataReady = Promise.all(['skills.json', 'items.json', 'sets.json', 'jobs.json', 'stats.json', 'planes.json'].map(load));
dataReady.then(([skills, items, sets, jobs, stats, planes]) => {
  heroStats(stats);
  planesSection(planes);
  jobsSection(jobs);
  skillsSection(skills, jobs);
  itemsSection(items, sets, jobs);
  jumpToHash();
}).catch(err => {
  console.error(err);
  for (const id of ['#skill-count', '#item-count']) $(id).textContent = 'Data could not load. Open the page through a web server (see README).';
});

function heroStats(s) {
  const rows = [[s.skills + s.signatures, 'Skills'], [s.rites, 'Rites'], [s.items, 'Items'], [s.jobs, 'Jobs']];
  $('#hero-stats').innerHTML = rows.map(([n, t]) => `<li><b>${n}</b><span>${t}</span></li>`).join('');
}

// ---- Jobs -----------------------------------------------------------------------------------------------------------------
// ---- Planes: a rail of six, one open at a time with its board, numbers and effects --------------------------------------
function planesSection(planes) {
  const rail = $('#plane-rail'), view = $('#plane-view');
  // A board capture per plane (img/planes/) when it exists, else the plane's art.
  rail.innerHTML = planes.map((p, i) => `<button type="button" role="tab" class="plane-tab" data-p="${i}" aria-selected="${i === 0}" style="--pc:${p.color}">
    <img src="img/art/plane-wide-${p.id}.webp" alt="" loading="lazy"><span><small>Plane ${p.id}</small>${esc(p.name)}</span></button>`).join('');
  function show(i) {
    const p = planes[i];
    rail.querySelectorAll('.plane-tab').forEach((t, k) => t.setAttribute('aria-selected', k === i));
    view.style.setProperty('--pc', p.color);
    view.innerHTML = `
      <div class="plane-shot is-loading"><span class="shot-loader" aria-hidden="true"><i></i></span><img src="img/planes/plane-${p.id}.webp" alt="The expedition board on ${esc(p.name)}"></div>
      <div class="plane-info">
        <p class="plane-kicker">Plane ${p.id} · 25 Guardians</p>
        <h3>${esc(p.name)}</h3>
        <p class="plane-sub">${esc(p.subtitle)}</p>
        <div class="plane-stats">
          <span><b>×${p.hp}</b>Guardian HP</span><span><b>×${p.armour}</b>Armour</span><span><b>${p.resist}%</b>Resist</span><span><b>×${p.loot}</b>Loot</span>
        </div>
        <div class="plane-fx">${p.effects.map((e, k) => `<button type="button" class="plane-chip" data-k="${k}" aria-pressed="${k === 0}">${esc(e.name)}</button>`).join('')}</div>
        <p class="plane-fx-text" aria-live="polite">${esc(p.effects[0] ? p.effects[0].text : '')}</p>
      </div>`;
    // A loading bar shows until the board has loaded, then the picture fades in (no alt text flashing in the meantime).
    const shot = view.querySelector('.plane-shot'), img = shot.querySelector('img');
    const ready = () => shot.classList.remove('is-loading');
    img.addEventListener('load', ready);
    img.addEventListener('error', () => { img.src = `img/art/plane-wide-${p.id}.webp`; }, { once: true });
    if (img.complete && img.naturalWidth) ready();
    const text = view.querySelector('.plane-fx-text');
    view.querySelector('.plane-fx').addEventListener('click', e => {
      const c = e.target.closest('.plane-chip');
      if (!c) return;
      view.querySelectorAll('.plane-chip').forEach(x => x.setAttribute('aria-pressed', x === c));
      text.textContent = p.effects[+c.dataset.k].text;
    });
  }
  rail.addEventListener('click', e => { const t = e.target.closest('[data-p]'); if (t) show(+t.dataset.p); });
  show(0);
  // Fetch all six boards in the background once the section is near, so switching planes is instant.
  new IntersectionObserver((entries, obs) => {
    if (!entries[0].isIntersecting) return;
    obs.disconnect();
    planes.forEach(p => { const im = new Image(); im.src = `img/planes/plane-${p.id}.webp`; });
  }, { rootMargin: '600px 0px' }).observe(view);
}

// ---- Jobs: the game's job tree, every node clickable ---------------------------------------------------------------------
// Node positions copy the Training Camp tree: core and Signature on the left, road A on top (3, 5, 7), road B at the
// bottom (4, 6, 8), the shared nodes 9 and 10 in the middle, and the Forbidden Art at the end.
const TREE_POS = { 1: [7, 50], 2: [21, 50], 3: [35, 15], 5: [51, 15], 7: [67, 15], 4: [35, 85], 6: [51, 85], 8: [67, 85], 9: [49, 50], 10: [63, 50], art: [87, 50] };
function jobsSection(jobs) {
  const tabs = $('#job-tabs'), panel = $('#job-panel');
  tabs.innerHTML = jobs.map((j, i) =>
    `<button type="button" class="tab" role="tab" data-j="${i}" aria-selected="${i === 0}"><img src="${j.icon}" alt="">${esc(j.name)}</button>`).join('');
  function show(i) {
    const j = jobs[i];
    tabs.querySelectorAll('.tab').forEach((t, k) => t.setAttribute('aria-selected', k === i));
    panel.style.setProperty('--jc', j.color);
    // The backdrop shows this job's sanctum while the Jobs section is on screen.
    const sec = $('#jobs');
    sec.dataset.bg = 'img/bg/job-' + j.id + '.webp';
    if (bdUrl && bdUrl.includes('/job-')) setBackdrop(sec.dataset.bg);
    const edges = [...j.edges, ...j.caps.map(c => [c, 'art'])];
    const line = ([a, b]) => { const [x1, y1] = TREE_POS[a], [x2, y2] = TREE_POS[b]; return `<line data-a="${a}" data-b="${b}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`; };
    const kind = n => n.n === 2 ? 'sig' : j.caps.includes(n.n) ? 'cap' : 'node';
    panel.innerHTML = `
      <div class="job-side">
        <div class="job-portrait"><img src="${j.portrait}" alt="${esc(j.name)}" loading="lazy"></div>
        <h3>${esc(j.name)}</h3>
        <p class="job-gauge">${esc(j.gauge)} gauge</p>
        <p class="job-focus">${esc(j.focus)}</p>
      </div>
      <div class="job-main">
        <div class="tree">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${edges.map(line).join('')}</svg>
          ${j.tree.map(n => `<button type="button" class="tnode t-${kind(n)}" data-n="${n.n}" style="left:${TREE_POS[n.n][0]}%;top:${TREE_POS[n.n][1]}%" aria-label="${esc(n.name)}"><img src="${n.img}" alt=""><i>${n.n}</i></button>`).join('')}
          ${j.art ? `<button type="button" class="tnode t-art" data-n="art" style="left:${TREE_POS.art[0]}%;top:${TREE_POS.art[1]}%;--ac:${j.art.color}" aria-label="${esc(j.art.name)}"><img src="img/arts/${j.id}.svg" alt=""></button>` : ''}
        </div>
        <div class="tdetail" aria-live="polite"></div>
      </div>`;
    const detail = panel.querySelector('.tdetail');
    const roadsOf = n => n === 'art' ? Object.keys(j.roads) : Object.keys(j.roads).filter(r => j.roads[r].includes(n));
    function pick(n) {
      panel.querySelectorAll('.tnode').forEach(b => b.classList.toggle('on', b.dataset.n === String(n)));
      // Light the road(s) the node sits on; a capstone or the Forbidden Art also lights the way to the Art.
      const lit = new Set(roadsOf(n).flatMap(r => j.roads[r].map(String)));
      if (n === 'art' || j.caps.includes(n)) lit.add('art');
      panel.querySelectorAll('.tree line').forEach(l => l.classList.toggle('lit', lit.has(l.dataset.a) && lit.has(l.dataset.b)));
      if (n === 'art') {
        detail.style.setProperty('--dc', j.art.color);
        detail.innerHTML = `<p class="tkind">Forbidden Art</p><b>${esc(j.art.name)}</b><p>${esc(j.art.short)}</p>`;
      } else {
        const node = j.tree.find(x => x.n === n), k = kind(node);
        detail.style.setProperty('--dc', 'var(--jc)');
        detail.innerHTML = `<p class="tkind">${k === 'sig' ? 'Signature skill' : k === 'cap' ? 'Capstone' : 'Node ' + node.n}</p><b>${esc(node.name)}</b><p>${esc(node.text)}</p>`;
      }
    }
    panel.querySelector('.tree').addEventListener('click', e => { const b = e.target.closest('.tnode'); if (b) pick(b.dataset.n === 'art' ? 'art' : +b.dataset.n); });
    pick(2);
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
      <div class="d-tags"><span>Cost ${s.cost} Charge</span>${s.hits ? `<span>${s.hits} hit${s.hits > 1 ? 's' : ''}</span>` : ''}${s.tags.map(t => `<span>${esc(t)}</span>`).join('')}</div>
      ${s.talents.length ? `<div class="d-talents"><h4>Talents</h4><p class="d-note">Opened at skill level 4, 8, 12 and 15. Each ritual slot uses one of them, or none.</p>
        ${s.talents.map((t, i) => `<div class="d-talent" style="--t:${TALENT_COLOR[i]}"><b><span>Lv ${t.level}</span>${esc(t.name)}<em>+${t.charge} Charge</em></b><p>${esc(t.text)}</p></div>`).join('')}</div>`
        : `<p class="d-note">${s.kind === 'Signature' ? 'A Signature skill: the heart of its job, shaped by the job tree rather than talents.' : 'Rites have no talents: they shape the casts around them.'}</p>`}</div>`,
  });
  chips($('#skill-el'), [{ v: 'all', t: 'All elements' }, ...els.map(e => ({ v: e, t: EL[e], icon: `img/el/${e}.svg` }))], v => { f.el = v; g.reset(); });
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

// ---- Splash: shown once per visit, until the first screen is ready (logo, hero video frame, fonts, data) or 1.5 s ---------
(function splash() {
  const el = $('#splash'), root = document.documentElement;
  const done = () => {
    root.classList.remove('loading');
    jumpToHash();
    if (!el) return;
    el.classList.add('out');
    setTimeout(() => el.remove(), 700);
  };
  let seen = false;
  try { seen = sessionStorage.getItem('low-splash') === '1'; sessionStorage.setItem('low-splash', '1'); } catch (e) {}
  if (!el || seen) { if (el) el.remove(); root.classList.remove('loading'); jumpToHash(); return; }
  const video = document.querySelector('.hero-bg');
  const videoReady = !video || video.readyState >= 2 ? Promise.resolve()
    : new Promise(r => { video.addEventListener('loadeddata', r, { once: true }); video.addEventListener('error', r, { once: true }); });
  const logo = el.querySelector('img');
  const logoReady = logo.decode ? logo.decode().catch(() => {}) : Promise.resolve();
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  // Never longer than 1.5 s after the page started, and never shorter than 0.6 s so the logo does not just flash.
  const cap = new Promise(r => setTimeout(r, Math.max(0, 1500 - performance.now())));
  const floor = new Promise(r => setTimeout(r, Math.max(0, 600 - performance.now())));
  Promise.race([Promise.all([videoReady, logoReady, fontsReady, dataReady.catch(() => {}), floor]), cap]).then(done);
})();

// ---- Music: the game's menu theme (AlkaKrab, Ambient 1, used with permission), off until the visitor turns it on ------------
(function music() {
  const btn = $('#music'), a = $('#music-track');
  if (!btn || !a) return;
  const VOL = 0.35;
  let fade = null, on = false;
  const ramp = (to, done) => {
    clearInterval(fade);
    fade = setInterval(() => {
      const v = a.volume + (to > a.volume ? 0.03 : -0.05);
      if ((to > a.volume && v >= to) || (to <= a.volume && v <= to)) { a.volume = to; clearInterval(fade); if (done) done(); }
      else a.volume = Math.max(0, Math.min(1, v));
    }, 50);
  };
  function set(play) {
    on = play;
    btn.setAttribute('aria-pressed', play);
    btn.setAttribute('aria-label', play ? 'Stop the menu music' : 'Play the menu music');
    try { sessionStorage.setItem('low-music', play ? '1' : '0'); } catch (e) {}
    if (play) { a.volume = 0; a.play().then(() => ramp(VOL)).catch(() => set(false)); }
    else ramp(0, () => a.pause());
  }
  btn.addEventListener('click', () => set(!on));
  // A video starting (site video or a YouTube player) pauses the music.
  document.addEventListener('play', e => { if (e.target !== a && on) set(false); }, true);
  document.addEventListener('click', e => { if (e.target.closest('button.yt') && on) set(false); });
  // Quiet while the tab is hidden; back on when it returns.
  document.addEventListener('visibilitychange', () => { if (!on) return; if (document.hidden) a.pause(); else a.play().catch(() => {}); });
})();
