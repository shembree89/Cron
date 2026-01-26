# Builds & Progression

> **Design Philosophy:** "Combat Dungeons & Dragons". Slow, meaningful leveling. Deep customization. Structure over randomness.

## Core Combat Stats

Instead of traditional D&D attributes (Str/Dex/Wis), we use system-themed stats that map directly to combat mechanics.

| Stat | System Term | Analogy | Effect |
|------|-------------|---------|--------|
| **Power** | **COMPUTE** | Strength | Increases raw damage output and knockback force. |
| **Speed** | **CLOCK** | Agility | Increases attack speed, movement speed, and critical hit chance. |
| **Stability**| **MEMORY** | Constitution | Increases Max RAM (Stamina), Health (ROM), and resistance to status effects (glitches). |
| **Efficiency**| **BANDWIDTH**| Intelligence | Reduces cooldowns, increases area of effect (AoE), and improves drone/utility effectiveness. |

---

## $PATH (The Class System)

Your `$PATH` determines your combat identity. Unlike a simple class selection, your `$PATH` is a **Skill Tree** that branches into specialized directories. First-level subdirectories are broad notions of the build, while deeper subdirectories are specific specializations.

### 1. Bash (`/bin/bash`)
**The Heavy Hitter.** Focuses on **COMPUTE** and **MEMORY**.
*   **Playstyle:** Deliberate, high-impact strikes. You don't click fast; you click *effectively*.
*   **Core Mechanic:** *Combo Chain*. Landing consecutive hits without taking damage builds "Uptime", increasing damage.

#### Sub-Directories (Specializations)
*   **`/bin/bash/force` (Juggernaut)**
    *   Focus: Tanking, crowd control, survivability.
    *   Key Ability: `sudo` - Entering a stance that absorbs damage and reflects it.
    *   *Feat Example*: "Immutable Bit" - Cannot be knocked back.
*   **`/bin/bash/brute` (Berserker)**
    *   Focus: Raw damage, trading health for power.
    *   Key Ability: `nice -n -20` - Drastically increase priority (damage) but drain RAM (Stamina) rapidly.
    *   *Feat Example*: "Kernel Panic" - Low health amplifies damage output.

### 2. Ping (`/usr/bin/ping`)
**The Precision Striker.** Focuses on **CLOCK** and **BANDWIDTH**.
*   **Playstyle:** Mobility, spacing, and accuracy. High skill ceiling for aiming and dodging.
*   **Core Mechanic:** *Latency*. The longer you remain undetected or untouched, the higher your critical hit chance.

#### Sub-Directories (Specializations)
*   **`/usr/bin/ping/echo` (Sniper)**
    *   Focus: Long-range, single-target elimination.
    *   Key Ability: `traceroute` - Marks a target to take guaranteed critical hits from the next attack.
    *   *Feat Example*: "Packet Loss" - Attacks have a chance to phase through walls.
*   **`/usr/bin/ping/flood` (Skirmisher)**
    *   Focus: Hit-and-run, rapid fire, kiting.
    *   Key Ability: `ddos` (Distributed Denial) - Rapidly fire a stream of weak projectiles that slow enemies.
    *   *Feat Example*: "Asynchronous I/O" - Can move at full speed while attacking.

### 3. Init (`/sbin/init`)
**The System Architect.** Focuses on **BANDWIDTH** and **MEMORY**.
*   **Playstyle:** Strategic placement, territory control, indirect damage.
*   **Core Mechanic:** *Child Processes*. You manage a pool of resources to spawn autonomous entities.

#### Sub-Directories (Specializations)
*   **`/sbin/init/daemon` (Summoner)**
    *   Focus: Minion management.
    *   Key Ability: `fork` - Create a clone of yourself or a minion with shared stats.
    *   *Feat Example*: "Zombie Reaper" - When minions die, they explode.
*   **`/sbin/init/service` (Controller)**
    *   Focus: Buffs, debuffs, and environmental hazards.
    *   Key Ability: `systemd` - Setup a service (turret/totem) that buffs you and debuffs enemies in an area.
    *   *Feat Example*: "Cron Job" - Automate a spell to cast itself every X seconds for free.

---

## Progression & Leveling (The Upgrade Circle)

Leveling up is **slow**. You might only level up once or twice per zone.
When you level up (`apt upgrade`), you gain:
1.  **Stat Points:** Allocate to Compute, Clock, Memory, or Bandwidth.
2.  **Feat Selection:** Choose a significant passive upgrade or new active ability from your `$PATH`.

### Multiclassing (Symlinking)
You can "symlink" to another path (`ln -s /bin/bash /sbin/init`).
*   This accesses the **base traits** of another class but locks you out of their deepest specializations (Tier 3).
*   *Example*: A Bash player symlinking to Ping might get the speed boost (Clock) but will never get the `traceroute` ultimate.

---

## Equipment (Packages)

Loot is not random "sword +1". It is **Software Packages**.
*   **Binaries (Weapons)**: The main executable you run (Sword, Bow, Staff equivalent).
*   **Libraries (Armor/Shields)**: Shared objects (`.so`) that provide passive defenses.
*   **Scripts (Consumables)**: One-time use programs.
*   **Plugins (Accessories)**: Small tweaks to stats.

*Items have "Dependencies".* You might need 15 BANDWIDTH to equip a high-tier Drone Controller.