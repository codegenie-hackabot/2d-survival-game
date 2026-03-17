const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let health = 100;
const player = { x: canvas.width/2, y: canvas.height/2, radius: 15, speed: 5 };

// Zombies array
const zombies = [];
const zombieSpawnInterval = 2000; // ms
function spawnZombie(){
  const side = Math.floor(Math.random()*4);
  let x,y;
  const margin = 20;
  switch(side){
    case 0: x = -margin; y = Math.random()*canvas.height; break; // left
    case 1: x = canvas.width+margin; y = Math.random()*canvas.height; break; // right
    case 2: x = Math.random()*canvas.width; y = -margin; break; // top
    case 3: x = Math.random()*canvas.width; y = canvas.height+margin; break; // bottom
  }
  zombies.push({x, y, radius: 12, speed: 1.5});
}
setInterval(spawnZombie, zombieSpawnInterval);

// Input handling (WASD)
const keys = {};
window.addEventListener('keydown', e=>{keys[e.key]=true;});
window.addEventListener('keyup', e=>{keys[e.key]=false;});

function update(){
  // player movement
  if(keys['w']) player.y -= player.speed;
  if(keys['s']) player.y += player.speed;
  if(keys['a']) player.x -= player.speed;
  if(keys['d']) player.x += player.speed;
  player.x = Math.max(player.radius, Math.min(canvas.width-player.radius, player.x));
  player.y = Math.max(player.radius, Math.min(canvas.height-player.radius, player.y));

  // zombies move toward player
  zombies.forEach(z=>{
    const dx = player.x - z.x;
    const dy = player.y - z.y;
    const dist = Math.hypot(dx, dy);
    if(dist>0){
      z.x += (dx/dist)*z.speed;
      z.y += (dy/dist)*z.speed;
    }
    // collision
    if(dist < player.radius + z.radius){
      health -= 0.5; // damage per frame
    }
  });
  // remove off‑screen zombies (optional)
  // keep health non‑negative
  if(health<0) health = 0;
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // draw player
  ctx.fillStyle = '#0f0';
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius,0,Math.PI*2);
  ctx.fill();
  // draw zombies
  ctx.fillStyle = '#f00';
  zombies.forEach(z=>{
    ctx.beginPath();
    ctx.arc(z.x, z.y, z.radius,0,Math.PI*2);
    ctx.fill();
  });
  // draw health bar
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText('Health: '+Math.round(health),10,20);
}

function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();