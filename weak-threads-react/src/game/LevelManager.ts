import Matter from 'matter-js'
import { LEVELS, LevelData } from '../levels'
import { PhysicsEngine } from '../engine/PhysicsEngine'
import { ROPE_SEGMENTS, HIT_THRESHOLD, LOGICAL_H } from '../constants'

export type GameState = 'LOADING' | 'PLAYING' | 'WIN' | 'LOSE' | 'GAME_COMPLETE'

export interface RopeChain {
  id: string
  nodes: Matter.Body[]
  links: Matter.Constraint[]
  cutLink: Matter.Constraint
  startBody: Matter.Body
  endBody: Matter.Body
}

export class LevelManager {
  currentIndex = 0
  currentLevel: LevelData | null = null
  gemBody: Matter.Body | null = null
  basketBody: Matter.Body | null = null
  anchorBodies: Record<string, Matter.Body> = {}
  activeThreads: RopeChain[] = []
  cutChains: RopeChain[] = []
  totalThreads = 0
  gameState: GameState = 'LOADING'
  starRating: number | null = null

  constructor(private engine: PhysicsEngine) {}

  loadLevel(index: number) {
    const clamped = Math.max(0, Math.min(index, LEVELS.length - 1))
    this.engine.clear()

    this.currentIndex = clamped
    this.currentLevel = LEVELS[clamped]
    this.totalThreads = this.currentLevel.threads.length
    this.activeThreads = []
    this.cutChains = []
    this.starRating = null

    const level = this.currentLevel

    // Anchors
    this.anchorBodies = {}
    for (const a of level.anchors) {
      const body = Matter.Bodies.circle(a.x, a.y, 8, {
        isStatic: true,
        label: 'anchor_' + a.id,
      })
      this.anchorBodies[a.id] = body
      this.engine.addBody(body)
    }

    // Gem
    this.gemBody = Matter.Bodies.circle(level.gem.x, level.gem.y, level.gem.radius, {
      label: 'gem',
      restitution: 0.3,
      friction: 0.1,
    })
    this.engine.addBody(this.gemBody)

    // Basket sensor
    this.basketBody = Matter.Bodies.rectangle(
      level.basket.x + level.basket.width / 2,
      level.basket.y + level.basket.height / 2,
      level.basket.width,
      level.basket.height,
      { isStatic: true, isSensor: true, label: 'basket' }
    )
    this.engine.addBody(this.basketBody)

    // Rope chains
    for (const t of level.threads) {
      const resolveBody = (ref: string) =>
        ref === 'gem' ? this.gemBody! : this.anchorBodies[ref]

      const startBody = resolveBody(t.from)
      const endBody = resolveBody(t.to)
      const segLen = t.length / ROPE_SEGMENTS

      const sx = startBody.position.x, sy = startBody.position.y
      const ex = endBody.position.x,   ey = endBody.position.y

      const nodes: Matter.Body[] = []
      for (let i = 1; i < ROPE_SEGMENTS; i++) {
        const frac = i / ROPE_SEGMENTS
        const node = Matter.Bodies.circle(
          sx + (ex - sx) * frac,
          sy + (ey - sy) * frac,
          3,
          {
            label: 'rope_node',
            collisionFilter: { mask: 0 },
            frictionAir: 0.05,
            mass: 0.1,
          }
        )
        this.engine.addBody(node)
        nodes.push(node)
      }

      const allNodes = [startBody, ...nodes, endBody]
      const links: Matter.Constraint[] = []
      for (let i = 0; i < allNodes.length - 1; i++) {
        const isLast = i === allNodes.length - 2
        const c = Matter.Constraint.create({
          bodyA: allNodes[i],
          bodyB: allNodes[i + 1],
          length: segLen,
          stiffness: isLast ? t.stiffness : 0.9,
          damping: 0.1,
          label: isLast ? t.id + '_cut' : t.id + '_link' + i,
        })
        this.engine.addConstraint(c)
        links.push(c)
      }

      this.activeThreads.push({
        id: t.id,
        nodes,
        links,
        cutLink: links[links.length - 1],
        startBody,
        endBody,
      })
    }

    this.gameState = 'PLAYING'
  }

  hitTestThread(x: number, y: number): RopeChain | null {
    let closest: RopeChain | null = null
    let minDist = HIT_THRESHOLD

    for (const chain of this.activeThreads) {
      const allNodes = [chain.startBody, ...chain.nodes, chain.endBody]
      for (let i = 0; i < allNodes.length - 1; i++) {
        const ax = allNodes[i].position.x,   ay = allNodes[i].position.y
        const bx = allNodes[i+1].position.x, by = allNodes[i+1].position.y
        for (let s = 0; s <= 2; s++) {
          const f = s / 2
          const px = ax + (bx - ax) * f
          const py = ay + (by - ay) * f
          const dist = Math.hypot(px - x, py - y)
          if (dist < minDist) {
            minDist = dist
            closest = chain
          }
        }
      }
    }

    return closest
  }

  cutThread(chain: RopeChain) {
    this.engine.removeConstraint(chain.cutLink)
    const idx = this.activeThreads.indexOf(chain)
    if (idx !== -1) this.activeThreads.splice(idx, 1)
    this.cutChains.push(chain)
  }

  computeStars(totalThreads: number, threadsRemaining: number): number {
    const ratio = threadsRemaining / totalThreads
    if (ratio >= 0.67) return 3
    if (ratio >= 0.34) return 2
    return 1
  }

  onGemCaught() {
    if (this.gameState !== 'PLAYING') return
    this.gameState = 'WIN'
    this.starRating = this.computeStars(this.totalThreads, this.activeThreads.length)
  }

  checkLoseCondition() {
    if (this.gemBody && this.gemBody.position.y > LOGICAL_H + 100 && this.gameState === 'PLAYING') {
      this.gameState = 'LOSE'
    }
  }

  advanceLevel() {
    if (this.currentIndex >= LEVELS.length - 1) {
      this.gameState = 'GAME_COMPLETE'
    } else {
      this.loadLevel(this.currentIndex + 1)
    }
  }
}
