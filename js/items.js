// ═══════════════════════════════════════════════════
//  js/items.js  —  Endless Rush
// ═══════════════════════════════════════════════════

class Item {
  constructor(typeKey, x, y) {
    const def    = ITEM_TYPES[typeKey];
    this.typeKey = typeKey;
    this.emoji   = def.emoji;
    this.points  = def.points;
    this.w       = def.w;
    this.h       = def.h;
    this.x       = x;
    this.y       = y;
    this.alive   = true;
    this._t      = Math.random() * Math.PI * 2;
  }

  get bounds() {
    const pad = 5;
    return { x: this.x+pad, y: this.y+pad, w: this.w-pad*2, h: this.h-pad*2 };
  }

  update(dt, worldSpeed) {
    this._t += dt * 3;

    if (this._isBossDrop && !this._arrived) {
      // บินลงหา player — ไม่ scroll กับโลก
      this._blinkTimer += dt;
      const speed = 400 + (this._dropTargetY - this.y) * 3;
      this.y += Math.max(60, speed) * dt;
      if (this.y >= this._dropTargetY) {
        this.y        = this._dropTargetY;
        this._arrived = true;   // ถึงแล้ว เก็บได้
      }
    } else {
      this.x -= worldSpeed * dt;
      if (this.x + this.w < -20) this.alive = false;
    }
  }

  draw(ctx) {
    if (!this.alive) return;
    const bob  = this._arrived ? Math.sin(this._t) * 4 : 0;
    const glow = Math.abs(Math.sin(this._t)) * 0.4 + 0.6;

    // boss drop: กะพริบสีขาว-สี
    if (this._isBossDrop && !this._arrived) {
      const blink = Math.floor(this._blinkTimer * 8) % 2 === 0;
      ctx.save();
      ctx.globalAlpha = 0.9;
      if (blink) ctx.filter = 'brightness(2.5) saturate(0.2)';
      ctx.font         = `${this.w * 1.5}px serif`;
      ctx.textBaseline = 'top';
      ctx.textAlign    = 'left';
      ctx.fillText(this.emoji, this.x, this.y);
      ctx.restore();
      return;
    }

    // sprite image
    const typeDef = ITEM_TYPES[this.typeKey];
    if (typeDef && typeDef.sprite) {
      ctx.globalAlpha = glow;
      ctx.drawImage(typeDef.sprite, this.x, this.y + bob, this.w, this.h);
      ctx.globalAlpha = 1;
      return;
    }

    // ORB มี glow ring พิเศษ
    if (this.typeKey === 'ORB') {
      const pulse = Math.sin(this._t * 2) * 0.5 + 0.5;
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x + this.w/2, this.y + this.h/2 + bob, this.w * 0.7, 0, Math.PI*2);
      ctx.fillStyle   = `rgba(100,180,255,${0.12 + pulse * 0.15})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(80,160,255,${0.4 + pulse * 0.4})`;
      ctx.lineWidth   = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    ctx.globalAlpha  = glow;
    ctx.font         = `${this.w * 1.2}px serif`;
    ctx.textBaseline = 'top';
    ctx.textAlign    = 'left';
    ctx.fillText(this.emoji, this.x, this.y + bob);
    ctx.globalAlpha = 1;
  }
}

// ─────────────────────────────────────────────────────
class ItemManager {
  constructor() {
    this.items      = [];
    this._spawnT    = 0;
    this._nextSpawn = 1200 + Math.random() * 1000;
  }

  reset() {
    this.items      = [];
    this._spawnT    = 0;
    this._nextSpawn = 1200 + Math.random() * 1000;
  }

  update(dt, worldSpeed, distanceM, platformList) {
    this._spawnT += dt * 1000;
    if (this._spawnT >= this._nextSpawn) {
      this._spawnT    = 0;
      this._nextSpawn = 800 + Math.random() * 1400;
      this._spawn(distanceM);
    }

    // spawn coins บน platform ที่เพิ่งเข้ามา
    if (platformList) {
      for (const p of platformList) {
        if (!p._coinsSpawned && p.x < WIDTH && p.x > WIDTH - 60) {
          p._coinsSpawned = true;
          const count = 2 + Math.floor(Math.random() * 3);
          const gap   = (p.w - 16) / count;
          for (let i = 0; i < count; i++) {
            // สลับระหว่าง COIN และ STAR บางครั้ง
            const type = Math.random() < 0.8 ? 'COIN' : 'STAR';
            this.items.push(new Item(type, p.x + 8 + i * gap, p.y - 34));
          }
        }
      }
    }

    for (const item of this.items) item.update(dt, worldSpeed);
    this.items = this.items.filter(i => i.alive);
  }

  _spawn(dist) {
    const r = Math.random();
    let typeKey;
    // COIN 55% / STAR 20% / HEART 15% / SHIELD 10%
    if      (r < 0.55) typeKey = 'COIN';
    else if (r < 0.75) typeKey = 'STAR';
    else if (r < 0.90) typeKey = 'HEART';
    else               typeKey = 'SHIELD';

    const x = WIDTH + 20;
    const heights = [
      GROUND_Y - 36,
      GROUND_Y - 80,
      GROUND_Y - 140,
    ];
    const y = heights[Math.floor(Math.random() * heights.length)];

    // coin chain
    if (typeKey === 'COIN' && Math.random() < 0.5) {
      const count = 3 + Math.floor(Math.random() * 4);
      for (let i = 0; i < count; i++) {
        this.items.push(new Item('COIN', x + i * 38, y));
      }
    } else {
      this.items.push(new Item(typeKey, x, y));
    }
  }

  draw(ctx) {
    for (const i of this.items) i.draw(ctx);
  }

  checkCollect(player) {
    const pb = player.bounds;
    for (const item of this.items) {
      if (!item.alive) continue;
      if (_rectsOverlap(pb, item.bounds)) {
        item.alive = false;
        return item;
      }
    }
    return null;
  }
}

