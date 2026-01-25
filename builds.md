## Builds

The player will start the game by selecting one of the builds but upon level ups can choose to dip into another class. However, dipping into another class starts that tree's abilities at the bottom.

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