import { LOGICAL_W, LOGICAL_H } from '../constants'
import { GameState, RopeChain } from '../game/LevelManager'
import { LevelData } from '../levels'
import Matter from 'matter-js'
import { drawChain } from './drawRope'
import { drawGem } from './drawGem'
import { drawBasket } from './drawBasket'
import { drawAnchors } from './drawAnchors'
import { drawHUD, BtnRect } from './drawHUD'
import { drawWinOverlay, drawLoseOverlay, drawGameCompleteOverlay } from './drawOverlays'
import { Particle, spawnParticles, updateParticles, drawParticles } from './particles'

export interface RenderState {
  gameState: GameState
  currentLevel: LevelData | null
  gemBody: Matter.Body | null
  anchorBodies: Record<string, Matter.Body>
  activeThreads: RopeChain[]
  cutChains: RopeChain[]
  starRating: number | null
  currentIndex: number
  dt: number
}

export class Renderer {
  private ctx!: CanvasRenderingContext2D
  private particles: Particle[] = []
  restartBtnRect: BtnRect | null = null
  nextBtnRect: BtnRect | null = null

  init(canvas: HTMLCanvasElement) {
    const dpr = window.devicePixelRatio || 1
    canvas.width  = LOGICAL_W * dpr
    canvas.height = LOGICAL_H * dpr
    canvas.style.width  = LOGICAL_W + 'px'
    canvas.style.height = LOGICAL_H + 'px'
    this.ctx = canvas.getContext('2d')!
    this.ctx.scale(dpr, dpr)
  }

  spawn(x: number, y: number, type: 'win' | 'cut') {
    spawnParticles(this.particles, x, y, type)
  }

  drawFrame(state: RenderState) {
    const ctx = this.ctx
    const { gameState, currentLevel, gemBody, anchorBodies, activeThreads, cutChains, starRating, currentIndex, dt } = state

    ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H)
    ctx.fillStyle = '#0d0d14'
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H)

    if (!currentLevel) return

    drawAnchors(ctx, anchorBodies)

    for (const chain of cutChains)    drawChain(ctx, chain, 0.4, true)
    for (const chain of activeThreads) drawChain(ctx, chain, 1.0, false)

    drawBasket(ctx, currentLevel.basket)
    if (gemBody) drawGem(ctx, gemBody, currentLevel.gem)

    updateParticles(this.particles, dt)
    drawParticles(ctx, this.particles)

    this.restartBtnRect = drawHUD(ctx, currentIndex, gameState, starRating)

    if (gameState === 'WIN')           this.nextBtnRect = drawWinOverlay(ctx, starRating, currentIndex)
    if (gameState === 'LOSE')          drawLoseOverlay(ctx)
    if (gameState === 'GAME_COMPLETE') drawGameCompleteOverlay(ctx)
  }
}
