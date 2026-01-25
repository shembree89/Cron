# Cron - The Process Wars

A top-down, 2D, action-RPG set inside a computer system, based on real elements of a Linux computer system.

## Project Structure

- `index.html`: Entry point.
- `game.js`: Core game logic and rendering.
- `style.css`: Styling for the game container and UI overlay.
- `service-worker.js`: PWA support and caching strategy.
- `scripts/`: Utility scripts (e.g., version bumping).
- `.agent/workflows/`: Agentic workflows.

## Current State

- **Engine**: Custom vanilla JS canvas engine.
- **UI**: 
  - Legacy HUD (top-left bars) has been **removed**.
  - **Player Profile UI** added (Bottom-right icon).
  - Profile displays real stats (Health, Stamina, XP, Bits, Bytes).
- **Network**:
  - `service-worker.js` uses a **Network First** strategy for navigation to ensure updates are seen immediately.
  - Automated version bumping script (`scripts/bump_version.py`) handles cache busting on deployment.

## How to Run Locally

You can run the game using any static file server. Python is pre-installed:

```bash
python3 -m http.server 8000
```
Then visit `http://localhost:8000`.

## Deployment

The project is deployed to GitHub Pages.

### Automated Deployment
The recommended way to deploy is using the agent workflow or the following command sequence, which handles version bumping for cache busting:

```bash
# 1. Bump version numbers in index.html and service-worker.js
python3 scripts/bump_version.py

# 2. Stage changes
git add -A

# 3. Commit
git commit -m "Your deployment message"

# 4. Push to master (triggers GitHub Pages build)
git push origin master
```

**Workflow File**: `.agent/workflows/deploy.md`

### Live URL
[https://shembree89.github.io/Cron/](https://shembree89.github.io/Cron/)
