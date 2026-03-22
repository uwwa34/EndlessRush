// ═══════════════════════════════════════════════════
//  js/enemy.js  —  Endless Rush
//
//  จัดการศัตรูทั้งหมดในเกม
//
//  Enemy types (กำหนดใน settings.js ENEMY_TYPES):
//    GROUND 🐢 — เดินบนพื้น, โดน stomp ตายได้
//    AIR    🦅 — บินอยู่กลางอากาศ
//    SPIKE  🌵 — อยู่นิ่ง, โดน stomp ไม่ตาย
//
//  EnemyManager.update(dt, worldSpeed, distanceM, frozen)
//    frozen = true (FREEZE powerup): ศัตรูหยุด movement
//    แต่ยัง scroll ตามโลก (worldSpeed * dt)
// ═══════════════════════════════════════════════════

class Enemy {
  constructor(type, x, y) {
    Object.assign(this, ENEMY_TYPES[type]);
    this.type    = type;
    this.x       = x;
    this.y       = y;
    this.alive   = true;
    this.frame   = 0;
    this.frameT  = 0;
    this._walkT  = Math.random() * Math.PI * 2;   // random phase
  }

  get bounds() {
    const pad = 5;
    return { x: this.x+pad, y: this.y+pad, w: this.w-pad*2, h: this.h-pad*2 };
  }

  update(dt, worldSpeed, frozen = false) {
    // frozen: หยุด self movement แต่ยัง scroll ตามโลก
    this.x -= frozen ? worldSpeed * dt : (worldSpeed + this.speed) * dt;
    this._walkT += frozen ? 0 : dt * 8;

    if (!frozen && this.airborne) {
      this.y += Math.sin(Date.now() / 350) * 0.8;
    }

    this.frameT += dt * 1000;
    if (this.frameT > 200) { this.frame = (this.frame+1)%2; this.frameT = 0; }

    if (this.x + this.w < -20) this.alive = false;
  }

  draw(ctx) {
    if (!this.alive) return;
    const sz = Math.max(this.w, this.h) * 1.15;

    if (ENEMY_TYPES[this.type] && ENEMY_TYPES[this.type].sprite) {
      ctx.save();
      if (this.airborne) {
        ctx.translate(this.x + this.w, this.y);
        ctx.scale(-1, 1);
        ctx.drawImage(ENEMY_TYPES[this.type].sprite, 0, 0, this.w, this.h);
      } else {
        // walk animation เฉพาะศัตรูที่เดิน (ไม่ใช่ SPIKE)
        if (this.type !== 'SPIKE') {
          const bob     = Math.sin(this._walkT) * 3;
          const scaleX  = 1 + Math.cos(this._walkT * 2) * 0.07;
          const scaleY  = 1 - Math.cos(this._walkT * 2) * 0.07;
          ctx.translate(this.x + this.w/2, this.y + this.h + bob);
          ctx.scale(scaleX, scaleY);
          ctx.drawImage(ENEMY_TYPES[this.type].sprite,
            -this.w/2, -this.h, this.w, this.h);
        } else {
          ctx.drawImage(ENEMY_TYPES[this.type].sprite, this.x, this.y, this.w, this.h);
        }
      }
      ctx.restore();
      return;
    }

    ctx.font = `${sz}px serif`;
    ctx.textBaseline = 'top';
    ctx.textAlign    = 'left';

    if (this.airborne) {
      ctx.save();
      ctx.translate(this.x + this.w/2, this.y + this.h/2);
      ctx.scale(-1, 1);
      ctx.fillText(this.emoji, -this.w/2, -this.h/2);
      ctx.restore();
    } else {
      // emoji walk: bob + squash เฉพาะศัตรูที่เดิน
      if (this.type !== 'SPIKE') {
        const bob    = Math.sin(this._walkT) * 3;
        const scaleX = 1 + Math.cos(this._walkT * 2) * 0.08;
        const scaleY = 1 - Math.cos(this._walkT * 2) * 0.08;
        ctx.save();
        ctx.translate(this.x + this.w/2, this.y + this.h/2 + bob);
        ctx.scale(scaleX, scaleY);
        ctx.fillText(this.emoji, -this.w/2, -this.h/2);
        ctx.restore();
      } else {
        ctx.fillText(this.emoji, this.x, this.y);
      }
    }
  }
}

// ─────────────────────────────────────────────────────
class EnemyManager {
  constructor() {
    this.enemies   = [];
    this._spawnT   = 0;
    this._minGap   = 1600;   // ms min between spawns
    this._maxGap   = 3200;
    this._nextSpawn= 2000;
    this._elapsed  = 0;
    this._diffMult = 1;
  }

  reset() {
    this.enemies    = [];
    this._elapsed   = 0;
    this._nextSpawn = 2000;
    this._spawnT    = 0;
    this._diffMult  = 1;
  }

  update(dt, worldSpeed, distanceM, frozen = false) {
    this._diffMult = 1 + distanceM / 2000;
    this._elapsed += dt * 1000;

    // spawn check (ไม่ spawn ใหม่ตอน freeze)
    if (!frozen) {
      this._spawnT += dt * 1000;
      if (this._spawnT >= this._nextSpawn) {
        this._spawnT   = 0;
        const minG = Math.max(800,  this._minGap / this._diffMult);
        const maxG = Math.max(1400, this._maxGap / this._diffMult);
        this._nextSpawn = minG + Math.random() * (maxG - minG);
        this._spawn(distanceM);
      }
    }

    for (const e of this.enemies) e.update(dt, worldSpeed, frozen);
    this.enemies = this.enemies.filter(e => e.alive);
  }

  _spawn(dist) {
    const r = Math.random();
    let type, x, y;

    if (dist < 300) {
      // early: only ground enemies
      type = 'GROUND';
    } else if (dist < 700) {
      type = r < 0.6 ? 'GROUND' : (r < 0.8 ? 'AIR' : 'SPIKE');
    } else {
      type = r < 0.4 ? 'GROUND' : (r < 0.7 ? 'AIR' : 'SPIKE');
    }

    x = WIDTH + 20;

    if (type === 'AIR') {
      // air enemies at varying heights above ground
      const airHeights = [
        GROUND_Y - PLAYER_H - 60,
        GROUND_Y - PLAYER_H - 30,
        GROUND_Y - PLAYER_H * 2.2,
      ];
      y = airHeights[Math.floor(Math.random() * airHeights.length)];
    } else {
      const eH = ENEMY_TYPES[type].h;
      y = GROUND_Y - eH;
    }

    // sometimes spawn two enemies close together (later game)
    this.enemies.push(new Enemy(type, x, y));
    if (dist > 500 && Math.random() < 0.25) {
      const gap  = 80 + Math.random() * 60;
      const type2 = type === 'GROUND' ? 'SPIKE' : 'GROUND';
      const y2    = GROUND_Y - ENEMY_TYPES[type2].h;
      this.enemies.push(new Enemy(type2, x + gap, y2));
    }
  }

  draw(ctx) {
    for (const e of this.enemies) e.draw(ctx);
  }

  checkCollisions(player) {
    const pb = player.bounds;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const eb = e.bounds;
      if (_rectsOverlap(pb, eb)) return e;
    }
    return null;
  }

  // called when player bounces off (boss fight perk, not used in normal)
  killEnemy(e) {
    e.alive = false;
  }
}

// ─── rect collision helper ────────────────────────────
function _rectsOverlap(a, b) {
  return a.x < b.x+b.w && a.x+a.w > b.x &&
         a.y < b.y+b.h && a.y+a.h > b.y;
}
