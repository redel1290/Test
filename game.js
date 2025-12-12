// Game Constants
const GAME_WIDTH = 1000;
const GAME_HEIGHT = 700;
const PLAYER_SPEED = 5;
const PLAYER_SIZE = 20;
const PLAYER_MAX_HP = 100;
const PLAYER_COLOR = "#4a9fff";
const PLAYER_SHOOT_COOLDOWN = 300; // milliseconds

// Enemy Types
const ENEMY_TYPES = {
    BASIC: { color: "#ff6666", size: 16, speed: 2, hp: 30, damage: 10, score: 10 },
    FAST: { color: "#ffaa44", size: 14, speed: 3.5, hp: 20, damage: 5, score: 15 },
    TANK: { color: "#aa66ff", size: 24, speed: 1.2, hp: 100, damage: 20, score: 30 },
    BOSS: { color: "#ff44aa", size: 40, speed: 0.8, hp: 300, damage: 30, score: 100 }
};

// Bullet Constants
const BULLET_SPEED = 10;
const BULLET_SIZE = 6;
const BULLET_COLOR = "#ffff66";
const BULLET_DAMAGE = 25;

// Game Variables
let canvas, ctx;
let gameState = "menu"; // menu, playing, paused, gameOver
let gameTime = 0;
let currentWave = 1;
let score = 0;
let highScore = localStorage.getItem("survivalShooterHighScore") || 0;
let player = {};
let enemies = [];
let bullets = [];
let keys = {};
let mouse = { x: 0, y: 0, down: false };
let touch = { x: 0, y: 0, down: false };
let joystick = { x: 0, y: 0, active: false };
let lastShootTime = 0;
let spawnTimer = 0;
let enemiesToSpawn = 0;
let enemySpawnDelay = 1000; // milliseconds

// Settings
let settings = {
    volume: 70,
    graphics: "medium",
    sensitivity: 5,
    mobileControls: "joystick"
};

// DOM Elements
let mainMenu, settingsMenu, pauseMenu, gameOverMenu;
let startButton, settingsButton, resumeButton, restartButton;
let mainMenuButton, playAgainButton, gameOverMainMenu;
let backButton, saveSettings;
let healthBar, healthText, waveCounter, scoreCounter, highScoreCounter;
let finalWave, finalScore, finalHighScore;
let volumeSlider, volumeValue, graphicsSelect, sensitivitySlider, sensitivityValue, mobileControlsSelect;
let mobileJoystick, joystickBase, joystickHandle, pauseButton;

// Initialize Game
function init() {
    // Get DOM Elements
    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext("2d");
    
    // Set canvas size
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    
    // Get menu elements
    mainMenu = document.getElementById("mainMenu");
    settingsMenu = document.getElementById("settingsMenu");
    pauseMenu = document.getElementById("pauseMenu");
    gameOverMenu = document.getElementById("gameOverMenu");
    
    // Get buttons
    startButton = document.getElementById("startButton");
    settingsButton = document.getElementById("settingsButton");
    resumeButton = document.getElementById("resumeButton");
    restartButton = document.getElementById("restartButton");
    mainMenuButton = document.getElementById("mainMenuButton");
    playAgainButton = document.getElementById("playAgainButton");
    gameOverMainMenu = document.getElementById("gameOverMainMenu");
    backButton = document.getElementById("backButton");
    saveSettings = document.getElementById("saveSettings");
    
    // Get UI elements
    healthBar = document.getElementById("healthBar");
    healthText = document.getElementById("healthText");
    waveCounter = document.getElementById("waveCounter");
    scoreCounter = document.getElementById("scoreCounter");
    highScoreCounter = document.getElementById("highScoreCounter");
    
    // Get final score elements
    finalWave = document.getElementById("finalWave");
    finalScore = document.getElementById("finalScore");
    finalHighScore = document.getElementById("finalHighScore");
    
    // Get settings elements
    volumeSlider = document.getElementById("volume");
    volumeValue = document.getElementById("volumeValue");
    graphicsSelect = document.getElementById("graphics");
    sensitivitySlider = document.getElementById("sensitivity");
    sensitivityValue = document.getElementById("sensitivityValue");
    mobileControlsSelect = document.getElementById("mobileControls");
    
    // Get mobile controls
    mobileJoystick = document.getElementById("mobileJoystick");
    joystickBase = document.getElementById("joystickBase");
    joystickHandle = document.getElementById("joystickHandle");
    pauseButton = document.getElementById("pauseButton");
    
    // Load saved settings
    loadSettings();
    
    // Event Listeners
    startButton.addEventListener("click", startGame);
    settingsButton.addEventListener("click", () => showMenu("settings"));
    resumeButton.addEventListener("click", resumeGame);
    restartButton.addEventListener("click", restartGame);
    mainMenuButton.addEventListener("click", () => showMenu("main"));
    playAgainButton.addEventListener("click", restartGame);
    gameOverMainMenu.addEventListener("click", () => showMenu("main"));
    backButton.addEventListener("click", () => showMenu("main"));
    saveSettings.addEventListener("click", saveSettingsFunc);
    
    // Settings event listeners
    volumeSlider.addEventListener("input", () => {
        volumeValue.textContent = volumeSlider.value + "%";
    });
    
    sensitivitySlider.addEventListener("input", () => {
        sensitivityValue.textContent = sensitivitySlider.value;
    });
    
    // Pause button
    pauseButton.addEventListener("click", pauseGame);
    
    // Keyboard events
    window.addEventListener("keydown", (e) => {
        keys[e.key.toLowerCase()] = true;
        
        // Escape key to pause/resume
        if (e.key === "Escape") {
            if (gameState === "playing") {
                pauseGame();
            } else if (gameState === "paused") {
                resumeGame();
            }
        }
    });
    
    window.addEventListener("keyup", (e) => {
        keys[e.key.toLowerCase()] = false;
    });
    
    // Mouse events
    canvas.addEventListener("mousemove", (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = (e.clientX - rect.left) * (GAME_WIDTH / rect.width);
        mouse.y = (e.clientY - rect.top) * (GAME_HEIGHT / rect.height);
    });
    
    canvas.addEventListener("mousedown", () => {
        mouse.down = true;
    });
    
    canvas.addEventListener("mouseup", () => {
        mouse.down = false;
    });
    
    // Touch events for mobile
    canvas.addEventListener("touchstart", (e) => {
        e.preventDefault();
        touch.down = true;
        const rect = canvas.getBoundingClientRect();
        const touchPos = e.touches[0];
        touch.x = (touchPos.clientX - rect.left) * (GAME_WIDTH / rect.width);
        touch.y = (touchPos.clientY - rect.top) * (GAME_HEIGHT / rect.height);
        
        // Shoot on touch
        if (gameState === "playing") {
            shoot();
        }
    });
    
    canvas.addEventListener("touchmove", (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touchPos = e.touches[0];
        touch.x = (touchPos.clientX - rect.left) * (GAME_WIDTH / rect.width);
        touch.y = (touchPos.clientY - rect.top) * (GAME_HEIGHT / rect.height);
    });
    
    canvas.addEventListener("touchend", (e) => {
        e.preventDefault();
        touch.down = false;
    });
    
    // Mobile joystick events
    setupJoystick();
    
    // Start game loop
    requestAnimationFrame(gameLoop);
}

// Setup mobile joystick
function setupJoystick() {
    let joystickStartX = 0, joystickStartY = 0;
    let joystickRadius = 60;
    
    // Touch events for joystick
    joystickBase.addEventListener("touchstart", (e) => {
        e.preventDefault();
        joystick.active = true;
        
        const rect = joystickBase.getBoundingClientRect();
        joystickStartX = rect.left + rect.width / 2;
        joystickStartY = rect.top + rect.height / 2;
    });
    
    document.addEventListener("touchmove", (e) => {
        if (!joystick.active) return;
        
        e.preventDefault();
        const touchPos = e.touches[0];
        let deltaX = touchPos.clientX - joystickStartX;
        let deltaY = touchPos.clientY - joystickStartY;
        
        // Limit joystick movement to base radius
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        if (distance > joystickRadius) {
            deltaX = (deltaX / distance) * joystickRadius;
            deltaY = (deltaY / distance) * joystickRadius;
        }
        
        // Update joystick position
        joystick.x = deltaX / joystickRadius;
        joystick.y = deltaY / joystickRadius;
        
        // Update joystick handle position
        joystickHandle.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;
    });
    
    document.addEventListener("touchend", (e) => {
        if (!joystick.active) return;
        
        joystick.active = false;
        joystick.x = 0;
        joystick.y = 0;
        joystickHandle.style.transform = "translate(-50%, -50%)";
    });
}

// Resize canvas to fit screen
function resizeCanvas() {
    const container = document.getElementById("gameContainer");
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // Calculate scale to maintain aspect ratio
    const scaleX = containerWidth / GAME_WIDTH;
    const scaleY = containerHeight / GAME_HEIGHT;
    const scale = Math.min(scaleX, scaleY);
    
    // Set canvas size
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
    canvas.style.width = GAME_WIDTH * scale + "px";
    canvas.style.height = GAME_HEIGHT * scale + "px";
}

// Show specific menu
function showMenu(menu) {
    mainMenu.classList.remove("active");
    settingsMenu.classList.remove("active");
    pauseMenu.classList.remove("active");
    gameOverMenu.classList.remove("active");
    
    switch (menu) {
        case "main":
            mainMenu.classList.add("active");
            gameState = "menu";
            break;
        case "settings":
            settingsMenu.classList.add("active");
            break;
        case "paused":
            pauseMenu.classList.add("active");
            gameState = "paused";
            break;
        case "gameOver":
            gameOverMenu.classList.add("active");
            gameState = "gameOver";
            
            // Update final scores
            finalWave.textContent = currentWave;
            finalScore.textContent = score;
            finalHighScore.textContent = highScore;
            break;
    }
}

// Load settings from localStorage
function loadSettings() {
    const savedSettings = localStorage.getItem("survivalShooterSettings");
    if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        settings = { ...settings, ...parsed };
    }
    
    // Apply loaded settings
    volumeSlider.value = settings.volume;
    volumeValue.textContent = settings.volume + "%";
    graphicsSelect.value = settings.graphics;
    sensitivitySlider.value = settings.sensitivity;
    sensitivityValue.textContent = settings.sensitivity;
    mobileControlsSelect.value = settings.mobileControls;
    
    // Show/hide mobile controls based on device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    mobileJoystick.style.display = isMobile && settings.mobileControls === "joystick" ? "block" : "none";
}

// Save settings to localStorage
function saveSettingsFunc() {
    settings.volume = parseInt(volumeSlider.value);
    settings.graphics = graphicsSelect.value;
    settings.sensitivity = parseInt(sensitivitySlider.value);
    settings.mobileControls = mobileControlsSelect.value;
    
    localStorage.setItem("survivalShooterSettings", JSON.stringify(settings));
    
    // Apply settings
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    mobileJoystick.style.display = isMobile && settings.mobileControls === "joystick" ? "block" : "none";
    
    showMenu("main");
}

// Start new game
function startGame() {
    // Reset game state
    gameState = "playing";
    gameTime = 0;
    currentWave = 1;
    score = 0;
    
    // Reset player
    player = {
        x: GAME_WIDTH / 2,
        y: GAME_HEIGHT / 2,
        size: PLAYER_SIZE,
        speed: PLAYER_SPEED,
        hp: PLAYER_MAX_HP,
        maxHp: PLAYER_MAX_HP,
        color: PLAYER_COLOR
    };
    
    // Clear arrays
    enemies = [];
    bullets = [];
    
    // Reset spawn variables
    spawnTimer = 0;
    enemiesToSpawn = calculateEnemiesForWave(currentWave);
    
    // Hide menus
    mainMenu.classList.remove("active");
    
    // Update UI
    updateUI();
}

// Pause game
function pauseGame() {
    if (gameState === "playing") {
        showMenu("paused");
    }
}

// Resume game
function resumeGame() {
    if (gameState === "paused") {
        gameState = "playing";
        pauseMenu.classList.remove("active");
    }
}

// Restart game
function restartGame() {
    showMenu("main");
    setTimeout(startGame, 100);
}

// Calculate how many enemies to spawn for a wave
function calculateEnemiesForWave(wave) {
    return Math.floor(5 + wave * 1.5);
}

// Spawn an enemy
function spawnEnemy() {
    let type;
    const rand = Math.random();
    
    if (wave >= 10 && rand < 0.05) {
        type = ENEMY_TYPES.BOSS; // 5% chance for boss after wave 10
    } else if (wave >= 7 && rand < 0.15) {
        type = ENEMY_TYPES.TANK; // 15% chance for tank after wave 7
    } else if (wave >= 4 && rand < 0.3) {
        type = ENEMY_TYPES.FAST; // 30% chance for fast after wave 4
    } else {
        type = ENEMY_TYPES.BASIC; // Basic enemy otherwise
    }
    
    // Spawn from edges
    let x, y;
    if (Math.random() < 0.5) {
        // Spawn on left or right edge
        x = Math.random() < 0.5 ? -type.size : GAME_WIDTH + type.size;
        y = Math.random() * GAME_HEIGHT;
    } else {
        // Spawn on top or bottom edge
        x = Math.random() * GAME_WIDTH;
        y = Math.random() < 0.5 ? -type.size : GAME_HEIGHT + type.size;
    }
    
    enemies.push({
        x: x,
        y: y,
        size: type.size,
        speed: type.speed,
        hp: type.hp,
        maxHp: type.hp,
        damage: type.damage,
        color: type.color,
        score: type.score,
        type: Object.keys(ENEMY_TYPES).find(key => ENEMY_TYPES[key] === type)
    });
}

// Shoot a bullet
function shoot() {
    const currentTime = Date.now();
    if (currentTime - lastShootTime < PLAYER_SHOOT_COOLDOWN) return;
    
    lastShootTime = currentTime;
    
    // Calculate direction towards mouse or touch
    let targetX, targetY;
    if (touch.down) {
        targetX = touch.x;
        targetY = touch.y;
    } else {
        targetX = mouse.x;
        targetY = mouse.y;
    }
    
    // Calculate angle
    const angle = Math.atan2(targetY - player.y, targetX - player.x);
    
    // Create bullet
    bullets.push({
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * BULLET_SPEED,
        vy: Math.sin(angle) * BULLET_SPEED,
        size: BULLET_SIZE,
        damage: BULLET_DAMAGE,
        color: BULLET_COLOR
    });
}

// Update game state
function update(deltaTime) {
    if (gameState !== "playing") return;
    
    gameTime += deltaTime;
    
    // Update player movement
    updatePlayer(deltaTime);
    
    // Update bullets
    updateBullets(deltaTime);
    
    // Update enemies
    updateEnemies(deltaTime);
    
    // Spawn enemies
    updateSpawner(deltaTime);
    
    // Check collisions
    checkCollisions();
    
    // Check if wave is complete
    if (enemies.length === 0 && enemiesToSpawn === 0) {
        currentWave++;
        enemiesToSpawn = calculateEnemiesForWave(currentWave);
        spawnTimer = 0; // Reset spawn timer for new wave
        
        // Heal player a bit between waves
        player.hp = Math.min(player.maxHp, player.hp + 20);
    }
    
    // Update UI
    updateUI();
    
    // Check game over
    if (player.hp <= 0) {
        gameOver();
    }
}

// Update player movement
function updatePlayer(deltaTime) {
    let moveX = 0, moveY = 0;
    
    // Keyboard controls (WASD)
    if (keys["w"] || keys["arrowup"]) moveY -= 1;
    if (keys["s"] || keys["arrowdown"]) moveY += 1;
    if (keys["a"] || keys["arrowleft"]) moveX -= 1;
    if (keys["d"] || keys["arrowright"]) moveX += 1;
    
    // Mobile joystick controls
    if (joystick.active) {
        moveX += joystick.x;
        moveY += joystick.y;
    }
    
    // Normalize diagonal movement
    if (moveX !== 0 && moveY !== 0) {
        const length = Math.sqrt(moveX * moveX + moveY * moveY);
        moveX /= length;
        moveY /= length;
    }
    
    // Apply movement
    player.x += moveX * player.speed;
    player.y += moveY * player.speed;
    
    // Keep player in bounds
    player.x = Math.max(player.size, Math.min(GAME_WIDTH - player.size, player.x));
    player.y = Math.max(player.size, Math.min(GAME_HEIGHT - player.size, player.y));
    
    // Shooting with mouse
    if (mouse.down) {
        shoot();
    }
}

// Update bullets
function updateBullets(deltaTime) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        
        // Move bullet
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        
        // Remove if out of bounds
        if (bullet.x < -bullet.size || bullet.x > GAME_WIDTH + bullet.size ||
            bullet.y < -bullet.size || bullet.y > GAME_HEIGHT + bullet.size) {
            bullets.splice(i, 1);
        }
    }
}

// Update enemies
function updateEnemies(deltaTime) {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        // Move towards player
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            enemy.x += (dx / distance) * enemy.speed;
            enemy.y += (dy / distance) * enemy.speed;
        }
        
        // Keep enemy in bounds (they can go slightly out)
        enemy.x = Math.max(-enemy.size * 2, Math.min(GAME_WIDTH + enemy.size * 2, enemy.x));
        enemy.y = Math.max(-enemy.size * 2, Math.min(GAME_HEIGHT + enemy.size * 2, enemy.y));
        
        // Remove if dead
        if (enemy.hp <= 0) {
            // Add score
            score += enemy.score;
            
            // Update high score
            if (score > highScore) {
                highScore = score;
                localStorage.setItem("survivalShooterHighScore", highScore);
            }
            
            enemies.splice(i, 1);
        }
    }
}

// Update enemy spawner
function updateSpawner(deltaTime) {
    if (enemiesToSpawn > 0) {
        spawnTimer += deltaTime;
        
        if (spawnTimer >= enemySpawnDelay) {
            spawnEnemy();
            enemiesToSpawn--;
            spawnTimer = 0;
            
            // Decrease spawn delay as waves progress (but not below 300ms)
            enemySpawnDelay = Math.max(300, 1000 - currentWave * 50);
        }
    }
}

// Check collisions
function checkCollisions() {
    // Bullet vs Enemy collisions
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        let bulletHit = false;
        
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            
            // Calculate distance
            const dx = bullet.x - enemy.x;
            const dy = bullet.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Check collision
            if (distance < bullet.size + enemy.size) {
                // Apply damage
                enemy.hp -= bullet.damage;
                bulletHit = true;
                break;
            }
        }
        
        // Remove bullet if it hit an enemy
        if (bulletHit) {
            bullets.splice(i, 1);
        }
    }
    
    // Player vs Enemy collisions
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        // Calculate distance
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check collision
        if (distance < player.size + enemy.size) {
            // Apply damage to player
            player.hp -= enemy.damage;
            
            // Knockback enemy
            enemy.x -= (dx / distance) * 10;
            enemy.y -= (dy / distance) * 10;
        }
    }
}

// Update UI elements
function updateUI() {
    // Update health
    const healthPercent = (player.hp / player.maxHp) * 100;
    healthBar.style.width = healthPercent + "%";
    healthText.textContent = Math.max(0, Math.floor(player.hp)) + "/" + player.maxHp;
    
    // Update wave counter
    waveCounter.textContent = currentWave;
    
    // Update score
    scoreCounter.textContent = score;
    
    // Update high score
    highScoreCounter.textContent = highScore;
}

// Game over
function gameOver() {
    gameState = "gameOver";
    showMenu("gameOver");
}

// Render game
function render() {
    // Clear canvas
    ctx.fillStyle = "#111122";
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Draw grid background
    drawGrid();
    
    // Draw player
    drawPlayer();
    
    // Draw bullets
    drawBullets();
    
    // Draw enemies
    drawEnemies();
    
    // Draw debug info if needed
    if (settings.graphics === "high") {
        drawDebugInfo();
    }
}

// Draw grid background
function drawGrid() {
    const gridSize = 50;
    ctx.strokeStyle = "rgba(50, 50, 100, 0.3)";
    ctx.lineWidth = 1;
    
    // Vertical lines
    for (let x = 0; x < GAME_WIDTH; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, GAME_HEIGHT);
        ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y < GAME_HEIGHT; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(GAME_WIDTH, y);
        ctx.stroke();
    }
}

// Draw player
function drawPlayer() {
    // Player body
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Player outline
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
    ctx.stroke();
    
    // Player direction indicator (towards mouse)
    let targetX, targetY;
    if (touch.down) {
        targetX = touch.x;
        targetY = touch.y;
    } else {
        targetX = mouse.x;
        targetY = mouse.y;
    }
    
    const angle = Math.atan2(targetY - player.y, targetX - player.x);
    const indicatorX = player.x + Math.cos(angle) * (player.size + 5);
    const indicatorY = player.y + Math.sin(angle) * (player.size + 5);
    
    ctx.fillStyle = "#ffff00";
    ctx.beginPath();
    ctx.arc(indicatorX, indicatorY, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Health bar above player
    const healthPercent = player.hp / player.maxHp;
    const barWidth = player.size * 2;
    const barHeight = 5;
    const barX = player.x - barWidth / 2;
    const barY = player.y - player.size - 10;
    
    // Background
    ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // Foreground
    ctx.fillStyle = healthPercent > 0.5 ? "#00ff00" : healthPercent > 0.25 ? "#ffff00" : "#ff0000";
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
    
    // Border
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
}

// Draw bullets
function drawBullets() {
    for (const bullet of bullets) {
        ctx.fillStyle = bullet.color;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Bullet trail
        if (settings.graphics !== "low") {
            ctx.strokeStyle = "rgba(255, 255, 100, 0.7)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(bullet.x - bullet.vx * 0.5, bullet.y - bullet.vy * 0.5);
            ctx.lineTo(bullet.x, bullet.y);
            ctx.stroke();
        }
    }
}

// Draw enemies
function drawEnemies() {
    for (const enemy of enemies) {
        // Enemy body
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Enemy outline
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
        ctx.stroke();
        
        // Enemy eyes (to show direction)
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const angle = Math.atan2(dy, dx);
        
        const eyeDistance = enemy.size * 0.5;
        const eyeSize = enemy.size * 0.3;
        
        // Left eye
        const eye1X = enemy.x + Math.cos(angle - 0.3) * eyeDistance;
        const eye1Y = enemy.y + Math.sin(angle - 0.3) * eyeDistance;
        
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Right eye
        const eye2X = enemy.x + Math.cos(angle + 0.3) * eyeDistance;
        const eye2Y = enemy.y + Math.sin(angle + 0.3) * eyeDistance;
        
        ctx.beginPath();
        ctx.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Pupils
        const pupilDistance = eyeSize * 0.5;
        
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(eye1X + Math.cos(angle) * pupilDistance, eye1Y + Math.sin(angle) * pupilDistance, eyeSize * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(eye2X + Math.cos(angle) * pupilDistance, eye2Y + Math.sin(angle) * pupilDistance, eyeSize * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Health bar above enemy
        const healthPercent = enemy.hp / enemy.maxHp;
        const barWidth = enemy.size * 2;
        const barHeight = 4;
        const barX = enemy.x - barWidth / 2;
        const barY = enemy.y - enemy.size - 8;
        
        // Background
        ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Foreground
        ctx.fillStyle = healthPercent > 0.5 ? "#00ff00" : healthPercent > 0.25 ? "#ffff00" : "#ff0000";
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        
        // Border
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // Enemy type indicator
        if (enemy.type !== "BASIC") {
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 10px Arial";
            ctx.textAlign = "center";
            ctx.fillText(enemy.type, enemy.x, enemy.y + enemy.size + 12);
        }
    }
}

// Draw debug info
function drawDebugInfo() {
    ctx.fillStyle = "#ffffff";
    ctx.font = "12px Arial";
    ctx.textAlign = "left";
    
    let y = 20;
    ctx.fillText(`FPS: ${Math.round(1 / (deltaTime / 1000))}`, 10, y); y += 15;
    ctx.fillText(`Enemies: ${enemies.length}`, 10, y); y += 15;
    ctx.fillText(`Bullets: ${bullets.length}`, 10, y); y += 15;
    ctx.fillText(`Wave: ${currentWave} (${enemiesToSpawn} left to spawn)`, 10, y); y += 15;
    
    // Player coordinates
    ctx.fillText(`Player: (${Math.round(player.x)}, ${Math.round(player.y)})`, 10, y); y += 15;
    
    // Controls info
    ctx.textAlign = "right";
    y = 20;
    ctx.fillText("WASD: Move", GAME_WIDTH - 10, y); y += 15;
    ctx.fillText("Mouse: Aim & Shoot", GAME_WIDTH - 10, y); y += 15;
    ctx.fillText("ESC: Pause", GAME_WIDTH - 10, y);
}

// Game loop
let lastTime = 0;
let deltaTime = 0;

function gameLoop(timestamp) {
    // Calculate delta time
    if (lastTime === 0) lastTime = timestamp;
    deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    // Update game state
    update(deltaTime);
    
    // Render game
    render();
    
    // Continue game loop
    requestAnimationFrame(gameLoop);
}

// Initialize game when page loads
window.addEventListener("load", init);
