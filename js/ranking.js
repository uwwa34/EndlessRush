// ═══════════════════════════════════════════════════
//  js/ranking.js  —  Endless Rush  (Yellow Pastel)
// ═══════════════════════════════════════════════════

// ── Persistent storage ───────────────────────────────
class RankingSystem {
  static load() {
    try { return JSON.parse(localStorage.getItem(RANKING_KEY)) || []; }
    catch { return []; }
  }
  static save(list) {
    try { localStorage.setItem(RANKING_KEY, JSON.stringify(list)); } catch {}
  }
  static addScore(name, score, details) {
    const list = RankingSystem.load();
    list.push({
      name   : (name||'RUNNER').trim().slice(0,10).toUpperCase(),
      score,
      dist   : Math.floor(details.distanceM || 0),
      bosses : details.bosses || 0,
      date   : new Date().toLocaleDateString('th-TH'),
    });
    list.sort((a,b) => b.score - a.score);
    const trimmed = list.slice(0, RANKING_MAX);
    RankingSystem.save(trimmed);
    return trimmed;
  }
  static getEstimatedRank(score) {
    return RankingSystem.load().filter(e => e.score > score).length + 1;
  }
}

// ─────────────────────────────────────────────────────
class TallyScreen {
  constructor(canvas) {
    this.canvas    = canvas;
    this.ctx       = canvas.getContext('2d');
    this.visible   = false;
    this._data     = {};
    this._t        = 0;
    this._done     = null;
    this._nextBtnY = HEIGHT - 90;  // updated each draw
  }

  show(data, onDone) {
    // data: { score, distanceM, coins, bosses, maxCombo, specials }
    this._data   = data;
    this._t      = 0;
    this.visible = true;
    this._done   = onDone;
  }

  handleTap(x, y) {
    if (!this.visible) return false;
    // "next" button — use the tracked position, allow full-width tap
    if (this._t > 60 && y >= this._nextBtnY && y <= this._nextBtnY + 46) {
      this.visible = false;
      if (this._done) this._done();
      return true;
    }
    return true; // consume tap always while tally is shown
  }

  update(dt) { if (this.visible) this._t++; }

  draw() {
    if (!this.visible) return;
    const ctx = this.ctx;
    const d   = this._data;
    ctx.save();

    // BG
    ctx.fillStyle = COL.BG_SKY;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Decorative stars
    ['☀️','🌟','⭐','✨'].forEach((e, i) => {
      const px = [30, WIDTH-36, 60, WIDTH-60][i];
      const py = [50, 50, HEIGHT-60, HEIGHT-60][i];
      ctx.font = '22px serif'; ctx.textBaseline='middle'; ctx.textAlign='center';
      ctx.globalAlpha = 0.5 + Math.sin(Date.now()/600 + i) * 0.3;
      ctx.fillText(e, px, py);
    });
    ctx.globalAlpha = 1;

    // Panel
    ctx.fillStyle   = 'rgba(240,249,240,0.88)';
    ctx.strokeStyle = COL.PRIMARY;
    ctx.lineWidth   = 2;
    ctx.beginPath(); ctx.roundRect(20, 60, WIDTH-40, HEIGHT-140, 20); ctx.fill(); ctx.stroke();

    // Title
    ctx.fillStyle    = COL.DARK;
    ctx.font         = `bold 22px ${FONT.MAIN}`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎉 ผลการผจญภัย!', WIDTH/2, 100);

    // Rows
    const rows = [
      ['📍 ระยะทาง',     `${Math.floor(d.distanceM || 0)} m`],
      ['👾 ศัตรูกำจัด',  `×${d.enemyKills || 0} ตัว`],
      ['🪙 เหรียญเก็บ',  `×${d.coins || 0}`],
      ['⚔️ Boss ผ่าน',   `×${d.bosses || 0}`],
      ['🔥 Combo สูงสุด', `×${d.maxCombo || 1}`],
    ];

    const bonuses = [
      ['⚔️ Boss Bonus',  (d.bosses||0) * BOSS_KILL_BONUS, '#C84A00'],
      ['🪙 Coin Bonus',  (d.coins||0) * ITEM_TYPES.COIN.points, COL.COIN_COL],
    ];

    let ry = 138;
    const rowH = 36;

    ctx.font         = `15px ${FONT.BODY}`;
    ctx.textBaseline = 'middle';

    for (let ri = 0; ri < rows.length; ri++) {
      const [label, val] = rows[ri];
      const reveal = Math.min(1, (this._t - ri * 8) / 20);
      ctx.globalAlpha = Math.max(0, reveal);

      ctx.fillStyle = '#E8F5E9';
      ctx.beginPath(); ctx.roundRect(32, ry-14, WIDTH-64, rowH-4, 6); ctx.fill();

      // แยก emoji (2 chars แรก) กับ text ออกจากกัน
      const parts  = label.match(/^(\S+)\s*(.*)/);
      const icon   = parts ? parts[1] : '';
      const text   = parts ? parts[2] : label;

      // วาด emoji ด้วย serif
      ctx.font         = `18px serif`;
      ctx.textAlign    = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle    = COL.MID;
      ctx.fillText(icon, 42, ry + 4);

      // วาด text label
      ctx.font      = `15px ${FONT.BODY}`;
      ctx.fillText(text, 68, ry + 4);

      // วาด value
      ctx.fillStyle = COL.DARK;
      ctx.font      = `bold 15px ${FONT.BODY}`;
      ctx.textAlign = 'right';
      ctx.fillText(val, WIDTH-46, ry + 4);

      ctx.font = `15px ${FONT.BODY}`;
      ry += rowH;
    }
    ctx.globalAlpha = 1;

    // divider
    ry += 4;
    ctx.strokeStyle = COL.PRIMARY_D;
    ctx.lineWidth   = 1;
    ctx.setLineDash([4,4]);
    ctx.beginPath(); ctx.moveTo(32, ry); ctx.lineTo(WIDTH-32, ry); ctx.stroke();
    ctx.setLineDash([]);
    ry += 10;

    // Bonuses
    for (const [label, pts, col] of bonuses) {
      if (pts <= 0) { ry += 28; continue; }
      ctx.fillStyle    = col;
      ctx.font         = `bold 14px ${FONT.BODY}`;
      ctx.textAlign    = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, 46, ry);
      ctx.textAlign = 'right';
      ctx.fillText(`+${pts.toLocaleString()} pts`, WIDTH-46, ry);
      ry += 28;
    }

    // Total
    ry += 4;
    ctx.fillStyle = COL.PRIMARY;
    ctx.beginPath(); ctx.roundRect(28, ry, WIDTH-56, 48, 10); ctx.fill();
    ctx.fillStyle    = COL.DARK;
    ctx.font         = `bold 20px ${FONT.MAIN}`;
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('รวมทั้งหมด', 44, ry+24);
    ctx.textAlign = 'right';
    ctx.fillText(`⭐ ${(d.score||0).toLocaleString()}`, WIDTH-44, ry+24);
    ry += 60;

    // Estimated rank
    const estRank = RankingSystem.getEstimatedRank(d.score||0);
    ctx.fillStyle    = estRank<=3 ? '#C84A00' : COL.MID;
    ctx.font         = `bold 15px ${FONT.BODY}`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`🏅 อันดับ #${estRank}`, WIDTH/2, ry);
    ry += 26;

    // Next button — record Y for tap detection
    this._nextBtnY = ry;
    if (this._t > 60) {
      const alpha = Math.min(1, (this._t - 60) / 20);
      ctx.globalAlpha = alpha;
      ctx.fillStyle   = COL.PRIMARY;
      ctx.beginPath(); ctx.roundRect(WIDTH/2-110, ry, 220, 46, 14); ctx.fill();
      ctx.strokeStyle = COL.PRIMARY_D; ctx.lineWidth=2; ctx.stroke();
      ctx.fillStyle    = COL.DARK;
      ctx.font         = `bold 16px ${FONT.MAIN}`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✏️ ใส่ชื่อ →', WIDTH/2, ry+23);
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }
}

// ─────────────────────────────────────────────────────
class RankingScreen {
  constructor(canvas) {
    this.canvas      = canvas;
    this.ctx         = canvas.getContext('2d');
    this.visible     = false;
    this.mode        = 'entry';  // 'entry' | 'board'
    this.playerName  = '';
    this.playerScore = 0;
    this.playerRank  = 0;
    this.ranking     = [];
    this._cursor     = true;
    this._cursorT    = 0;
    this._onDone     = null;
    this._details    = {};
    this._keyHandler = e => this._handleKey(e);
    this._t          = 0;
  }

  show(score, details, onPlayAgain, onConfirm) {
    this.playerScore  = score;
    this.playerName   = '';
    this.mode         = 'entry';
    this.visible      = true;
    this._onPlayAgain = onPlayAgain;
    this._onDone      = onPlayAgain;
    this._onConfirm   = onConfirm || null;
    this._details     = details || {};
    this.playerRank   = RankingSystem.getEstimatedRank(score);
    this._t           = 0;
    window.addEventListener('keydown', this._keyHandler);
  }

  hide() {
    this.visible = false;
    window.removeEventListener('keydown', this._keyHandler);
  }

  _handleKey(e) {
    if (this.mode === 'entry') {
      if (e.key === 'Enter') { this._confirmName(); return; }
      if (e.key === 'Backspace') { this.playerName = this.playerName.slice(0,-1); return; }
      if (e.key.length === 1 && e.key !== ' ' && this.playerName.length < 10)
        this.playerName += e.key.toUpperCase();
    } else {
      // board mode — Enter เท่านั้น
      if (e.key === 'Enter') this._playAgain();
    }
  }

  handleTap(x, y) {
    if (!this.visible) return false;
    if (this.mode === 'entry') {
      // Confirm button area (matches _drawEntry button position)
      if (x >= WIDTH/2-105 && x <= WIDTH/2+105 && y >= 460 && y <= 506) {
        this._confirmName(); return true;
      }
      this._vkbTap(x, y);
    } else {
      // board mode — tap "เล่นอีกครั้ง" button at bottom
      if (y >= HEIGHT - 90) this._playAgain();
    }
    return true;
  }

  _vkbTap(x, y) {
    const rows = [
      ['Q','W','E','R','T','Y','U','I','O','P'],
      ['A','S','D','F','G','H','J','K','L'],
      ['Z','X','C','V','B','N','M','⌫'],
    ];
    const startY = 310, keyH = 42, keyGap = 3;
    rows.forEach((row, ri) => {
      const keyW  = Math.floor((WIDTH-20)/row.length) - keyGap;
      const rowX  = (WIDTH - (keyW+keyGap)*row.length) / 2;
      row.forEach((k, ki) => {
        const kx = rowX + ki*(keyW+keyGap), ky = startY + ri*(keyH+keyGap);
        if (x>=kx && x<=kx+keyW && y>=ky && y<=ky+keyH) {
          if (k==='⌫') this.playerName = this.playerName.slice(0,-1);
          else if (this.playerName.length < 10) this.playerName += k;
        }
      });
    });
  }

  _confirmName() {
    const name   = this.playerName.trim() || 'RUNNER';
    this.ranking = RankingSystem.addScore(name, this.playerScore, this._details);
    const idx    = this.ranking.findIndex(
      e => e.name === name.toUpperCase() && e.score === this.playerScore
    );
    this.playerRank = idx >= 0 ? idx + 1 : this.ranking.length;
    this.mode = 'board';
    this._t   = 0;
    if (this._onConfirm) this._onConfirm();   // notify game → STATE.RANKING
  }

  _playAgain() {
    this.hide();
    if (this._onDone) this._onDone();
  }

  // keep old name as alias just in case
  _done() { this._playAgain(); }

  update(dt) { 
    if (!this.visible) return;
    this._t++;
    this._cursorT++;
    if (this._cursorT % 28 === 0) this._cursor = !this._cursor;
  }

  draw() {
    if (!this.visible) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.setTransform(1,0,0,1,0,0);

    // BG
    ctx.fillStyle = COL.BG_SKY;
    ctx.fillRect(0,0,WIDTH,HEIGHT);

    // Decor
    ['🌟','✨','⭐','🌟'].forEach((e, i) => {
      const px = [22, WIDTH-28, 48, WIDTH-52][i];
      const py = [44, 44, HEIGHT-50, HEIGHT-50][i];
      ctx.font='18px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.globalAlpha = 0.4 + Math.sin(Date.now()/700+i)*0.3;
      ctx.fillText(e, px, py);
    });
    ctx.globalAlpha = 1;

    if (this.mode === 'entry') this._drawEntry(ctx);
    else                       this._drawBoard(ctx);

    ctx.restore();
  }

  _drawEntry(ctx) {
    // Panel
    ctx.fillStyle   = 'rgba(240,249,240,0.92)';
    ctx.strokeStyle = COL.PRIMARY;
    ctx.lineWidth   = 2;
    ctx.beginPath(); ctx.roundRect(16, 52, WIDTH-32, 250, 18); ctx.fill(); ctx.stroke();

    // Title
    ctx.fillStyle    = COL.DARK;
    ctx.font         = `bold 22px ${FONT.MAIN}`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✏️ ใส่ชื่อผู้เล่น', WIDTH/2, 85);

    ctx.fillStyle = COL.MID;
    ctx.font      = `14px ${FONT.BODY}`;
    ctx.fillText(`คะแนน: ⭐ ${this.playerScore.toLocaleString()}`, WIDTH/2, 112);

    const rankColor = this.playerRank <= 3 ? '#C84A00' : COL.PRIMARY_D;
    ctx.fillStyle = rankColor;
    ctx.font      = `bold 13px ${FONT.BODY}`;
    ctx.fillText(`อันดับ #${this.playerRank}`, WIDTH/2, 135);

    // Name input box — แสดง placeholder "PLAYER" ถ้ายังไม่ได้พิมพ์
    const bx = WIDTH/2 - 150, by = 152;
    ctx.fillStyle   = '#fff';
    ctx.strokeStyle = COL.PRIMARY;
    ctx.lineWidth   = 2;
    ctx.beginPath(); ctx.roundRect(bx, by, 300, 50, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle    = this.playerName ? COL.DARK : '#9E9E9E';
    ctx.font         = `bold 22px ${FONT.MONO}`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    const displayName = this.playerName || 'RUNNER';
    ctx.fillText(displayName + (this._cursor ? '|' : ' '), WIDTH/2, by+25);

    // VKB
    this._drawVKB(ctx);

    // Confirm button
    ctx.fillStyle   = COL.PRIMARY;
    ctx.strokeStyle = COL.PRIMARY_D;
    ctx.lineWidth   = 2;
    ctx.beginPath(); ctx.roundRect(WIDTH/2-105, 460, 210, 46, 14); ctx.fill(); ctx.stroke();
    ctx.fillStyle    = COL.DARK;
    ctx.font         = `bold 17px ${FONT.MAIN}`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✅ ยืนยัน', WIDTH/2, 483);

    // hint
    // ctx.fillStyle    = COL.MID;
    // ctx.font         = `12px ${FONT.BODY}`;
    // ctx.fillText('กด Enter เพื่อยืนยัน (ไม่ใส่ชื่อ = RUNNER)', WIDTH/2, 514);
  }

  _drawVKB(ctx) {
    const rows = [
      ['Q','W','E','R','T','Y','U','I','O','P'],
      ['A','S','D','F','G','H','J','K','L'],
      ['Z','X','C','V','B','N','M','⌫'],
    ];
    const startY = 312, keyH = 42, keyGap = 3;
    rows.forEach((row, ri) => {
      const keyW = Math.floor((WIDTH-20)/row.length) - keyGap;
      const rowX = (WIDTH-(keyW+keyGap)*row.length)/2;
      row.forEach((k, ki) => {
        const kx = rowX + ki*(keyW+keyGap), ky = startY + ri*(keyH+keyGap);
        const isDel = k==='⌫';
        ctx.fillStyle   = isDel ? 'rgba(200,74,0,0.18)' : COL.PRIMARY_L;
        ctx.strokeStyle = isDel ? '#C84A00' : COL.PRIMARY_D;
        ctx.lineWidth   = 1;
        ctx.beginPath(); ctx.roundRect(kx, ky, keyW, keyH, 5); ctx.fill(); ctx.stroke();
        ctx.fillStyle    = isDel ? '#C84A00' : COL.DARK;
        ctx.font         = `${isDel?13:12}px ${FONT.BODY}`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(k, kx+keyW/2, ky+keyH/2);
      });
    });
  }

  _drawBoard(ctx) {
    // Panel
    ctx.fillStyle   = 'rgba(240,249,240,0.94)';
    ctx.strokeStyle = COL.PRIMARY;
    ctx.lineWidth   = 2;
    ctx.beginPath(); ctx.roundRect(12, 56, WIDTH-24, HEIGHT-140, 18); ctx.fill(); ctx.stroke();

    // Title
    ctx.fillStyle    = COL.DARK;
    ctx.font         = `bold 20px ${FONT.MAIN}`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏆 ยอดผู้กล้าแห่ง Endless Rush 🏆', WIDTH/2, 86);

    const list   = this.ranking.length ? this.ranking : RankingSystem.load();
    const rowH   = 46;
    const startY = 112;
    const medals = ['🥇','🥈','🥉'];

    list.slice(0, RANKING_MAX).forEach((entry, i) => {
      const y    = startY + i * rowH;
      const isMe = (i+1 === this.playerRank && entry.score === this.playerScore);

      // row bg
      if (isMe) {
        ctx.fillStyle   = COL.RANK_ME;
        ctx.strokeStyle = COL.PRIMARY_D;
        ctx.lineWidth   = 1.5;
        ctx.beginPath(); ctx.roundRect(18, y+2, WIDTH-36, rowH-4, 8); ctx.fill(); ctx.stroke();
      }

      // stagger reveal
      const reveal = Math.min(1, (this._t - i*5) / 15);
      ctx.globalAlpha = Math.max(0, reveal);

      // medal/number
      ctx.font = '17px serif';
      ctx.textAlign    = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(medals[i] || `${i+1}.`, 22, y+rowH/2);

      // name
      ctx.fillStyle = isMe ? COL.DARK : COL.MID;
      ctx.font      = `${isMe?'bold ':''}14px ${FONT.MONO}`;
      ctx.textAlign = 'left';
      ctx.fillText(entry.name + (isMe?' ◀':''), 54, y+rowH/2-5);
      ctx.fillStyle = '#BFA030';
      ctx.font      = `10px ${FONT.BODY}`;
      ctx.fillText(`${entry.dist||0}m · ${entry.date||''}`, 54, y+rowH/2+9);

      // score
      ctx.fillStyle = COL.PRIMARY_D;
      ctx.font      = `bold 16px ${FONT.MONO}`;
      ctx.textAlign = 'right';
      ctx.fillText(entry.score.toLocaleString(), WIDTH-18, y+rowH/2);

      ctx.globalAlpha = 1;
    });

    if (!list.length) {
      ctx.fillStyle    = COL.MID;
      ctx.font         = `15px ${FONT.BODY}`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ยังไม่มีข้อมูล', WIDTH/2, 280);
    }

    // Play again button
    const by = HEIGHT - 80;
    ctx.fillStyle   = COL.PRIMARY;
    ctx.strokeStyle = COL.PRIMARY_D;
    ctx.lineWidth   = 2;
    ctx.beginPath(); ctx.roundRect(WIDTH/2-120, by, 240, 50, 14); ctx.fill(); ctx.stroke();
    ctx.fillStyle    = COL.DARK;
    ctx.font         = `bold 17px ${FONT.MAIN}`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🌟 เล่นอีกครั้ง!', WIDTH/2, by+25);
  }
}
