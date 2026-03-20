// ═══════════════════════════════════════════════════
//  js/boulder.js  —  Endless Rush  (Rolling Boulder)
// ═══════════════════════════════════════════════════

class Boulder {
  constructor(x, speed) {
    this.r      = 26 + Math.random() * 16;   // radius 26-42px
    this.x      = x;
    this.y      = GROUND_Y - this.r;         // วางบนพื้น
    this.vx     = -(speed + 60 + Math.random() * 80);  // เร็วกว่า world speed เล็กน้อย
    this.vy     = 0;
    this.angle  = 0;                         // หมุนขณะกลิ้ง
    this.alive  = true;
    this.points = 150;
    // สี — สุ่มระหว่าง หิน / ลูกบอลหนาม
    this._color = Math.random() < 0.5 ? 'rock' : 'spike';
  }

  get bounds() {
    return { x: this.x - this.r + 6, y: this.y - this.r + 6,
             w: this.r*2 - 12, h: this.r*2 - 12 };
  }

  update(dt, worldSpeed) {
    // เคลื่อนที่ + gravity ถ้ากระดอน
    this.x += (this.vx - worldSpeed * 0.3) * dt;
    this.vy += GRAVITY * dt;
    this.y  += this.vy * dt;

    // landing on ground
    if (this.y + this.r >= GROUND_Y) {
      this.y  = GROUND_Y - this.r;
      this.vy = this.vy < -80 ? this.vy * -0.45 : 0;  // กระดอนเล็กน้อย
    }

    // หมุนตามความเร็ว
    this.angle += (Math.abs(this.vx) / this.r) * dt;

    if (this.x + this.r < -60) this.alive = false;
  }

  draw(ctx) {
    if (!this.alive) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    if (this._color === 'rock') {
      // ลูกหิน
      ctx.beginPath();
      ctx.arc(0, 0, this.r, 0, Math.PI * 2);
      ctx.fillStyle   = '#795548';
      ctx.fill();
      // รอยแตก
      ctx.strokeStyle = '#5D4037';
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.moveTo(-this.r*0.3, -this.r*0.5);
      ctx.lineTo(this.r*0.1, this.r*0.2);
      ctx.lineTo(this.r*0.4, -this.r*0.1);
      ctx.stroke();
      // highlight
      ctx.beginPath();
      ctx.arc(-this.r*0.25, -this.r*0.3, this.r*0.22, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fill();
      // border
      ctx.beginPath();
      ctx.arc(0, 0, this.r, 0, Math.PI*2);
      ctx.strokeStyle = '#4E342E';
      ctx.lineWidth   = 2;
      ctx.stroke();
    } else {
      // ลูกบอลหนาม
      ctx.beginPath();
      ctx.arc(0, 0, this.r, 0, Math.PI*2);
      ctx.fillStyle   = '#E65100';
      ctx.fill();
      // หนาม
      const spikes = 8;
      ctx.fillStyle = '#BF360C';
      for (let i = 0; i < spikes; i++) {
        const a  = (i / spikes) * Math.PI * 2;
        const ix = Math.cos(a) * this.r * 0.75;
        const iy = Math.sin(a) * this.r * 0.75;
        const ox = Math.cos(a) * (this.r + 8);
        const oy = Math.sin(a) * (this.r + 8);
        const lx = Math.cos(a + 0.3) * this.r * 0.85;
        const ly = Math.sin(a + 0.3) * this.r * 0.85;
        ctx.beginPath();
        ctx.moveTo(ix, iy); ctx.lineTo(ox, oy); ctx.lineTo(lx, ly);
        ctx.closePath(); ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(0, 0, this.r, 0, Math.PI*2);
      ctx.strokeStyle = '#BF360C';
      ctx.lineWidth   = 1.5;
      ctx.stroke();
    }

    // เงา
    ctx.restore();
    ctx.save();
    ctx.translate(this.x, GROUND_Y);
    ctx.scale(1, 0.25);
    ctx.beginPath();
    ctx.arc(0, 0, this.r * 0.9, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fill();
    ctx.restore();
  }
}

// ─────────────────────────────────────────────────────
class BoulderManager {
  constructor() {
    this.boulders  = [];
    this._timer    = 0;
    this._nextSpawn = 5000 + Math.random() * 4000;
  }

  reset() {
    this.boulders   = [];
    this._timer     = 0;
    this._nextSpawn = 5000 + Math.random() * 4000;
  }

  update(dt, worldSpeed, distanceM) {
    if (distanceM < 200) return;   // ไม่ spawn ช่วงต้นเกม

    this._timer += dt * 1000;
    if (this._timer >= this._nextSpawn) {
      this._timer = 0;
      // spawn gap 4-8 วิ — ไม่บ่อยเกิน
      this._nextSpawn = 4000 + Math.random() * 4000;
      this.boulders.push(new Boulder(WIDTH + 60, worldSpeed));
    }

    for (const b of this.boulders) b.update(dt, worldSpeed);
    this.boulders = this.boulders.filter(b => b.alive);
  }

  draw(ctx) {
    for (const b of this.boulders) b.draw(ctx);
  }

  // เช็ค collision กับ player — return boulder ถ้าชน
  checkCollision(player) {
    const pb = player.bounds;
    for (const b of this.boulders) {
      if (!b.alive) continue;
      // circle vs rect
      const nearX = Math.max(pb.x, Math.min(b.x, pb.x + pb.w));
      const nearY = Math.max(pb.y, Math.min(b.y, pb.y + pb.h));
      const dx = b.x - nearX, dy = b.y - nearY;
      if (dx*dx + dy*dy < b.r * b.r * 0.7) return b;
    }
    return null;
  }

  // เช็ค projectile โดน boulder
  checkProjectileHit(proj) {
    for (const b of this.boulders) {
      if (!b.alive) continue;
      const pb = proj.bounds;
      const nearX = Math.max(pb.x, Math.min(b.x, pb.x + pb.w));
      const nearY = Math.max(pb.y, Math.min(b.y, pb.y + pb.h));
      const dx = b.x - nearX, dy = b.y - nearY;
      if (dx*dx + dy*dy < b.r * b.r * 0.75) {
        b.alive = false;
        return b;
      }
    }
    return null;
  }
}
