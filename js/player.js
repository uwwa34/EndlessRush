// ═══════════════════════════════════════════════════
//  js/player.js  —  Endless Rush
//
//  จัดการ state, physics, animation, และ powerup
//  ของ player character ทั้งหมด
//
//  API สำคัญที่ game.js เรียกใช้:
//    player.update(dt)          — เรียกทุก frame
//    player.draw(ctx)           — เรียกทุก frame
//    player.setJumpHeld(h, fe)  — รับ input กระโดด
//    player.hit()               — โดนตี → return true ถ้าตาย
//    player.activatePowerup(k)  — เปิด powerup
//    player.bounds              — collision box
// ═══════════════════════════════════════════════════

class Player {
  constructor() {
    // ── Position & Size ─────────────────────────
    this.x = PLAYER_X;
    this.y = GROUND_Y - PLAYER_H;
    this.w = PLAYER_W;
    this.h = PLAYER_H;

    // ── Physics ──────────────────────────────────
    this.vy       = 0;
    this.onGround = true;

    // ── Health ───────────────────────────────────
    this.hp    = PLAYER_HP;
    this.maxHp = PLAYER_HP;
    this.dead  = false;

    // ── Movement States ──────────────────────────
    this.jumping    = false;
    this.diving     = false;   // กำลัง dive (กด B ขณะลอย)
    this.sliding    = false;
    this.slideTimer = 0;
    this.dashing    = false;   // visual state สำหรับ dash trail (ใช้ตอน fire projectile)
    this.dashTimer  = 0;

    // ── Variable Jump ────────────────────────────
    // กดค้าง = กระโดดสูง, ปล่อยเร็ว = กระโดดต่ำ
    this._jumpHeld      = false;
    this._jumpHeldMs    = 0;
    this._jumpCut       = false;
    this._hasDoubleJump = true;  // คืนค่าตอน jump ครั้งแรก (ground jump)

    // ── Invincibility (หลังโดนตี) ────────────────
    this.invincible = false;
    this.invTimer   = 0;
    this.blinkPhase = 0;

    // ── Shield (จาก item) ────────────────────────
    this.shielded    = false;
    this.shieldTimer = 0;

    // ── Special Power-ups ────────────────────────
    this.activePowerup = null;  // key ของ powerup ที่กำลัง active (null = ไม่มี)
    this.powerupTimer  = 0;     // ms เหลืออยู่

    // Giant powerup: เก็บขนาดเดิมเพื่อ restore
    this._giantOrigW = 0;
    this._giantOrigH = 0;

    // Fly powerup: Y target ขณะลอย
    this._flyY = 0;

    // ── Weapon Charge ────────────────────────────
    // B button: charge หมดแล้วค่อยยิงได้ใหม่
    this.weaponCharge = WEAPON_CHARGE_MS;  // เริ่มพร้อมยิงทันที
    this.weaponReady  = true;
    this.specialGauge = 5;  // 0–5, ใช้แสดงใน HUD

    // ── Animation ────────────────────────────────
    this.frame      = 0;
    this.frameTimer = 0;
    this.FRAME_DUR  = 120;  // ms ต่อ frame
    this.sprite     = null; // Image element จาก assets (null = ใช้ emoji)

    // ── Slide Hitbox ─────────────────────────────
    // ตอน slide h จะเล็กลง และ y จะลงมา เพื่อให้ลอดผ่านอะไรได้
    this._normalH = PLAYER_H;
    this._slideH  = PLAYER_H * 0.5;
    this._normalY = GROUND_Y - PLAYER_H;
    this._slideY  = GROUND_Y - PLAYER_H * 0.5;
  }

  // ══════════════════════════════════════════════
  //  Actions (เรียกจาก game.js / joypad)
  // ══════════════════════════════════════════════

  /**
   * เรียกทุก frame พร้อม state ปุ่ม A (Jump)
   * @param {boolean} isHeld   — ปุ่มกดค้างอยู่
   * @param {boolean} forceEdge — บังคับ justPressed (สำหรับ touch tap)
   */
  setJumpHeld(isHeld, forceEdge = false) {
    const justPressed = (isHeld && !this._jumpHeld) || forceEdge;

    if (justPressed && this.activePowerup !== 'fly') {
      if (this.onGround) {
        this._tryJump();
      } else if (this._hasDoubleJump) {
        // Double jump
        this.vy             = DOUBLE_JUMP_VEL;
        this._hasDoubleJump = false;
        this._jumpCut       = false;
        this._jumpHeldMs    = 0;
        this.jumping        = true;
        this.diving         = false;
      }
    }

    // Variable jump height: ปล่อยปุ่มเร็ว → ตัด velocity
    if (!isHeld && this._jumpHeld && this.jumping && !this._jumpCut) {
      if (this.vy < JUMP_VEL_MIN) this.vy = JUMP_VEL_MIN;
      this._jumpCut = true;
    }
    this._jumpHeld = isHeld;
  }

  _tryJump() {
    if (this.dead) return;
    if (this.sliding) this._endSlide();
    if (this.onGround) {
      this.vy             = JUMP_VEL;
      this.onGround       = false;
      this.jumping        = true;
      this.diving         = false;
      this._jumpCut       = false;
      this._jumpHeldMs    = 0;
      this._hasDoubleJump = true;  // reset สำหรับ double jump ครั้งถัดไป
    }
  }

  /** กด B ขณะลอย = dive ลง, บนพื้น = slide */
  pressDown() {
    if (this.dead) return;
    if (!this.onGround && !this.diving) {
      this.vy     = DIVE_VEL;
      this.diving = true;
    } else if (this.onGround && !this.sliding) {
      this.sliding    = true;
      this.slideTimer = SLIDE_DUR;
      this.h          = this._slideH;
      this.y          = this._slideY;
    }
  }

  /** Bounce หลัง stomp ศัตรู — เรียกจาก game.js */
  stompBounce() {
    this.vy       = STOMP_BOUNCE;
    this.onGround = false;
    this.jumping  = true;
    this.diving   = false;
    this._jumpCut = false;
  }

  _endSlide() {
    this.sliding = false;
    this.h       = this._normalH;
    this.y       = this._normalY;
  }

  // ══════════════════════════════════════════════
  //  Health
  // ══════════════════════════════════════════════

  /**
   * โดนตี → return true ถ้าตาย
   * ถ้ามี shield จะ absorb แทน
   */
  hit() {
    if (this.invincible || this.dead) return false;
    if (this.shielded) {
      this.shielded    = false;
      this.shieldTimer = 0;
      this._startInvincible();
      return false;
    }
    this.hp--;
    if (this.hp <= 0) {
      this.hp   = 0;
      this.dead = true;
      return true;
    }
    this._startInvincible();
    return false;
  }

  _startInvincible() {
    this.invincible = true;
    this.invTimer   = INVINCIBLE_MS;
  }

  // ══════════════════════════════════════════════
  //  Weapon
  // ══════════════════════════════════════════════

  /**
   * ยิงกระสุน — return true ถ้ายิงได้ (weaponReady)
   * game.js จะสร้าง PlayerProjectile หลังจากนี้
   */
  fireProjectile() {
    if (this.dead || !this.weaponReady) return false;
    this.weaponReady  = false;
    this.weaponCharge = 0;
    return true;
  }

  // ══════════════════════════════════════════════
  //  Power-ups
  // ══════════════════════════════════════════════

  /** เปิด powerup ตาม key — จะ end powerup เก่าก่อนเสมอ */
  activatePowerup(key) {
    if (this.activePowerup) this._endPowerup(this.activePowerup);

    const def = Object.values(POWERUP_TYPES).find(p => p.key === key);
    if (!def) return;

    if (this.sliding) this._endSlide();  // จบ slide ก่อน activate

    this.activePowerup = key;
    this.powerupTimer  = def.duration;

    switch (key) {
      case 'fly':
        this.onGround = false;
        this.vy       = -400;
        this._flyY    = 60;
        break;
      case 'giant':
        // เก็บขนาดเดิมไว้ restore
        this._giantOrigW = this.w;
        this._giantOrigH = this.h;
        this.w = PLAYER_W * 2.2;
        this.h = PLAYER_H * 2.2;
        this.y = GROUND_Y - this.h;
        break;
    }
  }

  _endPowerup(key) {
    switch (key) {
      case 'fly':
        this.vy = 0;  // ปล่อยให้ gravity จัดการตกลงพื้น
        break;
      case 'giant':
        this.w = this._giantOrigW || PLAYER_W;
        this.h = this._giantOrigH || PLAYER_H;
        // snap Y กลับพื้นเฉพาะตอนยืนอยู่ — ถ้ากระโดดอยู่ให้ gravity จัดการ
        if (this.onGround) this.y = GROUND_Y - this.h;
        break;
    }
    this.activePowerup = null;
    this.powerupTimer  = 0;
  }

  /**
   * ใช้กับ item ที่ไม่ใช่ special powerup (heart, shield)
   * @param {'heart'|'shield'} type
   */
  applyPowerup(type) {
    if (type === 'shield') {
      this.shielded    = true;
      this.shieldTimer = ITEM_TYPES.SHIELD.duration;
    } else if (type === 'heart') {
      if (this.hp < this.maxHp) this.hp++;
    }
  }

  // ══════════════════════════════════════════════
  //  Update
  // ══════════════════════════════════════════════

  update(dt) {
    if (this.dead) return;

    // ── Slide timer ──────────────────────────────
    if (this.sliding) {
      this.slideTimer -= dt * 1000;
      if (this.slideTimer <= 0) this._endSlide();
    }

    // ── Weapon charge ────────────────────────────
    if (!this.weaponReady) {
      this.weaponCharge += dt * 1000;
      if (this.weaponCharge >= WEAPON_CHARGE_MS) {
        this.weaponCharge = WEAPON_CHARGE_MS;
        this.weaponReady  = true;
      }
      this.specialGauge = Math.floor((this.weaponCharge / WEAPON_CHARGE_MS) * 5);
    } else {
      this.specialGauge = 5;
    }

    // ── Powerup timer ────────────────────────────
    if (this.activePowerup && this.powerupTimer > 0) {
      this.powerupTimer -= dt * 1000;
      if (this.powerupTimer <= 0) this._endPowerup(this.activePowerup);
    }

    // ── Fly physics ──────────────────────────────
    // ขณะ fly: ลอยอยู่บนจอ กด A ค้าง = ขึ้น, ปล่อย = ลงนิดหน่อย
    if (this.activePowerup === 'fly') {
      const targetY = this._jumpHeld ? 40 : 120;
      this.y += (targetY - this.y) * dt * 3;
      this.vy       = 0;
      this.onGround = false;
      this.jumping  = false;
    }

    // ── Variable jump hold ───────────────────────
    if (this._jumpHeld && this.jumping && !this._jumpCut) {
      this._jumpHeldMs += dt * 1000;
      if (this._jumpHeldMs >= JUMP_HOLD_MS) this._jumpCut = true;
    }

    // ── Gravity ──────────────────────────────────
    if (!this.onGround && this.activePowerup !== 'fly') {
      this.vy += GRAVITY * dt;
      this.y  += this.vy * dt;
      const groundY = GROUND_Y - this.h;
      if (this.y >= groundY) {
        this.y        = groundY;
        this.vy       = 0;
        this.onGround = true;
        this.jumping  = false;
        this.diving   = false;
        this._jumpCut    = false;
        this._jumpHeldMs = 0;
      }
    }

    // ── Invincibility blink ──────────────────────
    if (this.invincible) {
      this.invTimer   -= dt * 1000;
      this.blinkPhase += dt * 20;
      if (this.invTimer <= 0) { this.invincible = false; this.blinkPhase = 0; }
    }

    // ── Shield timer ─────────────────────────────
    if (this.shielded) {
      this.shieldTimer -= dt * 1000;
      if (this.shieldTimer <= 0) this.shielded = false;
    }

    // ── Run animation frame ──────────────────────
    if (this.onGround && !this.sliding) {
      this.frameTimer += dt * 1000;
      if (this.frameTimer >= this.FRAME_DUR) {
        this.frameTimer = 0;
        this.frame = (this.frame + 1) % 4;
      }
    }
  }

  // ══════════════════════════════════════════════
  //  Collision
  // ══════════════════════════════════════════════

  /** Collision box (เล็กกว่า sprite เล็กน้อย เพื่อ forgiveness) */
  get bounds() {
    const pad = 6;
    return { x: this.x + pad, y: this.y + pad, w: this.w - pad*2, h: this.h - pad*2 };
  }

  // ══════════════════════════════════════════════
  //  Draw
  // ══════════════════════════════════════════════

  draw(ctx) {
    if (this.dead) return;

    // Invincible blink: skip draw frame เมื่อ sin < 0
    if (this.invincible && !this.dashing && Math.sin(this.blinkPhase) < 0) return;

    ctx.save();

    // Ghost powerup: กระพริบสลับโปร่งแสง
    if (this.activePowerup === 'ghost') {
      ctx.globalAlpha = Math.floor(Date.now() / 150) % 2 === 0 ? 0.25 : 0.8;
    }

    // Dash trail (visual feedback เมื่อยิงกระสุน)
    if (this.dashing) {
      const trailAlphas  = [0.15, 0.25, 0.40];
      const trailOffsets = [-32, -20, -10];
      trailAlphas.forEach((a, i) => {
        ctx.globalAlpha = a;
        ctx.filter = 'hue-rotate(30deg) saturate(3)';
        this._drawBody(ctx, this.x + trailOffsets[i], this.y);
      });
      // restore alpha — ถ้า ghost active ต้องคืนค่า ghost alpha ไม่ใช่ 1
      ctx.globalAlpha = this.activePowerup === 'ghost'
        ? (Math.floor(Date.now() / 150) % 2 === 0 ? 0.25 : 0.8)
        : 1;
      ctx.filter = 'none';
      // glow ring
      ctx.beginPath();
      ctx.arc(this.x + this.w/2, this.y + this.h/2, this.w * 0.85, 0, Math.PI*2);
      ctx.fillStyle   = 'rgba(255,200,0,0.22)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,180,0,0.70)';
      ctx.lineWidth   = 3;
      ctx.stroke();
    }

    // Shield bubble
    if (this.shielded) {
      ctx.beginPath();
      ctx.arc(this.x + this.w/2, this.y + this.h/2, this.w * 0.75, 0, Math.PI*2);
      ctx.fillStyle   = 'rgba(80,180,255,0.18)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(80,180,255,0.65)';
      ctx.lineWidth   = 2;
      ctx.stroke();
    }

    // Player body — alpha คงค่า ghost ไว้ (ไม่ reset เป็น 1)
    if (this.activePowerup !== 'ghost') ctx.globalAlpha = 1;
    ctx.filter = 'none';
    this._drawBody(ctx, this.x, this.y);

    ctx.restore();
  }

  /**
   * วาด body ตาม state ปัจจุบัน
   * ถ้ามี sprite = ใช้รูป, ไม่มี = ใช้ emoji fallback
   */
  _drawBody(ctx, x, y) {
    if (this.sprite) {
      this._drawSprite(ctx, x, y);
    } else {
      this._drawEmoji(ctx, x, y, this.w, this.h);
    }
  }

  _drawSprite(ctx, x, y) {
    if (this.sliding) {
      ctx.save();
      ctx.translate(x + this.w/2, y + this._slideH/2 + this._slideH*0.3);
      ctx.scale(1.3, 0.7);
      ctx.drawImage(this.sprite, -this.w/2, -this._slideH/2, this.w, this._slideH);
      ctx.restore();
    } else if (this.diving) {
      ctx.save();
      ctx.translate(x + this.w/2, y + this.h/2);
      ctx.rotate(Math.PI * 0.35);
      ctx.drawImage(this.sprite, -this.w/2, -this.h/2, this.w, this.h);
      ctx.restore();
    } else if (this.jumping) {
      ctx.save();
      ctx.translate(x + this.w/2, y + this.h/2);
      ctx.scale(0.85, 1.15);
      ctx.drawImage(this.sprite, -this.w/2, -this.h/2, this.w, this.h);
      ctx.restore();
    } else {
      // Run cycle: เอียงไปข้างหน้า → ตั้งตรง → เอียงไปข้างหน้า
      const t     = Date.now() / 120;
      const angle = Math.abs(Math.sin(t)) * 0.18;
      const bob   = Math.abs(Math.sin(t)) * -3;
      ctx.save();
      ctx.translate(x + this.w/2, y + this.h + bob);
      ctx.rotate(angle);
      ctx.drawImage(this.sprite, -this.w/2, -this.h, this.w, this.h);
      ctx.restore();
    }
  }

  _drawEmoji(ctx, x, y, w, h) {
    const emoji = '🦊';
    ctx.font         = `${Math.min(w, h) * 1.1}px serif`;
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'top';

    if (this.diving) {
      ctx.save();
      ctx.translate(x + w/2, y + h/2);
      ctx.rotate(Math.PI * 0.35);
      ctx.scale(1.1, 0.9);
      ctx.fillText(emoji, -w/2, -h/2);
      ctx.restore();
    } else if (this.jumping) {
      ctx.save();
      ctx.translate(x + w/2, y + h/2);
      ctx.scale(0.85, 1.15);
      ctx.fillText(emoji, -w/2, -h/2);
      ctx.restore();
    } else if (this.sliding) {
      ctx.save();
      ctx.translate(x + w/2, y + h/2);
      ctx.scale(1.3, 0.7);
      ctx.fillText(emoji, -w/2, -h/2);
      ctx.restore();
    } else {
      const t     = Date.now() / 120;
      const angle = Math.abs(Math.sin(t)) * 0.18;
      const bob   = Math.abs(Math.sin(t)) * -3;
      ctx.save();
      ctx.translate(x + w/2, y + h + bob);
      ctx.rotate(angle);
      ctx.fillText(emoji, -w/2, -h);
      ctx.restore();
    }
  }

  // ══════════════════════════════════════════════
  //  Reset
  // ══════════════════════════════════════════════

  /** Reset ทุก state กลับค่าเริ่มต้น — เรียกตอนเริ่มเกมใหม่ */
  reset() {
    this.y              = GROUND_Y - PLAYER_H;
    this.h              = this._normalH;
    this.w              = PLAYER_W;
    this.vy             = 0;
    this.onGround       = true;
    this.jumping        = false;
    this.diving         = false;
    this.sliding        = false;
    this.slideTimer     = 0;
    this.dead           = false;
    this.hp             = this.maxHp;
    this.invincible     = false;
    this.invTimer       = 0;
    this.blinkPhase     = 0;
    this.shielded       = false;
    this.shieldTimer    = 0;
    this.frame          = 0;
    this.frameTimer     = 0;
    this._jumpHeld      = false;
    this._jumpHeldMs    = 0;
    this._jumpCut       = false;
    this._hasDoubleJump = true;
    this.specialGauge   = 5;
    this.weaponCharge   = WEAPON_CHARGE_MS;
    this.weaponReady    = true;
    this.dashing        = false;
    this.dashTimer      = 0;
    this.activePowerup  = null;
    this.powerupTimer   = 0;
  }
}
