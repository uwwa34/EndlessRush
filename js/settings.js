// ═══════════════════════════════════════════════════
//  js/settings.js  —  Endless Rush  (Green Pastel)
//
//  ไฟล์นี้เป็น single source of truth ของทุก config
//  แก้ค่าที่นี่ที่เดียว ไม่ต้องแตะไฟล์อื่น
// ═══════════════════════════════════════════════════

// ── Canvas ───────────────────────────────────────────
const WIDTH  = 390;   // ความกว้าง canvas (portrait mobile)
const HEIGHT = 720;   // ความสูง canvas

// ── Game States ──────────────────────────────────────
// STATE machine ของเกม ใช้ใน game.js _update() switch
const STATE = {
  LOADING  : 'LOADING',   // กำลังโหลด assets
  INTRO    : 'INTRO',     // หน้าแรก / เมนู
  PLAYING  : 'PLAYING',   // กำลังเล่น
  TALLY    : 'TALLY',     // สรุปคะแนนหลังจบ
  NAME     : 'NAME',      // กรอกชื่อ
  RANKING  : 'RANKING',   // ดู leaderboard
};

// ── Green Pastel Colour Palette ──────────────────────
const COL = {
  PRIMARY      : '#4CAF50',
  PRIMARY_L    : '#E8F5E9',
  PRIMARY_D    : '#2E7D32',
  PRIMARY_MID  : '#81C784',
  DARK         : '#1B3A1F',
  MID          : '#388E3C',
  LIGHT_TEXT   : '#66BB6A',
  BG_SKY       : '#F1F8E9',
  BG_SKY2      : '#DCEDC8',
  BG_GROUND    : '#8BC34A',
  BG_BOSS_TOP  : '#0A1F0D',
  BG_BOSS_MID  : '#1B4A1E',
  WHITE        : '#FFFFFF',
  WHITE_A80    : 'rgba(255,255,255,0.80)',
  WHITE_A55    : 'rgba(232,245,233,0.88)',
  HEART_ON     : '#E84040',
  HEART_OFF    : '#A5D6A7',
  COIN_COL     : '#F9A825',
  BOSS_HP1     : '#E84A00',
  BOSS_HP2     : '#FFC020',
  BOSS_BG      : 'rgba(10,50,15,0.88)',
  RANK_ME      : '#C8E6C9',
  GOLD         : '#FFD700',
  JOYPAD_BG    : 'rgba(27,58,31,0.82)',
  JOYPAD_BTN_A : '#4CAF50',
  JOYPAD_BTN_B : '#F9A825',
};

// ── Fonts ────────────────────────────────────────────
const FONT = {
  MAIN : '"Fredoka One", "Segoe UI Emoji", cursive',
  BODY : '"Nunito", "Segoe UI Emoji", sans-serif',
  MONO : '"Courier New", monospace',
};

// ── Physics ──────────────────────────────────────────
const BASE_SPEED      = 220;
const MAX_SPEED       = 520;   // px/s ความเร็วสูงสุด (reserved — ยังไม่ใช้ใน speed scaling)
const SPEED_INC       = 12;    // px/s ที่เพิ่มต่อ second (reserved — ยังไม่ใช้)
const GRAVITY         = 1600;
const JUMP_VEL        = -720;
const JUMP_VEL_MIN    = -360;
const JUMP_HOLD_MS    = 200;
const DIVE_VEL        = 800;
const STOMP_BOUNCE    = -500;
const SLIDE_DUR       = 400;
const DOUBLE_JUMP_VEL = -520;

// ── Player ───────────────────────────────────────────
const PLAYER_X      = 72;
const PLAYER_W      = 72;
const PLAYER_H      = 84;
const PLAYER_HP     = 3;
const INVINCIBLE_MS = 1500;

// ── Ground ───────────────────────────────────────────
const GROUND_Y = Math.round(HEIGHT * 0.70);  // 504px
const GROUND_H = 28;  // px ความสูงแถบพื้น (visual reference — ไม่ได้ใช้ใน collision)

// ── Boss Raid ─────────────────────────────────────────
const BOSS_RAID_MIN      = 400;
const BOSS_RAID_MAX      = 700;
const BOSS_RAID_INTERVAL = 500;

const BOSSES = [
  { id: 0, name: 'บอสใหญ่', emoji: '👾', hp: 8, phase2hp: 3, speed: 180, color: '#2E7D32' },
];

// ── Items ────────────────────────────────────────────
const ITEM_TYPES = {
  COIN    : { key:'coin',    emoji:'🪙', points: 50,  w:28, h:28 },
  STAR    : { key:'star',    emoji:'⭐', points: 200, w:32, h:32 },
  HEART   : { key:'heart',  emoji:'❤️', points: 0,   w:32, h:32 },
  SHIELD  : { key:'shield', emoji:'🛡️', points: 0,   w:32, h:32, duration: 5000 },
  POWERUP : { key:'powerup', emoji:'⭐', points: 0,   w:40, h:40 },
};

// ── Weapon ────────────────────────────────────────────
const WEAPON_CHARGE_MS      = 2000;
const WEAPON_READY_BLINK_MS = 400;
const PROJ_SPEED            = 680;
const PROJ_DMG_NORMAL       = 50;
const PROJ_BOSS_DMG         = 2;
const PROJ_BOSS_DMG_P2      = 1;     // HP boss ลดต่อกระสุน phase 2 (reserved — phase 2 ยังไม่ implement)

// ── Dash bonus (ใช้ใน dashing → enemy collision) ─────
const DASH_POINTS = 200;

// ── Enemies ───────────────────────────────────────────
const ENEMY_TYPES = {
  GROUND : { key:'ground', emoji:'🐢', w:52, h:48, speed:60, points:100, airborne:false },
  AIR    : { key:'air',    emoji:'🦅', w:48, h:42, speed:80, points:150, airborne:true  },
  SPIKE  : { key:'spike',  emoji:'🌵', w:36, h:60, speed: 0, points:0,   airborne:false },
};

// ── Power-up System ───────────────────────────────────
// วิธีเปิด/ปิด powerup: แก้แค่ ACTIVE_POWERUPS บรรทัดเดียว
// ตัวเลือก: 'SPEED_BOOST' | 'MAGNET' | 'FREEZE' | 'GHOST' | 'FLY' | 'BOMB' | 'RAPID_FIRE' | 'GIANT'
const ACTIVE_POWERUPS = ['MAGNET'];  // ← แก้ที่นี่

const POWERUP_DURATION_MS = 10000;

const _PU = {
  SPEED_BOOST : { key:'speed_boost', emoji:'⚡', label:'Slow-Mo',    duration: POWERUP_DURATION_MS, sprite: null },
  MAGNET      : { key:'magnet',      emoji:'🧲', label:'Magnet',     duration: POWERUP_DURATION_MS, sprite: null },
  FREEZE      : { key:'freeze',      emoji:'❄️', label:'Freeze',     duration: POWERUP_DURATION_MS, sprite: null },
  GHOST       : { key:'ghost',       emoji:'👻', label:'Ghost',      duration: POWERUP_DURATION_MS, sprite: null },
  FLY         : { key:'fly',         emoji:'🪂', label:'Fly',        duration: POWERUP_DURATION_MS, sprite: null },
  BOMB        : { key:'bomb',        emoji:'💣', label:'Bomb',       duration: POWERUP_DURATION_MS, sprite: null },
  RAPID_FIRE  : { key:'rapid_fire',  emoji:'🔫', label:'Rapid Fire', duration: POWERUP_DURATION_MS, sprite: null },
  GIANT       : { key:'giant',       emoji:'🌀', label:'Giant',      duration: POWERUP_DURATION_MS, sprite: null },
};

const POWERUP_TYPES = Object.fromEntries(
  Object.entries(_PU).map(([k, v]) => [k, { ...v, enabled: ACTIVE_POWERUPS.includes(k) }])
);

const POWERUP_SPAWN_CHANCE = 0.08;

// ── Gameplay Tuning Constants ─────────────────────────
// Magic numbers ทั้งหมดอยู่ที่นี่ แก้ได้โดยไม่ต้องค้น game.js
const BOMB_RADIUS        = 300;   // px รัศมีระเบิด BOMB
const BOMB_INTERVAL_MS   = 400;   // ms ระหว่างการระเบิดแต่ละครั้ง
const FREEZE_RADIUS      = 150;   // px รัศมี AOE ของ FREEZE
const FREEZE_SCORE_MS    = 600;   // ms ระหว่างการให้คะแนน FREEZE
const MAGNET_RADIUS      = 160;   // px รัศมีดูด item ของ MAGNET
const FLY_RADIUS         = 320;   // px รัศมีดูด item ของ FLY
const FLY_GROUND_CUTOFF  = 40;    // px จากพื้น — item ต่ำกว่านี้ไม่ถูกดูดตอน fly
const COMBO_TIMEOUT_MS   = 2000;  // ms ก่อน combo reset
const PASSED_COOLDOWN_MS = 300;  // ms cooldown เมื่อศัตรูผ่าน player ไป
const RAPID_FIRE_MS      = 300;   // ms ระหว่างกระสุน Rapid Fire   // ms cooldown เมื่อศัตรูผ่าน player ไป
const BGM_VOLUME         = 0.35;  // 0–1
const SFX_VOLUME         = 0.6;   // 0–1

// ── Scoring ───────────────────────────────────────────
const DIST_POINT_PER_M = 1;
const BOSS_KILL_BONUS  = 1000;

// ── Ranking ───────────────────────────────────────────
const RANKING_KEY = 'endlessRush_ranking_v1';
const RANKING_MAX = 10;

// ── Asset Paths ───────────────────────────────────────
const ASSET_IMAGES = {
  player       : 'assets/images/player.png',
  background   : 'assets/images/background.png',
  boss         : 'assets/images/boss.png',
  enemy_ground : 'assets/images/enemy_ground.png',
  enemy_air    : 'assets/images/enemy_air.png',
  item_coin    : 'assets/images/item_coin.png',
  item_star    : 'assets/images/item_star.png',
  power_up     : 'assets/images/power_up.png',
};

const ASSET_SOUNDS = {
  bgm          : 'assets/sounds/bgm.mp3',
  boss         : 'assets/sounds/boss.mp3',
  jump         : 'assets/sounds/jump.wav',
  dash         : 'assets/sounds/dash.wav',
  hit          : 'assets/sounds/hit.wav',
  coin         : 'assets/sounds/coin.wav',
  start        : 'assets/sounds/start.wav',
  warning      : 'assets/sounds/warning.wav',
  boss_incoming: 'assets/sounds/boss_incoming.wav',  // เสียง wave ตอนบอสบินเข้า
  boss_hit     : 'assets/sounds/boss_hit.wav',
  boss_clear   : 'assets/sounds/boss_clear.wav',
  die          : 'assets/sounds/die.wav',
};

// speedFactor: น้อย = ไกล/ช้า, มาก = ใกล้/เร็ว
const BG_LAYERS = [
  { speedFactor: 0.15, yBase: 80,  itemEmojis: ['☁️','☁️'] },
  { speedFactor: 0.40, yBase: 200, itemEmojis: ['🌿','🌿'] },
  { speedFactor: 0.70, yBase: 340, itemEmojis: ['🌳','🌲'] },
];

const BTN = { JUMP: 'JUMP', SLIDE: 'SLIDE' };

// ── Item Spawn Intervals ──────────────────────────────
const ITEM_SPAWN_MIN_MS  = 800;   // ms ระหว่าง spawn item ต่ำสุด
const ITEM_SPAWN_MAX_MS  = 1400;  // ms ระหว่าง spawn item สูงสุด
const ITEM_SPAWN_INIT_MS = 1200;  // ms delay ก่อน spawn ครั้งแรก

// ── Boulder Kill Bonus ────────────────────────────────
const BOULDER_KILL_BONUS = 150;  // pts เมื่อยิงหรือทำ boulder หายไป

// ── Platform Level Heights ────────────────────────────
// ใช้ร่วมกันระหว่าง world.js และ game.js (_spawnRaidPlatform)
// ต้องตรงกันเสมอ — แก้ที่นี่ที่เดียว
const PLAT_Y = {
  1: GROUND_Y - 115,   // ต่ำ  — กระโดดจากพื้นได้
  2: GROUND_Y - 220,   // กลาง — กระโดดจาก level 1
  3: GROUND_Y - 320,   // สูง  — กระโดดจาก level 2
};
