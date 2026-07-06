// STARFOLD space.js: flight (interstellar + system), bridge menus, starmap, orbit
'use strict';

// ---- region helpers -------------------------------------------------------------
// spheres of influence: charted by flying them, drawn on the starmap until the
// culture's home star dies (after which its ships roam the reach as refugees)
SF.SPHERES = [
  { race: 'kvoth',   name: 'KVOTH SPHERE',       x: 125, y: 100, r: 45, flag: 'sphKvoth',   home: 1 },
  { race: 'velmarah',  name: 'VEL-MA-RAH TRADE LANES', x: 170, y: 60,  r: 20, flag: 'sphVelmarah',  home: 3 },
  { race: 'ashkaru', name: 'ASHKARU SPACE',      x: 45,  y: 148, r: 30, flag: 'sphAshkaru', home: 4 },
  { race: 'corsair', name: 'CORSAIR POCKET',     x: 110, y: 185, r: 18, flag: 'sphCorsair', home: 5 }
];
// the toll picket's post in the start system: draw, proximity trigger, and
// post-encounter stand-off all read this one record (standoff must exceed r,
// or ending the encounter drops the ship back inside the re-trigger zone)
SF.PICKET = { x: 150, y: -90, r: 55, standoff: 70 };
SF.inKvothSphere = (x, y) => SF.dist(x, y, 125, 100) < 45;

// the Lattice buys survey data ("KNOWLEDGE IS INVENTORY"): worthless inside
// their own charted sphere, worth more the farther from KV Prime the entry
// was taken, capped at 100 -- the explorer's economy
SF.surveyPrice = function (star) {
  if (SF.inKvothSphere(star.x, star.y)) return 0;
  const d = SF.dist(star.x, star.y, 118, 92);   // KV Prime
  return SF.clamp(Math.round(30 + (d - 45) * 0.7), 30, 100);
};
SF.surveyValue = function () {
  let n = 0, total = 0;
  const sv = SF.G.surveyed || {};
  for (const key in sv) {
    if (sv[key] !== 1) continue;
    n++; total += SF.surveyPrice(SF.galaxy.stars[+key.split(':')[0]]);
  }
  return { n: n, total: total };
};
SF.inTradeLanes = (x, y) => SF.dist(x, y, 170, 60) < 20;
SF.inAshkaruZone = (x, y) => SF.dist(x, y, 45, 148) < 30;
SF.inCorsairPocket = (x, y) => SF.dist(x, y, 110, 185) < 18;
SF.inDark = (x, y) => SF.dist(x, y, SF.DIM.cx, SF.DIM.cy) < SF.dimRadius(SF.G.stardate) && !(SF.G.flags.emberDelivered);

// ==================================================================================
// SPACE MODE
// ==================================================================================
SF.modes.space = {
  menu: null, menuTitle: '', onPick: null, onCancel: null,
  encTimer: 0, revealTimer: 0, coldWarned: false, heatWarned: false,

  enter(arg) {
    this.menu = null;
    this.encTimer = 5;
    // baseline the sphere we're already in, so returning to flight (from a dock
    // or orbit) doesn't re-announce a crossing that never happened
    this.sphereIn = this.currentSphere();
    if (arg && arg.msg) SF.log(arg.msg, SF.P.lcyan);
    SF.story.checkArrival();
  },

  // the charted sphere of influence the ship is currently inside, or null.
  // Only spheres the chart core has charted count (Corsair Pocket never does).
  currentSphere() {
    const p = SF.shipPos();
    // skip a sphere whose home star has died — the starmap erases it, so the
    // navigator must not still announce crossing it
    for (const sp of SF.SPHERES) if (SF.G.flags[sp.flag] && !SF.starCold(SF.galaxy.stars[sp.home]) && SF.dist(p.x, p.y, sp.x, sp.y) < sp.r) return sp;
    return null;
  },

  open(title, items, onPick, onCancel) {
    this.menu = new SF.Menu(items);
    this.menuTitle = title;
    this.onPick = onPick;
    this.onCancel = onCancel || (() => { this.menu = null; });
  },

  // ---- officer menus -------------------------------------------------------------
  officer(n) {
    const G = SF.G;
    if (n === 1) this.open('CAPTAIN', [
      { label: 'CAPTAIN\'S LOG', value: 'log' },
      { label: 'CARGO MANIFEST', value: 'cargo' },
      { label: 'JETTISON CARGO', value: 'jett' },
      { label: 'FOLD DRIVE', value: 'fold' },
      { label: 'SAVE GAME', value: 'save' },
      { label: 'SELF-DESTRUCT', value: 'boom', color: SF.P.lred }
    ], v => this.captain(v));
    if (n === 2) this.open('SCIENCE: DR. JOHNSON', [
      { label: 'SENSORS', value: 'sensors' },
      { label: 'ANALYSIS', value: 'analysis' },
      { label: 'STARMAP', value: 'map' }
    ], v => this.science(v));
    if (n === 3) this.open('NAVIGATION: ENS. LEE', [
      { label: G.insys !== null ? 'ENTER ORBIT' : 'ENTER ORBIT (NO PLANET)', value: 'orbit', disabled: G.insys === null },
      { label: 'DOCKING REQUEST', value: 'dock', disabled: G.insys === null },
      { label: (G.ship.shieldsUp ? 'LOWER' : 'RAISE') + ' SHIELDS', value: 'shields', disabled: G.ship.shield === 0 },
      { label: 'STARMAP', value: 'map' }
    ], v => this.nav(v));
    if (n === 4) this.open('ENGINEER: UNIT CLAUD', [
      { label: 'DAMAGE REPORT', value: 'rep' }
    ], v => this.engineer(v));
    if (n === 5) this.open('COMMS: LT. GONSALVES', [
      { label: 'HAIL', value: 'hail' }
    ], v => this.comms(v));
    if (n === 6) this.open('DOCTOR: DR. KERCSO', [
      { label: 'EXAMINE CREW', value: 'exam' },
      { label: 'TREAT WORST INJURY', value: 'treat' }
    ], v => this.doctor(v));
  },

  captain(v) {
    const G = SF.G;
    this.menu = null;
    if (v === 'log') {
      const lines = G.journal.length ? G.journal.flatMap(j => SF.wrap(j, 96).concat([''])) : ['The log is empty. Nothing worth recording has happened yet.', '', 'That will change.'];
      SF.modes.pager = SF.ui.pager('CAPTAIN\'S LOG: ISS VANGUARD', lines, () => SF.setMode('space'));
      SF.setMode('pager');
    }
    if (v === 'cargo') {
      const lines = [];
      lines.push('HOLD CAPACITY: ' + SF.cargoUsed() + ' / ' + SF.cargoMax() + ' M3'); lines.push('');
      for (const el of SF.ELEMENTS) if (G.cargo[el.id]) lines.push('  ' + el.name.padEnd(10) + ' ' + Math.round(G.cargo[el.id]) + ' M3');
      lines.push(''); lines.push('ARTIFACTS:');
      if (!G.artifacts.length) lines.push('  (none)');
      for (const a of G.artifacts) lines.push('  ' + SF.ARTIFACTS[a].name + (a === 'biodata' ? ': ' + (G.bioCount || 0) + ' ENTRIES' : SF.installedArtifact(a) ? ' (KEYED IN)' : ''));
      lines.push(''); lines.push('INSTALLED: ' + (['pyramid', 'phasematrix', 'chartcore'].filter(f => G.flags[f]).map(f => SF.ARTIFACTS[f].name).join(', ') || '(none)'));
      SF.modes.pager = SF.ui.pager('CARGO MANIFEST', lines, () => SF.setMode('space'));
      SF.setMode('pager');
    }
    if (v === 'jett') {
      const items = SF.ELEMENTS.filter(e => G.cargo[e.id]).map(e => ({ label: e.name + ': ' + Math.round(G.cargo[e.id]) + ' M3', value: e.id }));
      if (!items.length) { SF.log('The hold is empty. Nothing to jettison.', SF.P.dgray); return; }
      this.open('JETTISON WHAT?', items, id => {
        SF.qtyPrompt(this, 'DUMP ' + SF.EL[id].name, Math.round(G.cargo[id]), n => {
          this.menu = null;
          n = Math.min(n, Math.round(G.cargo[id] || 0));
          if (n <= 0) return;
          G.cargo[id] -= n;
          if (G.cargo[id] <= 0.01) delete G.cargo[id];
          SF.sfx.confirm();
          SF.log('JETTISONED ' + n + ' M3 ' + SF.EL[id].name + '. It tumbles away into the dark, glittering.', SF.P.yellow);
        }, () => this.captain('jett'));
      });
    }
    if (v === 'fold') {
      if (G.flags.foldRepaired) {
        if (G.insys === 12 && G.flags.emberAboard && SF.dist(G.sx, G.sy, 0, 0) < 70) {
          SF.story.finale();
        } else if (G.flags.emberAboard) {
          SF.log('THE FOLD DRIVE HUMS AROUND ITS EMBER. IT HOLDS EXACTLY ONE FOLD, AND ONE DESTINATION. THE THROAT OF THE MAW, AT 25,175.', SF.P.lmagenta);
        } else {
          SF.log('THE FOLD DRIVE IS WHOLE AGAIN, BUT EMPTY. RETURN TO THE VEIL.', SF.P.lmagenta);
        }
      } else {
        SF.log('FOLD DRIVE STATUS: FUSED. SLAGGED. UNIT CLAUD ESTIMATES REPAIR FEASIBILITY AT 0.00%. "WITH RESPECT, CAPTAIN: NOT BY ANY HAND IN THIS SHIP. PERHAPS NOT BY ANY HAND WE HAVE MET."', SF.P.lcyan);
      }
    }
    if (v === 'save') SF.save();
    if (v === 'boom') this.open('CONFIRM SELF-DESTRUCT?', [
      { label: 'NO. RESUME COURSE.', value: 'no' },
      { label: 'YES. SCUTTLE THE SHIP.', value: 'yes', color: SF.P.lred }
    ], vv => { this.menu = null; if (vv === 'yes') { SF.sfx.boom(); SF.story.gameOver('The ISS Vanguard scuttled by her own captain, far from home.\n\nThe reach keeps no record of why.'); } });
  },

  science(v) {
    const G = SF.G;
    this.menu = null;
    if (v === 'map') SF.setMode('starmap');
    if (v === 'sensors') this.sensors();
    if (v === 'analysis') {
      const items = G.artifacts.map(a => ({ label: SF.ARTIFACTS[a].name, value: a }));
      if (!items.length) { SF.log('DR. JOHNSON: "Nothing in the hold worth a spectrometer\'s time, Captain."'); return; }
      this.open('ANALYZE ARTIFACT', items, a => { this.menu = null; SF.analyzeArtifact(a); });
    }
  },

  sensors() {
    const G = SF.G;
    if (G.insys === null) {
      SF.log('SENSOR SWEEP: DEEP SPACE. POSITION ' + (SF.inDark(G.px, G.py) ? '[READINGS INVALID]' : Math.round(G.px) + ',' + Math.round(G.py)) + '.', SF.P.lcyan);
      const r = SF.dimRadius(G.stardate);
      const d = SF.dist(G.px, G.py, SF.DIM.cx, SF.DIM.cy);
      if (G.flags.dimKnown) {
        SF.log('THE DIMMING: RADIUS ' + r.toFixed(1) + ' UNITS AND GROWING. EDGE IS ' + Math.max(0, d - r).toFixed(1) + ' UNITS FROM OUR POSITION.', SF.P.lblue);
        const rate = r >= SF.DIM.accelR ? SF.DIM.accel : SF.DIM.base;
        if (G.flags.sphAshkaru) {
          SF.log('DR. JOHNSON: "At current growth the Pyre Throne has perhaps ' + Math.max(0, (33.6 - r) / rate).toFixed(1) + ' stardates. The whole reach, ' + Math.max(0, (SF.DIM.doom - r) / rate).toFixed(1) + '."', SF.P.lgray);
        } else {
          SF.log('DR. JOHNSON: "At current growth the whole reach has perhaps ' + Math.max(0, (SF.DIM.doom - r) / rate).toFixed(1) + ' stardates."', SF.P.lgray);
        }
      } else if (d < 60) {
        G.flags.dimKnown = true;
        SF.log('DR. JOHNSON: "Captain, coreward sensors show a region where the stars are simply... out. Cold cores. Frozen worlds. It has a radius, and the radius is growing."', SF.P.lcyan);
        SF.journal('Science: a growing region of DEAD, COLD STARS coreward, centered near 25,175. The locals must know more.');
      } else {
        SF.log('DR. JOHNSON: "Nothing anomalous in range. Which, given where we are, is itself an anomaly."');
      }
      return;
    }
    // in-system stellar scan
    const star = SF.galaxy.stars[G.insys];
    if (star.key === 'maw') { SF.story.mawScan(); return; }
    if (star.key === 'veil') { SF.story.veilScan(); return; }
    if (SF.starCold(star)) {
      SF.log('STELLAR SCAN: CORE TEMPERATURE NEAR BACKGROUND. FUSION HAS STOPPED. DR. JOHNSON: "Stars do not DO this, Captain. Stars cannot just... go out. And yet."', SF.P.lblue);
      if (!G.flags.dimKnown) { G.flags.dimKnown = true; SF.journal('We scanned a DEAD STAR, cold to the core. The locals call the phenomenon the Dimming.'); }
      return;
    }
    SF.log('STELLAR SCAN: CLASS ' + star.cls.cls + '. OUTPUT NOMINAL. ' + star.planets.length + ' PLANETARY BODIES.', SF.P.lcyan);
    if (SF.starAwake(star) && !G.flags['anom' + star.id]) {
      if (G.ship.scanner === 1) return;   // below resolution entirely
      if (G.ship.scanner === 2) {
        // the same reading the Vel-ma-rah got with their class 2 gear
        SF.log('DR. JOHNSON: "A flutter in the flare data... no. It does not repeat cleanly at this resolution. Logging it as an equipment malfunction." They tap the scanner housing, twice.', SF.P.yellow);
        return;
      }
      G.flags['anom' + star.id] = true;
      G.anomCount = (G.anomCount || 0) + 1;
      if (G.anomCount === 1) SF.log('DR. JOHNSON: "Odd. Micro-flare activity in a... patterned sequence. Logging it as instrument error." They do not sound convinced.', SF.P.yellow);
      else if (G.anomCount === 2) SF.log('DR. JOHNSON: "Captain, this star shows the SAME micro-flare pattern as the last one. Same phase. Two stars, light-years apart, flickering in unison. I have stopped writing \'instrument error\'."', SF.P.yellow);
      else if (!G.flags.starsAlive) {
        G.flags.starsAlive = true;
        SF.sfx.comm();
        SF.log('DR. JOHNSON, very quietly: "Captain. Stars don\'t talk. These do. The synchronized flickers, the impossible proper motion, the feeling on every world of being watched... I think the stars of this reach are ALIVE."', SF.P.white);
        SF.journal('Dr. Johnson\'s hypothesis: THE STARS OF THIS REACH ARE ALIVE. We have been searching for a hidden homeworld. Perhaps there was never a world to find.');
        SF.story.lodestarNudge();
      } else SF.log('DR. JOHNSON: "It\'s one of them. It\'s watching us watch it."', SF.P.yellow);
    }
  },

  nav(v) {
    const G = SF.G;
    this.menu = null;
    if (v === 'map') SF.setMode('starmap');
    if (v === 'shields') {
      if (G.ship.shield === 0) { SF.log('NO SHIELD GENERATOR INSTALLED.'); return; }
      G.ship.shieldsUp = !G.ship.shieldsUp;
      if (G.ship.shieldsUp) G.ship.shieldPts = Math.min(G.ship.shieldPts || 0, SF.SHIELD_PTS[G.ship.shield]);
      SF.log('SHIELDS ' + (G.ship.shieldsUp ? 'UP. Deflector wash halves sensor detection range.' : 'DOWN. Sensors at full range.'), SF.P.lcyan);
      SF.sfx.blip();
    }
    if (v === 'orbit') {
      const p = this.nearPlanet();
      if (!p) { SF.log('ENS. LEE: "No planetary body in maneuvering range, Captain."'); return; }
      SF.setMode('orbit', { star: SF.galaxy.stars[G.insys], planet: p });
    }
    if (v === 'dock') this.tryDock();
  },

  engineer(v) {
    const G = SF.G, s = G.ship;
    this.menu = null;
    const nm = SF.SYS_NAMES;
    SF.log('UNIT CLAUD DAMAGE REPORT: HULL ' + Math.round(s.sys.hull) + '%. ARMOR ' + Math.round(s.armorPts) + '/' + SF.ARMOR_PTS[s.armor] + '. TV ' + Math.round(s.tvHull) + '%.', SF.P.lcyan);
    SF.log(Object.keys(nm).map(k => nm[k] + ' ' + Math.round(s.sys[k]) + '%').join('  '), s.sys.life < 50 ? SF.P.lred : SF.P.lgray);
    SF.log('CLAUD: "Corrective Longeron Adjustment and Upkeep Droid, reporting. Field repairs proceed continuously in flight, Captain. Hull plating is yard work, beyond me out here. Armor regrowth consumes titanium from the hold. I am ' + ((G.cargo.titanium || 0) > 0 ? 'adequately supplied."' : 'OUT of titanium."'), SF.P.lcyan);
  },

  comms(v) {
    const G = SF.G;
    this.menu = null;
    // priority: toll picket > station > nothing
    if (G.insys === 0 && G.tollPicket) {
      SF.story.picketEncounter();
      return;
    }
    if (this.nearStation()) { this.tryDock(); return; }
    if (G.insys === 11) { SF.story.veilHail(); return; }
    SF.log('LT. GONSALVES: "Hailing on all frequencies... No contacts, Captain. Just the static between the stars."');
    if (G.flags.starsAlive && G.insys !== null && SF.starAwake(SF.galaxy.stars[G.insys])) {
      SF.log('...and then, for half a second, the static PULSES. Twice. Like a heartbeat answering.', SF.P.white);
    }
  },

  doctor(v) {
    const G = SF.G;
    this.menu = null;
    if (v === 'exam') {
      for (const c of G.crew) SF.log(c.role.padEnd(10) + ' ' + c.name.padEnd(16) + (c.hp <= 0 ? 'CRITICAL. STATION INFIRMARY REQUIRED' : Math.round(c.hp) + '%'), c.hp <= 0 ? SF.P.lred : c.hp < 50 ? SF.P.yellow : SF.P.lgray);
    }
    if (v === 'treat') {
      const doc = G.crew[5];
      if (doc.hp <= 0) { SF.log('The doctor is beyond treating anyone.', SF.P.lred); return; }
      let worst = null;
      for (const c of G.crew) if (c.hp > 0 && c.hp < 100 && (!worst || c.hp < worst.hp)) worst = c;
      if (!worst) { SF.log('DR. KERCSO: "Everyone is in one piece. A statistical miracle, given your flying."'); return; }
      worst.hp = Math.min(100, worst.hp + 23);
      G.stardate += 0.01;   // medicine takes days, not keystrokes
      SF.log('DR. KERCSO treats ' + worst.name + ', now at ' + Math.round(worst.hp) + '%. Days pass in the medbay.', SF.P.lgreen);
    }
  },

  // ---- proximity helpers ------------------------------------------------------------
  nearPlanet() {
    const G = SF.G;
    if (G.insys === null) return null;
    const star = SF.galaxy.stars[G.insys];
    for (const p of star.planets) {
      const pos = SF.planetPos(p, G.stardate);
      if (SF.dist(G.sx, G.sy, pos.x, pos.y) < p.size + 16) return p;
    }
    return null;
  },
  nearStation() {
    const G = SF.G;
    if (G.insys === null) return null;
    const star = SF.galaxy.stars[G.insys];
    if (!star.station) return null;
    if (SF.starCold(star)) return null; // evacuated
    const p = star.planets[star.station.planet];
    if (!p) return null;
    const pos = SF.planetPos(p, G.stardate);
    return SF.dist(G.sx, G.sy, pos.x + p.size + 18, pos.y) < 26 ? star.station : null;
  },
  tryDock() {
    const G = SF.G;
    const st = this.nearStation();
    if (!st) { SF.log('ENS. LEE: "No station within docking range."'); return; }
    if (st.race === 'kvoth' && !G.flags.ring) {
      SF.log('DOCKING REQUEST DENIED. "NO TRANSPONDER. NO ENTRY. THIS IS NOT PERSONAL. NOTHING IS."', SF.P.lcyan);
      return;
    }
    if (st.race === 'ashkaru' && !G.flags.descrambler) {
      SF.log('The Pyre Throne answers with a blast of layered war-hymn. The translator returns: [UNTRANSLATABLE]. There will be no docking negotiation in a tongue no one shares.', SF.P.lred);
      SF.descramblerNudge();
      return;
    }
    if (st.race === 'ashkaru' && G.rel.ashkaru < 10) {
      SF.log('THE PYRE THRONE DOES NOT ANSWER. Weapon batteries track the Vanguard until she stands off.', SF.P.lred);
      return;
    }
    if (G.rel[st.race] < -30) { SF.log('DOCKING DENIED. They remember what you did.', SF.P.lred); return; }
    SF.G.stardate += 0.01;
    SF.setMode('station', { station: st, starId: G.insys });
  },

  // ---- tick -----------------------------------------------------------------------
  tick(dt) {
    const G = SF.G;
    if (!G) return;
    const inSystem = G.insys !== null;

    // movement input (only when no menu is open)
    let vx = 0, vy = 0;
    if (!this.menu) {
      if (SF.keys.ArrowLeft) vx -= 1;
      if (SF.keys.ArrowRight) vx += 1;
      if (SF.keys.ArrowUp) vy -= 1;
      if (SF.keys.ArrowDown) vy += 1;
    }
    const moving = vx !== 0 || vy !== 0;

    // interstellar thrust burns the clock hard, and drive class decides how
    // long a crossing takes: the ENGINE is the voyage's real pacing item
    // (see SPOILERS.html). Drifting or thinking costs only the ambient trickle.
    G.stardate += dt * (inSystem ? 0.0006 : (moving ? 0.015 : 0.0006));

    SF.tickRepairs(dt);
    SF.story.tickEvents();

    // life support failure
    if (G.ship.sys.life < 30) {
      for (const c of G.crew) if (c.hp > 0) c.hp = Math.max(0, c.hp - dt * 0.4);
      if (Math.random() < dt * 0.1) SF.log('LIFE SUPPORT CRITICAL: the air is thin and getting thinner.', SF.P.lred);
      if (G.crew.every(c => c.hp <= 0)) { SF.story.gameOver('Life support failed. The ISS Vanguard drifts on, dutiful and empty,\nher zero-point heart still beating for no one.'); return; }
    }

    if (moving) {
      const m = Math.hypot(vx, vy); vx /= m; vy /= m;
      G.heading = Math.atan2(vy, vx);
      const effEng = Math.max(0.3, G.ship.sys.eng / 100);
      if (inSystem) {
        const spd = SF.ENGINE_SPD[G.ship.engine] * 30 * effEng;
        G.sx += vx * spd * dt; G.sy += vy * spd * dt;
      } else {
        const spd = SF.ENGINE_SPD[G.ship.engine] * effEng;
        G.px = SF.clamp(G.px + vx * spd * dt, 0, SF.SECTOR.w);
        G.py = SF.clamp(G.py + vy * spd * dt, 0, SF.SECTOR.h);
      }
    }

    if (inSystem) this.tickSystem(dt, moving);
    else this.tickInterstellar(dt, moving);

    // the cold of the Dimming (re-read insys: tickSystem may just have left the system)
    const p = SF.shipPos();
    // the navigator calls out crossings of the CHARTED spheres (the chart core
    // put them on the map); the Corsair Pocket is on no chart, hence silent
    const inSph = this.currentSphere();
    if (inSph !== this.sphereIn) {
      if (this.sphereIn) SF.log('ENS. LEE: "Leaving ' + this.sphereIn.name + ', Captain."', SF.P.dgray);
      if (inSph) SF.log('ENS. LEE: "Entering ' + inSph.name + ', Captain."', SF.P.dgray);
      this.sphereIn = inSph;
    }

    if (SF.inDark(p.x, p.y)) {
      if (!this.coldWarned) {
        this.coldWarned = true;
        SF.log('The stars are gone. All of them. Hull temperature falling. Instruments returning values that mean nothing.', SF.P.lblue);
        SF.log('The zero-point core reads NOMINAL. Everything else is guttering.', SF.P.dgray);
      }
      if (!G.ship._dimDefer && G.crew[3].hp > 0) {
        G.ship._dimDefer = true;
        SF.log('CLAUD: "Captain. Decay in this region exceeds my repair rate. Working against it would only spend the spares. Field repairs DEFERRED until we are clear of the Dimming."', SF.P.lcyan);
      }
      G.ship.shieldPts = Math.max(0, G.ship.shieldPts - dt * 2);
      const keys = ['shd', 'wpn', 'sen'];
      const k = keys[Math.floor(Math.random() * keys.length)];
      G.ship.sys[k] = Math.max(20, G.ship.sys[k] - dt * 0.5);
      G.ship.sys.life = Math.max(0, G.ship.sys.life - dt * (G.flags.emberAboard ? 0.15 : 0.5));
      if (!G.flags.dimKnown) { G.flags.dimKnown = true; SF.journal('We flew into the dark region ourselves. Stars: dead. Cold beyond instruments. We will not do that again unprepared.'); }
      // the one instrument that still tells the truth
      if (G.artifacts.includes('resonance')) {
        this.pulseT = (this.pulseT || 0) - dt;
        if (this.pulseT <= 0) {
          this.pulseT = SF.clamp(SF.dist(p.x, p.y, SF.DIM.cx, SF.DIM.cy) / 25, 0.2, 3);
          SF.sfx.blip();
        }
      }
    } else {
      this.coldWarned = false;
      if (G.ship._dimDefer) {
        G.ship._dimDefer = false;
        if (G.crew[3].hp > 0) SF.log('CLAUD: "Clear of the Dimming, Captain. Resuming deferred field repairs."', SF.P.lcyan);
      }
    }

    if (SF.shipDestroyed()) { SF.story.gameOver('Hull integrity zero. The ISS Vanguard breaks apart, so very far from Arth.'); }
  },

  tickInterstellar(dt, moving) {
    const G = SF.G;
    // reveal stars
    this.revealTimer -= dt;
    if (this.revealTimer <= 0) { this.revealTimer = 0.5; SF.revealNearbyStars(); }

    // enter a system?
    for (const s of SF.galaxy.stars) {
      if (s.dark && !(s.key === 'veil' && G.flags.veilFound) && !(s.key === 'maw' && G.flags.dimKnown)) {
        // the Veil does not register until the Lodestar is fully understood:
        // fly straight over where it hides, as if it were not there
        if (s.key === 'veil' && !G.flags.resonanceRead) continue;
        // dark bodies still catch you if you fly directly onto them
        if (SF.dist(s.x, s.y, G.px, G.py) < 1.2) { this.enterSystem(s); return; }
        continue;
      }
      if (SF.dist(s.x, s.y, G.px, G.py) < 2.0) { this.enterSystem(s); return; }
    }
    // fluxes
    SF.FLUXES.forEach((w, i) => {
      for (const end of ['a', 'b']) {
        const x = w[end + 'x'], y = w[end + 'y'];
        if (SF.dist(x, y, G.px, G.py) < 1.5) {
          if (!G.flags.pyramid) return;           // undetectable, inert
          if (this.whCool > 0) return;
          this.whCool = 3;
          const hasVeil = G.flags.phasematrix || G.artifacts.includes('phasematrix');
          if (!hasVeil) {
            SF.sfx.deny();
            SF.log('THE FLUX FLEXES AND REJECTS THE SHIP. Bare matter cannot pass. The hull GROANS. ' + SF.takeDamage(8), SF.P.lmagenta);
            G.px += (G.px - x) * 2; G.py += (G.py - y) * 2;
          } else if (!G.ship.shieldsUp) {
            if (!G.flags.phasematrix) {
              // the weaver reaches for a deflector field that is not there
              SF.sfx.deny();
              SF.log('THE FLUX FLEXES AND REJECTS THE SHIP. In the hold, the Humming Weaver SHIVERS in its crate. CLAUD: "Curious, Captain. It reached for the deflector grid. The grid was not energized. There was nothing to hold." ' + SF.takeDamage(8), SF.P.lmagenta);
              G.px += (G.px - x) * 2; G.py += (G.py - y) * 2;
            } else {
              // a phase-woven hull is ADMITTED, and the unpowered veil cannot hold the fold
              SF.sfx.boom();
              SF.story.gameOver('The flux accepts the phase-woven hull. With the deflector\nfield down, the veil has nothing to hold, and the Vanguard\nfolds wrong, somewhere between here and there.\n\nENS. LEE had asked for shields.');
              return;
            }
          } else {
            if (!G.flags.phasematrix) {
              // the "decoration" reveals itself at the door's edge
              G.flags.phasematrix = true;
              G.artifacts = G.artifacts.filter(a => a !== 'phasematrix');
              SF.sfx.comm();
              SF.log('AT THE FLUX\'S EDGE THE HUMMING WEAVER SCREAMS ONE PURE NOTE. Light runs down its filaments and REWEAVES the deflector grid around the hull. CLAUD: "Captain. The decoration is driving the deflectors. We are now, in a limited sense, not entirely here."', SF.P.lmagenta);
              SF.journal('The HUMMING WEAVER is no decoration. At the flux\'s edge it wove itself through the deflector grid: a phase-woven veil. The doors in nothing will hold us now.');
            }
            SF.sfx.warp();
            const ox = end === 'a' ? w.bx : w.ax, oy = end === 'a' ? w.by : w.ay;
            G.px = ox + 2; G.py = oy + 2;
            G.whKnown['a' + i] = true; G.whKnown['b' + i] = true;
            SF.log('THE HUMMING WEAVER SINGS. Space folds shut behind the Vanguard and opens somewhere else entirely.', SF.P.lmagenta);
            G.whUsed = G.whUsed || {};
            if (!G.whUsed[i]) {
              G.whUsed[i] = true;
              SF.log('ENS. LEE pins both mouths of the flux and draws the through-line on the starmap.', SF.P.dgray);
            }
            SF.revealNearbyStars();
          }
        }
      }
    });
    if (this.whCool > 0) this.whCool -= dt;

    // the lodestar answers its makers when carried near the hidden star
    // (only once fully analyzed: no compass before the stars-alive breakthrough)
    if (!G.flags.veilFound && G.flags.resonanceRead) {
      const d = SF.dist(G.px, G.py, 243, 12);
      if (d < 20) {
        this.veilPulseT = (this.veilPulseT || 0) - dt;
        if (this.veilPulseT <= 0) { this.veilPulseT = SF.clamp(d / 8, 0.15, 2); SF.sfx.blip(); }
      }
    }

    // random encounters
    if (moving) this.rollEncounter(dt, false);
  },

  enterSystem(s) {
    const G = SF.G;
    G.insys = s.id;
    const a = G.heading || 0;
    G.sx = -Math.cos(a) * 250; G.sy = -Math.sin(a) * 250;
    if (!G.visited[s.id]) {
      G.visited[s.id] = true; G.known[s.id] = true;
      if (!s.fixedName && !s.kvName) SF.log('DR. JOHNSON catalogues the star as ' + SF.starName(s) + '.', SF.P.dgray);
    }
    SF.log('ENTERING SYSTEM: ' + SF.starName(s) + (SF.starCold(s) ? '. THE STAR IS DEAD AND COLD.' : '.'), SF.starCold(s) ? SF.P.lblue : SF.P.lcyan);
    SF.story.enterSystem(s);
  },

  tickSystem(dt, moving) {
    const G = SF.G;
    const star = SF.galaxy.stars[G.insys];
    // leave system
    if (SF.dist(G.sx, G.sy, 0, 0) > 290) {
      // while the toll picket waits, departure is intercepted; paying,
      // destroying, or fleeing the picket all clear the way (tollPicket=false)
      if (G.insys === 0 && G.tollPicket) {
        SF.log('The patrol vessel matches the burn with insulting ease and slides between the Vanguard and open space.', SF.P.lcyan);
        SF.story.picketEncounter();
        return;
      }
      G.insys = null;
      const a = G.heading || 0;
      G.px = SF.clamp(star.x + Math.cos(a) * 2.6, 0, SF.SECTOR.w);
      G.py = SF.clamp(star.y + Math.sin(a) * 2.6, 0, SF.SECTOR.h);
      SF.log('Leaving the system. The stars of the reach spread out ahead.', SF.P.dgray);
      return;
    }
    // stellar heat
    if (!SF.starCold(star) && !star.dark) {
      const d = SF.dist(G.sx, G.sy, 0, 0);
      if (d < 44) {
        if (!this.heatWarned) { this.heatWarned = true; SF.log('WARNING: STELLAR CORONA. Hull temperature climbing fast.', SF.P.lred); }
        this.heatAcc = (this.heatAcc || 0) + dt * 18;
        if (this.heatAcc >= 10) { const dmg = this.heatAcc; this.heatAcc = 0; SF.log(SF.takeDamage(dmg), SF.P.lred); }
      } else this.heatWarned = false;
    }
    // the Maw: pull + drain + finale trigger
    if (star.key === 'maw') SF.story.mawTick(dt);
    // toll picket proximity (start system)
    if (G.insys === 0 && G.tollPicket) {
      if (SF.dist(G.sx, G.sy, SF.PICKET.x, SF.PICKET.y) < SF.PICKET.r) SF.story.picketEncounter();
    }
    if (moving) this.rollEncounter(dt, true);
  },

  encounterTable(x, y) {
    // breakdowns happen where the traffic is: busy zones carry a distress share
    if (SF.inKvothSphere(x, y)) return { rate: 1 / 34, table: [['kvothPatrol', 0.85], ['distress', 0.15]] };
    if (SF.inTradeLanes(x, y)) return { rate: 1 / 28, table: [['velmarahTrader', 0.75], ['corsair', 0.15], ['distress', 0.10]] };
    if (SF.inAshkaruZone(x, y)) {
      // mourning space stays hostile and silent; no beacons here
      const t = [['ashkRaider', 1]];
      // sold hymn intel brings hunters into mourning space
      if (SF.G.intelSold) t.push(['corsair', Math.min(0.6, SF.G.intelSold * 0.15)]);
      return { rate: 1 / 30, table: t };
    }
    if (SF.inCorsairPocket(x, y)) return { rate: 1 / 20, table: [['corsair', 0.85], ['distress', 0.15]] };
    const table = [['velmarahTrader', 0.42], ['corsair', 0.14], ['kvothPatrol', 0.12], ['whale', 0.08], ['distress', 0.16], ['drone', 0.08]];
    // refugee fleets: the Ashkaru take to the open reach once the Pyre falls
    // (the corsair den at 110,185 lies beyond the doom radius, so it never dies)
    if (SF.starCold(SF.galaxy.stars[4])) table.push(['ashkRaider', 0.18]);
    return { rate: 1 / 45, table };
  },

  rollEncounter(dt, inSystem) {
    const G = SF.G;
    if (G.insys === 11 || G.insys === 12) return;
    if (G.insys === 0 && G.tollPicket) return;
    const x = inSystem ? SF.galaxy.stars[G.insys].x : G.px;
    const y = inSystem ? SF.galaxy.stars[G.insys].y : G.py;
    if (SF.inDark(x, y)) return;
    const et = this.encounterTable(x, y);
    let rate = et.rate;
    const table = et.table;
    if (inSystem) rate *= 0.6;
    this.encTimer -= dt;
    if (this.encTimer > 0) return;
    // rate is "expected encounters per second"; per frame that is rate*dt (the
    // old *60 double-counted the framerate and made every zone fire within ~1s)
    if (Math.random() < rate * dt) {
      this.encTimer = 12;
      let roll = Math.random() * table.reduce((s, t) => s + t[1], 0);
      let pick = table[0][0];
      for (const t of table) { roll -= t[1]; if (roll <= 0) { pick = t[0]; break; } }
      if (pick === 'distress') SF.startEncounter({ scripted: 'distress' });
      else if (pick === 'drone') SF.startEncounter({ scripted: 'drone' });
      else SF.startEncounter({ ship: pick });
    }
  },

  // ---- input ------------------------------------------------------------------------
  key(k) {
    if (this.menu && SF.logBusy()) return;   // dialog box inert while the message window pages
    if (this.menu) {
      const r = this.menu.key(k);
      if (r && r.pick !== undefined) this.onPick(r.pick);
      if (r && r.cancel) this.onCancel();
      return;
    }
    if (k >= '1' && k <= '6') { SF.sfx.blip(); this.officer(+k); }
    if (k === 'Escape') this.officer(1);
    if (k === 'Enter' && SF.G.insys !== null) {
      // contextual action on whatever the hint bar says is in range
      if (this.nearStation()) { SF.sfx.blip(); this.tryDock(); return; }
      const p = this.nearPlanet();
      if (p) {
        SF.sfx.blip();
        SF.setMode('orbit', { star: SF.galaxy.stars[SF.G.insys], planet: p });
      }
    }
  },

  // ---- draw -------------------------------------------------------------------------
  draw() {
    const G = SF.G;
    if (G.insys !== null) this.drawSystem(); else this.drawInterstellar();
    const p = SF.shipPos();
    const dark = SF.inDark(p.x, p.y);
    SF.ui.drawStatus(dark ? (G.insys !== null ? 'SYSTEM: [NO DATA]' : 'DEEP SPACE ' + Math.round(Math.random() * 999) + ',' + -Math.round(Math.random() * 99)) : undefined);
    if (this.menu) { if (!SF.logBusy()) this.menu.draw(SF.L.px, SF.L.py + 140, SF.L.pw, this.menuTitle); }
    else {
      SF.ui.box(SF.L.px, SF.L.py + 140, SF.L.pw, 260, { title: 'BRIDGE', color: SF.P.dgray });
      const off = ['1 CAPTAIN', '2 SCIENCE', '3 NAVIGATION', '4 ENGINEER', '5 COMMS', '6 DOCTOR'];
      off.forEach((o, i) => SF.ui.text(SF.L.px + 16, SF.L.py + 156 + i * SF.LH, o, SF.P.lgray));
      SF.ui.text(SF.L.px + 16, SF.L.py + 156 + 7 * SF.LH, 'ARROWS: MANEUVER', SF.P.dgray);
      if (G.flags.emberAboard) SF.ui.text(SF.L.px + 16, SF.L.py + 156 + 9 * SF.LH, 'THE EMBER SINGS', SF.P.yellow);
    }
    SF.ui.drawConsole();
  },

  drawInterstellar() {
    const G = SF.G, L = SF.L;
    const SC = 16; // px per unit
    SF.ui.clipView(c => {
      c.fillStyle = '#000'; c.fillRect(L.vx, L.vy, L.vw, L.vh);
      const cx = L.vx + L.vw / 2, cy = L.vy + L.vh / 2;
      const t = performance.now() / 1000;
      // the Dimming: a lightless disc
      if (!G.flags.emberDelivered) {
        const r = SF.dimRadius(G.stardate) * SC;
        const dx = cx + (SF.DIM.cx - G.px) * SC, dy = cy + (SF.DIM.cy - G.py) * SC;
        const grad = c.createRadialGradient(dx, dy, Math.max(1, r * 0.5), dx, dy, r);
        grad.addColorStop(0, 'rgba(2,4,12,0.97)'); grad.addColorStop(1, 'rgba(2,4,12,0)');
        c.fillStyle = grad;
        c.beginPath(); c.arc(dx, dy, r, 0, 7); c.fill();
      }
      // stars
      for (const s of SF.galaxy.stars) {
        const sx = cx + (s.x - G.px) * SC, sy = cy + (s.y - G.py) * SC;
        if (sx < L.vx - 20 || sx > L.vx + L.vw + 20 || sy < L.vy - 20 || sy > L.vy + L.vh + 20) continue;
        const cold = SF.starCold(s);
        if (s.dark && !cold) {
          if (s.key === 'veil' && G.flags.veilFound) { /* drawn below */ } else if (s.key !== 'veil') continue; else continue;
        }
        if (cold || s.key === 'maw') {
          c.fillStyle = '#1c2030';
          c.beginPath(); c.arc(sx, sy, s.cls.size, 0, 7); c.fill();
          c.strokeStyle = '#2a3048'; c.stroke();
          continue;
        }
        const blink = SF.starAwake(s) && Math.sin(t * 2.2 + s.id) > 0.985 ? 0 : 1; // the stars are alive
        c.fillStyle = s.cls.color;
        if (blink) { c.beginPath(); c.arc(sx, sy, s.cls.size, 0, 7); c.fill(); }
        if (G.known[s.id] && Math.hypot(sx - cx, sy - cy) < 130) {
          c.fillStyle = SF.P.dgray; c.font = SF.FONT;
          c.fillText(SF.starName(s), sx + 8, sy - 8);
        }
      }
      if (G.flags.veilFound) {
        const s = SF.galaxy.stars[11];
        const sx = cx + (s.x - G.px) * SC, sy = cy + (s.y - G.py) * SC;
        c.fillStyle = SF.P.white; c.beginPath(); c.arc(sx, sy, 5 + Math.sin(t * 3) * 1.5, 0, 7); c.fill();
      }
      // known fluxes
      SF.FLUXES.forEach((w, i) => {
        for (const end of ['a', 'b']) {
          if (!G.whKnown[end + i] && !(G.flags.pyramid && SF.dist(w[end + 'x'], w[end + 'y'], G.px, G.py) < SF.scanRange())) continue;
          const sx = cx + (w[end + 'x'] - G.px) * SC, sy = cy + (w[end + 'y'] - G.py) * SC;
          c.strokeStyle = SF.P.lmagenta;
          c.save(); c.translate(sx, sy); c.rotate(t);
          c.strokeRect(-6, -6, 12, 12); c.restore();
        }
      });
      this.drawShip(c, cx, cy);
    });
    let hint = 'DEEP SPACE: approach a star to enter its system';
    if (SF.inDark(G.px, G.py) && G.artifacts.includes('resonance')) {
      const d = SF.dist(G.px, G.py, SF.DIM.cx, SF.DIM.cy);
      const rate = d > 60 ? 'SLOWLY' : d > 35 ? 'STEADILY' : d > 15 ? 'QUICKLY' : 'FRANTICALLY';
      hint = 'ALL INSTRUMENTS LIE. THE LODESTAR PULSES ' + rate + '. IT LEANS ' + SF.compassDir(G.px, G.py, SF.DIM.cx, SF.DIM.cy) + '.';
    } else if (SF.inDark(G.px, G.py)) {
      hint = 'THE DARK. NO STARS. INSTRUMENTS RETURNING NONSENSE.';
    } else if (G.flags.pyramid && !G.ship.shieldsUp && SF.FLUXES.some(w => SF.dist(w.ax, w.ay, G.px, G.py) < 5 || SF.dist(w.bx, w.by, G.px, G.py) < 5)) {
      hint = 'FLUX CLOSE. ENS. LEE: "Shields, Captain. Shields first."';
    } else if (!G.flags.veilFound && G.flags.resonanceRead && SF.dist(G.px, G.py, 243, 12) < 20) {
      const d = SF.dist(G.px, G.py, 243, 12);
      hint = 'THE CRYSTAL LODESTAR TREMBLES, ' + (d < 8 ? 'FRANTIC AND JOYFUL' : 'QUICK AND EAGER') + '. IT LEANS ' + SF.compassDir(G.px, G.py, 243, 12) + '.';
    }
    SF.ui.hint(hint);
  },

  drawSystem() {
    const G = SF.G, L = SF.L;
    const star = SF.galaxy.stars[G.insys];
    const cold = SF.starCold(star);
    SF.ui.clipView(c => {
      const cx = L.vx + L.vw / 2 - G.sx, cy = L.vy + L.vh / 2 - G.sy;
      const t = performance.now() / 1000;
      // background dust
      const rng = SF.mulberry32(star.seed);
      c.fillStyle = '#111';
      for (let i = 0; i < 60; i++) c.fillRect(L.vx + rng() * L.vw, L.vy + rng() * L.vh, 2, 2);
      // star
      if (star.key === 'maw') {
        c.fillStyle = '#05060c'; c.beginPath(); c.arc(cx, cy, 46, 0, 7); c.fill();
        c.strokeStyle = '#20263f'; c.lineWidth = 2 + Math.sin(t * 1.7) * 1.5;
        c.beginPath(); c.arc(cx, cy, 50 + Math.sin(t * 0.9) * 4, 0, 7); c.stroke();
      } else if (cold) {
        c.fillStyle = '#232838'; c.beginPath(); c.arc(cx, cy, 22, 0, 7); c.fill();
        c.strokeStyle = '#31395a'; c.beginPath(); c.arc(cx, cy, 24, 0, 7); c.stroke();
      } else {
        const pulse = star.key === 'veil' ? Math.sin(t * 2.4) * 4 : (SF.starAwake(star) ? Math.sin(t * 2.2) * 1.5 : 0);
        c.fillStyle = star.cls.color;
        c.beginPath(); c.arc(cx, cy, 20 + star.cls.size + pulse, 0, 7); c.fill();
        c.fillStyle = SF.P.white;
        c.beginPath(); c.arc(cx, cy, (20 + star.cls.size + pulse) * 0.55, 0, 7); c.fill();
      }
      // planets
      for (const p of star.planets) {
        c.strokeStyle = '#182028';
        c.beginPath(); c.arc(cx, cy, p.orbitR, 0, 7); c.stroke();
        const pos = SF.planetPos(p, G.stardate);
        const px = cx + pos.x, py = cy + pos.y;
        c.fillStyle = cold ? '#39415c' : SF.PLANET_TYPES[p.type].colors[0];
        c.beginPath(); c.arc(px, py, p.size, 0, 7); c.fill();
        c.fillStyle = cold ? '#4a5578' : SF.PLANET_TYPES[p.type].colors[1];
        c.beginPath(); c.arc(px - p.size * 0.25, py - p.size * 0.25, p.size * 0.55, 0, 7); c.fill();
        if (SF.dist(G.sx, G.sy, pos.x, pos.y) < 90) {
          c.fillStyle = SF.P.lgray; c.font = SF.FONT;
          c.fillText(SF.planetName(star, p), px + p.size + 6, py - 6);
        }
        // station
        if (star.station && star.planets[star.station.planet] === p && !cold) {
          const stx = px + p.size + 18, sty = py;
          c.save(); c.translate(stx, sty); c.rotate(Math.PI / 4);
          c.fillStyle = SF.RACES[star.station.race].color;
          c.fillRect(-5, -5, 10, 10); c.restore();
          if (SF.dist(G.sx, G.sy, pos.x + p.size + 18, pos.y) < 90) {
            c.fillStyle = SF.RACES[star.station.race].color;
            c.fillText(star.station.name, stx + 10, sty + 8);
          }
        }
      }
      // the Kvoth toll picket in the start system: a ship the Vanguard's size
      if (G.insys === 0 && G.tollPicket) {
        const dx = cx + SF.PICKET.x, dy = cy + SF.PICKET.y;
        SF.drawAlienShip(c, dx, dy, 'kvoth', 9);
        const known = G.flags.kvothKnown || G.flags.firstContact;
        const label = known ? 'KVOTH PATROL LATTICE' : 'UNKNOWN VESSEL';
        c.fillStyle = known ? SF.P.lcyan : SF.P.lgray;
        c.font = SF.FONT;
        c.fillText(label, dx - label.length * SF.CH / 2, dy - 18);
      }
      this.drawShip(c, L.vx + L.vw / 2, L.vy + L.vh / 2);
    });
    const p = this.nearPlanet(), st = this.nearStation();
    SF.ui.hint(st ? st.name + ' in range. ENTER: DOCK' :
      p ? SF.planetName(star, p) + ' in range. ENTER: ORBIT' :
      'SYSTEM ' + SF.starName(star) + ': fly outward to leave');
  },

  drawShip(c, x, y) {
    const a = SF.G.heading !== undefined ? SF.G.heading : -Math.PI / 2;
    c.save(); c.translate(x, y); c.rotate(a);
    c.fillStyle = SF.P.white;
    c.beginPath(); c.moveTo(10, 0); c.lineTo(-7, -6); c.lineTo(-4, 0); c.lineTo(-7, 6); c.closePath(); c.fill();
    c.restore();
    if (SF.G.ship.shieldsUp && SF.G.ship.shieldPts > 0) {
      c.strokeStyle = SF.P.lblue; c.beginPath(); c.arc(x, y, 16, 0, 7); c.stroke();
    }
  }
};

// planet position in system view
SF.planetPos = function (p, sd) {
  const a = p.ang0 + sd * p.spd * 30;
  return { x: Math.cos(a) * p.orbitR, y: Math.sin(a) * p.orbitR };
};

// procedural alien ship sprites
SF.drawAlienShip = function (c, x, y, race, s) {
  c.save(); c.translate(x, y);
  if (race === 'kvoth') {
    c.fillStyle = '#3a4a55';
    c.beginPath(); c.moveTo(-s, 0); c.lineTo(-s * 0.3, -s * 0.5); c.lineTo(s, 0); c.lineTo(-s * 0.3, s * 0.5); c.closePath(); c.fill();
    c.strokeStyle = SF.P.lcyan; c.stroke();
    c.fillStyle = SF.P.lcyan; c.fillRect(-s * 0.2, -2, s * 0.5, 4);
  } else if (race === 'ashkaru') {
    c.fillStyle = '#7a2020';
    c.beginPath(); c.moveTo(s, 0); c.lineTo(-s * 0.6, -s * 0.7); c.lineTo(-s * 0.2, 0); c.lineTo(-s * 0.6, s * 0.7); c.closePath(); c.fill();
    c.strokeStyle = SF.P.lred; c.stroke();
  } else if (race === 'velmarah') {
    c.fillStyle = '#8a6a20';
    c.beginPath(); c.ellipse(0, 0, s, s * 0.65, 0, 0, 7); c.fill();
    c.strokeStyle = SF.P.yellow; c.stroke();
    c.fillStyle = SF.P.yellow; c.beginPath(); c.arc(s * 0.4, 0, s * 0.15, 0, 7); c.fill();
  } else if (race === 'corsair') {
    c.fillStyle = '#5a3a5a';
    c.beginPath(); c.moveTo(s, 0); c.lineTo(0, -s * 0.5); c.lineTo(-s, -s * 0.3); c.lineTo(-s * 0.5, 0); c.lineTo(-s, s * 0.5); c.closePath(); c.fill();
    c.strokeStyle = SF.P.lmagenta; c.stroke();
  } else if (race === 'whale') {
    c.fillStyle = '#2a4a3a';
    c.beginPath(); c.ellipse(0, 0, s * 1.4, s * 0.8, 0.3, 0, 7); c.fill();
    c.strokeStyle = SF.P.lgreen; c.stroke();
    c.fillStyle = SF.P.lgreen; c.beginPath(); c.arc(s * 0.7, -s * 0.2, 3, 0, 7); c.fill();
  } else { // drone / unknown
    const t = performance.now() / 300;
    c.strokeStyle = SF.P.white; c.globalAlpha = 0.6 + Math.sin(t) * 0.4;
    c.strokeRect(-s * 0.4, -s * 0.4, s * 0.8, s * 0.8);
    c.rotate(Math.PI / 4);
    c.strokeRect(-s * 0.4, -s * 0.4, s * 0.8, s * 0.8);
    c.globalAlpha = 1;
  }
  c.restore();
};

// ==================================================================================
// STARMAP
// ==================================================================================
SF.modes.starmap = {
  cx: 0, cy: 0,
  enter() { const p = SF.shipPos(); this.cx = p.x; this.cy = p.y; },
  key(k) {
    const step = SF.keys.Shift ? 10 : 2;
    if (k === 'ArrowLeft') this.cx = SF.clamp(this.cx - step, 0, SF.SECTOR.w);
    if (k === 'ArrowRight') this.cx = SF.clamp(this.cx + step, 0, SF.SECTOR.w);
    if (k === 'ArrowUp') this.cy = SF.clamp(this.cy - step, 0, SF.SECTOR.h);
    if (k === 'ArrowDown') this.cy = SF.clamp(this.cy + step, 0, SF.SECTOR.h);
    if (k === 'Escape' || k === 'Enter') SF.setMode('space');
  },
  draw() {
    const G = SF.G;
    const mx = 30, my = 30, mw = SF.L.W - 60, mh = SF.L.H - 110;
    const sx = v => mx + v / SF.SECTOR.w * mw;
    const sy = v => my + v / SF.SECTOR.h * mh;
    SF.ui.box(mx - 10, my - 14, mw + 20, mh + 28, { title: 'STARMAP: VANGUARD SURVEY', color: SF.P.cyan });
    const c = SF.ctx, t = performance.now() / 1000;
    // the Dimming: the starless disc is plainly visible in the sky, always
    // drawn at its live radius; only its NAME waits for the lore
    if (!G.flags.emberDelivered) {
      const r = SF.dimRadius(G.stardate);
      c.fillStyle = 'rgba(10,14,30,0.9)';
      c.beginPath(); c.ellipse(sx(SF.DIM.cx), sy(SF.DIM.cy), r / SF.SECTOR.w * mw, r / SF.SECTOR.h * mh, 0, 0, 7); c.fill();
      c.strokeStyle = '#2a3560'; c.setLineDash([4, 4]);
      c.beginPath(); c.ellipse(sx(SF.DIM.cx), sy(SF.DIM.cy), r / SF.SECTOR.w * mw, r / SF.SECTOR.h * mh, 0, 0, 7); c.stroke();
      c.setLineDash([]);
      if (G.flags.dimKnown) SF.ui.text(SF.clamp(sx(SF.DIM.cx) - 40, mx, mx + mw - 100), SF.clamp(sy(SF.DIM.cy), my, my + mh - 16), 'THE DIMMING', SF.P.lblue);
    }
    // charted spheres of influence (fade with the culture's home star)
    for (const sp of SF.SPHERES) {
      if (!G.flags[sp.flag] || SF.starCold(SF.galaxy.stars[sp.home])) continue;
      c.strokeStyle = SF.RACES[sp.race].color;
      c.globalAlpha = 0.45; c.setLineDash([3, 5]);
      c.beginPath(); c.ellipse(sx(sp.x), sy(sp.y), sp.r / SF.SECTOR.w * mw, sp.r / SF.SECTOR.h * mh, 0, 0, 7); c.stroke();
      c.setLineDash([]); c.globalAlpha = 0.8;
      SF.ui.text(SF.clamp(sx(sp.x) - sp.name.length * SF.CH / 2, mx, mx + mw - sp.name.length * SF.CH),
        SF.clamp(sy(sp.y - sp.r) - 14, my, my + mh - 16), sp.name, SF.RACES[sp.race].color);
      c.globalAlpha = 1;
    }
    // stars
    for (const s of SF.galaxy.stars) {
      if (!G.known[s.id]) continue;
      if (s.dark && s.key === 'veil' && !G.flags.veilFound) continue;
      const cold = SF.starCold(s);
      c.fillStyle = cold ? '#39415c' : (s.key === 'veil' ? SF.P.white : s.cls.color);
      c.beginPath(); c.arc(sx(s.x), sy(s.y), s.id < 13 ? 4 : 3, 0, 7); c.fill();
      if (s.station && !cold) { c.strokeStyle = SF.RACES[s.station.race].color; c.strokeRect(sx(s.x) - 6, sy(s.y) - 6, 12, 12); }
    }
    // fluxes (traversed pairs show their through-line)
    SF.FLUXES.forEach((w, i) => {
      if ((G.whUsed || {})[i]) {
        c.strokeStyle = SF.P.lmagenta;
        c.globalAlpha = 0.35; c.setLineDash([2, 6]);
        c.beginPath(); c.moveTo(sx(w.ax), sy(w.ay)); c.lineTo(sx(w.bx), sy(w.by)); c.stroke();
        c.setLineDash([]); c.globalAlpha = 1;
      }
      for (const end of ['a', 'b']) {
        if (!G.whKnown[end + i]) continue;
        c.save(); c.translate(sx(w[end + 'x']), sy(w[end + 'y'])); c.rotate(t);
        c.strokeStyle = SF.P.lmagenta; c.strokeRect(-4, -4, 8, 8); c.restore();
      }
    });
    // ship (position unknown while inside the Dimming)
    const p = SF.shipPos();
    if (SF.inDark(p.x, p.y)) {
      SF.ui.text(mx, my + 4, 'SHIP POSITION: UNKNOWN (INSIDE THE DIMMING)', SF.P.lred);
    } else {
      c.fillStyle = SF.P.white;
      c.beginPath(); c.moveTo(sx(p.x), sy(p.y) - 6); c.lineTo(sx(p.x) - 5, sy(p.y) + 4); c.lineTo(sx(p.x) + 5, sy(p.y) + 4); c.closePath(); c.fill();
    }
    // cursor
    c.strokeStyle = SF.P.yellow;
    c.strokeRect(sx(this.cx) - 8, sy(this.cy) - 8, 16, 16);
    // info line
    let info = 'CURSOR ' + Math.round(this.cx) + ',' + Math.round(this.cy) + '   DIST ' + SF.dist(this.cx, this.cy, p.x, p.y).toFixed(1);
    let target = null;
    for (const s of SF.galaxy.stars) if (G.known[s.id] && SF.dist(s.x, s.y, this.cx, this.cy) < 4) { target = s; break; }
    if (target) info += '   ★ ' + SF.starName(target) + (SF.starCold(target) ? ' [DEAD]' : '') + (target.station && !SF.starCold(target) ? ' [' + target.station.name + ']' : '');
    SF.ui.text(mx, my + mh + 20, info, SF.P.lgray);
    SF.ui.ctext(SF.L.W / 2, SF.L.H - 24, 'ARROWS MOVE CURSOR (SHIFT=FAST)   ESC CLOSE', SF.P.dgray);
  }
};

// ==================================================================================
// ORBIT + LANDING SITE SELECTION
// ==================================================================================
SF.modes.orbit = {
  star: null, planet: null, landing: false, lx: 48, ly: 30, menu: null,

  enter(arg) {
    this.star = arg.star; this.planet = arg.planet; this.landing = false;
    this.menu = new SF.Menu([
      { label: 'SENSOR READOUT', value: 'sense' },
      { label: 'SELECT LANDING SITE', value: 'land', disabled: !SF.PLANET_TYPES[this.planet.type].landable },
      { label: 'LEAVE ORBIT', value: 'leave' }
    ]);
    if (!arg.quiet) {
      SF.log('ORBIT ESTABLISHED: ' + SF.planetName(this.star, this.planet) + '.', SF.P.lcyan);
      this.sense();
    }
    // an established orbit is a survey entry for the Kvoth data trade
    // (in-sphere worlds price at 0 and are not recorded: already on file)
    if (SF.surveyPrice(this.star) > 0) {
      SF.G.surveyed = SF.G.surveyed || {};
      const skey = this.planet.star + ':' + this.planet.idx;
      if (!SF.G.surveyed[skey]) SF.G.surveyed[skey] = 1;
    }
    SF.save(true);
  },

  sense() {
    const s = SF.planetSensors(this.star, this.planet);
    SF.log('SENSORS: CLASS ' + s.type + ', MASS ' + s.mass + ', TEMP ' + s.temp + ', ATMOSPHERE ' + s.atmo + ', BIOSIGNS ' + s.bio + ', MINERAL DENSITY ' + s.minerals + '.', SF.P.lcyan);
    if (this.planet.special === 'thorium') SF.log('DR. JOHNSON: "Actinide signatures, Captain. THORIUM. Enough to matter. Not enough to squander."', SF.P.lgreen);
    if (SF.starCold(this.star)) SF.log('DR. JOHNSON: "Surface temperature is three kelvin. This world had weather once. Now it has geometry."', SF.P.lblue);
    // structures are below class-1 resolution: only a class-2+ scanner returns them
    if (SF.G.ship.scanner >= 2 && SF.PLANET_TYPES[this.planet.type].landable) {
      const key = this.planet.star + ':' + this.planet.idx;
      const live = SF.genSurface(this.planet).sites.filter(t => !SF.G.taken[key + ':' + t.x + ':' + t.y]);
      if (live.length) SF.log('DR. JOHNSON: "Anomal' + (live.length > 1 ? 'ies' : 'y') + ' detected on the surface, Captain. Marking ' + (live.length > 1 ? 'them' : 'it') + ' on the landing grid."', SF.P.lmagenta);
    }
  },

  key(k) {
    if (this.landing) {
      const st = SF.keys && SF.keys.Shift ? 16 : 2;   // SHIFT = fast crosshair
      if (k === 'ArrowLeft') this.lx = (this.lx - st + SF.SURF_W) % SF.SURF_W;
      if (k === 'ArrowRight') this.lx = (this.lx + st) % SF.SURF_W;
      if (k === 'ArrowUp') this.ly = SF.clamp(this.ly - st, 1, SF.SURF_H - 2);
      if (k === 'ArrowDown') this.ly = SF.clamp(this.ly + st, 1, SF.SURF_H - 2);
      if (k === 'Escape') this.landing = false;
      if (k === 'Enter') {
        const surf = SF.genSurface(this.planet);
        if (surf.tiles[this.ly * SF.SURF_W + this.lx] === 0 && SF.LIQUID_TYPES.includes(this.planet.type)) {
          SF.sfx.deny(); SF.log('ENS. LEE: "Not on the ' + (this.planet.type === 'molten' ? 'lava' : 'water') + ', Captain. Respectfully."');
          return;
        }
        SF.sfx.warp();
        SF.G.stardate += 0.005;
        SF.setMode('surface', { star: this.star, planet: this.planet, lx: this.lx, ly: this.ly });
      }
      return;
    }
    if (SF.logBusy()) return;   // dialog box inert while the message window pages
    const r = this.menu.key(k);
    if (r && r.cancel) SF.setMode('space');
    if (r && r.pick === 'leave') SF.setMode('space');
    if (r && r.pick === 'sense') this.sense();
    if (r && r.pick === 'land') {
      if (SF.starCold(this.star)) SF.log('ADVISORY: frozen-dark surface. The terrain vehicle will suffer. Proceeding anyway is a choice.', SF.P.lblue);
      this.landing = true;
    }
  },

  draw() {
    const L = SF.L;
    SF.ui.clipView(c => {
      c.fillStyle = '#000'; c.fillRect(L.vx, L.vy, L.vw, L.vh);
      if (!this.landing) {
        // big planet disc
        const cx = L.vx + L.vw / 2, cy = L.vy + L.vh / 2, R = 130;
        const cols = SF.starCold(this.star) ? ['#39415c', '#4a5578', '#2c3350', '#39415c'] : SF.PLANET_TYPES[this.planet.type].colors;
        const rng = SF.mulberry32(this.planet.seed);
        c.fillStyle = cols[0]; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.fill();
        c.save(); c.beginPath(); c.arc(cx, cy, R, 0, 7); c.clip();
        for (let i = 0; i < 26; i++) {
          c.fillStyle = cols[SF.ri(rng, 1, 3)];
          c.beginPath(); c.ellipse(cx - R + rng() * R * 2, cy - R + rng() * R * 2, 12 + rng() * 44, 6 + rng() * 18, rng() * 3, 0, 7); c.fill();
        }
        c.fillStyle = 'rgba(0,0,0,0.45)'; c.beginPath(); c.arc(cx + R * 0.45, cy + R * 0.2, R, 0, 7); c.fill();
        c.restore();
      } else {
        // surface map with crosshair (offscreen-cached tiles, scaled up)
        const cold = SF.starCold(this.star);
        const surf = SF.genSurface(this.planet);
        const sc = Math.min(L.vw / SF.SURF_W, (L.vh - 30) / SF.SURF_H);
        const ox = L.vx + (L.vw - SF.SURF_W * sc) / 2, oy = L.vy + 4;
        c.imageSmoothingEnabled = false;
        c.drawImage(SF.surfMapCanvas(this.planet, cold), ox, oy, SF.SURF_W * sc, SF.SURF_H * sc);
        // orbital scan returns: mineral blips and structure returns
        const key = this.planet.star + ':' + this.planet.idx;
        surf.deposits.forEach((d, i) => {
          if ((SF.G.mined[key] || []).includes(i)) return;
          c.fillStyle = SF.EL[d.el].color;
          c.fillRect(ox + d.x * sc - 1, oy + d.y * sc - 1, 3, 3);
        });
        if (SF.G.ship.scanner >= 2) for (const s of surf.sites) {
          if (SF.G.taken[key + ':' + s.x + ':' + s.y]) continue;
          const bl = Math.sin(performance.now() / 200) > 0;
          if (bl) { c.fillStyle = SF.P.lmagenta; c.fillRect(ox + s.x * sc - 3, oy + s.y * sc - 3, 7, 7); }
        }
        c.strokeStyle = SF.P.white; c.lineWidth = 2;
        c.strokeRect(ox + this.lx * sc - 5, oy + this.ly * sc - 5, 10, 10);
      }
    });
    SF.ui.drawStatus('ORBIT: ' + SF.planetName(this.star, this.planet));
    if (this.landing) {
      SF.ui.box(SF.L.px, SF.L.py + 140, SF.L.pw, 120, { title: 'SITE SELECT' });
      SF.ui.text(SF.L.px + 14, SF.L.py + 156, 'ARROWS: MOVE (SHIFT=FAST)', SF.P.lgray);
      SF.ui.text(SF.L.px + 14, SF.L.py + 156 + SF.LH, 'ENTER: DESCEND', SF.P.lgray);
      SF.ui.text(SF.L.px + 14, SF.L.py + 156 + SF.LH * 2, 'ESC: ABORT', SF.P.lgray);
    } else if (!SF.logBusy()) this.menu.draw(SF.L.px, SF.L.py + 140, SF.L.pw, 'ORBIT');
    SF.ui.drawConsole();
  }
};

// pager passthrough mode (registered dynamically by ui.pager users)
SF.modes.pager = null;
