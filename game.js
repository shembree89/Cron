// Cron - /tmp/ Zone Demo
// Circuit/Computing themed vector graphics game

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// UI Elements
const healthBar = document.getElementById('health-bar');
const staminaBar = document.getElementById('stamina-bar');
const xpCounter = document.getElementById('xp-counter');
const messageBox = document.getElementById('message-box');

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
    darkBg: '#050a08'
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

// XP milestones for leveling up
// XP milestones for leveling up (extended to 20 levels, slower progression)
const XP_MILESTONES = [
    0,      // Level 1 (start)
    30,     // Level 2
    75,     // Level 3
    140,    // Level 4
    230,    // Level 5
    350,    // Level 6
    500,    // Level 7
    700,    // Level 8
    950,    // Level 9
    1250,   // Level 10
    1600,   // Level 11
    2000,   // Level 12
    2500,   // Level 13
    3100,   // Level 14
    3800,   // Level 15
    4600,   // Level 16
    5500,   // Level 17
    6500,   // Level 18
    7600,   // Level 19
    9000    // Level 20
];

// Skill Tree - Three paths with Linux command-style options
const SKILL_TREE = {
    bash: {
        name: 'Bash',
        color: '#ff6600',
        description: 'Melee combat - high risk, high reward',
        abilities: [
            { id: 'kill-f', name: 'kill -f', desc: 'Force kill: +50% melee damage', tier: 1, effect: { meleeDamage: 1.5 } },
            { id: 'kill-9', name: 'kill -9', desc: 'SIGKILL: Instant kill enemies below 20% HP', tier: 2, requires: 'kill-f', effect: { executeThreshold: 0.2 } },
            { id: 'chmod-x', name: 'chmod +x', desc: 'Execute permission: +25% attack speed', tier: 2, requires: 'kill-f', effect: { attackSpeed: 0.75 } },
            { id: 'sudo-bash', name: 'sudo bash', desc: 'Root shell: Double damage, costs 2x stamina', tier: 3, requires: 'kill-9', effect: { sudoMode: true } },
            { id: 'rm-rf', name: 'rm -rf', desc: 'Recursive force: Attacks hit in a cone', tier: 3, requires: 'chmod-x', effect: { coneAttack: true } }
        ]
    },
    ping: {
        name: 'Ping',
        color: '#00ff00',
        description: 'Ranged combat - precision and stealth',
        abilities: [
            { id: 'ping-c', name: 'ping -c', desc: 'Count: Projectiles pierce 1 enemy', tier: 1, effect: { pierce: 1 } },
            { id: 'ping-i', name: 'ping -i', desc: 'Interval: Faster projectile speed', tier: 2, requires: 'ping-c', effect: { projectileSpeed: 1.5 } },
            { id: 'curl-s', name: 'curl -s', desc: 'Silent: Move faster while not attacking', tier: 2, requires: 'ping-c', effect: { stealthSpeed: 1.3 } },
            { id: 'ssh-p', name: 'ssh -p', desc: 'Port forward: Projectiles bounce off walls', tier: 3, requires: 'ping-i', effect: { bounceShots: true } },
            { id: 'wget-q', name: 'wget -q', desc: 'Quiet mode: Attacks don\'t alert nearby enemies', tier: 3, requires: 'curl-s', effect: { silentKills: true } }
        ]
    },
    init: {
        name: 'Init',
        color: '#ff00ff',
        description: 'Summoner/AoE - spawn processes to fight for you',
        abilities: [
            { id: 'fork-n', name: 'fork -n', desc: 'New process: Spawn a helper drone', tier: 1, effect: { maxDrones: 1 } },
            { id: 'fork-d', name: 'fork -d', desc: 'Daemon mode: Drones last longer', tier: 2, requires: 'fork-n', effect: { droneDuration: 2 } },
            { id: 'nohup', name: 'nohup', desc: 'No hangup: Drones don\'t die when you\'re hit', tier: 2, requires: 'fork-n', effect: { persistentDrones: true } },
            { id: 'xargs-p', name: 'xargs -P', desc: 'Parallel: Spawn 2 drones at once', tier: 3, requires: 'fork-d', effect: { maxDrones: 3 } },
            { id: 'systemctl', name: 'systemctl', desc: 'Service manager: Drones auto-respawn', tier: 3, requires: 'nohup', effect: { autoRespawn: true } }
        ]
    }
};

// Player - represents a microprocessor/chip
const player = {
    x: 0,
    y: 0,
    size: 24,
    speed: 250,
    health: 100,
    maxHealth: 100,
    stamina: 100,
    maxStamina: 100,
    xp: 0,
    level: 1,
    skillPoints: 0,
    unlockedAbilities: [], // Array of ability IDs
    bits: 0,
    bytes: 0,
    attacking: false,
    attackCooldown: 0,
    attackDuration: 0,
    attackAngle: 0,
    facingAngle: 0,
    invulnerable: 0,
    vx: 0,
    vy: 0,
    pulsePhase: 0
};

// Level-up menu state
let levelUpMenu = {
    active: false,
    selectedPath: null,
    availableAbilities: []
};

// Terrain blocks
let blocks = [];
const BLOCK_SIZE = 40;

// Enemies
let enemies = [];
const ENEMY_SPAWN_INTERVAL = 3000;
let lastSpawn = 0;
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

        // Handle level-up menu taps
        if (levelUpMenu.active) {
            handleLevelUpMenuTap(x, y);
            return; // Don't process as game input
        }

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

// Handle taps on the level-up menu
function handleLevelUpMenuTap(x, y) {
    if (levelUpMenu.selectedPath === null) {
        // Check path buttons
        for (const btn of levelUpButtons.paths) {
            if (x >= btn.x && x <= btn.x + btn.width && y >= btn.y && y <= btn.y + btn.height) {
                selectPath(btn.pathId);
                return;
            }
        }
    } else {
        // Check back button
        const back = levelUpButtons.backButton;
        if (x >= back.x && x <= back.x + back.width && y >= back.y && y <= back.y + back.height) {
            levelUpMenu.selectedPath = null;
            return;
        }

        // Check ability buttons
        for (const btn of levelUpButtons.abilities) {
            if (x >= btn.x && x <= btn.x + btn.width && y >= btn.y && y <= btn.y + btn.height) {
                const ability = levelUpMenu.availableAbilities[btn.index];
                unlockAbility(ability);
                return;
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
            showMessage('Joystick activated', 500);
        } else if (!isLeftSide && !touch.rightActive) {
            // Right side - attack swipe
            touch.rightActive = true;
            touch.rightId = t.identifier;
            touch.rightStartX = x;
            touch.rightStartY = y;
            showMessage('Attack swipe started', 500);
        }
    }
}

function handleTouchMove(e) {
    e.preventDefault();
    for (const t of e.changedTouches) {
        if (t.identifier === touch.leftId) {
            touch.leftCurrentX = t.clientX;
            touch.leftCurrentY = t.clientY;

            // Calculate joystick direction
            const dx = touch.leftCurrentX - touch.leftStartX;
            const dy = touch.leftCurrentY - touch.leftStartY;
            const dist = Math.sqrt(dx * dx + dy * dy);

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
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        attack(mouseX, mouseY);
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
    // Handle level-up menu
    if (levelUpMenu.active && pressed) {
        if (levelUpMenu.selectedPath === null) {
            // Select a path
            if (key === '1') selectPath('bash');
            else if (key === '2') selectPath('ping');
            else if (key === '3') selectPath('init');
        } else {
            // Select an ability or go back
            if (key === 'Escape' || key === 'Backspace') {
                levelUpMenu.selectedPath = null;
            } else if (key >= '1' && key <= '5') {
                const index = parseInt(key) - 1;
                if (index < levelUpMenu.availableAbilities.length) {
                    unlockAbility(levelUpMenu.availableAbilities[index]);
                }
            }
        }
        return;
    }

    switch (key.toLowerCase()) {
        case 'w': case 'arrowup': keys.up = pressed; break;
        case 's': case 'arrowdown': keys.down = pressed; break;
        case 'a': case 'arrowleft': keys.left = pressed; break;
        case 'd': case 'arrowright': keys.right = pressed; break;
        case ' ': keys.attack = pressed; break;
    }
}

function selectPath(pathId) {
    levelUpMenu.selectedPath = pathId;
    updateAvailableAbilities();
}

function updateAvailableAbilities() {
    if (!levelUpMenu.selectedPath) {
        levelUpMenu.availableAbilities = [];
        return;
    }

    const path = SKILL_TREE[levelUpMenu.selectedPath];
    levelUpMenu.availableAbilities = path.abilities.filter(ability => {
        // Already unlocked?
        if (player.unlockedAbilities.includes(ability.id)) return false;
        // Check requirements
        if (ability.requires && !player.unlockedAbilities.includes(ability.requires)) return false;
        return true;
    });
}

function unlockAbility(ability) {
    if (player.skillPoints <= 0) return;

    player.skillPoints--;
    player.unlockedAbilities.push(ability.id);
    showMessage(`Unlocked: ${ability.name}`, 2000);

    // Close menu if no more skill points
    if (player.skillPoints <= 0) {
        levelUpMenu.active = false;
        levelUpMenu.selectedPath = null;
        game.paused = false;
    } else {
        // Stay in menu, update available abilities
        updateAvailableAbilities();
        // If no more abilities available in this path, go back to path selection
        if (levelUpMenu.availableAbilities.length === 0) {
            levelUpMenu.selectedPath = null;
        }
    }
}

function checkLevelUp() {
    const nextLevel = player.level;
    if (nextLevel < XP_MILESTONES.length && player.xp >= XP_MILESTONES[nextLevel]) {
        player.level++;
        player.skillPoints++;
        showMessage(`LEVEL UP! Level ${player.level} - Press any key to choose ability`, 3000);
        levelUpMenu.active = true;
        levelUpMenu.selectedPath = null;
        game.paused = true;
    }
}

// Helper to check if player has an ability
function hasAbility(abilityId) {
    return player.unlockedAbilities.includes(abilityId);
}

// Get computed player stats based on abilities
function getPlayerStats() {
    let stats = {
        damage: 15,
        attackSpeed: 0.3,  // cooldown in seconds
        projectileSpeed: 700,
        moveSpeed: player.speed,
        pierce: 0,
        executeThreshold: 0,
        coneAttack: false,
        bounceShots: false
    };

    // Bash abilities
    if (hasAbility('kill-f')) stats.damage *= 1.5;
    if (hasAbility('chmod-x')) stats.attackSpeed *= 0.75;
    if (hasAbility('kill-9')) stats.executeThreshold = 0.2;
    if (hasAbility('sudo-bash')) stats.damage *= 2; // Note: should cost 2x stamina
    if (hasAbility('rm-rf')) stats.coneAttack = true;

    // Ping abilities
    if (hasAbility('ping-c')) stats.pierce += 1;
    if (hasAbility('ping-i')) stats.projectileSpeed *= 1.5;
    if (hasAbility('curl-s') && !player.attacking) stats.moveSpeed *= 1.3;
    if (hasAbility('ssh-p')) stats.bounceShots = true;

    // Init abilities (drones handled separately)

    return stats;
}

function attack(targetX, targetY) {
    const stats = getPlayerStats();
    const staminaCost = hasAbility('sudo-bash') ? 20 : 10;

    if (player.attackCooldown > 0 || player.stamina < staminaCost) return;

    player.stamina -= staminaCost;
    player.attackCooldown = stats.attackSpeed;
    player.attacking = true;
    player.attackDuration = 0.15;
    player.attackAngle = Math.atan2(targetY - player.y, targetX - player.x);

    // Create data packet projectile(s)
    if (stats.coneAttack) {
        // rm -rf: Fire 3 projectiles in a cone
        for (let i = -1; i <= 1; i++) {
            const spreadAngle = player.attackAngle + i * 0.25;
            attacks.push({
                x: player.x,
                y: player.y,
                vx: Math.cos(spreadAngle) * stats.projectileSpeed,
                vy: Math.sin(spreadAngle) * stats.projectileSpeed,
                life: 0.6,
                size: 6,
                type: 'packet',
                damage: stats.damage * 0.6,
                pierce: stats.pierce,
                bounces: stats.bounceShots ? 2 : 0,
                executeThreshold: stats.executeThreshold
            });
        }
    } else {
        // Single projectile
        attacks.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(player.attackAngle) * stats.projectileSpeed,
            vy: Math.sin(player.attackAngle) * stats.projectileSpeed,
            life: 0.6,
            size: 6,
            type: 'packet',
            damage: stats.damage,
            pierce: stats.pierce,
            bounces: stats.bounceShots ? 2 : 0,
            executeThreshold: stats.executeThreshold
        });
    }

    // Spark particles
    for (let i = 0; i < 6; i++) {
        const spread = (Math.random() - 0.5) * 0.4;
        particles.push({
            x: player.x + Math.cos(player.attackAngle) * player.size,
            y: player.y + Math.sin(player.attackAngle) * player.size,
            vx: Math.cos(player.attackAngle + spread) * (150 + Math.random() * 100),
            vy: Math.sin(player.attackAngle + spread) * (150 + Math.random() * 100),
            life: 0.25,
            maxLife: 0.25,
            color: COLORS.cyan,
            size: 2,
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
    game.deltaTime = Math.min((timestamp - game.lastTime) / 1000, 0.1);
    game.lastTime = timestamp;
    game.time += game.deltaTime;

    if (!game.paused) {
        update();
    }
    render();

    // Draw level-up menu on top if active
    if (levelUpMenu.active) {
        renderLevelUpMenu();
    }

    // Draw death screen on top if dead
    if (game.dead) {
        renderDeathScreen();
    }

    // Keep running even when dead (to show death screen) or paused
    if (game.running || game.dead) {
        requestAnimationFrame(gameLoop);
    }
}

function update() {
    const dt = game.deltaTime;

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

    // Calculate move speed (curl -s gives speed boost when not attacking)
    let moveSpeed = player.speed;
    if (hasAbility('curl-s') && !player.attacking) {
        moveSpeed *= 1.3;
    }

    player.x += player.vx * moveSpeed * dt;
    player.y += player.vy * moveSpeed * dt;

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

            if (dist < a.size + e.size) {
                // Use projectile's damage value
                const damage = a.damage || 15;

                // Execute threshold check (kill -9)
                if (a.executeThreshold && (e.health / e.maxHealth) <= a.executeThreshold) {
                    e.health = 0; // Instant kill
                    showMessage('SIGKILL!', 800);
                } else {
                    e.health -= damage;
                }

                // Pierce logic - decrement pierce count instead of removing
                if (a.pierce && a.pierce > 0) {
                    a.pierce--;
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

                if (e.health <= 0) {
                    player.xp += e.pid;
                    checkLevelUp();
                    showMessage(`+${e.pid} PID  +${e.bytes} Bytes`, 1500);

                    // Spawn byte pickups
                    for (let k = 0; k < e.bytes; k++) {
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
                break;
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
    if (Date.now() - lastSpawn > ENEMY_SPAWN_INTERVAL) {
        spawnEnemy();
        lastSpawn = Date.now();
    }

    // Update UI
    healthBar.style.width = (player.health / player.maxHealth * 100) + '%';
    staminaBar.style.width = (player.stamina / player.maxStamina * 100) + '%';
    const nextLevelXP = player.level < XP_MILESTONES.length ? XP_MILESTONES[player.level] : '∞';
    xpCounter.textContent = `Lv${player.level} | XP: ${player.xp}/${nextLevelXP} | Bits: ${player.bits} | Bytes: ${player.bytes}`;
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

    // Draw attacks (data packets)
    for (const a of attacks) {
        drawDataPacket(a);
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
    const { x, y, size, invulnerable, pulsePhase, facingAngle, health, maxHealth, stamina, maxStamina, xp, level } = player;

    // Calculate ratios
    const prevLevelXP = level > 0 ? XP_MILESTONES[level - 1] || 0 : 0;
    const nextLevelXP = level < XP_MILESTONES.length ? XP_MILESTONES[level] : XP_MILESTONES[XP_MILESTONES.length - 1];
    const xpForThisLevel = nextLevelXP - prevLevelXP;
    const xpProgress = xpForThisLevel > 0 ? Math.min(1, Math.max(0, (xp - prevLevelXP) / xpForThisLevel)) : 0;
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

    // Define Paths
    // We want the bars to stop at ~85% towards the Front (Vertex 0).
    const gapRatio = 0.15; // 15% gap at front

    // Helper to get a point partway along a segment
    const lerp = (p1, p2, t) => ({ x: p1.x + (p2.x - p1.x) * t, y: p1.y + (p2.y - p1.y) * t });

    // XP Path (Left): Back(3) -> TopLeft(4) -> TopRight(5) -> towards Front(0)
    // Last segment is 5->0. We stop at 1-gapRatio.
    const xpEndPoint = lerp(hexVerts[5], hexVerts[0], 1.0 - gapRatio);
    const xpPath = [hexVerts[3], hexVerts[4], hexVerts[5], xpEndPoint];

    // Stamina Path (Right): Back(3) -> BottomLeft(2) -> BottomRight(1) -> towards Front(0)
    // Last segment is 1->0. We stop at 1-gapRatio.
    const staEndPoint = lerp(hexVerts[1], hexVerts[0], 1.0 - gapRatio);
    const staPath = [hexVerts[3], hexVerts[2], hexVerts[1], staEndPoint];

    // Shift path inwards slightly so it flows INSIDE the outer frame
    // A simple uniform scale works for a hexagon centered at 0
    const barScale = 0.85;
    const scalePt = (p) => ({ x: p.x * barScale, y: p.y * barScale });

    const xpPathScaled = xpPath.map(scalePt);
    const staPathScaled = staPath.map(scalePt);

    // Draw Bars
    drawSolidBar(xpPathScaled, xpProgress, '#4488ff');
    drawSolidBar(staPathScaled, staminaRatio, COLORS.green);

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
        ctx.fillText('PROCESS', centerX, centerY - 100);
        ctx.fillText('TERMINATED', centerX, centerY - 65);
    } else {
        ctx.fillText('PROCESS TERMINATED', centerX, centerY - 80);
    }

    // Subtitle
    ctx.font = isMobile ? '14px monospace' : '18px monospace';
    ctx.fillStyle = COLORS.white;
    ctx.shadowBlur = 0;
    ctx.fillText(`PID gained: ${player.xp}`, centerX, centerY - 20);

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
    ctx.fillText('RESTART', centerX, btnY + btnHeight / 2);

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
    player.health = player.maxHealth;
    player.stamina = player.maxStamina;
    player.xp = 0;
    player.level = 0;
    player.skillPoints = 0;
    player.unlockedAbilities = [];
    player.attackCooldown = 0;

    // Clear entities
    enemies.length = 0;
    projectiles.length = 0;
    particles.length = 0;
    pickups.length = 0;
    damageNumbers.length = 0;

    // Reset game state
    game.time = 0;

    // Reset level-up menu
    levelUpMenu.active = false;
    levelUpMenu.selectedPath = null;
    levelUpMenu.availableAbilities = [];

    // Regenerate terrain and spawn enemies
    generateTerrain();
    for (let i = 0; i < 5; i++) spawnEnemy();

    showMessage('PROCESS RESTARTED', 2000);

    // Restart the game loop (in case it had stopped)
    requestAnimationFrame(gameLoop);
}

// Render level-up menu overlay
// Store button bounds for touch detection
const levelUpButtons = {
    paths: [], // [{x, y, width, height, pathId}, ...]
    abilities: [], // [{x, y, width, height, index}, ...]
    backButton: { x: 0, y: 0, width: 0, height: 0 }
};

function renderLevelUpMenu() {
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, game.width, game.height);

    const centerX = game.width / 2;
    const centerY = game.height / 2;
    const isMobile = game.width < 500;

    // Title
    ctx.font = isMobile ? 'bold 24px Orbitron, monospace' : 'bold 32px Orbitron, monospace';
    ctx.fillStyle = COLORS.cyan;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = COLORS.cyan;
    ctx.shadowBlur = 20;
    ctx.fillText(`LEVEL ${player.level}`, centerX, isMobile ? 60 : centerY - 200);

    ctx.font = isMobile ? '14px Orbitron, monospace' : '18px Orbitron, monospace';
    ctx.shadowBlur = 10;
    ctx.fillText(`Skill Points: ${player.skillPoints}`, centerX, isMobile ? 90 : centerY - 160);

    // Clear button storage
    levelUpButtons.paths = [];
    levelUpButtons.abilities = [];

    if (levelUpMenu.selectedPath === null) {
        // Show path selection
        ctx.font = isMobile ? '16px Orbitron, monospace' : '20px Orbitron, monospace';
        ctx.fillText('Choose a path:', centerX, isMobile ? 120 : centerY - 100);

        const paths = ['bash', 'ping', 'init'];

        if (isMobile) {
            // Vertical layout for mobile
            const boxHeight = 70;
            const boxWidth = Math.min(280, game.width - 40);
            const startY = 150;

            paths.forEach((pathId, i) => {
                const path = SKILL_TREE[pathId];
                const x = centerX - boxWidth / 2;
                const y = startY + i * (boxHeight + 15);

                // Store for touch detection
                levelUpButtons.paths.push({ x, y, width: boxWidth, height: boxHeight, pathId });

                // Path box
                ctx.strokeStyle = path.color;
                ctx.lineWidth = 2;
                ctx.shadowColor = path.color;
                ctx.shadowBlur = 15;
                ctx.strokeRect(x, y, boxWidth, boxHeight);
                ctx.fillStyle = `${path.color}22`;
                ctx.fillRect(x, y, boxWidth, boxHeight);

                // Path name
                ctx.font = 'bold 20px Orbitron, monospace';
                ctx.fillStyle = path.color;
                ctx.fillText(path.name, centerX, y + 25);

                // Description
                ctx.font = '12px monospace';
                ctx.fillStyle = COLORS.white;
                ctx.fillText(path.description.split(' - ')[0], centerX, y + 50);
            });
        } else {
            // Horizontal layout for desktop
            const pathWidth = 200;
            const startX = centerX - pathWidth * 1.5;

            paths.forEach((pathId, i) => {
                const path = SKILL_TREE[pathId];
                const x = startX + i * pathWidth + pathWidth / 2;
                const y = centerY;

                // Store for touch detection
                levelUpButtons.paths.push({ x: x - 80, y: y - 60, width: 160, height: 120, pathId });

                // Path box
                ctx.strokeStyle = path.color;
                ctx.lineWidth = 2;
                ctx.shadowColor = path.color;
                ctx.shadowBlur = 15;
                ctx.strokeRect(x - 80, y - 60, 160, 120);
                ctx.fillStyle = `${path.color}22`;
                ctx.fillRect(x - 80, y - 60, 160, 120);

                // Path name
                ctx.font = 'bold 24px Orbitron, monospace';
                ctx.fillStyle = path.color;
                ctx.fillText(path.name, x, y - 25);

                // Key hint
                ctx.font = '16px monospace';
                ctx.fillStyle = COLORS.white;
                ctx.fillText(`[${i + 1}]`, x, y + 10);

                // Description
                ctx.font = '12px monospace';
                ctx.fillText(path.description.split(' - ')[0], x, y + 35);
            });
        }
    } else {
        // Show abilities for selected path
        const path = SKILL_TREE[levelUpMenu.selectedPath];

        ctx.font = isMobile ? 'bold 20px Orbitron, monospace' : 'bold 24px Orbitron, monospace';
        ctx.fillStyle = path.color;
        ctx.fillText(`${path.name} Abilities`, centerX, isMobile ? 120 : centerY - 100);

        // Back button
        const backY = isMobile ? 150 : centerY - 70;
        ctx.font = '14px monospace';
        ctx.fillStyle = COLORS.white;
        ctx.fillText('← TAP HERE TO GO BACK', centerX, backY);
        levelUpButtons.backButton = { x: centerX - 120, y: backY - 15, width: 240, height: 30 };

        if (levelUpMenu.availableAbilities.length === 0) {
            ctx.font = '16px monospace';
            ctx.fillStyle = COLORS.yellow;
            ctx.fillText('No abilities available', centerX, centerY);
            ctx.fillText('(need prerequisites)', centerX, centerY + 25);
        } else {
            const boxWidth = Math.min(380, game.width - 30);
            const boxHeight = 60; // Larger touch target
            const startY = isMobile ? 190 : centerY - 30;

            levelUpMenu.availableAbilities.forEach((ability, i) => {
                const y = startY + i * (boxHeight + 10);
                const x = centerX - boxWidth / 2;

                // Store for touch detection
                levelUpButtons.abilities.push({ x, y, width: boxWidth, height: boxHeight, index: i });

                // Ability box
                ctx.strokeStyle = path.color;
                ctx.lineWidth = 2;
                ctx.shadowColor = path.color;
                ctx.shadowBlur = 10;
                ctx.strokeRect(x, y, boxWidth, boxHeight);
                ctx.fillStyle = `${path.color}15`;
                ctx.fillRect(x, y, boxWidth, boxHeight);

                // Name (larger, centered)
                ctx.font = 'bold 18px Orbitron, monospace';
                ctx.fillStyle = path.color;
                ctx.textAlign = 'center';
                ctx.fillText(ability.name, centerX, y + 22);

                // Description (smaller, below name)
                ctx.font = '12px monospace';
                ctx.fillStyle = COLORS.white;
                ctx.fillText(ability.desc, centerX, y + 45);
            });
        }
    }

    // Show unlocked abilities at bottom
    if (player.unlockedAbilities.length > 0) {
        ctx.font = '12px monospace';
        ctx.fillStyle = COLORS.green;
        ctx.textAlign = 'center';
        ctx.fillText(`Unlocked: ${player.unlockedAbilities.join(', ')}`, centerX, game.height - 30);
    }

    ctx.shadowBlur = 0;
}

// Start the game
init();
