// ═══════════════════════════════════════════════════
//  js/player.js  —  Endless Rush
// ═══════════════════════════════════════════════════

class Player {
  constructor() {
    this.x = PLAYER_X;
    this.y = GROUND_Y - PLAYER_H;
    this.w = PLAYER_W;
    this.h = PLAYER_H;

    this.vy       = 0;
    this.onGround = true;
    this.hp       = PLAYER_HP;
    this.maxHp    = PLAYER_HP;

    // states
    this.jumping    = false;
    this.diving     = false;   // กำลัง dive ลง
    this.sliding    = false;
    this.slideTimer = 0;
    this.dead       = false;

    // variable jump
    this._jumpHeld    = false;
    this._jumpHeldMs  = 0;
    this._jumpCut     = false;
    this._hasDoubleJump = true;   // รีเซ็ตเมื่อแตะพื้น

    // invincibility
    this.invincible  = false;
    this.invTimer    = 0;
    this.blinkPhase  = 0;

    // power-ups
    this.shielded    = false;
    this.shieldTimer = 0;
    this.speedUp     = false;   // ยังคงไว้ใน code แต่ไม่ถูกใช้จาก item แล้ว
    this.speedTimer  = 0;
    this.speedMult   = 1;

    // ── Weapon Charge (B button) ───────────────────
    this.weaponCharge  = WEAPON_CHARGE_MS;  // ms — เริ่มพร้อมยิงได้เลย
    this.weaponReady   = true;              // true = ยิงได้แล้ว
    // specialGauge ไม่ใช้แล้ว แต่คง field ไว้กัน error
    this.specialGauge  = 0;
    this.dashing       = false;
    this.dashTimer     = 0;

    // visuals
    this.frame       = 0;
    this.frameTimer  = 0;
    this.FRAME_DUR   = 120;
    this.RUN_FRAMES  = ['🦊','🦊','🦊','🦊'];
    this.sprite      = null;

    // slide hitbox
    this._normalH = PLAYER_H;
    this._slideH  = PLAYER_H * 0.5;
    this._normalY = GROUND_Y - PLAYER_H;
    this._slideY  = GROUND_Y - PLAYER_H * 0.5;
  }

  // ── Actions ─────────────────────────────────────

  // เรียกทุก frame ที่ปุ่ม A ถูกกดค้าง (isHeld = true) หรือปล่อย (false)
  setJumpHeld(isHeld, forceEdge = false) {
    const justPressed = (isHeld && !this._jumpHeld) || forceEdge;

    if (justPressed) {
      if (this.onGround) {
        this._tryJump();
      } else if (this._hasDoubleJump) {
        this.vy              = DOUBLE_JUMP_VEL;
        this._hasDoubleJump  = false;
        this._jumpCut        = false;
        this._jumpHeldMs     = 0;
        this.jumping         = true;
        this.diving          = false;
      }
    }
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
      this._hasDoubleJump = true;   // reset ให้ใช้ได้ 1 ครั้งต่อการบิน
    }
  }

  // กด B ขณะบิน = dive ลง, บนพื้น = slide
  pressDown() {
    if (this.dead) return;
    if (!this.onGround && !this.diving) {
      // Dive — ดิ่งลงเร็ว
      this.vy     = DIVE_VEL;
      this.diving = true;
    } else if (this.onGround && !this.sliding) {
      // Slide บนพื้น
      this.sliding    = true;
      this.slideTimer = SLIDE_DUR;
      this.h          = this._slideH;
      this.y          = this._slideY;
    }
  }

  // bounce หลัง stomp enemy (เรียกจาก game.js)
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

  // ── Hit ─────────────────────────────────────────
  hit() {
    if (this.invincible || this.dead) return false;
    if (this.shielded) {
      // shield absorbs hit
      this.shielded    = false;
      this.shieldTimer = 0;
      this._startInvincible();
      return false;
    }
    this.hp--;
    if (this.hp <= 0) {
      this.hp   = 0;
      this.dead = true;
      return true; // died
    }
    this._startInvincible();
    return false;
  }

  _startInvincible() {
    this.invincible = true;
    this.invTimer   = INVINCIBLE_MS;
  }

  // ── Special: Fire Projectile (weapon charge) ─────
  // return true ถ้ายิงได้ (weaponReady)
  fireProjectile() {
    if (this.dead || !this.weaponReady) return false;
    this.weaponReady  = false;
    this.weaponCharge = 0;        // reset charge timer
    return true;
  }

  // alias
  dash() { return this.fireProjectile(); }

  // เก็บ orb → ชาร์จเพิ่ม 30% ของ charge time
  chargeOrb() {
    this.weaponCharge = Math.min(this.weaponCharge + WEAPON_CHARGE_MS * 0.3, WEAPON_CHARGE_MS);
    if (this.weaponCharge >= WEAPON_CHARGE_MS) this.weaponReady = true;
    // คง specialGauge ไว้ให้ HUD ยังอ่านได้
    this.specialGauge = Math.round((this.weaponCharge / WEAPON_CHARGE_MS) * 5);
    return true;
  }

  // ── Power-ups ────────────────────────────────────
  applyPowerup(type) {
    if (type === 'shield') {
      this.shielded    = true;
      this.shieldTimer = ITEM_TYPES.SHIELD.duration;
    } else if (type === 'orb') {
      this.chargeOrb();
    } else if (type === 'heart') {
      if (this.hp < this.maxHp) this.hp++;
    }
  }

  // ── Update ──────────────────────────────────────
  update(dt) {
    if (this.dead) return;

    // slide timer
    if (this.sliding) {
      this.slideTimer -= dt * 1000;
      if (this.slideTimer <= 0) this._endSlide();
    }

    // ── Weapon charge timer ──────────────────────
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

    // variable jump
    if (this._jumpHeld && this.jumping && !this._jumpCut) {
      this._jumpHeldMs += dt * 1000;
      if (this._jumpHeldMs >= JUMP_HOLD_MS) this._jumpCut = true;
    }

    // gravity
    if (!this.onGround) {
      this.vy += GRAVITY * dt;
      this.y  += this.vy * dt;
      const groundY = GROUND_Y - this.h;
      if (this.y >= groundY) {
        this.y = groundY; this.vy = 0;
        this.onGround = true; this.jumping = false;
        this.diving = false; this._jumpCut = false; this._jumpHeldMs = 0;
      }
    }

    // invincibility
    if (this.invincible) {
      this.invTimer   -= dt * 1000;
      this.blinkPhase += dt * 20;
      if (this.invTimer <= 0) { this.invincible = false; this.blinkPhase = 0; }
    }

    // shield timer
    if (this.shielded) {
      this.shieldTimer -= dt * 1000;
      if (this.shieldTimer <= 0) this.shielded = false;
    }

    // run animation
    if (this.onGround && !this.sliding) {
      this.frameTimer += dt * 1000;
      if (this.frameTimer >= this.FRAME_DUR) {
        this.frameTimer = 0;
        this.frame = (this.frame + 1) % 4;
      }
    }
  }

  // ── Collision box ────────────────────────────────
  get bounds() {
    const pad = 6;
    return { x: this.x + pad, y: this.y + pad, w: this.w - pad*2, h: this.h - pad*2 };
  }

  // ── Draw ─────────────────────────────────────────
  draw(ctx) {
    if (this.dead) return;
    if (this.invincible && !this.dashing && Math.sin(this.blinkPhase) < 0) return;

    ctx.save();

    // ── Dash trail + glow ─────────────────────────
    if (this.dashing) {
      // afterimage trails
      const trailAlphas = [0.15, 0.25, 0.40];
      const trailOffsets = [-32, -20, -10];
      trailAlphas.forEach((a, i) => {
        ctx.globalAlpha = a;
        ctx.filter = 'hue-rotate(30deg) saturate(3)';
        this._drawBody(ctx, this.x + trailOffsets[i], this.y);
      });
      ctx.globalAlpha = 1;
      ctx.filter = 'none';

      // glow ring
      ctx.beginPath();
      ctx.arc(this.x + this.w/2, this.y + this.h/2, this.w * 0.85, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(255,200,0,0.22)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,180,0,0.70)';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // ── Shield bubble ────────────────────────────
    if (this.shielded) {
      ctx.beginPath();
      ctx.arc(this.x + this.w/2, this.y + this.h/2, this.w * 0.75, 0, Math.PI*2);
      ctx.fillStyle   = 'rgba(80,180,255,0.18)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(80,180,255,0.65)';
      ctx.lineWidth   = 2;
      ctx.stroke();
    }

    // ── Player body ───────────────────────────────
    ctx.globalAlpha = 1;
    ctx.filter = 'none';
    this._drawBody(ctx, this.x, this.y);

    ctx.restore();
  }

  _drawBody(ctx, x, y) {
    if (this.sprite) {
      // ใช้รูปภาพ player เสมอ ไม่ว่าจะ state ไหน
      if (this.sliding) {
        // slide: แนวนอน
        ctx.save();
        ctx.translate(x + this.w/2, y + this._slideH/2 + this._slideH*0.3);
        ctx.scale(1.3, 0.7);
        ctx.drawImage(this.sprite, -this.w/2, -this._slideH/2, this.w, this._slideH);
        ctx.restore();
      } else if (this.diving) {
        // dive: หมุน
        ctx.save();
        ctx.translate(x + this.w/2, y + this.h/2);
        ctx.rotate(Math.PI * 0.35);
        ctx.drawImage(this.sprite, -this.w/2, -this.h/2, this.w, this.h);
        ctx.restore();
      } else if (this.jumping) {
        // jump: ยืด
        ctx.save();
        ctx.translate(x + this.w/2, y + this.h/2);
        ctx.scale(0.85, 1.15);
        ctx.drawImage(this.sprite, -this.w/2, -this.h/2, this.w, this.h);
        ctx.restore();
      } else if (this.dashing) {
        // dash: เอียงไปข้างหน้า
        ctx.save();
        ctx.translate(x + this.w/2, y + this.h/2);
        ctx.rotate(-0.2);
        ctx.scale(1.1, 0.9);
        ctx.drawImage(this.sprite, -this.w/2, -this.h/2, this.w, this.h);
        ctx.restore();
      } else {
        // run cycle: เอียงไปข้างหน้า → ตั้งตรง → เอียงข้างหลัง → ตั้งตรง
        const t     = Date.now() / 120;
        const angle = Math.abs(Math.sin(t)) * 0.18; // เอียงหน้า → ตั้งตรง วนซ้ำ
        const bob   = Math.abs(Math.sin(t)) * -3;
        ctx.save();
        ctx.translate(x + this.w/2, y + this.h + bob);
        ctx.rotate(angle);
        ctx.drawImage(this.sprite, -this.w/2, -this.h, this.w, this.h);
        ctx.restore();
      }
    } else {
      this._drawEmoji(ctx, x, y, this.w, this.h);
    }
  }

  _drawEmoji(ctx, x, y, w, h) {
    const emoji = this.sliding ? '🦊' :
                  this.diving  ? '🦊' :
                  this.jumping ? '🦊' :
                                 this.RUN_FRAMES[this.frame];
    ctx.font         = `${Math.min(w, h) * 1.1}px serif`;
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'top';

    if (this.diving) {
      // หมุนลงเหมือน dive
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

  // ── Reset ────────────────────────────────────────
  reset() {
    this.y            = GROUND_Y - PLAYER_H;
    this.h            = this._normalH;
    this.vy           = 0;
    this.onGround     = true;
    this.jumping      = false;
    this.diving       = false;
    this.sliding      = false;
    this.slideTimer   = 0;
    this.dead         = false;
    this.hp           = this.maxHp;
    this.invincible   = false;
    this.invTimer     = 0;
    this.shielded     = false;
    this.frame        = 0;
    this._jumpHeld      = false;
    this._jumpHeldMs    = 0;
    this._jumpCut       = false;
    this._hasDoubleJump = true;
    this.specialGauge   = 5;
    this.weaponCharge = WEAPON_CHARGE_MS;
    this.weaponReady  = true;
    this.dashing      = false;
    this.dashTimer    = 0;
  }
}
