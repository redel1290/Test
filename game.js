const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let isMobile = /Mobi|Android/i.test(navigator.userAgent);

// Меню
const menu = document.getElementById('menu');
const startBtn = document.getElementById('startBtn');
const settingsBtn = document.getElementById('settingsBtn');
const settingsPanel = document.getElementById('settingsPanel');
const backBtn = document.getElementById('backBtn');
const volumeSlider = document.getElementById('volume');

// Пауза
const pausePanel = document.getElementById('pausePanel');
const resumeBtn = document.getElementById('resumeBtn');
let paused = false;

// Джойстик
const joystickContainer = document.getElementById('joystickContainer');
const joystickStick = document.getElementById('joystickStick');
let joystickX=0, joystickY=0;
if(isMobile) joystickContainer.style.display='block';

let keys = {};
window.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    if(e.key==='Escape') togglePause();
});
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

// Гравець
const player = {
    x: canvas.width/2,
    y: canvas.height/2,
    radius: 15,
    speed: 3,
    color: 'cyan',
    hp: 100,
    maxHp: 100,
    bullets: [],
    cooldown: 0,
};

// Вороги
const enemies = [];
let score = 0;
let highScore = 0;
let wave = 1;

// Спавн ворогів
function spawnEnemy() {
    const side = Math.floor(Math.random()*4);
    let x,y;
    switch(side){
        case 0: x=0; y=Math.random()*canvas.height; break;
        case 1: x=canvas.width; y=Math.random()*canvas.height; break;
        case 2: x=Math.random()*canvas.width; y=0; break;
        case 3: x=Math.random()*canvas.width; y=canvas.height; break;
    }
    enemies.push({x,y,radius:15,speed:1.5 + wave*0.1,color:'red',hp:20 + wave*5});
}
let spawnInterval;

// Стрільба
function shootBullet(targetX,targetY){
    if(player.cooldown<=0){
        const angle = Math.atan2(targetY-player.y,targetX-player.x);
        player.bullets.push({
            x: player.x,
            y: player.y,
            dx: Math.cos(angle)*7,
            dy: Math.sin(angle)*7,
            radius:5
        });
        player.cooldown=15;
    }
}

// Рух гравця
let moveDir = {x:0,y:0};
function movePlayer(){
    if(paused) return;
    let dx=0, dy=0;
    if(!isMobile){
        if(keys['w']) dy -= player.speed;
        if(keys['s']) dy += player.speed;
        if(keys['a']) dx -= player.speed;
        if(keys['d']) dx += player.speed;
    } else {
        dx = moveDir.x * player.speed;
        dy = moveDir.y * player.speed;
    }
    player.x += dx;
    player.y += dy;
    if(player.x<player.radius) player.x=player.radius;
    if(player.x>canvas.width-player.radius) player.x=canvas.width-player.radius;
    if(player.y<player.radius) player.y=player.radius;
    if(player.y>canvas.height-player.radius) player.y=canvas.height-player.radius;
}

// Рух ворогів
function moveEnemies(){
    if(paused) return;
    enemies.forEach(e=>{
        const angle = Math.atan2(player.y - e.y, player.x - e.x);
        e.x += Math.cos(angle)*e.speed;
        e.y += Math.sin(angle)*e.speed;

        // шкода при контакті
        const dist = Math.hypot(player.x - e.x, player.y - e.y);
        if(dist < player.radius + e.radius){
            player.hp -= 0.3; // по кадру
        }
    });
}

// Оновлення куль
function updateBullets(){
    player.bullets = player.bullets.filter(b=>{
        if(paused) return true;
        b.x += b.dx;
        b.y += b.dy;
        if(b.x<0||b.x>canvas.width||b.y<0||b.y>canvas.height) return false;

        for(let i=enemies.length-1;i>=0;i--){
            const e = enemies[i];
            const dist = Math.hypot(b.x - e.x, b.y - e.y);
            if(dist< b.radius + e.radius){
                e.hp -= 10;
                if(e.hp<=0){
                    enemies.splice(i,1);
                    score+=10;
                }
                return false;
            }
        }
        return true;
    });
}

// Малювання
function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // Гравець
    ctx.fillStyle=player.color;
    ctx.beginPath();
    ctx.arc(player.x,player.y,player.radius,0,Math.PI*2);
    ctx.fill();

    // HP
    ctx.fillStyle='red';
    ctx.fillRect(20,20, (player.hp/player.maxHp)*200,20);
    ctx.strokeStyle='#fff';
    ctx.strokeRect(20,20,200,20);

    // Score
    ctx.fillStyle='white';
    ctx.fillText('Score: '+score, 20, 60);
    ctx.fillText('HighScore: '+highScore, 20, 80);
    ctx.fillText('Wave: '+wave, 20, 100);

    // Кулі
    ctx.fillStyle='yellow';
    player.bullets.forEach(b=>{
        ctx.beginPath();
        ctx.arc(b.x,b.y,b.radius,0,Math.PI*2);
        ctx.fill();
    });

    // Вороги
    enemies.forEach(e=>{
        ctx.fillStyle=e.color;
        ctx.beginPath();
        ctx.arc(e.x,e.y,e.radius,0,Math.PI*2);
        ctx.fill();
    });
}

// Основний цикл
function gameLoop(){
    if(!paused){
        movePlayer();
        moveEnemies();
        updateBullets();
        draw();
        if(player.cooldown>0) player.cooldown--;
    }
    if(player.hp<=0){
        paused=true;
        if(score>highScore) highScore=score;
        alert('Гру закінчено! Score: '+score);
        resetGame();
    }
    requestAnimationFrame(gameLoop);
}

// Джойстик мобільний
let touchId = null;
joystickContainer.addEventListener('touchstart', e=>{
    e.preventDefault();
    const touch = e.changedTouches[0];
    touchId = touch.identifier;
    updateJoystick(touch);
});
joystickContainer.addEventListener('touchmove', e=>{
    e.preventDefault();
    for(let t of e.changedTouches){
        if(t.identifier===touchId) updateJoystick(t);
    }
});
joystickContainer.addEventListener('touchend', e=>{
    e.preventDefault();
    for(let t of e.changedTouches){
        if(t.identifier===touchId){
            touchId = null;
            joystickStick.style.transform='translate(0px,0px)';
            moveDir.x=0; moveDir.y=0;
        }
    }
});
function updateJoystick(touch){
    const rect = joystickContainer.getBoundingClientRect();
    const x = touch.clientX - rect.left - rect.width/2;
    const y = touch.clientY - rect.top - rect.height/2;
    const dist = Math.hypot(x,y);
    const maxDist = rect.width/2;
    const dx = (dist>maxDist ? x/dist*maxDist : x);
    const dy = (dist>maxDist ? y/dist*maxDist : y);
    joystickStick.style.transform = `translate(${dx}px,${dy}px)`;
    moveDir.x = dx/maxDist;
    moveDir.y = dy/maxDist;
}

// Стрілянина мобільна
canvas.addEventListener('touchstart', e=>{
    if(!isMobile) return;
    for(let t of e.changedTouches){
        const rect = canvas.getBoundingClientRect();
        shootBullet(t.clientX-rect.left,t.clientY-rect.top);
    }
});

// Меню кнопки
startBtn.addEventListener('click', ()=>{
    menu.style.display='none';
    paused=false;
    spawnInterval = setInterval(spawnEnemy, Math.max(1000, 3000-wave*100));
});
settingsBtn.addEventListener('click', ()=>{
    settingsPanel.style.display='block';
});
backBtn.addEventListener('click', ()=>{
    settingsPanel.style.display='none';
});
resumeBtn.addEventListener('click', ()=>{
    togglePause();
});

// Пауза
function togglePause(){
    paused = !paused;
    pausePanel.style.display = paused ? 'block':'none';
}

// Рестарт
function resetGame(){
    enemies.length=0;
    player.hp=player.maxHp;
    player.x=canvas.width/2;
    player.y=canvas.height/2;
    player.bullets.length=0;
    score=0;
    wave=1;
    paused=false;
}

gameLoop();

