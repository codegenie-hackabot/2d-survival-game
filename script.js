const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let health = 100;
const player = { x: canvas.width/2, y: canvas.height/2, radius: 15, speed: 5 };

// Mouse tracking
let mousePos = { x: canvas.width/2, y: canvas.height/2 };
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mousePos.x = e.clientX - rect.left;
  mousePos.y = e.clientY - rect.top;
});

// Zombies
const zombies = [];
const zombieSpawnInterval = 2000; // ms
function spawnZombie(){
  const side = Math.floor(Math.random()*4);
  let x,y;
  const margin = 20;
  switch(side){
    case 0: x = -margin; y = Math.random()*canvas.height; break;
    case 1: x = canvas.width+margin; y = Math.random()*canvas.height; break;
    case 2: x = Math.random()*canvas.width; y = -margin; break;
    case 3: x = Math.random()*canvas.width; y = canvas.height+margin; break;
  }
  zombies.push({x, y, radius: 12, speed: 3});
}
setInterval(spawnZombie, zombieSpawnInterval);

// Bullets
const bullets = [];
const bulletSpeed = 7;
let lastShot = 0;
const shotDelay = 300; // ms between shots
window.addEventListener('keydown', e => {
  if(e.code==='Space'){
    const now = Date.now();
    if(now - lastShot < shotDelay) return; // enforce delay
    lastShot = now;
    const dx = mousePos.x - player.x;
    const dy = mousePos.y - player.y;
    const dist = Math.hypot(dx, dy) || 1;
    const vx = (dx/dist) * bulletSpeed;
    const vy = (dy/dist) * bulletSpeed;
    bullets.push({x: player.x, y: player.y, radius: 4, vx, vy});
  }
});

// Input handling (WASD)
const keys = {};
window.addEventListener('keydown', e=>{ keys[e.key]=true; });
window.addEventListener('keyup', e=>{ keys[e.key]=false; });

function update(){
  // player movement
  if(keys['w']) player.y -= player.speed;
  if(keys['s']) player.y += player.speed;
  if(keys['a']) player.x -= player.speed;
  if(keys['d']) player.x += player.speed;
  player.x = Math.max(player.radius, Math.min(canvas.width-player.radius, player.x));
  player.y = Math.max(player.radius, Math.min(canvas.height-player.radius, player.y));

  // zombies chase player
  zombies.forEach(z=>{
    const dx = player.x - z.x;
    const dy = player.y - z.y;
    const dist = Math.hypot(dx, dy);
    if(dist>0){
      z.x += (dx/dist)*z.speed;
      z.y += (dy/dist)*z.speed;
    }
    if(dist < player.radius + z.radius){
      health -= 0.5;
    }
  });

  // update bullets
  for(let i=bullets.length-1;i>=0;i--){
    const b = bullets[i];
    b.x += b.vx;
    b.y += b.vy;
    if(b.x < -b.radius || b.x > canvas.width + b.radius || b.y < -b.radius || b.y > canvas.height + b.radius){
      bullets.splice(i,1);
    }
  }

  // bullet‑zombie collisions
  for(let i=bullets.length-1;i>=0;i--){
    const b = bullets[i];
    for(let j=zombies.length-1;j>=0;j--){
      const z = zombies[j];
      const dx = b.x - z.x;
      const dy = b.y - z.y;
      const dist = Math.hypot(dx, dy);
      if(dist < b.radius + z.radius){
        zombies.splice(j,1);
        bullets.splice(i,1);
        break;
      }
    }
  }

  if(health<0) health = 0;
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // player
  ctx.fillStyle = '#0f0';
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius,0,Math.PI*2);
  ctx.fill();
  // zombies
  ctx.fillStyle = '#f00';
  zombies.forEach(z=>{ ctx.beginPath(); ctx.arc(z.x,z.y,z.radius,0,Math.PI*2); ctx.fill(); });
  // bullets
  ctx.fillStyle = '#ff0';
  bullets.forEach(b=>{ ctx.beginPath(); ctx.arc(b.x,b.y,b.radius,0,Math.PI*2); ctx.fill(); });
  // health UI
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText('Health: '+Math.round(health),10,20);
}

function loop(){ update(); draw(); requestAnimationFrame(loop); }
loop();