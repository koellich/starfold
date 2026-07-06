// STARFOLD game.js: game state, save/load, main loop, shared ship helpers
'use strict';

SF.modes = {};
SF.mode = null;
SF.G = null;
SF.SAVE_V = 1;                                   // save-shape version — bump on any breaking change
SF.SAVE_KEY = 'starfold_save_v' + SF.SAVE_V;      // key and stored `v` both derive from it

// ---- new game -----------------------------------------------------------------
SF.newGame = function () {
  SF.G = {
    v: SF.SAVE_V,
    stardate: SF.START_SD,
    px: 125, py: 100, insys: 0, sx: 60, sy: 120,
    ship: {
      engine: 1, shield: 0, armor: 1, laser: 1, missile: 0, pods: 0, scanner: 1,
      shieldsUp: false, armorPts: SF.ARMOR_PTS[1], shieldPts: 0,
      sys: { hull: 100, eng: 100, shd: 100, wpn: 100, sen: 100, life: 100 },
      tvHull: 100
    },
    credits: 60,
    cargo: {}, tvCargo: {}, artifacts: [],
    crew: SF.CREW_DEF.map(c => ({ role: c.role, name: c.name, hp: 100 })),
    rel: { kvoth: -20, velmarah: 10, ashkaru: -10, corsair: -60, rhanfayr: 0 },
    virtue: 0, deeds: [], bioCount: 0,
    flags: {},
    visited: {}, known: {}, whKnown: {}, whUsed: {},
    mined: {}, taken: {}, partial: {},
    surveyed: {},   // 'star:idx' -> 1 unsold / 2 sold (Kvoth survey trade)
    journal: [],
    tollPicket: true   // the Kvoth toll patrol waits in the start system
  };
  SF.G.visited[0] = true; SF.G.known[0] = true;
  SF.revealNearbyStars();
};

SF.journal = function (text) {
  SF.G.journal.push('SD ' + SF.G.stardate.toFixed(2) + ' - ' + text);
  SF.log('» LOGGED TO CAPTAIN\'S JOURNAL.', SF.P.dgray);
};
// quiet deeds are fully counted but never cited before judgment: silent sins.
// Repeated kindnesses of the same kind weigh less each time (1, 1, .5, .5,
// .25, .25, then nothing): grace cannot be farmed. Sins never diminish.
SF.deed = function (delta, text, quiet) {
  let v = delta;
  if (delta > 0) {
    const n = SF.G.deeds.filter(d => d.t === text).length;
    v = delta * (n < 2 ? 1 : n < 4 ? 0.5 : n < 6 ? 0.25 : 0);
  }
  SF.G.virtue += v;
  SF.G.deeds.push({ v: v, t: text, q: quiet || undefined });
};

// ---- save / load ----------------------------------------------------------------
SF.save = function (silent) {
  try {
    localStorage.setItem(SF.SAVE_KEY, JSON.stringify(SF.G));
    if (!silent) SF.log('GAME SAVED.', SF.P.lgreen);
  } catch (e) { SF.log('SAVE FAILED: ' + e.message, SF.P.lred); }
};
SF.hasSave = function () {
  try { return !!localStorage.getItem(SF.SAVE_KEY); } catch (e) { return false; }
};
SF.load = function () {
  try {
    const d = JSON.parse(localStorage.getItem(SF.SAVE_KEY));
    if (d && d.v === SF.SAVE_V) { SF.G = d; return true; }
  } catch (e) {}
  return false;
};

// ---- shared state helpers --------------------------------------------------------
// the ship's sector-space position: an in-system star's coords, else deep-space px/py
SF.shipPos = function () {
  const G = SF.G;
  return G.insys !== null ? { x: SF.galaxy.stars[G.insys].x, y: SF.galaxy.stars[G.insys].y } : { x: G.px, y: G.py };
};
// adjust a race's reputation, always clamped to [-100, 100]
SF.addRel = function (race, delta) { SF.G.rel[race] = SF.clamp(SF.G.rel[race] + delta, -100, 100); };
// ship-subsystem display names (damage report, repair notices, engineer report)
SF.SYS_NAMES = { eng: 'ENGINES', shd: 'SHIELD GEN', wpn: 'WEAPONS', sen: 'SENSORS', life: 'LIFE SUPPORT' };

// ---- cargo -----------------------------------------------------------------------
SF.cargoMax = () => 200 + SF.G.ship.pods * 100;
SF.cargoUsed = () => Math.round(SF.sumMap(SF.G.cargo));
SF.addCargo = function (el, amt) {
  const free = SF.cargoMax() - SF.cargoUsed();
  const take = Math.min(free, amt);
  if (take > 0) SF.G.cargo[el] = (SF.G.cargo[el] || 0) + take;
  return take;
};

// ---- star knowledge ----------------------------------------------------------------
// deflector wash interferes with the sensor grid: raised shields halve detection range
SF.scanRange = function () {
  return SF.SCAN_RANGE[SF.G.ship.scanner] * (SF.G.ship.shieldsUp ? 0.5 : 1);
};
SF.revealNearbyStars = function () {
  const G = SF.G, r = SF.scanRange();
  for (const s of SF.galaxy.stars) {
    if (s.dark && !G.flags.veilFound) continue;
    if (SF.dist(s.x, s.y, G.px, G.py) <= r) G.known[s.id] = true;
  }
  // pyramid device reveals fluxes in range
  if (G.flags.pyramid) {
    SF.FLUXES.forEach((w, i) => {
      if (SF.dist(w.ax, w.ay, G.px, G.py) <= r) {
        if (!G.whKnown['a' + i]) { G.whKnown['a' + i] = true; SF.log('PYRAMID DEVICE RESONATES: GRAVITIC FLUX CHARTED AT ' + Math.round(w.ax) + ',' + Math.round(w.ay) + '.', SF.P.lmagenta); }
      }
      if (SF.dist(w.bx, w.by, G.px, G.py) <= r) {
        if (!G.whKnown['b' + i]) { G.whKnown['b' + i] = true; SF.log('PYRAMID DEVICE RESONATES: GRAVITIC FLUX CHARTED AT ' + Math.round(w.bx) + ',' + Math.round(w.by) + '.', SF.P.lmagenta); }
      }
    });
    // the navigator's read on the first charted flux
    if (!G.flags.whAdvice && Object.keys(G.whKnown).length) {
      G.flags.whAdvice = true;
      SF.log('ENS. LEE: "I\'d call that a tear, Captain. Space folded thin enough to step through, if anything could survive the step. If we ever try: shields UP first. I want a live deflector field between us and THAT."', SF.P.lgray);
      SF.journal('Ens. Lee on the gravitic fluxes: possibly traversable "tears" in space. His standing request: approach ONLY with shields raised.');
    }
  }
};

// ---- damage model -------------------------------------------------------------------
// Returns description of what got hit.
SF.takeDamage = function (dmg) {
  const G = SF.G, sh = G.ship;
  let msg = [];
  if (sh.shieldsUp && sh.shieldPts > 0) {
    const absorbed = Math.min(sh.shieldPts, dmg);
    sh.shieldPts -= absorbed; dmg -= absorbed;
    msg.push('SHIELDS ABSORB ' + Math.round(absorbed));
    if (sh.shieldPts <= 0) msg.push('SHIELDS COLLAPSED!');
  }
  if (dmg > 0 && sh.armorPts > 0) {
    const soaked = Math.min(sh.armorPts, dmg * 0.6);
    sh.armorPts -= soaked; dmg -= soaked;
    msg.push('ARMOR TAKES ' + Math.round(soaked));
  }
  if (dmg > 0) {
    sh.sys.hull -= dmg;
    msg.push('HULL -' + Math.round(dmg) + '%');
    // random system damage
    const keys = ['eng', 'shd', 'wpn', 'sen', 'life'];
    const k = keys[Math.floor(Math.random() * keys.length)];
    sh.sys[k] = Math.max(0, sh.sys[k] - dmg * 1.5);
    if (sh.sys[k] < 50) msg.push(SF.SYS_NAMES[k] + ' DAMAGED');
    // crew injury chance (only the living can be freshly wounded)
    if (Math.random() < 0.3) {
      const alive = SF.G.crew.filter(c => c.hp > 0);
      if (alive.length) {
        const c = alive[Math.floor(Math.random() * alive.length)];
        c.hp = Math.max(0, c.hp - (10 + Math.random() * 25));
        msg.push(c.role + ' INJURED');
      }
    }
  }
  SF.sfx.hit();
  return msg.join('. ');
};

SF.shipDestroyed = () => SF.G.ship.sys.hull <= 0;

// slow background repair by the engineer (armor regrowth uses titanium from cargo)
SF.tickRepairs = function (dt) {
  const G = SF.G, sh = G.ship;
  // shield recharge needs a live generator, not a live engineer
  if (sh.shieldsUp && sh.sys.shd > 20) {
    sh.shieldPts = Math.min(SF.SHIELD_PTS[sh.shield], sh.shieldPts + dt * 4 * (sh.sys.shd / 100));
  }
  // the doctor works whether or not CLAUD does, worst-injured first (as the
  // manual TREAT does), and can treat themselves
  const doc = G.crew[5];
  if (doc.hp > 0) {
    let worst = null;
    for (const c of G.crew) if (c.hp > 0 && c.hp < 100 && (!worst || c.hp < worst.hp)) worst = c;
    if (worst) worst.hp = Math.min(100, worst.hp + dt * 0.4);
  }
  const eng = G.crew[3];
  if (eng.hp <= 0) return;
  // inside the Dimming decay outpaces him: CLAUD defers all field work
  // (space.js announces the deferral on every entry and exit)
  const p = SF.shipPos();
  if (SF.inDark(p.x, p.y)) return;
  const rate = dt * 0.475;
  let busy = false;
  // "restored" is only worth reporting after a real dip: under the Dimming's
  // constant drain a system hovers just below 100 and would spam otherwise
  sh._ann = sh._ann || {};
  // the air outranks everything once it runs low (crew suffocates below 30%)
  const order = sh.sys.life < 60 ? ['life', 'eng', 'shd', 'wpn', 'sen'] : ['eng', 'shd', 'wpn', 'sen', 'life'];
  for (const k of order) {
    if (sh.sys[k] < 100) {
      if (sh.sys[k] < 90) sh._ann[k] = true;
      sh.sys[k] = Math.min(100, sh.sys[k] + rate);
      if (sh.sys[k] >= 100 && sh._ann[k]) {
        delete sh._ann[k];
        SF.log('CLAUD: ' + SF.SYS_NAMES[k] + ' RESTORED TO SPEC.', SF.P.lcyan);
      }
      busy = true;
      break; // one system at a time
    }
  }
  // the TV waits its turn behind the ship's own systems
  if (!busy && sh.tvHull < 100) {
    if (sh.tvHull < 90) sh._ann.tv = true;
    sh.tvHull = Math.min(100, sh.tvHull + rate);
    if (sh.tvHull >= 100 && sh._ann.tv) { delete sh._ann.tv; SF.log('CLAUD: TERRAIN VEHICLE RESTORED TO SPEC.', SF.P.lcyan); }
  }
  // armor regrowth: CLAUD rebuilds hull plating from TITANIUM only. Out of it,
  // he says so once; the notice re-arms after a resupply or full repair.
  if (sh.armorPts >= SF.ARMOR_PTS[sh.armor]) {
    sh._noTi = false;   // plating at spec: a future shortage may be reported anew
  } else if ((G.cargo.titanium || 0) >= 1) {
    sh._noTi = false;
    sh._armorAcc = (sh._armorAcc || 0) + rate * 2;
    if (sh._armorAcc >= 5) {
      sh._armorAcc = 0;
      G.cargo.titanium -= 1; if (G.cargo.titanium <= 0) delete G.cargo.titanium;
      sh.armorPts = Math.min(SF.ARMOR_PTS[sh.armor], sh.armorPts + 12);
    }
  } else if (!sh._noTi) {
    sh._noTi = true;
    SF.log('CLAUD: HULL PLATING BELOW SPEC. NO TITANIUM IN THE HOLD; ARMOR REGROWTH HALTED UNTIL YOU BRING SOME.', SF.P.yellow);
  }
};

// ---- mode switching ------------------------------------------------------------------
SF.setMode = function (name, arg) {
  SF.mode = SF.modes[name];
  SF.G && (SF.G.modeName = name);
  if (SF.mode.enter) SF.mode.enter(arg);
};

// ---- boot & main loop ---------------------------------------------------------------
window.addEventListener('load', function () {
  const canvas = document.getElementById('screen');
  SF.ctx = canvas.getContext('2d');
  SF.ui.init(SF.ctx);
  SF.genGalaxy();
  SF.keys = {};

  window.addEventListener('keydown', function (e) {
    SF.sfx.unlock();
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'PageUp', 'PageDown'].includes(e.key)) e.preventDefault();
    // held ENTER/SPACE must not machine-gun menus (combat, mining, dialogue)
    if (e.repeat && (e.key === 'Enter' || e.key === ' ')) return;
    // paged story flow: SPACE/ENTER releases the next page, all else waits
    if (SF.flowQ && SF.flowQ.length) {
      if (e.key === ' ' || e.key === 'Enter') SF.flowNext();
      return;
    }
    // consolidated CONTINUE: with more unread console rows than fit on one
    // screen, SPACE pages through the backlog; other input stays live and
    // SHIFT+arrows still scroll freely
    if (e.key === ' ' && SF.mode !== SF.modes.pager && SF.logUnseen() > SF.consoleRows()) {
      SF.logAdvance();
      return;
    }
    // console scrollback: SHIFT+↑/↓ (PGUP/PGDN as aliases). Not inside a
    // pager (it scrolls itself), and the landing crosshair keeps SHIFT+arrows
    // for fast movement.
    const landing = SF.mode === SF.modes.orbit && SF.mode.landing;
    let scroll = 0;
    if (e.key === 'PageUp') scroll = 1;
    else if (e.key === 'PageDown') scroll = -1;
    else if (e.shiftKey && !landing && e.key === 'ArrowUp') scroll = 1;
    else if (e.shiftKey && !landing && e.key === 'ArrowDown') scroll = -1;
    if (scroll && SF.mode !== SF.modes.pager) { SF.scrollLog(scroll); return; }
    SF.keys[e.key] = true;
    if (SF.mode && SF.mode.key) SF.mode.key(e.key);
  });
  window.addEventListener('keyup', function (e) { SF.keys[e.key] = false; });

  SF.setMode('title');

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (SF.mode) {
      if (SF.mode.tick) SF.mode.tick(dt);
      SF.ui.clear();
      if (SF.mode.draw) SF.mode.draw(dt);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
});
