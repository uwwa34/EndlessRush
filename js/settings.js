// ═══════════════════════════════════════════════════
//  js/settings.js  —  Endless Rush  (Green Pastel)
// ═══════════════════════════════════════════════════

const WIDTH  = 390;
const HEIGHT = 720;
const FPS    = 60;

const STATE = {
  LOADING  : 'LOADING',
  INTRO    : 'INTRO',
  PLAYING  : 'PLAYING',
  TALLY    : 'TALLY',
  NAME     : 'NAME',
  RANKING  : 'RANKING',
};

// ── Green Pastel Palette ─────────────────────────────
const COL = {
  PRIMARY      : '#4CAF50',   // main green
  PRIMARY_L    : '#E8F5E9',   // lightest green tint
  PRIMARY_D    : '#2E7D32',   // deep green
  PRIMARY_MID  : '#81C784',   // mid green
  DARK         : '#1B3A1F',   // dark green text
  MID          : '#388E3C',   // mid green text
  LIGHT_TEXT   : '#66BB6A',   // muted green
  BG_SKY       : '#F1F8E9',   // very light green sky
  BG_SKY2      : '#DCEDC8',   // light green
  BG_GROUND    : '#8BC34A',   // ground green
  BG_BOSS_TOP  : '#0A1F0D',   // dark boss top
  BG_BOSS_MID  : '#1B4A1E',   // dark boss mid
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
  // Joypad bg (คนละสีกับพื้น)
  JOYPAD_BG    : 'rgba(27,58,31,0.82)',
  JOYPAD_BTN_A : '#4CAF50',
  JOYPAD_BTN_B : '#F9A825',
};

const FONT = {
  MAIN   : '"Fredoka One", "Segoe UI Emoji", cursive',
  BODY   : '"Nunito", "Segoe UI Emoji", sans-serif',
  MONO   : '"Courier New", monospace',
};

// ── Physics ──────────────────────────────────────────
const BASE_SPEED      = 220;
const MAX_SPEED       = 520;
const SPEED_INC       = 12;
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
const PLAYER_HP     = 3; //from 5 
const INVINCIBLE_MS = 1500;

// ── Ground — 30% from bottom ─────────────────────────
const GROUND_Y = Math.round(HEIGHT * 0.70);   // 504px
const GROUND_H = 28;

// ── Boss Raid ─────────────────────────────────────────
const BOSS_RAID_MIN      = 400;   // m ต่ำสุดก่อน raid
const BOSS_RAID_MAX      = 700;   // m สูงสุดก่อน raid
const BOSS_RAID_INTERVAL = 500;   // alias เริ่มต้น (จะสุ่มใหม่ทุกครั้ง)
const BOSS_TRIGGER_DIST  = 500;   // alias เดิม
const BOSSES = [
  { id: 0, name: 'บอสใหญ่', emoji: '👾', hp: 8, phase2hp: 3, speed: 180, color: '#2E7D32' },
];

// ── Items — COIN / STAR / HEART / SHIELD ─────────────
const ITEM_TYPES = {
  COIN    : { key:'coin',    emoji:'🪙', points: 50, w:28, h:28 },
  STAR    : { key:'star',    emoji:'⭐', points:200, w:32, h:32 },
  HEART   : { key:'heart',  emoji:'❤️', points:  0, w:32, h:32 },
  SHIELD  : { key:'shield', emoji:'🛡️', points:  0, w:32, h:32, duration:5000 },
  POWERUP : { key:'powerup', emoji:'⭐', points:  0, w:40, h:40 },  // emoji จะถูก override ตอน spawn
};
// ORB และ SHIELD ถูกตัดออก

// ── Weapon Charge ─────────────────────────────────────
const WEAPON_CHARGE_MS      = 2000;
const WEAPON_READY_BLINK_MS = 400;
const PROJ_SPEED            = 680;
const PROJ_DMG_NORMAL       = 50;
const PROJ_BOSS_DMG         = 2;
const PROJ_BOSS_DMG_P2      = 1;
const BOSS_DROP_ORB         = false;   // ไม่ drop orb แล้ว (ORB ถูกตัด)

// ── Compatibility stubs ───────────────────────────────
const SPECIAL_MAX      = 1;
const DASH_DURATION_MS = 400;
const DASH_SPEED       = 900;
const DASH_BOSS_DMG    = 2;
const DASH_POINTS      = 200;

// ── Enemies ───────────────────────────────────────────
const ENEMY_TYPES = {
  GROUND : { key:'ground', emoji:'🐢', w:52, h:48, speed:60, points:100, airborne:false },
  AIR    : { key:'air',    emoji:'🦅', w:48, h:42, speed:80, points:150, airborne:true  },
  SPIKE  : { key:'spike',  emoji:'🌵', w:36, h:60, speed: 0, points:  0, airborne:false },
};

// ── Power-up Special Items ────────────────────────────
// เปลี่ยน enabled: true/false เพื่อเปิด/ปิดแต่ละ power-up
const POWERUP_DURATION_MS = 10000;   // ระยะเวลา default 10 วิ
const POWERUP_TYPES = {
  SPEED_BOOST : { key:'speed_boost', emoji:'⚡', label:'Slow-Mo',    enabled: false, duration: POWERUP_DURATION_MS, sprite: null },
  MAGNET      : { key:'magnet',      emoji:'🧲', label:'Magnet',     enabled: true,  duration: POWERUP_DURATION_MS, sprite: null },
  FREEZE      : { key:'freeze',      emoji:'❄️', label:'Freeze',     enabled: false, duration: POWERUP_DURATION_MS, sprite: null },
  GHOST       : { key:'ghost',       emoji:'👻', label:'Ghost',      enabled: false, duration: POWERUP_DURATION_MS, sprite: null },
  FLY         : { key:'fly',         emoji:'🪂', label:'Fly',        enabled: false, duration: POWERUP_DURATION_MS, sprite: null },
  BOMB        : { key:'bomb',        emoji:'💣', label:'Bomb',       enabled: false, duration: 0,                   sprite: null },
  RAPID_FIRE  : { key:'rapid_fire',  emoji:'🔫', label:'Rapid Fire', enabled: false, duration: POWERUP_DURATION_MS, sprite: null },
  GIANT       : { key:'giant',       emoji:'🌀', label:'Giant',      enabled: false, duration: POWERUP_DURATION_MS, sprite: null },
};
// spawn chance ของ special item (ต่อ spawn cycle)
const POWERUP_SPAWN_CHANCE = 0.08;   // 8% ต่อ cycle
const DIST_POINT_PER_M = 1;
const BOSS_KILL_BONUS  = 1000;

// ── Ranking ───────────────────────────────────────────
const RANKING_KEY = 'endlessRush_ranking_v1';
const RANKING_MAX = 10;

// ══════════════════════════════════════════════════════
//  ASSET PATHS — แก้ที่นี่ที่เดียว
// ══════════════════════════════════════════════════════
const ASSET_IMAGES = {
  player        : 'assets/images/player.png',
  background    : 'assets/images/background.png',
  boss          : 'assets/images/boss.png',
  enemy_ground  : 'assets/images/enemy_ground.png',
  enemy_air     : 'assets/images/enemy_air.png',
  item_coin     : 'assets/images/item_coin.png',
  power_up      : 'assets/images/power_up.png',   // รูปเดียวสำหรับทุก powerup
};

const ASSET_SOUNDS = {
  bgm        : 'assets/sounds/bgm.mp3',
  boss       : 'assets/sounds/boss.mp3',
  jump       : 'assets/sounds/jump.wav',
  dash       : 'assets/sounds/dash.wav',
  hit        : 'assets/sounds/hit.wav',
  coin       : 'assets/sounds/coin.wav',
  start      : 'assets/sounds/start.wav',
  warning    : 'assets/sounds/warning.wav',
  boss_hit   : 'assets/sounds/boss_hit.wav',
  boss_clear : 'assets/sounds/boss_clear.wav',
  die        : 'assets/sounds/die.wav',
};

const BG_LAYERS = [
  { speedFactor: 0.15, yBase: 80,  itemEmojis: ['☁️','☁️'] },
  { speedFactor: 0.40, yBase: 200, itemEmojis: ['🌿','🌿'] },
  { speedFactor: 0.70, yBase: 340, itemEmojis: ['🌳','🌲'] },
];

const BTN = { JUMP: 'JUMP', SLIDE: 'SLIDE' };
