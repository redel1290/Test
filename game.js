const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let isMobile = /Mobi|Android/i.test(navigator.userAgent);

// Джойстик
const joystickContainer = document.getElementById('joystickContainer');
const joystickStick = document.getElementById('joystickStick');
let joystickX = 0, joystickY = 0;
if(isMobile) joystickContainer.style.display = 'block';

let keys = {};
window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

// Гравець
const player = {
    x: canvas.width/2,
    y: canvas.height/2,
    radius: 15,
    speed: 3,
    color: 'cyan',
    hp: 100,
    bullets: [],
    cooldown: 0
};

// Вороги
const enemies = [];

// Стрільба
function shootBullet(targetX, targetY){
    if(player.cooldown <= 0){
        const angle = Math.atan2(targetY - player.y, targetX - player.x);
        player.bullets.push({
            x: player.x,
            y: player.y,
            dx: Math.cos(angle)*7,
            dy: Math.sin(angle)*7,
            radius: 5
        });
        player.cooldown = 15;
    }
}

// Рух гравця
let moveDir = {x:0,y:0};
function movePlayer(){
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

    // Обмеження на канвасі
    if(player.x < player.radius) player.x = player.radius;
    if(player.x > canvas.width - player.radius) player.x = canvas.width - player.radius;
    if(player.y < player.radius) player.y = player.radius;
    if(player.y > canvas.height - player.radius) player.y = canvas.height - player.radius;
}

// Рух ворогів
function moveEnemies(){
    enemies.forEach(e => {
        const angle = Math.atan2(player.y - e.y, player.x - e.x);
        e.x += Math.cos(angle) * e.speed;
        e.y += Math.sin(angle) * e.speed;

        // Шкода при дотику
        const dist = Math.hypot(player.x - e.x, player.y - e.y);
        if(dist < player.radius + e.radius){
            player.hp -= 0.5; // шкода на кадр
        }
    });
}

// Оновлення куль
function updateBullets(){
    player.bullets = player.bullets.filter(b => {
        b.x += b.dx;
        b.y += b.dy;

        if(b.x<0||b.x>canvas.width||b.y<0||b.y>canvas.height) return false;

        for(let i=enemies.length-1;i>=0;i--){
            const e = enemies[i];
            const dist = Math.hypot(b.x - e.x, b.y - e.y);
            if(dist < b.radius + e.radius){
                enemies.splice(i,1);
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
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI*2);
    ctx.fill();

    // HP
    ctx.fillStyle = 'red';
    ctx.fillRect(20,20, player.hp*2, 20);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(20,20,200,20);

    // Кулі
    ctx.fillStyle = 'yellow';
    player.bullets.forEach(b=>{
        ctx.beginPath();
        ctx.arc(b.x,b.y,b.radius,0,Math.PI*2);
        ctx.fill();
    });

    // Вороги
    enemies.forEach(e=>{
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(e.x,e.y,e.radius,0,Math.PI*2);
        ctx.fill();
    });
}

// Основний цикл
function gameLoop(){
    movePlayer();
    moveEnemies();
    updateBullets();
    draw();
    if(player.cooldown>0) player.cooldown--;
    requestAnimationFrame(gameLoop);
}

// Спавн ворогів
function spawnEnemy(){
    const side = Math.floor(Math.random()*4);
    let x,y;
    switch(side){
        case 0: x=0; y=Math.random()*canvas.height; break;
        case 1: x=canvas.width; y=Math.random()*canvas.height; break;
        case 2: x=Math.random()*canvas.width; y=0; break;
        case 3: x=Math.random()*canvas.width; y=canvas.height; break;
    }
    enemies.push({x,y,radius:15,speed:1.5,color:'red'});
}
setInterval(spawnEnemy,2000);

// Стрільба мишкою
canvas.addEventListener('mousedown', e=>{
    const rect = canvas.getBoundingClientRect();
    shootBullet(e.clientX - rect.left, e.clientY - rect.top);
});

// Джойстик для мобільних
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
            moveDir.x = 0; moveDir.y = 0;
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

// Клік на екрані для стрільби на мобільних
canvas.addEventListener('touchstart', e=>{
    if(!isMobile) return;
    for(let t of e.changedTouches){
        const rect = canvas.getBoundingClientRect();
        shootBullet(t.clientX - rect.left, t.clientY - rect.top);
    }
});

gameLoop();
