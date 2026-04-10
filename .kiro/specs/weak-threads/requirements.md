# Requirements Document

## Introduction

Weak Threads is a browser-based physics puzzle game inspired by Cut the Rope. The player cuts threads holding a gem to guide it into a target basket using gravity and momentum. The game runs entirely in a single HTML file (`weak-threads/index.html`) with no build step, using Matter.js for physics and the Canvas 2D API for rendering. It features multiple handcrafted levels of increasing difficulty, smooth 60fps physics, particle effects, and a neon visual style on a dark background.

---

## Glossary

- **Game**: The Weak Threads browser application running in `weak-threads/index.html`
- **PhysicsEngine**: The wrapper around Matter.js that manages the physics world
- **LevelManager**: The component that owns level definitions, loads/unloads levels, and tracks win/loss state
- **Renderer**: The component that draws the scene each frame onto the canvas using Canvas 2D API
- **InputHandler**: The component that translates mouse/touch events into game actions
- **Gem**: The circular dynamic physics body the player guides into the basket
- **Basket**: The static sensor body that acts as the target for the Gem
- **Thread**: A Matter.js constraint connecting an anchor or the Gem to another anchor or the Gem
- **Anchor**: A fixed static attachment point on the canvas
- **ActiveThreads**: The array of Thread constraints currently present in the physics world for the active level
- **GameState**: The current state of the game; one of `LOADING`, `PLAYING`, `WIN`, or `LOSE`
- **Particle**: A short-lived visual effect element with position, velocity, life, color, and radius
- **LevelData**: The complete data definition for a single puzzle level
- **StarRating**: An integer in {1, 2, 3} awarded when the player catches the Gem, based on threads remaining
- **HitThreshold**: The maximum distance (12px) from a Thread within which a click/tap registers as a cut
- **dt**: The physics timestep in seconds, clamped to the range (0, 0.05]

---

## Requirements

### Requirement 1: Level Loading

**User Story:** As a player, I want each puzzle level to load cleanly with the correct physics bodies and threads, so that I can play each level as designed.

#### Acceptance Criteria

1. WHEN `loadLevel(index)` is called with a valid index, THE LevelManager SHALL clear all existing physics bodies and constraints from the world before adding new ones
2. WHEN `loadLevel(index)` is called with a valid index, THE LevelManager SHALL add all anchors, the Gem, and the Basket as physics bodies to the PhysicsEngine
3. WHEN `loadLevel(index)` is called with a valid index, THE LevelManager SHALL populate ActiveThreads with exactly as many Thread constraints as defined in the LevelData
4. WHEN `loadLevel(index)` is called with a valid index, THE LevelManager SHALL set GameState to `PLAYING`
5. IF `loadLevel(index)` is called with an index greater than or equal to the total number of levels, THEN THE LevelManager SHALL clamp the index to the last valid level index and log a warning to the console

---

### Requirement 2: Thread Cutting

**User Story:** As a player, I want to cut threads by clicking or tapping on them, so that I can control the Gem's movement using gravity and momentum.

#### Acceptance Criteria

1. WHEN the player clicks or taps at canvas coordinates (x, y) while GameState is `PLAYING`, THE InputHandler SHALL invoke the cut handler with those coordinates
2. WHEN a cut is triggered at (x, y), THE LevelManager SHALL identify the Thread in ActiveThreads whose sampled points are closest to (x, y) within the HitThreshold
3. WHEN a Thread is identified for cutting, THE LevelManager SHALL remove that Thread from the PhysicsEngine and from ActiveThreads
4. WHEN a Thread is cut, THE Renderer SHALL spawn cut particle effects at the Thread's midpoint
5. WHEN a Thread is cut, THE ActiveThreads array SHALL decrease in length by exactly 1
6. IF no Thread is within the HitThreshold of the click/tap coordinates, THEN THE LevelManager SHALL take no action

---

### Requirement 3: Hit Testing

**User Story:** As a player, I want clicks and taps near a thread to reliably cut it, so that the controls feel responsive and accurate.

#### Acceptance Criteria

1. WHEN `hitTestThread(x, y, threads)` is called with an empty threads array, THE LevelManager SHALL return `null`
2. WHEN `hitTestThread(x, y, threads)` is called and all threads are more than 12px from (x, y), THE LevelManager SHALL return `null`
3. WHEN `hitTestThread(x, y, threads)` is called and one or more threads are within 12px of (x, y), THE LevelManager SHALL return the Thread whose sampled points are closest to (x, y)
4. THE LevelManager SHALL sample each Thread at a minimum of 10 evenly-spaced points along its length when performing hit testing

---

### Requirement 4: Win Condition

**User Story:** As a player, I want the game to detect when the Gem lands in the Basket, so that I receive feedback and can progress to the next level.

#### Acceptance Criteria

1. WHEN the PhysicsEngine reports a collision between the Gem body and the Basket body, THE LevelManager SHALL invoke the win handler
2. WHEN the win handler is invoked and GameState is `PLAYING`, THE LevelManager SHALL set GameState to `WIN`
3. WHILE GameState is `WIN`, THE LevelManager SHALL NOT invoke the win handler again for the same level
4. WHEN GameState transitions to `WIN`, THE Renderer SHALL trigger the win animation and display the level-complete overlay with the StarRating
5. THE LevelManager SHALL compute the StarRating using the ratio of uncut threads remaining to total threads at the moment the Gem is caught

---

### Requirement 5: Star Rating

**User Story:** As a player, I want to earn stars based on how efficiently I solve each level, so that I am rewarded for using fewer cuts.

#### Acceptance Criteria

1. WHEN `computeStars(totalThreads, threadsRemaining)` is called and `threadsRemaining / totalThreads >= 0.67`, THE LevelManager SHALL return a StarRating of 3
2. WHEN `computeStars(totalThreads, threadsRemaining)` is called and `threadsRemaining / totalThreads >= 0.34` and `< 0.67`, THE LevelManager SHALL return a StarRating of 2
3. WHEN `computeStars(totalThreads, threadsRemaining)` is called and `threadsRemaining / totalThreads < 0.34`, THE LevelManager SHALL return a StarRating of 1
4. THE LevelManager SHALL always return a StarRating that is a member of {1, 2, 3}

---

### Requirement 6: Game Loop and Physics Timestep

**User Story:** As a player, I want smooth, stable physics simulation at 60fps, so that the game feels responsive and predictable.

#### Acceptance Criteria

1. THE Game SHALL drive the physics simulation using a `requestAnimationFrame` loop rather than the Matter.js Runner
2. WHEN each frame is processed, THE Game SHALL compute `dt` as the elapsed time in seconds since the previous frame, clamped to the range (0, 0.05]
3. WHILE GameState is `PLAYING`, THE Game SHALL call `engine.step(dt)` once per frame with the clamped dt value
4. WHEN GameState is not `PLAYING`, THE Game SHALL skip the physics step but SHALL continue rendering each frame

---

### Requirement 7: Lose Condition

**User Story:** As a player, I want the game to detect when the Gem falls off screen, so that I can restart and try again.

#### Acceptance Criteria

1. WHEN the Gem's `position.y` exceeds `canvas.height + 100` pixels, THE LevelManager SHALL set GameState to `LOSE`
2. WHEN GameState transitions to `LOSE`, THE Renderer SHALL display a "Try Again" overlay
3. WHEN the player activates the restart action while GameState is `LOSE`, THE LevelManager SHALL call `loadLevel` with the current level index

---

### Requirement 8: Rendering

**User Story:** As a player, I want the game to look visually polished with a neon style, so that the experience is engaging and clear.

#### Acceptance Criteria

1. THE Renderer SHALL clear and redraw the entire canvas on every frame
2. THE Renderer SHALL draw each Thread as a line with a glow shadow effect from `bodyA.position` to `bodyB.position`
3. THE Renderer SHALL draw the Gem as a circle with a radial gradient
4. THE Renderer SHALL draw the Basket at its defined position and dimensions
5. THE Renderer SHALL draw a HUD showing the current level number, star indicators, and a restart button
6. WHEN `drawThread` is called, THE Renderer SHALL use canvas `save()` and `restore()` to preserve canvas state and SHALL NOT mutate any constraint or body state

---

### Requirement 9: Particle Effects

**User Story:** As a player, I want visual feedback when I cut a thread or catch the Gem, so that the game feels satisfying and responsive.

#### Acceptance Criteria

1. WHEN a Thread is cut, THE Renderer SHALL spawn cut-type particles at the Thread's midpoint
2. WHEN the Gem is caught, THE Renderer SHALL spawn win-type particles at the Gem's position
3. THE Renderer SHALL update each Particle's position by its velocity and decrement its life value each frame
4. WHEN a Particle's life value reaches 0 or below, THE Renderer SHALL remove it from the particle array before the next draw call
5. THE Renderer SHALL maintain Particle life values in the range [0, 1] at all times
6. THE Renderer SHALL cap the particle array at 200 entries, evicting the oldest particles when the cap is exceeded

---

### Requirement 10: Input Handling

**User Story:** As a player, I want to cut threads using both mouse clicks and touch taps, so that the game works on desktop and mobile devices.

#### Acceptance Criteria

1. THE InputHandler SHALL listen for both `mousedown` and `touchstart` events on the canvas
2. WHEN a `mousedown` or `touchstart` event is received, THE InputHandler SHALL convert the event coordinates to canvas space, accounting for `devicePixelRatio` and canvas offset
3. WHEN converted canvas-space coordinates are computed, THE InputHandler SHALL fire the `onCut` callback with those coordinates

---

### Requirement 11: Canvas Setup and Display

**User Story:** As a player, I want the game canvas to render crisply on all screens including high-DPI displays, so that the visuals are sharp and clear.

#### Acceptance Criteria

1. THE Game SHALL size the canvas backing store according to `devicePixelRatio` to ensure crisp rendering on retina and high-DPI displays
2. THE Game SHALL scale the canvas 2D context by `devicePixelRatio` so that all drawing coordinates remain in logical pixels

---

### Requirement 12: Error Handling — Physics Engine Unavailable

**User Story:** As a player, I want a clear message if the game cannot load, so that I understand what went wrong and can try again.

#### Acceptance Criteria

1. IF `window.Matter` is undefined after the Matter.js script tag has been processed, THEN THE Game SHALL display a user-facing error overlay with the message "Could not load physics engine. Check your connection."
2. WHEN the error overlay is displayed, THE Game SHALL provide a retry button that reloads the page

---

### Requirement 13: Level Definitions

**User Story:** As a player, I want multiple handcrafted levels of increasing difficulty, so that the game provides a progression of challenge.

#### Acceptance Criteria

1. THE Game SHALL include a minimum of 5 handcrafted levels defined as LevelData objects
2. THE LevelData for each level SHALL include a unique numeric id, a display name, at least one AnchorDef, at least one ThreadDef, a GemDef, and a BasketDef
3. THE LevelManager SHALL present levels in ascending order of their id values
4. WHEN the player completes the final level, THE LevelManager SHALL display a game-complete message rather than advancing to a non-existent level
