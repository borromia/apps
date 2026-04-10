# Requirements Document

## Introduction

Unskrew is a browser-based physics puzzle game delivered as a single self-contained `unskrew/index.html` file. The player unscrews bolts to release colored balls that must fall into matching colored tubes. The game uses the Canvas 2D API for rendering and a custom Euler-integration physics simulation with no external library dependencies. It follows the same structural pattern as `weak-threads/index.html`.

## Glossary

- **Ball**: A colored circular physics object that is either held static by bolts, falling freely under gravity, or captured inside a tube.
- **Bolt**: A screw that pins one or more balls in place. Clicking/tapping a bolt triggers the unscrew animation and releases held balls.
- **Tube**: A colored open-top rectangular container that captures balls entering its mouth. Each tube has a color and a capacity.
- **Platform**: A static rectangular surface that balls can collide with and rest on or slide off.
- **LevelManager**: The component that owns level definitions, manages runtime state for balls/bolts/tubes, and tracks win/loss conditions.
- **Physics**: The component responsible for gravity integration, platform collision resolution, wall bounce, and tube capture detection.
- **Renderer**: The component that draws the entire scene each frame onto the canvas using the Canvas 2D API.
- **InputHandler**: The component that translates mouse and touch events into canvas-space coordinates and fires tap callbacks.
- **GameLoop**: The `requestAnimationFrame`-driven loop that advances physics, processes capture events, and triggers rendering each frame.
- **BallState**: Runtime state of a ball including position, velocity, dynamic flag, and captured flag.
- **BoltState**: Runtime state of a bolt including rotation angle, unscrewing flag, animTimer, and removed flag.
- **TubeState**: Runtime state of a tube including the list of captured ball IDs.
- **CaptureEvent**: A record produced when a ball enters a tube mouth, containing ballId, tubeId, and colorMatch flag.
- **Particle**: A short-lived visual effect object with position, velocity, life value, color, and radius.
- **TAP_RADIUS**: The hit-test radius (24 px) used to determine whether a tap lands on a bolt.
- **GRAVITY**: The downward acceleration constant (980 px/s²) applied to dynamic balls.
- **RESTITUTION**: The coefficient of restitution (0.35) applied on platform bounce.
- **FRICTION**: The tangential friction factor (0.85) applied after a platform bounce.
- **dt**: The per-frame time step in seconds, clamped to `(0, 0.05]`.
- **UNSCREW_DURATION**: The bolt animation duration (0.35 seconds).
- **UNSCREW_SPEED**: The bolt rotation speed during animation (2 full rotations per second).

---

## Requirements

### Requirement 1: Game Bootstrap and Initialization

**User Story:** As a player, I want the game to initialize correctly when the page loads, so that I can start playing immediately without errors.

#### Acceptance Criteria

1. THE Game SHALL initialize a `<canvas>` element, a `Physics` instance, a `Renderer` instance, an `InputHandler` instance, and a `LevelManager` instance on page load.
2. THE Renderer SHALL call `init(canvas)` before the first frame is drawn.
3. THE InputHandler SHALL attach mouse and touch event listeners to the canvas on initialization.
4. THE GameLoop SHALL start via `requestAnimationFrame` after `loadLevel(0)` completes.
5. WHEN the game initializes, THE LevelManager SHALL load level index 0 and set `gameState` to `PLAYING`.
6. THE Game SHALL run entirely within a single `unskrew/index.html` file with no build step and no external JavaScript library dependencies.
7. WHERE the HurmeGeoSans2 font fails to load, THE Renderer SHALL fall back to a system sans-serif font and continue rendering normally.

---

### Requirement 2: Level Definition and Loading

**User Story:** As a player, I want each level to load correctly with all its objects in place, so that the puzzle is set up as designed.

#### Acceptance Criteria

1. THE LevelManager SHALL maintain a `LEVELS` array of `LevelData` objects, each containing `id`, `name`, `platforms`, `bolts`, `balls`, and `tubes`.
2. WHEN `loadLevel(index)` is called, THE LevelManager SHALL instantiate `BallState`, `BoltState`, `TubeState`, and `PlatformDef` objects from `LEVELS[index]`.
3. WHEN `loadLevel(index)` is called, THE LevelManager SHALL set every ball's `dynamic` to `false` and `captured` to `false`.
4. WHEN `loadLevel(index)` is called, THE LevelManager SHALL clear all state from the previous level before populating new state.
5. WHEN `loadLevel(index)` is called, THE LevelManager SHALL set `gameState` to `PLAYING` upon completion.
6. IF `loadLevel(index)` is called with `index >= LEVELS.length`, THEN THE LevelManager SHALL clamp the index to the last valid index and log a warning to the console.
7. THE LevelManager SHALL expose `balls`, `bolts`, `tubes`, and `platforms` arrays for use by the `Physics` and `Renderer` components.

---

### Requirement 3: Input Handling

**User Story:** As a player, I want my clicks and taps to be accurately detected on bolts, so that I can unscrew them to release balls.

#### Acceptance Criteria

1. THE InputHandler SHALL listen for both `mousedown` and `touchstart` events on the canvas.
2. WHEN a `mousedown` or `touchstart` event fires, THE InputHandler SHALL convert the event coordinates to canvas logical space, accounting for `devicePixelRatio` and the canvas CSS size.
3. WHEN a tap is detected, THE InputHandler SHALL fire the registered `onTap` callback with the canvas-space `(x, y)` coordinates.
4. WHEN `gameState` is not `PLAYING`, THE Game SHALL ignore tap events and not call `unscrewBolt`.
5. THE InputHandler SHALL support registering exactly one `onTap` handler via `onTap(handler)`.
6. THE InputHandler SHALL support detaching all event listeners via `detach()`.

---

### Requirement 4: Bolt Hit Testing

**User Story:** As a player, I want tapping near a bolt to reliably select it, so that I don't have to tap with pixel-perfect precision.

#### Acceptance Criteria

1. WHEN `hitTestBolt(x, y, bolts)` is called, THE LevelManager SHALL return the first `BoltState` whose centre is within `TAP_RADIUS` (24 px) of `(x, y)`.
2. WHEN no bolt centre is within `TAP_RADIUS` of `(x, y)`, THE LevelManager SHALL return `null`.
3. WHEN `hitTestBolt` is called with an empty bolt array, THE LevelManager SHALL return `null`.
4. THE `hitTestBolt` function SHALL NOT mutate any bolt or ball state.
5. THE `hitTestBolt` function SHALL only consider bolts where `bolt.removed === false`.

---

### Requirement 5: Bolt Unscrew Mechanic

**User Story:** As a player, I want to unscrew bolts to release balls, so that I can direct balls into matching tubes.

#### Acceptance Criteria

1. WHEN a player taps a bolt and `gameState === 'PLAYING'`, THE LevelManager SHALL call `unscrewBolt(bolt)`, setting `bolt.unscrewing = true` and `bolt.animTimer = 0`.
2. WHILE `bolt.unscrewing === true`, THE LevelManager SHALL increment `bolt.animTimer` by `dt` and `bolt.angle` by `UNSCREW_SPEED * dt` each frame.
3. WHEN `bolt.animTimer >= UNSCREW_DURATION` (0.35 s), THE LevelManager SHALL set `bolt.removed = true`, `bolt.unscrewing = false`, and remove the bolt from `activeBolts`.
4. THE `bolt.removed` flag SHALL transition from `false` to `true` exactly once and SHALL never revert to `false`.
5. WHEN a bolt is removed, THE LevelManager SHALL set `ball.dynamic = true` for every ball whose ALL holding bolts have `removed === true`.
6. A ball held by multiple bolts SHALL remain `dynamic = false` until every one of its holding bolts has `removed === true`.

---

### Requirement 6: Physics Simulation

**User Story:** As a player, I want balls to fall and bounce realistically, so that the puzzle feels satisfying and predictable.

#### Acceptance Criteria

1. WHEN `integrate(balls, platforms, dt)` is called, THE Physics SHALL apply `GRAVITY` (980 px/s²) to `vy` for every ball where `ball.dynamic === true` and `ball.captured === false`.
2. WHEN `integrate` is called, THE Physics SHALL update `ball.x` and `ball.y` using Euler integration for every dynamic non-captured ball.
3. WHEN a dynamic ball overlaps a platform, THE Physics SHALL resolve the penetration by displacing the ball along the collision normal and reflecting the velocity component along the normal with `RESTITUTION` (0.35).
4. WHEN a platform collision is resolved, THE Physics SHALL apply `FRICTION` (0.85) to the tangential velocity component.
5. THE Physics SHALL NOT modify any ball where `ball.dynamic === false` or `ball.captured === true`.
6. THE `dt` value passed to `integrate` SHALL always be clamped to the range `(0, 0.05]` by the GameLoop before the call.
7. WHEN `integrate` is called with a valid `dt`, THE Physics SHALL not produce `NaN` or `Infinity` values in any ball's `x`, `y`, `vx`, or `vy`.
8. WHEN a dynamic ball reaches the canvas wall boundary, THE Physics SHALL resolve the bounce via `resolveWallBounce(ball, canvasW, canvasH)`.

---

### Requirement 7: Tube Capture Detection

**User Story:** As a player, I want balls to be captured when they enter a matching tube, so that I can complete the puzzle.

#### Acceptance Criteria

1. WHEN `checkTubeCapture(balls, tubes)` is called, THE Physics SHALL return a `CaptureEvent` for each dynamic non-captured ball whose centre enters a tube's mouth AABB and the tube has remaining capacity.
2. WHEN a ball is captured, THE Physics SHALL set `ball.vx = 0`, `ball.vy = 0`, `ball.captured = true`, and `ball.capturedTubeId` to the tube's id.
3. WHEN a ball is captured, THE Physics SHALL snap the ball's position to the correct rest position inside the tube, stacking above previously captured balls.
4. WHEN a ball is captured, THE Physics SHALL append the ball's id to `tube.capturedBalls`.
5. THE `tube.capturedBalls.length` SHALL never exceed `tube.capacity` for any tube at any frame.
6. THE `checkTubeCapture` function SHALL NOT modify any ball where `ball.dynamic === false`.
7. WHEN a ball enters a tube whose color does not match the ball's color, THE Physics SHALL still capture the ball (set `ball.captured = true`) and include `colorMatch: false` in the `CaptureEvent`.
8. `checkTubeCapture` SHALL be called after `integrate()` in the same frame.

---

### Requirement 8: Win Condition

**User Story:** As a player, I want the game to recognize when I've solved the puzzle, so that I can advance to the next level.

#### Acceptance Criteria

1. WHEN `checkWin(balls, tubes)` is called, THE LevelManager SHALL return `true` if and only if every ball has `captured === true` and `tube.color === ball.color` for its `capturedTubeId`.
2. IF any ball has `captured === false`, THEN THE LevelManager SHALL return `false` from `checkWin`.
3. IF any ball is captured in a tube where `tube.color !== ball.color`, THEN THE LevelManager SHALL return `false` from `checkWin`.
4. WHEN `checkWin` returns `true`, THE LevelManager SHALL set `gameState` to `WIN`.
5. WHEN `gameState` is `WIN` and a next level exists, THE Game SHALL load the next level via `loadLevel(currentIndex + 1)` when the player activates the next-level button.
6. WHEN `gameState` is `WIN` and no further levels exist, THE Game SHALL set `gameState` to `GAME_COMPLETE`.
7. THE `checkWin` function SHALL NOT produce any side effects on ball or tube state.

---

### Requirement 9: Lose Condition

**User Story:** As a player, I want the game to detect when a ball is unrecoverable, so that I can restart and try a different approach.

#### Acceptance Criteria

1. WHEN a ball's `y` position exceeds `CANVAS_H + ball.radius * 2` and the ball is not captured, THE LevelManager SHALL set `gameState` to `LOSE`.
2. WHEN `gameState` is `LOSE`, THE Renderer SHALL display a "Try Again" overlay.
3. WHEN the player activates the restart action in `LOSE` state, THE LevelManager SHALL call `loadLevel(currentIndex)` to reload the current level.

---

### Requirement 10: Rendering

**User Story:** As a player, I want the game to look clean and responsive, so that I can clearly see the puzzle state at all times.

#### Acceptance Criteria

1. THE Renderer SHALL clear and fully redraw the canvas every frame via `drawFrame(state)`.
2. WHEN `drawFrame` is called, THE Renderer SHALL draw the background, platforms, tubes, balls, bolts, particles, and HUD in that order.
3. THE Renderer SHALL draw each ball as a circle with a gradient fill using the ball's color.
4. THE Renderer SHALL draw each tube as an open-top rectangle with a color fill matching `tube.color`.
5. THE Renderer SHALL draw each bolt as a hex-head screw icon.
6. WHILE `bolt.unscrewing === true`, THE Renderer SHALL animate the bolt rotating at `UNSCREW_SPEED` radians per second for `UNSCREW_DURATION` seconds.
7. THE Renderer SHALL draw the HUD including the current level number and a restart button.
8. THE `drawFrame` function SHALL NOT mutate any game state object.
9. THE Renderer SHALL call `ctx.save()` and `ctx.restore()` around each individual draw call to prevent canvas state leakage.
10. THE Canvas SHALL be sized to `devicePixelRatio` for crisp rendering on high-DPI displays.

---

### Requirement 11: Particle System

**User Story:** As a player, I want satisfying visual feedback when a ball lands in a tube, so that the game feels rewarding.

#### Acceptance Criteria

1. WHEN a ball is captured in a tube, THE Renderer SHALL spawn a burst of particles at the ball's position via `spawnParticles(x, y, color, 'capture')`.
2. THE Renderer SHALL update each particle's position using its velocity each frame and decrement its `life` value.
3. THE `particle.life` value SHALL always remain in the range `[0, 1]`.
4. WHEN a particle's `life` reaches `0` or below, THE Renderer SHALL remove it from the particle array before the next draw call.
5. THE particle array length SHALL never exceed 200; when the cap is reached, THE Renderer SHALL evict the oldest particles to make room for new ones.

---

### Requirement 12: Game State Machine

**User Story:** As a player, I want the game to transition between states correctly, so that the experience flows without bugs or stuck states.

#### Acceptance Criteria

1. THE Game SHALL maintain `gameState` as one of: `LOADING`, `PLAYING`, `WIN`, `LOSE`, `GAME_COMPLETE`.
2. THE GameLoop SHALL only advance physics and process capture events when `gameState === 'PLAYING'`.
3. WHEN `loadLevel` is called, THE Game SHALL transition `gameState` from any state to `LOADING` and then to `PLAYING` upon completion.
4. THE `gameState` SHALL transition from `PLAYING` to `WIN` only when `checkWin()` returns `true`.
5. THE `gameState` SHALL transition from `PLAYING` to `LOSE` only when a ball falls off screen.
6. THE `gameState` SHALL transition from `WIN` to `PLAYING` when the next level is loaded, or to `GAME_COMPLETE` when no levels remain.
7. THE `gameState` SHALL transition from `LOSE` to `PLAYING` when the player restarts the current level.

---

### Requirement 13: Game Loop Timing

**User Story:** As a developer, I want the game loop to be stable and deterministic, so that physics behaves consistently across different frame rates.

#### Acceptance Criteria

1. THE GameLoop SHALL compute `dt` as `(timestamp - lastTimestamp) / 1000` on each frame.
2. THE GameLoop SHALL clamp `dt` to the range `(0, 0.05]` before passing it to `physics.integrate()`.
3. THE GameLoop SHALL call `requestAnimationFrame(gameLoop)` at the end of every frame to continue the loop.
4. THE GameLoop SHALL initialize `lastTimestamp` on the first frame before computing `dt`.
