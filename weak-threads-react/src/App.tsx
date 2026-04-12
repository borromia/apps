import { useRef } from 'react'
import { useGameLoop } from './hooks/useGameLoop'

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useGameLoop(canvasRef)

  return (
    <div style={{
      background: '#0d0d14',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      overflow: 'hidden',
    }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  )
}
