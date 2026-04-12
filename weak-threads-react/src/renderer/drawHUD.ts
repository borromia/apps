import { LOGICAL_W } from '../constants'
import { GameState } from '../game/LevelManager'

export interface BtnRect { x: number; y: number; w: number; h: number }

export function drawHUD(
  ctx: CanvasRenderingContext2D,
  currentIndex: number,
  gameState: GameState,
  starRating: number | null
): BtnRect {
  // Level label
  ctx.save()
  ctx.font = 'bold 16px sans-serif'
  ctx.fillStyle = '#f0f0f5'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText('Level ' + (currentIndex + 1), 16, 8)
  ctx.restore()

  // Stars
  const stars = gameState === 'WIN' && starRating != null ? starRating : 0
  ctx.save()
  ctx.font = 'bold 18px sans-serif'
  ctx.textBaseline = 'top'
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < stars ? '#fbbf24' : '#4b5563'
    ctx.textAlign = 'right'
    ctx.fillText('★', LOGICAL_W - 56 - (2 - i) * 22, 8)
  }
  ctx.restore()

  // Restart button
  const btn: BtnRect = { x: LOGICAL_W - 48, y: 8, w: 40, h: 28 }
  ctx.save()
  ctx.fillStyle = 'rgba(167, 139, 250, 0.15)'
  ctx.strokeStyle = 'rgba(167, 139, 250, 0.4)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.roundRect(btn.x, btn.y, btn.w, btn.h, 6)
  ctx.fill()
  ctx.stroke()
  ctx.font = 'bold 16px sans-serif'
  ctx.fillStyle = '#a78bfa'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('↺', btn.x + btn.w / 2, btn.y + btn.h / 2)
  ctx.restore()

  return btn
}
