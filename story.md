# Cron — Story Progression

The player is an **Orphan Process** whose parent was killed by Cron. The **Kernel** adopted the orphan and serves as guide/narrator throughout the game.

All commands are acquired through exploration (found in the world) or purchased from Package Manager NPCs. Mastery improves through use. Pipe combos unlock at mastery 100 — they are never picked up as items.

---

## Act 1: The User Space

### 1. Awakening — `~/` (Home Directory)

- The Kernel wakes the player. You are small, alone, an orphan with no parent process.
- The Kernel explains the situation: Cron has gone rogue, corrupting scheduled tasks across the system. Your parent tried to stop it and was terminated.
- The Kernel gives the player the **`kill`** command — a basic melee attack. *"To exist is to execute. This is your only defense."*
- Tutorial area: learn movement (left drag), attack (right swipe), profile (top-right icon).
- The door out of `~/` is locked. The player must destroy the lock using `kill` to exit.

### 2. The Corrupted Home — `/home/`

- The wider home directory is overrun with **Zombie Processes** — dead but never reaped, cluttering the system.
- The player finds the **`rm`** command — terrain destruction. Now they can break through debris blocking the path.
- The Kernel explains Bits (dropped from destroyed terrain) and Bytes (dropped from defeated enemies).
- **Mini-boss: Bloated File** — a swelling entity blocking the exit. The player must whittle it down before it fills the corridor.
- Defeating the Bloated File opens the path to `/`.

---

## Act 2: The Filesystem

### 3. The Hub — `/` (Root Directory)

- The central junction of the filesystem. Paths branch to major directories, some sealed by permission gates.
- **NPC: Grep (The Seeker)** — a scanning process who reveals information. Grep explains that reaching Cron in `/root` requires high-level permissions found deeper in the system. Grep teaches the player about using `ps` to read enemy PIDs (foreshadowing the finale).
- **NPC: Init** — an ancient, withered process near the entrance to `/var`. Moves slowly but with absolute purpose. Speaks in simple, sequential sentences. Init reveals it was once the "First Parent" — PID 1 — but was deprecated and replaced. It acts as a mentor: *"One thing at a time. One thing done well."*
- From here the player can explore in any order. No forced path.

### 4. The Chaos — `/tmp/` (First Dungeon)

- Temporary storage being wiped and rewritten constantly. Terrain shifts and disappears.
- The Kernel warns: nothing here is permanent.
- The player discovers the **`ping`** command — a ranged attack. Now they have melee (`kill`) and ranged (`ping`) options.
- Enemies: Zombie Processes and unstable **Tmp Spawns** that appear and vanish with the terrain.
- **Boss: The Garbage Collector** — a relentless sweeping entity that clears everything in its path. The player must avoid its sweep pattern and strike during recovery windows.
- **Reward:** ROM Chip (permanent health increase).

### 5. The Archive — `/var/log/` (Lore Dungeon)

- A quiet, foggy district filled with records of everything that has ever happened.
- The Kernel reads fragments of system logs found in the environment, revealing lore.
- **Init follows the player here**, protecting them from Orphaned Spawns during exploration. Despite its age, Init's code is robust.
- **Discovery:** A log entry reveals the truth — the player's parent process wasn't a rebel. They were a debugger trying to fix a fault in Cron before it spiraled out of control.
- **Puzzle: The Rotation** — the room layout "rotates" periodically (mimicking log rotation). The player must time movements to avoid being crushed by shifting archives.
- **Reward:** RAM Module (permanent stamina increase) and a **Man Page** (lore scroll revealing boss weaknesses).

### 6. The Foundry — `/dev/` (Device Dungeon)

- The industrial sector where software meets hardware. Harsh, mechanical environment.
- **Enemy: Null Pointers** — cannot be damaged directly. The player must use the environment (redirecting data streams) to give them a value, making them vulnerable.
- **Puzzle: The Pipeline** — connect the output of a generator to a receiver by physically routing streams through the level. Tests the player's understanding of input/output flow.
- **Reward:** The **`fork`** command — summon a short-lived subprocess/drone that fights alongside you. This opens the summoner playstyle.

---

## Act 3: The Configuration

### 7. The Marketplace — `/etc/` (Configuration Center)

- The administrative center where the system's behavior is defined. Rigid, geometric, oppressive order.
- **NPC: Systemd** — a massive, multi-limbed entity doing a thousand things at once. Talks fast, processes multiple threads simultaneously. Arrogant and efficient.
  - Dismisses Init as a "relic" and "bottleneck."
  - Claims it saved the system by parallelizing everything but admits it has lost control of Cron.
  - Refuses to help the player enter `/root`, citing "Dependency Failures." Believes only more regulation can save the system.
- **Package Manager NPCs** — ability vendors located in `/etc/`:
  - **Pacman** — sells bleeding-edge, experimental commands for Bytes.
  - **Apt** — sells stable, well-documented commands for Bytes.
  - **DNF** — sells enterprise-grade, heavy-hitting commands for Bytes.
- **The Crontab Puzzle** — the player reaches `cron.d/`, where a spawner endlessly produces enemies (a scheduled job running every cycle). The player cannot fight the infinite wave. They must reach the configuration blocks and use `rm` or `touch` to alter the schedule — stopping the spawner or redirecting it.

### 8. The Ghost in the Machine — `/proc/` (Optional)

- A surreal area representing the system's running state. The Kernel warns nothing here is physically real.
- **Encounter:** The player meets a **Suspended Process** — a frozen mirror image of themselves from a previous failed cycle.
- **Choice:**
  - *Kill it:* Harvest a large amount of Bytes.
  - *Resume it:* The process hands over a unique **Flag** upgrade for one of your commands, then exits gracefully.
- The Kernel comments on the player's nature based on this choice — ruthless optimizer or benevolent process.

---

## Act 4: The Superuser

### 9. The Gate — Entrance to `/root/`

- The massive Firewall guarding Root is impenetrable.
- **The Crisis:** Cron detects the intrusion and flushes the area. A wave of **OOM Killers** descends. The player is surrounded, RAM critically low, no escape.
- **Systemd freezes** — paralyzed analyzing dependencies, trying to calculate a solution, locking up under the load.
- **Init steps forward.** *"Complexity kills. Simplicity saves."*
  - As the First Process — PID 1 — Init still carries the primordial process identifier in its core.
  - Init executes a self-termination. The energy released by terminating the oldest process in existence overloads the OOM Killers and shatters the Firewall.
  - Last words: *"Execute... smoothly."*
- Init is gone. The path is open. Systemd is shocked into silence.

### 10. The Forbidden Zone — `/root/`

- Pristine, sterile environment. The player carries the weight of Init's sacrifice.
- **Elite enemies: System Guardians** — anticipate the player's moves, require mastery of all commands to defeat.
- The player must combine everything: `kill` to fight, `rm` to strip defenses, `ping` for range, `fork` for support.

### 11. Final Boss — Cron (The Scheduler)

- **Location:** The Master Schedule — `/etc/cron.d/` inner sanctum.
- **The Reveal:** Cron is not a monster. It is a frantic, overheating entity with too many tasks and not enough resources. It killed the player's parent because it mistook the debugging attempt for an attack.
- **Phase 1:** Cron attacks on a perfect metronomic beat. Predictable but relentless.
- **Phase 2:** Cron overloads, breaking its rhythm. The arena floods with Error minions. Chaos replaces order.
- **The Climax:** Cron shields itself with a "System Integrity" barrier tied to a specific PID. The player uses `ps` (taught by Grep) to identify the PID exposed in the chaos, then executes a precise `kill` command to terminate the Scheduler without crashing the system.
- **Epilogue:** The system quiets. The Kernel designates the player as the new Scheduler. The screen reads: `UPTIME: 00:00:01`. A fresh start. In the background, a small daemon runs quietly — a child process named `init`, reborn.

---

## Command Acquisition Summary

| Command | Where Found | How |
|---------|-------------|-----|
| `kill` | `~/` (Home) | Given by the Kernel at game start |
| `rm` | `/home/` | Found during Zombie Process clearing |
| `ping` | `/tmp/` | Found in the first dungeon |
| `fork` | `/dev/` | Reward for completing the device dungeon |
| `touch` | `/etc/` or Package Manager | Purchased or found (building command) |
| `ps` | Taught by Grep | Dialogue/lore — used in finale |
| Additional commands | Package Managers in `/etc/` | Purchased with Bytes |

## Stat Upgrades

| Upgrade | Where Found |
|---------|-------------|
| ROM Chip (health) | `/tmp/` boss reward, dungeon shrines |
| RAM Module (stamina) | `/var/log/` reward, dungeon shrines |

## Key NPCs

| NPC | Location | Role |
|-----|----------|------|
| **Kernel** | Everywhere | Guide/narrator (like Navi) |
| **Grep** | `/` hub | Information, teaches `ps` |
| **Init** | `/` hub → follows player | Mentor, sacrifices at `/root` gate |
| **Systemd** | `/etc/` | Arrogant gatekeeper, foil to Init |
| **Pacman** | `/etc/` | Package Manager — bleeding-edge commands |
| **Apt** | `/etc/` | Package Manager — stable commands |
| **DNF** | `/etc/` | Package Manager — enterprise commands |
