export interface Particle {
  x: number; y: number
  vx: number; vy: number
  life: number
  color: string
  radius: number
}

const MAX = 200

export function spawnParticles(particles: Particle[], x: number, y: number, type: 'win' | 'cut') {
  const color  = type === 'win' ? '#fbbf24' : '#a78bfa'
  const radius = type === 'win' ? 4 : 3
  const spread = type === 'win' ? 120 : 80

  while (particles.length + 12 > MAX) particles.shift()

  for (let i = 0; i < 12; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * spread * 2,
      vy: (Math.random() - 0.5) * spread * 2,
      life: 1.0,
      color,
      radius,
    })
  }
}

export function updateParticles(particles: Particle[], dt: number) {
  for (const p of particles) {
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.life = Math.max(0, p.life - dt * 1.5)
  }
  // mutate in place
  const alive = particles.filter(p => p.life > 0)
  particles.length = 0
  particles.push(...alive)
}

export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  ctx.save()
  for (const p of particles) {
    ctx.globalAlpha = p.life
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}
