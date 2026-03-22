// ═══════════════════════════════════════════════════
//  js/boss.js  —  Endless Rush  (Raid Mode)
//
//  Boss ไม่มี fight state แยก — โฉบผ่านระหว่าง PLAYING
//  ทุก ~1000m boss บินมาจากขวา → ผ่านจอ → ออกซ้าย
//  ก่อนมา 2.5s: warning + spawn platform ช่วย player
// ═══════════════════════════════════════════════════

const RAID_STATE = {
  IDLE     : 'IDLE',
  WARNING  : 'WARNING',   // แจ้งเตือน กำลังมา
  INCOMING : 'INCOMING',  // กำลังบินเข้า
  PASSING  : 'PASSING',   // กำลังบินผ่าน
  DONE     : 'DONE',
};

// ── Boss Raid ────────────────────────────────────────
class BossRaid {
  constructor() {
    this.state        = RAID_STATE.IDLE;
    this.def          = BOSSES[0];
    this.sprite       = null;

    this.x            = WIDTH + 60;
    this.y            = 0;
    this.w            = 160;
    this.h            = 160;

    this.hp           = 0;
    this.maxHp        = 0;
    this._raidCount   = 0;

    this._timer       = 0;
    this._warningDur  = 2500;   // ms warning ก่อนบอสมา
    this._speed       = 340;    // px/sec บินผ่าน

    this.hitFlash     = 0;
    this._bobT        = 0;

    // raid Y level สุ่มก่อน
    this._raidY       = 0;

    // projectiles จาก boss ระหว่าง passing
    this.projectiles  = [];
    this._shotTimer   = 0;
    this._shotCD      = 600;    // ms ระหว่างยิง
  }

  // ── เริ่ม raid ───────────────────────────────────
  startRaid() {
    this.def      = BOSSES[0];
    this.hp       = this.def.hp;
    this.maxHp    = this.def.hp;
    this.state    = RAID_STATE.WARNING;
    this._timer   = 0;
    this._raidCount++;
    this.projectiles = [];
    this._shotTimer  = 0;
    this.hitFlash    = 0;

    // สุ่ม Y ที่บอสโฉบมา — 3 ระดับ
    const levels = [
      GROUND_Y - this.h - 10,        // ต่ำ: player ต้องกระโดดขึ้น platform
      GROUND_Y - this.h - 100,       // กลาง
      GROUND_Y - this.h - 200,       // สูง: player ต้องหลบลงต่ำ
    ];
    this._raidY = levels[Math.floor(Math.random() * levels.length)];

    // เพิ่มความเร็วทุก raid
    this._speed = 300 + this._raidCount * 20;
  }

  // ── Update ───────────────────────────────────────
  update(dt, worldSpeed) {
    this._bobT += dt * 3;
    if (this.hitFlash > 0) this.hitFlash--;

    // update projectiles
    for (const p of this.projectiles) {
      p.x -= (worldSpeed + 200) * dt;
      p.y += p.vy * dt;
      if (p.x < -40 || p.y > HEIGHT) p.alive = false;
    }
    this.projectiles = this.projectiles.filter(p => p.alive);

    switch (this.state) {
      case RAID_STATE.WARNING:
        this._timer += dt * 1000;
        // boss รออยู่นอกจอขวา
        this.x = WIDTH + this.w + 20;
        this.y = this._raidY;
        if (this._timer >= this._warningDur) {
          this.state  = RAID_STATE.INCOMING;
          this._timer = 0;
        }
        break;

      case RAID_STATE.INCOMING:
        // บินเข้าจอ
        this.x -= this._speed * dt;
        this.y  = this._raidY + Math.sin(this._bobT * 2) * 10;
        // ยิงระหว่างบินผ่าน
        this._shotTimer += dt * 1000;
        if (this._shotTimer >= this._shotCD) {
          this._shotTimer = 0;
          this._fireShot();
        }
        if (this.x < -this.w - 20) {
          this.state = RAID_STATE.DONE;
        }
        break;

      case RAID_STATE.DONE:
        break;
    }
  }

  _fireShot() {
    // ยิงกระสุนลงข้างล่างไปซ้าย (หาก player อยู่ซ้าย)
    this.projectiles.push({
      x: this.x + this.w * 0.3,
      y: this.y + this.h,
      vy: 120,
      w: 24, h: 24,
      alive: true,
      emoji: '🔥',
    });
  }

  // ── Hit by player projectile ──────────────────────
  takeHit(dmg = 1) {
    if (this.state !== RAID_STATE.INCOMING) return false;
    this.hp -= dmg;
    this.hitFlash = 8;
    if (this.hp <= 0) {
      this.hp    = 0;
      this.state = RAID_STATE.DONE;
      return 'dead';
    }
    return 'hit';
  }

  // hitbox ของ boss body
  get bounds() {
    return { x: this.x+12, y: this.y+12, w: this.w-24, h: this.h-24 };
  }

  // เช็ค boss projectile โดน player
  checkProjectileHit(player) {
    const pb = player.bounds;
    for (const p of this.projectiles) {
      if (!p.alive) continue;
      const pb2 = { x:p.x+4, y:p.y+4, w:p.w-8, h:p.h-8 };
      if (_rectsOverlap(pb, pb2)) { p.alive = false; return true; }
    }
    return false;
  }

  // เช็ค boss body โดน player (โฉบชน)
  checkBodyHit(player) {
    if (this.state !== RAID_STATE.INCOMING) return false;
    if (!_rectsOverlap(player.bounds, this.bounds)) return false;
    // boss ผ่าน player ไปแล้ว (ขอบขวาของ boss อยู่ซ้ายของ player center) → ไม่ damage
    const playerCX = player.bounds.x + player.bounds.w / 2;
    if (this.bounds.x + this.bounds.w < playerCX) return false;
    return true;
  }

  get isActive() { return this.state === RAID_STATE.INCOMING; }
  get isDone()   { return this.state === RAID_STATE.DONE; }
  get isWarning(){ return this.state === RAID_STATE.WARNING; }

  // ── Draw ─────────────────────────────────────────
  draw(ctx) {
    if (this.state === RAID_STATE.IDLE || this.state === RAID_STATE.DONE) return;

    // วาดกระสุน
    for (const p of this.projectiles) {
      if (!p.alive) continue;
      ctx.font         = '22px serif';
      ctx.textBaseline = 'top';
      ctx.textAlign    = 'left';
      ctx.fillText(p.emoji, p.x, p.y);
    }

    if (this.state === RAID_STATE.WARNING) {
      // แสดง warning indicator ขอบขวา
      this._drawWarning(ctx);
      return;
    }

    // วาด boss
    ctx.save();
    if (this.hitFlash > 0 && this.hitFlash % 2 === 0) {
      ctx.filter = 'hue-rotate(120deg) saturate(3)';
    }

    const drawW = this.w * 1.3;
    const drawH = this.h * 1.3;

    if (this.sprite || (this.def && this.def.sprite)) {
      const spr = this.sprite || this.def.sprite;
      ctx.save();
      ctx.translate(this.x + this.w/2, this.y + this.h/2);
      ctx.scale(-1, 1);   // หน้าไปซ้าย (บินมาจากขวา)
      ctx.drawImage(spr, -drawW/2, -drawH/2, drawW, drawH);
      ctx.restore();
    } else {
      ctx.font         = `${drawW * 0.85}px serif`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.def ? this.def.emoji : '👾',
        this.x + this.w/2, this.y + this.h/2);
    }

    // HP bar เล็กๆ ใต้บอส
    if (this.hp < this.maxHp) {
      const bw = this.w, bh = 6;
      const bx = this.x, by = this.y + drawH * 0.7;
      ctx.filter    = 'none';
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 3); ctx.fill();
      ctx.fillStyle = '#EF5350';
      ctx.beginPath(); ctx.roundRect(bx, by, bw*(this.hp/this.maxHp), bh, 3); ctx.fill();
    }

    ctx.restore();
  }

  _drawWarning(ctx) {
    // กะพริบที่ขอบขวา — ลูกศร + ชื่อ boss
    const t     = this._timer;
    const blink = Math.floor(t / 200) % 2 === 0;
    const alpha = blink ? 0.9 : 0.4;

    ctx.save();
    ctx.globalAlpha = alpha;

    // arrow ชี้ขวา
    const ay = this._raidY + this.h / 2;
    ctx.fillStyle    = '#EF5350';
    ctx.font         = '28px serif';
    ctx.textAlign    = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚠️', WIDTH - 8, ay);

    // ชื่อ boss
    ctx.fillStyle    = '#EF5350';
    ctx.font         = `bold 13px ${FONT.MAIN}`;
    ctx.textAlign    = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.def ? this.def.name : 'BOSS', WIDTH - 40, ay);

    // progress bar countdown
    const ratio  = this._timer / this._warningDur;
    const barW   = 100, barH = 5;
    const barX   = WIDTH - barW - 8;
    const barY   = ay + 22;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.roundRect(barX, barY, barW, barH, 2); ctx.fill();
    ctx.fillStyle = '#EF5350';
    ctx.beginPath(); ctx.roundRect(barX, barY, barW*ratio, barH, 2); ctx.fill();

    ctx.restore();
  }
}

// ── Stub BOSS_STATE ยังคงไว้ให้ game.js อ้างอิงได้ ──
// (ไม่ได้ใช้แล้ว แต่ป้องกัน reference error)
const BOSS_STATE = {
  IDLE: 'IDLE', INTRO:'INTRO', FIGHT:'FIGHT',
  PHASE2:'PHASE2', STUNNED:'STUNNED', DEAD:'DEAD',
};
class Boss {
  constructor() { this.state = BOSS_STATE.IDLE; this.def = null; }
  activate() {}
  update()   {}
  draw()     {}
  drawHPBar(){}
  takeHit()  { return false; }
  checkProjectileHit() { return false; }
  checkPlayerProjectileHit() { return false; }
  get isDone() { return false; }
}
