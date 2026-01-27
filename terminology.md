# Terminology: Game ↔ Linux Translation

Quick reference for mapping standard RPG/game concepts to their Linux-themed equivalents in Cron.

## Player & Identity

| Game Concept | Linux Term | Notes |
|-------------|-----------|-------|
| Player character | **Orphan Process** | A process whose parent was killed |
| Guide / narrator | **Kernel** | The core of the OS, manages everything |
| Player death | **Kernel Panic** | Process crashed successfully |
| Respawn | **Reboot** | |
| Save point | **Snapshot** | |

## Stats & Resources

| Game Concept | Linux Term | Notes |
|-------------|-----------|-------|
| Health | **ROM** | Read-Only Memory — your core integrity |
| Stamina | **RAM** | Random Access Memory — regenerates over time |
| Health upgrade item | **ROM Chip** | Found in dungeons/shrines, applies directly on pickup |
| Stamina upgrade item | **RAM Module** | Found in dungeons/shrines, applies directly on pickup |
| Currency (from terrain) | **Bits** | Binary digits — volatile, for building |
| Currency (from enemies) | **Bytes** | 8 bits — persistent, for economy |

## Combat & Abilities

| Game Concept | Linux Term | Notes |
|-------------|-----------|-------|
| Weapon / tool | **Binary** | An executable program you equip (e.g., `bash`, `ping`) |
| Ability / attack / spell | **Command** | An action a binary can execute (e.g., `kill`, `pkill`, `fork`) |
| Equipped abilities | **$PATH** | The shell's command search path |
| Ability upgrade / variant | **Flag** | Command-line flags (-f, -r, -9, etc.) |
| Combo / chain | **Pipe** | `cmd1 \| cmd2` — output of one feeds into another |
| Proficiency / skill level | **Version** | v0.0 → v1.0 per command, increased through use |
| Inventory | **/bin** | Where executables live |
| Consumable item | **Script** | One-time-use program |
| Armor / passive defense | **Library** / **.so** | Shared object — passive bonuses |
| Accessory / trinket | **Plugin** / **Module** | Small stat tweaks |

## Summoner / Drones

| Game Concept | Linux Term | Notes |
|-------------|-----------|-------|
| Summon / spawn minion | **fork** | Create a child process |
| Drone / minion | **Subprocess** / **Child Process** | Short-lived combat entity |
| Turret / totem | **Daemon** / **Service** | Stationary, auto-attacks nearby enemies |
| Aggro / taunt | **Priority** / **nice** | Process scheduling priority |

## Building & Crafting

| Game Concept | Linux Term | Notes |
|-------------|-----------|-------|
| Place single block | **touch** | Create a file |
| Place structure | **mkdir** | Create a directory (cluster of blocks) |
| Destroy terrain | **rm** | Remove a file |
| Area destroy | **rm -rf** | Recursive force remove |
| Copy block | **cp** | Copy a file |
| Move block | **mv** | Move a file |
| Craft mode | **Edit Mode** | Having write permissions |
| Build permission | **Write permission** | `chmod +w` |

## World & Navigation

| Game Concept | Linux Term | Notes |
|-------------|-----------|-------|
| Room / area / zone | **Directory** | Each folder is a playable area |
| Corridor / hallway | **Link** | Hard link — direct connection between directories |
| Fast travel / portal | **Symlink** | Soft link — shortcut between distant directories |
| Locked door | **Permission gate** | Requires sudo or specific capabilities |
| Admin access | **Root** / **sudo** | Highest privilege level |
| World map | **Filesystem tree** | `/` is the root of everything |
| Hub / home base | **~/** (Home directory) | Player's personal space |
| Wall / boundary | **Directory boundary** | Indestructible edges of a folder |

## Enemies

| Game Concept | Linux Term | Notes |
|-------------|-----------|-------|
| Common enemy (weak, swarms) | **Zombie Process** | Dead but not reaped |
| Elite enemy / neutral NPC | **Daemon** | Background process |
| Friendly NPC | **Orphan Process** | Kindred spirit to the player |
| Final boss | **Cron** | The corrupted job scheduler |
| Enemy loot | **Bytes** | Dropped on death |

## Progression & Shops

| Game Concept | Linux Term | Notes |
|-------------|-----------|-------|
| Ability vendor / shop | **Package Manager** | Pacman, Apt, Yum/DNF |
| Unlock new ability | **Install** / **apt install** | |
| Upgrade ability | **Update** / **apt upgrade** | |
| Version milestone | **Version** | v0.0 → v1.0 as proficiency grows |

## UI

| Game Concept | Linux Term | Notes |
|-------------|-----------|-------|
| Pause / stats screen | **Shell** | |
| Inventory tab | **/bin** | Where your binaries/commands live |
| Equipped loadout | **$PATH** | |
| Craft toggle | **Edit Mode** | Top-right, toggles write mode |

## Unused Linux Terms

Potential terms for future use — not yet assigned to a game concept.

### Commands & Binaries
| Term | What It Does (IRL) | Potential Game Use |
|------|--------------------|--------------------|
| `grep` | Search text for patterns | Scan/reveal — highlight enemies, find hidden items |
| `find` | Search filesystem for files | Map reveal, locate objectives |
| `sed` | Stream editor — transform text | Modify enemy properties, debuff |
| `awk` | Pattern processing language | Advanced crafting, complex transformations |
| `cat` | Concatenate files | Merge items, combine resources |
| `echo` | Print text to output | Taunt/distract, lure enemies |
| `chmod` | Change file permissions | Unlock areas, modify block properties |
| `chown` | Change file ownership | Claim territory, convert enemies |
| `ln` | Create links | Create shortcuts between areas |
| `tar` | Archive files | Bundle items, compress inventory |
| `zip` / `gzip` | Compress files | Shrink/compact, store more efficiently |
| `dd` | Disk duplicator | Clone, duplicate items or blocks |
| `wget` / `curl` | Download from network | Pull items/enemies toward you |
| `ssh` | Secure shell | Remote access, teleport to other systems |
| `scp` | Secure copy | Send items between locations |
| `man` | Manual pages | Lore, tutorials, ability descriptions |
| `top` / `htop` | Process monitor | Enemy radar, system status display |
| `ps` | Process status | See nearby enemy stats |
| `nice` / `renice` | Set process priority | Buff/debuff speed and priority |
| `nohup` | No hangup | Persistence buff, survive what would normally kill |
| `screen` / `tmux` | Terminal multiplexer | Split self, be in two places at once |
| `alias` | Create command shortcut | Quick-cast, bind combos to single action |
| `crontab` | Schedule jobs | Set timed abilities, delayed attacks |
| `at` | Schedule one-time job | Delayed single-use ability |
| `diff` | Compare files | Analyze enemies, find weaknesses |
| `patch` | Apply changes | Heal, repair, fix corruption |
| `make` | Build from source | Advanced crafting system |
| `gcc` / `rustc` | Compiler | Forge/create powerful items from raw code |

### System Concepts
| Term | What It Is (IRL) | Potential Game Use |
|------|------------------|--------------------|
| **PID** | Process ID | Enemy/NPC unique identifier, quest tracking |
| **Signal** | Inter-process communication | Status effects (SIGSTOP=freeze, SIGKILL=instakill) |
| **Pipe** | Connect stdout to stdin | Already used — ability combo system |
| **Socket** | Network communication endpoint | Multiplayer connection, NPC communication |
| **Thread** | Lightweight process | Split attacks, multi-target |
| **Mutex** | Mutual exclusion lock | Stun/freeze — lock an enemy in place |
| **Semaphore** | Counting synchronization | Gate that allows N entities through |
| **Buffer** | Temporary data storage | Shield, temporary HP |
| **Cache** | Fast-access storage | Quick-access item slots |
| **Swap** | Overflow memory | Emergency stamina reserve when RAM is full |
| **Inode** | File metadata | Hidden item properties, lore |
| **Mount** | Attach filesystem | Connect new areas, unlock zones |
| **Umask** | Default permission mask | Passive defense modifier |
| **FIFO** | First-in first-out queue | Turn order, queue-based puzzle mechanic |
| **Interrupt** | Hardware signal to CPU | Stagger/stun, break enemy actions |
| **Kernel module** | Loadable driver | Equippable passive ability |
| **Namespace** | Isolated process environment | Pocket dimension, hidden area |
| **Container** | Isolated environment | Arena, trapped room, boss fight enclosure |
| **Firewall** | Network traffic filter | Shield wall, barrier that blocks certain attacks |
| **Proxy** | Intermediary server | Decoy, redirect attacks |
| **DNS** | Domain name resolution | Translate/decode, reveal true names |
| **DHCP** | Dynamic address assignment | Random buff/stat assignment |
| **Packet** | Network data unit | Projectile (already used for Ping) |
| **Checksum** | Data integrity verification | Detect corruption, verify quest items |
| **Encryption** | Data obfuscation | Stealth, hide from enemies |
| **Decryption** | Data reveal | Unlock secrets, decode messages |
| **Rootkit** | Malicious hidden software | Enemy type — hidden, hard to detect |
| **Trojan** | Disguised malware | Enemy type — looks friendly, attacks |
| **Worm** | Self-replicating malware | Enemy type — multiplies |
| **Ransomware** | Encrypts and holds data hostage | Enemy/boss — locks your abilities |
| **Botnet** | Network of compromised machines | Enemy army, horde event |
| **Zero-day** | Unknown vulnerability | Rare/legendary weakness to exploit |
| **Sandbox** | Isolated test environment | Safe training area, practice room |
| **Daemon** | Background service | Already used — elite enemy / NPC type |
| **Cgroup** | Resource control group | Limit enemy power, nerf zone |
| **OOM Killer** | Out-of-memory killer | Environmental hazard — kills lowest priority |
