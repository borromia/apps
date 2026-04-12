import { LOGICAL_W, LOGICAL_H } from '../constants'

type CutHandler = (x: number, y: number) => void

export class InputHandler {
  private cutHandler: CutHandler | null = null
  private canvas: HTMLCanvasElement | null = null
  private onMouseDown: ((e: MouseEvent) => void) | null = null
  private onTouchStart: ((e: TouchEvent) => void) | null = null

  onCut(handler: CutHandler) {
    this.cutHandler = handler
  }

  attach(canvas: HTMLCanvasElement) {
    this.canvas = canvas

    this.onMouseDown = (e: MouseEvent) => {
      const { x, y } = this.toLogical(e.clientX, e.clientY)
      this.cutHandler?.(x, y)
    }

    this.onTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      const touch = e.touches[0]
      const { x, y } = this.toLogical(touch.clientX, touch.clientY)
      this.cutHandler?.(x, y)
    }

    canvas.addEventListener('mousedown', this.onMouseDown)
    canvas.addEventListener('touchstart', this.onTouchStart, { passive: false })
  }

  detach() {
    if (!this.canvas) return
    if (this.onMouseDown) this.canvas.removeEventListener('mousedown', this.onMouseDown)
    if (this.onTouchStart) this.canvas.removeEventListener('touchstart', this.onTouchStart)
    this.canvas = null
  }

  private toLogical(clientX: number, clientY: number) {
    const rect = this.canvas!.getBoundingClientRect()
    return {
      x: (clientX - rect.left) * (LOGICAL_W / rect.width),
      y: (clientY - rect.top)  * (LOGICAL_H / rect.height),
    }
  }
}
