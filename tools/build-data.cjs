#!/usr/bin/env node
/* Builds the site's data/*.json and copies the art it needs, straight from the game's own code.
   Usage: node tools/build-data.cjs "<path to the legacy-of-warden repo>"
   Reads src/game/engine.js (skills), talents.js (each skill's four talents), progression.js (gear, sets, Mythic sets), jobs.js (job trees) and
   forbidden-arts.js (Forbidden Arts). Only the icons the page shows are copied into img/. */
'use strict';
const fs = require('fs'), path = require('path');

const GAME = path.resolve(process.argv[2] || path.join(__dirname, '..', '..', 'legacy-of-warden'));
const SITE = path.resolve(__dirname, '..');
if (!fs.existsSync(path.join(GAME, 'src', 'game', 'engine.js'))) {
  console.error('Game repo not found at ' + GAME + '\nUsage: node tools/build-data.cjs "<path to legacy-of-warden>"');
  process.exit(1);
}
const req = f => require(path.join(GAME, 'src', 'game', f));
const G = req('engine.js'), P = req('progression.js'), J = req('jobs.js'), F = req('forbidden-arts.js'), T = req('talents.js');
const M = P.MYTHIC;

// Copies one game asset to img/<sub>/<name> and returns the site path.
const copied = new Set();
function art(src, sub, name) {
  if (!src) return null;
  const from = path.join(GAME, src);
  if (!fs.existsSync(from)) return null;
  const file = name || path.basename(src);
  const rel = 'img/' + sub + '/' + file;
  fs.mkdirSync(path.join(SITE, 'img', sub), { recursive: true });
  fs.copyFileSync(from, path.join(SITE, rel));
  copied.add(rel);
  return rel;
}

const EL = { fire: 'Fire', ice: 'Ice', lightning: 'Lightning', chaos: 'Chaos', physical: 'Physical', ward: 'Ward' };
const pct = v => Math.round(v * 100);

// ---- Skills -------------------------------------------------------------------------------------------------------
const kindOf = s => s.signature ? 'Signature' : s.rite ? (s.element === 'ward' ? 'Ward rite' : 'Rite') : 'Skill';
const skills = G.SPELLS.map(s => ({
  id: s.id,
  name: s.name,
  element: s.element,
  kind: kindOf(s),
  job: s.signature || null,
  cost: s.cost,
  hits: (s.hits || []).length,
  tags: (s.tags || []).filter(t => !/^(MAIN|SIGNATURE)$/i.test(t)).map(t => t.toUpperCase()).filter(t => t.toLowerCase() !== s.element),
  text: s.riteText || s.description || s.card || '',
  // The four talents, opened at skill level 4 / 8 / 12 / 15; each ritual slot uses one of them, or none.
  talents: ((T.TALENTS.find(t => t.skill === s.id) || {}).tiers || []).map((t, i) => ({
    name: t.name, level: T.TALENT_LEVELS[i], charge: t.charge, text: t.text, condition: t.condition || '',
  })),
  img: art(s.art, 'skills', (s.signature ? 'sig-' + s.signature : 'skill-' + s.id) + '.webp'),
}));

// ---- Gear -----------------------------------------------------------------------------------------------------------
const STAT = {
  damage: 'increased {el} damage', igniteChance: 'ignite chance', igniteEffect: 'ignite effect',
  flammabilityEffect: 'flammability effect', critDamage: '{el} crit damage', critChance: '{el} crit chance',
  chillEffect: 'chill effect', lotusChance: 'Lotus chance', baseShock: 'base shock', shockEffect: 'shock effect',
  luckyChance: 'lucky hit chance', poisonChance: 'poison chance', poisonEffect: 'poison effect',
  corrosionChance: 'corrosion chance', corrosionEffect: 'corrosion effect', bleedChance: 'bleed chance',
  bleedEffect: 'bleed effect', impaleChance: 'impale chance',
};
function statLines(e) {
  const out = [];
  const eff = e.effects || {};
  const els = Object.keys(eff);
  // Same damage on all five elements reads as one line.
  if (els.length === 5 && els.every(k => eff[k].damage === eff[els[0]].damage && Object.keys(eff[k]).length === 1))
    out.push('+' + pct(eff[els[0]].damage) + '% increased damage, all elements');
  else for (const el of els) for (const [k, v] of Object.entries(eff[el]))
    out.push('+' + pct(v) + '% ' + (STAT[k] || k).replace('{el}', EL[el] || el));
  if (e.charge) out.push('+' + e.charge + ' Charge');
  if (e.castSlots) out.push('+' + e.castSlots + ' ritual slot');
  return out;
}
const tierName = r => P.ITEM_TIERS[r] ? P.ITEM_TIERS[r].name : '';
const SLOT = { weapon: 'Weapon', robe: 'Robe', charm: 'Charm' };

const sets = {};
for (const [id, s] of Object.entries(P.SETS)) sets[id] = { id, name: s.name, elements: (P.EQUIPMENT.find(e => e.set === id) || {}).elements || (s.element ? [s.element] : []), two: s.two.text, three: s.three.text, kind: 'set' };

const items = P.EQUIPMENT.map(e => ({
  id: e.id,
  name: e.name,
  slot: e.slot,
  rarity: e.rarity,
  tier: tierName(e.rarity),
  element: e.element,
  power: e.power || 0,
  stats: statLines(e),
  unique: e.unique ? { name: e.unique.name, text: e.unique.text } : null,
  set: e.set || null,
  flavor: e.flavor,
  img: art(e.art, 'items'),
}));

// Mythic sets: one text per line at Forge rank 0 (as dropped).
const at0 = v => typeof v === 'object' && v ? v.base : v;
function lineText(l) {
  if (!l || typeof l.text !== 'function') return '';
  const vals = {};
  for (const [k, v] of Object.entries(l.fx || {})) vals[k] = at0(v);
  try { return l.text(vals); } catch (err) { return ''; }
}
const jobOfCap = {};
for (const j of J.JOBS) for (const n of j.nodes) jobOfCap[n.id] = j.id;
for (const s of M.SETS) {
  sets[s.id] = {
    id: s.id, name: s.name, kind: 'mythic', job: s.job, capstone: s.capstone, color: s.color,
    two: lineText(s.two), three: lineText(s.three), awakened: lineText(s.awakened),
  };
  s.pieces.forEach(([name, flavor, line], i) => {
    const slot = M.SLOTS[i];
    const it = M.ITEMS.find(x => x.mythic === s.id && x.slot === slot);
    items.push({
      id: it ? it.id : s.id + '-' + slot, name, slot, rarity: 5, tier: tierName(5), element: null,
      power: it ? it.power : 0, stats: it ? statLines(it) : [], unique: { name: 'Piece effect', text: lineText(line) },
      set: s.id, flavor, img: it ? art(it.art, 'items') : null,
    });
  });
}

// ---- Jobs and Forbidden Arts ----------------------------------------------------------------------------------------
const node = n => ({ id: n.id, name: n.name, short: n.short, text: n.text, img: art('assets/jobs/nodes/' + n.id + '.webp', 'nodes') });
const jobs = J.JOBS.map(j => {
  const byN = n => j.nodes.find(x => x.n === n);
  const fa = F.ARTS.find(a => a.job === j.id);
  return {
    id: j.id, name: j.name, gauge: j.gauge, color: j.color, accent: j.accent,
    focus: j.focus, about: j.about, lore: j.lore,
    portrait: art('assets/wizard/jobs/' + j.id + '/portrait.webp', 'jobs', j.id + '.webp'),
    icon: art('assets/icons/job-' + j.id + '.webp', 'jobs', 'icon-' + j.id + '.webp'),
    sanctum: art('assets/realm/sanctum/' + j.id + '.webp', 'jobs', 'sanctum-' + j.id + '.webp'),
    signature: node(byN(2)),
    capstones: J.CAPS.map(n => node(byN(n))),
    nodes: j.nodes.filter(n => n.n !== 2 && !J.CAPS.includes(n.n)).map(node),
    art: fa ? { id: fa.id, name: fa.name, short: fa.short, text: fa.text, lore: fa.lore, color: fa.color, gauge: fa.gauge } : null,
  };
});

// ---- Counts for the hero strip --------------------------------------------------------------------------------------
const stats = {
  skills: skills.filter(s => s.kind === 'Skill').length,
  rites: skills.filter(s => s.kind !== 'Skill' && s.kind !== 'Signature').length,
  signatures: skills.filter(s => s.kind === 'Signature').length,
  items: P.EQUIPMENT.length,
  mythic: M.SETS.length,
  sets: Object.keys(P.SETS).length,
  jobs: jobs.length,
  planes: P.PLANES ? P.PLANES.length : 6,
};

fs.mkdirSync(path.join(SITE, 'data'), { recursive: true });
const write = (f, v) => fs.writeFileSync(path.join(SITE, 'data', f), JSON.stringify(v));
write('skills.json', skills);
write('items.json', items);
write('sets.json', sets);
write('jobs.json', jobs);
write('stats.json', stats);

// Remove art that the data no longer points at (only inside the generated folders).
for (const sub of ['skills', 'items', 'nodes', 'jobs']) {
  const dir = path.join(SITE, 'img', sub);
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir)) if (!copied.has('img/' + sub + '/' + f)) fs.unlinkSync(path.join(dir, f));
}
console.log('skills', skills.length, '| items', items.length, '| sets', Object.keys(sets).length, '| jobs', jobs.length, '| art files', copied.size);
console.log(JSON.stringify(stats));
