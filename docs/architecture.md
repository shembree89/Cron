# Cron Architecture & Rendering

## Canvas Rendering System

Cron uses a vanilla HTML5 Canvas rendering system. The core loop and rendering logic are contained in `game.js`.

### Coordinate Systems
The game uses two coordinate systems:
1. **World Space**: The absolute position of entities in the game world (0 to `worldWidth`, 0 to `worldHeight`).
2. **Screen Space**: The position on the canvas relative to the camera.
   - `screenX = worldX - camera.x`
   - `screenY = worldY - camera.y`

### Player Rendering (V6 Design)
The player is rendered as a custom vector shape designed to look like a TRON-style hexagonal chip with a molecular core.

**Components:**
1. **Outer Frame**: A cyan hexagon (`COLORS.cyan`). The "Front" of the player is the pointed vertex at 0 radians (Right in standard math, but visually "Forward" depending on rotation).
2. **Inner Shape**: A filled hexagon that shares the **Front Vertex** with the Outer Frame, creating a pointer/arrow shape.
   - **Health Fill**: The inner shape is filled with Magenta (`#ff00ff`) based on current HP.
   - The fill drains from **Front (+X/Top visual)** to **Back (-X/Bottom visual)**.
   - Implementation uses a clip mask of the inner shape and a filling rectangle that shrinks from the front.
3. **Molecular Core**: A static network of nodes and edges drawn over the Health Fill in the center.

## Hybrid UI System
The game uses a hybrid rendering approach:
1.  **Game World**: Rendered on HTML5 Canvas (Player, Enemies, Terrain, Particles).
2.  **Interface**: Rendered using DOM elements (HTML/CSS) overlaying the canvas.
    -   **Profile Button**: Fixed position icon in bottom-right.
    -   **Profile Modal**: HTML Overlay for displaying stats.
    -   **Benefits**: Easier to style text, handle accessibility, and create responsive layouts for menus compared to canvas text.

### Custom Vector Logic
Instead of sprites, the game uses procedural drawing:
- `ctx.beginPath()`, `ctx.moveTo()`, `ctx.lineTo()` for all shapes.
- Rotation is handled by `ctx.rotate(facingAngle)` before drawing.
- "Front" is always at angle 0 in the local rotated context.

## Game Loop
Standard `requestAnimationFrame` loop:
1. `update()`: Handles movement, input, physics, collision.
2. `draw()`: Clears canvas, applies camera transform, draws world, draws UI.

## File Structure
- `index.html`: Entry point.
- `style.css`: Minimal styling.
- `game.js`: Monolithic game logic (to be split as project grows).
