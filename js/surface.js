// STARFOLD surface.js: terrain vehicle exploration, mining, ruins, lifeforms
'use strict';

SF.TV_CAP = 50;

SF.modes.surface = {
  star: null, planet: null, surf: null,
  tx: 0, ty: 0, menu: null, hazardT: 0, lifeT: 0,

  enter(arg) {
    const G = SF.G;
    this.star = arg.star; this.planet = arg.planet;
    this.surf = SF.genSurface(this.planet);
    this.tx = arg.lx; this.ty = arg.ly;
    this.menu = null;
    // the surface cache is rebuilt each session; the catalogue lives in G
    const ls = G.lifeScanned || {};
    this.surf.life.forEach((lf, li) => { if (ls[this.planet.star + ':' + this.planet.idx + ':' + li]) lf.scanned = true; });
    this.hazardT = 12 + Math.random() * 10;
    const cold = SF.starCold(this.star);
    SF.log('THE TV FALLS AWAY FROM THE VANGUARD AND RIDES RETROFIRE DOWN TO ' + SF.planetName(this.star, this.planet).toUpperCase() + '. Overhead, the ship holds orbit.', SF.P.lcyan);
    // ore racked in the TV from an earlier trip: offload what now fits in the hold
    G.tvCargo = G.tvCargo || {};
    let moved = 0;
    for (const el in G.tvCargo) {
      const t = SF.addCargo(el, G.tvCargo[el]);
      moved += t; G.tvCargo[el] -= t;
      if (G.tvCargo[el] <= 0.01) delete G.tvCargo[el];
    }
    if (moved) SF.log(Math.round(moved) + ' M3 offloaded from the TV bay into the hold before deployment.', SF.P.lgray);
    if (cold) SF.log('It is three kelvin out there. The TV\'s heaters scream. Frost forms INSIDE the canopy.', SF.P.lblue);
    if (this.planet.special === 'thorium') SF.log('Geiger counters click cheerfully. Thorium country.', SF.P.lgreen);
  },

  minedKey() { return this.planet.star + ':' + this.planet.idx; },
  isMined(i) { return (SF.G.mined[this.minedKey()] || []).includes(i); },
  tvUsed() { return Math.round(SF.sumMap(SF.G.tvCargo)); },

  key(k) {
    const G = SF.G;
    if (this.menu && SF.logBusy()) return;   // dialog box inert while the message window pages
    if (this.menu) {
      const r = this.menu.key(k);
      if (r && r.cancel) this.menu = null;
      if (r && r.pick) {
        this.menu = null;
        if (r.pick === 'gravesTake') {
          G.artifacts.push('shard');
          SF.deed(-2, 'Stripped a dead people\'s graves', true);
          SF.log('The crystals come loose with no resistance at all. CLAUD stows them without another word. His servos have never sounded so loud.', SF.P.lred);
        }
        if (r.pick === 'gravesLeave') SF.log('You leave the dead their belongings. The wind fills the silence back in.', SF.P.dgray);
        if (r.pick === 'return') this.returnToShip();
        if (r.pick === 'status') {
          SF.log('TV HULL ' + Math.round(G.ship.tvHull) + '%  TV CARGO ' + this.tvUsed() + '/' + SF.TV_CAP + ' M3.', SF.P.lgray);
          for (const el in G.tvCargo) SF.log('  ' + SF.EL[el].name + ' ' + Math.round(G.tvCargo[el]) + ' M3', SF.EL[el].color);
        }
      }
      return;
    }
    if (k === 'Escape') {
      this.menu = new SF.Menu([
        { label: 'RETURN TO SHIP', value: 'return' },
        { label: 'VEHICLE STATUS', value: 'status' }
      ]);
      return;
    }
    if (k === 'Enter') this.interact();
    let dx = 0, dy = 0;
    if (k === 'ArrowLeft') dx = -1;
    if (k === 'ArrowRight') dx = 1;
    if (k === 'ArrowUp') dy = -1;
    if (k === 'ArrowDown') dy = 1;
    if (dx || dy) {
      const nx = (this.tx + dx + SF.SURF_W) % SF.SURF_W;
      const ny = SF.clamp(this.ty + dy, 1, SF.SURF_H - 2);
      const t = this.surf.tiles[ny * SF.SURF_W + nx];
      if (t === 0 && SF.LIQUID_TYPES.includes(this.planet.type)) {
        if (this.planet.type === 'molten') { SF.log('LAVA. The TV politely refuses.', SF.P.lred); SF.sfx.deny(); }
        else { SF.log('Open water. The TV is many things; a boat is not one of them.'); SF.sfx.deny(); }
        return;
      }
      this.tx = nx; this.ty = ny;
      SF.G.stardate += 0.00005;
      SF.sfx.move();
    }
  },

  interact() {
    const G = SF.G;
    // artifact / story sites
    for (const s of this.surf.sites) {
      if (s.x === this.tx && s.y === this.ty) { SF.story.siteInteract(this, s); return; }
    }
    // deposits
    for (let i = 0; i < this.surf.deposits.length; i++) {
      const d = this.surf.deposits[i];
      if (d.x === this.tx && d.y === this.ty && !this.isMined(i)) {
        const free = SF.TV_CAP - this.tvUsed();
        if (free <= 0) { SF.log('TV cargo bay is full. Return to the ship.', SF.P.yellow); SF.sfx.deny(); return; }
        const key = this.minedKey();
        G.partial = G.partial || {};
        const rem = (G.partial[key] && G.partial[key][i] !== undefined) ? G.partial[key][i] : d.amt;
        const take = Math.min(free, rem);
        G.tvCargo[d.el] = (G.tvCargo[d.el] || 0) + take;
        if (take >= rem) {
          (G.mined[key] = G.mined[key] || []).push(i);
          if (G.partial[key]) delete G.partial[key][i];
        } else {
          (G.partial[key] = G.partial[key] || {})[i] = rem - take;
        }
        SF.sfx.mine();
        SF.log('MINED: ' + take + ' M3 ' + SF.EL[d.el].name + (take < rem ? ' (bay full, ' + Math.round(rem - take) + ' M3 remain in the deposit)' : '') + '.', SF.EL[d.el].color);
        return;
      }
    }
    // lifeforms adjacent (nothing survives under a dead sun)
    if (!SF.starCold(this.star)) for (let li = 0; li < this.surf.life.length; li++) {
      const lf = this.surf.life[li];
      if (Math.abs(lf.x - this.tx) <= 1 && Math.abs(lf.y - this.ty) <= 1 && !lf.scanned) {
        lf.scanned = true;
        (G.lifeScanned = G.lifeScanned || {})[this.minedKey() + ':' + li] = true;   // the catalogue survives a reload
        if (!G.artifacts.includes('biodata')) G.artifacts.push('biodata');
        G.bioCount = (G.bioCount || 0) + 1;
        SF.log('LIFEFORM SCANNED: ' + SF.lifePool(this.planet.type)[lf.t] + '. Xenobiology data recorded. Catalogue entry ' + G.bioCount + '.', SF.P.lgreen);
        return;
      }
    }
    SF.log('Nothing here but ' + (SF.starCold(this.star) ? 'frozen silence.' : 'rocks and weather.'), SF.P.dgray);
  },

  returnToShip() {
    const G = SF.G;
    let moved = 0, kept = 0;
    for (const el in G.tvCargo) {
      const t = SF.addCargo(el, G.tvCargo[el]);
      moved += t; G.tvCargo[el] -= t;
      if (G.tvCargo[el] <= 0.01) delete G.tvCargo[el];
      else kept += G.tvCargo[el];
    }
    SF.sfx.warp();
    G.stardate += 0.005;
    SF.log('The TV docks. ' + (moved ? Math.round(moved) + ' M3 transferred to the hold.' : 'Nothing to transfer.') + (kept ? ' Ship hold full; ' + Math.round(kept) + ' M3 stay racked in the TV bay.' : ''), SF.P.lcyan);
    SF.save(true);
    SF.setMode('orbit', { star: this.star, planet: this.planet, quiet: true });
  },

  tick(dt) {
    const G = SF.G;
    G.stardate += dt * 0.0001;
    // wandering lifeforms
    this.lifeT -= dt;
    if (this.lifeT <= 0) {
      this.lifeT = 0.8;
      if (!SF.starCold(this.star)) for (const lf of this.surf.life) {
        if (Math.random() < 0.5) continue;
        if (Math.random() < 0.5) lf.x = (lf.x + (Math.random() < 0.5 ? 1 : -1) + SF.SURF_W) % SF.SURF_W;
        else lf.y = SF.clamp(lf.y + (Math.random() < 0.5 ? 1 : -1), 1, SF.SURF_H - 2);
      }
    }
    // hazards
    this.hazardT -= dt;
    if (this.hazardT <= 0) {
      this.hazardT = 14 + Math.random() * 14;   // longer excursions on big worlds
      const cold = SF.starCold(this.star);
      const T = SF.PLANET_TYPES[this.planet.type];
      const roll = Math.random();
      if (cold && roll < 0.75) {
        G.ship.tvHull -= 12 + Math.random() * 10;
        SF.sfx.hit();
        SF.log('THERMAL SHOCK: seals crack in the absolute cold. TV hull ' + Math.max(0, Math.round(G.ship.tvHull)) + '%.', SF.P.lblue);
      } else if (!cold && roll < 0.4 && T.hazard) {
        const dmg = 6 + Math.random() * 12;
        G.ship.tvHull -= dmg;
        SF.sfx.hit();
        SF.log(T.hazard + ' STRIKE! TV hull ' + Math.max(0, Math.round(G.ship.tvHull)) + '%.', SF.P.yellow);
      }
      if (G.ship.tvHull <= 0) {
        G.ship.tvHull = 60;
        G.tvCargo = {};
        const c = G.crew[Math.floor(Math.random() * G.crew.length)];
        c.hp = Math.max(5, c.hp - 30);
        SF.log('THE TV BREAKS DOWN. Emergency recovery by shuttle: cargo abandoned, ' + c.name + ' injured. CLAUD rebuilds the vehicle at 60%.', SF.P.lred);
        SF.setMode('orbit', { star: this.star, planet: this.planet, quiet: true });
      }
    }
  },

  draw() {
    const L = SF.L;
    const cold = SF.starCold(this.star);
    const cols = cold ? SF.COLD_COLORS : SF.PLANET_TYPES[this.planet.type].colors;
    SF.ui.clipView(c => {
      const tw = 10, th = 10;
      const vw = Math.floor(L.vw / tw), vh = Math.floor(L.vh / th);
      const ox = this.tx - Math.floor(vw / 2), oy = this.ty - Math.floor(vh / 2);
      for (let y = 0; y < vh; y++) for (let x = 0; x < vw; x++) {
        const wx = ((ox + x) % SF.SURF_W + SF.SURF_W) % SF.SURF_W;
        const wy = oy + y;
        // beyond the poles: dark void, not repeated terrain
        c.fillStyle = (wy < 0 || wy >= SF.SURF_H) ? '#05060a' : cols[this.surf.tiles[wy * SF.SURF_W + wx]];
        c.fillRect(L.vx + x * tw, L.vy + y * th, tw, th);
      }
      const toScreen = (wx, wy) => {
        let dx = wx - ox; dx = ((dx % SF.SURF_W) + SF.SURF_W) % SF.SURF_W;
        return { x: L.vx + dx * tw, y: L.vy + (wy - oy) * th, on: dx >= 0 && dx < vw && wy - oy >= 0 && wy - oy < vh };
      };
      // deposits
      this.surf.deposits.forEach((d, i) => {
        if (this.isMined(i)) return;
        const p = toScreen(d.x, d.y);
        if (!p.on) return;
        c.fillStyle = SF.EL[d.el].color;
        c.fillRect(p.x + 2, p.y + 2, 6, 6);
        c.strokeStyle = SF.P.white; c.strokeRect(p.x + 1, p.y + 1, 8, 8);
      });
      // sites
      for (const s of this.surf.sites) {
        if (SF.G.taken[this.minedKey() + ':' + s.x + ':' + s.y]) continue;
        const p = toScreen(s.x, s.y);
        if (!p.on) continue;
        c.fillStyle = s.kind === 'ruin' || s.kind === 'vault' ? SF.P.lmagenta : SF.P.white;
        c.beginPath(); c.moveTo(p.x + 5, p.y - 2); c.lineTo(p.x - 2, p.y + 10); c.lineTo(p.x + 12, p.y + 10); c.closePath(); c.fill();
      }
      // lifeforms (none under a dead sun)
      if (!cold) for (const lf of this.surf.life) {
        const p = toScreen(lf.x, lf.y);
        if (!p.on) continue;
        c.fillStyle = lf.scanned ? SF.P.dgray : SF.P.lgreen;
        c.beginPath(); c.arc(p.x + 5, p.y + 5, 4, 0, 7); c.fill();
      }
      // the TV (center)
      const px = L.vx + Math.floor(Math.floor(L.vw / tw) / 2) * tw, py = L.vy + Math.floor(Math.floor(L.vh / th) / 2) * th;
      c.fillStyle = SF.P.white; c.fillRect(px, py, 10, 8);
      c.fillStyle = SF.P.black; c.fillRect(px + 2, py + 2, 3, 3);
      // minimap (top-right): a big world needs a chart
      const mmW = 128, mmH = 80, mmx = L.vx + L.vw - mmW - 10, mmy = L.vy + 10;
      const msc = mmW / SF.SURF_W;   // 1/3
      c.globalAlpha = 0.85;
      c.imageSmoothingEnabled = false;
      c.drawImage(SF.surfMapCanvas(this.planet, cold), mmx, mmy, mmW, mmH);
      c.globalAlpha = 1;
      c.strokeStyle = SF.P.dgray; c.lineWidth = 1; c.strokeRect(mmx - 1, mmy - 1, mmW + 2, mmH + 2);
      this.surf.deposits.forEach((d, i) => {
        if (this.isMined(i)) return;
        c.fillStyle = SF.EL[d.el].color;
        c.fillRect(mmx + d.x * msc - 1, mmy + d.y * msc - 1, 2, 2);
      });
      // the minimap is drawn from the orbital scan: class-2 scanner or no site marks
      if (SF.G.ship.scanner >= 2) for (const s of this.surf.sites) {
        if (SF.G.taken[this.minedKey() + ':' + s.x + ':' + s.y]) continue;
        c.fillStyle = SF.P.lmagenta;
        c.fillRect(mmx + s.x * msc - 1, mmy + s.y * msc - 1, 3, 3);
      }
      // view window + TV position
      c.strokeStyle = SF.P.white; c.globalAlpha = 0.6;
      c.strokeRect(mmx + ((ox % SF.SURF_W + SF.SURF_W) % SF.SURF_W) * msc, mmy + SF.clamp(oy, 0, SF.SURF_H) * msc, vw * msc, vh * msc);
      c.globalAlpha = 1;
      c.fillStyle = SF.P.white;
      c.fillRect(mmx + this.tx * msc - 1, mmy + this.ty * msc - 1, 3, 3);
    });
    SF.ui.drawStatus('SURFACE: ' + SF.planetName(this.star, this.planet));
    if (this.menu) { if (!SF.logBusy()) this.menu.draw(SF.L.px, SF.L.py + 140, SF.L.pw, 'TERRAIN VEHICLE'); }
    else {
      SF.ui.box(SF.L.px, SF.L.py + 140, SF.L.pw, 180, { title: 'TERRAIN VEHICLE', color: SF.P.dgray });
      const y0 = SF.L.py + 156;
      SF.ui.text(SF.L.px + 14, y0, 'TV HULL  ' + Math.max(0, Math.round(SF.G.ship.tvHull)) + '%', SF.G.ship.tvHull < 40 ? SF.P.lred : SF.P.lgray);
      SF.ui.text(SF.L.px + 14, y0 + SF.LH, 'TV CARGO ' + this.tvUsed() + '/' + SF.TV_CAP + ' M3', SF.P.lgray);
      SF.ui.text(SF.L.px + 14, y0 + SF.LH * 3, 'ARROWS: DRIVE', SF.P.dgray);
      SF.ui.text(SF.L.px + 14, y0 + SF.LH * 4, 'ENTER: MINE/INTERACT', SF.P.dgray);
      SF.ui.text(SF.L.px + 14, y0 + SF.LH * 5, 'ESC: MENU', SF.P.dgray);
    }
    SF.ui.drawConsole();
  }
};
