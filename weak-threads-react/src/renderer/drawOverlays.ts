import { LOGICAL_W, LOGICAL_H } from '../constants'
import { LEVELS } from '../levels'
import { BtnRect } from './drawHUD'

function overlayBg(ctx: CanvasRenderingContext2D) {
  ctx.save()
  ctx.fillStyle = 'rgba(13, 13, 20, 0.75)'
  ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H)
  ctx.restore()
}

function centeredText(ctx: CanvasRenderingContext2D, text: string, y: number, font: string, color: string) {
  ctx.save()
  ctx.font = font
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.fillText(text, LOGICAL_W / 2, y)
  ctx.restore()
}

export function drawWinOverlay(
  ctx: CanvasRenderingContext2D,
  starRating: number | null,
  currentIndex: number
): BtnRect {
  overlayBg(ctx)
  centeredText(ctx, 'Level Complete!', LOGICAL_H / 2 - 60, 'bold 36px sans-serif', '#a78bfa')

  const stars = starRating ?? 0
  ctx.save()
  ctx.font = 'bold 36px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < stars ? '#fbbf24' : '#4b5563'
    ctx.fillText('★', LOGICAL_W / 2 - 40 + i * 40, LOGICAL_H / 2)
  }
  ctx.restore()

  const isLast = currentIndex >= LEVELS.length - 1
  const btnLabel = isLast ? 'You Win!' : 'Next Level →'
  const btnW = 160, btnH = 40
  const btnX = LOGICAL_W / 2 - btnW / 2
  const btnY = LOGICAL_H / 2 + 55
  const btn: BtnRect = { x: btnX, y: btnY, w: btnW, h: btnH }

  ctx.save()
  ctx.fillStyle = 'rgba(167, 139, 250, 0.2)'
  ctx.strokeStyle = '#a78bfa'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(btnX, btnY, btnW, btnH, 8)
  ctx.fill()
  ctx.stroke()
  ctx.font = 'bold 18px sans-serif'
  ctx.fillStyle = '#f0f0f5'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(btnLabel, LOGICAL_W / 2, btnY + btnH / 2)
  ctx.restore()

  return btn
}

export function drawLoseOverlay(ctx: CanvasRenderingContext2D) {
  overlayBg(ctx)
  centeredText(ctx, 'Try Again', LOGICAL_H / 2 - 20, 'bold 36px sans-serif', '#ff6b6b')
  centeredText(ctx, 'The gem fell...', LOGICAL_H / 2 + 24, '18px sans-serif', '#9ca3af')
}

export function drawGameCompleteOverlay(ctx: CanvasRenderingContext2D) {
  overlayBg(ctx)
  centeredText(ctx, 'You Beat All Levels!', LOGICAL_H / 2 - 20, 'bold 36px sans-serif', '#fbbf24')
  centeredText(ctx, 'Congratulations!', LOGICAL_H / 2 + 28, '22px sans-serif', '#a78bfa')
}
