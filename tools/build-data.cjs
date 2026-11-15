#!/usr/bin/env node
/* Builds the site's data/skills.json and data/jobs.json (and the counts in stats.json) from the Godot game's own data, so the
   site says what the game says (15 Nov 2026: the old script read the web engine, which is gone, and the site had drifted).
   Usage: node tools/build-data.cjs "<path to the legacy-of-warden repo>"
   Reads godot/data: battle.json (skills: name, element, cost, hits, tags, description), arcana.json (each skill's talents as
   the Grimoire shows them, the base jobs and their Forbidden Arts), progression.json (the job tree's edges and capstones),
   shop.json (talent levels), dlc-jobs.json and dlc-skills.json (the Bloodmoon Realm pack), and the port's own words in
   godot/scripts/core: camp.gd PORT_NODE_TEXT / PORT_NODE_SHORT (job nodes), arts.gd PORT_TEXT (Forbidden Arts), signatures.gd
   SPLIT_HITS and port_text.gd ONE_HIT (hit counts). Texts keep the game's RichWords markup ({n:…}, {fire:…}, {note:…}, one
   point a line); js/site.js draws it. items.json, sets.json and planes.json are not touched here.
   Art: a picture the site already has is kept; a missing one is copied from godot/assets. */
'use strict';
const fs = require('fs'), path = require('path');

const GAME = path.resolve(process.argv[2] || path.join(__dirname, '..', '..', 'legacy-of-warden'));
const SITE = path.resolve(__dirname, '..');
const GD = path.join(GAME, 'godot');
if (!fs.existsSync(path.join(GD, 'data', 'battle.json'))) {
  console.error('Game repo not found at ' + GAME + '\nUsage: node tools/build-data.cjs "<path to legacy-of-warden>"');
  process.exit(1);
}
// arcana.json holds raw control characters inside a few strings: JSON.parse refuses them, so they are escaped first.
const data = f => {
  const raw = fs.readFileSync(path.join(GD, 'data', f), 'utf8');
  try { return JSON.parse(raw); } catch (e) { return JSON.parse(raw.replace(/[\u0000-\u001f]/g, c => c === '\n' ? '\\n' : c === '\t' ? '\\t' : '')); }
};
const code = f => fs.readFileSync(path.join(GD, 'scripts', 'core', f), 'utf8');
const B = data('battle.json'), A = data('arcana.json'), P = data('progression.json'), S = data('shop.json');
const DJ = data('dlc-jobs.json'), DS = data('dlc-skills.json');

// A GDScript dictionary of strings (const NAME := { "key": "text", ... }) as a JS object.
function gdDict(src, name) {
  const at = src.indexOf('const ' + name + ' := {');
  if (at < 0) return {};
  let i = src.indexOf('{', at), depth = 0, inStr = false, end = i;
  for (; end < src.length; end++) {
    const c = src[end];
    if (inStr) { if (c === '\\') end++; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true;
    else if (c === '{') depth++;
    else if (c === '}') { depth--; if (!depth) break; }
  }
  const body = src.slice(i, end + 1), out = {};
  const re = /"([A-Za-z0-9_]+)"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
  let m;
  while ((m = re.exec(body))) out[m[1]] = JSON.parse('"' + m[2] + '"');
  return out;
}
function gdIntDict(src, name) {
  const m = src.match(new RegExp('const ' + name + ' := \\{([^}]*)\\}'));
  const out = {};
  if (m) for (const [, k, v] of m[1].matchAll(/(\d+)\s*:\s*(\d+|true)/g)) out[k] = v === 'true' ? 1 : +v;
  return out;
}
const CAMP = code('camp.gd'), ARTS = code('arts.gd');
const NODE_TEXT = gdDict(CAMP, 'PORT_NODE_TEXT'), NODE_SHORT = gdDict(CAMP, 'PORT_NODE_SHORT');
const ART_TEXT = gdDict(ARTS, 'PORT_TEXT');
const SPLIT = gdIntDict(code('signatures.gd'), 'SPLIT_HITS'), ONE_HIT = gdIntDict(code('port_text.gd'), 'ONE_HIT');

// A picture: the site's own copy if it has one, else the game's (copied in).
function art(siteRel, gameRel) {
  if (fs.existsSync(path.join(SITE, siteRel))) return siteRel;
  const from = gameRel && path.join(GD, gameRel);
  if (!from || !fs.existsSync(from)) return null;
  fs.mkdirSync(path.dirname(path.join(SITE, siteRel)), { recursive: true });
  fs.copyFileSync(from, path.join(SITE, siteRel));
  return siteRel;
}

const LEVELS = S.TALENT_LEVELS || [4, 8, 12, 15];
const SIG_JOB = {};
for (const [job, idx] of Object.entries(P.JOBS.SIGNATURE_SKILL || B.JOBS.SIGNATURE_SKILL || {})) SIG_JOB[idx] = job;
const kindOf = s => s.signature ? 'Signature' : s.rite ? (s.element === 'ward' ? 'Ward rite' : 'Rite') : 'Skill';
const hitsOf = (s, i) => ONE_HIT[i] ? 1 : SPLIT[i] || (Array.isArray(s.hits) ? s.hits.length : +s.hits || 0);
// The data's own MULTI-HIT tag is the web's count: the port's (split skills, Phoenix Descent's one dive) is said instead.
function tagsOf(s, i) {
  const t = (s.tags || []).map(x => String(x).toUpperCase())
    .filter(x => !/^(MAIN|SIGNATURE)$/.test(x) && !/^MULTI-HIT/.test(x) && x.toLowerCase() !== s.element);
  const n = hitsOf(s, i);
  if (n > 1 && !s.signature) t.unshift('MULTI-HIT ' + n);
  return t;
}
const talentsOf = list => (list || []).map((t, k) => ({ name: t.name, level: LEVELS[k], charge: t.charge, text: t.text || '', condition: t.condition || '' }));

// ---- Skills: the base game's 0-57 ---------------------------------------------------------------------------------------
// Retired skills (Smoulder Sigil, Static Field, Sunder Mark) are out of the game: not on the site either.
const skills = B.SPELLS.map((s, i) => [s, i]).filter(([s]) => !s.retired).map(([s, i]) => {
  const g = A.SPELLS[i] || {};
  const sigJob = s.signature ? (SIG_JOB[i] || null) : null;
  return {
    id: i, name: s.name, element: s.element, kind: kindOf(s), job: sigJob, cost: s.cost, hits: hitsOf(s, i), tags: tagsOf(s, i),
    text: s.riteText || s.description || '',
    talents: s.signature || s.rite ? [] : talentsOf(g.talents),
    img: s.signature ? art('img/skills/sig-' + sigJob + '.webp', String(s.art || '').replace(/^assets\/jobs\/nodes\//, 'assets/panels/jobs/'))
      : art('img/skills/skill-' + i + '.webp', 'assets/skills/skill-' + i + '.webp'),
  };
});

// ---- The Bloodmoon Realm pack: Signatures 58-60 and Ultimates 61-65 -------------------------------------------------------
for (const j of DJ.jobs) {
  const sg = j.signature;
  skills.push({
    id: +j.skill, name: sg.name, element: sg.element, kind: 'Signature', job: j.id, cost: 10, hits: (sg.hits || []).length || 1,
    tags: ((B.SPELLS[53] || {}).tags || []).filter(x => /^RITUAL/i.test(String(x))).map(x => String(x).toUpperCase()), text: sg.description, talents: [], dlc: true,
    img: art('img/skills/sig-' + j.id + '.webp', 'assets/panels/jobs/' + j.nodes[1].id + '.webp'),
  });
}
for (const e of DS.skills) {
  skills.push({
    id: +e.skill, name: e.name, element: e.element, kind: 'Skill', job: null, cost: 4, hits: +e.hits || 1,
    tags: ['ULTIMATE', ...(e.status || []).map(x => String(x).toUpperCase()), '+PER MARK'], text: e.description,
    talents: talentsOf([...(e.talents || []), ...(DS.talentsTail || [])]), dlc: true, unlock: e.unlock,
    img: art('img/skills/skill-' + e.skill + '.webp', 'assets/skills/skill-' + e.skill + '.webp'),
  });
}
skills.sort((a, b) => a.id - b.id);

// ---- Jobs: the 5 base jobs (arcana.json + the port's words) and the pack's 3 ----------------------------------------------
const EDGES = P.JOBS.EDGES, CAPS = P.JOBS.CAPS;
const ROADS = { A: [1, 2, 3, 5, 7, 9, 10], B: [1, 2, 4, 6, 8, 9, 10] };
const nodeOf = n => ({
  id: n.id, name: n.name, n: n.n,
  short: NODE_SHORT[n.id] || n.short, text: NODE_TEXT[n.id] || n.text,
  img: art('img/nodes/' + n.id + '.webp', 'assets/panels/jobs/' + n.id + '.webp'),
});
function job(j, art_, dlc) {
  const tree = j.nodes.map(nodeOf);
  const by = n => tree.find(x => x.n === n);
  return {
    id: j.id, name: j.name, gauge: j.gauge, color: j.color, accent: j.accent, focus: j.focus, about: j.about, lore: j.lore,
    // the pack's jobs: the Bloodmoon page's own job art (the same 440 x 520 cut as the base jobs')
    portrait: dlc && fs.existsSync(path.join(SITE, 'img/bloodmoon/job-' + j.id + '.webp')) ? 'img/bloodmoon/job-' + j.id + '.webp'
      : art('img/jobs/' + j.id + '.webp', 'assets/panels/portraits/' + j.id + '.webp'),
    bg: fs.existsSync(path.join(SITE, 'img/bg/job-' + j.id + '.webp')) ? 'img/bg/job-' + j.id + '.webp' : 'img/bloodmoon/sky.webp',
    icon: art('img/jobs/icon-' + j.id + '.webp', 'assets/panels/icons/job-' + j.id + '.webp'),
    sanctum: art('img/jobs/sanctum-' + j.id + '.webp', null),
    signature: by(2), capstones: CAPS.map(by), nodes: tree.filter(n => n.n !== 2 && !CAPS.includes(n.n)),
    tree, edges: EDGES, roads: ROADS, caps: CAPS,
    art: art_ ? { id: art_.id, name: art_.name, short: art_.short, text: ART_TEXT[j.id] || art_.text, lore: art_.lore, color: art_.color, gauge: art_.gauge } : null,
    dlc: !!dlc,
  };
}
const jobs = [
  ...A.JOBS.filter(j => !j.dlc).map(j => job(j, (A.ARTS || []).find(a => a.job === j.id), false)),
  ...DJ.jobs.map(j => job(j, { ...j.art }, true)),
];

// ---- Counts for the hero strip (the base game's, as before; items and planes kept from the old file) ----------------------
const statsFile = path.join(SITE, 'data', 'stats.json');
const old = fs.existsSync(statsFile) ? JSON.parse(fs.readFileSync(statsFile, 'utf8')) : {};
const base = skills.filter(s => !s.dlc);
const stats = {
  ...old,
  skills: base.filter(s => s.kind === 'Skill').length,
  rites: base.filter(s => s.kind !== 'Skill' && s.kind !== 'Signature').length,
  signatures: base.filter(s => s.kind === 'Signature').length,
  jobs: jobs.filter(j => !j.dlc).length,
  dlcJobs: jobs.filter(j => j.dlc).length,
  dlcSkills: skills.filter(s => s.dlc).length,
};

const write = (f, v) => fs.writeFileSync(path.join(SITE, 'data', f), JSON.stringify(v));
write('skills.json', skills);
write('jobs.json', jobs);
write('stats.json', stats);
console.log('skills', skills.length, '(pack', stats.dlcSkills + ') | jobs', jobs.length, '| node texts from camp.gd', Object.keys(NODE_TEXT).length, '| art texts from arts.gd', Object.keys(ART_TEXT).length);
console.log(JSON.stringify(stats));
