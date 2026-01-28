# Cron
A top-down, 2D, action-RPG set inside a computer system, based on real elements of a Linux computer system. **Real-time combat** in the style of classic Zelda games—quick reflexes, positioning, and timing matter.

**Tech Stack:** Browser-based game using JavaScript canvas (can expand to WebGL/Phaser later), mainly focused on mobile browser touch gameplay but can implement controller features later, no keyboard controls for now.

**Design Philosophy:** Zelda meets Skyrim meets minecraft inside a Linux box. Progression comes from **exploring the world** and **practicing your abilities**, not from allocating stat points or climbing an XP bar. You become what you play.

---

## Story
**Main Villain:** Cron—the job scheduler gone rogue, corrupting scheduled tasks and spawning malicious jobs across the system.

### Player Backstory
The player is an **orphan process**—their parent process was killed by Cron. The **Kernel** discovered this orphan and, rather than reaping it, gave it a purpose: to stop Cron and restore order to the system.

### Intro
The Kernel serves as the player's guide and narrator throughout the game. It starts the game by communicating the situation to the player and explaining the game:
 - almost like Navi in zelda
 - "wakes up" the player and explains the situation
 - explains that touch dragging on the left side controls movement, swipe on the right side for directional attack, touch the profile icon for pause/playerstats/inventory
 - explains new features/locations as they come up in the game

---

## Player

### Visual Design
The player is a custom **Hexagonal Molecular Chip**:
- **Outer Frame**: Cyan hexagon
- **Inner Core**: Smaller filled hexagon with molecular pattern
- **Health**: Magenta background fill of the Inner Core
- **Stamina** yellow background fill of the outer frame

### HUD / UI
- **Profile Button**: Top-right corner icon. Toggle to pause and view stats/inventory.
- **Craft Button**: Top-right corner (next to profile). Toggles craft mode on/off. Tap again to exit quickly.
- **Profile View**: Shows ROM (health), RAM (stamina), Bits, Bytes, and a list of known commands with mastery levels.
- No XP bar. No player level number.
- **Inventory**: called "/bin" as a tab in the profile view. Shows consumables and "equipable" commands.
- **$PATH**: currently equipped commands. Can also serve as the place to "craft" commands with options, flags, and piping.

---

## Core Stats

Only two core stats. Both are increased by **finding upgrades in the world**, not by allocating points.

| Stat | Description | How to Increase |
|------|-------------|-----------------|
| **ROM** | Health — your core integrity | Find ROM Chips in dungeons/shrines |
| **RAM** | Stamina — used for abilities, regenerates over time | Find RAM Modules in dungeons/shrines |

Damage, speed, and cooldowns are determined by your **equipped weapon/command** and your **mastery level** with it.

---

## Progression: Usage-Based Mastery

**No classes. No XP. No skill points.** Your abilities improve by using them.

### How It Works
- Every command/weapon has a **mastery level (0–100)**
- Using a command successfully increases its mastery
- Higher mastery = more damage, lower stamina cost, faster cooldowns
- At mastery milestones, commands unlock **flag variants** (upgraded versions)

### Mastery Scaling (per command)

| Mastery Range | Tier | Effects |
|---------------|------|---------|
| 0–24 | Novice | Base damage, full stamina cost |
| 25–49 | Familiar | ~80% stamina cost, minor stat boost |
| 50–74 | Proficient | Unlock first flag variant |
| 75–99 | Expert | Unlock second flag variant, visual change |
| 100 | Mastered | Unlock piping capability, peak stats |

### Organic Specialization
There are no classes to choose. If you mostly use melee commands, you become a melee specialist. If you favor ranged attacks, you naturally develop that way. If you spend too much time having fun crafting, don't worry, that will translate to combat too. You can always pick up new commands and start building mastery in them—nothing is locked/permanent.

### Death Penalty
On death, you **drop some Bits and Bytes** at the location where you died. You can return to recover them. No mastery/skill loss.

---

## Command Composition: Flags & Pipes

This is the game's equivalent of "crafting" for abilities—not a recipe book, but an experimental system.

### Flags
Commands unlock upgraded variants at mastery thresholds. Flags modify the base behavior:
- A melee attack might gain an area-of-effect flag
- A ranged shot might gain a piercing flag
- A terrain command might gain a recursive flag

Specific flag mappings will be designed during implementation, but the pattern is: **base command → flag 1 (mastery 50) → flag 2 (mastery 75)**.

### Pipes
At mastery 100, commands can be **piped** together. The output of one feeds into another, creating combo effects. Piping costs extra stamina but produces powerful results.

Examples of the concept (final mappings TBD):
- Reveal + Attack → bonus damage on exposed target
- Destroy terrain + Build → relocate a block
- Mark + Ranged → auto-aim at marked target

Players discover pipe combos through experimentation. No recipe list—try it and see.

---

## Summoner Playstyle

Summoning bridges combat and crafting. Two complementary mechanics:

### Combat Drones (via $PATH)
- **`fork`** — a $PATH combat command. Directional swipe launches a short-lived **subprocess/drone** in that direction.
- The drone flies forward, attacks enemies it encounters, then expires.
- While alive, the drone also draws the "aggro" of nearby enemies.
- Higher mastery = longer lifespan, more damage, smarter targeting.
- Flag variants could include: multiple drones, homing behavior, explode-on-expire.
- Uses RAM (stamina) like any combat command.

### Turrets / Static Processes (via Craft Mode)
- In **craft mode**, tap a location to place a stationary **turret/totem** that auto-attacks nearby enemies.
- Turrets cost **Bits** to place (same resource as building).
- Turrets have a lifespan or health — they don't last forever.
- A summoner-focused player naturally masters both `fork` (combat drones) and turret placement, and their crafting mastery feeds into combat effectiveness.

---

## Craft Mode

Toggled via the **Craft Button** (top-right). While active:
- **Movement** still works (left drag)
- **Right side tap** places blocks/structures/turrets instead of attacking
- Tap craft button again to **exit immediately** (back to combat)
- What you can place depends on what building/crafting commands you've discovered

### Craft Mode Actions (all cost Bits)
- **Place a block** — single terrain block
- **Place a structure** — cluster of blocks (wall, barricade)
- **Place a turret** — stationary auto-attacking process (requires turret command)
- Building commands are **found in the world** like any other ability
- Not available at game start—you must discover them
- The player must have write permissions in the area to build

---

## Resources & Economy

| Resource | Source | Used For |
|----------|--------|----------|
| **Bits** | Destroyed terrain blocks | Building new blocks/structures |
| **Bytes** | Defeated enemies | Purchasing commands, upgrades, items from NPCs |

Bits are volatile and immediate (for building). Bytes are persistent currency (for economy/upgrades).

---

## Terrain System

### Block-Based World
The world is built from **blocks** displaying `1` or `0`:

| Display | Properties |
|---------|------------|
| **1** | Strong — more hits to destroy, drops more Bits |
| **0** | Weak — breaks easily, drops fewer Bits |

### Block Behaviors
- **Destructible blocks** — can be destroyed, drop Bits
- **Indestructible boundaries** — directory walls cannot be destroyed
- **Player-created blocks** — built with collected Bits (requires building commands)
- **Write permissions** required to build in an area

---

## World (Directory Structure)

Each directory is a room/area. Corridors connect parent/child directories. Symbolic links act as fast-travel between visited rooms. Permission-locked doors require specific capabilities.

```
                    [ / ]
                      |
    ┌────────┬────────┼────────┬────────┐
    |        |        |        |        |
 [/home]  [/tmp]   [/var]   [/etc]   [/dev]
    |                  |
 [~/player]       [/var/log]
```

### Areas

- **`~/` (Home)** — Hub / starting zone. Safe area, Kernel's guidance, player's base.
- **`/tmp/`** — First dungeon. Chaotic, unstable terrain. Weak enemies. Tutorial zone.
- **`/var/log/`** — Exploration-focused. Lore fragments in terrain. Quieter pace.
- **`/etc/`** — Market / configuration center. NPCs sell upgrades and commands for Bytes.
- **`/dev/`** — Device dungeon. Hardware-based enemies and puzzles.
- **`/opt/`** — Optional side content, bonus areas, optional bosses.
- **`/root/`** — Endgame sanctum. Requires root privileges.
- **`/etc/cron.d/`** — Final boss arena. Cron's domain.

---

## Enemies
Enemies drop **Bytes** when defeated.

- **Zombie Processes** — Common, slow, swarm in numbers
- **Daemons** — Background processes; can be allies, enemies, or neutral
- **Orphan Processes** — Friendly NPCs, quest givers, kindred spirits
- **Popular Programs** — NPCs based on real Linux programs (Vim, Nano, Grep, etc.)

---

## NPCs & Progression Points

### Package Managers (Ability Vendors)
NPCs that sell or teach/upgrade/train new commands for Bytes:
- **Pacman** — Bleeding-edge abilities
- **Apt** — Stable, well-documented abilities
- **Yum/DNF** — Enterprise-grade abilities

### Upgrade Shrines
Locations where ROM Chips and RAM Modules can be redeemed for permanent stat increases (like Zelda's Goddess Statues).

---

## MVP Scope (First Playable)

1. **Home directory hub** with basic movement and Kernel NPC
   - [x] Basic movement/controls
   - [x] Player rendering
   - [ ] Hub area with Kernel dialogue
2. **Block-based terrain** with `1`/`0` visuals
3. **One combat zone** (`/tmp/`) with Zombie Process enemies
   - [x] Basic enemy AI and collision
   - [x] Mobile touch controls
4. **Two starting commands**: one melee attack, one terrain destroy
5. **Usage-based mastery** tracking for starting commands
6. **Resource drops** — Bits from terrain, Bytes from enemies
7. **ROM/RAM** as health/stamina
8. **One discoverable command** pickup in `/tmp/`
9. **One mini-boss**

---

## Future Scope (Post-MVP)
- Flag unlocks at mastery milestones
- Pipe combo system
- Building commands (touch, mkdir)
- Multiple areas with corridor navigation
- NPC vendors (Package Managers)
- ROM Chip / RAM Module upgrade shrines
- Equipment system (binaries as weapons)
- Death currency drop and recovery
- ping is unlocked after beating cron and is needed to go accross the network to other computers. It also will flip bits so to get to the next computer you have to ping an unreachable block and flip the bit? or when you ping and it hits a block or something it sends it back?
