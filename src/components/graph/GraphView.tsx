import { useMemo, useState } from 'react'
import { motion } from 'motion/react'

interface GraphNode {
  id: string
  entity_type?: string
  canonical_name?: string
  doc_type?: string
}
interface GraphEdge {
  source: string
  target: string
  rel_type: string
}

interface Props {
  nodes: GraphNode[]
  edges: GraphEdge[]
  centerId?: string
  onNodeClick?: (id: string) => void
}

// Glowing neon cyber palette mapping
const TYPE_COLOR: Record<string, string> = {
  Equipment: '#00f0ff',            // Cyber Cyan
  Document: '#a855f7',             // Neon Purple
  Procedure: '#10b981',            // High-Glow Emerald
  RegulatoryRequirement: '#fbbf24', // Amber Audit Warning
  Incident: '#ef4444',             // Danger Red
}

export function GraphView({ nodes, edges, centerId, onNodeClick }: Props) {
  const [hovered, setHovered] = useState<string | null>(null)
  const width = 640
  const height = 400
  const cx = width / 2
  const cy = height / 2

  const positions = useMemo(() => {
    const pos: Record<string, { x: number; y: number }> = {}
    const center = centerId ?? nodes[0]?.id
    const others = nodes.filter((n) => n.id !== center)
    if (center) pos[center] = { x: cx, y: cy }
    const radius = Math.min(width, height) / 2 - 50
    others.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / Math.max(others.length, 1)
      pos[n.id] = { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) }
    })
    return pos
  }, [nodes, centerId])

  return (
    <div className="relative w-full h-auto bg-industrial-950 rounded-xl overflow-hidden p-3 border border-industrial-800 shadow-inner">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none">
        {/* SVG Glow Filter definitions */}
        <defs>
          <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Draw Edges */}
        {edges.map((e, i) => {
          const s = positions[e.source]
          const t = positions[e.target]
          if (!s || !t) return null
          const isHighlighted = hovered === e.source || hovered === e.target
          return (
            <g key={i} className="transition-opacity duration-300">
              <line 
                x1={s.x} 
                y1={s.y} 
                x2={t.x} 
                y2={t.y} 
                stroke={isHighlighted ? '#3fb6a8' : '#1d2b3e'} 
                strokeWidth={isHighlighted ? 2 : 1.2} 
                strokeDasharray={isHighlighted ? "none" : "3,3"}
                className="transition-all"
              />
              {/* Relationship labels */}
              <rect
                x={(s.x + t.x) / 2 - 28}
                y={(s.y + t.y) / 2 - 6}
                width={56}
                height={12}
                rx={4}
                fill="#0b111a"
                opacity={isHighlighted ? 0.9 : 0.6}
              />
              <text
                x={(s.x + t.x) / 2}
                y={(s.y + t.y) / 2 + 3}
                fill={isHighlighted ? '#cbd5e1' : '#475569'}
                fontSize={8}
                fontFamily="JetBrains Mono"
                fontWeight="bold"
                textAnchor="middle"
              >
                {e.rel_type.toUpperCase()}
              </text>
            </g>
          )
        })}

        {/* Draw Nodes */}
        {nodes.map((n) => {
          const p = positions[n.id]
          if (!p) return null
          const isCenter = n.id === centerId
          const color = TYPE_COLOR[n.entity_type ?? ''] ?? '#94a3b8'
          const label = n.canonical_name ?? n.id
          const isHovered = hovered === n.id

          return (
            <g
              key={n.id}
              transform={`translate(${p.x},${p.y})`}
              onMouseEnter={() => setHovered(n.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onNodeClick?.(n.id)}
              className="cursor-pointer group"
            >
              {/* Outer halo shadow for center or hovered nodes */}
              {(isCenter || isHovered) && (
                <circle 
                  r={isCenter ? 26 : 19} 
                  fill={color} 
                  opacity={0.15} 
                  className="transition-all duration-300 animate-pulse"
                />
              )}

              {/* Main Node Circle */}
              <circle 
                r={isCenter ? 18 : 12} 
                fill={color} 
                className="transition-all duration-300"
                style={{
                  filter: isCenter || isHovered ? 'url(#glow-cyan)' : 'none',
                }}
              />

              {/* Center dot in nodes */}
              <circle r={isCenter ? 5 : 3} fill="#06090e" />

              {/* Node text label box */}
              <rect
                x={-60}
                y={isCenter ? 24 : 18}
                width={120}
                height={15}
                rx={4}
                fill="#06090e"
                stroke={isHovered ? color : '#121b29'}
                strokeWidth={1}
                opacity={0.9}
              />
              <text
                y={isCenter ? 34 : 28}
                textAnchor="middle"
                fontSize={9}
                fontFamily="JetBrains Mono"
                fontWeight="bold"
                fill={isHovered ? color : '#cbd5e1'}
              >
                {label.length > 18 ? label.slice(0, 16) + '…' : label}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Legend Block */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 bg-industrial-900/40 border border-industrial-800/60 p-3 rounded-xl text-[10px] font-bold font-mono">
        <span className="text-slate-500 uppercase tracking-wider mr-1">Legend:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00f0ff] inline-block" />
          <span className="text-slate-400">Equipment</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#a855f7] inline-block" />
          <span className="text-slate-400">Manual</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] inline-block" />
          <span className="text-slate-400">Procedure</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#fbbf24] inline-block" />
          <span className="text-slate-400">Mandate</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] inline-block" />
          <span className="text-slate-400">Incident</span>
        </div>
      </div>
    </div>
  )
}
