const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let health = 100;
let score = 0;
let gameOver = false;
let startTime = Date.now();
const player = { x: canvas.width/2, y: canvas.height/2, radius: 15, speed: 5 };

// Upgrade state
let bulletDamage = 15;      // base damage
let shotDelay = 300;        // ms between shots
let nextUpgradeScore = 50; // when to show next upgrade choice
let pendingUpgrade = false;
let gamePaused = false; // pause during upgrade

// Auto‑fire state
let spaceHeld = false;
let lastShot = 0;

// Mouse tracking
let mousePos = { x: canvas.width/2, y: canvas.height/2 };
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mousePos.x = e.clientX - rect.left;
  mousePos.y = e.clientY - rect.top;
});

// Enemy factory – zombies only, slower HP growth
function createEnemy(){
  const elapsed = (Date.now() - startTime) / 1000; // seconds
  const baseHealth = 20;
  const health = Math.floor(baseHealth + elapsed * 0.5); // +0.5 HP per second
  const side = Math.floor(Math.random()*4);
  let x,y;
  const margin = 20;
  switch(side){
    case 0: x = -margin; y = Math.random()*canvas.height; break;
    case 1: x = canvas.width+margin; y = Math.random()*canvas.height; break;
    case 2: x = Math.random()*canvas.width; y = -margin; break;
    case 3: x = Math.random()*canvas.width; y = canvas.height+margin; break;
  }
  return {x, y, radius: 12, speed: 3, type:'zombie', points:10, color:'#f00', health, maxHealth: health};
}

const enemies = [];
setInterval(()=>{ if(!gameOver && !pendingUpgrade) enemies.push(createEnemy()); }, 2000);

// Bullets
const bullets = [];
const bulletSpeed = 7;

window.addEventListener('keydown', e => {
  if(e.code==='Space' && !gameOver && !pendingUpgrade){
    spaceHeld = true;
  }
});
window.addEventListener('keyup', e => {
  if(e.code==='Space') spaceHeld = false;
});

// Input handling (WASD)
const keys = {};
window.addEventListener('keydown', e=>{ keys[e.key]=true; });
window.addEventListener('keyup', e=>{ keys[e.key]=false; });

function applyUpgrade(choice){
  if(choice === 'damage'){
    bulletDamage += 5;
  } else if(choice === 'speed'){
    shotDelay = Math.max(100, shotDelay - 20);
  }
  nextUpgradeScore += 50;
  pendingUpgrade = false;
  gamePaused = false;
}

function fireBullet(){
  const now = Date.now();
  if(now - lastShot < shotDelay) return;
  lastShot = now;
  const dx = mousePos.x - player.x;
  const dy = mousePos.y - player.y;
  const dist = Math.hypot(dx, dy) || 1;
  const vx = (dx/dist) * bulletSpeed;
  const vy = (dy/dist) * bulletSpeed;
  bullets.push({x: player.x, y: player.y, radius: 4, vx, vy});
}

function update(){
  if(gameOver) return;
  if(pendingUpgrade){
    gamePaused = true;
    return; // halt all movement while upgrade screen is shown
  }
  // player movement
  if(keys['w']) player.y -= player.speed;
  if(keys['s']) player.y += player.speed;
  if(keys['a']) player.x -= player.speed;
  if(keys['d']) player.x += player.speed;
  player.x = Math.max(player.radius, Math.min(canvas.width-player.radius, player.x));
  player.y = Math.max(player.radius, Math.min(canvas.height-player.radius, player.y));

  // auto‑fire handling
  if(spaceHeld) fireBullet();

  // check for upgrade trigger
  if(score >= nextUpgradeScore && !pendingUpgrade){
    pendingUpgrade = true;
  }

  // enemies chase player
  enemies.forEach(e=>{
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.hypot(dx, dy);
    if(dist>0){
      e.x += (dx/dist)*e.speed;
      e.y += (dy/dist)*e.speed;
    }
    if(dist < player.radius + e.radius){
      health -= 0.5;
    }
  });

  // bullets movement
  for(let i=bullets.length-1;i>=0;i--){
    const b = bullets[i];
    b.x += b.vx;
    b.y += b.vy;
    if(b.x < -b.radius || b.x > canvas.width + b.radius || b.y < -b.radius || b.y > canvas.height + b.radius){
      bullets.splice(i,1);
    }
  }

  // bullet‑enemy collisions (fixed damage)
  for(let i=bullets.length-1;i>=0;i--){
    const b = bullets[i];
    for(let j=enemies.length-1;j>=0;j--){
      const e = enemies[j];
      const dx = b.x - e.x;
      const dy = b.y - e.y;
      const dist = Math.hypot(dx, dy);
      if(dist < b.radius + e.radius){
        e.health -= bulletDamage;
        bullets.splice(i,1);
        if(e.health <= 0){
          score += e.points;
          enemies.splice(j,1);
        }
        break;
      }
    }
  }

  if(health <= 0){
    health = 0;
    gameOver = true;
  }
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // player
  ctx.fillStyle = '#0f0';
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius,0,Math.PI*2);
  ctx.fill();
  // enemies
  enemies.forEach(e=>{
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radius,0,Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(e.health, e.x, e.y - e.radius - 4);
  });
  // bullets
  ctx.fillStyle = '#ff0';
  bullets.forEach(b=>{ ctx.beginPath(); ctx.arc(b.x,b.y,b.radius,0,Math.PI*2); ctx.fill(); });
  // UI
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Health: '+Math.round(health),10,20);
  ctx.fillText('Score: '+score,10,40);
  ctx.fillText('Damage: '+bulletDamage,10,60);
  ctx.fillText('Delay: '+shotDelay+'ms',10,80);

  // upgrade overlay (pauses game)
  if(pendingUpgrade && !gameOver){
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Choose Upgrade', canvas.width/2, canvas.height/2 - 60);
    ctx.font = '20px sans-serif';
    ctx.fillText('Press 1 for +Damage (+5)', canvas.width/2, canvas.height/2 - 20);
    ctx.fillText('Press 2 for -Delay (-20ms)', canvas.width/2, canvas.height/2 + 20);
    ctx.fillText('Current: Damage '+bulletDamage+', Delay '+shotDelay+'ms', canvas.width/2, canvas.height/2 + 60);
  }

  if(gameOver){
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#f00';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width/2, canvas.height/2);
  }
}

// listen for upgrade choice keys (1 and 2)
window.addEventListener('keydown', e=>{
  if(pendingUpgrade && !gameOver){
    if(e.key === '1'){
      applyUpgrade('damage');
    } else if(e.key === '2'){
      applyUpgrade('speed');
    }
  }
});

function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();