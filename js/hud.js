// ═══════════════════════════════════════════════════
//  js/hud.js  —  Endless Rush
// ═══════════════════════════════════════════════════

class HUD {
  constructor() {
    this.score        = 0;
    this.coins        = 0;
    this.distanceM    = 0;
    this.hp           = PLAYER_HP;
    this.maxHp        = PLAYER_HP;

    this._popups      = [];    // floating "+pts" text
    this._shakeT      = 0;    // screen shake timer
    this._shakeMag    = 0;

    // boss warning flash
    this._bossFlash   = 0;
    this._bossFlashMax= 80;    // frames
  }

  addScore(pts, x, y, label) {
    if (pts > 0) this.score += pts;
    // แสดง popup ถ้ามี label หรือ pts > 0
    const showPts = pts || 0;
    if ((label || showPts > 0) && x !== undefined) {
      this._popups.push({
        x, y,
        pts: showPts,
        label: label || `+${showPts}`,
        alpha: 1, vy: -1.4, life: 80,
      });
    }
  }

  addCoin() { this.coins++; }

  triggerShake(magnitude = 6) {
    this._shakeT   = 18;
    this._shakeMag = magnitude;
  }

  triggerBossWarning() {
    this._bossFlash = this._bossFlashMax;
  }

  // shake offset for canvas transform
  getShakeOffset() {
    if (this._shakeT <= 0) return { dx:0, dy:0 };
    const m = this._shakeMag * (this._shakeT / 18);
    return {
      dx: (Math.random()-0.5) * m,
      dy: (Math.random()-0.5) * m,
    };
  }

  update(dt, player, world) {
    this.hp        = player.hp;
    this.distanceM = world.distanceM;

    if (this._shakeT > 0) this._shakeT--;
    if (this._bossFlash > 0) this._bossFlash--;

    for (const p of this._popups) {
      p.y    += p.vy;
      p.life--;
      p.alpha = p.life / 80;
    }
    this._popups = this._popups.filter(p => p.life > 0);
  }

  // ── Draw main HUD bar ─────────────────────────────
  draw(ctx, state) {
    // ── Boss approach warning flash ───────────────
    if (this._bossFlash > 0) {
      const a = (Math.sin(this._bossFlash / 5) * 0.5 + 0.5) * 0.25;
      ctx.fillStyle = `rgba(255,100,0,${a})`;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }

    // ── HUD panel (top) ───────────────────────────
    ctx.fillStyle = COL.WHITE_A55;
    ctx.beginPath();
    ctx.roundRect(6, 6, WIDTH-12, 42, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(46,125,50,0.35)';
    ctx.lineWidth   = 1;
    ctx.stroke();

    // Score
    ctx.fillStyle    = COL.DARK;
    ctx.font         = `bold 17px ${FONT.MAIN}`;
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`⭐ ${this.score.toLocaleString()}`, 16, 27);

    // Distance
    ctx.fillStyle = COL.MID;
    ctx.font      = `12px ${FONT.BODY}`;
    ctx.textAlign = 'center';
    ctx.fillText(`📍 ${Math.floor(this.distanceM)}m`, WIDTH/2, 27);

    // HP hearts
    const hx = WIDTH - 14;
    ctx.textAlign    = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < this.maxHp; i++) {
      const alive = i < this.hp;
      ctx.globalAlpha = alive ? 1 : 0.25;
      ctx.font        = '16px serif';
      ctx.fillText(alive ? '❤️' : '🖤', hx - i * 20, 27);
    }
    ctx.globalAlpha = 1;

    // Coin counter (bottom strip)
    ctx.fillStyle    = COL.COIN_COL;
    ctx.font         = `bold 12px ${FONT.BODY}`;
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`🪙 ×${this.coins}`, 16, 42);

    // Boss-approach distance indicator (progress bar under HUD)
    if (state === STATE.PLAYING) {
      this._drawBossProgress(ctx);
    }

    // Floating score popups
    for (const p of this._popups) {
      ctx.globalAlpha  = p.alpha;
      ctx.fillStyle    = p.pts >= 200 ? COL.PRIMARY : COL.MID;
      ctx.font         = `bold ${p.pts >= 200 ? 16 : 14}px ${FONT.MAIN}`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(p.label, p.x, p.y);
    }
    ctx.globalAlpha = 1;
  }

  _drawBossProgress(ctx) {
    // shows progress toward next boss every 1000m
    const segment = BOSS_TRIGGER_DIST;
    const pos     = this.distanceM % segment;
    const ratio   = pos / segment;
    const bx      = 6, by = 50, bw = WIDTH - 12, bh = 5;

    ctx.fillStyle = 'rgba(160,120,0,0.18)';
    ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 3); ctx.fill();

    const fg = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    fg.addColorStop(0,   COL.PRIMARY_MID);
    fg.addColorStop(0.7, COL.PRIMARY);
    fg.addColorStop(1,   '#00C853');
    ctx.fillStyle = fg;
    ctx.beginPath(); ctx.roundRect(bx, by, bw * ratio, bh, 3); ctx.fill();

    // skull icon near end
    if (ratio > 0.88) {
      ctx.font         = '12px serif';
      ctx.textAlign    = 'right';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha  = 0.5 + Math.sin(Date.now()/200)*0.5;
      ctx.fillText('⚔️', WIDTH - 8, by + bh/2);
      ctx.globalAlpha  = 1;
    }
  }

  // ── Weapon Charge Bar + Shield ───────────────────
  drawPowerups(ctx, player) {
    const barY = HEIGHT - 142;   // เหนือ joypad strip (joypad เริ่มที่ HEIGHT-82)
    const barW = 130;
    const barX = WIDTH/2 - barW/2;
    const barH = 12;

    const ratio   = Math.min(1, player.weaponCharge / WEAPON_CHARGE_MS);
    const isReady = player.weaponReady;
    // กะพริบสีเขียวเมื่อพร้อม
    const blink   = isReady && (Math.floor(Date.now() / (WEAPON_READY_BLINK_MS/2)) % 2 === 0);

    // label
    ctx.fillStyle    = isReady ? (blink ? '#22C55E' : '#16A34A') : 'rgba(92,61,0,0.65)';
    ctx.font         = `bold 10px ${FONT.BODY}`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(isReady ? '⚡ B พร้อมยิง!' : 'B กำลัง Charge...', WIDTH/2, barY - 2);

    // track
    ctx.fillStyle   = 'rgba(27,58,31,0.15)';
    ctx.strokeStyle = 'rgba(46,125,50,0.3)';
    ctx.lineWidth   = 1;
    ctx.beginPath(); ctx.roundRect(barX, barY, barW, barH, 6); ctx.fill(); ctx.stroke();

    // fill
    if (isReady) {
      ctx.fillStyle = blink ? '#4CAF50' : '#2E7D32';
      ctx.shadowColor = '#4CAF50';
      ctx.shadowBlur  = blink ? 8 : 0;
    } else {
      const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
      grad.addColorStop(0,   '#F9A825');
      grad.addColorStop(0.7, '#66BB6A');
      grad.addColorStop(1,   '#4CAF50');
      ctx.fillStyle  = grad;
      ctx.shadowBlur = 0;
    }
    if (ratio > 0) {
      ctx.beginPath(); ctx.roundRect(barX, barY, barW * ratio, barH, 6); ctx.fill();
    }
    ctx.shadowBlur = 0;

    // shield icon (ซ้ายล่าง)
    if (player.shielded) {
      ctx.font = '16px serif';
      ctx.textBaseline = 'middle';
      ctx.textAlign    = 'left';
      ctx.fillText('🛡️', 10, barY + barH/2);
      const r = player.shieldTimer / ITEM_TYPES.SHIELD.duration;
      ctx.fillStyle = 'rgba(80,180,255,0.7)';
      ctx.beginPath(); ctx.roundRect(32, barY+3, 28*r, barH-6, 2); ctx.fill();
    }
  }

  reset() {
    this.score     = 0;
    this.coins     = 0;
    this.distanceM = 0;
    this.hp        = PLAYER_HP;
    this._popups   = [];
    this._shakeT   = 0;
    this._bossFlash= 0;
  }
}
