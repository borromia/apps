import Matter from 'matter-js'

export class PhysicsEngine {
  engine!: Matter.Engine
  world!: Matter.World

  init() {
    this.engine = Matter.Engine.create()
    this.world = this.engine.world
  }

  addBody(body: Matter.Body) {
    Matter.World.add(this.world, body)
  }

  removeBody(body: Matter.Body) {
    Matter.World.remove(this.world, body)
  }

  addConstraint(c: Matter.Constraint) {
    Matter.World.add(this.world, c)
  }

  removeConstraint(c: Matter.Constraint) {
    Matter.World.remove(this.world, c)
  }

  onCollisionStart(handler: (pairs: Matter.Pair[]) => void) {
    Matter.Events.on(this.engine, 'collisionStart', (e: Matter.IEventCollision<Matter.Engine>) =>
      handler(e.pairs)
    )
  }

  // dt in seconds; Matter expects milliseconds
  step(dt: number) {
    Matter.Engine.update(this.engine, dt * 1000)
  }

  clear() {
    Matter.World.clear(this.world, false)
    Matter.Engine.clear(this.engine)
  }
}
