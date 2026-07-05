// STARFOLD galaxy.js: deterministic sector generation (stars, planets, surfaces)
'use strict';

// Sector space: 0..250 x 0..200 units.
SF.SECTOR = { w: 250, h: 200 };

SF.STAR_CLASSES = [
  { cls: 'M', color: SF.P.lred,    size: 3 },
  { cls: 'K', color: SF.P.yellow,  size: 3 },
  { cls: 'G', color: SF.P.white,   size: 4 },
  { cls: 'F', color: SF.P.lcyan,   size: 4 },
  { cls: 'B', color: SF.P.lblue,   size: 5 }
];

SF.PLANET_TYPES = {
  molten: { name: 'MOLTEN',   colors: [SF.P.red, SF.P.brown, SF.P.lred, SF.P.black], landable: true,  hazard: 'MAGMA VENT' },
  rock:   { name: 'ROCKY',    colors: [SF.P.brown, SF.P.dgray, SF.P.lgray, SF.P.red], landable: true, hazard: 'LIGHTNING' },
  desert: { name: 'DESERT',   colors: [SF.P.brown, SF.P.yellow, SF.P.red, SF.P.lgray], landable: true, hazard: 'SANDSTORM' },
  ice:    { name: 'FROZEN',   colors: [SF.P.white, SF.P.lcyan, SF.P.cyan, SF.P.lblue], landable: true, hazard: 'CREVASSE' },
  ocean:  { name: 'OCEANIC',  colors: [SF.P.blue, SF.P.lblue, SF.P.cyan, SF.P.green], landable: true, hazard: 'CYCLONE' },
  garden: { name: 'GARDEN',   colors: [SF.P.green, SF.P.lgreen, SF.P.blue, SF.P.brown], landable: true, hazard: 'PREDATOR' },
  gas:    { name: 'GAS GIANT',colors: [SF.P.magenta, SF.P.lmagenta, SF.P.brown, SF.P.yellow], landable: false }
};

// hand-placed story stars ------------------------------------------------------
SF.STORY_STARS = [
  { id: 0,  x: 125, y: 100, key: 'start',  kvName: 'KX-471',  forcePlanets: 'start' },
  { id: 1,  x: 118, y: 92,  key: 'kvprime',kvName: 'KV PRIME', forcePlanets: 'kvprime', station: { race: 'kvoth', name: 'LATTICE BASTION', planet: 1 } },
  { id: 2,  x: 140, y: 110, key: 'kvdepot',kvName: 'KV-9',    forcePlanets: 'generic', station: { race: 'kvoth', name: 'DEPOT KV-9', planet: 0 } },
  { id: 3,  x: 170, y: 60,  key: 'bazaar', name: 'GILDED REACH', forcePlanets: 'generic', station: { race: 'velmarah', name: 'BAZAAR ETERNAL', planet: 0 } },
  { id: 4,  x: 45,  y: 148, key: 'ashkar', name: 'ASHKAR',   forcePlanets: 'ashkar', station: { race: 'ashkaru', name: 'PYRE THRONE', planet: 0 } },
  { id: 5,  x: 110, y: 185, key: 'den',    forcePlanets: 'generic' },
  { id: 6,  x: 100, y: 70,  key: 'ruin1',  forcePlanets: 'ruin' },
  { id: 7,  x: 160, y: 130, key: 'ruin2',  forcePlanets: 'ruin' },
  { id: 8,  x: 60,  y: 80,  key: 'ruin3',  forcePlanets: 'ruin' },
  { id: 9,  x: 200, y: 160, key: 'vault',  forcePlanets: 'ruin' },
  { id: 10, x: 38,  y: 165, key: 'drone',  forcePlanets: 'drone' },   // just outside the Dimming's start edge (dist ~16 from the Maw, radius 12): the dark spreads over it around SD +1
  { id: 11, x: 243, y: 12,  key: 'veil',   name: 'THE VEIL', forcePlanets: 'veil', dark: true },
  { id: 12, x: 25,  y: 175, key: 'maw',    name: 'THE MAW',  forcePlanets: 'veil', dark: true }
];

SF.FLUXES = [
  { ax: 150, ay: 80,  bx: 55,  by: 140 },   // Kvoth <-> Ashkaru shortcut
  { ax: 185, ay: 35,  bx: 92,  by: 122 },   // Bazaar reach <-> mid-sector
  { ax: 30,  ay: 30,  bx: 236, by: 18 }     // THE DOOR: 30,30 <-> near the Veil
];

SF.galaxy = { stars: [], surfCache: new Map(), mapCache: new Map() };

SF.genGalaxy = function () {
  const rng = SF.mulberry32(0xC0FFEE);
  const stars = [];
  for (const s of SF.STORY_STARS) {
    stars.push({
      id: s.id, x: s.x, y: s.y, key: s.key, kvName: s.kvName || null,
      fixedName: s.name || null, dark: !!s.dark, station: s.station || null,
      cls: SF.STAR_CLASSES[s.key === 'ashkar' || s.key === 'vault' ? 0 : SF.ri(rng, 1, 4)],
      seed: SF.hash(s.id, 77), force: s.forcePlanets
    });
  }
  // procedural stars
  let id = SF.STORY_STARS.length, guard = 0;
  while (stars.length < 122 && guard++ < 5000) {
    const x = SF.rf(rng, 8, SF.SECTOR.w - 8), y = SF.rf(rng, 8, SF.SECTOR.h - 8);
    if (stars.some(s => SF.dist(s.x, s.y, x, y) < 7)) continue;
    if (SF.dist(x, y, 243, 12) < 14) continue;               // keep the Veil lonely
    stars.push({ id: id, x: x, y: y, key: null, kvName: null, fixedName: null, dark: false,
      station: null, cls: SF.choice(rng, SF.STAR_CLASSES), seed: SF.hash(id, 77), force: null });
    id++;
  }
  // Kvoth catalogue names for stars in the Sphere
  let kn = 100;
  for (const s of stars) {
    if (!s.kvName && SF.dist(s.x, s.y, 125, 100) < 45) s.kvName = 'KV-' + (kn += SF.ri(rng, 3, 17));
  }
  for (const s of stars) s.planets = SF.genPlanets(s);
  SF.galaxy.stars = stars;
};

// ---- planets ------------------------------------------------------------------
SF.genPlanets = function (star) {
  const rng = SF.mulberry32(star.seed);
  const defs = [];
  const mk = (type, opts) => Object.assign({
    star: star.id, type: type, seed: SF.hash(star.seed, defs.length + 1),
    orbitR: 46 + defs.length * 34 + SF.ri(rng, 0, 14), size: SF.ri(rng, 6, 14),
    ang0: SF.rf(rng, 0, Math.PI * 2), spd: SF.rf(rng, 0.008, 0.03) * (rng() < 0.5 ? -1 : 1),
    bio: 0, minRich: SF.rf(rng, 0.4, 1.2), special: null
  }, opts || {});

  switch (star.force) {
    case 'start':
      defs.push(mk('molten'));
      defs.push(mk('rock', { special: 'thorium', minRich: 1.6 }));
      defs.push(mk('gas', { size: 16 }));
      break;
    case 'kvprime':
      defs.push(mk('molten')); defs.push(mk('rock')); defs.push(mk('ice'));
      break;
    case 'ashkar':
      defs.push(mk('desert', { minRich: 1.2 })); defs.push(mk('molten'));
      break;
    case 'ruin':
      defs.push(mk('rock'));
      defs.push(mk(star.key === 'ruin3' ? 'ice' : star.key === 'ruin2' ? 'desert' : 'rock',
        { special: star.key, bio: star.key === 'ruin1' ? 0.3 : 0 }));
      if (rng() < 0.7) defs.push(mk('gas', { size: 15 }));
      break;
    case 'drone':
      defs.push(mk('molten')); defs.push(mk('gas', { size: 15 }));
      defs.push(mk('ice', { special: 'drone' }));
      break;
    case 'veil':
      // No planets. No homeworld. Just the star. That IS the revelation.
      break;
    case 'generic':
    default: {
      const n = star.force === 'generic' ? SF.ri(rng, 2, 4) : SF.ri(rng, 0, 5);
      const pool = ['molten', 'rock', 'rock', 'desert', 'ice', 'ice', 'ocean', 'gas', 'gas', 'garden'];
      for (let i = 0; i < n; i++) {
        const t = pool[SF.ri(rng, 0, pool.length - 1)];
        defs.push(mk(t, { bio: t === 'garden' ? SF.rf(rng, 0.5, 1) : (t === 'ocean' ? SF.rf(rng, 0.2, 0.7) : (rng() < 0.15 ? SF.rf(rng, 0.05, 0.3) : 0)) }));
      }
      // rare flavor artifact site
      if (defs.length && rng() < 0.16) {
        const p = defs[SF.ri(rng, 0, defs.length - 1)];
        if (SF.PLANET_TYPES[p.type].landable) p.special = 'debris';
      }
    }
  }
  defs.forEach((p, i) => { p.idx = i; });
  return defs;
};

SF.planetName = function (star, p) {
  return SF.starName(star) + ' ' + SF.roman(p.idx);
};

// element weights per planet type (mining table)
SF.MIN_TABLE = {
  molten: { iron: 20, nickel: 10, lead: 8, copper: 10, titanium: 8, gold: 4, platinum: 3, iridium: 3, thorium: 2 },
  rock:   { iron: 25, nickel: 15, lead: 10, copper: 12, cobalt: 8, titanium: 6, silver: 4, gold: 2, thorium: 3 },
  desert: { iron: 20, nickel: 10, copper: 10, silver: 6, gold: 4, titanium: 5, thorium: 2, auralite: 1 },
  ice:    { iron: 10, nickel: 8, lead: 6, cobalt: 10, silver: 5, platinum: 2, auralite: 1 },
  ocean:  { iron: 8, nickel: 6, copper: 6, cobalt: 6, silver: 3 },
  garden: { iron: 12, nickel: 8, copper: 8, cobalt: 4, silver: 3, gold: 2 }
};

// ---- planet surface -----------------------------------------------------------
// Grid 384x240 (Starflight scale: ~6x6 view-screens), generated lazily & cached
// per session. Dynamic state (mined tiles, taken artifacts) lives in
// G.mined / G.taken keyed by "starId:planetIdx".
SF.SURF_W = 384; SF.SURF_H = 240;

SF.genSurface = function (p) {
  const key = p.star + ':' + p.idx;
  if (SF.galaxy.surfCache.has(key)) return SF.galaxy.surfCache.get(key);
  const rng = SF.mulberry32(p.seed);
  const W = SF.SURF_W, H = SF.SURF_H;
  // multi-scale blob height map: continents, regions, detail
  let hmap = new Float32Array(W * H);
  const OCTAVES = [[12, 45, 95], [70, 14, 38], [340, 3, 10]];
  for (const oct of OCTAVES) for (let b = 0; b < oct[0]; b++) {
    const bx = SF.rf(rng, 0, W), by = SF.rf(rng, 0, H), r = SF.rf(rng, oct[1], oct[2]), amp = SF.rf(rng, -1, 1);
    const r2 = r * r;
    for (let y = Math.max(0, by - r | 0); y < Math.min(H, by + r + 1 | 0); y++)
      for (let x = 0; x < W; x++) {
        let dx = Math.min(Math.abs(x - bx), W - Math.abs(x - bx));   // wrap horizontally
        const d2 = dx * dx + (y - by) * (y - by);
        if (d2 < r2) hmap[y * W + x] += amp * (1 - d2 / r2);
      }
  }
  // normalize to 0..3 color bands
  let mn = 1e9, mx = -1e9;
  hmap.forEach(v => { if (v < mn) mn = v; if (v > mx) mx = v; });
  const tiles = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) tiles[i] = SF.clamp(Math.floor((hmap[i] - mn) / (mx - mn + 0.0001) * 4), 0, 3);

  // liquid/hazard band: band 0 is water (ocean/garden) or lava (molten) or crevasse (ice)
  const surf = { key: key, p: p, tiles: tiles, deposits: [], sites: [], life: [] };

  // mineral deposits
  const table = SF.MIN_TABLE[p.type] || SF.MIN_TABLE.rock;
  const ids = Object.keys(table);
  const totW = ids.reduce((s, k) => s + table[k], 0);
  const nDep = Math.round((45 + rng() * 25) * p.minRich);   // rare finds on a big world: the orbital scan matters
  for (let i = 0; i < nDep; i++) {
    let x = SF.ri(rng, 0, W - 1), y = SF.ri(rng, 2, H - 3);
    if (tiles[y * W + x] === 0) continue;                    // not in liquid
    let roll = rng() * totW, el = ids[0];
    for (const k of ids) { roll -= table[k]; if (roll <= 0) { el = k; break; } }
    if (p.special === 'thorium' && el === 'thorium') el = 'iron';   // its thorium is the fixed budget below
    surf.deposits.push({ x: x, y: y, el: el, amt: SF.ri(rng, 6, 20) });
  }
  // the toll planet holds only a whisker more thorium than the toll itself:
  // pay the Kvoth and the margin is pocket money, not a fortune
  if (p.special === 'thorium') {
    let budget = SF.TOLL + 34, guard = 0;
    while (budget > 0 && guard++ < 400) {
      const x = SF.ri(rng, 0, W - 1), y = SF.ri(rng, 2, H - 3);
      if (tiles[y * W + x] === 0) continue;
      const amt = Math.min(budget, SF.ri(rng, 8, 18));
      surf.deposits.push({ x: x, y: y, el: 'thorium', amt: amt });
      budget -= amt;
    }
  }
  // special sites: never in band 0 where the TV cannot enter (water/lava)
  const siteBlocked = ['ocean', 'garden', 'molten'].includes(p.type);
  const siteXY = () => {
    let x = SF.ri(rng, 10, W - 10), y = SF.ri(rng, 8, H - 8);
    for (let n = 0; siteBlocked && tiles[y * W + x] === 0 && n < 300; n++) {
      x = SF.ri(rng, 10, W - 10); y = SF.ri(rng, 8, H - 8);
    }
    return { x: x, y: y };
  };
  if (p.special === 'ruin1') surf.sites.push(Object.assign(siteXY(), { kind: 'ruin', clue: 'clueRuin1' }));
  if (p.special === 'ruin2') surf.sites.push(Object.assign(siteXY(), { kind: 'ruin', clue: 'clueRuin2' }));
  if (p.special === 'ruin3') surf.sites.push(Object.assign(siteXY(), { kind: 'ruin', clue: 'clueRuin3' }));
  if (p.special === 'vault') surf.sites.push(Object.assign(siteXY(), { kind: 'vault' }));
  if (p.special === 'drone') surf.sites.push(Object.assign(siteXY(), { kind: 'drone' }));
  if (p.special === 'debris') {
    const arts = ['shard', 'voidpearl', 'stasiscube'];
    surf.sites.push(Object.assign(siteXY(), { kind: 'debris', art: arts[SF.ri(rng, 0, 2)] }));
  }
  // lifeforms (t indexes the biome-specific description pool)
  const nLife = Math.round(p.bio * 20);
  const poolLen = SF.lifePool(p.type).length;
  for (let i = 0; i < nLife; i++) {
    surf.life.push({ x: SF.ri(rng, 0, W - 1), y: SF.ri(rng, 2, H - 3), t: SF.ri(rng, 0, poolLen - 1), scanned: false });
  }
  SF.galaxy.surfCache.set(key, surf);
  return surf;
};

// offscreen-rendered planet map (1px per tile), cached per planet + cold state.
// 92k tiles are far too many to fillRect per frame; ImageData renders in one shot.
SF.surfMapCanvas = function (p, cold) {
  const key = p.star + ':' + p.idx + ':' + (cold ? 1 : 0);
  let cv = SF.galaxy.mapCache.get(key);
  if (cv) return cv;
  const surf = SF.genSurface(p);
  const cols = (cold ? ['#232838', '#39415c', '#4a5578', '#5a6a94'] : SF.PLANET_TYPES[p.type].colors)
    .map(h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
  const W = SF.SURF_W, H = SF.SURF_H;
  cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const cc = cv.getContext('2d');
  const img = cc.createImageData(W, H);
  for (let i = 0; i < W * H; i++) {
    const rgb = cols[surf.tiles[i]];
    img.data[i * 4] = rgb[0]; img.data[i * 4 + 1] = rgb[1]; img.data[i * 4 + 2] = rgb[2]; img.data[i * 4 + 3] = 255;
  }
  cc.putImageData(img, 0, 0);
  SF.galaxy.mapCache.set(key, cv);
  return cv;
};

// planet sensor readout (deterministic flavor numbers)
SF.planetSensors = function (star, p) {
  const rng = SF.mulberry32(p.seed ^ 0xBEEF);
  const T = SF.PLANET_TYPES[p.type];
  const cold = SF.starCold(star);
  const temp = cold ? SF.ri(rng, -272, -240) :
    { molten: SF.ri(rng, 400, 900), rock: SF.ri(rng, -50, 90), desert: SF.ri(rng, 40, 160),
      ice: SF.ri(rng, -210, -80), ocean: SF.ri(rng, -5, 40), garden: SF.ri(rng, 5, 30), gas: SF.ri(rng, -180, -60) }[p.type];
  return {
    type: T.name + (cold ? ' (FROZEN DARK)' : ''),
    mass: (p.size * 0.17).toFixed(2) + ' EM',
    temp: temp + ' C',
    atmo: p.type === 'gas' ? 'CRUSHING' : cold ? 'FROZEN SOLID' : SF.choice(rng, ['NONE', 'TRACE', 'THIN', 'BREATHABLE', 'DENSE', 'CORROSIVE']),
    bio: cold ? 'EXTINCT' : p.bio > 0.6 ? 'ABUNDANT' : p.bio > 0.2 ? 'SPARSE' : p.bio > 0 ? 'TRACE' : 'NONE',
    minerals: p.minRich > 1.3 ? 'VERY RICH' : p.minRich > 0.9 ? 'RICH' : p.minRich > 0.6 ? 'MODERATE' : 'POOR'
  };
};

// "awake" stars: living Watchers whose micro-flare patterns a careful science
// officer can notice. ~1 in 6 stars, plus the Veil itself.
SF.starAwake = function (star) {
  if (star.key === 'veil') return true;
  if (star.dark || SF.starCold(star)) return false;
  return SF.hash(star.seed, 5) % 6 === 0;
};

// ---- star naming ---------------------------------------------------------------
SF.starName = function (star) {
  if (!star) return '???';
  const G = SF.G;
  if (star.key === 'maw') return G.flags.dimKnown ? 'THE MAW' : 'UNCHARTED MASS';
  if (star.dark) return G.flags.veilFound ? 'THE VEIL' : 'UNCHARTED MASS';
  if (star.fixedName && G.flags.chartcore) return star.fixedName;
  if (star.kvName && G.flags.chartcore) return star.kvName;
  if (G.visited[star.id]) return 'VS-' + String(star.id + 1).padStart(3, '0');
  return 'UNCHARTED STAR';
};
