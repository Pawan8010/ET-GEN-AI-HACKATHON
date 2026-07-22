import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Search, Share2, Sparkles, Sliders } from 'lucide-react'
import { api } from '../lib/api'
import { GraphView } from '../components/graph/GraphView'

export function GraphExplorer() {
  const [equipment, setEquipment] = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [graphData, setGraphData] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] })
  const [query, setQuery] = useState('')

  useEffect(() => {
    api.listEquipment().then(setEquipment).catch(() => {})
  }, [])

  const loadEntity = async (tag: string) => {
    const nodeId = `equip:${tag}`
    setSelected(nodeId)
    const data = await api.entityNeighbors(nodeId, 1)
    setGraphData(data)
  }

  const handleSearch = async () => {
    if (!query.trim()) return
    const results = await api.searchGraph(query.trim())
    if (results[0]) {
      setSelected(results[0].id)
      const data = await api.entityNeighbors(results[0].id, 1)
      setGraphData(data)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 md:p-8 max-w-5xl mx-auto flex flex-col gap-6 font-sans pb-24"
    >
      {/* Title */}
      <div className="border-b border-industrial-800 pb-5">
        <h2 className="text-2xl font-bold text-white font-display flex items-center gap-2">
          <Share2 className="text-industrial-accent glow-text-cyan" size={24} />
          Knowledge Graph Explorer
        </h2>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          Navigate relationships mapping assets directly to relevant safety manuals, incidents, and procedures.
          Select an equipment capsule below to expand its connected local nodes.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-3">
        <div className="flex-1 flex items-center gap-2.5 rounded-xl border border-industrial-800 bg-industrial-900 px-4 shadow-inner">
          <Search size={15} className="text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search equipment tags, SOP names, incident indices..."
            className="flex-1 bg-transparent py-3 text-xs text-slate-200 outline-none placeholder:text-slate-600 font-semibold"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-5 py-3 rounded-xl bg-industrial-800 border border-industrial-700 hover:border-industrial-accent/40 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white transition"
        >
          Query Graph
        </button>
      </div>

      {/* Equipment select capsules with hover and click state */}
      <div className="flex flex-col gap-2.5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
          <Sliders size={12} className="text-industrial-purple" />
          Active Hardware Nodes
        </span>
        <div className="flex flex-wrap gap-2">
          {equipment.map((tag) => {
            const isSelected = selected === `equip:${tag}`
            return (
              <motion.button
                key={tag}
                onClick={() => loadEntity(tag)}
                whileHover={{ y: -1, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`text-[11px] font-bold uppercase tracking-wider rounded-xl border px-4 py-2 transition-all ${
                  isSelected
                    ? 'border-industrial-accent bg-industrial-accent/15 text-industrial-accent shadow-[0_0_12px_rgba(0,240,255,0.15)] font-extrabold'
                    : 'border-industrial-800 bg-industrial-900/60 text-slate-400 hover:text-slate-200 hover:border-industrial-700'
                }`}
              >
                {tag}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Interactive Visual Graph Canvas */}
      <div className="rounded-2xl border border-industrial-800 bg-industrial-900/40 p-5 shadow-2xl relative overflow-hidden cyber-panel-glow">
        <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-industrial-950/80 border border-industrial-800 px-3 py-1.5 rounded-xl">
          <Sparkles size={12} className="text-industrial-purple animate-pulse" />
          <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            Connected Topology
          </span>
        </div>

        <AnimatePresence mode="wait">
          {graphData.nodes.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20 flex flex-col items-center justify-center gap-2"
            >
              <Share2 size={28} className="text-slate-600 animate-pulse" />
              <p className="text-xs text-slate-500 font-medium">
                Select an equipment capsule above to explore the knowledge topology maps.
              </p>
            </motion.div>
          ) : (
            <motion.div 
              key="graph"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-6 border border-industrial-800 bg-industrial-950 rounded-xl overflow-hidden p-2"
            >
              <GraphView 
                nodes={graphData.nodes} 
                edges={graphData.edges} 
                centerId={selected ?? undefined} 
                onNodeClick={(id) => {
                  // If the user clicks on another Equipment node in the graph, load its neighbors!
                  if (id.startsWith('equip:')) {
                    const tag = id.replace('equip:', '')
                    loadEntity(tag)
                  }
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
