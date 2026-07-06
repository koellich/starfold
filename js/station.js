// STARFOLD station.js: docking, trade, shipyard, lounge rumors
'use strict';

// bazaar curio shelf: fixed, arbitrary prices, haggled long before you
// arrived. One of these is the descrambler; the price gives nothing away.
SF.CURIO_PRICE = { descrambler: 4360, astrolabe: 4715, silentbell: 4085, weepstone: 4940 };
// each curio's sales spiel (shown on the confirm stage, so the captain can read
// the vendor's pitch before deciding) and the sensory tail (once it's aboard)
SF.CURIO_PITCH = {
  descrambler: { color: SF.P.yellow, pitch: '"A yellow something, friend! Nobody could ever tell me what it\'s FOR. From a dead salvager\'s estate: three owners, no instructions, POSSIBLY haunted."', tail: 'It sits mute in your palm and does... nothing at all.' },
  astrolabe:   { color: SF.P.brown,  pitch: '"The astrolabe of a pilgrim who FOUND what he sought, friend! Why else would he sell it?"', tail: 'The needle swings as you take it, and settles on nothing.' },
  silentbell:  { color: SF.P.lgreen, pitch: '"A bell of the Quiet Monasteries, friend! It rings once per lifetime, they say. Has yours rung yet? Exactly!"', tail: 'It does not ring on the way to the hold, either.' },
  weepstone:   { color: SF.P.lblue,  pitch: '"The Weeping Stone, friend. It mourns SOMETHING. Perhaps it could mourn for you? Cheaper than doing it yourself!"', tail: 'It is, indeed, damp.' }
};

// what each culture buys at premium / sells
SF.STATION_CFG = {
  kvoth: {
    buyMult: { thorium: 1.7, iridium: 1.2 },
    sells: ['engine', 'shield', 'armor', 'scanner', 'pods'],
    maxLevel: { engine: 3, shield: 3, armor: 3 },   // the zealot forges alone cast above class 3 (pods excepted)
    buysSurveys: true,   // KNOWLEDGE IS INVENTORY (SF.surveyPrice)
    sellsArtifacts: ['chartcore'],
    greeting: 'DOCKING CLAMPS ENGAGE WITH ZERO WASTED MOTION. A MAINTENANCE LATTICE INSPECTS THE HULL WITHOUT ASKING.',
    repairLine: 'REPAIRS PRICED AT COST. SENTIMENT IS NOT A LINE ITEM.'
  },
  velmarah: {
    buyMult: { gold: 1.5, silver: 1.4, platinum: 1.4, auralite: 1.6 },
    sells: ['pods', 'scanner', 'shield', 'missile'],
    // scanner capped at 2 (their best gear logs the flicker as a malfunction);
    // shields up to 4: gorgeous, imported, and mostly a way to waste a fortune;
    // one entry-level missile rack, no questions asked ("everything sells!")
    maxLevel: { scanner: 2, shield: 4, missile: 1 },
    sellsArtifacts: ['chartcore', 'descrambler_shop'],
    greeting: 'The Bazaar Eternal smells of spice, ozone and forty species\' cooking. Everyone is shouting, in the friendliest possible way.',
    repairLine: '"We fix, you pay, everyone sings!"'
  },
  ashkaru: {
    buyMult: { titanium: 1.6, iridium: 1.6, iron: 1.3 },
    // the forge casts weapons and drives; the scanner rack is war-optics,
    // and the one class-3 source that owes the Lattice nothing
    sells: ['laser', 'missile', 'armor', 'engine', 'shield', 'scanner'],
    sellsArtifacts: [],
    greeting: 'The Pyre Throne is a cathedral of forges. Choirs somewhere below decks. Everything smells faintly of burning.',
    repairLine: '"The forge mends what the void breaks. Stand clear of the sparks, gray-ship."'
  }
};

SF.modes.station = {
  st: null, starId: 0, menu: null, menuTitle: '', onPick: null,

  enter(arg) {
    this.st = arg.station; this.starId = arg.starId;
    const cfg = SF.STATION_CFG[this.st.race];
    SF.sfx.confirm();
    SF.log('DOCKED: ' + this.st.name + '.', SF.RACES[this.st.race].color);
    SF.log(cfg.greeting, SF.P.lgray);
    // deliver rescued pod
    if (SF.G.flags.podAboard) {
      SF.G.flags.podAboard = false;
      SF.G.credits += 1000;
      SF.addRel(this.st.race, 5);
      SF.addRel('velmarah', 8);
      SF.log('The rescued courier disembarks, still talking. A grateful clan-mother wires 1,000 CR before the airlock even cycles.', SF.P.lgreen);
    }
    SF.save(true);
    this.mainMenu();
  },

  open(title, items, onPick, onCancel) { this.menu = new SF.Menu(items); this.menuTitle = title; this.onPick = onPick; this.onCancel = onCancel || null; },

  // shared accept/cancel confirm (shipyard, repairs, curios): onYes runs on
  // accept; back() returns to the caller's menu on accept, decline, or ESC.
  confirm(title, yesLabel, onYes, back, disabled) {
    this.open(title, [
      { label: yesLabel, value: 'yes', disabled: !!disabled },
      { label: 'NOT NOW', value: 'no' }
    ], v => { if (v === 'yes') onYes(); back(); }, back);
  },

  // curio purchase, after the accept/cancel confirm (the pitch was already
  // shown when the confirm opened; here the deal is done and it comes aboard)
  buyCurio(id) {
    const G = SF.G;
    G.credits -= SF.CURIO_PRICE[id]; G.artifacts.push(id);
    SF.sfx.jingle();
    SF.log(SF.CURIO_PITCH[id].tail, SF.CURIO_PITCH[id].color);
  },

  mainMenu() {
    this.open(this.st.name, [
      { label: 'TRADE GOODS', value: 'trade' },
      { label: 'SHIPYARD', value: 'yard' },
      { label: 'REPAIRS', value: 'repair' },
      { label: 'LOUNGE (RUMORS)', value: 'lounge' },
      { label: 'DEPART', value: 'depart' }
    ], v => this.pick(v));
  },

  pick(v) {
    const G = SF.G, cfg = SF.STATION_CFG[this.st.race];
    if (v === 'depart') { SF.log('UNDOCKED FROM ' + this.st.name + '.', SF.P.dgray); SF.setMode('space'); return; }
    if (v === 'trade') this.tradeMenu();
    if (v === 'yard') this.yardMenu();
    if (v === 'lounge') this.loungeMenu();
    if (v === 'repair') {
      const s = G.ship;
      // the yard has an infirmary too: incapacitated crew are stabilized and
      // returned to duty; nobody stays lost to one bad volley
      const crewNeed = G.crew.reduce((a, c) => a + (100 - c.hp) * 0.6, 0);
      const need = (100 - s.sys.hull) + Object.keys(s.sys).filter(k => k !== 'hull').reduce((a, k) => a + (100 - s.sys[k]) * 0.3, 0) + (SF.ARMOR_PTS[s.armor] - s.armorPts) * 0.5 + (100 - s.tvHull) * 0.4 + crewNeed;
      const cost = Math.round(need * 25);   // yard work is skilled work, and the yard knows it
      if (cost <= 0) { SF.log('Nothing to repair. ' + cfg.repairLine, SF.P.lgray); this.mainMenu(); return; }
      // cost lives on the PAY line, not the title (5-digit repairs would overrun the panel)
      this.confirm('FULL REPAIR' + (crewNeed > 0 ? ' & INFIRMARY' : ''), 'PAY ' + cost + ' CR', () => {
        G.credits -= cost;
        s.sys.hull = 100; for (const k in s.sys) s.sys[k] = 100;
        s.armorPts = SF.ARMOR_PTS[s.armor]; s.tvHull = 100;
        const revived = G.crew.filter(c => c.hp <= 0).map(c => c.role);
        for (const c of G.crew) c.hp = 100;
        SF.sfx.confirm(); SF.log('All systems restored. ' + cfg.repairLine, SF.P.lgreen);
        if (revived.length) SF.log('The station infirmary releases ' + revived.join(', ') + ' back to duty, upright and complaining.', SF.P.lgreen);
      }, () => this.mainMenu(), G.credits < cost);
    }
  },

  tradeMenu() {
    const G = SF.G, cfg = SF.STATION_CFG[this.st.race];
    const items = [];
    for (const e of SF.ELEMENTS) {
      if (!G.cargo[e.id]) continue;
      const price = Math.round(e.val * (cfg.buyMult[e.id] || 1));
      items.push({ label: 'SELL ' + e.name + ' x' + Math.round(G.cargo[e.id]) + ' @ ' + price + ' CR', value: 'm:' + e.id });
    }
    for (const a of G.artifacts) {
      if (SF.installedArtifact(a)) continue;   // wired into the ship: not loose cargo
      const p = SF.artifactPrice(a);
      // trade rows are narrow (~28 chars); long relics carry a short abbr
      if (p > 0) items.push({ label: 'SELL ' + (SF.ARTIFACTS[a].abbr || SF.ARTIFACTS[a].name) + ' @ ' + p + ' CR', value: 'a:' + a, color: SF.P.lmagenta });
    }
    if (cfg.buysSurveys) {
      const sv = SF.surveyValue();
      if (sv.n) items.push({ label: 'SELL SURVEYS x' + sv.n + ' @ ' + sv.total + ' CR', value: 'surveys', color: SF.P.lcyan });
    }
    for (const sa of cfg.sellsArtifacts) {
      if (sa === 'chartcore' && !G.flags.chartcore && !G.artifacts.includes('chartcore')) items.push({ label: 'BUY CHART CORE - 500 CR', value: 'buy:chartcore', disabled: G.credits < 500, color: SF.P.lcyan });
      if (sa === 'descrambler_shop') {
        // the shelf of curios: one matters, three are honest bazaar crap,
        // all priced like relics (SF.CURIO_PRICE)
        const CP = SF.CURIO_PRICE;
        if (!G.flags.descrambler && !G.artifacts.includes('descrambler'))
          items.push({ label: 'BUY YELLOW CURIO - ' + CP.descrambler + ' CR', value: 'buy:descrambler', disabled: G.credits < CP.descrambler, color: SF.P.yellow });
        if (!G.artifacts.includes('astrolabe'))
          items.push({ label: 'BUY ASTROLABE - ' + CP.astrolabe + ' CR', value: 'buy:astrolabe', disabled: G.credits < CP.astrolabe, color: SF.P.brown });
        if (!G.artifacts.includes('silentbell'))
          items.push({ label: 'BUY SILENT BELL - ' + CP.silentbell + ' CR', value: 'buy:silentbell', disabled: G.credits < CP.silentbell, color: SF.P.lgreen });
        if (!G.artifacts.includes('weepstone'))
          items.push({ label: 'BUY WEEPING STONE - ' + CP.weepstone + ' CR', value: 'buy:weepstone', disabled: G.credits < CP.weepstone, color: SF.P.lblue });
      }
    }
    // a fence will re-sell you a plot relic you offloaded, at double what they paid
    for (const id of SF.BUYBACK_RELICS) {
      if (G.flags['sold_' + id] && !G.artifacts.includes(id)) {
        const bb = SF.ARTIFACTS[id].sell * 2;
        items.push({ label: 'BUY BACK ' + SF.ARTIFACTS[id].abbr + ' - ' + bb + ' CR', value: 'bb:' + id, disabled: G.credits < bb, color: SF.P.lmagenta });
      }
    }
    if (!items.length) { SF.log('Nothing to trade. The hold is empty and the shelf is bare.', SF.P.dgray); this.mainMenu(); return; }
    items.push({ label: 'DONE', value: 'done' });
    this.open('TRADE - ' + G.credits + ' CR', items, v => {
      if (v === 'done') { this.mainMenu(); return; }
      if (v.startsWith('m:')) {
        const id = v.slice(2);
        const price = Math.round(SF.EL[id].val * (cfg.buyMult[id] || 1));
        SF.qtyPrompt(this, 'SELL ' + SF.EL[id].name + ' @ ' + price + ' CR', Math.round(G.cargo[id] || 0),
          qty => {
            const n = Math.min(qty, Math.round(G.cargo[id] || 0));
            if (n > 0) {
              G.cargo[id] -= n; if (G.cargo[id] <= 0.01) delete G.cargo[id];
              G.credits += n * price;
              SF.sfx.confirm();
              SF.log('Sold ' + n + ' M3 ' + SF.EL[id].name + ' for ' + (n * price) + ' CR.', SF.P.lgreen);
              SF.addRel(this.st.race, (n * price > 300 ? 1 : 0));
            }
            this.tradeMenu();
          }, () => this.tradeMenu());
        return;
      }
      if (v.startsWith('a:')) {
        const id = v.slice(2);
        const p = SF.artifactPrice(id);
        const nm = SF.ARTIFACTS[id].abbr || SF.ARTIFACTS[id].name;
        if (SF.BUYBACK_RELICS.includes(id)) SF.log('A fence takes it gladly. Buying it back later runs DOUBLE.', SF.P.yellow);
        this.confirm('SELL ' + nm + ' @ ' + p + ' CR', 'CONFIRM SALE', () => {
          const idx = G.artifacts.indexOf(id);
          if (idx >= 0) G.artifacts.splice(idx, 1);   // sell one copy, keep duplicates
          G.credits += p;
          if (id === 'biodata') G.bioCount = 0;   // the catalogue is sold; start a new one
          if (id === 'ring') G.flags.ring = false;   // fence the ring, forfeit Lattice passage
          if (SF.BUYBACK_RELICS.includes(id)) G.flags['sold_' + id] = true;   // a fence will re-sell it later, at double
          SF.sfx.confirm();
          SF.log('Sold ' + nm + ' for ' + p + ' CR.', SF.P.lgreen);
        }, () => this.tradeMenu());
        return;
      }
      if (v === 'surveys') {
        const sv = SF.surveyValue();
        for (const key in G.surveyed) if (G.surveyed[key] === 1) G.surveyed[key] = 2;
        G.credits += sv.total;
        SF.sfx.confirm();
        SF.log('SURVEY DATA ACCEPTED: ' + sv.n + ' PLANETARY ENTRIES FROM BEYOND THE SPHERE. THE LEDGER WIDENS. CREDIT: ' + sv.total + ' CR.', SF.P.lcyan);
        SF.addRel('kvoth', (sv.total > 300 ? 1 : 0));
      }
      if (v === 'buy:chartcore') {
        G.credits -= 500; G.artifacts.push('chartcore');
        SF.log('CHART CORE PURCHASED. Science can install it (SCIENCE > ANALYSIS).', SF.P.lcyan);
      }
      if (v.startsWith('buy:') && v !== 'buy:chartcore') {
        const id = v.slice(4);
        const nm = id === 'descrambler' ? 'YELLOW CURIO' : (SF.ARTIFACTS[id].abbr || SF.ARTIFACTS[id].name);
        // the vendor's spiel first, so the captain reads it, then decides
        SF.log(SF.CURIO_PITCH[id].pitch + ' For you: ' + SF.CURIO_PRICE[id] + ' CR.', SF.CURIO_PITCH[id].color);
        this.confirm('BUY ' + nm + ' - ' + SF.CURIO_PRICE[id] + ' CR', 'CONFIRM PURCHASE',
          () => this.buyCurio(id), () => this.tradeMenu());
        return;
      }
      if (v.startsWith('bb:')) {
        const id = v.slice(3);
        const bb = SF.ARTIFACTS[id].sell * 2;
        this.confirm('BUY BACK ' + SF.ARTIFACTS[id].abbr + ' - ' + bb + ' CR', 'CONFIRM PURCHASE', () => {
          G.credits -= bb; G.artifacts.push(id); G.flags['sold_' + id] = false;
          SF.sfx.confirm();
          SF.log('Bought back the ' + SF.ARTIFACTS[id].name + ' for ' + bb + ' CR. The fence does not quite manage to hide the smirk.', SF.P.lmagenta);
        }, () => this.tradeMenu());
        return;
      }
      this.tradeMenu();
    });
  },

  yardMenu() {
    const G = SF.G, cfg = SF.STATION_CFG[this.st.race];
    const items = [];
    for (const key of cfg.sells) {
      const U = SF.UPGRADES[key];
      const cur = key === 'pods' ? G.ship.pods : G.ship[key];
      const cap = (cfg.maxLevel && cfg.maxLevel[key]) || U.max;
      if (cur >= cap) {
        if (cap === U.max) items.push({ label: U.name + ' - MAXED', value: 'x', disabled: true });
        continue;   // below-max caps: the shelf simply has nothing better
      }
      const price = U.price[cur];
      items.push({ label: U.name + ' ' + (key === 'pods' ? '+1' : 'CLASS ' + (cur + 1)) + ' - ' + price + ' CR', value: 'u:' + key, disabled: G.credits < price });
    }
    items.push({ label: 'BACK', value: 'done' });
    this.open('SHIPYARD - ' + G.credits + ' CR', items, v => {
      if (v === 'done' || v === 'x') { this.mainMenu(); return; }
      const key = v.slice(2);
      const U = SF.UPGRADES[key];
      const cur = key === 'pods' ? G.ship.pods : G.ship[key];
      // the spec sheet comes BEFORE the invoice: an informed purchase
      SF.log(U.name + (key === 'pods' ? ' +1' : ' CLASS ' + (cur + 1)) + ': ' + U.desc, SF.P.lcyan);
      this.confirm('BUY ' + U.name + ' - ' + U.price[cur] + ' CR', 'CONFIRM PURCHASE', () => {
        G.credits -= U.price[cur];
        if (key === 'pods') G.ship.pods++;
        else G.ship[key]++;
        if (key === 'armor') G.ship.armorPts = SF.ARMOR_PTS[G.ship.armor];
        if (key === 'shield') G.ship.shieldPts = 0;
        if (key === 'scanner') SF.revealNearbyStars();
        SF.sfx.jingle();
        SF.log(U.name + ' UPGRADED.', SF.P.lgreen);
        SF.save(true);
      }, () => this.yardMenu());
    });
  },

  loungeMenu() {
    const G = SF.G;
    const avail = SF.RUMORS.filter(r => r.at === this.st.race && !G.flags['rumor_' + r.id] && (!r.req || r.req(G)));
    const items = avail.map(r => ({ label: 'RUMOR - ' + r.price + ' CR', value: r.id, disabled: G.credits < r.price }));
    if (!items.length) {
      SF.log(this.st.race === 'kvoth' ? 'THE LOUNGE IS A ROOM WITH ONE CHAIR AND PERFECT SILENCE. NO DATA IS CURRENTLY FOR SALE.' : 'No new whispers today. Even gossip needs time to ferment.', SF.P.dgray);
      this.mainMenu(); return;
    }
    items.push({ label: 'BACK', value: 'done' });
    this.open('LOUNGE', items, v => {
      if (v === 'done') { this.mainMenu(); return; }
      const r = SF.RUMORS.find(x => x.id === v);
      G.credits -= r.price;
      G.flags['rumor_' + r.id] = true;
      SF.sfx.comm();
      SF.log(r.text, SF.RACES[this.st.race].color);
      if (r.journal) SF.journal(r.journal);
      this.loungeMenu();
    });
  },

  tick(dt) { SF.G.stardate += dt * 0.0002; },

  key(k) {
    if (!this.menu) return;
    if (SF.logBusy()) return;   // dialog box inert while the message window pages
    const r = this.menu.key(k);
    if (r && r.pick !== undefined) this.onPick(r.pick);
    if (r && r.cancel) {
      if (this.onCancel) this.onCancel();
      else if (this.menuTitle === this.st.name) this.pick('depart');
      else this.mainMenu();
    }
  },

  draw() {
    const L = SF.L;
    const col = SF.RACES[this.st.race].color;
    SF.ui.clipView(c => {
      const rng = SF.mulberry32(SF.hash(this.starId, 4));
      c.fillStyle = '#111';
      for (let i = 0; i < 50; i++) c.fillRect(L.vx + rng() * L.vw, L.vy + rng() * L.vh, 2, 2);
      const cx = L.vx + L.vw / 2, cy = L.vy + L.vh / 2 - 20;
      const t = performance.now() / 1000;
      // station: rotating structure
      c.save(); c.translate(cx, cy); c.rotate(t * 0.15);
      c.strokeStyle = col; c.lineWidth = 3;
      c.strokeRect(-70, -18, 140, 36);
      c.beginPath(); c.arc(0, 0, 52, 0, 7); c.stroke();
      c.fillStyle = col;
      for (let i = 0; i < 4; i++) { c.rotate(Math.PI / 2); c.fillRect(48, -4, 22, 8); }
      c.restore();
      c.fillStyle = col; c.font = SF.FONT; c.textAlign = 'center';
      c.fillText(this.st.name, cx, cy + 90);
      c.textAlign = 'left';
      SF.modes.space.drawShip(c, cx, cy + 130);
    });
    SF.ui.drawStatus('DOCKED: ' + this.st.name);
    if (this.menu && !SF.logBusy()) this.menu.draw(SF.L.px, SF.L.py + 140, SF.L.pw, this.menuTitle);
    SF.ui.drawConsole();
  }
};
