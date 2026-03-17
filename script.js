// Canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ---------- Difficulty ----------
let difficulty = 'Medium'; // default
// URL param support
const urlParams = new URLSearchParams(window.location.search);
const diffParam = urlParams.get('diff');
if (diffParam) {
  const d = diffParam.toLowerCase();
  if (['easy', 'medium', 'hard'].includes(d)) difficulty = d.charAt(0).toUpperCase() + d.slice(1);
}

// Difficulty settings (Easy, Medium, Hard)
const DIFFICULTY_SETTINGS = {
  Easy: {
    enemySpeed: 2.5,
    spawnStart: 1500,
    spawnMin: 500,
    spawnReductionRate: 5,
    bulletDamage: 20,
    bulletSpeed: 8,
    healthRegenBase: 2,
    maxHealthBase: 120,
    shotDelayBase: 350
  },
  Medium: { // new medium (between Easy and Hard)
    enemySpeed: 3,
    spawnStart: 1200,
    spawnMin: 300,
    spawnReductionRate: 10,
    bulletDamage: 15,
    bulletSpeed: 7,
    healthRegenBase: 1,
    maxHealthBase: 110,
    shotDelayBase: 300
  },
  Hard: {
    enemySpeed: 3.5,
    spawnStart: 900,
    spawnMin: 200,
    spawnReductionRate: 15,
    bulletDamage: 12,
    bulletSpeed: 6,
    healthRegenBase: 0,
    maxHealthBase: 80,
    shotDelayBase: 250
  }
};
let settings = DIFFICULTY_SETTINGS[difficulty];

// ---------- Game State ----------
let health = settings.maxHealthBase;
let maxHealth = settings.maxHealthBase;
let healthRegen = settings.healthRegenBase; // HP per second
let score = 0;
let gameOver = false;
let startTime = Date.now();
const player = { x: canvas.width / 2, y: canvas.height / 2, radius: 15, speed: 5 };

// Upgrade variables
let bulletDamage = settings.bulletDamage;
let shotDelay = settings.shotDelayBase;
let bulletSpeed = settings.bulletSpeed;
let nextUpgradeScore = 50; // first threshold
let pendingUpgrade = false;
let gamePaused = false; // pause during upgrade screen

// Auto‑fire
let spaceHeld = false;
let lastShot = 0;

// Global pause (Esc)
let isPaused = false;

// Mouse tracking (for aiming)
let mousePos = { x: canvas.width / 2, y: canvas.height / 2 };
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mousePos.x = e.clientX - rect.left;
  mousePos.y = e.clientY - rect.top;
});

// ---------- Enemy ----------
function createEnemy() {
  const elapsed = (Date.now() - startTime) / 1000; // seconds
  const baseHealth = 20;
  const health = Math.floor(baseHealth + elapsed * 0.5); // slow growth
  const side = Math.floor(Math.random() * 4);
  let x, y;
  const margin = 20;
  switch (side) {
    case 0: x = -margin; y = Math.random() * canvas.height; break;
    case 1: x = canvas.width + margin; y = Math.random() * canvas.height; break;
    case 2: x = Math.random() * canvas.width; y = -margin; break;
    case 3: x = Math.random() * canvas.width; y = canvas.height + margin; break;
  }
  return { x, y, radius: 12, speed: settings.enemySpeed, type: 'zombie', points: 10, color: '#f00', health, maxHealth: health };
}

const enemies = [];
let spawnTimer = 0;
function getSpawnInterval() {
  const elapsed = (Date.now() - startTime) / 1000; // seconds
  const reduction = Math.min(elapsed * settings.spawnReductionRate, settings.spawnStart - settings.spawnMin);
  return settings.spawnStart - reduction;
}

// ---------- Bullets ----------
const bullets = [];

// ---------- Input ----------
window.addEventListener('keydown', e => {
  if (e.code === 'Space' && !gameOver && !pendingUpgrade && !isPaused) spaceHeld = true;
  if (e.code === 'Escape' && !pendingUpgrade) isPaused = !isPaused;
});
window.addEventListener('keyup', e => { if (e.code === 'Space') spaceHeld = false; });
const keys = {};
window.addEventListener('keydown', e => { keys[e.key] = true; });
window.addEventListener('keyup', e => { keys[e.key] = false; });

// ---------- Difficulty Buttons (UI) ----------
const diffButtons = [
  { label: 'Easy', x: canvas.width - 110, y: 10, w: 100, h: 30, value: 'Easy' },
  { label: 'Medium', x: canvas.width - 110, y: 50, w: 100, h: 30, value: 'Medium' },
  { label: 'Hard', x: canvas.width - 110, y: 90, w: 100, h: 30, value: 'Hard' }
];
canvas.addEventListener('click', e => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  diffButtons.forEach(btn => {
    if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
      difficulty = btn.value;
      settings = DIFFICULTY_SETTINGS[difficulty];
      // Apply new difficulty values immediately
      bulletDamage = settings.bulletDamage;
      bulletSpeed = settings.bulletSpeed;
      shotDelay = settings.shotDelayBase;
      maxHealth = settings.maxHealthBase;
      health = maxHealth;
      healthRegen = settings.healthRegenBase;
    }
  });
});

// ---------- Upgrade Handling ----------
function applyUpgrade(choice) {
  if (choice === 'damage') bulletDamage += 5;
  else if (choice === 'speed') shotDelay = Math.max(100, shotDelay - 20);
  else if (choice === 'fastBullet') bulletSpeed += 2;
  else if (choice === 'regen') healthRegen += 2;
  else if (choice === 'maxHealth') {
    maxHealth += 20;
    if (health > maxHealth) health = maxHealth;
  }
  // Grow threshold by 25% instead of 50%
  nextUpgradeScore = Math.round(nextUpgradeScore * 1.25);
  pendingUpgrade = false;
  gamePaused = false;
}

function fireBullet() {
  const now = Date.now();
  if (now - lastShot < shotDelay) return;
  lastShot = now;
  const dx = mousePos.x - player.x;
  const dy = mousePos.y - player.y;
  const dist = Math.hypot(dx, dy) || 1;
  const vx = (dx / dist) * bulletSpeed;
  const vy = (dy / dist) * bulletSpeed;
  bullets.push({ x: player.x, y: player.y, radius: 4, vx, vy });
}

function resolveEnemyCollisions() {
  for (let i = 0; i < enemies.length; i++) {
    for (let j = i + 1; j < enemies.length; j++) {
      const a = enemies[i];
      const b = enemies[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      const minDist = a.radius + b.radius;
      if (dist < minDist && dist > 0) {
        const overlap = minDist - dist;
        const nx = dx / dist;
        const ny = dy / dist;
        a.x -= nx * overlap / 2;
        a.y -= ny * overlap / 2;
        b.x += nx * overlap / 2;
        b.y += ny * overlap / 2;
        // keep within canvas bounds
        a.x = Math.max(a.radius, Math.min(canvas.width - a.radius, a.x));
        a.y = Math.max(a.radius, Math.min(canvas.height - a.radius, a.y));
        b.x = Math.max(b.radius, Math.min(canvas.width - b.radius, b.x));
        b.y = Math.max(b.radius, Math.min(canvas.height - b.radius, b.y));
      }
    }
  }
}

// ---------- Game Loop ----------
function update() {
  if (gameOver) return;
  if (isPaused) return;
  if (pendingUpgrade) { gamePaused = true; return; }

  // Player movement (WASD)
  if (keys['w']) player.y -= player.speed;
  if (keys['s']) player.y += player.speed;
  if (keys['a']) player.x -= player.speed;
  if (keys['d']) player.x += player.speed;
  player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
  player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));

  // Auto‑fire
  if (spaceHeld) fireBullet();

  // Spawn enemies according to dynamic interval
  spawnTimer += 16; // approx frame time
  if (spawnTimer >= getSpawnInterval()) {
    spawnTimer = 0;
    if (!gameOver && !pendingUpgrade) enemies.push(createEnemy());
  }

  // Upgrade trigger
  if (score >= nextUpgradeScore && !pendingUpgrade) pendingUpgrade = true;

  // Enemies chase player
  enemies.forEach(e => {
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 0) {
      e.x += (dx / dist) * e.speed;
      e.y += (dy / dist) * e.speed;
    }
    if (dist < player.radius + e.radius) health -= 0.5;
  });

  // Resolve enemy‑enemy collisions
  resolveEnemyCollisions();

  // Move bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.vx;
    b.y += b.vy;
    if (b.x < -b.radius || b.x > canvas.width + b.radius || b.y < -b.radius || b.y > canvas.height + b.radius) {
      bullets.splice(i, 1);
    }
  }

  // Bullet‑enemy collisions (fixed damage)
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      const dx = b.x - e.x;
      const dy = b.y - e.y;
      const dist = Math.hypot(dx, dy);
      if (dist < b.radius + e.radius) {
        e.health -= bulletDamage;
        bullets.splice(i, 1);
        if (e.health <= 0) {
          score += e.points;
          enemies.splice(j, 1);
        }
        break;
      }
    }
  }

  // Health regeneration
  if (healthRegen > 0) {
    health += healthRegen * (16 / 1000);
    if (health > maxHealth) health = maxHealth;
  }

  // Death check
  if (health <= 0) {
    health = 0;
    gameOver = true;
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Player
  ctx.fillStyle = '#0f0';
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fill();

  // Enemies
  enemies.forEach(e => {
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(e.health, e.x, e.y - e.radius - 4);
  });

  // Bullets
  ctx.fillStyle = '#ff0';
  bullets.forEach(b => { ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2); ctx.fill(); });

  // UI text
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Health: ' + Math.round(health) + '/' + maxHealth, 10, 20);
  ctx.fillText('Score: ' + score, 10, 40);
  ctx.fillText('Damage: ' + bulletDamage, 10, 60);
  ctx.fillText('Delay: ' + shotDelay + 'ms', 10, 80);
  ctx.fillText('Bullet Speed: ' + bulletSpeed, 10, 100);
  ctx.fillText('Regen: ' + healthRegen + '/s', 10, 120);
  ctx.fillText('Difficulty: ' + difficulty, 10, 140);

  // Difficulty buttons (draw)
  diffButtons.forEach(btn => {
    ctx.fillStyle = (difficulty === btn.value) ? '#555' : '#222';
    ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2);
  });

  // Upgrade overlay
  if (pendingUpgrade && !gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Choose Upgrade', canvas.width / 2, canvas.height / 2 - 100);
    ctx.font = '20px sans-serif';
    ctx.fillText('Press 1 for +Damage (+5)', canvas.width / 2, canvas.height / 2 - 60);
    ctx.fillText('Press 2 for -Delay (-20ms)', canvas.width / 2, canvas.height / 2 - 30);
    ctx.fillText('Press 3 for +Bullet Speed (+2)', canvas.width / 2, canvas.height / 2);
    ctx.fillText('Press 4 for +Regen (+2/s)', canvas.width / 2, canvas.height / 2 + 30);
    ctx.fillText('Press 5 for +Max Health (+20)', canvas.width / 2, canvas.height / 2 + 60);
    ctx.fillText('Next upgrade at: ' + nextUpgradeScore, canvas.width / 2, canvas.height / 2 + 100);
  }

  // Pause overlay
  if (isPaused && !pendingUpgrade) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Paused – Press Escape to resume', canvas.width / 2, canvas.height / 2);
  }

  // Game Over overlay
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f00';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
  }
}

// Upgrade key handling (1‑5)
window.addEventListener('keydown', e => {
  if (pendingUpgrade && !gameOver) {
    if (e.key === '1') applyUpgrade('damage');
    else if (e.key === '2') applyUpgrade('speed');
    else if (e.key === '3') applyUpgrade('fastBullet');
    else if (e.key === '4') applyUpgrade('regen');
    else if (e.key === '5') applyUpgrade('maxHealth');
  }
});

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();