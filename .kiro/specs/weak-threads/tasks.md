# Implementation Plan: Weak Threads

## Overview

Build a single-file browser physics puzzle game (`weak-threads/index.html`) using Matter.js and Canvas 2D API. Implementation proceeds bottom-up: data models → physics engine wrapper → level manager → renderer → input handler → game loop → levels → wiring.

## Tasks

- [-] 1. Scaffold `weak-threads/index.html` with canvas, Matter.js CDN script tag, and Matter.js availability check
  - Create `weak-threads/index.html` with a `<canvas id="game-canvas">` element
  - Add Matter.js CDN script tag (`0.19.0`)
  - After script load, check `window.Matter`; if undefined, render error overlay with "Could not load physics engine. Check your connection." and a retry button that calls `location.reload()`
  - Size canvas backing store by `devicePixelRatio`; scale context by `devicePixelRatio`
  - _Requirements: 11.1, 11.2, 12.1, 12.2_

- [ ] 2. Implement `PhysicsEngine` wrapper
  - [ ] 2.1 Write the `PhysicsEngine` class
    - Implement `init(canvas)`, `addBody`, `removeBody`, `addConstraint`, `removeConstraint`, `onCollisionStart`, `step(dt)`, `clear()`
    - Use `Matter.Engine.create()`, `Matter.World`, and `Matter.Events.on` for collision subscription
    - Do NOT use `Matter.Runner` — `step(dt)` calls `Matter.Engine.update(engine, dt * 1000)`
    - _Requirements: 6.1, 6.3_

- [ ] 3. Implement data models and level definitions
  - [ ] 3.1 Define `LevelData`, `AnchorDef`, `ThreadDef`, `GemDef`, `BasketDef` as plain JS object shapes (JSDoc comments)
    - _Requirements: 13.2_
  - [ ] 3.2 Write at least 5 handcrafted `LevelData` entries in a `LEVELS` array, ordered by ascending `id`
    - Each level must have unique id, display name, ≥1 anchor, ≥1 thread, a gem def, and a basket def
    - Vary thread count and layout to create increasing difficulty
    - _Requirements: 13.1, 13.2, 13.3_

- [ ] 4. Implement `LevelManager`
  - [ ] 4.1 Implement `loadLevel(index)`
    - Clamp index to `[0, LEVELS.length - 1]`; log warning if out of bounds
    - Call `engine.clear()`, then add anchor static bodies, gem dynamic circle body, basket sensor body
    - Build Matter.js constraints from `ThreadDef` entries; populate `activeThreads`
    - Set `gameState = 'PLAYING'`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  - [ ] 4.2 Implement `hitTestThread(x, y, threads)`
    - Sample each thread at 10 evenly-spaced points using `lerp` on `bodyA.position` / `bodyB.position`
    - Track minimum distance; return closest thread within 12px, or `null`
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [ ]* 4.3 Write property test for `hitTestThread` — Property 6: returns null for empty input
    - **Property 6: hitTestThread returns null for empty input**
    - **Validates: Requirements 3.1**
  - [ ]* 4.4 Write property test for `hitTestThread` — Property 7: returns null when no thread within threshold
    - **Property 7: hitTestThread returns null when no thread is within threshold**
    - **Validates: Requirements 3.2**
  - [ ] 4.5 Implement `cutThread(thread)`
    - Remove constraint from `engine` and from `activeThreads`
    - Assert `activeThreads.length` decremented by exactly 1
    - _Requirements: 2.3, 2.5_
  - [ ]* 4.6 Write property test for cut operations — Property 2: no-duplicate invariant
    - **Property 2: Cut operations maintain no-duplicate invariant**
    - **Validates: Requirements 2.3, 2.5**
  - [ ] 4.7 Implement `computeStars(totalThreads, threadsRemaining)`
    - Pure function: ratio ≥ 0.67 → 3, ≥ 0.34 → 2, else → 1
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [ ]* 4.8 Write property test for `computeStars` — Property 8: always returns value in {1, 2, 3}
    - **Property 8: Star rating is always in {1, 2, 3}**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
  - [ ] 4.9 Implement win handler (`onGemCaught`)
    - Guard: only act when `gameState === 'PLAYING'`; set `gameState = 'WIN'`; compute and store `starRating`
    - _Requirements: 4.1, 4.2, 4.3, 4.5_
  - [ ]* 4.10 Write property test for win condition — Property 4: fires at most once per level
    - **Property 4: Win condition fires at most once per level**
    - **Validates: Requirements 4.3**
  - [ ] 4.11 Implement lose condition check (called each frame)
    - If `gem.position.y > canvas.height + 100` and `gameState === 'PLAYING'`, set `gameState = 'LOSE'`
    - _Requirements: 7.1_
  - [ ] 4.12 Implement game-complete handling
    - When player completes the final level, display game-complete message instead of advancing
    - _Requirements: 13.4_

- [ ] 5. Checkpoint — core logic complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement `Renderer`
  - [ ] 6.1 Implement `init(canvas)` and `drawFrame(state)`
    - Clear canvas each frame; draw anchors, threads, gem, basket, particles, HUD
    - _Requirements: 8.1_
  - [ ] 6.2 Implement `drawThread(ctx, constraint, alpha)`
    - Use `ctx.save()` / `ctx.restore()`; draw line with `shadowBlur` glow from `bodyA.position` to `bodyB.position`
    - Must not mutate constraint or body state
    - _Requirements: 8.2, 8.6_
  - [ ]* 6.3 Write property test for `drawThread` — Property 10: does not mutate physics state
    - **Property 10: drawThread does not mutate physics state**
    - **Validates: Requirements 8.6**
  - [ ] 6.4 Implement gem drawing (circle with radial gradient) and basket drawing
    - _Requirements: 8.3, 8.4_
  - [ ] 6.5 Implement HUD: level number, star indicators, restart button
    - _Requirements: 8.5_
  - [ ] 6.6 Implement win overlay (level-complete with star rating) and lose overlay ("Try Again")
    - _Requirements: 4.4, 7.2_
  - [ ] 6.7 Implement `spawnParticles(x, y, type)` and particle update/draw loop
    - Spawn cut-type particles on thread cut; win-type particles on gem caught
    - Each frame: update position by velocity, decrement `life`; remove particles with `life <= 0`
    - Cap particle array at 200; evict oldest when exceeded
    - Keep `life` in `[0, 1]` at all times
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_
  - [ ]* 6.8 Write property test for particle system — Property 5: life invariant
    - **Property 5: Particle life invariant**
    - **Validates: Requirements 9.4, 9.5**
  - [ ]* 6.9 Write property test for particle system — Property 9: array never exceeds cap
    - **Property 9: Particle array never exceeds cap**
    - **Validates: Requirements 9.6**

- [ ] 7. Implement `InputHandler`
  - [ ] 7.1 Implement `attach(canvas)`, `detach()`, and `onCut(handler)`
    - Listen for `mousedown` and `touchstart` on canvas
    - Convert event coordinates to canvas space accounting for `devicePixelRatio` and `getBoundingClientRect()` offset
    - Fire `onCut` callback with canvas-space coordinates
    - _Requirements: 10.1, 10.2, 10.3_

- [ ] 8. Implement the main game loop and wire all components together
  - [ ] 8.1 Implement `gameLoop(timestamp)` using `requestAnimationFrame`
    - Compute `dt = clamp((timestamp - lastTimestamp) / 1000, 0, 0.05)`
    - If `gameState === 'PLAYING'`: call `engine.step(dt)`, check lose condition
    - Always call `renderer.drawFrame(buildRenderState())`
    - Schedule next frame with `requestAnimationFrame(gameLoop)`
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - [ ]* 8.2 Write property test for game loop dt clamping — Property 3: dt always clamped
    - **Property 3: dt is always clamped**
    - **Validates: Requirements 6.2, 6.3**
  - [ ] 8.3 Wire `InputHandler.onCut` → `LevelManager.hitTestThread` → `LevelManager.cutThread` → `Renderer.spawnParticles`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6_
  - [ ] 8.4 Wire `PhysicsEngine.onCollisionStart` → `LevelManager.onGemCaught` → `Renderer` win overlay
    - _Requirements: 4.1, 4.2, 4.4_
  - [ ] 8.5 Wire restart button and "Try Again" overlay click → `loadLevel(currentIndex)`
    - _Requirements: 7.3_
  - [ ]* 8.6 Write property test for level load — Property 1: ActiveThreads populated correctly
    - **Property 1: Level load populates ActiveThreads correctly**
    - **Validates: Requirements 1.3**

- [ ] 9. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Property tests use `fast-check` (loaded via CDN or inline in a test file)
- All drawing coordinates are in logical pixels; `devicePixelRatio` scaling is applied once at context init
- Checkpoints ensure incremental validation before proceeding
