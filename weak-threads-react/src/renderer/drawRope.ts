import { RopeChain } from '../game/LevelManager'

function drawRopeSegment(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  x2: number, y2: number,
  alpha: number,
  cut: boolean
) {
  const baseColor     = cut ? '#4a4060' : '#7c5cbf'
  const midColor      = cut ? '#5a5070' : '#9d7de8'
  const highlightCol  = cut ? '#6a6080' : '#c4b0f5'

  ctx.save()
  ctx.globalAlpha = alpha

  ctx.beginPath()
  ctx.moveTo(x1, y1); ctx.lineTo(x2, y2)
  ctx.strokeStyle = baseColor
  ctx.lineWidth = 5
  ctx.lineCap = 'round'
  ctx.shadowColor = cut ? 'transparent' : '#7c5cbf'
  ctx.shadowBlur = cut ? 0 : 6
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(x1, y1); ctx.lineTo(x2, y2)
  ctx.strokeStyle = midColor
  ctx.lineWidth = 3
  ctx.shadowBlur = 0
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(x1, y1); ctx.lineTo(x2, y2)
  ctx.strokeStyle = highlightCol
  ctx.lineWidth = 1
  ctx.setLineDash([6, 8])
  ctx.stroke()
  ctx.setLineDash([])

  ctx.restore()
}

export function drawChain(
  ctx: CanvasRenderingContext2D,
  chain: RopeChain,
  alpha: number,
  cut: boolean
) {
  const allNodes = [chain.startBody, ...chain.nodes, chain.endBody]
  for (let i = 0; i < allNodes.length - 1; i++) {
    drawRopeSegment(
      ctx,
      allNodes[i].position.x,   allNodes[i].position.y,
      allNodes[i+1].position.x, allNodes[i+1].position.y,
      alpha, cut
    )
  }
}
