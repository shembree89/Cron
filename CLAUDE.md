# Cron - Claude Code Project Context

## What This Is
A top-down 2D action-RPG set inside a Linux computer system. The player is an orphan process fighting Cron (the corrupted job scheduler). Combat is real-time Zelda-style.

## Tech Stack
- **Engine**: Vanilla JavaScript canvas (no frameworks)
- **Files**: `index.html`, `game.js`, `style.css`
- **PWA**: `service-worker.js` with Network First strategy
- **Hosting**: GitHub Pages

## How to Run Locally
```bash
cd ~/Code/Cron
python3 -m http.server 8000
```
Then open http://localhost:8000

## How to Deploy
When the user approves changes for deployment:
1. Bump version: `python3 scripts/bump_version.py`
2. Stage: `git add -A`
3. Commit with descriptive message
4. Push: `git push origin master`

Live site: https://shembree89.github.io/Cron/

## Planning Documents
These are the collaborative design docs - read them to understand current state and plans:
- `plan.md` - Master game design document, MVP checklist, story, mechanics
- `builds.md` - Class system ($PATH), stats, progression, equipment
- `instructions.md` - Notes for AI agents working on this project

## Key Design Concepts
- **Player**: Hexagonal chip design, stats displayed in Profile UI (bottom-right)
- **Stats**: ROM (health), RAM (stamina), CPU (power), Cores, Bandwidth (speed), PID (XP)
- **Currency**: Bits (from terrain) and Bytes (from enemies)
- **Classes**: Bash (melee), Ping (ranged), Init (summoner/AoE)
- **World**: Linux filesystem structure (directories = rooms)

## Code Structure
- `game.js` - All game logic (~84KB, monolithic)
- `style.css` - UI styling
- `index.html` - Entry point with canvas
- `scripts/bump_version.py` - Cache busting for deploys

## Current State (check plan.md for latest)
- Basic movement, player rendering, touch controls: DONE
- Class selection (Bash/Ping/Init): DONE
- Profile UI with stats: DONE
- Hub area, terrain system, resource drops: IN PROGRESS

## Workflow
1. User discusses features/bugs via plan.md and conversation
2. I implement changes in game.js/style.css/index.html
3. User tests locally (I can spin up the dev server)
4. When approved, I deploy using the steps above

## Important Notes
- Always bump version before deploying (cache busting)
- The game uses a custom canvas engine - no external dependencies
- Mobile touch controls are implemented
- Service worker uses Network First for navigation requests
