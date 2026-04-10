# Implementation Plan: Unskrew

## Overview

Build a single-file browser physics puzzle game (`unskrew/index.html`) using the Canvas 2D API and a custom Euler-integration physics engine. Implementation proceeds bottom-up: scaffold → data models → physics → level manager → renderer → input handler → game loop → wiring → levels → root index.

## Tasks

- [x] 1. Scaffold `unskrew/index.html` with canvas, font link, and game container
  - Create `unskrew/index.html` with a `<canvas id="game-canvas">` element
  - Link HurmeGeoSans2 font from `../fonts/hurme-geometric-sans/` via `@font-face` in a `<style>` block
  - Size canvas backing store by `devicePixelRatio`; scale context by `devicePixelRatio`
  - Add a `<style>` block with `body { margin:0; background:#f0f0f0; display:flex; justify-content:center; align-items:center; height:100vh; }` and `canvas { display:block; }`
  - _Requirements: 1.1, 1.6, 10.10_

- [x] 2. Define data models and constants
  - [x] 2.1 Define JSDoc-commented shapes for `LevelData`, `PlatformDef`, `BoltDef`, `BallDef`, `TubeDef`
    - Include all fields from the design document
    - _Requirements: 2.1_
  - [x] 2.2 Define runtime state shapes `BallState`, `BoltState`, `TubeState`, `CaptureEvent`, `Particle` as JSDoc comments
    - _Requirements: 2.2, 2.3_
  - [x] 2.3 Declare top-level constants: `GRAVITY = 980`, `RESTITUTION = 0.35`, `FRICTION = 0.85`, `TAP_RADIUS = 24`, `UNSCREW_DURATION = 0.35`, `UNSCREW_SPEED = Math.PI * 4`, `PARTICLE_CAP = 200`
    - _Requirements: 6.1, 6.3, 6.4, 5.1, 5.2_

- [x] 3. Implement `Physics` module
  - [x] 3.1 Implement `integrate(balls, platforms, dt)`
    - Apply `GRAVITY` to `vy` for each dynamic non-captured ball
    - Euler-integrate `x` and `y`
    - For each platform, call `circleOverlapsRect`; if overlapping, compute collision normal and penetration depth, displace ball, reflect velocity with `RESTITUTION`, apply `FRICTION` to tangential component
    - Skip balls where `dynamic === false` or `captured === true`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  - [x] 3.2 Implement `resolveWallBounce(ball, canvasW, canvasH)`
    - Clamp ball to canvas bounds; reflect `vx` on left/right walls, reflect `vy` on top wall with `RESTITUTION`
    - _Requirements: 6.8_
  - [x] 3.3 Implement `checkTubeCapture(balls, tubes)`
    - For each dynamic non-captured ball, check if ball centre is within tube mouth AABB and tube has capacity
    - On capture: set `ball.vx = 0`, `ball.vy = 0`, `ball.captured = true`, `ball.capturedTubeId`, snap ball position to stacked rest position inside tube, push ball id to `tube.capturedBalls`
    - Return array of `CaptureEvent` with `colorMatch` flag
    - Do not modify balls where `dynamic === false`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_
  - [x] 3.4 Implement helper `circleOverlapsRect(ball, rect)` and `computeCollisionNormal(ball, rect)`
    - Standard AABB-circle overlap test; return closest-point normal
    - _Requirements: 6.3_
  - [ ]* 3.5 Write property test for `integrate` — Property 3: dt clamping produces no NaN
    - **Property 3: dt is always clamped and integrate never produces NaN**
    - **Validates: Requirements 6.6, 6.7, 13.2**
  - [ ]* 3.6 Write property test for `checkTubeCapture` — Property 8: tube capacity never exceeded
    - **Property 8: Tube capacity is never exceeded**
    - **Validates: Requirements 7.5**
  - [ ]* 3.7 Write property test for `checkTubeCapture` — Property 11: static balls not mutated
    - **Property 11: checkTubeCapture does not mutate static balls**
    - **Validates: Requirements 7.6**
  - [ ]* 3.8 Write property test for `checkTubeCapture` — Property 7: captured ball velocity is zero
    - **Property 7: Captured ball velocity is zero**
    - **Validates: Requirements 7.2**
  - [ ]* 3.9 Write property test for `checkTubeCapture` — Property 12: color mismatch captured but win blocked
    - **Property 12: Color mismatch does not prevent capture but does prevent win**
    - **Validates: Requirements 7.7, 8.3**

- [x] 4. Checkpoint — physics complete
  - Ensure all tests pass, ask the user if questions arise.

- [-] 5. Implement `LevelManager`
  - [-] 5.1 Implement `loadLevel(index)`
    - Clamp index to `[0, LEVELS.length - 1]`; log warning if out of bounds
    - Deep-clone `LEVELS[index]` into runtime `BallState[]`, `BoltState[]`, `TubeState[]`, `PlatformDef[]`
    - Set every ball `dynamic = false`, `captured = false`, `vx = 0`, `vy = 0`
    - Set `gameState = 'PLAYING'`; clear previous level state
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 12.3_
  - [ ]* 5.2 Write property test for `loadLevel` — Property 1: balls populated correctly
    - **Property 1: loadLevel populates balls correctly**
    - **Validates: Requirements 2.2, 2.3**
  - [-] 5.3 Implement `hitTestBolt(x, y)`
    - Iterate `activeBolts` where `bolt.removed === false`; return first bolt within `TAP_RADIUS`, else `null`
    - No mutations
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  - [ ]* 5.4 Write property test for `hitTestBolt` — Property 5: returns null for empty input
    - **Property 5: hitTestBolt returns null for empty input**
    - **Validates: Requirements 4.3**
  - [ ]* 5.5 Write property test for `hitTestBolt` — Property 6: returns null when no bolt within TAP_RADIUS
    - **Property 6: hitTestBolt returns null when no bolt is within TAP_RADIUS**
    - **Validates: Requirements 4.2**
  - [-] 5.6 Implement `unscrewBolt(bolt)`
    - Set `bolt.unscrewing = true`, `bolt.animTimer = 0`
    - _Requirements: 5.1_
  - [-] 5.7 Implement `updateBoltAnimations(dt)`
    - For each unscrewing bolt: increment `animTimer` by `dt`, increment `bolt.angle` by `UNSCREW_SPEED * dt`
    - When `animTimer >= UNSCREW_DURATION`: set `bolt.removed = true`, `bolt.unscrewing = false`, remove from `activeBolts`
    - For each ball held by this bolt: if all holding bolts have `removed === true`, set `ball.dynamic = true`
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6_
  - [ ]* 5.8 Write property test for bolt animation — Property 10: bolt removed exactly once
    - **Property 10: Bolt removed exactly once**
    - **Validates: Requirements 5.4**
  - [ ]* 5.9 Write property test for bolt animation — Property 2: ball dynamic only when all bolts removed
    - **Property 2: Ball becomes dynamic only when all holding bolts are removed**
    - **Validates: Requirements 5.5, 5.6**
  - [-] 5.10 Implement `onBallCaptured(captureEvent)`
    - Update internal state; call `checkWin()` after each capture
    - _Requirements: 8.1, 8.4_
  - [-] 5.11 Implement `checkWin()`
    - Return `true` iff every ball has `captured === true` and `tube.color === ball.color` for its `capturedTubeId`
    - No side effects on ball/tube state
    - When `true`: set `gameState = 'WIN'` if more levels remain, else `gameState = 'GAME_COMPLETE'`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.6, 8.7_
  - [ ]* 5.12 Write property test for `checkWin` — Property 4: win requires all balls captured in matching tubes
    - **Property 4: Win condition requires all balls captured in matching tubes**
    - **Validates: Requirements 8.1, 8.2, 8.3**
  - [-] 5.13 Implement `checkLoseCondition()`
    - If any dynamic non-captured ball has `y > CANVAS_H + ball.radius * 2`, set `gameState = 'LOSE'`
    - _Requirements: 9.1_

- [~] 6. Checkpoint — level manager complete
  - Ensure all tests pass, ask the user if questions arise.

- [~] 7. Implement `Renderer`
  - [~] 7.1 Implement `init(canvas)` — store canvas reference, get 2D context, apply `devicePixelRatio` scaling
    - _Requirements: 1.2, 10.10_
  - [~] 7.2 Implement `drawFrame(state)`
    - Clear canvas; draw in order: background, platforms, tubes, balls, bolts, particles, HUD, overlays
    - Use `ctx.save()` / `ctx.restore()` around each draw call
    - Must not mutate any game state object
    - _Requirements: 10.1, 10.2, 10.8, 10.9_
  - [~] 7.3 Implement `drawBackground(ctx, w, h)` — fill with light grey/white
    - _Requirements: 10.2_
  - [~] 7.4 Implement `drawPlatform(ctx, platform)` — filled rounded rectangle
    - _Requirements: 10.2_
  - [~] 7.5 Implement `drawTube(ctx, tube)` — open-top rectangle with color fill matching `tube.color`
    - _Requirements: 10.4_
  - [~] 7.6 Implement `drawBall(ctx, ball)` — circle with radial gradient using `ball.color`
    - _Requirements: 10.3_
  - [~] 7.7 Implement `drawBolt(ctx, bolt)` — hex-head screw icon; rotate by `bolt.angle` when `bolt.unscrewing`
    - _Requirements: 10.5, 10.6_
  - [~] 7.8 Implement `drawHUD(ctx, levelIndex, canvasW)`
    - Draw level number (e.g. "Level 3") and a restart button rectangle with label
    - _Requirements: 10.7_
  - [~] 7.9 Implement win overlay and lose overlay
    - Win: "Level Complete!" with next-level button (or "You Win!" if `GAME_COMPLETE`)
    - Lose: "Try Again" overlay with restart button
    - _Requirements: 9.2, 8.5_
  - [~] 7.10 Implement `spawnParticles(x, y, color, type)` and particle update/draw
    - Spawn burst of ~20 particles with random velocities and `life = 1.0`
    - Each frame: update position by velocity, decrement `life`; remove particles with `life <= 0`
    - Cap particle array at `PARTICLE_CAP = 200`; evict oldest when exceeded
    - Keep `life` in `[0, 1]` at all times
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
  - [ ]* 7.11 Write property test for particle system — Property 9: life invariant
    - **Property 9: Particle life is always in [0, 1]**
    - **Validates: Requirements 11.3, 11.4**

- [~] 8. Implement `InputHandler`
  - [~] 8.1 Implement `attach(canvas)`, `detach()`, and `onTap(handler)`
    - Listen for `mousedown` and `touchstart` on canvas
    - Convert event coordinates to canvas logical space using `getBoundingClientRect()` and `devicePixelRatio`
    - Fire `onTap` callback with canvas-space `(x, y)`
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6_

- [~] 9. Implement the main game loop and wire all components together
  - [~] 9.1 Implement `gameLoop(timestamp)` using `requestAnimationFrame`
    - Compute `dt = Math.min(Math.max((timestamp - lastTimestamp) / 1000, 0), 0.05)`
    - Initialize `lastTimestamp` on first frame
    - If `gameState === 'PLAYING'`: call `physics.integrate`, `physics.resolveWallBounce`, `physics.checkTubeCapture`, `levelManager.updateBoltAnimations`, `levelManager.checkLoseCondition`
    - Process each `CaptureEvent`: call `levelManager.onBallCaptured(ev)`, `renderer.spawnParticles`
    - Always call `renderer.drawFrame(levelManager.getRenderState())`
    - Schedule next frame with `requestAnimationFrame(gameLoop)`
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 12.2_
  - [ ]* 9.2 Write property test for game loop — Property 3: dt always clamped
    - **Property 3: dt is always clamped to (0, 0.05]**
    - **Validates: Requirements 6.6, 13.2**
  - [~] 9.3 Wire `InputHandler.onTap` → `LevelManager.hitTestBolt` → `LevelManager.unscrewBolt`
    - Guard: only act when `gameState === 'PLAYING'`
    - _Requirements: 3.4, 5.1_
  - [~] 9.4 Wire restart button click (HUD and lose overlay) → `loadLevel(currentIndex)`
    - Detect tap on restart button rect in `onTap` handler when `gameState !== 'PLAYING'` or HUD restart hit
    - _Requirements: 9.3, 12.7_
  - [~] 9.5 Wire next-level button click (win overlay) → `loadLevel(currentIndex + 1)`
    - _Requirements: 8.5, 12.6_
  - [~] 9.6 Implement `LevelManager.getRenderState()` — return snapshot object with all arrays needed by `Renderer.drawFrame`
    - _Requirements: 2.7, 10.8_

- [~] 10. Checkpoint — game loop and wiring complete
  - Ensure all tests pass, ask the user if questions arise.

- [~] 11. Define `LEVELS` array with at least 5 handcrafted levels of increasing difficulty
  - [~] 11.1 Level 1 "First Drop" — 1 ball, 1 bolt, 1 tube, no platforms; ball falls straight into matching tube
    - _Requirements: 2.1, 2.2_
  - [~] 11.2 Level 2 "Shelf" — 2 balls (red, blue), 2 bolts, 2 tubes, 1 horizontal platform acting as a shelf; player must unscrew in correct order
    - _Requirements: 2.1, 2.2_
  - [~] 11.3 Level 3 "Ramp" — 3 balls (red, blue, green), 3 bolts, 3 tubes, 1 angled platform ramp that redirects balls; requires sequencing
    - _Requirements: 2.1, 2.2_
  - [~] 11.4 Level 4 "Crossover" — 4 balls (2 red, 2 blue), 4 bolts, 2 tubes with capacity 2, platforms create crossing paths; wrong order causes color mismatch
    - _Requirements: 2.1, 2.2, 7.5_
  - [~] 11.5 Level 5 "Cascade" — 5 balls (red, blue, green, yellow, purple), 5 bolts, 5 tubes, multi-tier platform cascade; one ball held by 2 bolts requiring both to be unscrewed
    - _Requirements: 2.1, 2.2, 5.6_

- [~] 12. Add Unskrew to root `index.html` Games section
  - Open `index.html` and add a link/card for Unskrew in the Games section alongside the existing Weak Threads entry
  - Match the existing card style and link to `unskrew/index.html`
  - _Requirements: 1.6_

- [~] 13. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Property tests use `fast-check` (loaded via CDN or inline in a test file)
- All drawing coordinates are in logical pixels; `devicePixelRatio` scaling is applied once at context init
- Checkpoints ensure incremental validation before proceeding
- The game is fully self-contained in `unskrew/index.html` with no build step
