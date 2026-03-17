# 🏃 Endless Rush — Yellow Pastel Edition

เกมส์ Endless Runner วิ่งไปทางขวา สไตล์น่ารักสดใส Yellow Pastel

---

## 📁 โครงสร้าง Project

```
endless-runner/
├── index.html              ← Entry point, loading, canvas scaling
├── js/
│   ├── settings.js         ← Constants, colors, speeds, boss/item config
│   ├── player.js           ← Player: run/jump/slide, HP, powerups
│   ├── world.js            ← Parallax BG, ground, distance tracking
│   ├── enemy.js            ← Enemy spawner: ground/air/spike
│   ├── items.js            ← Items: coin/star/speed/shield/heart
│   ├── boss.js             ← Boss AI: 2 phases, attacks, HP bar
│   ├── hud.js              ← HUD: score, hearts, distance, powerup icons
│   ├── ranking.js          ← Score tally, name entry VKB, ranking board
│   └── game.js             ← Main game loop, state machine, joypad
├── assets/
│   ├── images/             ← (ใส่ไฟล์ภาพ sprite ที่นี่)
│   └── sounds/             ← (ใส่ไฟล์เสียงที่นี่)
└── README.md
```

---

## 🎮 Game Flow

```
Loading → Intro → Playing ⇄ Boss Fight (ทุก 1000m)
                      ↓ HP หมด
               Score Tally → Name Entry → Ranking → Intro
```

- **ไม่มี Game Over** — HP หมดเมื่อไหร่ บันทึก ranking ทุกครั้ง
- Boss เจอทุก **1000m** (1000m / 2000m / 3000m / ...)

---

## 🕹️ การควบคุม

| ปุ่ม | PC | มือถือ |
|------|-----|--------|
| Jump / กระโดด | ↑ W Space | ปุ่มซ้าย |
| Slide / หมอบ  | ↓ S       | ปุ่มขวา |
| เริ่มเกมส์    | A         | แตะหน้าจอ |

**Boss Fight:** กระโดดโจมตี Boss (↑) และหมอบหลบการโจมตี (↓)

---

## 🎵 Sound Files ที่ต้องการ

ใส่ไฟล์เสียงในโฟลเดอร์ `assets/sounds/`:

| ไฟล์ | ใช้ตอน |
|------|--------|
| `bgm.mp3`        | เพลงพื้นหลัง (loop) |
| `boss.mp3`       | เพลง Boss Fight (loop) |
| `jump.wav`       | กระโดด |
| `slide.wav`      | หมอบ |
| `hit.wav`        | โดนโจมตี |
| `coin.wav`       | เก็บของ |
| `start.wav`      | เริ่มเกมส์ |
| `warning.wav`    | เตือน Boss กำลังมา |
| `boss_hit.wav`   | โจมตี Boss โดน |
| `boss_clear.wav` | กำจัด Boss สำเร็จ |
| `die.wav`        | ตาย / HP หมด |

> เกมส์ทำงานได้ปกติแม้ไม่มีไฟล์เสียง (graceful fallback)

---

## 🖼️ Image Sprites (optional)

เกมส์ใช้ **emoji fallback** ทั้งหมด ถ้าไม่มีไฟล์ภาพก็เล่นได้เลย

หากต้องการใส่ sprite จริง ให้เพิ่ม path ใน `index.html`:

```js
const ASSET_IMAGES = {
  player : 'assets/images/player.png',   // 48×56 px spritesheet
  // ...
};
```

แล้ว inject ใน `game.js` → `setImages()`

---

## ⚙️ ปรับแต่ง (settings.js)

```js
const BASE_SPEED         = 220;   // ความเร็วเริ่มต้น px/sec
const MAX_SPEED          = 520;   // ความเร็วสูงสุด
const PLAYER_HP          = 3;     // HP เริ่มต้น
const BOSS_TRIGGER_DIST  = 1000;  // boss ทุกกี่ m
const BOSS_KILL_BONUS    = 1000;  // คะแนน bonus กำจัด boss
```

---

## 🚀 วิธีรัน

เปิดด้วย local server (เพราะ Audio API ต้องการ https/localhost):

```bash
# Python
python3 -m http.server 8080

# Node.js
npx serve .

# VS Code
ใช้ Live Server extension
```

แล้วเปิด `http://localhost:8080`

---

## 🎨 Color Palette (Yellow Pastel)

| ชื่อ | Hex | ใช้ที่ |
|------|-----|--------|
| Golden Yellow | `#F5C518` | Primary, buttons |
| Light Yellow  | `#FFF9C4` | Background |
| Deep Gold     | `#C49010` | Borders, accents |
| Dark Brown    | `#5C3D00` | Text |
| Mid Brown     | `#9A6E00` | Secondary text |
| Ground Yellow | `#E8D060` | Ground tile |
