// ═══════════════════════════════════════════════════
//  Platform & Pit Manager
// ═══════════════════════════════════════════════════
class PlatformManager {
  constructor() {
    this.platforms = [];
    this.pits      = [];
    this._scrolled = 0;
    this._nextDist = 700;
  }

  reset() {
    this.platforms = [];
    this.pits      = [];
    this._scrolled = 0;
    this._nextDist = 700;
  }

  update(dt, worldSpeed, distanceM) {
    if (distanceM < 30) return;
    const dx = worldSpeed * dt;
    this._scrolled += dx;
    for (const p of this.platforms) p.x -= dx;
    for (const h of this.pits)      h.x -= dx;
    this.platforms = this.platforms.filter(p => p.x + p.w > -60);
    this.pits      = this.pits.filter(h => h.x + h.w > -60);

    if (this._scrolled >= this._nextDist) {
      this._scrolled = 0;
      this._nextDist = 600 + Math.random() * 700;
      if (distanceM > 80 && Math.random() < 0.35) {
        this._spawnPit();
      } else {
        this._spawnPlatformGroup();
      }
    }
  }

  _spawnPlatformGroup() {
    const r = Math.random();
    if (r < 0.5) {
      // ระดับ 1 เดี่ยว
      this._addPlatform(1, WIDTH + 60);
    } else if (r < 0.80) {
      // ระดับ 1 + ระดับ 2 ต่อกัน
      const x1 = WIDTH + 60;
      const p1 = this._addPlatform(1, x1);
      // ระดับ 2 เริ่มหลัง p1 โดยห่างพอกระโดดได้
      this._addPlatform(2, x1 + p1.w + 80 + Math.random()*60);
    } else {
      // ระดับ 1 → 2 → 3 เต็มชุด
      const x1 = WIDTH + 60;
      const p1 = this._addPlatform(1, x1);
      const x2 = x1 + p1.w + 80 + Math.random()*50;
      const p2 = this._addPlatform(2, x2);
      const x3 = x2 + p2.w + 70 + Math.random()*50;
      this._addPlatform(3, x3);
    }
  }

  _addPlatform(level, x) {
    const w = 180 + Math.random() * 120;   // 180-300px
    // ระดับสูงสุดที่กระโดดถึง (JUMP_VEL=-720, GRAVITY=1600)
    // max height ≈ v²/(2g) = 720²/3200 ≈ 162px
    const yByLevel = {
      1: GROUND_Y - 115,   // ต่ำ  — กระโดดธรรมดา
      2: GROUND_Y - 220,   // กลาง — ต้องกระโดดจาก platform ระดับ 1
      3: GROUND_Y - 320,   // สูง  — ต้องกระโดดจาก platform ระดับ 2
    };
    const p = { x, y: yByLevel[level], w, h: 20, level, _coinsSpawned: false };
    this.platforms.push(p);
    return p;
  }

  _spawnPit() {
    const w = 200 + Math.random() * 20;   // 200-220px
    this.pits.push({ x: WIDTH + 60, w });
  }

  // ── Player collision ─────────────────────────────
  resolvePlayer(player) {
    // Platform landing (ลงจากด้านบนเท่านั้น)
    for (const p of this.platforms) {
      const pb           = player.bounds;
      const playerBottom = pb.y + pb.h;
      const prevBottom   = playerBottom - player.vy * (1/60);
      if (player.vy >= 0 &&
          prevBottom <= p.y + 8 &&
          playerBottom >= p.y &&
          pb.x + pb.w > p.x + 6 &&
          pb.x < p.x + p.w - 6) {
        player.y              = p.y - player.h;
        player.vy             = 0;
        player.onGround       = true;
        player.jumping        = false;
        player.diving         = false;
        player._jumpCut       = false;
        player._jumpHeldMs    = 0;
        player._hasDoubleJump = true;
      }
    }

    // Walk off platform edge
    if (player.onGround) {
      const onMainGround = player.y + player.h >= GROUND_Y - 2;
      if (!onMainGround) {
        let stillOn = false;
        for (const p of this.platforms) {
          const pb = player.bounds;
          if (pb.x + pb.w > p.x + 4 &&
              pb.x < p.x + p.w - 4 &&
              Math.abs((player.y + player.h) - p.y) < 6) {
            stillOn = true;
            break;
          }
        }
        if (!stillOn) player.onGround = false;
      }
    }

    // ── Player enters pit zone → start falling ────
    let overPit = false;
    for (const h of this.pits) {
      // เช็ค overlap แทน center point — ป้องกัน player หลุดออกจาก pit zone
      const pl = player.x + player.w * 0.2;   // 20% จากซ้าย
      const pr = player.x + player.w * 0.8;   // 80% จากซ้าย
      const inPit = pr > h.x && pl < h.x + h.w;
      if (inPit) {
        overPit = true;
        if (player.onGround) player.onGround = false;
        break;
      }
    }

    // ── Die when fell below screen ────────────────
    if (player.y > HEIGHT + 20) return { result:'pit', overPit };

    return { result: null, overPit };
  }

  // Enemy falls into pit
  checkEnemyPit(enemy) {
    if (enemy.airborne) return;
    for (const h of this.pits) {
      const ex = enemy.x + enemy.w * 0.5;
      if (ex > h.x + 4 && ex < h.x + h.w - 4) enemy.alive = false;
    }
  }

  // ── Draw ─────────────────────────────────────────
  draw(ctx) {
    // Pits — erase ground, draw dark void
    for (const h of this.pits) {
      // sky colour patch
      ctx.fillStyle = COL.BG_SKY;
      ctx.fillRect(h.x, GROUND_Y - 1, h.w, HEIGHT - GROUND_Y + 2);
      // dark void
      const pg = ctx.createLinearGradient(0, GROUND_Y, 0, HEIGHT);
      pg.addColorStop(0, 'rgba(10,25,12,0.95)');
      pg.addColorStop(1, '#020803');
      ctx.fillStyle = pg;
      ctx.fillRect(h.x, GROUND_Y, h.w, HEIGHT - GROUND_Y);
      // edges
      ctx.strokeStyle = COL.PRIMARY_D;
      ctx.lineWidth   = 3;
      ctx.beginPath();
      ctx.moveTo(h.x,       GROUND_Y - 8); ctx.lineTo(h.x,       HEIGHT);
      ctx.moveTo(h.x + h.w, GROUND_Y - 8); ctx.lineTo(h.x + h.w, HEIGHT);
      ctx.stroke();
      // warning
      if (h.x > 0 && h.x < WIDTH) {
        ctx.globalAlpha  = 0.55 + Math.sin(Date.now()/300) * 0.35;
        ctx.font         = '20px serif';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('⚠️', h.x + h.w/2, GROUND_Y - 8);
        ctx.globalAlpha  = 1;
      }
    }

    // Platforms — colour by level
    const levelColors = {
      1: { top:'#A5D6A7', mid:'#66BB6A', bot:'#388E3C', border:'#2E7D32', grass:'#558B2F' },
      2: { top:'#80CBC4', mid:'#4DB6AC', bot:'#00796B', border:'#004D40', grass:'#00695C' },
      3: { top:'#CE93D8', mid:'#AB47BC', bot:'#7B1FA2', border:'#4A148C', grass:'#6A1B9A' },
    };
    for (const p of this.platforms) {
      const c = levelColors[p.level] || levelColors[1];
      // shadow
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.beginPath(); ctx.roundRect(p.x+4, p.y+p.h+3, p.w-4, 7, 3); ctx.fill();
      // body
      const pg2 = ctx.createLinearGradient(0, p.y, 0, p.y+p.h);
      pg2.addColorStop(0, c.top); pg2.addColorStop(0.5, c.mid); pg2.addColorStop(1, c.bot);
      ctx.fillStyle = pg2;
      ctx.beginPath(); ctx.roundRect(p.x, p.y, p.w, p.h, 6); ctx.fill();
      // highlight
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath(); ctx.roundRect(p.x+4, p.y+2, p.w-8, 5, 3); ctx.fill();
      // border
      ctx.strokeStyle = c.border; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(p.x, p.y, p.w, p.h, 6); ctx.stroke();
      // grass
      ctx.fillStyle = c.grass;
      for (let gx = p.x+10; gx < p.x+p.w-6; gx += 18) {
        ctx.beginPath(); ctx.arc(gx, p.y, 6, Math.PI, 0); ctx.fill();
      }
    }
  }

  get activePlatforms() { return this.platforms; }
}

// ═══════════════════════════════════════════════════
//  World
// ═══════════════════════════════════════════════════
class World {
  constructor() {
    this.scrollX   = 0;
    this.distanceM = 0;
    this.speed     = BASE_SPEED;
    this.timeAlive = 0;
    this.running   = false;
    this._layerOffsets = [0, 0, 0];
    this.bossAlpha = 0;
    this.bgImages  = {};
    this.platforms = new PlatformManager();
    this._bgX      = 0;   // horizontal scroll for bg image
  }

  start()  { this.running = true;  }
  pause()  { this.running = false; }
  resume() { this.running = true;  }

  update(dt, playerSpeedMult = 1) {
    if (!this.running) return;
    const spd = this.speed * playerSpeedMult;
    const dx  = spd * dt;
    this.scrollX   += dx;
    this.distanceM  = this.scrollX / 10;
    this._bgX      += dx * 0.3;   // bg scrolls slower (parallax)
    for (let i = 0; i < 3; i++) this._layerOffsets[i] += dx * BG_LAYERS[i].speedFactor;
    this.platforms.update(dt, spd, this.distanceM);
  }

  draw(ctx) {
    // ── Background image or gradient ─────────────
    const bgImg = this.bgImages && this.bgImages.background;
    if (bgImg) {
      // tile horizontally
      const iw   = bgImg.width  || WIDTH;
      const ih   = bgImg.height || HEIGHT;
      const scale = HEIGHT / ih;
      const sw    = iw * scale;
      const offX  = -(this._bgX % sw);
      // boss tint overlay
      if (this.bossAlpha > 0) {
        ctx.fillStyle = `rgba(10,25,12,${this.bossAlpha * 0.6})`;
      }
      for (let x = offX; x < WIDTH + sw; x += sw) {
        ctx.drawImage(bgImg, x, 0, sw, HEIGHT);
      }
      if (this.bossAlpha > 0) {
        ctx.fillStyle = `rgba(10,25,12,${this.bossAlpha * 0.55})`;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
      }
    } else {
      // fallback gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
      if (this.bossAlpha > 0) {
        const t = this.bossAlpha;
        skyGrad.addColorStop(0,   _lerpColor(COL.BG_SKY,  COL.BG_BOSS_TOP, t));
        skyGrad.addColorStop(0.6, _lerpColor(COL.BG_SKY2, COL.BG_BOSS_MID, t));
        skyGrad.addColorStop(1,   _lerpColor('#E8F5E9',   '#1B4A1E',        t));
      } else {
        skyGrad.addColorStop(0,   COL.BG_SKY);
        skyGrad.addColorStop(0.6, COL.BG_SKY2);
        skyGrad.addColorStop(1,   '#E8F5E9');
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }

    this._drawGround(ctx);
    this.platforms.draw(ctx);
  }

  _drawGround(ctx) {
    const gy = GROUND_Y, gh = HEIGHT - GROUND_Y;
    const g = ctx.createLinearGradient(0, gy, 0, gy + gh);
    g.addColorStop(0,   COL.BG_GROUND);
    g.addColorStop(0.3, '#7CB342');
    g.addColorStop(1,   '#558B2F');
    ctx.fillStyle = g;
    ctx.fillRect(0, gy, WIDTH, gh);
    ctx.strokeStyle = COL.PRIMARY_D; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(WIDTH, gy); ctx.stroke();
    // grass bumps
    ctx.fillStyle = '#689F38';
    const bo = this._layerOffsets[2] % 60;
    for (let x = -bo; x < WIDTH + 60; x += 60) {
      ctx.beginPath(); ctx.arc(x, gy, 8, Math.PI, 0); ctx.fill();
    }
    // dashed line
    ctx.strokeStyle = 'rgba(100,200,50,0.3)'; ctx.lineWidth = 2;
    ctx.setLineDash([18, 14]);
    const doff = this.scrollX % 32;
    ctx.beginPath(); ctx.moveTo(-doff, gy+14); ctx.lineTo(WIDTH, gy+14); ctx.stroke();
    ctx.setLineDash([]);
  }

  reset() {
    this.scrollX   = 0;
    this.distanceM = 0;
    this.speed     = BASE_SPEED;
    this.timeAlive = 0;
    this.running   = false;
    this.bossAlpha = 0;
    this._bgX      = 0;
    this._layerOffsets = [0, 0, 0];
    this.platforms.reset();
  }
}

function _lerpColor(hex1, hex2, t) {
  const p = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
  const [r1,g1,b1] = p(hex1), [r2,g2,b2] = p(hex2);
  return `rgb(${Math.round(r1+(r2-r1)*t)},${Math.round(g1+(g2-g1)*t)},${Math.round(b1+(b2-b1)*t)})`;
}
