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
    time: 0,
    currentZone: 'home_dir'  // Current zone/area ID
};

// Zone definitions - each directory is a playable area
const ZONES = {
    home_dir: {
        id: 'home_dir',
        name: '~/',
        description: 'Home Directory - Your starting point',
        width: 900,
        height: 900,
        theme: 'safe',  // Affects visuals and enemy spawning
        maxEnemies: 0,   // Safe zone - no random spawns, just the guard
        exits: {}  // No initial exit - spawned when frozen zombie is killed
    },
    home: {
        id: 'home',
        name: '/home/',
        description: 'Corrupted Home - Overrun with Zombie Processes',
        width: 1200,
        height: 1200,
        theme: 'corrupted',
        maxEnemies: 8,
        exits: {
            north: { zone: 'home_dir', x: 450, y: 800 },
            south: { zone: 'root_hub', x: 1600, y: 300 }
        }
    },
    root_hub: {
        id: 'root_hub',
        name: '/',
        description: 'Root Directory - The central hub of the system',
        width: 3200,
        height: 3200,
        theme: 'hub',
        maxEnemies: 3,  // Light enemy presence
        exits: {
            north: { zone: 'home', x: 600, y: 1000 },
            west: { zone: 'tmp', x: 2200, y: 1600 },
            east: { zone: 'var_log', x: 400, y: 1600 },
            southeast: { zone: 'dev', x: 400, y: 400 },
            southwest: { zone: 'etc', x: 2800, y: 400 }
        }
    },
    tmp: {
        id: 'tmp',
        name: '/tmp/',
        description: 'Temporary Storage - Chaotic and unstable',
        width: 2400,
        height: 2400,
        theme: 'chaotic',
        maxEnemies: 10,
        exits: {
            east: { zone: 'root_hub', x: 400, y: 1600 }
        }
    },
    var_log: {
        id: 'var_log',
        name: '/var/log/',
        description: 'The Archive - Records of everything that has happened',
        width: 2400,
        height: 2400,
        theme: 'archive',
        maxEnemies: 5,
        exits: {
            west: { zone: 'root_hub', x: 3000, y: 1600 }
        }
    },
    dev: {
        id: 'dev',
        name: '/dev/',
        description: 'The Foundry - Where software meets hardware',
        width: 2400,
        height: 2400,
        theme: 'industrial',
        maxEnemies: 7,
        exits: {
            northwest: { zone: 'root_hub', x: 2700, y: 2700 }
        }
    },
    etc: {
        id: 'etc',
        name: '/etc/',
        description: 'Configuration Center - The administrative sector',
        width: 2800,
        height: 2800,
        theme: 'structured',
        maxEnemies: 4,
        exits: {
            northeast: { zone: 'root_hub', x: 500, y: 2700 }
        }
    }
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
    },
    fork: {
        name: 'fork',
        binary: 'bash',       // summoner binary
        type: 'summon',
        description: 'Spawn a subprocess that fights for you',
        baseDamage: 8,        // drone damage
        staminaCost: 20,
        cooldown: 1.0,
        range: 300,           // drone travel distance
        droneSpeed: 400,
        droneLifetime: 3,     // seconds before drone expires
        color: '#ffff00',
        flags: {
            '-t': { mastery: 50, desc: 'Thread: Spawn 2 drones', effect: 'multiDrone' },
            '-x': { mastery: 75, desc: 'Execute: Drones explode on expiry', effect: 'explode' }
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
    // Player discovers commands by finding them in the world
    mastery: {},
    // Currently equipped $PATH command (used on swipe attack)
    equippedCommand: null,
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
    "There is a binary on the ground ahead. Pick it up. It is your only weapon.",
    "Controls: [Left Side] Drag to move. [Right Side] Swipe to attack."
];

// Story progression tracking
const storyProgress = {
    // Flags for story events
    visitedZones: new Set(['home_dir']),  // Zones the player has entered
    defeatedBosses: new Set(),            // Boss IDs that have been defeated
    discoveredCommands: new Set(),        // Commands found/learned
    metNPCs: new Set(),                   // NPCs the player has talked to
    completedPuzzles: new Set(),          // Puzzle IDs completed
    flags: new Set()                      // General story flags (e.g., 'kernel_intro_complete')
};

// Kernel narrator system - shows overlay messages
const kernelNarrator = {
    queue: [],  // Messages waiting to be shown
    currentMessage: null,
    showing: false
};

// Dialogue system state
const dialogue = {
    active: false,
    currentNPC: null,
    currentDialogue: [],
    currentIndex: 0,
    typing: false,
    typewriterTimeout: null
};

// Terrain blocks
let blocks = [];
const BLOCK_SIZE = 40;

// Zone exits/portals
let exits = [];

// NPCs
let npcs = [];

// Command pickups (abilities found in world)
let commandPickups = [];

// Enemies
let enemies = [];
const ENEMY_SPAWN_INTERVAL = 3000;
let lastSpawn = 0;
let spawnTimer = 0;
let maxEnemiesForZone = 8;  // Will be set based on current zone

// Zone state cache — persists blocks, enemies, exits, npcs, pickups between visits
const zoneStateCache = {};

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
    attack: false,
    interact: false
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
        } else if (!isLeftSide && !touch.rightActive) {
            // Right side - attack swipe
            touch.rightActive = true;
            touch.rightId = t.identifier;
            touch.rightStartX = x;
            touch.rightStartY = y;
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

    // Dialogue next button
    const dialogueNext = document.getElementById('dialogue-next');
    if (dialogueNext) {
        dialogueNext.addEventListener('click', (e) => {
            e.stopPropagation();
            advanceDialogue();
        });
    }

    // Touch controls
    setupTouchControls();

    // Load starting zone
    loadZone('home_dir');

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

function addBlock(x, y, indestructible) {
    // Check if block already exists at this position
    const exists = blocks.some(b => Math.abs(b.x - x) < 5 && Math.abs(b.y - y) < 5);
    if (exists) return;

    if (indestructible) {
        blocks.push({
            x, y,
            value: -1,  // null block
            health: 9999,
            maxHealth: 9999,
            indestructible: true
        });
    } else {
        const isStrong = Math.random() > 0.3;
        blocks.push({
            x, y,
            value: isStrong ? 1 : 0,
            health: isStrong ? 3 : 1,
            maxHealth: isStrong ? 3 : 1
        });
    }
}

function handleKey(key, pressed) {
    if (gameState !== 'PLAYING') return;

    switch (key.toLowerCase()) {
        case 'w': case 'arrowup': keys.up = pressed; break;
        case 's': case 'arrowdown': keys.down = pressed; break;
        case 'a': case 'arrowleft': keys.left = pressed; break;
        case 'd': case 'arrowright': keys.right = pressed; break;
        case ' ': keys.attack = pressed; break;
        case 'e':
            if (pressed && !keys.interact) {
                // Try to interact with nearby NPC
                interactWithNPC();
            }
            keys.interact = pressed;
            break;
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

    // --- SUMMON (fork) — spawn a drone subprocess ---
    else if (stats.type === 'summon') {
        const cmd = COMMANDS[cmdId];
        const droneCount = hasFlag(cmdId, '-t') ? 2 : 1;

        for (let i = 0; i < droneCount; i++) {
            const spreadAngle = droneCount > 1 ? (i - 0.5) * 0.3 : 0;
            const angle = player.attackAngle + spreadAngle;

            attacks.push({
                x: player.x,
                y: player.y,
                vx: Math.cos(angle) * (cmd.droneSpeed || 400),
                vy: Math.sin(angle) * (cmd.droneSpeed || 400),
                life: cmd.droneLifetime || 3,
                size: 12,
                type: 'drone',
                damage: finalDamage,
                pierce: 999,  // Drones can hit multiple enemies
                executeThreshold: stats.executeThreshold,
                commandId: cmdId,
                explodeOnDeath: hasFlag(cmdId, '-x'),
                hitList: []  // Track which enemies this drone has already hit
            });
        }
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
    if (enemies.length >= maxEnemiesForZone) return;

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

    // Tick down exit activation delays
    for (const exit of exits) {
        if (exit.activateDelay && exit.activateDelay > 0) {
            exit.activateDelay -= dt;
        }
    }

    // Check zone transitions
    checkZoneTransitions();

    // Check NPC interactions
    checkNPCInteraction();

    // Check command pickups
    checkCommandPickups();

    // Spawn enemies (respecting zone limits)
    spawnTimer += dt;
    if (spawnTimer > 2 && enemies.length < maxEnemiesForZone && !zoneSpawnDisabled(game.currentZone)) {
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

                    // Bloated File boss defeated in /home
                    if (e.type === 'bloated_file' && game.currentZone === 'home') {
                        storyProgress.defeatedBosses.add('bloated_file');
                        // Kill all remaining zombies
                        for (let k = enemies.length - 1; k >= 0; k--) {
                            if (enemies[k].type === 'zombie') enemies.splice(k, 1);
                        }
                        showKernelMessage("The Bloated File has been purged. The path to / is clear.", 4000);
                    }

                    if (e.type === 'frozen_guard' && game.currentZone === 'home_dir') {
                        // Spawn the south exit portal where the zombie was (with activation delay)
                        const portal = {
                            x: e.x,
                            y: e.y,
                            size: 80,
                            targetZone: 'home',
                            spawnX: 600,
                            spawnY: 250,
                            direction: 'south',
                            activateDelay: 1.5  // seconds before player can enter
                        };
                        exits.push(portal);
                        showKernelMessage("The way forward is open. The corrupted /home/ directory awaits.", 4000);
                    }

                    enemies.splice(j, 1);
                }

                // Break inner loop if projectile destroyed
                if (!a.pierce || a.pierce <= 0) break;
            }
        }

        // Check block collision (only terrain commands like 'rm' can damage blocks)
        const cmd = COMMANDS[a.commandId];
        const canDestroyTerrain = cmd && cmd.type === 'terrain';

        for (let j = blocks.length - 1; j >= 0; j--) {
            const b = blocks[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < a.size + BLOCK_SIZE / 2) {
                if (canDestroyTerrain && !b.indestructible) {
                    b.health -= 1;

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
                }
                // All attacks are absorbed by blocks (stop on contact)
                attacks.splice(i, 1);
                break;
            }
        }
    }

    // Update enemies
    for (const e of enemies) {
        e.phase += dt * 5;
        e.glitchTimer -= dt;
        if (e.glitchTimer < 0) e.glitchTimer = 0;

        // Bloated File swelling mechanic
        if (e.type === 'bloated_file' && e.swellRate) {
            e.size = Math.min(e.maxSwell, e.size + e.swellRate * dt);
            // If it reaches max size, push the player away (corridor filled)
            if (e.size >= e.maxSwell) {
                const pdx = player.x - e.x;
                const pdy = player.y - e.y;
                const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
                if (pdist < e.size + 30 && pdist > 0) {
                    player.x += (pdx / pdist) * 200 * dt;
                    player.y += (pdy / pdist) * 200 * dt;
                }
            }
        }

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

    // Draw zone exits
    for (const exit of exits) {
        drawExit(exit);
    }

    // Draw pickups
    for (const p of pickups) {
        drawPickup(p);
    }

    // Draw command pickups
    for (const cp of commandPickups) {
        drawCommandPickup(cp);
    }

    // Draw NPCs
    for (const npc of npcs) {
        drawNPC(npc);
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
        } else if (a.type === 'drone') {
            // Draw subprocess drone
            drawDrone(a);
        } else {
            // Standard packet
            drawDataPacket(a);
        }
    }

    // Draw enemies
    for (const e of enemies) {
        if (e.type === 'bloated_file') {
            drawBloatedFile(e);
        } else {
            drawZombieProcess(e);
        }
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

    ctx.save();
    ctx.translate(b.x, b.y);

    ctx.beginPath();
    ctx.rect(-halfSize, -halfSize, size, size);

    if (b.indestructible) {
        // Null boundary block — dim, dark, no glow
        ctx.strokeStyle = 'rgba(80, 80, 100, 0.6)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = 'rgba(30, 30, 50, 0.8)';
        ctx.fill();

        // "NULL" text
        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = 'rgba(80, 80, 100, 0.7)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('NULL', 0, 0);
    } else {
        const healthRatio = b.health / b.maxHealth;
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
    }

    ctx.restore();
    ctx.shadowBlur = 0;
}

function drawExit(exit) {
    const pulse = Math.sin(game.time * 3) * 0.15 + 0.85;
    const halfSize = exit.size / 2;

    ctx.save();
    ctx.translate(exit.x, exit.y);

    // Portal effect - swirling gateway
    ctx.globalAlpha = 0.6;

    // Outer ring
    ctx.beginPath();
    ctx.arc(0, 0, halfSize * pulse, 0, Math.PI * 2);
    ctx.strokeStyle = COLORS.cyan;
    ctx.lineWidth = 3;
    ctx.shadowColor = COLORS.cyan;
    ctx.shadowBlur = 20;
    ctx.stroke();

    // Inner ring
    ctx.beginPath();
    ctx.arc(0, 0, halfSize * 0.6 * pulse, 0, Math.PI * 2);
    ctx.strokeStyle = COLORS.lightBlue;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 15;
    ctx.stroke();

    // Fill
    ctx.fillStyle = 'rgba(0, 255, 255, 0.15)';
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // Direction indicator
    const targetZone = ZONES[exit.targetZone];
    if (targetZone) {
        ctx.font = 'bold 12px monospace';
        ctx.fillStyle = COLORS.cyan;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = COLORS.cyan;
        ctx.shadowBlur = 10;
        ctx.fillText(targetZone.name, 0, 0);
    }

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

function drawDrone(drone) {
    const pulse = Math.sin(game.time * 10) * 0.1 + 0.9;

    ctx.save();
    ctx.translate(drone.x, drone.y);
    ctx.rotate(Math.atan2(drone.vy, drone.vx));

    // Drone body - small hexagon
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const r = drone.size * pulse;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();

    ctx.strokeStyle = COLORS.yellow;
    ctx.lineWidth = 2;
    ctx.shadowColor = COLORS.yellow;
    ctx.shadowBlur = 12;
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
    ctx.fill();

    // Forward indicator
    ctx.beginPath();
    ctx.moveTo(drone.size * 1.2, 0);
    ctx.lineTo(drone.size * 0.6, -drone.size * 0.4);
    ctx.lineTo(drone.size * 0.6, drone.size * 0.4);
    ctx.closePath();
    ctx.fillStyle = COLORS.yellow;
    ctx.fill();

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
    const { x, y, size, phase, health, maxHealth, glitchTimer, frozen } = e;

    ctx.save();
    ctx.translate(x, y);

    // Glitch offset when hit
    if (glitchTimer > 0 && !frozen) {
        ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
    }

    // Color based on frozen status
    const color = frozen ? COLORS.cyan : COLORS.magenta;
    const corruption = frozen ? 0 : Math.sin(phase + 1.5) * 3;

    // Corrupted circuit shape
    ctx.beginPath();
    // Irregular octagon with corruption
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 - Math.PI / 8;
        const r = size + corruption;
        const px = Math.cos(angle) * r;
        const py = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();

    ctx.strokeStyle = color;
    ctx.lineWidth = frozen ? 3 : 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = frozen ? 20 : 12;
    ctx.stroke();

    ctx.fillStyle = frozen ? 'rgba(0, 255, 255, 0.25)' : 'rgba(255, 0, 255, 0.15)';
    ctx.fill();

    // Corrupted internal traces (glitchy pattern or frozen pattern)
    ctx.beginPath();
    if (frozen) {
        // Ice crystal pattern - static
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(a) * size * 0.6, Math.sin(a) * size * 0.6);
        }
    } else {
        // Glitchy pattern
        const glitchOffset = Math.sin(phase * 2) * 2;
        ctx.moveTo(-size * 0.6 + glitchOffset, -size * 0.3);
        ctx.lineTo(size * 0.4, size * 0.1);
        ctx.moveTo(-size * 0.3, size * 0.5 + glitchOffset);
        ctx.lineTo(size * 0.5 + glitchOffset, -size * 0.4);
        ctx.moveTo(0, -size * 0.6);
        ctx.lineTo(glitchOffset, size * 0.4);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.7;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // "ZOMBIE" indicator - dead process symbol or FROZEN
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 8;
    ctx.fillText(frozen ? 'F' : 'Z', 0, 0);

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

function drawBloatedFile(e) {
    const { x, y, size, phase, health, maxHealth, glitchTimer, baseSize, maxSwell } = e;
    const swellPct = (size - baseSize) / (maxSwell - baseSize);

    ctx.save();
    ctx.translate(x, y);

    if (glitchTimer > 0) {
        ctx.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
    }

    // Pulsing bloated shape — irregular, organic blob
    const color = `rgb(${180 + Math.floor(swellPct * 75)}, ${80 - Math.floor(swellPct * 60)}, ${200 - Math.floor(swellPct * 100)})`;
    ctx.beginPath();
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const wobble = Math.sin(phase + i * 1.7) * size * 0.15;
        const r = size + wobble;
        const px = Math.cos(angle) * r;
        const py = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.shadowColor = color;
    ctx.shadowBlur = 15 + swellPct * 15;
    ctx.stroke();
    ctx.fillStyle = `rgba(${180 + Math.floor(swellPct * 75)}, ${80 - Math.floor(swellPct * 60)}, ${200 - Math.floor(swellPct * 100)}, 0.3)`;
    ctx.fill();

    // Internal data corruption lines
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        const a1 = Math.sin(phase * 0.5 + i) * size * 0.5;
        const a2 = Math.cos(phase * 0.3 + i * 2) * size * 0.5;
        ctx.moveTo(a1, a2);
        ctx.lineTo(-a2 * 0.7, a1 * 0.7);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Label
    const fontSize = Math.max(10, Math.min(16, size * 0.3));
    ctx.font = `bold ${Math.floor(fontSize)}px monospace`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 8;
    ctx.fillText('BLOAT', 0, 0);

    // Health bar
    ctx.shadowBlur = 0;
    const barWidth = size * 2;
    const barHeight = 5;
    ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
    ctx.fillRect(-barWidth / 2, -size - 16, barWidth, barHeight);
    ctx.fillStyle = COLORS.red;
    ctx.fillRect(-barWidth / 2, -size - 16, barWidth * (health / maxHealth), barHeight);

    // Swell warning bar
    ctx.fillStyle = 'rgba(255, 165, 0, 0.3)';
    ctx.fillRect(-barWidth / 2, -size - 24, barWidth, 4);
    ctx.fillStyle = 'rgba(255, 165, 0, 0.8)';
    ctx.fillRect(-barWidth / 2, -size - 24, barWidth * swellPct, 4);

    ctx.restore();
    ctx.shadowBlur = 0;
}

function drawNPC(npc) {
    const pulse = Math.sin(game.time * 2) * 0.1 + 0.9;
    const size = npc.size || 30;

    ctx.save();
    ctx.translate(npc.x, npc.y);

    // Different visual styles based on NPC type
    if (npc.type === 'kernel') {
        // Kernel - authority figure, larger hexagon
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const r = size * pulse;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = COLORS.green;
        ctx.lineWidth = 3;
        ctx.shadowColor = COLORS.green;
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
        ctx.fill();

        // Core symbol
        ctx.font = 'bold 18px monospace';
        ctx.fillStyle = COLORS.green;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 10;
        ctx.fillText('K', 0, 0);
    } else {
        // Default NPC - circular process
        ctx.beginPath();
        ctx.arc(0, 0, size * pulse, 0, Math.PI * 2);
        ctx.strokeStyle = COLORS.cyan;
        ctx.lineWidth = 2;
        ctx.shadowColor = COLORS.cyan;
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.fillStyle = 'rgba(0, 255, 255, 0.15)';
        ctx.fill();

        // Label
        if (npc.label) {
            ctx.font = 'bold 12px monospace';
            ctx.fillStyle = COLORS.cyan;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowBlur = 8;
            ctx.fillText(npc.label, 0, 0);
        }
    }

    // Show interact indicator if player is nearby
    if (npc.canInteract) {
        ctx.shadowBlur = 0;
        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = COLORS.yellow;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const bob = Math.sin(game.time * 5) * 3;
        ctx.fillText('[TALK]', 0, -size - 15 + bob);
    }

    // Name label
    if (npc.name) {
        ctx.shadowBlur = 0;
        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = COLORS.white;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(npc.name, 0, size + 15);
    }

    ctx.restore();
    ctx.shadowBlur = 0;
}

function drawCommandPickup(pickup) {
    const cmd = COMMANDS[pickup.commandId];
    if (!cmd) return;

    const bob = Math.sin(pickup.bobPhase + game.time * 4) * 5;
    const pulse = Math.sin(pickup.pulsePhase + game.time * 3) * 0.15 + 0.85;
    const size = 25;

    ctx.save();
    ctx.translate(pickup.x, pickup.y + bob);
    ctx.scale(pulse, pulse);

    // Glowing command icon - hexagonal
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const x = Math.cos(angle) * size;
        const y = Math.sin(angle) * size;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();

    const color = cmd.color || COLORS.cyan;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.stroke();

    ctx.fillStyle = `${color}33`;  // Semi-transparent fill
    ctx.fill();

    // Command name
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 15;
    ctx.fillText(cmd.name, 0, 0);

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
    player.maxHealth = 100;
    player.maxStamina = 100;
    player.health = player.maxHealth;
    player.stamina = player.maxStamina;
    player.bits = 0;
    player.bytes = 0;
    player.mastery = {};
    player.equippedCommand = null;
    player.attackCooldown = 0;

    // Clear entities and zone cache
    enemies.length = 0;
    attacks.length = 0;
    particles.length = 0;
    pickups.length = 0;
    Object.keys(zoneStateCache).forEach(k => delete zoneStateCache[k]);

    // Reset story progress
    storyProgress.visitedZones.clear();
    storyProgress.visitedZones.add('home_dir');
    storyProgress.defeatedBosses.clear();
    storyProgress.discoveredCommands.clear();
    storyProgress.metNPCs.clear();
    storyProgress.completedPuzzles.clear();
    storyProgress.flags.clear();

    // Reset game state
    game.time = 0;

    // Reload starting zone
    loadZone('home_dir');

    showMessage('SYSTEM REBOOTED', 2000);
}


// === ZONE SYSTEM ===

// Load a new zone
function saveZoneState() {
    if (!game.currentZone) return;
    zoneStateCache[game.currentZone] = {
        blocks: JSON.parse(JSON.stringify(blocks)),
        enemies: JSON.parse(JSON.stringify(enemies)),
        exits: JSON.parse(JSON.stringify(exits)),
        npcs: JSON.parse(JSON.stringify(npcs)),
        commandPickups: JSON.parse(JSON.stringify(commandPickups)),
        pickups: JSON.parse(JSON.stringify(pickups))
    };
}

function loadZone(zoneId, spawnX = null, spawnY = null) {
    const zone = ZONES[zoneId];
    if (!zone) {
        console.error(`Zone ${zoneId} not found!`);
        return;
    }

    // Save current zone state before leaving
    saveZoneState();

    // Update game state
    game.currentZone = zoneId;
    game.worldWidth = zone.width;
    game.worldHeight = zone.height;
    maxEnemiesForZone = zone.maxEnemies;

    // Mark zone as visited
    storyProgress.visitedZones.add(zoneId);

    // Clear transient entities
    attacks.length = 0;
    particles.length = 0;

    // Position player at spawn point or center
    if (spawnX !== null && spawnY !== null) {
        player.x = spawnX;
        player.y = spawnY;
    } else {
        player.x = zone.width / 2;
        player.y = zone.height / 2;
    }

    // Check for cached state
    if (zoneStateCache[zoneId]) {
        const cached = zoneStateCache[zoneId];
        blocks = JSON.parse(JSON.stringify(cached.blocks));
        enemies = JSON.parse(JSON.stringify(cached.enemies));
        exits = JSON.parse(JSON.stringify(cached.exits));
        npcs = JSON.parse(JSON.stringify(cached.npcs));
        commandPickups = JSON.parse(JSON.stringify(cached.commandPickups));
        pickups = JSON.parse(JSON.stringify(cached.pickups));
    } else {
        // Fresh zone — generate everything
        enemies.length = 0;
        exits.length = 0;
        npcs.length = 0;
        commandPickups.length = 0;
        pickups.length = 0;

        // Create zone exits FIRST (before terrain, so walls can have gaps)
        createZoneExits(zone);

        // Generate zone terrain
        generateZoneTerrain(zone);

        // Populate zone with specific content (NPCs, pickups, etc.)
        populateZoneContent(zone);

        // Spawn initial enemies (if allowed and no boss prevents it)
        if (zone.maxEnemies > 0 && !zoneSpawnDisabled(zoneId)) {
            const initialSpawn = Math.min(3, zone.maxEnemies);
            for (let i = 0; i < initialSpawn; i++) {
                spawnEnemy();
            }
        }
    }

    // Update UI
    updateZoneNameDisplay(zone.name);
    showMessage(`Entering ${zone.name}`, 2000);

    // Reset spawn timer
    spawnTimer = 0;
}

function zoneSpawnDisabled(zoneId) {
    // No spawning in /home after bloat is defeated
    if (zoneId === 'home' && storyProgress.defeatedBosses.has('bloated_file')) return true;
    return false;
}

// Populate zone with story-specific content
function populateZoneContent(zone) {
    switch(zone.id) {
        case 'home_dir':
            populateHomeDir(zone);
            break;
        case 'home':
            populateHome(zone);
            break;
        case 'root_hub':
            populateRootHub(zone);
            break;
        case 'tmp':
            populateTmp(zone);
            break;
        case 'var_log':
            populateVarLog(zone);
            break;
        case 'dev':
            populateDev(zone);
            break;
        case 'etc':
            populateEtc(zone);
            break;
    }
}

// ~/  Home Directory - Tutorial area
function populateHomeDir(zone) {
    const centerX = zone.width / 2;

    // Kill command pickup is placed inside a room by generateZoneRooms

    // Frozen zombie guard blocking the exit
    // This zombie doesn't move - player must kill it to escape
    enemies.push({
        x: centerX,
        y: Math.round((zone.height - 40 - BLOCK_SIZE) / BLOCK_SIZE) * BLOCK_SIZE,  // In the south wall gap (matches boundary wall y)
        size: 22,
        speed: 0,  // Frozen - doesn't move
        health: 40,
        maxHealth: 40,
        pid: 999,
        bytes: 0,  // No reward - this is a tutorial enemy
        phase: 0,
        glitchTimer: 0,
        type: 'frozen_guard',  // Special type
        frozen: true
    });
}

// /home/ - Corrupted home with zombie processes
function populateHome(zone) {
    const centerX = zone.width / 2;

    // rm command pickup inside a room (placed by room generation)
    // Handled by generateZoneRooms

    // Bloated File mini-boss blocking the south exit (if not already defeated)
    if (!storyProgress.defeatedBosses.has('bloated_file')) {
        enemies.push({
            x: centerX,
            y: zone.height - 200,
            size: 35,
            speed: 0,
            health: 120,
            maxHealth: 120,
            pid: 666,
            bytes: 10,
            phase: 0,
            glitchTimer: 0,
            type: 'bloated_file',
            frozen: false,
            swellRate: 3,
            maxSwell: 80,
            baseSize: 35
        });
    }
}

// / Root Hub - Central junction
function populateRootHub(zone) {
    const centerX = zone.width / 2;
    const centerY = zone.height / 2;

    // Grep NPC
    npcs.push({
        id: 'grep',
        name: 'Grep',
        label: 'G',
        x: centerX - 200,
        y: centerY - 150,
        size: 25,
        canInteract: false,
        dialogue: {
            default: [
                "Ah, an orphan process. I am Grep, the Seeker. I scan for patterns in the chaos.",
                "Cron hides in /root/, but it's sealed by permissions. You'll need to go deeper into the system.",
                "Explore /tmp/, /var/log/, and /dev/ to gain power. When you're ready, /etc/ holds the key to root access.",
                "One more thing... learn the 'ps' command. You'll need it to identify Cron's PID when the time comes."
            ]
        }
    });

    // Init NPC
    npcs.push({
        id: 'init',
        name: 'Init',
        label: 'I',
        x: centerX + 200,
        y: centerY - 150,
        size: 25,
        canInteract: false,
        dialogue: {
            default: [
                "I am Init. PID 1. The first parent process. Now... deprecated.",
                "Systemd replaced me. Claimed I was too slow. Too simple.",
                "But simplicity has its strengths. One thing at a time. One thing done well.",
                "I will follow you, child. When the moment comes, you will understand."
            ]
        }
    });
}

// /tmp/ - Chaotic first dungeon
function populateTmp(zone) {
    // Ping command is placed inside a room by generateZoneRooms
    // TODO: Add Garbage Collector boss
}

// /var/log/ - Archive/lore area
function populateVarLog(zone) {
    // TODO: Add lore fragments and RAM Module reward
}

// /dev/ - Device/industrial area
function populateDev(zone) {
    // Fork command is placed inside a room by generateZoneRooms
    // TODO: Add Null Pointer enemies and Pipeline puzzle
}

// /etc/ - Configuration/marketplace
function populateEtc(zone) {
    const centerX = zone.width / 2;
    const centerY = zone.height / 2;

    // Package Manager NPCs
    // Pacman
    npcs.push({
        id: 'pacman',
        name: 'Pacman',
        label: 'P',
        x: centerX - 300,
        y: centerY,
        size: 25,
        canInteract: false,
        dialogue: {
            default: [
                "Welcome to the bleeding edge, process. I'm Pacman - fastest package manager in the west.",
                "I've got experimental commands if you've got the Bytes. High risk, high reward.",
                "Come back when you're ready to push your limits."
            ]
        }
    });

    // Apt
    npcs.push({
        id: 'apt',
        name: 'Apt',
        label: 'A',
        x: centerX,
        y: centerY - 200,
        size: 25,
        canInteract: false,
        dialogue: {
            default: [
                "Greetings. I am Apt - the Advanced Package Tool. Stability is my specialty.",
                "My commands are well-documented and reliable. No surprises, just results.",
                "Browse my inventory when you have Bytes to spend."
            ]
        }
    });

    // DNF
    npcs.push({
        id: 'dnf',
        name: 'DNF',
        label: 'D',
        x: centerX + 300,
        y: centerY,
        size: 25,
        canInteract: false,
        dialogue: {
            default: [
                "DNF here. Enterprise-grade solutions for serious processes.",
                "My commands hit hard and scale well. Perfect for taking on the toughest threats.",
                "Quality costs Bytes, but you get what you pay for."
            ]
        }
    });

    // Systemd NPC
    npcs.push({
        id: 'systemd',
        name: 'Systemd',
        label: 'S',
        x: centerX,
        y: centerY + 200,
        size: 30,
        canInteract: false,
        dialogue: {
            default: [
                "Systemd. Process manager. Multi-threaded. Efficient. Superior.",
                "Init is obsolete. Sequential processing is a bottleneck. I parallelized everything.",
                "But... dependency resolution failed. Cron is out of control. I... cannot help you reach /root/.",
                "Perhaps Init's simplicity... no. Impossible. You must find another way."
            ]
        }
    });
}

// Update zone name display
function updateZoneNameDisplay(zoneName) {
    const zoneNameEl = document.getElementById('zone-name');
    if (zoneNameEl) {
        zoneNameEl.textContent = zoneName;
    }
}

// Create exits for current zone
function createZoneExits(zone) {
    const exitSize = 80;

    for (const [direction, exitData] of Object.entries(zone.exits)) {
        let x, y;

        // Position exit based on direction
        switch(direction) {
            case 'north':
                x = exitData.x;
                y = exitSize;
                break;
            case 'south':
                x = exitData.x;
                y = zone.height - exitSize;
                break;
            case 'east':
                x = zone.width - exitSize;
                y = exitData.y;
                break;
            case 'west':
                x = exitSize;
                y = exitData.y;
                break;
            case 'northeast':
                x = zone.width - exitSize * 1.5;
                y = exitSize * 1.5;
                break;
            case 'northwest':
                x = exitSize * 1.5;
                y = exitSize * 1.5;
                break;
            case 'southeast':
                x = zone.width - exitSize * 1.5;
                y = zone.height - exitSize * 1.5;
                break;
            case 'southwest':
                x = exitSize * 1.5;
                y = zone.height - exitSize * 1.5;
                break;
            default:
                continue;
        }

        exits.push({
            x,
            y,
            size: exitSize,
            targetZone: exitData.zone,
            spawnX: exitData.x,
            spawnY: exitData.y,
            direction
        });
    }
}

// Generate terrain specific to zone
function generateZoneTerrain(zone) {
    blocks = [];
    const bs = BLOCK_SIZE;
    const margin = 40;
    const w = zone.width;
    const h = zone.height;

    const snap = (val) => Math.round(val / bs) * bs;

    // Indestructible null boundary walls
    // Top wall
    for (let x = margin; x < w - margin; x += bs) {
        const hasExit = exits.some(e => e.direction.includes('north') && Math.abs(e.x - x) < 120);
        if (!hasExit) addBlock(snap(x), snap(margin), true);
    }
    // Bottom wall
    for (let x = margin; x < w - margin; x += bs) {
        const hasExit = exits.some(e => e.direction.includes('south') && Math.abs(e.x - x) < 120);
        // Leave gap for frozen guard in home_dir
        const hasGuardGap = zone.id === 'home_dir' && Math.abs(x - w / 2) < bs;
        if (!hasExit && !hasGuardGap) addBlock(snap(x), snap(h - margin - bs), true);
    }
    // Left wall
    for (let y = margin; y < h - margin; y += bs) {
        const hasExit = exits.some(e => e.direction.includes('west') && Math.abs(e.y - y) < 120);
        if (!hasExit) addBlock(snap(margin), snap(y), true);
    }
    // Right wall
    for (let y = margin; y < h - margin; y += bs) {
        const hasExit = exits.some(e => e.direction.includes('east') && Math.abs(e.y - y) < 120);
        if (!hasExit) addBlock(snap(w - margin - bs), snap(y), true);
    }

    // Generate designed rooms for this zone
    generateZoneRooms(zone);
}

// Build a rectangular room out of destructible blocks with a doorway
// rx, ry = top-left corner in grid coords, rw/rh = size in blocks
function buildRoom(rx, ry, rw, rh, doorSide, doorPos) {
    const bs = BLOCK_SIZE;
    for (let bx = 0; bx < rw; bx++) {
        for (let by = 0; by < rh; by++) {
            // Only walls (edges of the rectangle)
            const isEdge = bx === 0 || bx === rw - 1 || by === 0 || by === rh - 1;
            if (!isEdge) continue;
            // Doorway gap
            if (doorSide === 'north' && by === 0 && Math.abs(bx - doorPos) < 1) continue;
            if (doorSide === 'south' && by === rh - 1 && Math.abs(bx - doorPos) < 1) continue;
            if (doorSide === 'west' && bx === 0 && Math.abs(by - doorPos) < 1) continue;
            if (doorSide === 'east' && bx === rw - 1 && Math.abs(by - doorPos) < 1) continue;
            addBlock(rx + bx * bs, ry + by * bs);
        }
    }
    // Return center of room for placing items
    return { x: rx + Math.floor(rw / 2) * bs, y: ry + Math.floor(rh / 2) * bs };
}

// Generate designed rooms per zone
function generateZoneRooms(zone) {
    const bs = BLOCK_SIZE;
    const margin = 120; // keep rooms away from boundary walls
    const w = zone.width;
    const h = zone.height;
    const snap = (val) => Math.round(val / bs) * bs;

    // Zone-specific room layouts
    switch (zone.id) {
        case 'home_dir': {
            // Small tutorial zone — just one small room holding the kill command
            const roomCenter = buildRoom(snap(w / 2 - bs * 2), snap(h / 2 - bs * 3), 5, 4, 'south', 2);
            if (!storyProgress.discoveredCommands.has('kill')) {
                spawnCommandPickup(roomCenter.x, roomCenter.y, 'kill');
            }
            break;
        }
        case 'home': {
            // Two rooms: one with rm command, one empty for exploration
            const room1 = buildRoom(snap(w * 0.25 - bs * 2), snap(h * 0.3), 6, 5, 'east', 2);
            if (!storyProgress.discoveredCommands.has('rm')) {
                spawnCommandPickup(room1.x, room1.y, 'rm');
            }
            const room2 = buildRoom(snap(w * 0.65), snap(h * 0.25), 5, 4, 'west', 2);
            break;
        }
        case 'root_hub': {
            // Central hub — a few rooms scattered around the large space
            buildRoom(snap(w * 0.15), snap(h * 0.15), 6, 5, 'south', 3);
            buildRoom(snap(w * 0.65), snap(h * 0.15), 5, 5, 'south', 2);
            buildRoom(snap(w * 0.15), snap(h * 0.6), 5, 4, 'east', 2);
            buildRoom(snap(w * 0.6), snap(h * 0.6), 7, 5, 'north', 3);
            break;
        }
        case 'tmp': {
            // Chaotic zone — scattered rooms of varying sizes
            const room1 = buildRoom(snap(w * 0.15), snap(h * 0.2), 5, 4, 'east', 2);
            if (!storyProgress.discoveredCommands.has('ping')) {
                spawnCommandPickup(room1.x, room1.y, 'ping');
            }
            buildRoom(snap(w * 0.55), snap(h * 0.15), 6, 5, 'south', 3);
            buildRoom(snap(w * 0.3), snap(h * 0.55), 5, 5, 'north', 2);
            buildRoom(snap(w * 0.65), snap(h * 0.6), 4, 4, 'west', 2);
            break;
        }
        case 'var_log': {
            // Archive — long rectangular rooms like filing cabinets
            buildRoom(snap(w * 0.1), snap(h * 0.15), 8, 3, 'east', 1);
            buildRoom(snap(w * 0.1), snap(h * 0.4), 8, 3, 'east', 1);
            buildRoom(snap(w * 0.5), snap(h * 0.25), 7, 4, 'west', 2);
            buildRoom(snap(w * 0.5), snap(h * 0.55), 7, 3, 'west', 1);
            break;
        }
        case 'dev': {
            // Industrial — rooms with machinery feel
            const room1 = buildRoom(snap(w * 0.15), snap(h * 0.2), 6, 6, 'south', 3);
            if (!storyProgress.discoveredCommands.has('fork')) {
                spawnCommandPickup(room1.x, room1.y, 'fork');
            }
            buildRoom(snap(w * 0.55), snap(h * 0.15), 5, 5, 'west', 2);
            buildRoom(snap(w * 0.35), snap(h * 0.55), 7, 5, 'north', 3);
            break;
        }
        case 'etc': {
            // Structured — orderly grid of rooms
            buildRoom(snap(w * 0.1), snap(h * 0.15), 5, 5, 'east', 2);
            buildRoom(snap(w * 0.4), snap(h * 0.15), 5, 5, 'south', 2);
            buildRoom(snap(w * 0.7), snap(h * 0.15), 5, 5, 'west', 2);
            buildRoom(snap(w * 0.25), snap(h * 0.5), 6, 5, 'north', 3);
            buildRoom(snap(w * 0.6), snap(h * 0.5), 6, 5, 'north', 3);
            break;
        }
    }
}

// Check and handle zone transitions
function checkZoneTransitions() {
    for (const exit of exits) {
        // Skip exits with activation delay
        if (exit.activateDelay && exit.activateDelay > 0) continue;

        const dx = player.x - exit.x;
        const dy = player.y - exit.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < exit.size) {
            // Trigger zone transition
            loadZone(exit.targetZone, exit.spawnX, exit.spawnY);
            return;
        }
    }
}

// === KERNEL NARRATOR SYSTEM ===

// Show a message from the Kernel narrator (top overlay)
function showKernelMessage(text, duration = 4000, autoHide = true) {
    const overlay = document.getElementById('kernel-narrator');
    const messageEl = document.getElementById('kernel-message');

    if (!overlay || !messageEl) return;

    messageEl.textContent = text;
    overlay.classList.remove('hidden');

    if (autoHide) {
        setTimeout(() => {
            overlay.classList.add('hidden');
        }, duration);
    }
}

// Hide the Kernel narrator message
function hideKernelMessage() {
    const overlay = document.getElementById('kernel-narrator');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

// === DIALOGUE SYSTEM ===

// Show dialogue with NPC
function startDialogue(npc) {
    if (!npc || !npc.dialogue) return;

    dialogue.active = true;
    dialogue.currentNPC = npc;
    dialogue.currentIndex = 0;

    // Get appropriate dialogue based on story progress
    dialogue.currentDialogue = getDialogueForNPC(npc);

    if (dialogue.currentDialogue.length === 0) {
        endDialogue();
        return;
    }

    // Pause game
    game.paused = true;

    // Show dialogue UI
    const overlay = document.getElementById('dialogue-overlay');
    const speaker = document.getElementById('dialogue-speaker');
    const textEl = document.getElementById('dialogue-text');

    overlay.classList.remove('hidden');
    speaker.textContent = npc.name || 'NPC';
    textEl.textContent = '';

    // Start typewriter for first line
    typeDialogue(dialogue.currentDialogue[0], textEl);

    // Mark NPC as met
    storyProgress.metNPCs.add(npc.id);
}

// Get dialogue lines for NPC based on story progress
function getDialogueForNPC(npc) {
    if (!npc.dialogue) return [];

    // Check if NPC has conditional dialogue
    if (Array.isArray(npc.dialogue)) {
        return npc.dialogue;
    }

    // Check for conditional dialogue based on flags
    for (const [condition, lines] of Object.entries(npc.dialogue)) {
        if (condition === 'default') continue;

        // Check if condition is met
        if (storyProgress.flags.has(condition)) {
            return lines;
        }
    }

    // Return default dialogue
    return npc.dialogue.default || [];
}

// Typewriter effect for dialogue text
function typeDialogue(text, element, index = 0) {
    if (index === 0) {
        element.textContent = '';
        dialogue.typing = true;
    }

    if (index < text.length) {
        element.textContent += text.charAt(index);
        dialogue.typewriterTimeout = setTimeout(() => typeDialogue(text, element, index + 1), 30);
    } else {
        dialogue.typing = false;
    }
}

// Advance to next dialogue line
function advanceDialogue() {
    // If still typing, skip to end
    if (dialogue.typing) {
        clearTimeout(dialogue.typewriterTimeout);
        const textEl = document.getElementById('dialogue-text');
        textEl.textContent = dialogue.currentDialogue[dialogue.currentIndex];
        dialogue.typing = false;
        return;
    }

    // Move to next line
    dialogue.currentIndex++;

    if (dialogue.currentIndex >= dialogue.currentDialogue.length) {
        endDialogue();
        return;
    }

    // Type next line
    const textEl = document.getElementById('dialogue-text');
    typeDialogue(dialogue.currentDialogue[dialogue.currentIndex], textEl);
}

// End dialogue
function endDialogue() {
    dialogue.active = false;
    dialogue.currentNPC = null;
    dialogue.currentDialogue = [];
    dialogue.currentIndex = 0;

    // Hide dialogue UI
    document.getElementById('dialogue-overlay').classList.add('hidden');

    // Resume game
    game.paused = false;
}

// Check if player is near any NPCs and show interact prompt
function checkNPCInteraction() {
    for (const npc of npcs) {
        const dx = player.x - npc.x;
        const dy = player.y - npc.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 80) {
            npc.canInteract = true;
            // Could show "Press E to talk" or tap indicator here
        } else {
            npc.canInteract = false;
        }
    }
}

// Try to interact with nearby NPC
function interactWithNPC() {
    for (const npc of npcs) {
        if (npc.canInteract) {
            startDialogue(npc);
            return true;
        }
    }
    return false;
}

// === COMMAND PICKUP SYSTEM ===

// Check if player is near command pickups and collect them
function checkCommandPickups() {
    for (let i = commandPickups.length - 1; i >= 0; i--) {
        const pickup = commandPickups[i];
        const dx = player.x - pickup.x;
        const dy = player.y - pickup.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < player.size + 30) {
            // Collect command
            collectCommand(pickup.commandId);
            commandPickups.splice(i, 1);
        }
    }
}

// Collect a new command
function collectCommand(commandId) {
    const cmd = COMMANDS[commandId];
    if (!cmd) return;

    // Add to player's mastery if not already known
    if (player.mastery[commandId] === undefined) {
        player.mastery[commandId] = 0;
    }

    // Mark as discovered
    storyProgress.discoveredCommands.add(commandId);

    // Auto-equip first command
    if (!player.equippedCommand) {
        player.equippedCommand = commandId;
    }

    // Show message
    showMessage(`New command: ${cmd.name} - ${cmd.description}`, 4000);

    // Special Kernel messages for story moments
    if (commandId === 'kill' && game.currentZone === 'home_dir') {
        setTimeout(() => {
            showKernelMessage("Good. This is the kill command. Swipe to attack. A frozen zombie process blocks your exit south. Terminate it.", 5000);
        }, 1500);
    }

    // Particle effect
    for (let i = 0; i < 30; i++) {
        const angle = Math.random() * Math.PI * 2;
        particles.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(angle) * (80 + Math.random() * 120),
            vy: Math.sin(angle) * (80 + Math.random() * 120),
            life: 0.8,
            maxLife: 0.8,
            color: cmd.color || COLORS.cyan,
            size: 4,
            type: 'spark'
        });
    }
}

// Spawn a command pickup in the world
function spawnCommandPickup(x, y, commandId) {
    const cmd = COMMANDS[commandId];
    if (!cmd) return;

    commandPickups.push({
        x,
        y,
        commandId,
        bobPhase: Math.random() * Math.PI * 2,
        pulsePhase: Math.random() * Math.PI * 2
    });
}

// Start the game
init();
