import { BasketDef } from '../levels'

export function drawBasket(ctx: CanvasRenderingContext2D, basketDef: BasketDef) {
  ctx.save()
  ctx.strokeStyle = '#34d399'
  ctx.lineWidth = 3
  ctx.shadowColor = '#34d399'
  ctx.shadowBlur = 10
  ctx.strokeRect(basketDef.x, basketDef.y, basketDef.width, basketDef.height)
  ctx.restore()
}
