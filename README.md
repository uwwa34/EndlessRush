# 🏃 Endless Rush

Endless runner บนมือถือ — วิ่ง กระโดด เอาชนะ Boss!  
Canvas 390×720px, Vanilla JS, ไม่มี dependency ภายนอก

---

## โครงสร้างโปรเจกต์

```
endless-rush/
├── index.html              # entry point + boot sequence + PWA meta
├── manifest.json           # PWA manifest (install บนมือถือได้)
├── js/
│   ├── settings.js         # ⚙️  config ทั้งหมด — แก้ที่นี่ที่เดียว
│   ├── player.js           # player physics, animation, powerup
│   ├── world.js            # platform manager, background, ground
│   ├── enemy.js            # enemy spawn, update, collision
│   ├── boulder.js          # rolling boulder obstacle
│   ├── items.js            # coin/star/heart/shield/powerup items
│   ├── boss.js             # boss raid fly-through system
│   ├── hud.js              # HUD draw (HP, score, weapon bar)
│   ├── ranking.js          # leaderboard + name entry screen
│   └── game.js             # main game loop + state machine
└── assets/
    ├── images/             # sprites (ดูรายการด้านล่าง)
    └── sounds/             # SFX + BGM (ดูรายการด้านล่าง)
```

---

## วิธีรัน

เปิดผ่าน local server เท่านั้น (SFX ใช้ `fetch` ซึ่ง block บน `file://`)

```bash
# Python
python3 -m http.server 8080

# Node
npx serve .

# VS Code
Live Server extension → Open with Live Server
```

เปิด `http://localhost:8080` แล้วเล่นได้เลย

---

## Game Flow

```
LOADING → INTRO → PLAYING → TALLY → NAME → RANKING → INTRO
```

| State     | คำอธิบาย                              |
|-----------|---------------------------------------|
| LOADING   | โหลด assets ทั้งหมด                    |
| INTRO     | หน้าเมนู / animation player วิ่งเข้า  |
| PLAYING   | เล่นเกม (รวม boss raid)               |
| TALLY     | สรุปคะแนนหลังตาย                      |
| NAME      | กรอกชื่อผู้เล่น                        |
| RANKING   | leaderboard top 10                    |

---

## Controls

| ปุ่ม             | Keyboard         | Mobile        |
|-----------------|------------------|---------------|
| กระโดด (Jump)   | Space / X / ↑    | ปุ่ม A (ขวา)  |
| ยิง (Fire)      | Z / ↓            | ปุ่ม B (ซ้าย) |
| Double Jump     | กด A อีกครั้งกลางอากาศ | เหมือนกัน |

---

## Gameplay

### ศัตรู
| ประเภท | Emoji | พฤติกรรม | คะแนน |
|--------|-------|----------|-------|
| GROUND | 🐢 | เดินบนพื้น | 100 |
| AIR    | 🦅 | บินกลางอากาศ | 150 |
| SPIKE  | 🌵 | อยู่นิ่ง | 0 |

- **Stomp** (กระโดดเหยียบ) → kill ได้ทุกตัวยกเว้น SPIKE
- **ยิงกระสุน** (ปุ่ม B) → kill ได้ทุกตัว cooldown 2 วิ
- **ศัตรูผ่านไปแล้ว** → ไม่ damage แม้จะยังชนกัน

### Boss Raid
- ปรากฏทุก **400–700m** (สุ่ม)
- WARNING phase 2.5 วิ → boss บินผ่านจากขวาไปซ้าย
- ยิงโดน boss = +คะแนน, kill boss = +1000 pts
- Platform พิเศษ 3 ชั้น spawn ช่วย player หลบ

### Rolling Boulder 🪨
- Spawn หลัง 200m ทุก 4–8 วิ
- มี 2 แบบ: หิน และลูกหนาม
- กระโดดข้ามหรือยิงทำลาย (+150 pts)

### คะแนน
```
คะแนนรวม = (ระยะทาง × 1) + (เหรียญ × 50) + kill score
```
- Combo: kill ต่อเนื่องก่อน 2 วิ = คะแนน × combo count

---

## Special Power-ups

เก็บ item พิเศษ (🟡 glow ring) ระหว่างเกม ใช้เวลา 10 วิ

| Key           | Emoji | เอฟเฟกต์ |
|---------------|-------|----------|
| `SPEED_BOOST` | ⚡ | โลก+ศัตรูช้า 30%, เหรียญ 3× |
| `MAGNET`      | 🧲 | ดูด item รัศมี 160px |
| `FREEZE`      | ❄️ | ศัตรูหยุดเดิน (scroll ต่อ) + AOE score |
| `GHOST`       | 👻 | ผ่านศัตรูได้ ไม่โดน damage, player กระพริบ |
| `FLY`         | 🪂 | บินได้ + ดูด item บน platform รัศมี 320px |
| `BOMB`        | 💣 | AOE ระเบิด 300px ต่อเนื่อง |
| `RAPID_FIRE`  | 🔫 | ยิงอัตโนมัติทุก 300ms |
| `GIANT`       | 🌀 | ตัวโต 2.2×, invincible, ชนศัตรูได้ |

### เปิด/ปิด Power-up

แก้ไฟล์ `js/settings.js` บรรทัดเดียว:

```js
// เปิดหลายอัน
const ACTIVE_POWERUPS = ['MAGNET', 'FREEZE', 'BOMB'];

// เปิดทั้งหมด
const ACTIVE_POWERUPS = ['SPEED_BOOST','MAGNET','FREEZE','GHOST','FLY','BOMB','RAPID_FIRE','GIANT'];

// ปิดทั้งหมด
const ACTIVE_POWERUPS = [];
```

---

## Assets ที่ต้องใส่เอง

### รูปภาพ (`assets/images/`)
| ไฟล์ | ใช้กับ |
|------|--------|
| `player.png` | ตัวละครหลัก |
| `background.png` | พื้นหลัง (tile แนวนอน) |
| `boss.png` | boss |
| `enemy_ground.png` | ศัตรูพื้น |
| `enemy_air.png` | ศัตรูอากาศ |
| `item_coin.png` | เหรียญ |
| `item_star.png` | ดาว |
| `power_up.png` | powerup item (รูปเดียวทุกอัน) |

> ถ้าไม่มีไฟล์ เกม fallback เป็น emoji อัตโนมัติ

### เสียง (`assets/sounds/`)
| ไฟล์ | เหตุการณ์ |
|------|-----------|
| `bgm.mp3` | BGM หลัก (loop) |
| `jump.wav` | กระโดด |
| `dash.wav` | ยิงกระสุน |
| `hit.wav` | โดนตี |
| `coin.wav` | เก็บ item |
| `start.wav` | เริ่มเกม / powerup |
| `warning.wav` | boss warning |
| `boss_incoming.wav` | boss บินเข้า (สร้างอัตโนมัติ) |
| `boss_hit.wav` | โดน boss / kill enemy |
| `boss_clear.wav` | boss หนี |
| `die.wav` | ตาย |

> ถ้าไม่มีไฟล์เสียง เกมยังทำงานได้ปกติ เพียงแต่ไม่มีเสียง

---

## การปรับแต่ง

ค่าทั้งหมดอยู่ใน `js/settings.js` — ไม่ต้องแตะไฟล์อื่น

```js
// ความยาก
const PLAYER_HP     = 3;        // HP เริ่มต้น
const BASE_SPEED    = 220;      // ความเร็วเริ่มต้น px/s
const BOSS_RAID_MIN = 400;      // m ขั้นต่ำก่อน boss
const BOSS_RAID_MAX = 700;      // m สูงสุดก่อน boss

// powerup gameplay
const BOMB_RADIUS   = 300;      // px รัศมีระเบิด
const FREEZE_RADIUS = 150;      // px รัศมี freeze
const MAGNET_RADIUS = 160;      // px รัศมีดูด (magnet)
const FLY_RADIUS    = 320;      // px รัศมีดูด (fly)
const RAPID_FIRE_MS = 300;      // ms ระหว่างกระสุน

// เสียง
const BGM_VOLUME    = 0.35;     // 0.0–1.0
const SFX_VOLUME    = 0.6;      // 0.0–1.0
```

---

## โครงสร้าง Code

| ไฟล์ | Class | หน้าที่ |
|------|-------|---------|
| `settings.js` | — | constants ทั้งหมด |
| `player.js` | `Player` | physics, animation, hit, powerup |
| `world.js` | `World`, `PlatformManager` | scroll, platform, background |
| `enemy.js` | `Enemy`, `EnemyManager` | spawn, AI, collision |
| `boulder.js` | `Boulder`, `BoulderManager` | rolling obstacle |
| `items.js` | `Item`, `ItemManager` | collectibles, powerup spawn |
| `boss.js` | `BossRaid` | raid state machine, projectile |
| `hud.js` | `HUD` | draw HP, score, weapon bar |
| `ranking.js` | `TallyScreen`, `RankingScreen` | score save, leaderboard |
| `game.js` | `VirtualJoypad`, `Game` | main loop, input, audio |

### State Machine (Boss Raid)
```
IDLE → WARNING (2.5s) → INCOMING → DONE → IDLE
```

### Audio Architecture
- **BGM**: HTMLAudio element (loop)
- **SFX**: fetch → ArrayBuffer → Web Audio API (iOS compatible)
- iOS unlock: AudioContext resume ใน user gesture แรก

---

## Known Limitations

- ไม่มี Bundler — โหลด 10 script tags แยกกัน (แนะนำให้ใช้ Vite สำหรับ production)
- ทุก class อยู่ใน global scope (ไม่มี ES modules)
- `bgm.mp3` และ `boss.mp3` ต้องใส่เอง — ไม่มี fallback เสียง BGM
- Speed scaling (`MAX_SPEED`, `SPEED_INC`) ยังไม่ implement — ความเร็วคงที่ตลอดเกม

---

## License

Private — All rights reserved
