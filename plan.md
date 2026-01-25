# Cron
A top-down, 2D, action-RPG set inside a computer system, based on real elements of a Linux computer system. **Real-time combat** in the style of classic Zelda games—quick reflexes, positioning, and timing matter.

**Tech Stack:** Browser-based game using JavaScript (can expand to canvas/WebGL/phaser later)

## Story
**Main Villain:** Cron—the job scheduler gone rogue, corrupting scheduled tasks and spawning malicious jobs across the system.

### Player Backstory
The player is an **orphan process**—their parent process was killed by Cron. The **Kernel** discovered this orphan and, rather than reaping it, gave it a purpose: to stop Cron and restore order to the system.

The Kernel serves as the player's guide and narrator throughout the game. In the backstory, a human user has deployed an "MCP server" with "tool calling" capabilities (attacks/abilities) to help fix their corrupted computer—but in-game, the Kernel is the player's direct mentor.

---

## Player
### Current Design (V6 - Profile UI)
The player is a custom **Hexagonal Molecular Chip**:
- **Outer Frame**: Cyan hexagon.
- **Inner Core**: Smaller filled hexagon pattern.
- **Health**: Magenta background fill of the Inner Core.
- **Visuals**: No on-screen perimeter bars (moved to Profile UI).

### HUD / UI
- **Profile Button**: Bottom-right corner icon (User silhouette). Toggle to view stats.
- **Profile View**: Modal overlay showing numerical stats for Health (ROM), Stamina (RAM), XP (PID), Bits, and Bytes.

### Player Stats
| Stat | Description |
|------|-------------|
| **ROM** | Health — Read-Only Memory, your core integrity |
| **RAM** | Stamina — Used for abilities, regenerates over time |
| **CPU** | Power — Affects damage output |
| **Cores** | Passive ability slots OR ability queue size (decide during implementation) |
| **Bandwidth** | Speed — Movement and attack speed |
| **PID** | XP — Process ID, gained from defeating enemies |

### $PATH (Skill Tree)
Your `$PATH` is a branching skill tree. As you level up, you add new "directories" to your path, unlocking new command sets and abilities. Different branches lead to different build specializations.

```
$PATH=/home/player → /usr/bin → /opt/skills → ...
```

---

## Resources & Economy

### Dual Currency System

| Resource | Dropped By | Stored In | Used For |
|----------|-----------|-----------|----------|
| **Bits** | Destructible terrain/structures | **Cache** (fast access, limited capacity) | Creating new blocks/structures |
| **Bytes** | Enemies | **Storage** (larger capacity, persistent) | Purchasing items, upgrades, abilities |

**Design intent:** Bits are quick and volatile (for building/crafting in the moment), Bytes are persistent currency (for economy/upgrades).

---

## Terrain System

### Block-Based World
The world is built from **blocks**—each block displays either a `1` or `0` on its surface, reinforcing the binary/digital aesthetic.

#### Block Types by Value
| Display | Meaning | Properties |
|---------|---------|------------|
| **1** | Strong/solid | More hits to destroy, drops more Bits |
| **0** | Weak/fragile | Breaks easily, drops fewer Bits |

#### Block Behaviors
- **Destructible blocks** — Can be removed with `rm`, drop **Bits**
- **Indestructible boundaries** — Directory walls (folder edges) cannot be destroyed
- **Player-created blocks** — Built with `mkdir` (structure) or `touch` (single block)
- **Player must have write permissions** to build in an area

### Directory = Room/Area
Each folder in the Linux filesystem is a **room or zone**:
- Rooms are connected via **corridors** (paths between directories)
- The layout follows a real Linux directory structure
- Parent directories are connected to child directories logically
- Moving between rooms = (navigating the filesystem)
- Access to a room is determined by if the player has read permissions
- Ability to build is determined by if the player has write permissions

```
                    [ / ]
                      |
    ┌────────┬────────┼────────┬────────┐
    |        |        |        |        |
 [/home]  [/tmp]   [/var]   [/etc]   [/dev]
    |                  |
 [~/player]       [/var/log]
```

### Corridor Design
Corridors connecting rooms could be:
- Narrow passages with minimal destructible content
- Symbolic links = shortcuts/warp points between distant directories
    - Links can be fast travel, they can be made between rooms the player has been
- Permission-locked doors (need sudo or specific capabilities)

---

## Builds

### Bash (Melee)
*"Bourne Again Shell"—and again, and again...*

Focuses on close combat. Requires the most player input—quick reflexes, timing, and positioning. High risk, high reward.

**Playstyle:** Aggressive, in-your-face combat with combos and parries.

---

### Ping (Ranged)

Focuses on long-range combat and stealth. Moderate input during combat, emphasizing accuracy, precision, and positioning.

**Playstyle:** Careful, strategic—find cover, line up shots, exploit weaknesses.

---

### Init (AoE/Summoner)

Focuses on spawning subprocesses to fight for you and dealing area-of-effect damage. Lowest direct input during combat—almost plays like Brotato where auto-attacks happen while you dodge.

**Playstyle:** Crowd control, positioning, managing your spawned processes.

---

## Commands (Abilities)

Commands are now split into **Combat**, **Terrain**, and **Utility** categories.

### Combat Commands
| Command | Base Effect | Bash (Melee) | Ping (Ranged) | Init (AoE) |
|---------|-------------|--------------|---------------|------------|
| `kill` | Basic attack | Direct melee strike | Targeted ranged shot | Damages area |
| `pkill` | Multi-target attack | Cleave attack | Piercing shot | AoE burst |
| `mv` | Repels enemy | `-f` knockback + damage | `-t` further range | `-v` repels all nearby |
| `cd` | Teleport/dash | `-L` chain dash | `-P` phase through | `-e` invuln frames |
| `sudo` | Power modifier | Makes next attack slower but much stronger | | |

### Terrain Commands
| Command | Effect | Notes |
|---------|--------|-------|
| `rm` | **Destroy terrain** | Removes blocks, drops Bits. Cannot destroy directory boundaries. |
| `rm -rf` | **Area destruction** | Destroys multiple blocks at once (costs more stamina) |
| `mkdir` | **Create structure** | Costs Bits. Creates a cluster of blocks (walls, barricades) |
| `touch` | **Create single block** | Costs Bits. Places one block |
| `cp` | **Duplicate block** | Copy an existing block to another location |

### Utility Commands
| Command | Effect | Notes |
|---------|--------|-------|
| `ls` | **Reveal area** | Shows hidden enemies, items, or secret paths |
| `grep` | **Mark/target** | Highlights enemies, makes them take more damage |
| `cat` | **Combine** | Merge items or chain abilities |
| `chmod` | **Modify properties** | Change block/enemy resistances |
| `curl`/`wget` | **Pull** | Drag enemies or items toward you |

---

## NPCs & Enemies
Enemies drop **Bytes** (currency) and **PID** (XP) when defeated.

### Zombie Processes
The most common enemy. Slow, easy to kill individually, but numerous. Swarm tactics—overwhelm through sheer numbers.

### Daemons
Background processes that can be allies, enemies, or neutral. Some start friendly and become corrupted; others start hostile but can be redeemed.

### Orphan Processes
Friendly NPCs the player can interact with. Often need help, rescue, or have quests. They're kindred spirits to the player.

### Popular Programs
NPCs and enemies based on real Linux programs:
- **Vim** — Wise but cryptic sage (hard to escape from)
- **Nano** — Friendly, approachable helper
- **Systemd** — Controversial figure, either loved or hated
- **Firefox** — Memory-hungry but well-meaning ally
- **Grep** — Detective/scout type

---

## World (Directory Structure)

The world is structured like a Linux filesystem. Each directory is a **room/area** with:
- **Indestructible boundary walls** (the folder itself)
- **Destructible interior content** (terrain blocks, obstacles)
- **Corridors** connecting to parent/child directories

### Starting Areas

#### `~/` (Home Directory)
**The Hub / Starting Zone**

The player's home base. Safe area with basic tutorials, the Kernel's guidance, and access to the first quests. Contains the player's config files (save points?) and personal directories.

- Interior is mostly empty, player can build here
- `.bashrc`, `.config/` could be interactable objects

#### `/tmp/` (Temporary Files)
**First Dungeon — The Ephemeral Wastes**

A chaotic, ever-changing area. Terrain blocks randomly appear and disappear. Enemies here are weak but unpredictable. Good tutorial zone for combat and terrain mechanics.

- Blocks here are unstable—some expire and vanish
- Environment hazards: areas that "expire" and damage you if you linger
- Good source of Bits but volatile

**Boss:** A rogue temporary process that refuses to be cleaned up.

#### `/var/log/` (Log Files)
**The Archives**

A quieter, exploration-focused area. Dense with destructible blocks containing lore. The player pieces together what happened from log entries hidden in terrain.

- "Echo" enemies that replay past events
- Blocks here often contain story fragments

---

### Later Areas (To Be Designed)

#### `/etc/` (Configuration)
**The Market / Configuration Center**

A store or market-style location. NPCs sell upgrades, abilities, and items for Bytes. Config files that can be "edited" to change game parameters.

#### `/dev/` (Devices)
**The Device Dungeon**

Hardware-based enemies and puzzles. Special enemies: `/dev/null` (consumes attacks), `/dev/random` (chaotic behavior), `/dev/zero` (infinite weak spawns).

#### `/opt/` (Optional Software)
**The Optional Frontier**

Side content, bonus areas, optional bosses.

#### `/root/` (Root Home)
**Endgame — The Sanctum**

Requires root privileges to enter. Final area before confronting Cron. Heavily guarded.

#### `/etc/cron.d/` or `/var/spool/cron/`
**Final Boss Arena**

Cron's domain. The scheduled job queue made manifest.

---

## Progression Systems

### Package Managers (Move Tutors)
NPCs that teach new abilities:
- **Pacman** — The Arch way, bleeding edge moves
- **Apt** — Stable, reliable, well-documented moves
- **Yum/DNF** — Enterprise-grade abilities
- **Flatpak/Snap** — Containerized abilities (self-contained, no dependencies)

### Scripts (Consumables)
One-time-use items that execute powerful effects. Can be found, crafted, or purchased with Bytes.

### Shells (Classes or Cosmetics)
Different shells could be:
- **Cosmetic skins** — Bash, Zsh, Fish, etc. look different
- **Minor stat modifiers** — Each shell has small bonuses
- **Decide during implementation**

---

## Future Considerations (Not for MVP)
- Networking areas (accessing remote systems, multiplayer?)
- Hacking/security mechanics
- Viruses, worms, malware as enemy types or events
- Security software as allies or environmental effects
- Other operating systems as alternate dimensions/DLC
- File type extensions affecting enemy behaviors
- Kernel panics as fail states or special events

---

## MVP Scope (First Playable)
1. **Home directory hub** with basic movement and one NPC (Kernel)
   - [x] Basic movement/controls
   - [x] Player rendering (V5 Design)
   - [ ] Hub area
2. **Block-based terrain** with `1`/`0` visuals
3. **One combat zone** (`/tmp/`) with Zombie Process enemies
4. **Resource drops** — Bits from terrain, Bytes from enemies
5. **Core commands:**
   - `kill` — Attack enemies
   - `rm` — Destroy terrain (drops Bits)
   - `touch` — Create single block (costs Bits)
6. **Simple health/stamina** (ROM/RAM)
   - [x] Profile UI implemented (Bars removed)
   - [ ] Logic/Regen tuning
7. **Basic enemy AI** and collision
8. **One mini-boss**

Then iterate from there.