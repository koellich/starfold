// STARFOLD story.js: title/intro/help, sites & artifacts, events, judgment, finale
'use strict';

SF.story = {};

// ==================================================================================
// TITLE / INTRO / HELP
// ==================================================================================
SF.modes.title = {
  menu: null,
  odePre: 'An ode to ',
  odeLink: 'STARFLIGHT',
  odePost: ' · BINARY SYSTEMS · 1986',
  wikiUrl: 'https://en.wikipedia.org/wiki/Starflight',
  linkRect() {
    const len = (this.odePre + this.odeLink + this.odePost).length;
    const x = SF.L.W / 2 - (len * SF.CH) / 2 + this.odePre.length * SF.CH;
    return { x: x, y: 218, w: this.odeLink.length * SF.CH, h: 20 };
  },
  enter() {
    this.menu = new SF.Menu([
      { label: 'CONTINUE', value: 'cont', disabled: !SF.hasSave() },
      { label: 'NEW VOYAGE', value: 'new' },
      { label: 'OPERATIONS MANUAL', value: 'help' }
    ]);
    // the game's only mouse affordance: STARFLIGHT in the ode line opens its
    // Wikipedia page; client coords are mapped through the CSS-scaled canvas
    if (!this.linkBound) {
      this.linkBound = true;
      const canvas = document.getElementById('screen');
      const hit = e => {
        if (SF.mode !== this) return false;
        const r = canvas.getBoundingClientRect(), l = this.linkRect();
        const x = (e.clientX - r.left) * SF.L.W / r.width;
        const y = (e.clientY - r.top) * SF.L.H / r.height;
        return x >= l.x && x <= l.x + l.w && y >= l.y && y <= l.y + l.h;
      };
      canvas.addEventListener('click', e => { if (hit(e)) window.open(this.wikiUrl, '_blank', 'noopener'); });
      canvas.addEventListener('mousemove', e => { canvas.style.cursor = hit(e) ? 'pointer' : ''; });
    }
  },
  key(k) {
    const r = this.menu.key(k);
    if (!r || r.pick === undefined) return;
    if (r.pick === 'new') { SF.newGame(); SF.logClear(); SF.setMode('intro'); }
    if (r.pick === 'cont') {
      if (SF.load()) { SF.logClear(); SF.log('Voyage resumed. Stardate ' + SF.G.stardate.toFixed(2) + '.', SF.P.lcyan); SF.setMode('space'); }
    }
    if (r.pick === 'help') {
      SF.modes.pager = SF.ui.pager('OPERATIONS MANUAL', SF.HELP_LINES, () => SF.setMode('title'));
      SF.setMode('pager');
    }
  },
  draw() {
    const c = SF.ctx, t = performance.now() / 1000;
    // starfield
    const rng = SF.mulberry32(42);
    for (let i = 0; i < 140; i++) {
      const x = rng() * SF.L.W, y = rng() * SF.L.H;
      c.fillStyle = [SF.P.dgray, SF.P.lgray, SF.P.white][SF.ri(rng, 0, 2)];
      if (Math.sin(t * 1.5 + i) > -0.95) c.fillRect(x, y, 2, 2);
    }
    c.textAlign = 'center';
    c.font = 'bold 64px "Courier New", monospace';
    c.fillStyle = SF.P.lcyan;
    c.fillText('S T A R F O L D', SF.L.W / 2, 150);
    c.font = 'bold 20px "Courier New", monospace';
    c.fillStyle = SF.P.lgray;
    c.fillText('THE VOYAGE OF THE ISS VANGUARD', SF.L.W / 2, 190);
    c.textAlign = 'left';
    const ode = this.odePre + this.odeLink + this.odePost;
    const ox = SF.L.W / 2 - (ode.length * SF.CH) / 2, l = this.linkRect();
    SF.ui.text(ox, 220, this.odePre, SF.P.dgray);
    SF.ui.text(ox + (this.odePre.length + this.odeLink.length) * SF.CH, 220, this.odePost, SF.P.dgray);
    SF.ui.text(l.x, 220, this.odeLink, SF.P.cyan);
    c.fillStyle = SF.P.cyan;
    c.fillRect(l.x, 236, l.w, 1);
    this.menu.draw(SF.L.W / 2 - 140, 300, 280, null);
    SF.ui.ctext(SF.L.W / 2, SF.L.H - 96, '© 2026 FLORIAN KÖLLICH · florian@koellich.com', SF.P.dgray);
    SF.ui.ctext(SF.L.W / 2, SF.L.H - 78, 'GNU GPL v3 · github.com/koellich/starfold', SF.P.dgray);
    SF.ui.ctext(SF.L.W / 2, SF.L.H - 60, 'NOT AFFILIATED WITH ELECTRONIC ARTS · ALL TRADEMARKS BELONG TO THEIR RESPECTIVE OWNERS', SF.P.dgray);
    SF.ui.ctext(SF.L.W / 2, SF.L.H - 40, 'ARROWS + ENTER', SF.P.dgray);
    SF.ui.text(SF.L.W - 16 - ('v' + SF.VERSION).length * SF.CH, SF.L.H - 24, 'v' + SF.VERSION, SF.P.dgray);
  }
};

SF.modes.intro = {
  page: 0,
  enter() { this.page = 0; SF.sfx.warp(); },
  key(k) {
    if (k !== 'Enter' && k !== ' ' && k !== 'Escape') return;
    this.page++;
    SF.sfx.blip();
    if (this.page >= SF.INTRO_PAGES.length) {
      SF.sfx.alert();
      SF.log('EMERGENCY POWER RESTORED. POSITION: UNKNOWN. STARCHARTS: USELESS. FOLD DRIVE: DESTROYED.', SF.P.lred);
      SF.log('PROXIMITY ALERT: VESSEL ON INTERCEPT COURSE. SMALL. FAST.', SF.P.lred);
      SF.journal('The Fold Drive malfunctioned on its maiden voyage. We are lost in an unknown reach with no charts and no way home. The engines need no fuel, at least. Something small and fast is already coming for us.');
      SF.setMode('space');
    }
  },
  draw() {
    const lines = SF.INTRO_PAGES[Math.min(this.page, SF.INTRO_PAGES.length - 1)];
    SF.ui.box(60, 60, SF.L.W - 120, SF.L.H - 160, { title: 'ISS VANGUARD: MISSION RECORD', color: SF.P.cyan });
    lines.forEach((l, i) => SF.ui.text(100, 100 + i * (SF.LH + 4), l, i === 0 ? SF.P.lcyan : SF.P.lgray));
    SF.ui.ctext(SF.L.W / 2, SF.L.H - 70, '· ENTER ·', SF.P.dgray);
  }
};

// ==================================================================================
// ARRIVAL + TIMED EVENTS
// ==================================================================================
// the toll picket's forced encounter: one definition for its four trigger
// sites (timed contact, comms hail, proximity, system-edge interception)
SF.story.picketEncounter = function () {
  SF.startEncounter({ ship: 'kvothPatrol', scripted: 'first' });
};

// the stars-alive breakthrough points back at the crystal: without this
// nudge a player who analyzed the Lodestar early would never re-analyze
SF.story.lodestarNudge = function () {
  if (SF.G.artifacts.includes('resonance') && !SF.G.flags.resonanceRead)
    SF.log('DR. JOHNSON: "And the Lodestar, Captain. The key that rings for nothing habitable. If the stars are alive, I finally know what it is ringing FOR. I want it on the bench again."', SF.P.white);
};

SF.story.checkArrival = function () {
  const G = SF.G;
  if (!G.flags.arrivalShown) {
    G.flags.arrivalShown = true;
    G.flags.firstContactAt = G.stardate + 0.015;
  }
};

SF.story.tickEvents = function () {
  const G = SF.G;
  // forced first contact shortly after the intro
  if (!G.flags.metPicket && !G.flags.firstContact && G.flags.firstContactAt && G.stardate >= G.flags.firstContactAt && G.insys === 0 && G.modeName === 'space') {
    SF.story.picketEncounter();
    return;
  }
  // the toll picket does not wait forever: past its patience it breaks station
  // -- unless thorium sits in the hold or the TV bay, which reads as
  // compliance in progress and pins it in place
  if (G.tollPicket && G.flags.tollDeadline && G.stardate >= G.flags.tollDeadline
      && !(G.cargo.thorium || (G.tvCargo && G.tvCargo.thorium))) {
    G.tollPicket = false;
    SF.log('LT. GONSALVES: "The Kvoth picket has broken station, Captain. Outbound, unhurried. The invoice, I suspect, remains open."', SF.P.lgray);
    SF.journal('The Kvoth toll patrol stopped waiting and left the start system. The toll went unpaid.');
  }
  if (G.flags.emberDelivered) return;
  const r = SF.dimRadius(G.stardate);
  // the moment the Pyre falls is recorded whether or not anyone hears it
  // (evac_4 only marks the broadcast); the ending reads this one flag
  if (!G.flags.pyreFell && SF.starCold(SF.galaxy.stars[4])) G.flags.pyreFell = true;
  // station evacuations
  for (const s of SF.galaxy.stars) {
    if (!s.station) continue;
    if (SF.starCold(s) && !G.flags['evac_' + s.id]) {
      // the flag marks the broadcast heard, not the star died: a player who
      // has not yet learned of the Dimming hears it later, not never
      if (G.flags.dimKnown || G.known[s.id]) {
        G.flags['evac_' + s.id] = true;
        SF.sfx.somber();
        SF.log('WIDE-BAND BROADCAST: the star of ' + s.station.name + ' has gone dark. The station is being abandoned. ' +
          (s.station.race === 'ashkaru' ? 'The Ashkaru channels carry one long, furious hymn... and then silence.' :
           s.station.race === 'kvoth' ? 'The Kvoth transmission is a single line: "ENTRY CLOSED. REMAINDER RELOCATED."' :
           'The Vel-ma-rah do not sing about it at all, which is worse.'), SF.P.lblue);
        SF.journal('The Dimming has taken ' + s.station.name + '. Its people are refugees now.');
      }
    }
  }
  // escalation notices
  if (r > SF.DIM.accelR && !G.flags.dimAccel && G.flags.dimKnown) {
    G.flags.dimAccel = true;
    SF.log('DR. JOHNSON: "Captain, the Dimming\'s growth curve just bent upward. Whatever is happening out there is happening faster."', SF.P.lblue);
    SF.journal('The Dimming is accelerating.');
  }
  if (r > SF.DIM.doom * 0.75 && !G.flags.dimPanic && G.flags.dimKnown) {
    G.flags.dimPanic = true;
    SF.log('Every channel in the reach is full of the same thing now: departure schedules, prayers, and arithmetic.', SF.P.lblue);
  }
  // the end of everything
  if (r >= SF.DIM.doom) {
    SF.story.gameOver('One by one, faster and faster, the stars of the reach gutter out.\n\nOn the last warm world, the last choir sings to a black sky.\nThe Vanguard\'s zero-point heart keeps beating, a lone warm thing\nin an ocean of cold, but there is no one left to trade with,\nno one left to save, and no door home.\n\nTHE DIMMING HAS TAKEN THE REACH.');
  }
};

SF.story.enterSystem = function (star) {
  const G = SF.G;
  if (star.key === 'veil' && !G.flags.veilFound && G.flags.resonanceRead) {
    G.flags.veilFound = true;
    SF.sfx.comm();
    SF.log('This star is on no chart: not yours, not the Kvoth\'s, not anyone\'s. And there are NO PLANETS. No debris ring. No comet halo. Nothing.', SF.P.white);
    SF.log('A star with no family, scrubbed from every map. DR. JOHNSON: "Captain... systems don\'t come this clean. Someone TIDIED here."', SF.P.white);
    SF.journal('Found the uncharted star ("THE VEIL"). NO planets, no homeworld at all. The star itself pulses... regularly. Science should scan it. Comms should hail it.');
  }
  if (star.key === 'maw' && !G.flags.mawSeen) {
    G.flags.mawSeen = true;
    SF.log('There is a thing at the center of this system that is not a star. It is a hole shaped like one. The viewport polarizers keep trying to correct for it and failing.', SF.P.lblue);
    SF.journal('Reached the MAW, the heart of the Dimming. An un-star. It drinks light, heat, and instrument readings.');
  }
};

// ==================================================================================
// SURFACE SITES
// ==================================================================================
SF.story.siteInteract = function (surf, site) {
  const G = SF.G;
  const tkey = surf.minedKey() + ':' + site.x + ':' + site.y;
  if (G.taken[tkey]) { SF.log('Nothing more here but worked stone and wind.', SF.P.dgray); return; }
  const comms = G.crew[4];

  if (site.kind === 'ruin') {
    if (comms.hp <= 0) { SF.log('The walls are covered in dead glyphs. Without the comms officer, they stay dead.', SF.P.dgray); return; }
    G.taken[tkey] = true;
    SF.sfx.comm();
    if (site.clue === 'clueRuin1') {
      G.flags.clueRuin1 = true;
      SF.log('RUINS: a city older than the glyphs written on it. Lt. Gonsalves translates, slowly:', SF.P.lmagenta);
      SF.log('"WE SOUGHT THE WATCHERS\' CITY FOR NINE GENERATIONS. THERE IS NO CITY. THE ELDERS WROTE: THEY DID NOT BUILD HOMES. THEY KINDLED THEM. TWO HUNDRED, TOWARD THE DAWN."', SF.P.lmagenta);
      SF.journal('Ruin inscription #1: "They did not build homes. They KINDLED them. TWO HUNDRED, toward the dawn."');
    } else if (site.clue === 'clueRuin2') {
      G.flags.clueRuin2 = true;
      SF.log('RUINS: a palace, fused to glass on one side. Lt. Gonsalves translates:', SF.P.lmagenta);
      SF.log('"THE WATCHERS\' EYES ARE EVERYWHERE AND NOWHERE WARM. WHEN OUR LAST KING DEMANDED AN AUDIENCE OF THEM, THE SKY ITSELF DECLINED. TOWARD THE DEEP, COUNT..." The rest of the wall is fused glass. Whatever number followed went with the fire.', SF.P.lmagenta);
      SF.journal('Ruin inscription #2: "The sky itself declined." And: "toward the deep, count..." The number that followed is fused into the glass, unreadable.');
    } else {
      G.flags.clueRuin3 = true;
      SF.log('RUINS: an observatory. Every instrument aimed at the sky. Every record burned, except the wall:', SF.P.lmagenta);
      SF.log('"COUNT THE FIRES OF HEAVEN. THEN COUNT AGAIN. THE COUNT CHANGES. NO ONE BELIEVES THE COUNTERS. BENEATH THE RED STAR, THE KEY-OF-SEEING WAITS."', SF.P.lmagenta);
      SF.journal('Ruin inscription #3: "Count the fires of heaven. The count CHANGES." And: "beneath the RED STAR, the key-of-seeing waits."');
    }
    if (G.flags.clueRuin1 && G.flags.clueRuin2 && G.flags.clueRuin3 && !G.flags.vaultHint) {
      G.flags.vaultHint = true;
      SF.log('ENS. LEE: "A number, two bearings, a color. And a burned gap where the second number should be. The builders weren\'t poets, Captain. They were navigators. I\'d stake my commission the stones are a course. We will have to fly the part the fire took."', SF.P.yellow);
      SF.journal('All three inscriptions recovered. Lee is certain they assemble into a course to the vault-world, minus one number the fire took. The reading, and the searching, are ours to do.');
    }
    // the temptation in the walls: nobody alive to object, except the machine
    SF.log('In the wall niches, beside the writing: burial crystals. Grave-goods of a dead people.', SF.P.lmagenta);
    SF.log('UNIT CLAUD: "Captain. I have observed that most organic species value the peace of their dead. I wish it recorded that I disagree with what you are considering."', SF.P.lcyan);
    surf.menu = new SF.Menu([
      { label: 'LEAVE THE DEAD BE', value: 'gravesLeave' },
      { label: 'TAKE THE GRAVE-GOODS', value: 'gravesTake', color: SF.P.lred }
    ]);
    return;
  }

  if (site.kind === 'vault') {
    G.taken[tkey] = true;
    G.artifacts.push('pyramid');
    SF.sfx.jingle();
    SF.log('A vault of seamless black stone, open exactly wide enough for one visitor. Inside, on a plinth: a PYRAMID, palm-sized, heavier than it should be.', SF.P.lmagenta);
    SF.log('The last inscription: "THE PYRAMID OPENS THE EYE. THE EYE IS A DOOR. THE DOOR IS NOT OURS. WE WENT TO ASK THE STARS FOR MERCY. IF YOU READ THIS, THEY DID NOT ANSWER US. PERHAPS THEY WILL ANSWER YOU."', SF.P.lmagenta);
    SF.journal('Recovered the PYRAMID DEVICE from the vault-world. "The pyramid opens the eye. The eye is a door." Science should analyze it.');
    return;
  }

  if (site.kind === 'drone') {
    G.taken[tkey] = true;
    G.artifacts.push('resonance');
    SF.sfx.comm();
    SF.log('The wreck is here: the Kvoth\'s "unregistered drone", half-buried in ice. It is not wreckage so much as a shed skin. At its heart, still warm after sixty-one cycles: a crystal the size of a fist, pulsing patiently. Dr. Johnson watches it a long moment and names it: "Lodestar."', SF.P.white);
    SF.journal('Recovered the CRYSTAL LODESTAR from the ancient drone wreck, half-buried in the frozen dark deep inside the Dimming. It pulses... patiently, like a hailing signal. Science should analyze it.');
    return;
  }

  if (site.kind === 'debris') {
    G.taken[tkey] = true;
    G.artifacts.push(site.art);
    SF.sfx.confirm();
    SF.log('DEBRIS FIELD: someone died here a very long time ago. Among the bones of their camp: ' + SF.ARTIFACTS[site.art].name + '.', SF.P.lmagenta);
    return;
  }
};

// ==================================================================================
// ARTIFACT ANALYSIS
// ==================================================================================
SF.analyzeArtifact = function (id) {
  const G = SF.G;
  const A = SF.ARTIFACTS[id];
  SF.log('ANALYSIS OF ' + A.name + ': ' + A.desc, SF.P.lcyan);
  if (id === 'pyramid' && !G.flags.pyramid) {
    G.flags.pyramid = true;
    G.artifacts = G.artifacts.filter(a => a !== 'pyramid');
    SF.log('CLAUD wires the pyramid into the sensor grid. Immediately, the display stipples with faint FLUXES: doors in the void that were always there, unseen.', SF.P.lmagenta);
    SF.journal('PYRAMID DEVICE installed. Gravitic fluxes are now visible to our sensors when in scanner range.');
    SF.revealNearbyStars();
  }
  if (id === 'phasematrix' && !G.flags.phasematrix) {
    SF.log('DR. JOHNSON: "Filament weave, self-tensioning, in perfect balance. It hums at 44 hertz and it does NOTHING, Captain. No emissions, no fields, no interface. The Ashkaru call it the fairest thing in creation. I have stared at it for three hours and I see wire and a hum. As an instrument: useless. As art: I must be missing something."', SF.P.lgray);
    if (G.flags.pyramid) SF.log('They pause. "One oddity. Its hum shifts, a fraction of a hertz, whenever the sensor grid paints a gravitic flux. Filed under: coincidence." They do not sound convinced.', SF.P.lgray);
  }
  if (id === 'descrambler' && !G.flags.descrambler) {
    G.flags.descrambler = true;
    G.artifacts = G.artifacts.filter(a => a !== 'descrambler');
    SF.log('CLAUD turns it over twice, then splices it into the translation matrix, the only socket it fits. Nothing obvious happens. The matrix hums, one shade brighter than before.', SF.P.yellow);
    SF.journal('Installed the YELLOW DESCRAMBLER into the translation matrix. Dr. Johnson\'s guess: it wants to sit between a signal and a listener. Which signal remains to be seen.');
  }
  if (id === 'chartcore' && !G.flags.chartcore) {
    G.flags.chartcore = true;
    G.artifacts = G.artifacts.filter(a => a !== 'chartcore');
    let n = 0;
    for (const s of SF.galaxy.stars) if ((s.kvName || s.fixedName) && !s.dark && !G.known[s.id]) { G.known[s.id] = true; n++; }
    // the chart carries the reach's political geography: the charted spheres and
    // their named systems. The Corsair Pocket is on nobody's chart.
    G.flags.sphKvoth = G.flags.sphVelmarah = G.flags.sphAshkaru = true;
    SF.log('CHART CORE INSTALLED: ' + n + ' named systems and the charted spheres of influence (Kvoth, Vel-ma-rah, Ashkaru) added to the starmap. The Corsair Pocket appears on no chart.', SF.P.lcyan);
  }
  if (id === 'resonance') {
    if (G.flags.starsAlive) {
      if (!G.flags.resonanceRead) {
        G.flags.resonanceRead = true;
        SF.log('DR. JOHNSON: "It\'s not tuned to any planetary frequency, Captain. It\'s tuned to a STELLAR CORE. Taken with everything else, the synchronized flickers, the moving stars... someone doesn\'t LIVE ON a world at all. And this is the key to their door."', SF.P.white);
        SF.log('And then, at one word spoken aloud on the bridge, the Lodestar FLARES in answer: RHAN FAYR. A name, and a door — though where that door stands, it will not say.', SF.P.white);
        SF.journal('The CRYSTAL LODESTAR is tuned to a stellar core: a hailing key for a living star that no chart will hold. It answers to the name RHAN FAYR. Where to find it, we do not yet know.');
      } else SF.log('The Lodestar pulses, patient as ever, ringing for the star it named: RHAN FAYR.', SF.P.white);
    } else {
      SF.log('DR. JOHNSON: "It repeats. Endlessly. Like a phone left ringing for ten thousand years. But I can\'t tell what it\'s ringing FOR. The target frequency matches nothing... habitable."', SF.P.lgray);
    }
  }
  if (id === 'sunstone') SF.log('DR. JOHNSON: "It\'s warm. Radiologically inert, and WARM. I have no theory. The Ashkaru would burn a fleet to have this back. And maybe that\'s the analysis, Captain."', SF.P.yellow);
  if (id === 'astrolabe') SF.log('DR. JOHNSON: "Brass, tin, a sliver of magnetite. It is a compass, Captain. A broken one, from somewhere with a deeply confusing magnetic field. The Bazaar saw us coming."', SF.P.lgray);
  if (id === 'silentbell') SF.log('DR. JOHNSON: "The clapper stops a millimeter short of the rim. Every swing. Deliberate craftsmanship in the service of nothing at all. As an instrument: a paperweight with ceremony."', SF.P.lgray);
  if (id === 'weepstone') SF.log('DR. JOHNSON: "Porous basalt, wicking moisture out of the cargo-bay air. It does not grieve, Captain. It leaks."', SF.P.lgray);
  if (id === 'ring') SF.log('It broadcasts one pulse, endlessly: PAID. PAID. PAID.', SF.P.lgray);
};

// ==================================================================================
// THE VEIL: SCAN, HAIL, JUDGMENT
// ==================================================================================
SF.story.veilScan = function () {
  const G = SF.G;
  SF.log('STELLAR SCAN: class G. Output nominal. Age... the instruments return an age GREATER than the galaxy\'s. Dr. Johnson runs it three times.', SF.P.white);
  if (G.flags.resonanceRead) {
    SF.log('And then the pattern registers: the star\'s micro-flares pulse in EXACTLY the rhythm of the Crystal Lodestar. Call... and answer. It has been answering the whole time.', SF.P.white);
    SF.journal('The Veil star pulses in the same rhythm as the Lodestar. It is not a beacon TO them. It IS them. HAIL THE STAR (5: COMMS).');
  } else {
    SF.log('The star pulses with a slow, deliberate rhythm. It resembles nothing so much as... a hailing pattern, waiting for the counter-sign.', SF.P.white);
    SF.journal('The Veil star pulses like a hail awaiting a counter-sign. We are missing something... some key.');
  }
};

SF.story.veilHail = function () {
  const G = SF.G;
  if (!G.flags.resonanceRead) {
    SF.log('LT. GONSALVES hails, every band, every protocol. The star burns on. The silence is total... and attentive, like a held breath.', SF.P.white);
    return;
  }
  SF.startEncounter({ scripted: 'veil' });
};

// judgment resolution, called from encounter mode
SF.story.judge = function () {
  const G = SF.G;
  const good = G.deeds.filter(d => d.v > 0), bad = G.deeds.filter(d => d.v < 0);
  SF.flowStart();   // long text: released one console page per SPACE
  SF.log('The star\'s light dims, gathers, and READS you: every course, every shot, every kindness, weighed in an instant that lasts an hour.', SF.P.white);
  for (const d of good.slice(-4)) SF.log('  ◆ ' + d.t + '.', SF.P.lgreen);
  for (const d of bad.slice(-4)) SF.log('  ◆ ' + d.t + '.', SF.P.lred);
  const slaughtered = G.deeds.filter(d => d.t === 'Destroyed a Vel-ma-rah trader').length;
  if (slaughtered > 0) {
    SF.log('RHAN FAYR: "You believed the clouds did not notice, little vessel. The clouds did not. WE did. ' + slaughtered + (slaughtered > 1 ? ' caravels' : ' caravel') + ', unarmed and full of song, opened for the metal in their skins. The strong feeding on the gentle is the Hunger\'s own arithmetic. We have watched it eat this reach for an age. It does not come home with you."', SF.P.white);
  }
  // the word is kept: caravel blood forfeits the way home, whatever else the ledger holds
  if (G.virtue >= 4 && slaughtered === 0) {
    G.flags.judged = true;
    G.flags.foldRepaired = true;
    G.flags.emberAboard = true;
    SF.sfx.jingle();
    SF.log('RHAN FAYR: "The ledger the Kvoth keep in numbers, we keep in light. Yours is bright enough to trust. Come into our fire, little vessel. This will not hurt. It will only be impossible."', SF.P.white);
    SF.log('The star ENFOLDS the Vanguard. There is no heat. In the engine bay, the slagged Fold Drive un-melts, re-weaves, and at its core they set a seed of living starfire. THE EMBER. The whole ship rings like a struck bell.', SF.P.yellow);
    SF.log('RHAN FAYR: "One fold remains in it, aimed into the very throat of the Hunger, at the heart of the great dark, where the light of this reach goes to be drunk. The birth-surge of the new star will carry you home. Inside the Cold your instruments will lie. FOLLOW THE KEY. Go well, little vessel. All of us are watching now."', SF.P.white);
    SF.journal('JUDGED WORTHY. The Fold Drive is REPAIRED and rebuilt around THE EMBER, a seed of Rhan Fayr starfire. THE PLAN: fly into the Dimming to its heart, the MAW (instruments will lie: follow the Lodestar\'s pulse), reach the throat, ENGAGE THE FOLD DRIVE. The star born inside the Maw will end the Dimming, and its birth-surge will carry us HOME.');
    SF.save(true);
    SF.flowNext();
  } else {
    // the judges are not cruel: the reach will not die for one ship's record.
    // The Ember is given regardless. Only the way home is withheld.
    G.flags.judged = true;
    G.flags.foldRepaired = true;
    G.flags.emberAboard = true;
    G.flags.homeForfeit = true;
    SF.sfx.somber();
    if (!G.deeds.length) SF.log('RHAN FAYR: "Your ledger is EMPTY, little vessel. A reach cried out around you, and you crossed it without once reaching back. Indifference casts a shadow too. We watched all of it. All the nothing."', SF.P.white);
    else if (slaughtered > 0 && G.virtue >= 4) SF.log('RHAN FAYR: "There is kindness on your ledger, and we have weighed it. But the clouds\' dying song is on it too, and some entries do not balance. We watched all of it."', SF.P.white);
    else SF.log('RHAN FAYR: "Your record holds too much shadow, little vessel. We will not pretend otherwise. We watched all of it."', SF.P.white);
    SF.log('RHAN FAYR: "And yet the reach must not die for what you are. We would be poor judges if we let a million fires gutter to punish one small cold one. Take the Ember. Carry it true."', SF.P.white);
    SF.log('The star ENFOLDS the Vanguard. In the engine bay the slagged Fold Drive un-melts, re-weaves, and at its core they set a seed of living starfire. THE EMBER. The ship rings like a struck bell, one tone lower than joy.', SF.P.yellow);
    SF.log('RHAN FAYR: "But know this, and carry it also: the fold will spend itself utterly on the seed. Nothing will remain to throw you home. The way home is forfeit. Forever. You chose this reach with your deeds, little vessel. Now it keeps you."', SF.P.white);
    SF.journal('JUDGED, and found wanting. They gave us the Ember anyway; the reach will not pay for our record. But the fold will spend EVERYTHING on the seed: THE WAY HOME IS FORFEIT, FOREVER. The errand stands: carry the Ember into the throat of the Maw at the Dimming\'s heart (follow the Lodestar). We will save a reach that is now, for always, our home.');
    SF.save(true);
    SF.flowNext();
  }
};

// ==================================================================================
// THE MAW
// ==================================================================================
SF.story.mawScan = function () {
  SF.log('SCAN RESULT: negative mass. Negative age. Negative LUMINOSITY, which Dr. Johnson says three times and then stops saying anything.', SF.P.lblue);
  SF.log('DR. JOHNSON: "It isn\'t a thing, Captain. It\'s an appetite with an address."', SF.P.lblue);
};

SF.story.mawTick = function (dt) {
  const G = SF.G;
  if (G.flags.emberDelivered) return;
  const d = SF.dist(G.sx, G.sy, 0, 0);
  // the drain
  G.ship.shieldPts = Math.max(0, G.ship.shieldPts - dt * 6);
  G.ship.sys.life = Math.max(0, G.ship.sys.life - dt * (G.flags.emberAboard ? 0.4 : 1.5));
  if (d < 150 && !G.flags.emberAboard) {
    G.ship.sys.hull -= dt * 2.5;
    if (Math.random() < dt * 0.2) SF.log('The Maw pulls. Hull plates POP in the cold. There is nothing here for us. Not yet.', SF.P.lblue);
  }
  if (d < 70 && G.flags.emberAboard && !G.flags.throatShown) {
    G.flags.throatShown = true;
    SF.sfx.alert();
    SF.log('THE EMBER BLAZES in the engine bay. And ahead, the un-star... OPENS. A throat of absolute nothing, waiting.', SF.P.yellow);
    SF.log('CLAUD: "FOLD SOLUTION LOCKED, CAPTAIN. WHENEVER YOU ARE READY. IT HAS BEEN AN HONOR."  (1: CAPTAIN > FOLD DRIVE)', SF.P.yellow);
  }
};

// ==================================================================================
// FINALE & ENDINGS
// ==================================================================================
SF.story.finale = function () {
  SF.G.flags.emberDelivered = true;
  SF.sfx.warp();
  SF.setMode('ending');
};

SF.modes.ending = {
  page: 0, pages: [],
  enter() {
    const G = SF.G;
    const coldStars = SF.galaxy.stars.filter(s => SF.dist(s.x, s.y, SF.DIM.cx, SF.DIM.cy) < SF.dimRadius(G.stardate)).length;
    const days = (G.stardate - SF.START_SD).toFixed(1);
    const pyreStood = !G.flags.pyreFell;   // the finale beat the Dimming to Ashkar
    this.page = 0;
    this.pages = [
      [
        'THE FOLD',
        '',
        'The drive fires once: the only fold it has, aimed',
        'down a throat of absolute nothing.',
        '',
        'For one instant the Vanguard is everywhere the Hunger',
        'has ever been: every drained star, every frozen world,',
        'every silence. The crew hears, very faintly, singing.',
        '',
        'Then the Ember leaves the ship like a held breath',
        'released...'
      ],
      [
        'IGNITION',
        '',
        'A star is born inside the Maw.',
        '',
        'The Hunger closes around the seed of fire and finds',
        'that some things, swallowed, do not end. They begin.',
        '',
        'Across the reach, guttering stars steady. Frozen skies',
        'over ' + coldStars + ' dead systems begin, impossibly, to warm.'
      ].concat(pyreStood ? [
        'The Ashkaru sun flares once, like a fist raised. And',
        'from the Pyre Throne the choirs answer: the Ashkaru',
        'and their offspring will sing war-hymns of praise for',
        'millennia to come, of the ISS VANGUARD, that so',
        'valiantly kept their Flame from the Dimming.',
        ''
      ] : [
        'The Ashkaru sun flares once, like a fist raised.',
        ''
      ]).concat(G.flags.homeForfeit ? [
        'And the birth-surge rises like a tide... and parts around',
        'the Vanguard, gentle as a hand steadying a lamp.',
        'She stays. As promised. As judged.'
      ] : [
        'And the birth-surge takes the Vanguard and THROWS her,',
        'along a fold of light, out of the reach entirely.'
      ]),
      this.epiloguePage(G, days),
      [
        'ISS VANGUARD: FINAL LOG ENTRY',
        '',
        'Voyage duration: ' + days + ' stardates in an uncharted reach.',
        'Deeds weighed by Those Who Watch: ' + G.deeds.length + '.',
        'Verdict: ' + (G.flags.homeForfeit ? 'WANTING, YET THE REACH IS SAVED' : G.virtue >= 8 ? 'BRIGHT' : G.virtue >= 4 ? 'WORTHY' : 'SUFFICIENT') + '.',
        '',
        (G.flags.homeForfeit ? 'Overhead, where a hunger used to be, there is a newborn'
                             : 'Somewhere impossibly far away, there is a newborn star'),
        (G.flags.homeForfeit ? 'star. The Vel-ma-rah are already'
                             : 'where a hunger used to be. The Vel-ma-rah are already'),
        'composing songs about it. The Kvoth have entered it',
        'in the ledger under a single word: BALANCED.',
        '',
        '',
        '                 T H E   E N D'
      ]
    ];
    SF.sfx.jingle();
  },
  epiloguePage(G, days) {
    if (G.flags.homeForfeit) {
      return ['THE REACH', '',
        'There is no blue-green world in the viewport. There is',
        'Kvoth arithmetic on one channel, Vel-ma-rah gossip on two,',
        'and somewhere sunward a choir singing a young star up',
        'over what used to be called the Dimming.',
        '',
        'The crew does not talk about Earth. Some doors close so',
        'slowly you only hear the latch.',
        '',
        'They fly on. There is trade to run, worlds thawing,',
        'a reach full of strangers who will never know what the',
        'Vanguard carried into the dark for them.',
        '',
        'Home is a direction now. It is no longer a destination.'];
    }
    const p = ['HOME', ''];
    p.push('When the light fades, there is a blue-green world in the');
    p.push('viewport, and a moon, and a voice on the emergency band');
    p.push('saying "...say again, Vanguard? You are FOUR HUNDRED');
    p.push('YEARS of flight time off your..." and then just cheering.');
    p.push('');
    if (G.virtue >= 8) {
      p.push('They come home heroes twice over: once for the voyage,');
      p.push('and once, though Earth will never fully believe it, for');
      p.push('a reach of strangers and living stars saved from the');
      p.push('dark. In time the Fold Drive is rebuilt, understood,');
      p.push('and given freely to every race of the New Empire.');
      p.push('Distance stops being an argument. A golden age dawns:');
      p.push('of compassion, of peace, of worlds tended, not spent.');
    } else if (G.virtue >= 4) {
      p.push('They come home changed. The captain files a report that');
      p.push('reads like myth and tests like fact. But the Fold Drive');
      p.push('never fires again: too costly, too unreliable, too');
      p.push('strange to rebuild, the project is quietly shelved.');
      p.push('The New Empire works hard at a better future, and');
      p.push('stumbles on the old stones: greed, ego, history');
      p.push('repeating. It will be a thousand years before Mankind');
      p.push('is ready to try again.');
    } else {
      p.push('They come home. The report is thin in places: there are');
      p.push('things the captain does not say, and deeds the crew do');
      p.push('not mention. But the stars let them go, and that is a');
      p.push('kind of forgiveness.');
    }
    p.push('');
    p.push('On clear nights, in the northeast sky, one faint star');
    p.push('blinks. Twice. Like a heartbeat.');
    p.push('');
    p.push('Astronomers file it under: UNRESOLVED.');
    return p;
  },
  key(k) {
    if (k !== 'Enter' && k !== ' ') return;
    SF.sfx.blip();
    this.page++;
    if (this.page >= this.pages.length) {
      try { localStorage.removeItem(SF.SAVE_KEY); } catch (e) {}
      SF.setMode('title');
    }
  },
  draw() {
    const lines = this.pages[Math.min(this.page, this.pages.length - 1)];
    SF.ui.box(60, 50, SF.L.W - 120, SF.L.H - 140, { title: 'STARFOLD', color: SF.P.yellow });
    lines.forEach((l, i) => SF.ui.text(100, 90 + i * (SF.LH + 4), l, i === 0 ? SF.P.yellow : SF.P.lgray));
    SF.ui.ctext(SF.L.W / 2, SF.L.H - 60, '· ENTER ·', SF.P.dgray);
  }
};

// ==================================================================================
// GAME OVER
// ==================================================================================
SF.story.gameOver = function (text) {
  SF.setMode('gameover', text);
};
SF.modes.gameover = {
  text: '',
  enter(text) { this.text = text || 'The voyage ends here.'; SF.sfx.somber(); },
  key(k) { if (k === 'Enter' || k === 'Escape') SF.setMode('title'); },
  draw() {
    SF.ui.box(80, 100, SF.L.W - 160, SF.L.H - 240, { title: 'THE VOYAGE ENDS', color: SF.P.lred });
    const lines = this.text.split('\n');
    lines.forEach((l, i) => SF.ui.text(120, 150 + i * (SF.LH + 4), l, SF.P.lgray));
    SF.ui.ctext(SF.L.W / 2, SF.L.H - 120, 'A saved game may yet exist. · ENTER ·', SF.P.dgray);
  }
};
