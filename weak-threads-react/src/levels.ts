export interface AnchorDef {
  id: string
  x: number
  y: number
}

export interface ThreadDef {
  id: string
  from: string
  to: string
  length: number
  stiffness: number
}

export interface GemDef {
  x: number
  y: number
  radius: number
  color: string
}

export interface BasketDef {
  x: number
  y: number
  width: number
  height: number
}

export interface LevelData {
  id: number
  name: string
  anchors: AnchorDef[]
  threads: ThreadDef[]
  gem: GemDef
  basket: BasketDef
}

export const LEVELS: LevelData[] = [
  {
    id: 1,
    name: 'First Cut',
    anchors: [{ id: 'a1', x: 400, y: 80 }],
    threads: [{ id: 't1', from: 'a1', to: 'gem', length: 180, stiffness: 0.8 }],
    gem:    { x: 400, y: 260, radius: 18, color: '#a78bfa' },
    basket: { x: 360, y: 480, width: 80, height: 40 },
  },
  {
    id: 2,
    name: 'Two Ropes',
    anchors: [
      { id: 'a1', x: 250, y: 80 },
      { id: 'a2', x: 550, y: 80 },
    ],
    threads: [
      { id: 't1', from: 'a1', to: 'gem', length: 220, stiffness: 0.8 },
      { id: 't2', from: 'a2', to: 'gem', length: 220, stiffness: 0.8 },
    ],
    gem:    { x: 400, y: 260, radius: 18, color: '#a78bfa' },
    basket: { x: 360, y: 490, width: 80, height: 40 },
  },
  {
    id: 3,
    name: 'The Swing',
    anchors: [
      { id: 'a1', x: 160, y: 80 },
      { id: 'a2', x: 400, y: 60 },
    ],
    threads: [
      { id: 't1', from: 'a1', to: 'gem', length: 200, stiffness: 0.8 },
      { id: 't2', from: 'a2', to: 'gem', length: 160, stiffness: 0.8 },
      { id: 't3', from: 'a1', to: 'a2', length: 250, stiffness: 0.8 },
    ],
    gem:    { x: 280, y: 240, radius: 18, color: '#a78bfa' },
    basket: { x: 660, y: 460, width: 80, height: 40 },
  },
  {
    id: 4,
    name: 'Triangle',
    anchors: [
      { id: 'a1', x: 400, y: 60 },
      { id: 'a2', x: 200, y: 320 },
      { id: 'a3', x: 600, y: 320 },
    ],
    threads: [
      { id: 't1', from: 'a1', to: 'gem', length: 180, stiffness: 0.8 },
      { id: 't2', from: 'a2', to: 'gem', length: 180, stiffness: 0.8 },
      { id: 't3', from: 'a3', to: 'gem', length: 180, stiffness: 0.8 },
    ],
    gem:    { x: 400, y: 220, radius: 18, color: '#a78bfa' },
    basket: { x: 660, y: 510, width: 80, height: 40 },
  },
  {
    id: 5,
    name: 'Web',
    anchors: [
      { id: 'a1', x: 200, y: 60 },
      { id: 'a2', x: 600, y: 60 },
      { id: 'a3', x: 120, y: 300 },
      { id: 'a4', x: 680, y: 300 },
    ],
    threads: [
      { id: 't1', from: 'a1', to: 'gem', length: 210, stiffness: 0.8 },
      { id: 't2', from: 'a2', to: 'gem', length: 210, stiffness: 0.8 },
      { id: 't3', from: 'a3', to: 'gem', length: 190, stiffness: 0.8 },
      { id: 't4', from: 'a4', to: 'gem', length: 190, stiffness: 0.8 },
      { id: 't5', from: 'a1', to: 'a2', length: 400, stiffness: 0.8 },
    ],
    gem:    { x: 400, y: 240, radius: 18, color: '#a78bfa' },
    basket: { x: 360, y: 510, width: 80, height: 40 },
  },
]
