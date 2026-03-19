// ═══════════════════════════════════════════════════
//  js/game.js  —  Endless Rush  v1
// ═══════════════════════════════════════════════════

// ── Player Projectile ────────────────────────────────
class PlayerProjectile {
  constructor(x, y) {
    this.x     = x;
    this.y     = y;
    this.w     = 20;
    this.h     = 16;
    this.alive = true;
    this._t    = 0;
  }
  update(dt) {
    this.x  += PROJ_SPEED * dt;
    this._t += dt * 8;
    if (this.x > WIDTH + 20) this.alive = false;
  }
  get bounds() { return { x:this.x, y:this.y+2, w:this.w, h:this.h-4 }; }
  draw(ctx) {
    if (!this.alive) return;
    // กระสุนสีเหลืองทอง พร้อม trail
    const pulse = Math.sin(this._t) * 0.3 + 0.7;
    ctx.save();
    // trail
    ctx.globalAlpha = 0.3;
    ctx.fillStyle   = '#FFE066';
    ctx.beginPath();
    ctx.ellipse(this.x - 8, this.y + this.h/2, 14, 5, 0, 0, Math.PI*2);
    ctx.fill();
    // หัวกระสุน
    ctx.globalAlpha = pulse;
    ctx.fillStyle   = '#F5C518';
    ctx.strokeStyle = '#C49010';
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.ellipse(this.x + this.w/2, this.y + this.h/2, this.w/2, this.h/2, 0, 0, Math.PI*2);
    ctx.fill(); ctx.stroke();
    // แกนกลาง
    ctx.globalAlpha = 1;
    ctx.fillStyle   = '#FFF9C4';
    ctx.beginPath();
    ctx.ellipse(this.x + this.w/2, this.y + this.h/2, this.w/4, this.h/4, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  }
}

// ─────────────────────────────────────────────────────
class VirtualJoypad {
  constructor(canvas) {
    this._pressed    = {};
    this._canvas     = canvas;
    this._btnBounds  = {};
    this._gameState  = null;
    this._slideEdge  = false;
    this._jumpEdge   = false;
    this._bindTouch(canvas);
    this._bindKeys();
  }

  // Called by Game so joypad can check state before acting
  setGameStateRef(ref) { this._gameState = ref; }

  _isGameActive() {
    if (!this._gameState) return true;
    const s = this._gameState();
    return s === STATE.PLAYING;
  }

  _bindKeys() {
    window.addEventListener('keydown', e => {
      if (!this._isGameActive()) return;
      // A button = Jump: Space หรือ X หรือ ArrowUp
      if (e.key === ' ' || e.key === 'x' || e.key === 'X' || e.key === 'ArrowUp') {
        if (!this._pressed[BTN.JUMP]) this._jumpEdge = true;
        this._pressed[BTN.JUMP] = true;
      }
      // B button = Fire: Z หรือ ArrowDown
      if (e.key === 'z' || e.key === 'Z' || e.key === 'ArrowDown') {
        if (!this._pressed[BTN.SLIDE]) {
          this._pressed[BTN.SLIDE] = true;
          this._slideEdge = true;
        }
      }
    });
    window.addEventListener('keyup', e => {
      if (e.key === ' ' || e.key === 'x' || e.key === 'X' || e.key === 'ArrowUp') {
        delete this._pressed[BTN.JUMP];
      }
      if (e.key === 'z' || e.key === 'Z' || e.key === 'ArrowDown') {
        delete this._pressed[BTN.SLIDE];
        this._slideEdge = false;
      }
    });
  }

  _bindTouch(canvas) {
    const getScale = () => {
      const r = canvas.getBoundingClientRect();
      return { sx: WIDTH/r.width, sy: HEIGHT/r.height };
    };
    const pos = (touch) => {
      const r = canvas.getBoundingClientRect();
      const s = getScale();
      return { x: (touch.clientX - r.left) * s.sx, y: (touch.clientY - r.top) * s.sy };
    };

    canvas.addEventListener('touchstart', e => {
      if (!this._isGameActive()) return;   // let game._bindTap handle UI screens
      e.preventDefault();
      for (const t of e.changedTouches) {
        const {x,y} = pos(t);
        this._handleTouchDown(x, y, t.identifier);
      }
    }, { passive: false });

    canvas.addEventListener('touchend', e => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        this._handleTouchUp(t.identifier);
      }
    }, { passive: false });

    canvas.addEventListener('mousedown', e => {
      if (!this._isGameActive()) return;
      const r  = canvas.getBoundingClientRect();
      const s  = getScale();
      const x  = (e.clientX - r.left) * s.sx;
      const y  = (e.clientY - r.top)  * s.sy;
      this._handleTouchDown(x, y, 'mouse');
    });
    canvas.addEventListener('mouseup', () => this._handleTouchUp('mouse'));
  }

  _handleTouchDown(x, y, id) {
    const jl = this._btnBounds.JUMP;
    const jr = this._btnBounds.SLIDE;
    if (jl && x>=jl.x && x<=jl.x+jl.w && y>=jl.y && y<=jl.y+jl.h) {
      this._jumpEdge = true;          // set edge ทุกครั้งที่แตะ ไม่ว่าจะกดค้างอยู่แล้วหรือเปล่า
      this._pressed[BTN.JUMP] = id;
    } else if (jr && x>=jr.x && x<=jr.x+jr.w && y>=jr.y && y<=jr.y+jr.h) {
      if (!this._pressed[BTN.SLIDE]) this._slideEdge = true;
      this._pressed[BTN.SLIDE] = id;
    }
  }

  _handleTouchUp(id) {
    if (this._pressed[BTN.JUMP] === id) { delete this._pressed[BTN.JUMP]; }
    if (this._pressed[BTN.SLIDE] === id) {
      delete this._pressed[BTN.SLIDE];
      this._slideEdge = false;
    }
  }

  isJumpHeld()   { return !!this._pressed[BTN.JUMP]; }
  consumeJump()  { if (this._jumpEdge) { this._jumpEdge = false; return true; } return false; }
  consumeSlide() { if (this._slideEdge) { this._slideEdge = false; return true; } return false; }

  setButtonBounds(jumpBounds, slideBounds) {
    this._btnBounds.JUMP  = jumpBounds;
    this._btnBounds.SLIDE = slideBounds;
  }

  // ── Draw buttons ─────────────────────────────────
  draw(ctx) {
    const bw  = 80, bh = 70, br = 18;   // ขนาดใหญ่ขึ้น
    const by  = HEIGHT - 90;             // ขยับขึ้นจากล่าง
    const bx  = 20;
    const ax  = WIDTH - bw - 20;

    this.setButtonBounds(
      { x:ax, y:by, w:bw, h:bh },
      { x:bx, y:by, w:bw, h:bh }
    );

    // ── Joypad background strip (คนละสีกับพื้น) ──
    ctx.fillStyle = COL.JOYPAD_BG;
    ctx.beginPath();
    ctx.roundRect(0, by - 16, WIDTH, bh + 28, [14, 14, 0, 0]);
    ctx.fill();

    const drawBtn = (x, top, bottom, active, accentOn, accentOff) => {
      ctx.save();
      ctx.fillStyle   = active ? accentOn : accentOff;
      ctx.strokeStyle = active ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)';
      ctx.lineWidth   = 2;
      ctx.shadowColor = active ? accentOn : 'transparent';
      ctx.shadowBlur  = active ? 12 : 0;
      ctx.beginPath(); ctx.roundRect(x, by, bw, bh, br); ctx.fill(); ctx.stroke();
      ctx.shadowBlur  = 0;
      ctx.fillStyle    = '#FFFFFF';
      ctx.font         = `bold 18px ${FONT.MAIN}`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(top, x + bw/2, by + bh/2 - 6);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font      = `10px ${FONT.BODY}`;
      ctx.fillText(bottom, x + bw/2, by + bh/2 + 11);
      ctx.restore();
    };

    const aActive = !!this._pressed[BTN.JUMP];
    const bActive = !!this._pressed[BTN.SLIDE];

    drawBtn(bx, 'B', 'Fire',  bActive, COL.JOYPAD_BTN_B, 'rgba(249,168,37,0.55)');
    drawBtn(ax, 'A', 'Jump',  aActive, COL.JOYPAD_BTN_A, 'rgba(76,175,80,0.55)');

    ctx.fillStyle    = 'rgba(255,255,255,0.35)';
    ctx.font         = `9px ${FONT.BODY}`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Z', bx + bw/2, by - 4);
    ctx.fillText('Space', ax + bw/2, by - 4);
  }
}

// ─────────────────────────────────────────────────────
class Game {
  constructor(canvas) {
    this.canvas  = canvas;
    this.ctx     = canvas.getContext('2d');
    this.state   = STATE.LOADING;
    this.running = true;
    this.lastTime = 0;
    window._game = this;   // iOS unlock script เข้าถึงได้

    this.images  = {};
    this._sounds = {};

    // subsystems
    this.world       = new World();
    this.player      = new Player();
    this.enemies     = new EnemyManager();
    this.items       = new ItemManager();
    this.boss        = new Boss();   // stub
    this.raid        = new BossRaid();
    this.hud         = new HUD();
    this.joypad      = new VirtualJoypad(canvas);
    this.joypad.setGameStateRef(() => this.state);
    this.tallyScreen = new TallyScreen(canvas);
    this.rankScreen  = new RankingScreen(canvas);

    this._introPhase    = 0;
    this._introTimer    = 0;
    this._introPlayerX  = -80;
    this._introAlpha    = 0;

    this._bossCount      = 0;
    this._nextRaidDist   = BOSS_RAID_INTERVAL;
    this._specialCount   = 0;
    this._maxCombo       = 1;
    this._comboCount     = 0;
    this._comboTimer     = 0;
    this._killScore      = 0;
    this._enemyKills     = 0;
    this._bossWarningShown = false;

    this._projectiles = [];

    // particles / effects
    this._effects = [];

    this._bindKeys();
    this._bindTap(canvas);
  }

  // ── Asset injection ──────────────────────────────
  setImages(imgs) {
    this.images = imgs;
    if (imgs.player)     this.player.sprite = imgs.player;
    if (imgs.background) this.world.bgImages.background = imgs.background;
    if (imgs.boss) {
      BOSSES.forEach(b => b.sprite = imgs.boss);
      this.raid.sprite = imgs.boss;
    }

    const enemyMap = { enemy_ground:'GROUND', enemy_air:'AIR', enemy_spike:'SPIKE' };
    for (const [k, t] of Object.entries(enemyMap)) {
      if (imgs[k] && ENEMY_TYPES[t]) ENEMY_TYPES[t].sprite = imgs[k];
    }
    const itemMap = { item_coin:'COIN', item_star:'STAR', item_heart:'HEART' };
    for (const [k, t] of Object.entries(itemMap)) {
      if (imgs[k] && ITEM_TYPES[t]) ITEM_TYPES[t].sprite = imgs[k];
    }
  }
  setSounds(snds) {
    this._sounds = snds;
    // ไม่เล่น BGM ทันที — รอ user gesture (iOS requirement)
    // BGM จะเล่นตอน _startGame() หรือ intro เสมอหลัง tap
  }

  _playBGM(key) {
    const bgm = this._sounds[key];
    if (!bgm) return;
    bgm.loop   = true;
    bgm.volume = 0.35;
    bgm.muted  = false;
    window._bgmEl = bgm;
    if (window._audioCtx && window._audioCtx.state === 'suspended') {
      window._audioCtx.resume().then(() => bgm.play().catch(() => {}));
      return;
    }
    const p = bgm.play();
    if (p instanceof Promise) {
      p.catch(() => {
        // retry หลัง 200ms — iOS อาจต้องการเวลาหลัง unlock
        setTimeout(() => bgm.play().catch(() => {}), 200);
      });
    }
  }

  _stopBGM(key) {
    const bgm = this._sounds[key];
    if (bgm) { try { bgm.pause(); bgm.currentTime = 0; } catch{} }
  }

  _bindVisibility() {
    document.addEventListener('visibilitychange', () => {
      const bgm = window._bgmEl;
      if (!bgm) return;
      if (document.hidden) {
        bgm.pause();
      } else if (this.state === STATE.PLAYING || this.state === STATE.INTRO) {
        bgm.play().catch(() => {});
      }
    });
  }

  // iOS audio unlock — เรียกตอน user gesture แรก
  _unlockAudio() {
    if (window._audioUnlocked) return;
    window._audioUnlocked = true;

    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        const ctx = new AC();
        window._audioCtx = ctx;
        const buf = ctx.createBuffer(1, 1, 22050);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(ctx.destination);
        src.start(0);
        ctx.resume().then(() => {
          // pre-decode SFX ทั้งหมดหลัง context ready
          this._predecodeSFX(ctx);
        });
      }
    } catch(e) {}

    // play+pause audio elements (BGM unlock)
    Object.values(this._sounds).forEach(s => {
      if (!s || typeof s.play !== 'function') return;
      try {
        s.muted = true;
        const p = s.play();
        if (p && p.then) {
          p.then(() => { s.pause(); s.currentTime = 0; s.muted = false; })
           .catch(() => { s.muted = false; });
        }
      } catch(e) { try { s.muted = false; } catch(e2) {} }
    });
  }

  _predecodeSFX(ctx) {
    Object.entries(this._sounds).forEach(([key, s]) => {
      if (!s || !s._sfxBuf) return;
      ctx.decodeAudioData(s._sfxBuf, (decoded) => {
        s._audioBuf = decoded;
        delete s._sfxBuf;
      }, () => {});
    });
  }

  _sfx(key) {
    const s = this._sounds[key];
    if (!s) return;

    // Web Audio API path — ใช้ decoded AudioBuffer (decode ครั้งแรกแล้วเก็บไว้)
    if (s._sfxBuf || s._audioBuf) {
      const ctx = window._audioCtx;
      if (!ctx) return;
      if (ctx.state === 'suspended') { ctx.resume(); return; }

      const play = (buf) => {
        try {
          const src  = ctx.createBufferSource();
          const gain = ctx.createGain();
          gain.gain.value = 0.6;
          src.buffer = buf;
          src.connect(gain);
          gain.connect(ctx.destination);
          src.start(0);
        } catch(e) {}
      };

      if (s._audioBuf) {
        play(s._audioBuf);
      } else {
        // decode ครั้งแรก แล้วเก็บ cache
        ctx.decodeAudioData(s._sfxBuf, (decoded) => {
          s._audioBuf = decoded;
          delete s._sfxBuf;
          play(decoded);
        }, () => {});
      }
      return;
    }

    // Audio element fallback
    if (window._audioCtx && window._audioCtx.state === 'suspended') {
      window._audioCtx.resume();
    }
    try {
      const clone = typeof s.cloneNode === 'function' ? s.cloneNode(true) : s;
      clone.volume = 0.6;
      clone.muted  = false;
      const p = clone.play();
      if (p instanceof Promise) p.catch(() => {});
    } catch(e) {}
  }

  // ── Input ────────────────────────────────────────
  _bindKeys() {
    window.addEventListener('keydown', e => {
      // NAME state: Enter เท่านั้น — Space ไม่ทำอะไร
      if (this.state === STATE.NAME) {
        // ให้ ranking.js _handleKey จัดการเอง (ลงทะเบียนไว้แล้ว)
        return;
      }
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        this._onSpaceEnter();
      }
    });
  }

  _onSpaceEnter() {
    switch (this.state) {
      case STATE.INTRO:
        if (this._introPhase >= 3) this._startGame();
        break;
      case STATE.TALLY:
        this.tallyScreen.handleTap(0, this.tallyScreen._nextBtnY + 10);
        break;
      case STATE.NAME:
        // กด Enter = confirm ชื่อ / ถ้าชื่อว่าง confirm ทันที
        if (this.rankScreen.mode === 'entry') this.rankScreen._confirmName();
        else this.rankScreen._playAgain();
        break;
      case STATE.RANKING:
        this.rankScreen._playAgain();
        break;
    }
  }

  _bindTap(canvas) {
    const getCoords = (e) => {
      const r   = canvas.getBoundingClientRect();
      const scX = WIDTH  / r.width;
      const scY = HEIGHT / r.height;
      // touchstart: use changedTouches[0]; mousedown: use event directly
      const src = (e.changedTouches && e.changedTouches.length > 0)
        ? e.changedTouches[0] : e;
      return {
        x: (src.clientX - r.left) * scX,
        y: (src.clientY - r.top)  * scY,
      };
    };

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const { x, y } = getCoords(e);
      this._onTap(x, y);
    }, { passive: false });

    canvas.addEventListener('mousedown', (e) => {
      const { x, y } = getCoords(e);
      this._onTap(x, y);
    });
  }

  _onTap(x, y) {
    // unlock audio on first interaction (iOS)
    this._unlockAudio();

    if (this.state === STATE.INTRO) {
      if (this._introPhase >= 3) this._startGame();
      return;
    }
    if (this.state === STATE.TALLY) {
      this.tallyScreen.handleTap(x, y);
      return;
    }
    if (this.state === STATE.NAME || this.state === STATE.RANKING) {
      this.rankScreen.handleTap(x, y);
      return;
    }
    // PLAYING / BOSS — let joypad handle via its own touchstart listener
  }

  _onAnyTap() {
    if (this.state === STATE.INTRO && this._introPhase >= 3) this._startGame();
  }

  // ── State transitions ────────────────────────────
  _goIntro() {
    // hide any overlays
    this.rankScreen.hide();
    this.tallyScreen.visible = false;

    // reset boss state
    this.world.bossAlpha = 0;
    this.raid.state      = RAID_STATE.IDLE;
    this._projectiles    = [];

    this.state          = STATE.INTRO;
    this._introPhase    = 0;
    this._introTimer    = 0;
    this._introPlayerX  = -80;
    this._introAlpha    = 0;

    // prevent dt spike on first loop after state change
    this.lastTime = performance.now();
    this._playBGM('bgm');
  }

  _startGame() {
    this.world.reset();
    this.player.reset();
    this.enemies.reset();
    this.items.reset();
    this.hud.reset();
    this._bossCount        = 0;
    this._nextRaidDist     = BOSS_RAID_MIN + Math.random() * (BOSS_RAID_MAX - BOSS_RAID_MIN);
    this._specialCount     = 0;
    this._maxCombo         = 1;
    this._comboCount       = 0;
    this._comboTimer       = 0;
    this._killScore        = 0;
    this._enemyKills       = 0;
    this._bossWarningShown = false;
    this._effects          = [];
    this._projectiles      = [];
    this.raid.state        = RAID_STATE.IDLE;

    this.world.start();
    this.state = STATE.PLAYING;
    this._sfx('start');
  }

  _playerDied() {
    this._sfx('die');
    this.world.pause();

    // stop any BGM
    this._stopBGM('bgm');
    this._stopBGM('boss');

    // freeze final score now before anything can change it
    const finalScore = this.hud.score;

    // collect stats
    const details = {
      score      : finalScore,
      distanceM  : this.world.distanceM,
      coins      : this.hud.coins,
      bosses     : this._bossCount,
      enemyKills : this._enemyKills,
      maxCombo   : this._maxCombo,
    };

    // go to tally
    this.state = STATE.TALLY;
    this.tallyScreen.show(details, () => {
      this.state = STATE.NAME;
      this.rankScreen.show(
        finalScore, details,
        () => { this._goIntro(); },           // play again → intro
        () => { this.state = STATE.RANKING; } // confirm name → show board
      );
    });
  }

  // ── Effects ──────────────────────────────────────
  _spawnProjectile() {
    const px = this.player.x + this.player.w;
    // ยิงตรงกลางความสูง player — ตรงกับ ground enemy
    const py = this.player.y + this.player.h * 0.55;
    this._projectiles.push(new PlayerProjectile(px, py));
    this._effects.push({
      x: px, y: py,
      vx: 80, vy: -30,
      life: 0.4, maxLife: 0.4,
      emoji: '⚡', size: 14,
    });
  }

  _spawnRaidPlatform() {
    // Platform spawn ตอนเริ่ม WARNING phase
    // Boss มาถึงหลัง _warningDur ms → platform ต้อง scroll เข้ามาพอดี
    // ในเวลา _warningDur ms โลก scroll ไป speed * warningDur/1000 px
    const spd   = this.world.speed;
    const dt_s  = this.raid._warningDur / 1000;   // 2.5s

    // Platform จะอยู่ที่ targetX เมื่อ boss มาถึง
    // spawnX = targetX + spd*dt_s  (scroll เข้ามาเอง)
    // ชั้น 1 ต้องอยู่ที่ x≈80 ตอน boss มา (ใกล้ player)
    const target1X = 80;
    const spawn1X  = target1X + spd * dt_s;

    // ชั้น 2 อยู่ห่างออกไปอีก ~120px จาก ชั้น 1 (กระโดดเดิน)
    const spawn2X  = spawn1X + 120;

    // ชั้น 3 อยู่ห่างออกไปอีก ~100px จากชั้น 2
    const spawn3X  = spawn2X + 100;

    const plats = this.world.platforms.platforms;

    // ชั้น 1: 115px เหนือพื้น — กระโดดจากพื้นได้
    plats.push({ x: spawn1X, y: GROUND_Y - 115, w: 180, h: 20, level: 1, _coinsSpawned: true });

    // ชั้น 2: 230px เหนือพื้น — กระโดดจากชั้น 1 ได้ (diff=115px ≤ max 162px)
    plats.push({ x: spawn2X, y: GROUND_Y - 230, w: 160, h: 20, level: 2, _coinsSpawned: true });

    // ชั้น 3: 320px เหนือพื้น — กระโดดจากชั้น 2 ได้ (diff=90px)
    // ยืนบน ชั้น 3 แล้วอยู่เหนือ boss ที่บินมาระดับต่ำสุด
    plats.push({ x: spawn3X, y: GROUND_Y - 320, w: 140, h: 20, level: 3, _coinsSpawned: true });
  }

  _spawnBossItem(type) {
    if (Math.random() > 0.30) return;

    const itemType = (type === 'heart') ? 'HEART' : 'SHIELD';
    // spawn ตรงบนหัว player เลย
    const spawnX = this.player.x + this.player.w * 0.1;
    const spawnY = 55;
    const item   = new Item(itemType, spawnX, spawnY);

    item._isBossDrop  = true;
    item._dropTargetY = this.player.y;   // บินลงถึงระดับ player
    item._blinkTimer  = 0;
    item._arrived     = false;

    this.items.items.push(item);
  }

  _spawnExplosion(cx, cy) {
    for (let i = 0; i < 14; i++) {
      const angle = (Math.PI * 2 / 14) * i;
      const spd   = 80 + Math.random() * 160;
      this._effects.push({
        x: cx, y: cy,
        vx: Math.cos(angle)*spd, vy: Math.sin(angle)*spd,
        life: 1, maxLife: 1,
        emoji: ['✨','⭐','🌟','💥'][Math.floor(Math.random()*4)],
        size: 14 + Math.random()*10,
      });
    }
  }

  _updateEffects(dt) {
    for (const ef of this._effects) {
      ef.x += ef.vx * dt;
      ef.y += ef.vy * dt;
      ef.vy += 400 * dt;
      ef.life -= dt * 1.8;
    }
    this._effects = this._effects.filter(e => e.life > 0);
  }

  _drawEffects(ctx) {
    for (const ef of this._effects) {
      ctx.globalAlpha  = ef.life;
      ctx.font         = `${ef.size}px serif`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ef.emoji, ef.x, ef.y);
    }
    ctx.globalAlpha = 1;
  }

  // ── Main Loop ────────────────────────────────────
  start() {
    this._bindVisibility();
    requestAnimationFrame(ts => this._loop(ts));
    this._goIntro();
  }

  _loop(ts) {
    const dt = Math.min((ts - this.lastTime) / 1000, 0.05);
    this.lastTime = ts;

    this._update(dt);
    this._draw();

    if (this.running) requestAnimationFrame(ts2 => this._loop(ts2));
  }

  // ── Update ──────────────────────────────────────
  _update(dt) {
    switch (this.state) {
      case STATE.INTRO:   this._updateIntro(dt);        break;
      case STATE.PLAYING: this._updatePlaying(dt);      break;
      case STATE.TALLY:   this.tallyScreen.update(dt);  break;
      case STATE.NAME:
      case STATE.RANKING: this.rankScreen.update(dt);   break;
    }
    this._updateEffects(dt);
  }

  _updateIntro(dt) {
    this._introTimer += dt * 1000;

    switch (this._introPhase) {
      case 0: // player walks in
        this._introPlayerX += 180 * dt;
        if (this._introPlayerX >= PLAYER_X) {
          this._introPlayerX = PLAYER_X;
          this._introPhase   = 1;
          this._introTimer   = 0;
        }
        break;
      case 1: // show text 1
        this._introAlpha = Math.min(1, this._introTimer / 400);
        if (this._introTimer > 1600) { this._introPhase = 2; this._introTimer = 0; }
        break;
      case 2: // show text 2
        if (this._introTimer > 1200) { this._introPhase = 3; this._introTimer = 0; }
        break;
      case 3: // tap prompt
        break;
    }
  }

  _updatePlaying(dt) {
    // boss warning 100m before
    const distToBoss = this._nextBossDist - this.world.distanceM;
    if (distToBoss < 100 && !this._bossWarningShown) {
      this._bossWarningShown = true;
      this.hud.triggerBossWarning();
      this._sfx('warning');
    }

    // ── Boss Raid trigger ─────────────────────────
    if (this.world.distanceM >= this._nextRaidDist &&
        this.raid.state === RAID_STATE.IDLE) {
      this.raid.startRaid();
      this._sfx('warning');
      // spawn platform ช่วย player หลบ
      this._spawnRaidPlatform();
    }

    // ── Boss Raid update ──────────────────────────
    this.raid.update(dt, this.world.speed);

    // raid boss โดน player projectile
    for (const proj of this._projectiles) {
      if (!proj.alive) continue;
      if (this.raid.isActive && _rectsOverlap(proj.bounds, this.raid.bounds)) {
        proj.alive = false;
        const result = this.raid.takeHit(PROJ_BOSS_DMG);
        if (result) {
          this._sfx('boss_hit');
          this.hud.triggerShake(4);
          this._killScore += PROJ_DMG_NORMAL * PROJ_BOSS_DMG;
          this.hud.addScore(0, proj.x, proj.y-10, `⚡ HIT!`);
          this._spawnExplosion(proj.x, proj.y);
          if (result === 'dead') {
            this._killScore += BOSS_KILL_BONUS;
            this.hud.addScore(0, this.raid.x, this.raid.y-20, `💥 +${BOSS_KILL_BONUS}`);
            this._sfx('boss_clear');
          }
        }
      }
    }

    // boss body โฉบชน player
    if (!this.player.invincible && this.raid.checkBodyHit(this.player)) {
      const died = this.player.hit();
      this._sfx('hit');
      this.hud.triggerShake(8);
      if (died) { this._playerDied(); return; }
    }

    // boss projectile โดน player
    if (!this.player.invincible && this.raid.checkProjectileHit(this.player)) {
      const died = this.player.hit();
      this._sfx('hit');
      this.hud.triggerShake(8);
      if (died) { this._playerDied(); return; }
    }

    // raid done → schedule next
    if (this.raid.isDone && this.raid.state !== RAID_STATE.IDLE) {
      this.raid.state      = RAID_STATE.IDLE;
      this._bossCount++;
      // สุ่ม interval ถัดไป 400-700m
      const nextGap        = BOSS_RAID_MIN + Math.random() * (BOSS_RAID_MAX - BOSS_RAID_MIN);
      this._nextRaidDist   = this.world.distanceM + nextGap;
      this.world.bossAlpha = 0;
    }

    // darken bg ระหว่าง raid
    if (this.raid.state === RAID_STATE.INCOMING) {
      this.world.bossAlpha = Math.min(1, this.world.bossAlpha + dt * 2);
    } else if (this.raid.state === RAID_STATE.IDLE || this.raid.isDone) {
      this.world.bossAlpha = Math.max(0, this.world.bossAlpha - dt * 2);
    }

    // update world
    this.world.update(dt, 1);

    // ── resolve pit/platform ก่อนรับ input ─────────
    // สำคัญ: ต้อง resolvePlayer ก่อน setJumpHeld
    // เพื่อให้ _hasDoubleJump ถูก reset ตอนเดินตกเหว
    // ก่อนที่ jump input จะถูกประมวลผล
    const { result: platResult, overPit } = this.world.platforms.resolvePlayer(this.player);

    // ── A: Jump — forceEdge จาก touch tap, held สำหรับ variable height
    const jumpEdge = this.joypad.consumeJump();
    this.player.setJumpHeld(this.joypad.isJumpHeld(), jumpEdge);

    // ── B: Fire Projectile ────────────────────────
    if (this.joypad.consumeSlide()) {
      if (this.player.weaponReady && this.player.fireProjectile()) {
        this._sfx('dash');
        this._spawnProjectile();
      }
    }

    this.player.update(dt, overPit);

    if (platResult === 'pit') {
      this.player.hp   = 0;
      this.player.dead = true;
      this._sfx('die');
      this._playerDied();
      return;
    }

    this.enemies.update(dt, this.world.speed, this.world.distanceM);
    // ข้อ 2: enemy ตกเหว
    for (const e of this.enemies.enemies) {
      this.world.platforms.checkEnemyPit(e);
    }
    this.items.update(dt, this.world.speed, this.world.distanceM,
                      this.world.platforms.activePlatforms);

    // update projectiles
    for (const p of this._projectiles) p.update(dt);
    this._projectiles = this._projectiles.filter(p => p.alive);

    // projectile vs enemy
    for (const proj of this._projectiles) {
      if (!proj.alive) continue;
      for (const e of this.enemies.enemies) {
        if (!e.alive) continue;
        if (_rectsOverlap(proj.bounds, e.bounds)) {
          proj.alive = false;
          this.enemies.killEnemy(e);
          this._enemyKills++;
          this._comboCount++;
          this._comboTimer = 2000;
          if (this._comboCount > this._maxCombo) this._maxCombo = this._comboCount;
          const pts = (e.points + PROJ_DMG_NORMAL) * Math.max(1, this._comboCount);
          this._killScore += pts;
          this.hud.addScore(0, e.x + e.w/2, e.y - 10, `💥 +${pts}`);
          this._sfx('boss_hit');
          this._spawnExplosion(e.x + e.w/2, e.y + e.h/2);
          break;
        }
      }
    }

    // combo timer
    if (this._comboTimer > 0) {
      this._comboTimer -= dt * 1000;
      if (this._comboTimer <= 0) this._comboCount = 0;
    }

    // item collection
    const collected = this.items.checkCollect(this.player);
    if (collected) {
      this._sfx('coin');
      if (collected.typeKey === 'COIN') {
        this.hud.addCoin();
        const pts = collected.points * Math.max(1, this._comboCount);
        this._killScore += pts;
        this.hud.addScore(0, collected.x, collected.y - 10, `+${pts}`);
      }
      if (collected.typeKey === 'STAR') {
        // ⭐ Star → Weapon Charge ทันที + pts
        this.player.weaponCharge = WEAPON_CHARGE_MS;
        this.player.weaponReady  = true;
        this.player.specialGauge = 5;
        const pts = ITEM_TYPES.STAR.points * Math.max(1, this._comboCount);
        this._killScore += pts;
        this.hud.addScore(0, collected.x, collected.y - 10, `⭐ READY!`);
      }
      if (collected.typeKey === 'HEART')  this.player.applyPowerup('heart');
      if (collected.typeKey === 'SHIELD') this.player.applyPowerup('shield');
      this._comboCount++;
      this._comboTimer = 2000;
      if (this._comboCount > this._maxCombo) this._maxCombo = this._comboCount;
    }

    // ── Enemy collision: Dash / Stomp / Hit ────────
    const hitEnemy = this.enemies.checkCollisions(this.player);
    if (hitEnemy && !this.player.invincible) {
      const pb = this.player.bounds;
      const eb = hitEnemy.bounds;
      // ด้านท้าย (ขวา) = player center อยู่ทางขวาของ enemy center → ไม่ damage
      const playerCX = pb.x + pb.w / 2;
      const enemyCX  = eb.x + eb.w / 2;
      const fromBehind = playerCX > enemyCX + eb.w * 0.25;

      if (this.player.dashing) {
        this.enemies.killEnemy(hitEnemy);
        this._enemyKills++;
        this._comboCount++;
        this._comboTimer = 2000;
        if (this._comboCount > this._maxCombo) this._maxCombo = this._comboCount;
        const pts = hitEnemy.points * Math.max(1, this._comboCount) + DASH_POINTS;
        this._killScore += pts;
        this.hud.addScore(0, hitEnemy.x + hitEnemy.w/2, hitEnemy.y - 10, `💥 +${pts}`);
        this._sfx('boss_hit');
        this._spawnExplosion(hitEnemy.x + hitEnemy.w/2, hitEnemy.y + hitEnemy.h/2);
      } else if (this._isStomping(hitEnemy)) {
        // stomp จากบน = ฆ่าได้เสมอ ไม่ว่าจะด้านไหน
        this.enemies.killEnemy(hitEnemy);
        this._enemyKills++;
        this.player.stompBounce();
        this._sfx('coin');
        this._comboCount++;
        this._comboTimer = 2000;
        if (this._comboCount > this._maxCombo) this._maxCombo = this._comboCount;
        const pts = hitEnemy.points * Math.max(1, this._comboCount);
        this._killScore += pts;
        this.hud.addScore(0, hitEnemy.x + hitEnemy.w/2, hitEnemy.y - 10, `👟 +${pts}`);
        this._spawnExplosion(hitEnemy.x + hitEnemy.w/2, hitEnemy.y + hitEnemy.h/2);
      } else if (fromBehind) {
        // ชนด้านท้าย = ไม่ damage, แค่ bounce เล็กน้อย
        // (player วิ่งผ่านได้ = invincible ชั่วคราว 300ms)
        if (!this.player.invincible) {
          this.player._startInvincible();
          this.player.invTimer = 300;
        }
      } else {
        // ชนด้านหน้า → เสีย HP
        const died = this.player.hit();
        this._sfx('hit');
        this.hud.triggerShake(8);
        this._comboCount = 0;
        if (died) { this._playerDied(); return; }
      }
    }

    // ── Score = distance + coins + accumulated kills ──
    const dpts = Math.floor(this.world.distanceM) * DIST_POINT_PER_M;
    this.hud.score = dpts
      + this.hud.coins  * ITEM_TYPES.COIN.points
      + this._killScore;   // สะสมจากการ kill enemy / boss

    this.hud.update(dt, this.player, this.world);
  }

  // stomp: player ตกลงจากด้านบน — center x อยู่ในช่วง enemy
  _isStomping(enemy) {
    const pb = this.player.bounds;
    const eb = enemy.bounds;
    const playerBottom = pb.y + pb.h;
    const enemyTop     = eb.y;
    const playerCX     = pb.x + pb.w / 2;
    // ขยาย x zone เล็กน้อยให้ stomp ง่ายขึ้น (±8px จากขอบ enemy)
    return this.player.vy > 0 &&
           playerBottom <= enemyTop + 12 &&
           playerCX > eb.x - 8 &&
           playerCX < eb.x + eb.w + 8;
  }

  // ── Draw ─────────────────────────────────────────
  _draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    switch (this.state) {
      case STATE.LOADING:
        this._drawLoading(ctx);
        break;

      case STATE.INTRO:
        this._drawIntro(ctx);
        break;

      case STATE.PLAYING:
        this._drawPlaying(ctx);
        break;

      case STATE.TALLY:
        this.tallyScreen.draw();
        this._drawEffects(ctx);
        break;

      case STATE.NAME:
      case STATE.RANKING:
        this.rankScreen.draw();
        break;
    }
  }

  _drawLoading(ctx) {
    ctx.fillStyle = COL.BG_SKY;
    ctx.fillRect(0,0,WIDTH,HEIGHT);
    ctx.font = `bold 28px ${FONT.MAIN}`;
    ctx.fillStyle    = COL.DARK;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏃 Endless Rush', WIDTH/2, HEIGHT/2 - 20);
    ctx.font = `14px ${FONT.BODY}`;
    ctx.fillStyle = COL.MID;
    ctx.fillText('กำลังโหลด...', WIDTH/2, HEIGHT/2 + 20);
  }

  _drawIntro(ctx) {
    // sky
    const grad = ctx.createLinearGradient(0,0,0,HEIGHT);
    grad.addColorStop(0,'#FFFDE8');
    grad.addColorStop(0.6,'#FFF9C4');
    grad.addColorStop(1,'#F5E67A');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,WIDTH,HEIGHT);

    // sun
    ctx.font='48px serif'; ctx.textAlign='right'; ctx.textBaseline='top';
    ctx.fillText('☀️', WIDTH-20, 24);

    // clouds
    ctx.font='24px serif'; ctx.textAlign='left';
    ctx.globalAlpha = 0.7;
    ctx.fillText('☁️', 30, 60); ctx.fillText('☁️', 180, 40);
    ctx.globalAlpha = 1;

    // ground
    ctx.fillStyle = COL.BG_GROUND;
    ctx.fillRect(0, GROUND_Y, WIDTH, HEIGHT - GROUND_Y);
    ctx.strokeStyle = COL.PRIMARY_D; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(0,GROUND_Y); ctx.lineTo(WIDTH,GROUND_Y); ctx.stroke();

    // player walking
    const bob = Math.sin(Date.now()/140) * 3;
    if (this.player.sprite) {
      ctx.drawImage(this.player.sprite,
        this._introPlayerX, GROUND_Y - PLAYER_H + bob,
        PLAYER_W * 1.1, PLAYER_H * 1.1);
    } else {
      ctx.font = '52px serif';
      ctx.textAlign    = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText('🦊', this._introPlayerX, GROUND_Y + bob);
    }

    // panel + text
    if (this._introPhase >= 1) {
      ctx.globalAlpha = this._introAlpha;
      ctx.fillStyle   = 'rgba(255,255,255,0.90)';
      ctx.strokeStyle = COL.PRIMARY;
      ctx.lineWidth   = 2;
      ctx.beginPath(); ctx.roundRect(30, 140, WIDTH-60, 220, 20); ctx.fill(); ctx.stroke();

      // logo
      ctx.fillStyle    = COL.DARK;
      ctx.font         = `bold 34px ${FONT.MAIN}`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🏃 ENDLESS RUSH', WIDTH/2, 195);

      // tagline
      ctx.fillStyle = COL.MID;
      ctx.font      = `16px ${FONT.BODY}`;
      ctx.fillText('พร้อมไปผจญภัยกันรึยัง?', WIDTH/2, 238);
      ctx.fillText('วิ่งให้ไกลที่สุด ระวังพวกสัตว์ร้ายด้วยนะ!', WIDTH/2, 262);

      // best score
      const best = RankingSystem.load()[0];
      if (best) {
        ctx.fillStyle = COL.PRIMARY_D;
        ctx.font      = `bold 14px ${FONT.BODY}`;
        ctx.fillText(`🏅 สถิติสูงสุด: ${best.score.toLocaleString()} (${best.name})`, WIDTH/2, 296);
      }
    }

    if (this._introPhase >= 3) {
      // Tap to start blinking
      const blink = Math.sin(Date.now()/380) > 0;
      if (blink) {
        ctx.globalAlpha  = 1;
        ctx.fillStyle    = COL.DARK;
        ctx.font         = `bold 17px ${FONT.MAIN}`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('▶ แตะที่จอ หรือ กด A เพื่อเริ่ม!', WIDTH/2, 388);
      }
    }
    ctx.globalAlpha = 1;
  }

  _drawPlaying(ctx) {
    const { dx, dy } = this.hud.getShakeOffset();
    ctx.save();
    ctx.translate(dx, dy);

    this.world.draw(ctx);
    this.items.draw(ctx);
    this.enemies.draw(ctx);
    for (const p of this._projectiles) p.draw(ctx);
    this.player.draw(ctx);
    this.raid.draw(ctx);   // boss raid โฉบผ่าน

    ctx.restore();

    this._drawEffects(ctx);
    this.hud.draw(ctx, STATE.PLAYING);
    this.hud.drawPowerups(ctx, this.player);
    this.joypad.draw(ctx);

    if (this._comboCount >= 2) {
      ctx.fillStyle    = COL.PRIMARY_D;
      ctx.font         = `bold ${12 + this._comboCount}px ${FONT.MAIN}`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(`🔥 ×${this._comboCount} COMBO!`, WIDTH/2, 62);
    }
  }

}
