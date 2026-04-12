import { useEffect, useRef } from 'react'
import Matter from 'matter-js'
import { PhysicsEngine } from '../engine/PhysicsEngine'
import { LevelManager } from '../game/LevelManager'
import { InputHandler } from '../game/InputHandler'
import { Renderer } from '../renderer/Renderer'

export function useGameLoop(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  // Keep all game objects in refs — never triggers re-renders
  const engineRef  = useRef<PhysicsEngine | null>(null)
  const levelRef   = useRef<LevelManager | null>(null)
  const inputRef   = useRef<InputHandler | null>(null)
  const rendererRef = useRef<Renderer | null>(null)
  const rafRef     = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const engine   = new PhysicsEngine()
    const renderer = new Renderer()
    const level    = new LevelManager(engine)
    const input    = new InputHandler()

    engine.init()
    renderer.init(canvas)

    // Cut handler
    input.onCut((x, y) => {
      if (level.gameState !== 'PLAYING') return
      const chain = level.hitTestThread(x, y)
      if (chain) {
        const mx = (chain.startBody.position.x + chain.endBody.position.x) / 2
        const my = (chain.startBody.position.y + chain.endBody.position.y) / 2
        level.cutThread(chain)
        renderer.spawn(mx, my, 'cut')
      }
    })

    // Collision → win
    engine.onCollisionStart((pairs: Matter.Pair[]) => {
      for (const pair of pairs) {
        const labels = [pair.bodyA.label, pair.bodyB.label]
        if (labels.includes('gem') && labels.includes('basket')) {
          level.onGemCaught()
          if (level.gemBody) {
            renderer.spawn(level.gemBody.position.x, level.gemBody.position.y, 'win')
          }
        }
      }
    })

    // UI button clicks on canvas
    const handleClick = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect()
      const lw = parseInt(canvas.style.width)
      const lh = parseInt(canvas.style.height)
      const x = (clientX - rect.left) * (lw / rect.width)
      const y = (clientY - rect.top)  * (lh / rect.height)

      const rb = renderer.restartBtnRect
      if (rb && x >= rb.x && x <= rb.x + rb.w && y >= rb.y && y <= rb.y + rb.h) {
        level.loadLevel(level.currentIndex)
        return
      }
      if (level.gameState === 'LOSE') {
        level.loadLevel(level.currentIndex)
        return
      }
      if (level.gameState === 'WIN') {
        const nb = renderer.nextBtnRect
        if (nb && x >= nb.x && x <= nb.x + nb.w && y >= nb.y && y <= nb.y + nb.h) {
          level.advanceLevel()
        }
      }
    }

    const onMouseDown = (e: MouseEvent) => handleClick(e.clientX, e.clientY)
    const onTouch     = (e: TouchEvent) => {
      e.preventDefault()
      handleClick(e.touches[0].clientX, e.touches[0].clientY)
    }

    canvas.addEventListener('mousedown', onMouseDown)
    canvas.addEventListener('touchstart', onTouch, { passive: false })
    input.attach(canvas)

    level.loadLevel(0)

    // Game loop
    let last: number | null = null
    const loop = (ts: number) => {
      if (last === null) last = ts
      const dt = Math.min(Math.max((ts - last) / 1000, 0), 0.05)
      last = ts

      if (level.gameState === 'PLAYING') {
        engine.step(dt)
        level.checkLoseCondition()
      }

      renderer.drawFrame({
        gameState:    level.gameState,
        currentLevel: level.currentLevel,
        gemBody:      level.gemBody,
        anchorBodies: level.anchorBodies,
        activeThreads: level.activeThreads,
        cutChains:    level.cutChains,
        starRating:   level.starRating,
        currentIndex: level.currentIndex,
        dt,
      })

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)

    engineRef.current  = engine
    levelRef.current   = level
    inputRef.current   = input
    rendererRef.current = renderer

    return () => {
      cancelAnimationFrame(rafRef.current)
      input.detach()
      canvas.removeEventListener('mousedown', onMouseDown)
      canvas.removeEventListener('touchstart', onTouch)
      engine.clear()
    }
  }, [canvasRef])
}
