// Cron - /tmp/ Zone Demo
// Circuit/Computing themed vector graphics game

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// UI Elements
const messageBox = document.getElementById('message-box');
const profileView = document.getElementById('profile-view');
const profileBtn = document.getElementById('profile-btn');
const closeProfileBtn = document.getElementById('close-profile');

// Profile UI Elements
const uiElements = {
    health: document.getElementById('profile-health'),
    stamina: document.getElementById('profile-stamina'),
    bits: document.getElementById('profile-bits'),
    bytes: document.getElementById('profile-bytes'),
    commands: document.getElementById('profile-commands')
};

// Colors - Circuit board palette
const COLORS = {
    cyan: '#00ffff',
    magenta: '#ff00ff',
    orange: '#ff6600',
    green: '#00ff00',
    red: '#ff3333',
    yellow: '#ffff00',
    white: '#ffffff',
    copper: '#b87333',
    gold: '#ffd700',
    pcbGreen: '#1a472a',
    grid: '#0d2818',
    trace: '#2a5a3a',
    trace: '#2a5a3a',
    darkBg: '#050a08',
    lightBlue: '#66ccff',
    darkBlue: '#0077ff'
};

// Game state
const game = {
    width: 0,
    height: 0,
    worldWidth: 2400,   // World is larger than screen
    worldHeight: 2400,
    running: true,
    paused: false, // For level-up menu
    dead: false,   // Player is dead
    lastTime: 0,
    deltaTime: 0,
    time: 0
};

// Camera that follows player
const camera = {
    x: 0,
    y: 0,
    smoothing: 0.1  // How smoothly camera follows (0 = instant, 1 = never)
};

// Command definitions — the abilities the player can discover and master
// Each command belongs to a binary (weapon type) and has its own mastery (0-100)
// Mastery tiers: 0-24 Novice, 25-49 Familiar, 50-74 Proficient (flag 1), 75-99 Expert (flag 2), 100 Mastered (piping)
const COMMANDS = {
    kill: {
        name: 'kill',
        binary: 'bash',       // melee binary
        type: 'melee',
        description: 'Send a signal to terminate a process',
        baseDamage: 15,
        staminaCost: 15,
        cooldown: 0.35,
        range: 60,
        arc: Math.PI / 2,     // 90 degree slash
        color: '#ff6600',
        flags: {
            // Unlocked at mastery 50 — area sweep
            '-9': { mastery: 50, desc: 'SIGKILL: Execute enemies below 20% health', effect: 'execute' },
            // Unlocked at mastery 75 — force kill
            '-f': { mastery: 75, desc: 'Force: +50% damage', effect: 'damageMult' }
        }
    },
    ping: {
        name: 'ping',
        binary: 'ping',       // ranged binary
        type: 'ranged',
        description: 'Send ICMP echo request packets',
        baseDamage: 10,
        staminaCost: 10,
        cooldown: 0.3,
        range: 500,
        projectileSpeed: 700,
        color: '#00ff00',
        flags: {
            '-c': { mastery: 50, desc: 'Count: Pierce through 1 enemy', effect: 'pierce' },
            '-f': { mastery: 75, desc: 'Flood: Triple shot cone', effect: 'cone' }
        }
    },
    rm: {
        name: 'rm',
        binary: 'coreutils',  // terrain binary
        type: 'terrain',
        description: 'Remove files (destroy terrain)',
        baseDamage: 20,       // vs blocks
        staminaCost: 8,
        cooldown: 0.25,
        range: 60,
        color: '#ff3333',
        flags: {
            '-r': { mastery: 50, desc: 'Recursive: Destroy in area', effect: 'aoe' },
            '-f': { mastery: 75, desc: 'Force: Destroy strong blocks in one hit', effect: 'oneHit' }
        }
    }
};

// Get mastery tier label
function getMasteryTier(mastery) {
    if (mastery >= 100) return 'Mastered';
    if (mastery >= 75) return 'Expert';
    if (mastery >= 50) return 'Proficient';
    if (mastery >= 25) return 'Familiar';
    return 'Novice';
}

// Get mastery scaling multiplier (affects damage, stamina cost, cooldown)
function getMasteryScale(mastery) {
    // Damage: 1.0 at 0, up to 1.5 at 100
    const damageMult = 1.0 + (mastery / 100) * 0.5;
    // Stamina cost: 1.0 at 0, down to 0.6 at 100
    const staminaMult = 1.0 - (mastery / 100) * 0.4;
    // Cooldown: 1.0 at 0, down to 0.7 at 100
    const cooldownMult = 1.0 - (mastery / 100) * 0.3;
    return { damageMult, staminaMult, cooldownMult };
}

// Player - represents a microprocessor/chip (orphan process)
const player = {
    x: 0,
    y: 0,
    size: 24,
    speed: 250,
    // Core stats — increased by finding ROM Chips / RAM Modules in the world
    health: 100,
    maxHealth: 100,
    stamina: 100,
    maxStamina: 100,
    // Currency
    bits: 0,
    bytes: 0,
    // Commands — mastery tracking per command (0-100)
    // Player starts with 'kill' (melee) and 'rm' (terrain destroy)
    mastery: {
        kill: 0,
        rm: 0
    },
    // Currently equipped $PATH command (used on swipe attack)
    equippedCommand: 'kill',
    // Combat state
    attacking: false,
    attackCooldown: 0,
    attackDuration: 0,
    attackAngle: 0,
    facingAngle: 0,
    invulnerable: 0,
    vx: 0,
    vy: 0,
    pulsePhase: 0,
    profileOpen: false
};

// Game State
let gameState = 'INTRO'; // INTRO, PLAYING
let introStep = 0;
const INTRO_TEXTS = [
    "System critical... Kernel panic imminent...",
    "Cron has corrupted the job scheduler. Processes are going rogue across the entire system.",
    "I have isolated you—an orphan process—from the purge. You are the last hope to restore order.",
    "I have loaded two commands into your $PATH: kill and rm. Use them wisely—the more you fight, the stronger they become.",
    "Controls: [Left Side] Drag to move. [Right Side] Swipe to attack."
];

// Terrain blocks
let blocks = [];
const BLOCK_SIZE = 40;

// Enemies
let enemies = [];
const ENEMY_SPAWN_INTERVAL = 3000;
let lastSpawn = 0;
let spawnTimer = 0;
const MAX_ENEMIES = 8;

// Attack projectiles (data packets)
let attacks = [];

// Particles for effects
let particles = [];

// Pickups (bits/bytes)
let pickups = [];

// Input handling
const keys = {
    up: false,
    down: false,
    left: false,
    right: false,
    attack: false
};

// Touch controls state
const touch = {
    leftActive: false,
    leftStartX: 0,
    leftStartY: 0,
    leftCurrentX: 0,
    leftCurrentY: 0,
    leftId: null,
    rightActive: false,
    rightStartX: 0,
    rightStartY: 0,
    rightId: null,
    joystickRadius: 60
};

function setupTouchControls() {
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    // UI Event Listeners for Intro
    const skipBtn = document.getElementById('skip-intro');
    if (skipBtn) {
        skipBtn.addEventListener('click', () => {
            gameState = 'PLAYING';
            document.getElementById('intro-overlay').classList.add('hidden');
            showMessage('Left side: drag to move | Right side: swipe to attack', 4000);
        });
    }

    const nextBtn = document.getElementById('next-intro');
    if (nextBtn) {
        nextBtn.addEventListener('click', advanceIntro);
    }

    // Using Touch Events - confirmed working on Android Chrome

    canvas.addEventListener('touchstart', function (e) {
        e.preventDefault();

        const t = e.touches[0];
        const x = t.clientX;
        const y = t.clientY;

        // Handle death screen restart button tap
        if (game.dead) {
            if (x >= deathRestartButton.x && x <= deathRestartButton.x + deathRestartButton.width &&
                y >= deathRestartButton.y && y <= deathRestartButton.y + deathRestartButton.height) {
                restartGame();
            }
            return; // Don't process other input when dead
        }

        if (gameState !== 'PLAYING') return;

        for (let i = 0; i < e.touches.length; i++) {
            const t = e.touches[i];
            const x = t.clientX;
            const y = t.clientY;
            const isLeftSide = x < game.width / 2;

            if (isLeftSide && !touch.leftActive) {
                touch.leftActive = true;
                touch.leftId = t.identifier;
                touch.leftStartX = x;
                touch.leftStartY = y;
                touch.leftCurrentX = x;
                touch.leftCurrentY = y;
            } else if (!isLeftSide && !touch.rightActive) {
                touch.rightActive = true;
                touch.rightId = t.identifier;
                touch.rightStartX = x;
                touch.rightStartY = y;
            }
        }
    }, { passive: false });

    canvas.addEventListener('touchmove', function (e) {
        e.preventDefault();

        for (let i = 0; i < e.touches.length; i++) {
            const t = e.touches[i];
            if (t.identifier === touch.leftId) {
                touch.leftCurrentX = t.clientX;
                touch.leftCurrentY = t.clientY;

                const dx = touch.leftCurrentX - touch.leftStartX;
                const dy = touch.leftCurrentY - touch.leftStartY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > 10) {
                    const nx = dx / dist;
                    const ny = dy / dist;
                    keys.left = nx < -0.3;
                    keys.right = nx > 0.3;
                    keys.up = ny < -0.3;
                    keys.down = ny > 0.3;
                } else {
                    keys.left = keys.right = keys.up = keys.down = false;
                }
            }
        }
    }, { passive: false });

    canvas.addEventListener('touchend', function (e) {
        for (let i = 0; i < e.changedTouches.length; i++) {
            const t = e.changedTouches[i];
            if (t.identifier === touch.leftId) {
                touch.leftActive = false;
                touch.leftId = null;
                keys.left = keys.right = keys.up = keys.down = false;
            } else if (t.identifier === touch.rightId) {
                const dx = t.clientX - touch.rightStartX;
                const dy = t.clientY - touch.rightStartY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > 20) {
                    // Swipe attack
                    const angle = Math.atan2(dy, dx);
                    const targetX = player.x + Math.cos(angle) * 100;
                    const targetY = player.y + Math.sin(angle) * 100;
                    attack(targetX, targetY);
                }

                touch.rightActive = false;
                touch.rightId = null;
            }
        }
    });

    canvas.addEventListener('touchcancel', function (e) {
        touch.leftActive = false;
        touch.leftId = null;
        touch.rightActive = false;
        touch.rightId = null;
        keys.left = keys.right = keys.up = keys.down = false;
    });
}

function advanceIntro() {
    introStep++;
    const textEl = document.getElementById('intro-text');

    // Stop any existing typing
    if (window.typeTimeout) clearTimeout(window.typeTimeout);

    if (introStep < INTRO_TEXTS.length) {
        textEl.innerText = "";
        typeWriter(INTRO_TEXTS[introStep], textEl);
    } else {
        gameState = 'PLAYING';
        document.getElementById('intro-overlay').classList.add('hidden');
        showMessage('Left side: drag to move | Right side: swipe to attack', 4000);
    }
}

function typeWriter(text, element, i = 0) {
    if (gameState !== 'INTRO') return;
    if (i < text.length) {
        element.innerHTML += text.charAt(i);
        window.typeTimeout = setTimeout(() => typeWriter(text, element, i + 1), 30);
    }
}

// Increase mastery for a command after successful use
function gainMastery(commandId, amount) {
    if (player.mastery[commandId] === undefined) return;
    const prev = player.mastery[commandId];
    player.mastery[commandId] = Math.min(100, prev + amount);
    const newMastery = player.mastery[commandId];

    // Check for milestone notifications
    const milestones = [25, 50, 75, 100];
    for (const m of milestones) {
        if (prev < m && newMastery >= m) {
            const cmd = COMMANDS[commandId];
            const tier = getMasteryTier(newMastery);
            showMessage(`${cmd.name} → ${tier}! (v${(newMastery / 100).toFixed(2)})`, 2500);
            // Check flag unlocks
            if (cmd.flags) {
                for (const [flag, info] of Object.entries(cmd.flags)) {
                    if (info.mastery === m) {
                        showMessage(`Unlocked: ${cmd.name} ${flag} — ${info.desc}`, 3000);
                    }
                }
            }
        }
    }
}


function handleTouchStart(e) {
    e.preventDefault();
    for (const t of e.changedTouches) {
        const x = t.clientX;
        const y = t.clientY;
        const isLeftSide = x < game.width / 2;

        if (isLeftSide && !touch.leftActive) {
            // Left side - movement joystick
            touch.leftActive = true;
            touch.leftId = t.identifier;
            touch.leftStartX = x;
            touch.leftStartY = y;
            touch.leftCurrentX = x;
            touch.leftCurrentY = y;
            // Visual feedback
            particles.push({
                x: x, y: y,
                vx: 0, vy: 0,
                life: 0.5, maxLife: 0.5,
                color: 'rgba(0, 255, 255, 0.5)', size: 30, type: 'spark'
            });
            showMessage('Joystick activated', 500);
        } else if (!isLeftSide && !touch.rightActive) {
            // Right side - attack swipe
            touch.rightActive = true;
            touch.rightId = t.identifier;
            touch.rightStartX = x;
            touch.rightStartY = y;
            // Visual feedback
            particles.push({
                x: x, y: y,
                vx: 0, vy: 0,
                life: 0.5, maxLife: 0.5,
                color: 'rgba(255, 0, 0, 0.5)', size: 30, type: 'spark'
            });
            showMessage('Attack swipe started', 500);
        }
    }
}

function handleTouchMove(e) {
    e.preventDefault();
    for (const t of e.changedTouches) {
        if (t.identifier === touch.leftId) {
            const x = t.clientX;
            const y = t.clientY;
            touch.leftCurrentX = x;
            touch.leftCurrentY = y;

            // Calculate joystick direction
            const dx = touch.leftCurrentX - touch.leftStartX;
            const dy = touch.leftCurrentY - touch.leftStartY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Visual feedback for drag
            if (Math.random() > 0.8) {
                particles.push({
                    x: x, y: y, vx: 0, vy: 0,
                    life: 0.2, maxLife: 0.2,
                    color: 'rgba(0, 255, 255, 0.2)', size: 5, type: 'spark'
                });
            }

            if (dist > 10) {
                // Normalize and apply to keys
                const nx = dx / dist;
                const ny = dy / dist;

                keys.left = nx < -0.3;
                keys.right = nx > 0.3;
                keys.up = ny < -0.3;
                keys.down = ny > 0.3;
            } else {
                keys.left = keys.right = keys.up = keys.down = false;
            }
        }
    }
}

function handleTouchEnd(e) {
    for (const t of e.changedTouches) {
        if (t.identifier === touch.leftId) {
            // Left joystick released
            touch.leftActive = false;
            touch.leftId = null;
            keys.left = keys.right = keys.up = keys.down = false;
        } else if (t.identifier === touch.rightId) {
            // Right side released - trigger attack in swipe direction
            const dx = t.clientX - touch.rightStartX;
            const dy = t.clientY - touch.rightStartY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 20) {
                // Swipe detected - attack in that direction
                const angle = Math.atan2(dy, dx);
                const targetX = player.x + Math.cos(angle) * 100;
                const targetY = player.y + Math.sin(angle) * 100;
                attack(targetX, targetY);
            }

            touch.rightActive = false;
            touch.rightId = null;
        }
    }
}
function init() {
    resize();
    window.addEventListener('resize', resize);

    window.addEventListener('keydown', (e) => {
        handleKey(e.key, true);
        if (e.key === ' ') e.preventDefault();
    });
    window.addEventListener('keyup', (e) => handleKey(e.key, false));

    canvas.addEventListener('click', (e) => {
        // Prevent attack if clicking on UI (though overlay handles pointer events mostly)
        if (game.paused) return;

        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        attack(mouseX, mouseY);
    });

    // Profile UI Listeners
    profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleProfile();
    });

    closeProfileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleProfile();
    });

    // Touch controls
    setupTouchControls();

    player.x = game.width / 2;
    player.y = game.height / 2;

    // Generate initial terrain blocks
    generateBlocks();

    // Spawn initial enemies
    for (let i = 0; i < 3; i++) {
        spawnEnemy();
    }

    // Show appropriate message based on device
    const isMobile = 'ontouchstart' in window;
    if (isMobile) {
        showMessage('Left side: drag to move | Right side: swipe to attack', 5000);
    } else {
        showMessage('WASD to move | SPACE or Click to attack | Collect Bits & Bytes', 4000);
    }

    // Start Intro
    document.getElementById('intro-overlay').classList.remove('hidden');
    typeWriter(INTRO_TEXTS[0], document.getElementById('intro-text'));

    requestAnimationFrame(gameLoop);
}

function resize() {
    game.width = window.innerWidth;
    game.height = window.innerHeight;
    canvas.width = game.width;
    canvas.height = game.height;
}

function generateBlocks() {
    blocks = [];
    const bs = BLOCK_SIZE;
    const margin = 80;
    const w = game.worldWidth;
    const h = game.worldHeight;

    // Snap helper - align to grid
    const snap = (val) => Math.round(val / bs) * bs;

    // Create room boundaries (outer walls)
    // Top wall with gap
    for (let x = margin; x < w - margin; x += bs) {
        if (x < w / 2 - bs * 2 || x > w / 2 + bs * 2) {
            addBlock(snap(x), snap(margin));
        }
    }
    // Bottom wall with gap
    for (let x = margin; x < w - margin; x += bs) {
        if (x < w / 2 - bs * 2 || x > w / 2 + bs * 2) {
            addBlock(snap(x), snap(h - margin - bs));
        }
    }
    // Left wall with gap
    for (let y = margin; y < h - margin; y += bs) {
        if (y < h / 2 - bs * 2 || y > h / 2 + bs * 2) {
            addBlock(snap(margin), snap(y));
        }
    }
    // Right wall with gap
    for (let y = margin; y < h - margin; y += bs) {
        if (y < h / 2 - bs * 2 || y > h / 2 + bs * 2) {
            addBlock(snap(w - margin - bs), snap(y));
        }
    }

    // Internal corridors - horizontal
    const corridorY = snap(h / 2);
    for (let x = margin + bs * 3; x < w / 2 - bs * 4; x += bs) {
        addBlock(snap(x), corridorY - bs * 2);
        addBlock(snap(x), corridorY + bs * 2);
    }
    for (let x = w / 2 + bs * 4; x < w - margin - bs * 3; x += bs) {
        addBlock(snap(x), corridorY - bs * 2);
        addBlock(snap(x), corridorY + bs * 2);
    }

    // Small rooms in corners
    // Top-left room
    addBlock(snap(margin + bs * 4), snap(margin + bs * 3));
    addBlock(snap(margin + bs * 5), snap(margin + bs * 3));
    addBlock(snap(margin + bs * 6), snap(margin + bs * 3));
    addBlock(snap(margin + bs * 6), snap(margin + bs * 4));

    // Top-right room
    addBlock(snap(w - margin - bs * 5), snap(margin + bs * 3));
    addBlock(snap(w - margin - bs * 6), snap(margin + bs * 3));
    addBlock(snap(w - margin - bs * 7), snap(margin + bs * 3));
    addBlock(snap(w - margin - bs * 7), snap(margin + bs * 4));

    // Bottom-left room
    addBlock(snap(margin + bs * 4), snap(h - margin - bs * 4));
    addBlock(snap(margin + bs * 5), snap(h - margin - bs * 4));
    addBlock(snap(margin + bs * 6), snap(h - margin - bs * 4));
    addBlock(snap(margin + bs * 6), snap(h - margin - bs * 5));

    // Bottom-right room
    addBlock(snap(w - margin - bs * 5), snap(h - margin - bs * 4));
    addBlock(snap(w - margin - bs * 6), snap(h - margin - bs * 4));
    addBlock(snap(w - margin - bs * 7), snap(h - margin - bs * 4));
    addBlock(snap(w - margin - bs * 7), snap(h - margin - bs * 5));

    // Some scattered blocks for variety (on grid, no overlaps)
    for (let i = 0; i < 20; i++) {  // More scattered blocks for larger world
        const gridX = snap(margin + bs * 2 + Math.random() * (w - margin * 2 - bs * 4));
        const gridY = snap(margin + bs * 2 + Math.random() * (h - margin * 2 - bs * 4));
        // Don't place too close to center (player spawn)
        const dx = gridX - w / 2;
        const dy = gridY - h / 2;
        if (Math.sqrt(dx * dx + dy * dy) > bs * 3) {
            addBlock(gridX, gridY);
        }
    }
}

function addBlock(x, y) {
    // Check if block already exists at this position
    const exists = blocks.some(b => Math.abs(b.x - x) < 5 && Math.abs(b.y - y) < 5);
    if (exists) return;

    const isStrong = Math.random() > 0.3;
    blocks.push({
        x: x,
        y: y,
        value: isStrong ? 1 : 0,
        health: isStrong ? 3 : 1,
        maxHealth: isStrong ? 3 : 1
    });
}

function handleKey(key, pressed) {
    if (gameState !== 'PLAYING') return;

    switch (key.toLowerCase()) {
        case 'w': case 'arrowup': keys.up = pressed; break;
        case 's': case 'arrowdown': keys.down = pressed; break;
        case 'a': case 'arrowleft': keys.left = pressed; break;
        case 'd': case 'arrowright': keys.right = pressed; break;
        case ' ': keys.attack = pressed; break;
    }
}

// Check if player has unlocked a flag for a command
function hasFlag(commandId, flag) {
    const cmd = COMMANDS[commandId];
    if (!cmd || !cmd.flags || !cmd.flags[flag]) return false;
    return (player.mastery[commandId] || 0) >= cmd.flags[flag].mastery;
}

// Get computed stats for a specific command based on its mastery
function getCommandStats(commandId) {
    const cmd = COMMANDS[commandId];
    if (!cmd) return null;

    const mastery = player.mastery[commandId] || 0;
    const scale = getMasteryScale(mastery);

    return {
        damage: cmd.baseDamage * scale.damageMult,
        staminaCost: cmd.staminaCost * scale.staminaMult,
        cooldown: cmd.cooldown * scale.cooldownMult,
        range: cmd.range,
        arc: cmd.arc || 0,
        projectileSpeed: cmd.projectileSpeed || 0,
        color: cmd.color,
        type: cmd.type,
        // Flag effects
        executeThreshold: hasFlag(commandId, '-9') ? 0.2 : 0,
        damageMult: hasFlag(commandId, '-f') && cmd.type === 'melee' ? 1.5 : 1.0,
        pierce: hasFlag(commandId, '-c') ? 1 : 0,
        cone: hasFlag(commandId, '-f') && cmd.type === 'ranged'
    };
}

function attack(targetX, targetY) {
    const cmdId = player.equippedCommand;
    const stats = getCommandStats(cmdId);
    if (!stats) return;

    const staminaCost = Math.ceil(stats.staminaCost);
    if (player.attackCooldown > 0 || player.stamina < staminaCost) return;

    player.stamina -= staminaCost;
    player.attackCooldown = stats.cooldown;
    player.attacking = true;
    player.attackDuration = 0.15;

    // Calculate angle
    player.attackAngle = Math.atan2(targetY - player.y, targetX - player.x);

    const finalDamage = stats.damage * stats.damageMult;

    // --- MELEE ---
    if (stats.type === 'melee') {
        attacks.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(player.attackAngle) * 50,
            vy: Math.sin(player.attackAngle) * 50,
            life: 0.2,
            size: stats.range,
            type: 'slash',
            damage: finalDamage,
            angle: player.attackAngle,
            arc: stats.arc,
            pierce: 999,
            executeThreshold: stats.executeThreshold,
            commandId: cmdId
        });
        createSlashEffect(player.x, player.y, player.attackAngle, stats.range);
    }

    // --- RANGED ---
    else if (stats.type === 'ranged') {
        const createProjectile = (angle) => {
            attacks.push({
                x: player.x,
                y: player.y,
                vx: Math.cos(angle) * stats.projectileSpeed,
                vy: Math.sin(angle) * stats.projectileSpeed,
                life: 0.8,
                size: 6,
                type: 'packet',
                damage: finalDamage,
                pierce: stats.pierce,
                executeThreshold: stats.executeThreshold,
                commandId: cmdId
            });
        };

        if (stats.cone) {
            for (let i = -1; i <= 1; i++) {
                createProjectile(player.attackAngle + i * 0.25);
            }
        } else {
            createProjectile(player.attackAngle);
        }
    }

    // --- TERRAIN (rm) — same as melee but targets blocks ---
    else if (stats.type === 'terrain') {
        attacks.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(player.attackAngle) * 50,
            vy: Math.sin(player.attackAngle) * 50,
            life: 0.2,
            size: stats.range,
            type: 'slash',
            damage: finalDamage,
            angle: player.attackAngle,
            arc: Math.PI / 2,
            pierce: 999,
            commandId: cmdId
        });
        createSlashEffect(player.x, player.y, player.attackAngle, stats.range);
    }

    // Gain mastery from use (+0.5 per attack, combat commands gain more on hit)
    gainMastery(cmdId, 0.3);

    // Spark particles
    const sparkColor = stats.color || COLORS.cyan;
    for (let i = 0; i < 6; i++) {
        const spread = (Math.random() - 0.5) * 0.4;
        particles.push({
            x: player.x + Math.cos(player.attackAngle) * player.size,
            y: player.y + Math.sin(player.attackAngle) * player.size,
            vx: Math.cos(player.attackAngle + spread) * (150 + Math.random() * 100),
            vy: Math.sin(player.attackAngle + spread) * (150 + Math.random() * 100),
            life: 0.25,
            maxLife: 0.25,
            color: sparkColor,
            size: 2,
            type: 'spark'
        });
    }
}

function createSlashEffect(x, y, angle, size) {
    // Add visual slash particles
    for (let i = 0; i < 10; i++) {
        const offset = (Math.random() - 0.5) * size;
        const particleAngle = angle + (Math.random() - 0.5) * 1.0;
        particles.push({
            x: x + Math.cos(angle) * (size * 0.5),
            y: y + Math.sin(angle) * (size * 0.5),
            vx: Math.cos(particleAngle) * 300,
            vy: Math.sin(particleAngle) * 300,
            life: 0.15,
            maxLife: 0.15,
            color: COLORS.orange,
            size: 3,
            type: 'spark'
        });
    }
}

function createBurstEffect(x, y, radius) {
    // Expanding ring effect
    for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * (radius * 3),
            vy: Math.sin(angle) * (radius * 3),
            life: 0.3,
            maxLife: 0.3,
            color: COLORS.magenta,
            size: 4,
            type: 'spark'
        });
    }
}

function spawnEnemy() {
    if (enemies.length >= MAX_ENEMIES) return;

    let x, y;
    const side = Math.floor(Math.random() * 4);
    const margin = 100;
    const w = game.worldWidth;
    const h = game.worldHeight;

    // Spawn enemies from edges of world
    switch (side) {
        case 0: x = margin + Math.random() * (w - margin * 2); y = margin; break;
        case 1: x = w - margin; y = margin + Math.random() * (h - margin * 2); break;
        case 2: x = margin + Math.random() * (w - margin * 2); y = h - margin; break;
        case 3: x = margin; y = margin + Math.random() * (h - margin * 2); break;
    }

    enemies.push({
        x: x,
        y: y,
        size: 18,
        speed: 35 + Math.random() * 25,
        health: 30,
        maxHealth: 30,
        pid: 5 + Math.floor(Math.random() * 10),
        bytes: 2 + Math.floor(Math.random() * 5),
        phase: Math.random() * Math.PI * 2,
        glitchTimer: 0,
        type: 'zombie'
    });
}

function spawnPickup(x, y, type, amount) {
    pickups.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        type: type,
        amount: amount,
        life: 10,
        bobPhase: Math.random() * Math.PI * 2
    });
}

function showMessage(text, duration = 2000) {
    messageBox.textContent = text;
    messageBox.classList.add('visible');
    setTimeout(() => messageBox.classList.remove('visible'), duration);
}

function gameLoop(timestamp) {
    try {
        // console.log('Loop heartbeat'); // DEBUG
        game.deltaTime = Math.min((timestamp - game.lastTime) / 1000, 0.1);
        game.lastTime = timestamp;
        game.time += game.deltaTime;

        if (!game.paused) {
            update();
        }
        // Also update profile view if open to show real-time changes (e.g. regeneration) if we decided to keep it strictly paused, this might not be needed, but good for polish
        if (player.profileOpen) {
            updateProfileView();
        }
        render();

        // Draw death screen on top if dead
        if (game.dead) {
            renderDeathScreen();
        }

        // Keep running even when dead (to show death screen) or paused
        if (game.running || game.dead) {
            requestAnimationFrame(gameLoop);
        }
    } catch (err) {
        console.error("Game Loop Crashed:", err);
    }
}

function update() {
    // console.log('Update running', gameState, game.deltaTime); // DEBUG
    if (gameState !== 'PLAYING') return;

    const dt = game.deltaTime;

    // Spawn enemies
    spawnTimer += dt;
    if (spawnTimer > 2) {
        spawnEnemy();
        spawnTimer = 0;
    }

    player.pulsePhase += dt * 4;

    // Player movement
    player.vx = 0;
    player.vy = 0;
    if (keys.up) player.vy = -1;
    if (keys.down) player.vy = 1;
    if (keys.left) player.vx = -1;
    if (keys.right) player.vx = 1;

    if (player.vx !== 0 && player.vy !== 0) {
        const len = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
        player.vx /= len;
        player.vy /= len;
    }

    // Update facing direction based on movement
    if (player.vx !== 0 || player.vy !== 0) {
        player.facingAngle = Math.atan2(player.vy, player.vx);
    }

    player.x += player.vx * player.speed * dt;
    player.y += player.vy * player.speed * dt;

    // Player collision with blocks
    for (const b of blocks) {
        const halfBlock = BLOCK_SIZE / 2;
        const closestX = Math.max(b.x - halfBlock, Math.min(player.x, b.x + halfBlock));
        const closestY = Math.max(b.y - halfBlock, Math.min(player.y, b.y + halfBlock));
        const dx = player.x - closestX;
        const dy = player.y - closestY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < player.size) {
            // Push player out of block
            if (dist > 0) {
                const overlap = player.size - dist;
                player.x += (dx / dist) * overlap;
                player.y += (dy / dist) * overlap;
            }
        }
    }

    // Clamp player to world bounds
    player.x = Math.max(player.size, Math.min(game.worldWidth - player.size, player.x));
    player.y = Math.max(player.size, Math.min(game.worldHeight - player.size, player.y));

    // Update camera to follow player (smooth follow)
    const targetCamX = player.x - game.width / 2;
    const targetCamY = player.y - game.height / 2;
    camera.x += (targetCamX - camera.x) * (1 - camera.smoothing);
    camera.y += (targetCamY - camera.y) * (1 - camera.smoothing);

    // Clamp camera to world bounds
    camera.x = Math.max(0, Math.min(game.worldWidth - game.width, camera.x));
    camera.y = Math.max(0, Math.min(game.worldHeight - game.height, camera.y));

    player.stamina = Math.min(player.maxStamina, player.stamina + 20 * dt);

    // Spacebar attack (fires in facing direction)
    if (keys.attack && player.attackCooldown <= 0 && player.stamina >= 10) {
        const targetX = player.x + Math.cos(player.facingAngle) * 100;
        const targetY = player.y + Math.sin(player.facingAngle) * 100;
        attack(targetX, targetY);
    }

    if (player.attackCooldown > 0) player.attackCooldown -= dt;
    if (player.attackDuration > 0) player.attackDuration -= dt;
    else player.attacking = false;
    if (player.invulnerable > 0) player.invulnerable -= dt;

    // Update attacks
    for (let i = attacks.length - 1; i >= 0; i--) {
        const a = attacks[i];
        a.x += a.vx * dt;
        a.y += a.vy * dt;
        a.life -= dt;

        if (a.life <= 0) {
            attacks.splice(i, 1);
            continue;
        }

        // Bounce off world edges (ssh -p ability)
        if (a.bounces && a.bounces > 0) {
            if (a.x < 0 || a.x > game.worldWidth) {
                a.vx = -a.vx;
                a.bounces--;
                a.x = Math.max(0, Math.min(game.worldWidth, a.x));
            }
            if (a.y < 0 || a.y > game.worldHeight) {
                a.vy = -a.vy;
                a.bounces--;
                a.y = Math.max(0, Math.min(game.worldHeight, a.y));
            }
        } else if (a.x < 0 || a.x > game.worldWidth || a.y < 0 || a.y > game.worldHeight) {
            attacks.splice(i, 1);
            continue;
        }

        // Check enemy collision
        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            const dx = a.x - e.x;
            const dy = a.y - e.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Check persistent hit list for this enemy
            if (a.hitList && a.hitList.includes(e.id)) continue; // Assume enemies have IDs or use object reference check
            // Actually object reference check is safer if no IDs:
            if (a.hitList && a.hitList.includes(e)) continue;

            let hit = false;

            if (a.type === 'slash') {
                // Cone collision check
                if (dist < a.size + e.size) {
                    const angleToEnemy = Math.atan2(e.y - a.y, e.x - a.x);
                    let angleDiff = Math.abs(angleToEnemy - a.angle);
                    if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

                    if (angleDiff < a.arc / 2) {
                        hit = true;
                    }
                }
            }
            else if (a.type === 'burst') {
                if (dist < a.size + e.size) hit = true;
            }
            else {
                // Packet (standard projectile) check
                if (dist < a.size + e.size) hit = true;
            }

            if (hit) {
                // Use projectile's damage value
                const damage = a.damage || 15;

                // Execute threshold check (kill -9)
                if (a.executeThreshold && (e.health / e.maxHealth) <= a.executeThreshold) {
                    e.health = 0; // Instant kill
                    showMessage('SIGKILL!', 800);
                } else {
                    e.health -= damage;
                }

                // Handle knockback
                const kbStrength = a.type === 'burst' ? 200 : 100;
                const kbAngle = Math.atan2(e.y - a.y, e.x - a.x);
                e.vx += Math.cos(kbAngle) * kbStrength;
                e.vy += Math.sin(kbAngle) * kbStrength;

                // Pierce logic
                if (a.pierce && a.pierce > 0) {
                    a.pierce--;
                    // For persistent attacks (high pierce), add to hitList
                    if (a.pierce > 10) {
                        if (!a.hitList) a.hitList = [];
                        a.hitList.push(e);
                    }
                } else {
                    attacks.splice(i, 1);
                }

                // Electric spark particles
                for (let k = 0; k < 10; k++) {
                    const angle = Math.random() * Math.PI * 2;
                    particles.push({
                        x: e.x,
                        y: e.y,
                        vx: Math.cos(angle) * (80 + Math.random() * 120),
                        vy: Math.sin(angle) * (80 + Math.random() * 120),
                        life: 0.3,
                        maxLife: 0.3,
                        color: COLORS.yellow,
                        size: 3,
                        type: 'spark'
                    });
                }

                // Gain extra mastery on hit
                if (a.commandId) {
                    gainMastery(a.commandId, 0.5);
                }

                if (e.health <= 0) {
                    const bytes = e.bytes || 2;
                    showMessage(`+${bytes} Bytes`, 1500);

                    // Spawn byte pickups
                    for (let k = 0; k < bytes; k++) {
                        spawnPickup(e.x, e.y, 'byte', 1);
                    }

                    // Death explosion
                    for (let k = 0; k < 20; k++) {
                        const angle = Math.random() * Math.PI * 2;
                        particles.push({
                            x: e.x,
                            y: e.y,
                            vx: Math.cos(angle) * (40 + Math.random() * 100),
                            vy: Math.sin(angle) * (40 + Math.random() * 100),
                            life: 0.6,
                            maxLife: 0.6,
                            color: Math.random() > 0.5 ? COLORS.magenta : COLORS.red,
                            size: 4,
                            type: 'fragment'
                        });
                    }

                    enemies.splice(j, 1);
                }

                // Break inner loop if projectile destroyed
                if (!a.pierce || a.pierce <= 0) break;
            }
        }

        // Check block collision
        for (let j = blocks.length - 1; j >= 0; j--) {
            const b = blocks[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < a.size + BLOCK_SIZE / 2) {
                b.health -= 1;
                attacks.splice(i, 1);

                // Block hit particles
                for (let k = 0; k < 5; k++) {
                    const angle = Math.random() * Math.PI * 2;
                    particles.push({
                        x: b.x,
                        y: b.y,
                        vx: Math.cos(angle) * (50 + Math.random() * 50),
                        vy: Math.sin(angle) * (50 + Math.random() * 50),
                        life: 0.4,
                        maxLife: 0.4,
                        color: b.value === 1 ? COLORS.green : COLORS.orange,
                        size: 3,
                        type: 'spark'
                    });
                }

                if (b.health <= 0) {
                    const bitsDropped = b.value === 1 ? 3 : 1;
                    showMessage(`+${bitsDropped} Bits`, 1000);

                    for (let k = 0; k < bitsDropped; k++) {
                        spawnPickup(b.x, b.y, 'bit', 1);
                    }

                    blocks.splice(j, 1);
                }
                break;
            }
        }
    }

    // Update enemies
    for (const e of enemies) {
        e.phase += dt * 5;
        e.glitchTimer -= dt;
        if (e.glitchTimer < 0) e.glitchTimer = 0;

        const dx = player.x - e.x;
        const dy = player.y - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            e.x += (dx / dist) * e.speed * dt;
            e.y += (dy / dist) * e.speed * dt;
        }

        // Enemy collision with blocks
        for (const b of blocks) {
            const halfBlock = BLOCK_SIZE / 2;
            const closestX = Math.max(b.x - halfBlock, Math.min(e.x, b.x + halfBlock));
            const closestY = Math.max(b.y - halfBlock, Math.min(e.y, b.y + halfBlock));
            const bx = e.x - closestX;
            const by = e.y - closestY;
            const bDist = Math.sqrt(bx * bx + by * by);

            if (bDist < e.size) {
                if (bDist > 0) {
                    const overlap = e.size - bDist;
                    e.x += (bx / bDist) * overlap;
                    e.y += (by / bDist) * overlap;
                }
            }
        }

        if (dist < player.size + e.size && player.invulnerable <= 0) {
            player.health -= 10;
            player.invulnerable = 0.5;
            e.glitchTimer = 0.2;

            player.x -= (dx / dist) * 40;
            player.y -= (dy / dist) * 40;

            for (let k = 0; k < 12; k++) {
                const angle = Math.random() * Math.PI * 2;
                particles.push({
                    x: player.x,
                    y: player.y,
                    vx: Math.cos(angle) * (60 + Math.random() * 80),
                    vy: Math.sin(angle) * (60 + Math.random() * 80),
                    life: 0.4,
                    maxLife: 0.4,
                    color: COLORS.red,
                    size: 3,
                    type: 'spark'
                });
            }

            if (player.health <= 0) {
                game.dead = true;
                game.running = false;
            }
        }
    }

    // Update pickups
    for (let i = pickups.length - 1; i >= 0; i--) {
        const p = pickups[i];
        p.life -= dt;
        p.bobPhase += dt * 6;

        if (p.life <= 0) {
            pickups.splice(i, 1);
            continue;
        }

        // Check player collection
        const dx = player.x - p.x;
        const dy = player.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < player.size + 15) {
            if (p.type === 'bit') {
                player.bits += p.amount;
            } else {
                player.bytes += p.amount;
            }
            pickups.splice(i, 1);
        }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.94;
        p.vy *= 0.94;
        p.life -= dt;

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }

    // Spawn enemies
    // Removed duplicate polling logic in favor of dt-based timer above.

    // Legacy HUD removed
}

function toggleProfile() {
    player.profileOpen = !player.profileOpen;

    if (player.profileOpen) {
        profileView.classList.remove('hidden');
        game.paused = true;
        updateProfileView();
    } else {
        profileView.classList.add('hidden');
        game.paused = false;
    }
}

function updateProfileView() {
    uiElements.health.textContent = `${Math.floor(player.health)} / ${player.maxHealth}`;
    uiElements.stamina.textContent = `${Math.floor(player.stamina)} / ${player.maxStamina}`;
    uiElements.bits.textContent = player.bits;
    uiElements.bytes.textContent = player.bytes;

    // Commands list with mastery
    const commandsEl = uiElements.commands;
    if (commandsEl) {
        const entries = Object.keys(player.mastery).map(cmdId => {
            const cmd = COMMANDS[cmdId];
            if (!cmd) return '';
            const m = player.mastery[cmdId];
            const tier = getMasteryTier(m);
            const version = `v${(m / 100).toFixed(2)}`;
            const equipped = cmdId === player.equippedCommand ? ' ★' : '';
            // Show unlocked flags
            let flags = '';
            if (cmd.flags) {
                for (const [flag, info] of Object.entries(cmd.flags)) {
                    if (m >= info.mastery) flags += ` ${flag}`;
                }
            }
            return `<div class="skill-tag" style="color:${cmd.color}">${cmd.name}${equipped} ${version} (${tier})${flags}</div>`;
        });
        commandsEl.innerHTML = entries.join('');
    }
}

function render() {
    // Clear screen (always full screen, not translated)
    ctx.fillStyle = COLORS.darkBg;
    ctx.fillRect(0, 0, game.width, game.height);

    // Save context and apply camera transform
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // Draw circuit board traces (now relative to camera)
    drawCircuitBoard();

    // Draw terrain blocks
    for (const b of blocks) {
        drawBlock(b);
    }

    // Draw pickups
    for (const p of pickups) {
        drawPickup(p);
    }

    // Draw particles
    for (const p of particles) {
        const alpha = p.life / p.maxLife;
        ctx.globalAlpha = alpha;
        if (p.type === 'spark') {
            drawSpark(p.x, p.y, p.size, p.color);
        } else {
            drawFragment(p.x, p.y, p.size, p.color, p.life);
        }
    }
    ctx.globalAlpha = 1;

    // Draw attacks
    for (const a of attacks) {
        if (a.type === 'slash') {
            // Draw slash arc
            ctx.shadowBlur = 10;
            ctx.shadowColor = COLORS.orange;
            ctx.beginPath();
            ctx.arc(player.x, player.y, a.size, a.angle - a.arc / 2, a.angle + a.arc / 2);
            ctx.strokeStyle = COLORS.orange;
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.shadowBlur = 0;
        } else if (a.type === 'burst') {
            // Draw burst ring
            ctx.shadowBlur = 15;
            ctx.shadowColor = COLORS.magenta;
            ctx.beginPath();
            ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2);
            ctx.strokeStyle = COLORS.magenta;
            ctx.lineWidth = 2;
            ctx.stroke();
            // Inner fill
            ctx.fillStyle = `rgba(255, 0, 255, 0.1)`;
            ctx.fill();
            ctx.shadowBlur = 0;
        } else {
            // Standard packet
            drawDataPacket(a);
        }
    }

    // Draw enemies
    for (const e of enemies) {
        drawZombieProcess(e);
    }

    // Draw player
    drawPlayer();

    // Restore context (remove camera transform)
    ctx.restore();

    // UI elements are drawn without camera offset (screen-space)
    // Draw touch controls visual (mobile)
    if (touch.leftActive) {
        drawTouchJoystick();
    }
}

function drawTouchJoystick() {
    const radius = touch.joystickRadius;

    // Base circle (where touch started)
    ctx.beginPath();
    ctx.arc(touch.leftStartX, touch.leftStartY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
    ctx.fill();

    // Calculate stick position (clamped to radius)
    let dx = touch.leftCurrentX - touch.leftStartX;
    let dy = touch.leftCurrentY - touch.leftStartY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > radius) {
        dx = (dx / dist) * radius;
        dy = (dy / dist) * radius;
    }

    // Stick circle (current position)
    ctx.beginPath();
    ctx.arc(touch.leftStartX + dx, touch.leftStartY + dy, 25, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
    ctx.shadowColor = COLORS.cyan;
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;
}

function drawCircuitBoard() {
    const gridSize = BLOCK_SIZE;
    const w = game.worldWidth;
    const h = game.worldHeight;

    // Main grid (PCB traces)
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;

    for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
    }

    for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
    }

    // Circuit traces (thicker, with nodes)
    ctx.strokeStyle = COLORS.trace;
    ctx.lineWidth = 2;

    // Horizontal traces
    for (let y = gridSize * 2; y < h; y += gridSize * 3) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();

        // Via/node points
        for (let x = gridSize; x < w; x += gridSize * 2) {
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fillStyle = COLORS.copper;
            ctx.fill();
        }
    }

    // Vertical traces
    for (let x = gridSize * 2; x < w; x += gridSize * 4) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
    }
}

function drawBlock(b) {
    const size = BLOCK_SIZE;
    const halfSize = size / 2;
    const healthRatio = b.health / b.maxHealth;

    ctx.save();
    ctx.translate(b.x, b.y);

    // Block outline (memory cell style)
    ctx.beginPath();
    ctx.rect(-halfSize, -halfSize, size, size);

    const color = b.value === 1 ? COLORS.green : COLORS.orange;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.stroke();

    // Fill based on health
    ctx.fillStyle = `rgba(${b.value === 1 ? '0, 255, 0' : '255, 102, 0'}, ${0.1 + healthRatio * 0.2})`;
    ctx.fill();

    // Binary value display
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 10;
    ctx.fillText(b.value.toString(), 0, 0);

    // Corner pins (like IC pins)
    ctx.shadowBlur = 0;
    ctx.fillStyle = COLORS.copper;
    const pinSize = 3;
    ctx.fillRect(-halfSize - pinSize, -halfSize + 5, pinSize, 4);
    ctx.fillRect(-halfSize - pinSize, halfSize - 9, pinSize, 4);
    ctx.fillRect(halfSize, -halfSize + 5, pinSize, 4);
    ctx.fillRect(halfSize, halfSize - 9, pinSize, 4);

    ctx.restore();
    ctx.shadowBlur = 0;
}

function drawPickup(p) {
    const bob = Math.sin(p.bobPhase) * 3;
    const alpha = p.life < 2 ? p.life / 2 : 1;
    ctx.globalAlpha = alpha;

    ctx.save();
    ctx.translate(p.x, p.y + bob);

    if (p.type === 'bit') {
        // Bit = small square with 1/0
        ctx.strokeStyle = COLORS.cyan;
        ctx.lineWidth = 2;
        ctx.shadowColor = COLORS.cyan;
        ctx.shadowBlur = 10;
        ctx.strokeRect(-6, -6, 12, 12);

        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = COLORS.cyan;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('1', 0, 0);
    } else {
        // Byte = small chip/rectangle
        ctx.strokeStyle = COLORS.gold;
        ctx.lineWidth = 2;
        ctx.shadowColor = COLORS.gold;
        ctx.shadowBlur = 10;
        ctx.strokeRect(-8, -5, 16, 10);

        // Pins
        ctx.fillStyle = COLORS.copper;
        for (let i = -6; i <= 6; i += 4) {
            ctx.fillRect(i - 1, -7, 2, 2);
            ctx.fillRect(i - 1, 5, 2, 2);
        }
    }

    ctx.restore();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
}

function drawSpark(x, y, size, color) {
    // Electric spark - small line segments
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.random() * Math.PI * 2);

    ctx.beginPath();
    ctx.moveTo(-size * 2, 0);
    ctx.lineTo(0, size);
    ctx.lineTo(size * 2, 0);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.shadowColor = color;
    ctx.shadowBlur = 5;
    ctx.stroke();

    ctx.restore();
    ctx.shadowBlur = 0;
}

function drawFragment(x, y, size, color, life) {
    // Small square fragment
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 5;
    ctx.fillRect(x - size / 2, y - size / 2, size, size);
    ctx.shadowBlur = 0;
}

function drawDataPacket(a) {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(Math.atan2(a.vy, a.vx));

    // Packet shape (arrow-like)
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-6, -5);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-6, 5);
    ctx.closePath();

    ctx.fillStyle = COLORS.cyan;
    ctx.shadowColor = COLORS.cyan;
    ctx.shadowBlur = 15;
    ctx.fill();

    // Trail
    ctx.beginPath();
    ctx.moveTo(-3, 0);
    ctx.lineTo(-20, 0);
    ctx.strokeStyle = COLORS.cyan;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.5;
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.restore();
    ctx.shadowBlur = 0;
}

function drawPlayer() {
    const { x, y, size, invulnerable, pulsePhase, facingAngle, health, maxHealth, stamina, maxStamina } = player;

    // Calculate ratios
    const healthRatio = health / maxHealth;
    const staminaRatio = stamina / maxStamina;
    const pulse = 1 + Math.sin(pulsePhase) * 0.03;

    // Handle invulnerability flashing
    if (invulnerable > 0 && Math.floor(invulnerable * 20) % 2 === 0) {
        ctx.globalAlpha = 0.4;
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(facingAngle);

    const s = size * pulse;

    // Vertices order: 0=Front, 1=BottomRight, 2=BottomLeft, 3=Back, 4=TopLeft, 5=TopRight
    const hexVerts = [];
    for (let i = 0; i < 6; i++) {
        const angle = i * Math.PI / 3;
        hexVerts.push({
            x: Math.cos(angle) * s,
            y: Math.sin(angle) * s
        });
    }

    // Helper to draw a solid bar along a path
    // pathPoints: array of vertices defining the path
    // progress: 0.0 to 1.0 (fill amount)
    // color: fill color
    // maxCoverage: 0.0 to 1.0 (how much of the path is available to be filled - e.g. 0.85 stops short)
    function drawSolidBar(pathPoints, progress, color) {
        const barWidth = s * 0.15; // Width of the solid bar

        // We draw the "Filled" portion
        // And we draw a "Container" background

        // Let's build a custom shape for the bar
        // We need to offset the path inwards to create thickness

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // 1. Draw Container (Dim Background)
        // Draw the full available path (e.g. up to 85%)
        ctx.beginPath();
        ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
        for (let i = 1; i < pathPoints.length; i++) {
            ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
        }
        ctx.strokeStyle = 'rgba(0, 50, 50, 0.3)';
        ctx.lineWidth = barWidth;
        ctx.stroke();

        // 2. Draw Fill
        if (progress > 0.01) {
            // We need to stroke only a portion of the path
            // Simple approach: Iterate segments

            // Calculate total length of this specific path
            let currentLen = 0;
            const dists = [0];
            for (let i = 0; i < pathPoints.length - 1; i++) {
                const d = Math.sqrt(Math.pow(pathPoints[i + 1].x - pathPoints[i].x, 2) + Math.pow(pathPoints[i + 1].y - pathPoints[i].y, 2));
                currentLen += d;
                dists.push(currentLen);
            }

            const fillLen = currentLen * progress;

            ctx.beginPath();
            ctx.moveTo(pathPoints[0].x, pathPoints[0].y);

            // Walk segments to find end point
            for (let i = 0; i < pathPoints.length - 1; i++) {
                if (fillLen > dists[i]) {
                    // We are in or past this segment
                    if (fillLen >= dists[i + 1]) {
                        // Fully cover this segment
                        ctx.lineTo(pathPoints[i + 1].x, pathPoints[i + 1].y);
                    } else {
                        // Partial segment coverage
                        const segLen = dists[i + 1] - dists[i];
                        const segProgress = (fillLen - dists[i]) / segLen;
                        const p1 = pathPoints[i];
                        const p2 = pathPoints[i + 1];
                        const px = p1.x + (p2.x - p1.x) * segProgress;
                        const py = p1.y + (p2.y - p1.y) * segProgress;
                        ctx.lineTo(px, py);
                        break; // Stop after partial
                    }
                }
            }

            ctx.strokeStyle = color;
            ctx.lineWidth = barWidth;
            ctx.shadowColor = color;
            ctx.shadowBlur = 10;
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
    }

    // Define Paths for stamina bar on outer frame
    // Stamina wraps around the full outer hex (both sides)
    const gapRatio = 0.15; // 15% gap at front
    const lerp = (p1, p2, t) => ({ x: p1.x + (p2.x - p1.x) * t, y: p1.y + (p2.y - p1.y) * t });

    // Left half: Back(3) -> TopLeft(4) -> TopRight(5) -> towards Front(0)
    const leftEnd = lerp(hexVerts[5], hexVerts[0], 1.0 - gapRatio);
    const leftPath = [hexVerts[3], hexVerts[4], hexVerts[5], leftEnd];

    // Right half: Back(3) -> BottomLeft(2) -> BottomRight(1) -> towards Front(0)
    const rightEnd = lerp(hexVerts[1], hexVerts[0], 1.0 - gapRatio);
    const rightPath = [hexVerts[3], hexVerts[2], hexVerts[1], rightEnd];

    const barScale = 0.85;
    const scalePt = (p) => ({ x: p.x * barScale, y: p.y * barScale });

    // Draw stamina (yellow) on both sides of outer frame
    drawSolidBar(leftPath.map(scalePt), staminaRatio, COLORS.yellow);
    drawSolidBar(rightPath.map(scalePt), staminaRatio, COLORS.yellow);

    // === OUTER HEXAGON FRAME ===
    ctx.beginPath();
    ctx.moveTo(hexVerts[0].x, hexVerts[0].y);
    for (let i = 1; i < 6; i++) {
        ctx.lineTo(hexVerts[i].x, hexVerts[i].y);
    }
    ctx.closePath();
    ctx.strokeStyle = COLORS.cyan;
    ctx.lineWidth = 2; // Thinner/crisper
    ctx.shadowColor = COLORS.cyan;
    ctx.shadowBlur = 6;
    ctx.stroke();

    // === INNER SHAPE (Center Health) ===
    // User wants: inner hex front vertex (0) intersects outer hex top vertex (0)
    // Other vertices scaled down.
    const innerScale = 0.70; // Larger for visibility
    const innerHex = [];

    // 0 is Front. 3 is Back.
    for (let i = 0; i < 6; i++) {
        if (i === 0) {
            // Front spans all the way to outer vertex
            innerHex.push(hexVerts[0]);
        } else {
            innerHex.push({
                x: hexVerts[i].x * innerScale,
                y: hexVerts[i].y * innerScale
            });
        }
    }

    ctx.save();
    // Clip to inner hex
    ctx.beginPath();
    ctx.moveTo(innerHex[0].x, innerHex[0].y);
    for (let i = 1; i < 6; i++) {
        ctx.lineTo(innerHex[i].x, innerHex[i].y);
    }
    ctx.closePath();
    ctx.clip();

    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fill();

    // Health Fill (Drains Front-to-Back)
    // Use X-axis clipping.
    // Range is approx -s*scale (Back) to +s (Front).
    // Total width = s + s*innerScale = s * (1 + 0.7) = 1.7s
    const totalW = s * (1 + innerScale);
    const backX = -s * innerScale;
    const currentW = totalW * healthRatio;

    ctx.fillStyle = 'rgba(255, 0, 255, 0.5)'; // Magenta
    ctx.fillRect(backX, -s, currentW, 2 * s); // Fill from back towards front

    ctx.restore();

    // === MOLECULAR NETWORK (Static Overlay) ===
    const centerNode = { x: 0, y: 0 };
    ctx.shadowBlur = 0;

    // Edges
    for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(centerNode.x, centerNode.y);
        ctx.lineTo(innerHex[i].x, innerHex[i].y);
        ctx.strokeStyle = 'rgba(255, 0, 255, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    // Perimeter
    ctx.beginPath();
    ctx.moveTo(innerHex[0].x, innerHex[0].y);
    for (let i = 1; i < 6; i++) {
        ctx.lineTo(innerHex[i].x, innerHex[i].y);
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(255, 0, 255, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Nodes
    for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.arc(innerHex[i].x, innerHex[i].y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 0, 255, 0.8)';
        ctx.fill();
    }

    // Center Node
    ctx.beginPath();
    ctx.arc(0, 0, 3.5 * pulse, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.cyan;
    ctx.shadowColor = COLORS.cyan;
    ctx.shadowBlur = 8;
    ctx.fill();

    // === ATTACK INDICATOR ===
    if (player.attacking) {
        const attackDelta = player.attackAngle - facingAngle;
        ctx.save();
        ctx.rotate(attackDelta);
        ctx.beginPath();
        ctx.moveTo(s * 1.2, 0);
        ctx.lineTo(s * 1.5, -4);
        ctx.lineTo(s * 1.7, 0);
        ctx.lineTo(s * 1.5, 4);
        ctx.closePath();
        ctx.fillStyle = COLORS.cyan;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.restore();
    }

    ctx.restore();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
}

function drawZombieProcess(e) {
    const { x, y, size, phase, health, maxHealth, glitchTimer } = e;

    ctx.save();
    ctx.translate(x, y);

    // Glitch offset when hit
    if (glitchTimer > 0) {
        ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
    }

    // Corrupted circuit shape
    ctx.beginPath();
    // Irregular octagon with corruption
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 - Math.PI / 8;
        const corruption = Math.sin(phase + i * 1.5) * 3;
        const r = size + corruption;
        const px = Math.cos(angle) * r;
        const py = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();

    ctx.strokeStyle = COLORS.magenta;
    ctx.lineWidth = 2;
    ctx.shadowColor = COLORS.magenta;
    ctx.shadowBlur = 12;
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 0, 255, 0.15)';
    ctx.fill();

    // Corrupted internal traces (glitchy pattern)
    ctx.beginPath();
    const glitchOffset = Math.sin(phase * 2) * 2;
    ctx.moveTo(-size * 0.6 + glitchOffset, -size * 0.3);
    ctx.lineTo(size * 0.4, size * 0.1);
    ctx.moveTo(-size * 0.3, size * 0.5 + glitchOffset);
    ctx.lineTo(size * 0.5 + glitchOffset, -size * 0.4);
    ctx.moveTo(0, -size * 0.6);
    ctx.lineTo(glitchOffset, size * 0.4);
    ctx.strokeStyle = COLORS.magenta;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.7;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // "ZOMBIE" indicator - dead process symbol
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = COLORS.magenta;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 8;
    ctx.fillText('Z', 0, 0);

    // Health bar
    if (health < maxHealth) {
        ctx.shadowBlur = 0;
        const barWidth = size * 2;
        const barHeight = 4;
        ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
        ctx.fillRect(-barWidth / 2, -size - 14, barWidth, barHeight);
        ctx.fillStyle = COLORS.red;
        ctx.fillRect(-barWidth / 2, -size - 14, barWidth * (health / maxHealth), barHeight);
    }

    ctx.restore();
    ctx.shadowBlur = 0;
}

// Death screen restart button bounds (for touch detection)
const deathRestartButton = { x: 0, y: 0, width: 200, height: 60 };

// Render death screen with restart button
function renderDeathScreen() {
    // Dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, game.width, game.height);

    const centerX = game.width / 2;
    const centerY = game.height / 2;
    const isMobile = game.width < 500;

    // Title - responsive font size
    ctx.font = isMobile ? 'bold 24px Orbitron, monospace' : 'bold 36px Orbitron, monospace';
    ctx.fillStyle = COLORS.red;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = COLORS.red;
    ctx.shadowBlur = 20;

    if (isMobile) {
        ctx.fillText('KERNEL', centerX, centerY - 100);
        ctx.fillText('PANIC', centerX, centerY - 65);
    } else {
        ctx.fillText('KERNEL PANIC', centerX, centerY - 80);
    }

    // Subtitle
    ctx.font = isMobile ? '14px monospace' : '18px monospace';
    ctx.fillStyle = COLORS.white;
    ctx.shadowBlur = 0;
    ctx.fillText('Process crashed.', centerX, centerY - 20);

    // Restart button - larger and responsive
    const btnWidth = Math.min(280, game.width - 40);
    const btnHeight = 70;
    const btnX = centerX - btnWidth / 2;
    const btnY = centerY + 30;

    // Store button bounds for touch detection
    deathRestartButton.x = btnX;
    deathRestartButton.y = btnY;
    deathRestartButton.width = btnWidth;
    deathRestartButton.height = btnHeight;

    // Button background
    ctx.strokeStyle = COLORS.cyan;
    ctx.lineWidth = 3;
    ctx.shadowColor = COLORS.cyan;
    ctx.shadowBlur = 15;
    ctx.strokeRect(btnX, btnY, btnWidth, btnHeight);
    ctx.fillStyle = 'rgba(0, 255, 255, 0.2)';
    ctx.fillRect(btnX, btnY, btnWidth, btnHeight);

    // Button text
    ctx.font = 'bold 28px Orbitron, monospace';
    ctx.fillStyle = COLORS.cyan;
    ctx.fillText('REBOOT', centerX, btnY + btnHeight / 2);

    ctx.shadowBlur = 0;
}

// Reset game to initial state
function restartGame() {
    // IMMEDIATELY clear death state - must be first!
    game.dead = false;
    game.running = true;
    game.paused = false;

    // Reset player
    player.x = game.worldWidth / 2;
    player.y = game.worldHeight / 2;
    player.maxHealth = 100;
    player.maxStamina = 100;
    player.health = player.maxHealth;
    player.stamina = player.maxStamina;
    player.mastery = { kill: 0, rm: 0 };
    player.equippedCommand = 'kill';
    player.attackCooldown = 0;

    // Clear entities
    enemies.length = 0;
    attacks.length = 0; // Was projectiles
    particles.length = 0;
    pickups.length = 0;
    // damageNumbers removed as not implemented yet

    // Reset game state
    game.time = 0;

    // Regenerate terrain and spawn enemies
    generateBlocks();
    for (let i = 0; i < 5; i++) spawnEnemy();

    showMessage('SYSTEM REBOOTED', 2000);

    // Restart the game loop (in case it had stopped)
    // requestAnimationFrame(gameLoop); // Removed to prevent duplicate loops
}


// Start the game
init();
