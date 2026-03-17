const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let health = 100;
let score = 0;
let gameOver = false;
const player = { x: canvas.width/2, y: canvas.height/2, radius: 15, speed: 5 };

// Mouse tracking
let mousePos = { x: canvas.width/2, y: canvas.height/2 };
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mousePos.x = e.clientX - rect.left;
  mousePos.y = e.clientY - rect.top;
});

// Enemy factory
function createEnemy(type){
  const side = Math.floor(Math.random()*4);
  let x,y;
  const margin = 20;
  switch(side){
    case 0: x = -margin; y = Math.random()*canvas.height; break;
    case 1: x = canvas.width+margin; y = Math.random()*canvas.height; break;
    case 2: x = Math.random()*canvas.width; y = -margin; break;
    case 3: x = Math.random()*canvas.width; y = canvas.height+margin; break;
  }
  if(type==='zombie'){
    return {x, y, radius: 12, speed: 3, type:'zombie', points:10, color:'#f00'};
  } else { // runner
    return {x, y, radius: 8, speed: 4.5, type:'runner', points:20, color:'#0ff'};
  }
}

const enemies = [];
setInterval(()=>{if(!gameOver) enemies.push(createEnemy('zombie'));}, 2000);
setInterval(()=>{if(!gameOver) enemies.push(createEnemy('runner'));}, 5000);

// Bullets
const bullets = [];
const bulletSpeed = 7;
let lastShot = 0;
const shotDelay = 300; // ms
window.addEventListener('keydown', e => {
  if(e.code==='Space' && !gameOver){
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
});

// Input handling (WASD)
const keys = {};
window.addEventListener('keydown', e=>{ keys[e.key]=true; });
window.addEventListener('keyup', e=>{ keys[e.key]=false; });

function update(){
  if(gameOver) return;
  // player movement
  if(keys['w']) player.y -= player.speed;
  if(keys['s']) player.y += player.speed;
  if(keys['a']) player.x -= player.speed;
  if(keys['d']) player.x += player.speed;
  player.x = Math.max(player.radius, Math.min(canvas.width-player.radius, player.x));
  player.y = Math.max(player.radius, Math.min(canvas.height-player.radius, player.y));

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

  // bullet-enemy collisions
  for(let i=bullets.length-1;i>=0;i--){
    const b = bullets[i];
    for(let j=enemies.length-1;j>=0;j--){
      const e = enemies[j];
      const dx = b.x - e.x;
      const dy = b.y - e.y;
      const dist = Math.hypot(dx, dy);
      if(dist < b.radius + e.radius){
        score += e.points;
        enemies.splice(j,1);
        bullets.splice(i,1);
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
  });
  // bullets
  ctx.fillStyle = '#ff0';
  bullets.forEach(b=>{ ctx.beginPath(); ctx.arc(b.x,b.y,b.radius,0,Math.PI*2); ctx.fill(); });
  // UI
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText('Health: '+Math.round(health),10,20);
  ctx.fillText('Score: '+score,10,40);
  if(gameOver){
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#f00';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width/2, canvas.height/2);
  }
}

function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();