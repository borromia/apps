import Matter from 'matter-js'

export function drawAnchors(ctx: CanvasRenderingContext2D, anchorBodies: Record<string, Matter.Body>) {
  for (const body of Object.values(anchorBodies)) {
    ctx.save()
    ctx.fillStyle = '#f59e0b'
    ctx.shadowColor = '#f59e0b'
    ctx.shadowBlur = 12
    ctx.beginPath()
    ctx.arc(body.position.x, body.position.y, 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}
