import Matter from 'matter-js'
import { GemDef } from '../levels'

export function drawGem(ctx: CanvasRenderingContext2D, gemBody: Matter.Body, gemDef: GemDef) {
  const { x, y } = gemBody.position
  ctx.save()
  ctx.shadowColor = gemDef.color
  ctx.shadowBlur = 20
  const grad = ctx.createRadialGradient(x, y, 0, x, y, gemDef.radius)
  grad.addColorStop(0, '#e0d4ff')
  grad.addColorStop(1, gemDef.color)
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(x, y, gemDef.radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}
