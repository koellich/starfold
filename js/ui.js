// STARFOLD ui.js: layout, drawing primitives, menus, console log, status
'use strict';

// screen layout: viewport (left), control panel (right), console (bottom)
SF.L = {
  W: 960, H: 600,
  vx: 8,   vy: 8,   vw: 640, vh: 400,   // viewport
  px: 656, py: 8,   pw: 296, ph: 400,   // right panel
  cx: 8,   cy: 416, cw: 944, ch: 176    // console
};

SF.ui = {};
SF.FONT = 'bold 15px "Courier New", monospace';
SF.CH = 9;   // char width  (fixed after init)
SF.LH = 17;  // line height

SF.ui.init = function (ctx) {
  ctx.font = SF.FONT;
  SF.CH = ctx.measureText('M').width;
};

SF.ui.clear = function () {
  const c = SF.ctx;
  c.fillStyle = SF.P.black;
  c.fillRect(0, 0, SF.L.W, SF.L.H);
};

SF.ui.text = function (x, y, s, color) {
  const c = SF.ctx;
  c.font = SF.FONT;
  c.fillStyle = color || SF.P.lgray;
  c.textBaseline = 'top';
  c.fillText(s, x, y);
};

SF.ui.ctext = function (cx, y, s, color) {
  SF.ui.text(cx - (s.length * SF.CH) / 2, y, s, color);
};

SF.ui.box = function (x, y, w, h, opt) {
  opt = opt || {};
  const c = SF.ctx;
  c.fillStyle = opt.fill || SF.P.black;
  c.fillRect(x, y, w, h);
  c.strokeStyle = opt.color || SF.P.cyan;
  c.lineWidth = 2;
  c.strokeRect(x + 1, y + 1, w - 2, h - 2);
  c.strokeStyle = opt.color2 || SF.P.blue;
  c.lineWidth = 1;
  c.strokeRect(x + 4, y + 4, w - 8, h - 8);
  if (opt.title) {
    const t = ' ' + opt.title + ' ';
    c.fillStyle = SF.P.black;
    c.fillRect(x + 14, y - 2, t.length * SF.CH + 4, 18);
    SF.ui.text(x + 16, y - 1, t, opt.color || SF.P.lcyan);
  }
};

// ---- menu widget ------------------------------------------------------------
// items: [{label, value, disabled, color}]
SF.Menu = function (items) {
  this.items = items;
  this.i = 0;
  while (this.items[this.i] && this.items[this.i].disabled) this.i++;
  if (this.i >= this.items.length) this.i = 0;   // every item disabled: keep a valid index
};
SF.Menu.prototype.key = function (k) {
  const n = this.items.length;
  if (k === 'ArrowUp' || k === 'ArrowDown') {
    const d = k === 'ArrowUp' ? -1 : 1;
    let j = this.i;
    for (let s = 0; s < n; s++) {
      j = (j + d + n) % n;
      if (!this.items[j].disabled) { this.i = j; break; }
    }
    SF.sfx.move();
    return null;
  }
  if (k === 'Enter') {
    const it = this.items[this.i];
    if (it && !it.disabled) { SF.sfx.blip(); return { pick: it.value, item: it }; }
    SF.sfx.deny(); return null;
  }
  if (k === 'Escape') { return { cancel: true }; }
  return null;
};
SF.Menu.prototype.draw = function (x, y, w, title) {
  const h = this.items.length * SF.LH + 26;
  SF.ui.box(x, y, w, h, { title: title });
  this.items.forEach((it, j) => {
    const sel = j === this.i;
    const col = it.disabled ? SF.P.dgray : (sel ? SF.P.yellow : (it.color || SF.P.lgray));
    if (sel) {
      SF.ctx.fillStyle = SF.P.blue;
      SF.ctx.fillRect(x + 8, y + 13 + j * SF.LH, w - 16, SF.LH);
    }
    SF.ui.text(x + 14, y + 14 + j * SF.LH, (sel ? '▸ ' : '  ') + it.label, col);
  });
  return h;
};

// ---- quantity selector (same key/draw contract as SF.Menu) --------------------
SF.QtyPrompt = function (max, unit) {
  this.max = Math.max(1, Math.floor(max));
  this.val = this.max;
  this.unit = unit || 'M3';
};
SF.QtyPrompt.prototype.key = function (k) {
  if (k === 'ArrowLeft')  { this.val = Math.max(1, this.val - 1); SF.sfx.move(); return null; }
  if (k === 'ArrowRight') { this.val = Math.min(this.max, this.val + 1); SF.sfx.move(); return null; }
  if (k === 'ArrowDown')  { this.val = Math.max(1, this.val - 10); SF.sfx.move(); return null; }
  if (k === 'ArrowUp')    { this.val = Math.min(this.max, this.val + 10); SF.sfx.move(); return null; }
  if (k === 'Enter')  { SF.sfx.blip(); return { pick: this.val }; }
  if (k === 'Escape') return { cancel: true };
  return null;
};
SF.QtyPrompt.prototype.draw = function (x, y, w, title) {
  const h = SF.LH * 4 + 26;
  SF.ui.box(x, y, w, h, { title: title });
  SF.ui.ctext(x + w / 2, y + 16, '◂ ' + this.val + ' / ' + this.max + ' ' + this.unit + ' ▸', SF.P.yellow);
  SF.ui.ctext(x + w / 2, y + 16 + SF.LH * 2, '←/→ ±1   ↑/↓ ±10', SF.P.dgray);
  SF.ui.ctext(x + w / 2, y + 16 + SF.LH * 3, 'ENTER OK   ESC CANCEL', SF.P.dgray);
  return h;
};

// mount a quantity picker on any mode that forwards keys to mode.menu and
// dispatches mode.onPick / mode.onCancel (space and station both do). One
// place so jettison and selling share the same how-many flow.
SF.qtyPrompt = function (mode, title, max, onPick, onCancel) {
  mode.menu = new SF.QtyPrompt(max);
  mode.menuTitle = title;
  mode.onPick = onPick;
  mode.onCancel = onCancel || (() => { mode.menu = null; });
};

// ---- scrolling console log ---------------------------------------------------
SF.logLines = [];
SF.logOff = 0;    // scrollback offset in lines; 0 = pinned to the newest line
SF.logSeen = 0;   // rows the player has had on screen: the read-guarantee cursor
SF.logUnseen = () => SF.logLines.length - SF.logSeen;
SF.logClear = function () { SF.logLines.length = 0; SF.logOff = 0; SF.logSeen = 0; SF.flowQ = null; };
SF.logTrim = function () {
  if (SF.logLines.length <= 400) return;
  const cut = SF.logLines.length - 400;
  SF.logLines.splice(0, cut);
  SF.logSeen = Math.max(0, SF.logSeen - cut);
};
SF.log = function (msg, color) {
  const cols = Math.floor((SF.L.cw - 30) / SF.CH);
  const dest = SF.flowQ || SF.logLines;
  for (const line of SF.wrap(msg, cols)) dest.push({ t: line, c: color || SF.P.lgray });
  if (dest === SF.logLines) {
    SF.logTrim();
    // new traffic advances the view toward the present, but never past an
    // unread row: a burst deeper than one screen pins the view at the oldest
    // unread line, and SPACE pages forward (the consolidated CONTINUE)
    SF.logOff = Math.max(0, SF.logLines.length - SF.consoleRows() - SF.logSeen);
  }
};

// SPACE with an unread backlog: acknowledge the pinned page, reveal the next
// (one row of overlap for reading continuity, same as the story flow)
SF.logAdvance = function () {
  SF.logSeen = Math.min(SF.logLines.length, SF.logSeen + SF.consoleRows() - 1);
  SF.logOff = Math.max(0, SF.logLines.length - SF.consoleRows() - SF.logSeen);
  SF.sfx.blip();
};

// ---- paged story flow: long text released one console page per SPACE ----------
SF.flowQ = null;   // while non-null, SF.log lines queue here instead of the console
SF.flowStart = function () { if (!SF.flowQ) SF.flowQ = []; };
SF.flowNext = function () {
  if (!SF.flowQ) return;
  const take = SF.flowQ.splice(0, SF.consoleRows() - 1);
  for (const l of take) SF.logLines.push(l);
  SF.logTrim();
  SF.logOff = 0;
  if (SF.flowQ.length) SF.sfx.blip();
  else SF.flowQ = null;
};
SF.consoleRows = () => Math.floor((SF.L.ch - 26) / SF.LH);
// the console is "busy" while a burst still needs paging (▼ SPACE: N MORE) or a
// story flow is releasing pages one at a time. While busy the side dialog box
// is hidden and ignores input, so the player reads the message window first.
SF.logBusy = () => !!(SF.flowQ && SF.flowQ.length) || SF.logUnseen() > SF.consoleRows();
SF.scrollLog = function (dir) {   // +1 = older, -1 = newer; one page per step
  const page = Math.max(1, SF.consoleRows() - 1);
  const max = Math.max(0, SF.logLines.length - SF.consoleRows());
  const next = SF.clamp(SF.logOff + dir * page, 0, max);
  if (next !== SF.logOff) { SF.logOff = next; SF.sfx.move(); } else SF.sfx.deny();
};
SF.ui.drawConsole = function () {
  const L = SF.L;
  SF.ui.box(L.cx, L.cy, L.cw, L.ch, { title: 'COMM / LOG', color: SF.P.dgray, color2: SF.P.black });
  const rows = SF.consoleRows();
  const end = SF.logLines.length - SF.logOff;
  const lines = SF.logLines.slice(Math.max(0, end - rows), end);
  lines.forEach((l, i) => SF.ui.text(L.cx + 14, L.cy + 14 + i * SF.LH, l.t, l.c));
  // rows resting at the live edge count as read; a pinned or hand-scrolled
  // view does not advance the read cursor
  if (SF.logOff === 0) SF.logSeen = SF.logLines.length;
  // flow prompt / unread backlog / scrollback affordance, in the title row
  const flowing = SF.flowQ && SF.flowQ.length;
  const unread = SF.logUnseen() - rows;   // rows waiting below the pinned page
  const tag = flowing ? ' ▼ SPACE: CONTINUE '
    : unread > 0 ? ' ▼ SPACE: ' + unread + ' MORE '
    : SF.logOff > 0 ? ' ▼ SHIFT+↓: ' + SF.logOff + ' NEWER '
    : SF.logLines.length > rows ? ' ▲ SHIFT+↑ ' : null;
  if (tag) {
    const tx = L.cx + L.cw - 14 - tag.length * SF.CH;
    SF.ctx.fillStyle = SF.P.black;
    SF.ctx.fillRect(tx - 2, L.cy - 2, tag.length * SF.CH + 4, 18);
    SF.ui.text(tx, L.cy - 1, tag, flowing || unread > 0 || SF.logOff > 0 ? SF.P.yellow : SF.P.dgray);
  }
};

// ---- status panel (top of right panel) ---------------------------------------
SF.ui.drawStatus = function (extra) {
  const L = SF.L, G = SF.G;
  SF.ui.box(L.px, L.py, L.pw, 128, { title: 'ISS VANGUARD', color: SF.P.cyan });
  const x = L.px + 14; let y = L.py + 14;
  const cargoUsed = SF.cargoUsed();
  SF.ui.text(x, y, 'STARDATE ' + G.stardate.toFixed(2), SF.P.lcyan); y += SF.LH;
  SF.ui.text(x, y, extra || (G.insys !== null ? 'SYSTEM: ' + SF.starName(SF.galaxy.stars[G.insys]) : 'DEEP SPACE ' + Math.round(G.px) + ',' + Math.round(G.py)), SF.P.lgray); y += SF.LH;
  SF.ui.text(x, y, 'HULL ' + Math.max(0, Math.round(G.ship.sys.hull)) + '%  SHLD ' + (G.ship.shieldsUp ? 'UP' : 'DOWN'), G.ship.sys.hull < 40 ? SF.P.lred : SF.P.lgray); y += SF.LH;
  SF.ui.text(x, y, 'CARGO ' + cargoUsed + '/' + SF.cargoMax() + ' M3', cargoUsed >= SF.cargoMax() ? SF.P.yellow : SF.P.lgray); y += SF.LH;
  SF.ui.text(x, y, 'CREDITS ' + SF.fmt(G.credits) + ' CR', SF.P.lgreen); y += SF.LH;
  SF.ui.text(x, y, 'ZPE CORE: NOMINAL', SF.P.dgray);
};

// hint bar at the very bottom of the viewport
SF.ui.hint = function (s) {
  SF.ctx.fillStyle = 'rgba(0,0,0,0.75)';
  SF.ctx.fillRect(SF.L.vx + 4, SF.L.vy + SF.L.vh - 24, SF.L.vw - 8, 20);
  SF.ui.text(SF.L.vx + 12, SF.L.vy + SF.L.vh - 22, s, SF.P.dgray);
};

// clip helper for viewport drawing
SF.ui.clipView = function (fn) {
  const c = SF.ctx, L = SF.L;
  c.save();
  c.beginPath(); c.rect(L.vx, L.vy, L.vw, L.vh); c.clip();
  fn(c);
  c.restore();
  c.strokeStyle = SF.P.cyan; c.lineWidth = 2;
  c.strokeRect(L.vx + 1, L.vy + 1, L.vw - 2, L.vh - 2);
};

// paged full-screen text reader (journal, help, story). Returns a mode-like obj.
SF.ui.pager = function (title, lines, onExit, color) {
  return {
    off: 0,
    perPage: Math.floor((SF.L.H - 120) / SF.LH),
    key(k) {
      if (k === 'ArrowDown' || k === 'PageDown') this.off = Math.min(Math.max(0, lines.length - this.perPage), this.off + (k === 'PageDown' ? this.perPage : 1));
      else if (k === 'ArrowUp' || k === 'PageUp') this.off = Math.max(0, this.off - (k === 'PageUp' ? this.perPage : 1));
      else if (k === 'Escape' || k === 'Enter') { SF.sfx.blip(); onExit(); }
    },
    draw() {
      SF.ui.clear();
      SF.ui.box(20, 16, SF.L.W - 40, SF.L.H - 60, { title: title, color: color || SF.P.cyan });
      lines.slice(this.off, this.off + this.perPage).forEach((l, i) => {
        SF.ui.text(44, 40 + i * SF.LH, typeof l === 'string' ? l : l.t, typeof l === 'string' ? SF.P.lgray : l.c);
      });
      SF.ui.ctext(SF.L.W / 2, SF.L.H - 32, '↑/↓ SCROLL   ESC CLOSE', SF.P.dgray);
    }
  };
};
