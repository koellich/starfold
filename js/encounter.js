// STARFOLD encounter.js: ship encounters, comms/postures/topics, combat, trade
'use strict';

// pick a dialogue line from a pool, honoring req/once gates. Clue lines first.
SF.getDialogLine = function (race, topic) {
  const G = SF.G;
  const pool = (SF.DIALOG[race] && SF.DIALOG[race][topic]) || [];
  const usable = pool.filter(l => {
    if (typeof l === 'string') return true;
    if (l.req && !l.req(G)) return false;
    if (l.once && G.flags[l.once]) return false;
    return true;
  });
  if (!usable.length) return { text: '...' };
  const gated = usable.filter(l => typeof l !== 'string' && (l.once || l.act));
  const pick = gated.length ? gated[0] : usable[Math.floor(Math.random() * usable.length)];
  if (typeof pick === 'string') return { text: pick };
  if (pick.once) G.flags[pick.once] = true;
  return pick;
};

SF.deliverLine = function (race, topic) {
  const line = SF.getDialogLine(race, topic);
  SF.sfx.comm();
  SF.log(SF.RACES[race].name + ': ' + line.text, SF.RACES[race].color);
  // only the Kvoth anomaly line gives the epicenter; other races give flavour
  // that must not de-cloak the Maw or unlock the Maw/scar rumors
  if (topic === 'anomaly' && race === 'kvoth' && !SF.G.flags.dimKnown) {
    SF.G.flags.dimKnown = true;
  }
  if (line.journal) SF.journal(line.journal);
  return line;
};

SF.relDispo = function (race) {
  const G = SF.G;
  if (race === 'kvoth' && !G.flags.ring) return 'hostile';
  const r = G.rel[race];
  return r < -30 ? 'hostile' : r < 10 ? 'wary' : r < 40 ? 'neutral' : 'friendly';
};

// the Ashkaru tongue is opaque to every translator until the descrambler is installed
SF.canUnderstand = race => race !== 'ashkaru' || !!SF.G.flags.descrambler;

// the uninstalled curio reacts audibly to a live Ashkaru signal: the one nudge
// toward Dr. Johnson's bench
SF.descramblerNudge = function () {
  if (SF.G.artifacts.includes('descrambler') && !SF.G.flags.descrambler)
    SF.log('In the hold, the yellow curio HUMS against its crate, in time with the transmission. DR. JOHNSON: "That thing is listening, Captain. I want it on my bench."', SF.P.yellow);
};

SF.startEncounter = function (opts) {
  if (SF.G.modeName === 'encounter') return;
  SF.setMode('encounter', opts);
};

SF.modes.encounter = {
  def: null, race: null, dispo: 'wary', scripted: null, variant: 0,
  eShield: 0, eArmor: 0, menu: null, menuTitle: '', onPick: null,
  posture: 'friendly', hailed: false, postureReacted: false,
  playerFired: false, enemyFleeing: false, fleeT: 0, fireT: 0, evading: false,
  missileCd: 0, over: false, commBudget: 0, channelClosed: false,
  gambitDone: false,

  enter(opts) {
    this.scripted = opts.scripted || null;
    this.playerFired = false; this.enemyFleeing = false; this.hailed = false;
    this.postureReacted = false; this.over = false; this.evading = false;
    this.fireT = 4; this.missileCd = 0;
    this.commBudget = 2 + Math.floor(Math.random() * 4); this.channelClosed = false;
    this.gambitDone = false; this.enemyDead = false; this.intelSoldNow = false;
    this.wpnCd = 0; this.posture = 'friendly';   // reset per encounter (don't carry the last one over)
    const G = SF.G;

    if (this.scripted === 'distress') {
      // the plague ship appears at most 3 times per voyage
      this.variant = Math.floor(Math.random() * ((G.plagueCount || 0) >= 3 ? 2 : 3));
      if (this.variant === 2) G.plagueCount = (G.plagueCount || 0) + 1;
      this.def = SF.SHIPS[['velmarahTrader', 'velmarahTrader', 'ashkRaider'][this.variant]];
      this.race = this.def.race; this.dispo = 'wary';
      SF.sfx.alert();
      SF.log('DISTRESS BEACON: ' + ['a Vel-ma-rah caravel drifts with cold engines.', 'an escape pod tumbles through the dark, transponder shrieking.', 'an Ashkaru warbrand hangs dead in space, hull painted with fresh glyphs nobody can read. Bio-sensors say the ship is full of fever.'][this.variant], SF.P.yellow);
      if (this.variant === 2) {
        if (SF.canUnderstand('ashkaru')) {
          SF.log('LT. GONSALVES: "The descrambler whirs, beeps twice, and settles. The glyphs come up clear as day, Captain."', SF.P.lgray);
          SF.log('LT. GONSALVES: "The hull glyphs read: PLAGUE ABOARD. CAST OUT, THAT THE FLAME STAY CLEAN. DO NOT MOURN US. A quarantine exile, Captain. They send their sick into the dark, far from the Pyre."', SF.P.lred);
        } else {
          SF.log('LT. GONSALVES: "The translator gets nothing off those glyphs. The structure repeats, like a warning. A quarantine mark, maybe. Or a curse on whoever comes close. I could be wrong about both, Captain."', SF.P.lgray);
          SF.descramblerNudge();
        }
      }
      this.mainMenu();
      return;
    }
    if (this.scripted === 'drone') {
      this.def = SF.SHIPS.watcher; this.race = 'rhanfayr'; this.dispo = 'wary';
      SF.sfx.comm();
      SF.log('CONTACT: small, fast, impossibly old. It holds station exactly off the bow, as if it were waiting for this appointment.', SF.P.white);
      this.mainMenu();
      return;
    }
    if (this.scripted === 'veil') {
      this.def = Object.assign({}, SF.SHIPS.watcher, { label: 'THE LIVING STAR' });
      this.race = 'rhanfayr'; this.dispo = 'friendly'; this.hailed = true;
      SF.sfx.comm();
      SF.log('LT. GONSALVES keys the Lodestar\'s pulse into the transmitter and sends it back at the star.', SF.P.lgray);
      SF.log('For three heartbeats, nothing. Then the ENTIRE STAR dims by one percent. Politely, the way a giant lowers its voice indoors.', SF.P.white);
      const pool = SF.DIALOG.rhanfayr.hail.friendly;
      SF.log('RHAN FAYR: ' + pool[0], SF.P.white);
      if (!G.flags.veilContact) {
        G.flags.veilContact = true;
        SF.journal('CONTACT. The star IS the Rhan Fayr, or the Rhan Fayr are the star; even they seem to find the distinction quaint. We may speak with them. And they say they have been watching everything.');
      }
      this.mainMenu();
      return;
    }
    this.def = SF.SHIPS[opts.ship];
    this.race = this.def.race;
    if (this.scripted === 'first') {
      G.flags.metPicket = true;
      // a picket is paid to hold station, not to chase: fixed escape odds
      this.def = Object.assign({}, this.def, { fleeChance: 0.35 });
      if (!G.flags.kvothKnown && !G.flags.firstContact) this.def.label = 'UNKNOWN VESSEL';
    }
    this.eShield = this.def.shield; this.eArmor = this.def.armor;
    this.dispo = this.scripted === 'first' ? 'wary' : (this.race ? SF.relDispo(this.race) : 'wary');
    if (this.race === 'corsair' && this.dispo === 'hostile') this.dispo = SF.G.rel.corsair > -30 ? 'wary' : 'hostile';

    SF.sfx.alert();
    if (this.scripted === 'first') {
      SF.log('It is a small ship, hardly larger than the Vanguard herself: gray lattice, no markings, not one wasted line. A scan beam crawls over the hull like a cold hand.', SF.P.lcyan);
      if (!G.flags.firstContact) { this.convoNode('start'); return; }
      SF.log('THE PATROL VESSEL HOLDS STATION, exact as a ledger line. It is waiting to be paid.', SF.P.lcyan);
    } else {
      SF.log('CONTACT: ' + this.def.label + '. Disposition reads ' + this.dispo.toUpperCase() + '.', this.dispo === 'hostile' ? SF.P.lred : SF.P.yellow);
      if (this.race === 'kvoth' && this.dispo === 'hostile' && !G.flags.ring) {
        SF.log('KVOTH: NO TRANSPONDER DETECTED. REMOVAL PROTOCOL ENGAGED.', SF.P.lcyan);
      }
      if (this.race === 'corsair' && this.dispo !== 'friendly') {
        SF.log('CORSAIR: "Cargo and credits, tub. Or we open you up and count it ourselves."', SF.P.lmagenta);
      }
    }
    this.mainMenu();
  },

  // ---- menus -----------------------------------------------------------------------
  open(title, items, onPick) {
    this.menu = new SF.Menu(items); this.menuTitle = title; this.onPick = onPick;
  },

  mainMenu() {
    const G = SF.G;
    const items = [];
    if (this.def === SF.SHIPS.whale) {
      items.push({ label: 'SCAN THE CREATURE', value: 'scanwhale' });
      if (G.ship.laser > 0 || G.ship.missile > 0) items.push({ label: 'OPEN FIRE', value: 'firewhale', color: SF.P.lred });
      items.push({ label: 'WITHDRAW QUIETLY', value: 'leave' });
      this.open('IMMENSE LIFEFORM', items, v => this.pick(v));
      return;
    }
    if (this.scripted === 'drone') {
      items.push({ label: 'SCAN IT', value: 'scandrone' });
      items.push({ label: 'HAIL IT', value: 'haildrone' });
      items.push({ label: 'LEAVE', value: 'leave' });
      this.open('UNKNOWN OBJECT', items, v => this.pick(v));
      return;
    }
    if (this.scripted === 'distress') {
      if (this.variant === 0) {
        items.push({ label: 'GIVE 5 M3 TITANIUM (PARTS)', value: 'giveparts', disabled: (G.cargo.titanium || 0) < 5 });
      } else if (this.variant === 1) {
        items.push({ label: 'TAKE POD ABOARD', value: 'takepod', disabled: !!G.flags.podAboard });
      } else {
        items.push({ label: 'SEND THE DOCTOR ACROSS', value: 'helpplague', disabled: G.crew[5].hp <= 0 });
        items.push({ label: 'WAIT, THEN STRIP THE WRECK', value: 'lootplague', color: SF.P.lred });
      }
      items.push({ label: 'LEAVE THEM', value: 'abandon', color: SF.P.dgray });
      this.open('DISTRESS CALL', items, v => this.pick(v));
      return;
    }
    if (this.scripted === 'veil') {
      items.push({ label: 'COMMUNICATE', value: 'comms' });
      if (!G.flags.judged) items.push({ label: 'SUBMIT TO JUDGMENT', value: 'judgment', color: SF.P.yellow });
      else items.push({ label: 'ERRAND: THE HUNGER\'S THROAT', value: 'x', disabled: true });
      items.push({ label: 'LEAVE', value: 'leave' });
      this.open('THE LIVING STAR', items, v => this.pick(v));
      return;
    }
    items.push(this.channelClosed
      ? { label: 'COMMUNICATE (CHANNEL CLOSED)', value: 'x', disabled: true }
      : { label: 'COMMUNICATE', value: 'comms' });
    // any Lattice vessel settles the toll for thorium in hand, but never for
    // a ship that has fired on the Kvoth
    if (this.race === 'kvoth' && !G.flags.ring && !G.flags.kvothFired)
      items.push({ label: 'PAY THE TOLL (' + SF.TOLL + ' M3 THORIUM)', value: 'paytoll', disabled: (G.cargo.thorium || 0) < SF.TOLL });
    if (this.race === 'ashkaru' && G.artifacts.includes('sunstone')) items.push({ label: 'RETURN THE SUNSTONE', value: 'sunstone', color: SF.P.yellow });
    items.push({ label: 'COMBAT', value: 'combat' });
    if (this.race === 'velmarah' && this.dispo !== 'hostile') items.push({ label: 'TRADE CARGO', value: 'trade' });
    if (this.race === 'corsair' && this.dispo !== 'hostile') items.push({ label: 'BLACK MARKET', value: 'market' });
    if (this.race === 'corsair' && this.dispo !== 'hostile' && G.flags.podAboard) items.push({ label: 'SELL THE PASSENGER (3000 CR)', value: 'sellpod', color: SF.P.lred });
    if (this.race === 'corsair' && this.dispo !== 'friendly' && !this.playerFired) items.push({ label: 'PAY TRIBUTE', value: 'tribute' });
    items.push({ label: this.dispo === 'hostile' ? 'BREAK OFF (FLEE)' : 'LEAVE', value: this.dispo === 'hostile' ? 'flee' : 'leave' });
    this.open(this.def.label, items, v => this.pick(v));
  },

  commsMenu() {
    if (!SF.canUnderstand(this.race)) {
      // no shared language: you can transmit at them, and that is all
      this.open('COMMUNICATIONS', [
        { label: this.hailed ? 'TRANSMIT AGAIN' : 'HAIL', value: 'hail' },
        { label: 'CLOSE CHANNEL', value: 'back' }
      ], v => this.pick(v));
      return;
    }
    const items = [
      { label: 'POSTURE: ' + this.posture.toUpperCase(), value: 'posture' },
      { label: this.hailed ? 'STATEMENT' : 'HAIL', value: 'hail' }
    ];
    if (this.hailed) {
      items.push({ label: 'ASK: THEMSELVES', value: 't_themselves' });
      items.push({ label: 'ASK: THIS REGION', value: 't_region' });
      items.push({ label: 'ASK: OTHER RACES', value: 't_others' });
      items.push({ label: 'ASK: THE ANCIENT WATCHERS', value: 't_watchers' });
      items.push({ label: 'ASK: THE DIMMING', value: 't_anomaly' });
      if (this.race === 'kvoth') items.push({ label: 'ASK: TRADE & THE TOLL', value: 't_trade' });
      else items.push({ label: 'ASK: TRADE', value: 't_trade' });
      if (this.race === 'velmarah')
        items.push({ label: 'SHARE A STORY', value: 'story', disabled: !SF.velmarahStories().length });
      if (this.race === 'corsair')
        items.push({ label: SF.GAMBITS.corsair.drink.label, value: 'drink', disabled: SF.G.credits < SF.GAMBITS.corsair.drink.cost });
      if (this.race === 'corsair' && SF.G.flags.ashUnderstood)
        items.push({ label: 'SELL HYMN INTEL (900 CR)', value: 'intel', disabled: this.intelSoldNow, color: SF.P.lred });
      if (this.race === 'corsair' && SF.G.flags.yarnAuralite && !SF.G.flags.contract)
        items.push({ label: 'ASK FOR WORK', value: 'contract', color: SF.P.lred });
      if (this.race === 'corsair' && SF.G.flags.sunstoneOffer && !SF.G.flags.sunstone && !SF.G.flags.sunstoneReturned)
        items.push({ label: 'BUY THE STOLEN RELIC (20 M3 IRIDIUM)', value: 'buystone', disabled: (SF.G.cargo.iridium || 0) < 20, color: SF.P.yellow });
    }
    items.push({ label: 'CLOSE CHANNEL', value: 'back' });
    this.open('COMMUNICATIONS', items, v => this.pick(v));
  },

  // ---- first-contact negotiation (the toll patrol's "archival" protocol) ------------
  revealKvoth() {
    if (!SF.G.flags.kvothKnown) {
      SF.G.flags.kvothKnown = true;
      this.def.label = SF.SHIPS.kvothPatrol.label;
    }
  },

  convoNode(id) {
    const G = SF.G;
    const node = SF.FIRST_CONTACT[id];
    if (node.act === 'reveal') this.revealKvoth();
    SF.sfx.comm();
    const who = () => G.flags.kvothKnown ? 'KVOTH' : 'THE VESSEL';
    for (const l of node.k) {
      // the sensor record reads the ship as she is, not as she launched
      let t = l;
      if (t.includes('ONE SURVEY LASER') && (G.ship.laser > 1 || G.ship.missile > 0))
        t = t.replace('ONE SURVEY LASER', G.ship.missile > 0 ? 'LASERS AND TORPEDOES' : 'AN UPGRADED SURVEY LASER');
      if (t.includes('ONE LASER, RATED FOR MINERAL ASSAY') && (G.ship.laser > 1 || G.ship.missile > 0))
        t = t.replace('ONE LASER, RATED FOR MINERAL ASSAY', G.ship.missile > 0 ? 'LASERS AND TORPEDOES' : 'AN UPGRADED SURVEY LASER');
      if (t.includes('YOUR SHIELDS: ABSENT') && G.ship.shield > 0)
        t = t.replace('YOUR SHIELDS: ABSENT', 'YOUR SHIELDS: CLASS ' + G.ship.shield + '. INSUFFICIENT');
      SF.log(who() + ': ' + t, SF.P.lcyan);
    }
    if (node.crew) for (const l of node.crew) SF.log(l, SF.P.lgray);
    if (node.act === 'warnshot') {
      SF.sfx.laser();
      SF.log('A beam as wide as a city block crosses the bow, close enough to blister the paint. ' + SF.takeDamage(6), SF.P.lred);
    }
    if (node.act === 'scorn') SF.addRel('kvoth', -5);
    if (node.act === 'toll') {
      if (!G.flags.kvothKnown) {
        SF.log('THE VESSEL: FOR THE RECORD: WE ARE KVOTH. ENTER THE NAME CORRECTLY. IT WILL APPEAR ON YOUR INVOICES.', SF.P.lcyan);
        this.revealKvoth();
      }
      G.flags.firstContact = true;
      G.flags.tollDeadline = G.stardate + 0.5;   // half a year of patience (~20 min of flight)
      SF.journal('KVOTH TOLL: deliver ' + SF.TOLL + ' M3 of THORIUM to the patrol vessel holding station in this system. In exchange: passage. They will not wait forever.');
      SF.save(true);
      this.mainMenu();
      return;
    }
    // an option can carry a req gate (e.g. no pleading poverty with a full hold)
    const opts = node.opts.filter(o => !o.req || o.req(G));
    this.open('RESPOND', opts.map((o, i) => ({ label: o.t, value: i })), i => {
      SF.log('YOU: ' + opts[i].t, SF.P.white);
      this.convoNode(opts[i].next);
    });
  },

  // each statement/question costs patience; at zero they close the channel.
  // Returns true if the channel just closed (and the main menu is already up).
  spendComm() {
    if (this.scripted === 'veil') return false;   // the Living Star is not on the clock
    this.commBudget--;
    if (this.commBudget > 0) return false;
    this.channelClosed = true;
    // the signoff would bury the answer the player just paid for; hold the
    // parting words behind an acknowledgment so the last transmission stays
    // readable for as long as the captain wants to look at it
    this.open('SIGNAL FADING', [{ label: 'CONTINUE', value: 'go' }], () => {
      if (!SF.canUnderstand(this.race)) SF.log(SF.UNTRANSLATABLE.signoff, SF.P.lred);
      else SF.log(SF.RACES[this.race].name + ': ' + SF.SIGNOFF[this.race], SF.RACES[this.race].color);
      SF.log('CHANNEL CLOSED. They have said all they will say... this time.', SF.P.dgray);
      this.mainMenu();
    });
    return true;
  },

  // the Kvoth interrogate back: one reciprocal query per encounter, precision rewarded
  kvothQuery() {
    this.gambitDone = true;
    const pool = SF.GAMBITS.kvoth.queries;
    const q = pool[Math.floor(Math.random() * pool.length)];
    SF.sfx.comm();
    SF.log('KVOTH: ' + q.q, SF.P.lcyan);
    this.open('RESPOND', q.opts.map((o, i) => ({ label: o.t, value: i })), i => {
      const o = q.opts[i];
      SF.log('YOU: ' + o.t, SF.P.white);
      SF.sfx.comm();
      SF.log('KVOTH: ' + o.reply, SF.P.lcyan);
      if (o.good) { SF.addRel('kvoth', 2); this.commBudget++; }
      else SF.addRel('kvoth', -2);
      this.commsMenu();
    });
  },

  // the Ashkaru test strangers: match their fire or be ash. A bold answer can
  // stand a hostile warbrand down mid-fight.
  challenge() {
    this.gambitDone = true;
    const pool = SF.GAMBITS.ashkaru.challenges;
    const ch = pool[Math.floor(Math.random() * pool.length)];
    SF.sfx.comm();
    SF.log('ASHKARU: ' + ch.c, SF.P.lred);
    this.open('RESPOND', ch.opts.map((o, i) => ({ label: o.t, value: i })), i => {
      const o = ch.opts[i];
      SF.log('YOU: ' + o.t, SF.P.white);
      SF.sfx.comm();
      SF.log('ASHKARU: ' + o.reply, SF.P.lred);
      if (o.kind === 'bold') {
        SF.addRel('ashkaru', 3);
        if (this.dispo === 'hostile') { this.dispo = 'wary'; SF.log(SF.GAMBITS.ashkaru.standdown, SF.P.lgray); }
      } else if (o.kind === 'meek') SF.addRel('ashkaru', -3);
      else SF.addRel('ashkaru', 1);
      this.commsMenu();
    });
  },

  combatMenu() {
    const G = SF.G;
    this.open('COMBAT', [
      { label: 'FIRE LASER', value: 'laser', disabled: G.ship.laser === 0 || G.ship.sys.wpn < 15 || this.wpnCd > 0 },
      { label: 'FIRE MISSILE', value: 'missile', disabled: G.ship.missile === 0 || G.ship.sys.wpn < 15 || this.missileCd > 0 || this.wpnCd > 0 },
      { label: 'EVASIVE PATTERN', value: 'evade' },
      { label: 'BREAK OFF (FLEE)', value: 'flee' },
      { label: 'BACK', value: 'back' }
    ], v => this.pick(v));
  },

  // ---- actions ---------------------------------------------------------------------
  pick(v) {
    const G = SF.G;
    switch (v) {
      case 'comms': {
        if (this.scripted === 'first') {
          // the picket is a toll booth, not a lore dispenser: it can be
          // revisited at will, so it must not undercut the patrol encounters
          SF.sfx.comm();
          if (this.dispo === 'hostile') SF.log('KVOTH: WORDS ARE SPENT. THE INVOICE IS NOT: ' + SF.TOLL + ' M3 THORIUM STILL BALANCES THIS ENTRY.', SF.P.lcyan);
          else SF.log('KVOTH: THIS CHANNEL EXISTS TO SETTLE YOUR TOLL. OUTSTANDING: ' + SF.TOLL + ' M3 THORIUM. SENSOR RECORD: WORKABLE DEPOSITS ON THE SECOND PLANET. FURTHER QUERIES MAY BE DIRECTED TO ANY PATROL OR STATION NODE. AFTER PAYMENT.', SF.P.lcyan);
          this.mainMenu();
          break;
        }
        this.commsMenu(); break;
      }
      case 'back': this.mainMenu(); break;
      case 'combat': this.combatMenu(); break;
      case 'leave': this.end(this.scripted === 'veil' ? 'The star brightens back to its polite fiction. The Vanguard comes about.' : 'The Vanguard breaks contact and burns away.'); break;
      case 'judgment': SF.story.judge(); this.mainMenu(); break;
      case 'x': break;

      case 'posture': {
        this.posture = { friendly: 'hostile', hostile: 'obsequious', obsequious: 'friendly' }[this.posture];
        SF.log('POSTURE SET: ' + this.posture.toUpperCase() + '.', SF.P.dgray);
        this.commsMenu();
        break;
      }
      case 'hail': {
        const wasHailed = this.hailed;   // the opening hail is free; repeat statements spend patience
        this.hailed = true;
        if (!SF.canUnderstand(this.race)) {
          SF.sfx.comm();
          SF.log(SF.UNTRANSLATABLE.hail[Math.floor(Math.random() * SF.UNTRANSLATABLE.hail.length)], SF.P.lred);
          if (!G.flags.ashUnintel) {
            G.flags.ashUnintel = true;
            SF.journal('Ashkaru transmissions defeat the universal translator: dense, layered war-hymns. Whether it is language at all, no one in the reach seems to know.');
          }
          if (!wasHailed) SF.descramblerNudge();
          if (wasHailed && this.spendComm()) break;
          this.commsMenu();
          break;
        }
        if (this.race === 'ashkaru' && !G.flags.ashUnderstood) {
          // the descrambler works both ways: the first mutual conversation in nine generations
          G.flags.ashUnderstood = true;
          SF.log('The war-hymn crashes into the receivers. And the yellow module CATCHES it. Meter. Grammar. GRIEF. LT. GONSALVES, softly: "Captain... it\'s language. And we are the only ship in the reach that can hold it."', SF.P.yellow);
          SF.sfx.comm();
          SF.log('ASHKARU: ' + SF.GAMBITS.ashkaru.firstWords, SF.P.lred);
          SF.journal('The yellow device was an EAR, the one the reach never grew: Ashkaru war-hymns are LANGUAGE, and it hears in both directions. We are the first beings they have ever truly spoken with; they believed every other species in the reach was non-sentient.');
          if (!this.gambitDone && this.dispo !== 'friendly') { this.challenge(); break; }
          this.commsMenu();
          break;
        }
        const pref = SF.RACES[this.race].posturePref;
        if (!this.postureReacted) {
          // the Rhan Fayr answer only to deeds — postures don't move them
          if (this.posture === pref) { this.postureReacted = true; if (this.race !== 'rhanfayr') SF.addRel(this.race, 2); }
          else {
            const pr = (SF.GAMBITS[this.race] && SF.GAMBITS[this.race].posture || {})[this.posture];
            if (pr) {
              this.postureReacted = true;
              SF.log(SF.RACES[this.race].name + ': ' + pr.line, SF.RACES[this.race].color);
              if (pr.rel) SF.addRel(this.race, pr.rel);
            }
          }
        }
        // the device earns its keep audibly on every fresh channel
        if (this.race === 'ashkaru' && !wasHailed) SF.log('The yellow descrambler whirs, beeps once, and the war-hymn unfolds into words.', SF.P.dgray);
        const pool = SF.DIALOG[this.race].hail[this.dispo] || SF.DIALOG[this.race].hail.wary;
        let hailLine = pool[Math.floor(Math.random() * pool.length)];
        // a ring-carrier turned hostile earned it by conduct, not paperwork
        if (this.race === 'kvoth' && this.dispo === 'hostile' && G.flags.ring)
          hailLine = 'TRANSPONDER VERIFIED. AND VOIDED. YOUR CONDUCT INDEX IS BEYOND CORRECTION. COMPLIANCE WINDOW: CLOSED. PREPARE FOR REMOVAL.';
        SF.sfx.comm();
        SF.log(SF.RACES[this.race].name + ': ' + hailLine, SF.RACES[this.race].color);
        if (this.race === 'ashkaru' && !this.gambitDone && this.dispo !== 'friendly' && !wasHailed) { this.challenge(); break; }
        if (wasHailed && this.spendComm()) break;
        this.commsMenu();
        break;
      }
      case 'story': {
        const st = SF.velmarahStories();
        this.open('SHARE A STORY', st.map(s => ({ label: s.label, value: s.id })).concat([{ label: 'BACK', value: 'back' }]), id => {
          if (id === 'back') { this.commsMenu(); return; }
          const s = SF.GAMBITS.velmarah.stories.find(x => x.id === id);
          G.flags['story_' + s.id] = true;
          SF.log(s.tell, SF.P.lgray);
          SF.sfx.comm();
          SF.log('VEL-MA-RAH: ' + s.reply, SF.P.yellow);
          SF.addRel('velmarah', 3);
          this.commBudget++;   // a good story buys more of their time
          this.commsMenu();
        });
        break;
      }
      case 'drink': {
        const dr = SF.GAMBITS.corsair.drink;
        G.credits -= dr.cost;
        SF.addRel('corsair', 1);
        this.commBudget++;   // a paid-for round keeps the channel open
        SF.sfx.confirm();
        SF.log(dr.narrate, SF.P.lgray);
        const pool = dr.yarns.filter(yn => typeof yn === 'string' || !G.flags[yn.once]);
        const gated = pool.filter(yn => typeof yn !== 'string');
        const yn = gated.length ? gated[0] : pool[Math.floor(Math.random() * pool.length)];
        SF.sfx.comm();
        if (typeof yn === 'string') SF.log('CORSAIRS: ' + yn, SF.P.lmagenta);
        else { G.flags[yn.once] = true; SF.log('CORSAIRS: ' + yn.text, SF.P.lmagenta); if (yn.journal) SF.journal(yn.journal); }
        this.commsMenu();
        break;
      }

      case 'sellpod': {
        G.flags.podAboard = false;
        G.credits += 3000;
        SF.deed(-3, 'Sold a rescued courier to the corsairs', true);
        SF.sfx.confirm();
        SF.log('A crate of credits crosses one way; the courier crosses the other, still talking. Then the channel closes, and the reach is a little quieter than before.', SF.P.lmagenta);
        this.mainMenu();
        break;
      }
      case 'intel': {
        this.intelSoldNow = true;
        G.credits += 900;
        G.intelSold = (G.intelSold || 0) + 1;
        SF.deed(-2, 'Sold the Ashkaru\'s songs to the corsairs', true);
        SF.sfx.confirm();
        SF.log('You play them an hour of decrypted convoy-hymns. They listen like scholars. Somewhere, an Ashkaru freight-tender\'s escort will soon be exactly where someone expects it.', SF.P.lmagenta);
        this.commsMenu();
        break;
      }
      case 'contract': {
        G.flags.contract = true;
        SF.sfx.comm();
        SF.log('CORSAIRS: "Work? Heh. Simple, tub. A certain caravel\'s been poaching our clients. Next cloud-ship you cross, pop it. We fence the metal quiet, you keep the drift, and four hundred lands on completion. No paper. No names."', SF.P.lmagenta);
        this.commsMenu();
        break;
      }

      case 't_themselves': SF.deliverTopic(this, 'themselves'); break;
      case 't_region': SF.deliverTopic(this, 'region'); break;
      case 't_others': SF.deliverTopic(this, 'others'); break;
      case 't_watchers': SF.deliverTopic(this, 'watchers'); break;
      case 't_anomaly': SF.deliverTopic(this, 'anomaly'); break;
      case 't_trade': SF.deliverTopic(this, 'trade'); break;

      case 'paytoll': {
        if (G.flags.ring) { this.mainMenu(); break; }   // the ledger does not double-bill
        G.cargo.thorium -= SF.TOLL; if (G.cargo.thorium <= 0) delete G.cargo.thorium;
        G.artifacts.push('ring'); G.flags.ring = true;
        G.rel.kvoth = Math.max(G.rel.kvoth, 10);
        G.tollPicket = false;   // paid anywhere, the start-system picket is recalled
        this.dispo = 'wary';     // a balanced entry is not a target
        SF.sfx.jingle();
        SF.log('A cargo drone hauls the thorium across. What comes back is unasked-for: a dull torus of woven metal, humming faintly.', SF.P.lcyan);
        SF.log('KVOTH: PAYMENT VERIFIED. PASSAGE GRANTED. THE TORUS IS A TRANSPONDER RING. CARRY IT: EVERY LATTICE VESSEL READS IT, AND WHAT IT READS IS "PAID." YOUR ENTRY IN THE LEDGER IS NOW: BALANCED. CONDUCT YOURSELF ACCORDINGLY. THE LATTICE ANTICIPATES NO FURTHER CONTACT, BUT THE LATTICE HAS BEEN WRONG BEFORE.', SF.P.lcyan);
        SF.journal('Paid the Kvoth toll. The TRANSPONDER RING grants free passage in Lattice space, and docking rights at Kvoth stations.');
        SF.save(true);
        this.mainMenu();
        break;
      }
      case 'sunstone': {
        G.artifacts = G.artifacts.filter(a => a !== 'sunstone');
        G.flags.sunstoneReturned = true;
        G.rel.ashkaru = Math.max(G.rel.ashkaru, 60);
        SF.sfx.jingle();
        SF.deed(3, 'Returned the stolen Sunstone to the Ashkaru');
        SF.log('You transmit the Sunstone\'s resonance signature, then send it across in an unarmed shuttle. For a long time, nothing. Then every Ashkaru channel opens at once, and they are SINGING.', SF.P.lred);
        if (SF.canUnderstand('ashkaru')) {
          SF.log('The yellow descrambler whirs, beeps once, and the chorus unfolds into words.', SF.P.dgray);
          SF.log('ASHKARU: "SUNBRINGER. The Flame remembers. The Pyre Throne is open to you, gray-ship, now and always."', SF.P.lred);
        } else {
          SF.log('The translator holds none of it. The meaning survives translation anyway.', SF.P.lgray);
          SF.descramblerNudge();
        }
        if (!G.flags.phasematrixGiven) {
          G.flags.phasematrixGiven = true;
          G.artifacts.push('phasematrix');
          SF.deed(1, 'Trusted with the Ashkaru\'s last relic of the elder dark');
          SF.log('The shuttle returns the courtesy. Inside, cradled in prayer-cloth: a weave of filaments in perfect balance, humming one low note. Their greatest treasure. It appears to do... nothing at all.', SF.P.lred);
          if (SF.canUnderstand('ashkaru')) SF.log('ASHKARU: "Behold it, Sunbringer: the fairest thing the elder dark ever wrought. An inner fire to rival the stars themselves. The elders wept to send it. No forge, no hymn, no sun outshines it. Treasure it as we did."', SF.P.lred);
          SF.journal('In return for the Sunstone the Ashkaru gave us their most prized possession: the HUMMING WEAVER. They speak of an inner fire rivaling the stars. Dr. Johnson can find no function in it whatsoever. Nor, frankly, the fire. No trader will price it. And yet they wept to give it.');
        }
        SF.journal(SF.canUnderstand('ashkaru')
          ? 'Returned the Sunstone. The Ashkaru call us "Sunbringer"; the Pyre Throne is open to us.'
          : 'Returned the Sunstone. Every Ashkaru channel SANG. Whatever they call us now, their guns no longer track us.');
        this.dispo = 'friendly';
        SF.save(true);
        this.mainMenu();
        break;
      }
      case 'buystone': {
        G.cargo.iridium -= 20; if (G.cargo.iridium <= 0) delete G.cargo.iridium;
        G.artifacts.push('sunstone'); G.flags.sunstone = true;
        SF.log('CORSAIR: "Pleasure doing business, tub." A crate thumps into the airlock. Inside, wrapped in stolen prayer-cloth, something BURNS without heat.', SF.P.lmagenta);
        SF.journal('Bought the Ashkaru Sunstone from the corsairs for 20 M3 iridium. It should go home.');
        this.mainMenu();
        break;
      }
      case 'tribute': {
        for (const k in G.cargo) { G.cargo[k] = Math.round(G.cargo[k] * 0.75); if (G.cargo[k] <= 0) delete G.cargo[k]; }
        G.credits = Math.round(G.credits * 0.85);
        if (G.rel.corsair < 0) G.rel.corsair = Math.min(0, G.rel.corsair + 15);   // tribute buys tolerance, never costs standing
        SF.log('The corsairs strip a quarter of the hold and call it "friendly rates." They leave laughing. Everyone is alive.', SF.P.lmagenta);
        this.end('The cutter peels away, richer.');
        break;
      }

      case 'trade': {
        const items = SF.ELEMENTS.filter(e => G.cargo[e.id]).map(e => ({ label: e.name + ' x' + Math.round(G.cargo[e.id]) + ' @ ' + e.val + 'CR', value: e.id }));
        if (!items.length) { SF.log('VEL-MA-RAH: "Your hold is EMPTY, friend. We admire the optimism of hailing us anyway."', SF.P.yellow); this.mainMenu(); break; }
        items.push({ label: 'DONE', value: 'back' });
        this.open('SELL TO CARAVEL', items, id => {
          if (id === 'back') { this.mainMenu(); return; }
          const n = Math.round(G.cargo[id]);
          G.credits += n * SF.EL[id].val;
          delete G.cargo[id];
          SF.sfx.confirm();
          SF.log('Sold ' + n + ' M3 ' + SF.EL[id].name + ' for ' + n * SF.EL[id].val + ' CR.', SF.P.lgreen);
          this.pick('trade');
        });
        break;
      }

      case 'market': {
        // the one arms-and-optics bazaar that never asks for a permit, or a
        // friendship; the scanners really did fall off a Kvoth freighter
        const items = [];
        for (const key of ['laser', 'missile', 'scanner']) {
          const U = SF.UPGRADES[key];
          const cur = G.ship[key];
          if (cur >= U.max) { items.push({ label: U.name + ' (MAXED)', value: 'x', disabled: true }); continue; }
          const price = Math.round(U.price[cur] * 1.5);
          items.push({ label: U.name + ' CLASS ' + (cur + 1) + ': ' + price + ' CR', value: 'bm:' + key, disabled: G.credits < price });
        }
        items.push({ label: 'BACK', value: 'back' });
        this.open('BLACK MARKET', items, v2 => {
          if (v2 === 'back' || v2 === 'x') { this.mainMenu(); return; }
          const key = v2.slice(3);
          const U = SF.UPGRADES[key];
          const price = Math.round(U.price[G.ship[key]] * 1.5);
          G.credits -= price;
          G.ship[key]++;
          if (key === 'scanner') SF.revealNearbyStars();
          SF.sfx.jingle();
          SF.log('A crate crosses on a tether, no questions asked. ' + U.name + ' CLASS ' + G.ship[key] + ' installed. "Fell off a Kvoth freighter, savvy?"', SF.P.lmagenta);
          this.pick('market');
        });
        break;
      }

      case 'laser': case 'missile': this.playerShoot(v); if (!this.over) this.combatMenu(); break;
      case 'evade': {
        this.evading = true;
        SF.log('ENS. LEE throws the Vanguard into a corkscrew burn.', SF.P.lgray);
        break;
      }
      case 'flee': {
        const G2 = SF.G;
        // escape odds run on engine class, unless the ship's def pins them
        // (the toll picket carries fleeChance: it holds station, not a chase)
        const chance = this.def.fleeChance || SF.clamp(0.4 + 0.15 * (G2.ship.engine - this.def.engine), 0.1, 0.9);
        if (Math.random() < chance) {
          if (this.scripted === 'first' && G2.tollPicket) {
            // a successful flee simply removes the picket: it does not pursue
            // past its beat, and its offer leaves with it
            G2.tollPicket = false;
            SF.journal('We ran from the Kvoth toll patrol rather than pay. It did not pursue past its beat. The Lattice does not strike an open invoice.');
          }
          this.end('The Vanguard\'s zero-point drive out-burns the pursuit. Escaped.');
        }
        else {
          // a blown escape hands them a firing solution: retries cost blood
          SF.log('ESCAPE FAILED: they match the burn and close to point-blank.', SF.P.lred);
          this.hostileNow();
          this.fireT = Math.min(this.fireT, 0.4);
        }
        break;
      }

      // whale
      case 'scanwhale': {
        if (!G.flags.whaleScanned) {
          G.flags.whaleScanned = true;
          if (!G.artifacts.includes('biodata')) G.artifacts.push('biodata');
          G.bioCount = (G.bioCount || 0) + 2;   // a void-whale is a fat catalogue entry
          G.credits += 180;
          SF.log('It is a void-whale: kilometres of slow grace, grazing on dust and starlight. The scan data alone pays for the detour. It regards the Vanguard with one ancient eye, decides you are neither food nor threat, and forgives you in advance.', SF.P.lgreen);
          SF.deed(1, 'Studied a void-whale and let it be');
        } else SF.log('The whale is already catalogued, entry and song. Dr. Johnson watches anyway, for reasons that are not data.', SF.P.lgreen);
        break;
      }
      case 'firewhale': {
        SF.deed(-3, 'Killed a void-whale for its amber', true);
        SF.log('The beams walk along kilometres of flank. The whale SCREAMS across every frequency at once, then rolls, and the wash of its dying fluke hits like a moon.', SF.P.lred);
        SF.log(SF.takeDamage(40), SF.P.lred);
        SF.log('It takes a long time to die, and it sings the whole way down into the dark. Then the reach is quiet, and the drift is full of wax.', SF.P.dgray);
        G.artifacts.push('voidamber');
        SF.log('VOID-AMBERGRIS recovered from the drift. The perfumeries of the Bazaar pay a fortune, and nobody asks. No witness, no judge.', SF.P.lred);
        this.end('');
        break;
      }
      // drone
      case 'scandrone': {
        G.anomCount = (G.anomCount || 0) + 1;
        SF.log('SCAN: mass indeterminate. Age indeterminate. Power source: NONE. It is powered the way a sunbeam is powered.', SF.P.white);
        if (G.anomCount >= 3 && !G.flags.starsAlive) {
          G.flags.starsAlive = true;
          SF.log('DR. JOHNSON: "Captain... it isn\'t transmitting anywhere. It\'s transmitting to the STAR. I think the stars of this reach are alive."', SF.P.white);
          SF.journal('Dr. Johnson\'s hypothesis: THE STARS OF THIS REACH ARE ALIVE.');
          SF.story.lodestarNudge();
        }
        SF.log('The object considers you for exactly as long as you considered it. Then it is somewhere else.', SF.P.white);
        this.end('');
        break;
      }
      case 'haildrone': {
        SF.log('LT. GONSALVES hails on every band. The object does not answer. But for one half-second, the local star flickers. Twice. Like a heartbeat. Then the object is gone.', SF.P.white);
        this.end('');
        break;
      }
      // distress
      case 'giveparts': {
        G.cargo.titanium -= 5; if (G.cargo.titanium <= 0) delete G.cargo.titanium;
        SF.addRel('velmarah', 10);
        G.credits += 120;
        SF.deed(1, 'Repaired a stranded Vel-ma-rah caravel');
        SF.sfx.confirm();
        SF.log('CLAUD crosses with the parts. Two hours later the caravel\'s engines light, and her crew transmits 120 CR and a recipe for something called "cloud-cheese."', SF.P.lgreen);
        SF.journal('Aided a stranded Vel-ma-rah caravel. The clans will remember.');
        this.end('The caravel sails on.');
        break;
      }
      case 'takepod': {
        G.flags.podAboard = true;
        SF.deed(1, 'Rescued a drifting escape pod');
        SF.log('Aboard: a half-frozen Vel-ma-rah courier who talks for six hours straight. Deliver them to any station.', SF.P.lgreen);
        this.end('');
        break;
      }
      case 'helpplague': {
        // the stated risk to the Vanguard's crew never materializes in code:
        // the right choice is meant to cost courage, not hull
        SF.log('DR. KERCSO: "Forge-blight, by the spectra. Understand the arithmetic before you decide, Captain: if it adapts to us, one spore riding my suit home does to this crew what it did to theirs. And you have no second doctor."', SF.P.yellow);
        SF.log('She is already sealing her suit while she says it.', SF.P.lgray);
        this.open('SEND THE DOCTOR ACROSS?', [
          { label: 'SEND HER', value: 'go' },
          { label: 'RECALL HER. THE RISK IS TOO HIGH.', value: 'stay' }
        ], vv => {
          if (vv !== 'go') {
            SF.log('DR. KERCSO unseals her suit without a word. The beacon keeps calling.', SF.P.dgray);
            this.mainMenu();
            return;
          }
          SF.addRel('ashkaru', 12);
          if (G.crew[5].hp > 40) G.crew[5].hp = Math.max(40, G.crew[5].hp - 10);   // the work costs her, but she won't be lost to it
          G.stardate += 0.001;   // nine hours of silence: mercy runs the same clock as looting
          SF.deed(2, 'Sent the doctor aboard a plague-struck Ashkaru warbrand');
          SF.log('The shuttle crosses. Nine hours of silence on the open channel. Then her voice, blood-tired: the blight is burned out of their air system, and the warbrand\'s crew will live.', SF.P.lred);
          if (SF.canUnderstand('ashkaru')) SF.log('The Ashkaru captain says only: "The Flame saw this." It sounds like an oath.', SF.P.lred);
          else SF.log('The Ashkaru captain transmits four notes of a hymn, and silence. The translator offers nothing. It does not need to.', SF.P.lgray);
          SF.journal(SF.canUnderstand('ashkaru')
            ? 'Saved a plague-struck Ashkaru crew. "The Flame saw this."'
            : 'Saved a plague-struck Ashkaru crew. Their captain sang four notes at us. We think it was thanks.');
          this.end('The warbrand limps for home.');
        });
        break;
      }
      case 'lootplague': {
        SF.deed(-4, 'Looted a plague ship and let her crew die', true);
        G.stardate += 0.001;   // "nine hours", per the log line below
        const t = SF.addCargo('iridium', 40);
        SF.log('You hold station off her bow, running dark, while the glyph-lights gutter out one by one. It takes nine hours. Then CLAUD cuts through the hull.', SF.P.lred);
        SF.log('The forges are still warm.' + (t > 0 ? ' ' + Math.round(t) + ' M3 of iridium, free for the carrying.' : '') + ' The Flame saw nothing. Nothing saw.', SF.P.lred);
        this.end('The warbrand drifts on behind you, dark and lightless.');
        break;
      }
      case 'abandon': {
        // no sin where no help was possible: an empty parts locker, a full pod
        // bay, or a dead doctor is misfortune, not a choice
        const couldHelp = this.variant === 0 ? (G.cargo.titanium || 0) >= 5
          : this.variant === 1 ? !G.flags.podAboard
          : G.crew[5].hp > 0;
        if (couldHelp) SF.deed(-1, 'Left a distress call unanswered');
        else SF.log('There was nothing aboard that could have helped them. It does not make the beacon quieter.', SF.P.dgray);
        SF.log('The beacon keeps calling as the Vanguard burns away. It gets quieter. It does not stop.', SF.P.dgray);
        this.end('');
        break;
      }
    }
  },

  playerShoot(weapon) {
    const G = SF.G;
    if (this.wpnCd > 0) { SF.sfx.deny(); SF.log('WEAPONS CYCLING.', SF.P.dgray); return; }
    if (weapon === 'missile' && this.missileCd > 0) { SF.sfx.deny(); SF.log('MISSILE TUBE CYCLING: ' + Math.ceil(this.missileCd) + 'S.', SF.P.dgray); return; }
    if (!this.playerFired) {
      // a single shot at any Lattice vessel voids the toll option forever
      if (this.race === 'kvoth') G.flags.kvothFired = true;
      if (this.scripted === 'first' && this.dispo !== 'hostile') {
        SF.deed(-2, 'Opened fire on the Kvoth toll patrol');
        SF.addRel('kvoth', -50);
      } else if (this.race && this.dispo !== 'hostile') {
        // shooting a non-hostile: consequences. For the velmarah there are no
        // witnesses yet: the clans only learn if the caravel escapes alive
        const quiet = this.race === 'velmarah';
        SF.deed(-2, 'Opened fire on a non-hostile ' + SF.RACES[this.race].name + ' vessel', quiet);
        if (!quiet) SF.addRel(this.race, -50);
      }
    }
    this.playerFired = true;
    this.hostileNow(true);
    this.wpnCd = weapon === 'laser' ? 1.5 : 2.5;
    if (weapon === 'missile') this.missileCd = 6;
    SF.sfx.laser();
    const dmgBase = weapon === 'laser' ? SF.LASER_DMG[G.ship.laser] : SF.MISSILE_DMG[G.ship.missile];
    const eff = dmgBase * (G.ship.sys.wpn / 100);
    if (Math.random() < 0.82) {
      let d = eff * (0.8 + Math.random() * 0.4);
      if (this.eShield > 0) { const a = Math.min(this.eShield, d); this.eShield -= a; d -= a; SF.log('HIT: their screens flare' + (this.eShield <= 0 ? ' and COLLAPSE' : '') + '.', SF.P.yellow); }
      if (d > 0) { this.eArmor -= d; SF.log('HIT: hull damage. ' + this.def.label + ' at ' + Math.max(0, Math.round(this.eArmor / this.def.armor * 100)) + '%.', SF.P.yellow); }
      if (this.eArmor <= 0) { this.enemyDestroyed(); return; }
      if (this.eArmor < this.def.armor * 0.3 && this.def.dmg === 0 || (this.eArmor < this.def.armor * 0.25 && Math.random() < 0.4)) {
        if (!this.enemyFleeing) { this.enemyFleeing = true; this.fleeT = 8; SF.log('THEY ARE BREAKING OFF, running for it.', SF.P.lgray); }
      }
    } else SF.log('MISS.', SF.P.dgray);
  },

  hostileNow(byPlayer) {
    if (this.dispo !== 'hostile') {
      this.dispo = 'hostile';
      if (!byPlayer) SF.log('DISPOSITION SHIFT: HOSTILE.', SF.P.lred);
    }
  },

  enemyDestroyed() {
    const G = SF.G;
    SF.sfx.boom();
    SF.log(this.def.label + ' comes apart in a silent bloom of fire.', SF.P.lred);
    this.enemyDead = true;
    if (this.enemyFleeing) SF.deed(-3, 'Destroyed a fleeing ship', this.race === 'velmarah');
    if (this.race === 'velmarah') {
      // the perfect crime: no witnesses, no standing lost, and the wreck pays.
      // Only the ledger of light records it.
      SF.deed(-4, 'Destroyed a Vel-ma-rah trader', true);
      SF.G.flags.homeForfeit = true;   // absolute rule: ANY caravel kill forfeits home, even after judgment
      SF.log('The envelope tears. The crew does not scream, does not burn: a shimmer of gas widening into the vacuum, and gone. As if no one was ever there.', SF.P.lred);
      const took = SF.addCargo('auralite', 12 + Math.round(Math.random() * 10));
      if (took > 0) SF.log('The wreckage glitters: the envelope was spun from AURALITE; ' + Math.round(took) + ' M3 drift into reach of the cargo scoop. No witness, no judge.', SF.P.lred);
      SF.log('DR. KERCSO, on the intercom, perfectly flat: "Vel-ma-rah caravel post-mortem: the gaseous entities\' bodies dissipated into the vacuum of space. No survivors. Cause of death: avarice."', SF.P.lgray);
      if (G.flags.contract) {
        G.flags.contract = false;
        G.credits += 400;
        G.rel.corsair = Math.min(30, G.rel.corsair + 10);
        SF.deed(-1, 'Took corsair coin for a murder', true);
        SF.log('Four hundred credits arrive within the hour, from nowhere, with no note attached. Professional.', SF.P.lmagenta);
      }
    }
    if (this.scripted === 'first' && G.tollPicket) {
      G.tollPicket = false;
      SF.journal('We destroyed the Kvoth toll patrol rather than pay. Their last transmission was an itemized invoice.');
    }
    if (this.race === 'kvoth') { SF.addRel('kvoth', -60); SF.log('Somewhere, a ledger entry turns red.', SF.P.dgray); }
    if (this.race === 'ashkaru') SF.addRel('ashkaru', -50);
    const scrap = 40 + Math.round(Math.random() * 120);
    G.credits += scrap;
    SF.log('Salvage recovered: ' + scrap + ' CR.', SF.P.lgreen);
    if (this.race === 'corsair' && G.flags.sunstoneOffer && !G.flags.sunstone && !G.flags.sunstoneReturned && Math.random() < 0.02) {
      G.artifacts.push('sunstone'); G.flags.sunstone = true;
      SF.log('In the wreckage: a crate wrapped in stolen prayer-cloth. Inside, something BURNS without heat. The Sunstone.', SF.P.yellow);
      SF.journal('Recovered the Ashkaru Sunstone from corsair wreckage. It should go home.');
    }
    this.end('');
  },

  end(msg) {
    if (msg) SF.log(msg, SF.P.dgray);
    this.over = true;
    const G = SF.G;
    // a caravel fired upon but not finished carries the tale to its clans
    if (this.race === 'velmarah' && this.playerFired && !this.enemyDead) {
      SF.addRel('velmarah', -50);
      SF.log('Somewhere far off, a caravel is singing to its clans. The song is about you.', SF.P.dgray);
    }
    // stand off from the picket so proximity doesn't restart the encounter
    if (this.scripted === 'first' && G.insys === 0 && G.tollPicket) {
      let dx = G.sx - SF.PICKET.x, dy = G.sy - SF.PICKET.y;
      let d = Math.hypot(dx, dy);
      if (d < 0.001) { dx = 0; dy = 1; d = 1; }
      G.sx = SF.PICKET.x + dx / d * SF.PICKET.standoff;
      G.sy = SF.PICKET.y + dy / d * SF.PICKET.standoff;
      SF.log('The Vanguard stands off to a respectful distance.', SF.P.dgray);
    }
    SF.setMode('space');
  },

  // ---- enemy AI ---------------------------------------------------------------------
  tick(dt) {
    if (this.over) return;
    SF.G.stardate += dt * 0.0004;
    const laserCd = this.wpnCd > 0, missCd = this.missileCd > 0;
    if (this.missileCd > 0) this.missileCd -= dt;
    if (this.wpnCd > 0) this.wpnCd -= dt;
    // when a weapon cooldown expires while the COMBAT menu is up, rebuild it so
    // the just-cycled weapon re-enables (keep the cursor where it was)
    if (this.menu && this.menuTitle === 'COMBAT' && ((laserCd && this.wpnCd <= 0) || (missCd && this.missileCd <= 0))) {
      const i = this.menu.i; this.combatMenu(); this.menu.i = Math.min(i, this.menu.items.length - 1);
    }
    if (this.enemyFleeing) {
      this.fleeT -= dt;
      if (this.fleeT <= 0) {
        if (this.scripted === 'first' && SF.G.tollPicket) {
          SF.G.tollPicket = false;
          SF.journal('The Kvoth toll patrol broke off and fled the system, toll unpaid. Somewhere a ledger does not balance, and our name is on the line.');
        }
        this.end(this.def.label + ' escapes into the dark.');
        return;
      }
    }
    if (this.dispo === 'hostile' && this.def.dmg > 0 && !this.enemyFleeing) {
      this.fireT -= dt;
      if (this.fireT <= 0) {
        this.fireT = 3.5 + Math.random() * 1.5;
        const evaded = this.evading;
        this.evading = false;
        const hitChance = evaded ? 0.35 : 0.7;
        if (Math.random() < hitChance) {
          const d = this.def.dmg * (0.75 + Math.random() * 0.5);
          SF.log(this.def.label + ' FIRES: ' + SF.takeDamage(d), SF.P.lred);
          if (SF.shipDestroyed()) { SF.story.gameOver('The ISS Vanguard is lost with all hands, deep in an uncharted reach.\nOn Arth, a mission clock keeps counting.'); }
        } else SF.log(this.def.label + ' fires wide. ' + (evaded ? 'The corkscrew worked.' : ''), SF.P.dgray);
      }
    }
  },

  key(k) {
    if (this.menu && SF.logBusy()) return;   // dialog box inert while the message window pages
    if (this.menu) {
      const r = this.menu.key(k);
      if (r && r.pick !== undefined) this.onPick(r.pick);
      if (r && r.cancel) {
        if (this.menuTitle === 'COMMUNICATIONS' || this.menuTitle === 'COMBAT' || this.menuTitle === 'SELL TO CARAVEL' || this.menuTitle === 'BLACK MARKET') this.mainMenu();
        else if (this.menuTitle === 'SHARE A STORY') this.commsMenu();
        // main menu / RESPOND Esc: do nothing (must choose)
      }
    }
  },

  draw() {
    const L = SF.L;
    SF.ui.clipView(c => {
      const rng = SF.mulberry32(999);
      c.fillStyle = '#111';
      for (let i = 0; i < 70; i++) c.fillRect(L.vx + rng() * L.vw, L.vy + rng() * L.vh, 2, 2);
      const ex = L.vx + L.vw / 2, ey = L.vy + 120;
      if (this.scripted === 'veil') {
        const t = performance.now() / 1000;
        const R = 70 + Math.sin(t * 2.4) * 6;
        c.fillStyle = SF.P.yellow; c.beginPath(); c.arc(ex, ey + 40, R, 0, 7); c.fill();
        c.fillStyle = SF.P.white; c.beginPath(); c.arc(ex, ey + 40, R * 0.62, 0, 7); c.fill();
        c.strokeStyle = SF.P.white; c.globalAlpha = 0.25 + Math.sin(t * 2.4) * 0.2;
        c.beginPath(); c.arc(ex, ey + 40, R + 18, 0, 7); c.stroke();
        c.globalAlpha = 1;
      } else {
        const raceKey = this.def === SF.SHIPS.whale ? 'whale' : (this.scripted === 'drone' ? 'drone' : this.race);
        SF.drawAlienShip(c, ex, ey, raceKey, 26);
      }
      c.fillStyle = this.race ? SF.RACES[this.race].color : SF.P.lgreen;
      c.font = SF.FONT; c.textAlign = 'center';
      c.fillText(this.def.label, ex, ey - 60);
      if (this.def.dmg > 0 && this.playerFired) {
        c.fillStyle = SF.P.dgray;
        c.fillText('INTEGRITY ' + Math.max(0, Math.round(this.eArmor / this.def.armor * 100)) + '%' + (this.eShield > 0 ? '  SCREENS UP' : ''), ex, ey + 54);
      }
      c.textAlign = 'left';
      SF.modes.space.drawShip(c, L.vx + L.vw / 2, L.vy + L.vh - 70);
    });
    SF.ui.drawStatus('ENCOUNTER');
    if (this.menu && !SF.logBusy()) this.menu.draw(SF.L.px, SF.L.py + 140, SF.L.pw, this.menuTitle);
    SF.ui.drawConsole();
  }
};

// topic delivery with per-race gambit hooks
SF.deliverTopic = function (enc, topic) {
  if (enc.race === 'rhanfayr' && !enc.gambitDone) { enc.gambitDone = true; SF.rhanfayrRecall(); }
  const line = SF.deliverLine(enc.race, topic);
  if (enc.race === 'corsair' && topic === 'others' && line.journal) SF.G.flags.sunstoneOffer = true;
  if (enc.spendComm()) return;
  if (enc.race === 'kvoth' && !enc.gambitDone) { enc.kvothQuery(); return; }
  enc.commsMenu();
};

// velmarah stories the captain can still tell (each is told once, ever)
SF.velmarahStories = () => SF.GAMBITS.velmarah.stories.filter(s => !SF.G.flags['story_' + s.id] && (!s.req || s.req(SF.G)));

// the Rhan Fayr open by citing the captain's most recent deed: the ledger kept in light
SF.rhanfayrRecall = function () {
  const G = SF.G, R = SF.GAMBITS.rhanfayr.deedRecall;
  const pool = G.deeds.filter(dd => !dd.q);
  const d = pool[pool.length - 1];
  let line;
  if (!d) {
    if (G.deeds.length) return;   // only silent sins on record: they keep their counsel until judgment
    line = R.none[Math.floor(Math.random() * R.none.length)];
  }
  else {
    // v of exactly 0 is a kindness diminished to nothing, not a sin
    const pool = d.v >= 0 ? R.good : R.bad;
    const t = d.t.charAt(0).toLowerCase() + d.t.slice(1);
    line = pool[Math.floor(Math.random() * pool.length)].replace('{DEED}', t);
  }
  SF.sfx.comm();
  SF.log('RHAN FAYR: ' + line, SF.P.white);
};
