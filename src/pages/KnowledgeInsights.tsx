import React, { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
  BarChart3, 
  PieChart, 
  FileText, 
  Binary, 
  Sparkles, 
  Database, 
  Cpu, 
  Layers, 
  RefreshCw, 
  Info, 
  HelpCircle,
  Network,
  Search,
  X
} from 'lucide-react'
import { api } from '../lib/api'
import * as d3 from 'd3'
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface DocTypeItem {
  doc_type: string
  count: number
}

interface TopicItem {
  topic: string
  count: number
}

// Map database type string to clean human label
const TYPE_LABEL: Record<string, string> = {
  sop: 'SOPs & Guides',
  inspection_report: 'Inspection Checklists',
  work_order: 'Work Orders',
  incident: 'Incident Logs',
  manual: 'Equipment Manuals',
  regulation: 'Compliance Statutes',
  other: 'Other Records'
}

// Distinct high-glow cyber colors
const TYPE_COLORS: Record<string, string> = {
  sop: '#00f0ff',             // Cyber Cyan
  inspection_report: '#10b981', // High-Glow Emerald
  work_order: '#a855f7',      // Neon Purple
  incident: '#ef4444',        // Danger Red
  manual: '#fbbf24',          // Amber Warning
  regulation: '#ec4899',      // Hot Pink
  other: '#94a3b8'            // Neutral Slate
}

const INDUSTRIAL_TOPIC_KEYWORDS: Record<string, string[]> = {
  'Isolation & LOTO': ['isolation', 'loto', 'lockout', 'tagout', 'zero energy', 'de-energize'],
  'Bearing & Lubrication': ['bearing', 'lubricat', 'grease', 'oil', 'friction'],
  'Vibration & Alignment': ['vibration', 'align', 'unbalance', 'amplitude', 'frequency'],
  'Leakage & Seals': ['leak', 'seal', 'gland', 'packing', 'gasket'],
  'Overpressure & Safety': ['overpressure', 'relief', 'safety valve', 'psv', 'pressure', 'burst'],
  'Boiler & Steam Systems': ['boiler', 'steam', 'condensate', 'feedwater', 'thermal'],
  'Compressor Maintenance': ['compressor', 'surge', 'impeller', 'suction', 'discharge'],
  'Pump Performance': ['pump', 'centrifugal', 'cavitation', 'flow rate', 'head'],
  'Regulatory Standards': ['regulation', 'oisd', 'peso', 'factory act', 'compliance', 'standard']
}

const HEATMAP_NODES = ["Ingestion Node", "Vector Search", "Graph Resolver", "Gemini Proxy"];
const HEATMAP_TIMES = ["02:00", "04:00", "06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00", "00:00"];

const HEATMAP_DATA = [
  // Ingestion (Y: 0)
  { x: 0, y: 0, value: 45, load: 'Medium', node: "Ingestion Node", time: "02:00" },
  { x: 1, y: 0, value: 12, load: 'Low', node: "Ingestion Node", time: "04:00" },
  { x: 2, y: 0, value: 15, load: 'Low', node: "Ingestion Node", time: "06:00" },
  { x: 3, y: 0, value: 85, load: 'High', node: "Ingestion Node", time: "08:00" },
  { x: 4, y: 0, value: 95, load: 'Critical', node: "Ingestion Node", time: "10:00" },
  { x: 5, y: 0, value: 70, load: 'High', node: "Ingestion Node", time: "12:00" },
  { x: 6, y: 0, value: 50, load: 'Medium', node: "Ingestion Node", time: "14:00" },
  { x: 7, y: 0, value: 40, load: 'Medium', node: "Ingestion Node", time: "16:00" },
  { x: 8, y: 0, value: 88, load: 'High', node: "Ingestion Node", time: "18:00" },
  { x: 9, y: 0, value: 60, load: 'Medium', node: "Ingestion Node", time: "20:00" },
  { x: 10, y: 0, value: 30, load: 'Low', node: "Ingestion Node", time: "22:00" },
  { x: 11, y: 0, value: 25, load: 'Low', node: "Ingestion Node", time: "00:00" },

  // Vector Search (Y: 1)
  { x: 0, y: 1, value: 20, load: 'Low', node: "Vector Search", time: "02:00" },
  { x: 1, y: 1, value: 10, load: 'Low', node: "Vector Search", time: "04:00" },
  { x: 2, y: 1, value: 18, load: 'Low', node: "Vector Search", time: "06:00" },
  { x: 3, y: 1, value: 65, load: 'High', node: "Vector Search", time: "08:00" },
  { x: 4, y: 1, value: 92, load: 'Critical', node: "Vector Search", time: "10:00" },
  { x: 5, y: 1, value: 80, load: 'High', node: "Vector Search", time: "12:00" },
  { x: 6, y: 1, value: 75, load: 'High', node: "Vector Search", time: "14:00" },
  { x: 7, y: 1, value: 60, load: 'Medium', node: "Vector Search", time: "16:00" },
  { x: 8, y: 1, value: 78, load: 'High', node: "Vector Search", time: "18:00" },
  { x: 9, y: 1, value: 55, load: 'Medium', node: "Vector Search", time: "20:00" },
  { x: 10, y: 1, value: 42, load: 'Medium', node: "Vector Search", time: "22:00" },
  { x: 11, y: 1, value: 35, load: 'Low', node: "Vector Search", time: "00:00" },

  // Graph Resolver (Y: 2)
  { x: 0, y: 2, value: 30, load: 'Low', node: "Graph Resolver", time: "02:00" },
  { x: 1, y: 2, value: 15, load: 'Low', node: "Graph Resolver", time: "04:00" },
  { x: 2, y: 2, value: 22, load: 'Low', node: "Graph Resolver", time: "06:00" },
  { x: 3, y: 2, value: 70, load: 'High', node: "Graph Resolver", time: "08:00" },
  { x: 4, y: 2, value: 88, load: 'High', node: "Graph Resolver", time: "10:00" },
  { x: 5, y: 2, value: 94, load: 'Critical', node: "Graph Resolver", time: "12:00" },
  { x: 6, y: 2, value: 85, load: 'High', node: "Graph Resolver", time: "14:00" },
  { x: 7, y: 2, value: 72, load: 'High', node: "Graph Resolver", time: "16:00" },
  { x: 8, y: 2, value: 90, load: 'Critical', node: "Graph Resolver", time: "18:00" },
  { x: 9, y: 2, value: 68, load: 'High', node: "Graph Resolver", time: "20:00" },
  { x: 10, y: 2, value: 48, load: 'Medium', node: "Graph Resolver", time: "22:00" },
  { x: 11, y: 2, value: 33, load: 'Low', node: "Graph Resolver", time: "00:00" },

  // Gemini Proxy (Y: 3)
  { x: 0, y: 3, value: 15, load: 'Low', node: "Gemini Proxy", time: "02:00" },
  { x: 1, y: 3, value: 8, load: 'Low', node: "Gemini Proxy", time: "04:00" },
  { x: 2, y: 3, value: 12, load: 'Low', node: "Gemini Proxy", time: "06:00" },
  { x: 3, y: 3, value: 55, load: 'Medium', node: "Gemini Proxy", time: "08:00" },
  { x: 4, y: 3, value: 80, load: 'High', node: "Gemini Proxy", time: "10:00" },
  { x: 5, y: 3, value: 85, load: 'High', node: "Gemini Proxy", time: "12:00" },
  { x: 6, y: 3, value: 96, load: 'Critical', node: "Gemini Proxy", time: "14:00" },
  { x: 7, y: 3, value: 78, load: 'High', node: "Gemini Proxy", time: "16:00" },
  { x: 8, y: 3, value: 82, load: 'High', node: "Gemini Proxy", time: "18:00" },
  { x: 9, y: 3, value: 50, load: 'Medium', node: "Gemini Proxy", time: "20:00" },
  { x: 10, y: 3, value: 28, load: 'Low', node: "Gemini Proxy", time: "22:00" },
  { x: 11, y: 3, value: 18, load: 'Low', node: "Gemini Proxy", time: "00:00" },
];

const renderCustomCell = (props: any) => {
  const { cx, cy, payload } = props;
  if (cx === undefined || cy === undefined) return null;
  const val = payload.value;
  let fill = '#00f0ff';
  if (val > 85) fill = 'var(--industrial-danger)';
  else if (val > 65) fill = 'var(--industrial-warn)';
  else if (val > 40) fill = 'var(--industrial-purple)';
  else fill = 'var(--industrial-emerald)';

  return (
    <g>
      <rect
        x={cx - 16}
        y={cy - 12}
        width={32}
        height={24}
        rx={4}
        fill={fill}
        opacity={0.15}
        className="transition-all duration-300"
      />
      <rect
        x={cx - 12}
        y={cy - 8}
        width={24}
        height={16}
        rx={3}
        fill={fill}
        stroke="var(--industrial-900)"
        strokeWidth={1}
        opacity={0.8}
        className="transition-all duration-300 hover:opacity-100"
        style={{ cursor: 'pointer' }}
      />
    </g>
  );
};

const CustomHeatmapTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    let fill = '#10b981';
    if (data.value > 85) fill = 'var(--industrial-danger)';
    else if (data.value > 65) fill = 'var(--industrial-warn)';
    else if (data.value > 40) fill = 'var(--industrial-purple)';
    else fill = 'var(--industrial-emerald)';

    return (
      <div className="bg-industrial-950/95 border border-industrial-800 p-3 rounded-xl font-mono text-[10px] shadow-2xl min-w-[160px]">
        <div className="flex items-center gap-1.5 border-b border-industrial-800/60 pb-1.5 mb-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: fill }} />
          <span className="font-bold text-white font-sans text-xs">{data.node}</span>
        </div>
        <div className="space-y-1 text-slate-300">
          <div className="flex justify-between">
            <span className="text-slate-500 font-sans uppercase text-[9px]">TIME:</span>
            <span className="font-bold">{data.time}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-sans uppercase text-[9px]">LOAD RATE:</span>
            <span className="font-bold text-industrial-accent">{data.value}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-sans uppercase text-[9px]">STATUS:</span>
            <span className="font-bold uppercase" style={{ color: fill }}>{data.load}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function KnowledgeInsights() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{
    is_live: boolean
    document_types: DocTypeItem[]
    topics: TopicItem[]
    total_chunks: number
    indexed_documents: number
    entity_index_size: number
  } | null>(null)

  // Chart interaction states
  const [hoveredDocType, setHoveredDocType] = useState<string | null>(null)
  const [hoveredTopic, setHoveredTopic] = useState<string | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Tooltip interactive state
  const [tooltip, setTooltip] = useState<{
    show: boolean
    x: number
    y: number
    title: string
    count: number
    percentage?: number
    color?: string
    extra?: string
  }>({
    show: false,
    x: 0,
    y: 0,
    title: '',
    count: 0
  })

  const handleTooltipMouseMove = (
    e: React.MouseEvent,
    title: string,
    count: number,
    percentage?: number,
    color?: string,
    extra?: string
  ) => {
    setTooltip({
      show: true,
      x: e.clientX,
      y: e.clientY,
      title,
      count,
      percentage,
      color,
      extra
    })
  }

  const handleTooltipMouseLeave = () => {
    setTooltip(prev => ({ ...prev, show: false }))
  }

  // Filter doc types and topics in real-time
  const filteredDocTypes = useMemo(() => {
    if (!data) return []
    if (!searchQuery.trim()) return data.document_types

    const query = searchQuery.toLowerCase().trim()
    return data.document_types.filter(item => {
      const label = (TYPE_LABEL[item.doc_type] || '').toLowerCase()
      const type = item.doc_type.toLowerCase()
      return label.includes(query) || type.includes(query)
    })
  }, [data, searchQuery])

  const filteredTopics = useMemo(() => {
    if (!data) return []
    if (!searchQuery.trim()) return data.topics

    const query = searchQuery.toLowerCase().trim()
    return data.topics.filter(item => {
      const topicName = item.topic.toLowerCase()
      const keywords = INDUSTRIAL_TOPIC_KEYWORDS[item.topic] || []
      const hasKeywordMatch = keywords.some(kw => kw.toLowerCase().includes(query))
      return topicName.includes(query) || hasKeywordMatch
    })
  }, [data, searchQuery])

  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<string>('')

  const fetchInsights = (silent = false) => {
    if (!silent) {
      setLoading(true)
    } else {
      setIsSyncing(true)
    }
    
    api.getKnowledgeInsights()
      .then((res) => {
        setData({
          is_live: res.is_live,
          document_types: res.document_types,
          topics: res.topics,
          total_chunks: res.total_chunks,
          indexed_documents: res.indexed_documents,
          entity_index_size: res.entity_index_size
        })
        const now = new Date()
        setLastSyncTime(now.toLocaleTimeString())
      })
      .catch((err) => {
        console.error('Failed to load insights data:', err)
      })
      .finally(() => {
        if (!silent) {
          setLoading(false)
        } else {
          // Add a minor cosmetic timeout for isSyncing so the animation remains visible/tactile
          setTimeout(() => setIsSyncing(false), 800)
        }
      })
  }

  useEffect(() => {
    // Initial fetch
    fetchInsights(false)

    // Background polling every 10 seconds to watch for new document index updates
    const pollInterval = setInterval(() => {
      fetchInsights(true)
    }, 10000)

    return () => clearInterval(pollInterval)
  }, [])

  // ==================== D3 CALCULATIONS ====================

  // Dimensions
  const donutWidth = 280
  const donutHeight = 280
  const donutRadius = Math.min(donutWidth, donutHeight) / 2
  const innerRadius = donutRadius - 38
  const outerRadius = donutRadius - 10

  const packWidth = 420
  const packHeight = 300

  // 1. Donut Pie calculations
  const pieData = useMemo(() => {
    if (!data) return []
    const pie = d3.pie<DocTypeItem>()
      .value(d => d.count)
      .sort(null)
    return pie(filteredDocTypes)
  }, [data, filteredDocTypes])

  const totalDocCount = useMemo(() => {
    if (!data) return 0
    return filteredDocTypes.reduce((sum, item) => sum + item.count, 0)
  }, [data, filteredDocTypes])

  const totalTopicCount = useMemo(() => {
    if (!data) return 0
    return filteredTopics.reduce((sum, item) => sum + item.count, 0)
  }, [data, filteredTopics])

  const arcGenerator = useMemo(() => {
    return d3.arc<d3.PieArcDatum<DocTypeItem>>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .cornerRadius(8)
      .padAngle(0.04)
  }, [innerRadius, outerRadius])

  const hoverArcGenerator = useMemo(() => {
    return d3.arc<d3.PieArcDatum<DocTypeItem>>()
      .innerRadius(innerRadius - 4)
      .outerRadius(outerRadius + 8)
      .cornerRadius(8)
      .padAngle(0.04)
  }, [innerRadius, outerRadius])

  // 2. Circle Packing calculations
  const packedNodes = useMemo(() => {
    if (!data || !filteredTopics || filteredTopics.length === 0) return []
    
    const hierarchyData = {
      name: 'root',
      children: filteredTopics.map(t => ({ name: t.topic, count: t.count }))
    }

    const rootNode = d3.hierarchy<any>(hierarchyData)
      .sum(d => d.count || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0))

    const packer = d3.pack<any>()
      .size([packWidth, packHeight])
      .padding(14)

    const packedRoot = packer(rootNode)
    return packedRoot.leaves()
  }, [data, filteredTopics, packWidth, packHeight])

  // Topic Color generator
  const getTopicColor = (index: number) => {
    // Elegant cycling color palette of industrial highlights
    const colors = ['#00f0ff', '#a855f7', '#10b981', '#fbbf24', '#ec4899', '#3b82f6', '#f43f5e', '#14b8a6']
    return colors[index % colors.length]
  }

  if (loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-industrial-950 text-slate-200">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <Layers className="text-industrial-accent animate-spin" size={40} />
          <h2 className="text-sm font-bold tracking-wider font-display uppercase">Parsing Knowledge Topology Map...</h2>
        </div>
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 md:p-8 max-w-5xl mx-auto flex flex-col gap-6 font-sans pb-24"
    >
      {/* Title & Status Block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-industrial-800 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-white font-display flex items-center gap-2">
            <PieChart className="text-industrial-accent glow-text-cyan" size={24} />
            Knowledge Insights
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            A bird's-eye mathematical topology of ingested industrial SOPs, work regulations, and safety manuals.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {lastSyncTime && (
            <div className="hidden md:flex items-center gap-1.5 px-2 py-1 bg-industrial-950/50 border border-industrial-850/60 rounded-lg">
              <span className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-cyan-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
              <span className="text-[9px] font-mono text-slate-400">
                Auto-Sync: {lastSyncTime}
              </span>
            </div>
          )}
          {data && (
            <span className={`px-2.5 py-1.5 rounded-xl border text-[10px] font-mono font-bold uppercase ${
              data.is_live 
                ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-400' 
                : 'bg-amber-950/20 border-amber-900/30 text-amber-400'
            }`}>
              {data.is_live ? '● Grounded Live Library' : '● Baseline Demo Ledger'}
            </span>
          )}
          <button
            onClick={() => fetchInsights(false)}
            disabled={loading || isSyncing}
            className="p-2.5 border border-industrial-800 bg-industrial-900 rounded-xl hover:border-industrial-accent/40 text-slate-400 hover:text-white transition disabled:opacity-50"
            title="Refresh statistics"
          >
            <RefreshCw size={14} className={isSyncing || loading ? 'animate-spin text-industrial-accent' : ''} />
          </button>
        </div>
      </div>

      {/* Bird's Eye Metrics Row */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-industrial-900 border border-industrial-800 rounded-2xl p-5 flex items-center justify-between shadow-md relative overflow-hidden">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Indexed Documents</span>
              <p className="text-3xl font-extrabold text-slate-200 mt-1 font-display">{data.indexed_documents}</p>
            </div>
            <span className="p-3 bg-industrial-950 text-industrial-accent rounded-xl border border-industrial-800">
              <FileText size={20} />
            </span>
          </div>

          <div className="bg-industrial-900 border border-industrial-800 rounded-2xl p-5 flex items-center justify-between shadow-md">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Knowledge Chunks</span>
              <p className="text-3xl font-extrabold text-slate-200 mt-1 font-display">{data.total_chunks}</p>
            </div>
            <span className="p-3 bg-industrial-950 text-industrial-emerald rounded-xl border border-industrial-800">
              <Layers size={20} />
            </span>
          </div>

          <div className="bg-industrial-900 border border-industrial-800 rounded-2xl p-5 flex items-center justify-between shadow-md">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Extracted Entities</span>
              <p className="text-3xl font-extrabold text-slate-200 mt-1 font-display">{data.entity_index_size}</p>
            </div>
            <span className="p-3 bg-industrial-950 text-industrial-purple rounded-xl border border-industrial-800">
              <Network size={20} />
            </span>
          </div>

          <div className="bg-industrial-900 border border-industrial-800 rounded-2xl p-5 flex items-center justify-between shadow-md">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Identified Topics</span>
              <p className="text-3xl font-extrabold text-slate-200 mt-1 font-display">{data.topics.length}</p>
            </div>
            <span className="p-3 bg-industrial-950 text-amber-400 rounded-xl border border-industrial-800">
              <Binary size={20} />
            </span>
          </div>
        </div>
      )}

      {/* Real-time Filter & Query Controller */}
      {data && (
        <div className="bg-industrial-900 border border-industrial-800 rounded-2xl p-5 shadow-lg flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                <Search size={18} className="text-industrial-accent" />
              </span>
              <input
                id="global-knowledge-search"
                type="text"
                placeholder="Search across documents, categories, or specific keywords (e.g., 'LOTO', 'leak', 'boiler', 'manual', 'SOP')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-industrial-950 border border-industrial-850 focus:border-industrial-accent/50 rounded-xl py-3 pl-11 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-industrial-accent/30 transition-all font-sans font-medium"
              />
              {searchQuery && (
                <button
                  id="clear-knowledge-search"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-white transition"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Live Filter Indicator badge */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">FILTER STATUS:</span>
              <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-mono font-bold ${
                searchQuery.trim()
                  ? 'bg-industrial-accent/10 border-industrial-accent/30 text-industrial-accent animate-pulse'
                  : 'bg-industrial-950 border-industrial-850 text-slate-400'
              }`}>
                {searchQuery.trim() 
                  ? `Filtered: ${filteredDocTypes.length} types | ${filteredTopics.length} topics`
                  : 'Full Topology Active'
                }
              </span>
            </div>
          </div>

          {/* Quick-tags for rapid exploration */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[10px] text-slate-500 font-mono font-bold uppercase mr-1">QUICK TAGS:</span>
            {[
              { label: 'SOP', query: 'sop' },
              { label: 'LOTO & Isolation', query: 'loto' },
              { label: 'Bearings & Grease', query: 'bearing' },
              { label: 'Seals & Glands', query: 'seal' },
              { label: 'Vibration & Alignment', query: 'vibration' },
              { label: 'Boilers & Steam', query: 'boiler' },
              { label: 'Compressors', query: 'compressor' },
              { label: 'Pumps & Flow', query: 'pump' },
              { label: 'Regulations', query: 'regulation' }
            ].map((tag) => {
              const isActive = searchQuery.toLowerCase().trim() === tag.query
              return (
                <button
                  key={tag.label}
                  id={`quick-tag-${tag.query}`}
                  onClick={() => setSearchQuery(isActive ? '' : tag.query)}
                  className={`px-3 py-1.5 rounded-lg border text-[10px] font-mono transition-all font-bold ${
                    isActive
                      ? 'bg-industrial-accent/20 border-industrial-accent text-white shadow-sm'
                      : 'bg-industrial-950/40 border-industrial-850 text-slate-400 hover:border-industrial-700 hover:text-white'
                  }`}
                >
                  {tag.label}
                </button>
              )
            })}
            {searchQuery && (
              <button
                id="reset-filter-btn"
                onClick={() => setSearchQuery('')}
                className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-rose-400 hover:text-rose-300 transition"
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main D3 Visualizations Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Document Types Donut - D3 */}
        <div className="lg:col-span-2 bg-industrial-900 border border-industrial-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
              <PieChart size={14} className="text-industrial-accent" />
              Document Categories
            </h3>
            <p className="text-xs text-slate-500 leading-normal mb-6">
              Mathematical distribution of file typologies uploaded within the system's vector database.
            </p>
          </div>

          {/* Donut SVG Element */}
          <div className="flex items-center justify-center relative my-4">
            <svg width={donutWidth} height={donutHeight}>
              <g transform={`translate(${donutWidth / 2}, ${donutHeight / 2})`}>
                {filteredDocTypes.length === 0 && (
                  <circle
                    r={innerRadius + (outerRadius - innerRadius) / 2}
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth={outerRadius - innerRadius}
                    strokeDasharray="4,4"
                  />
                )}
                {pieData.map((slice, idx) => {
                  const type = slice.data.doc_type
                  const isHovered = hoveredDocType === type
                  const color = TYPE_COLORS[type] || '#fff'
                  const count = slice.data.count
                  const percentage = totalDocCount > 0 ? (count / totalDocCount) * 100 : 0
                  const label = TYPE_LABEL[type] || type
                  
                  return (
                    <path
                      key={idx}
                      d={(isHovered ? hoverArcGenerator(slice) : arcGenerator(slice)) || undefined}
                      fill={color}
                      className="transition-all duration-200 cursor-pointer"
                      style={{
                        filter: isHovered ? `drop-shadow(0px 0px 10px ${color}66)` : 'none',
                        opacity: hoveredDocType === null || isHovered ? 1 : 0.4
                      }}
                      onMouseEnter={() => setHoveredDocType(type)}
                      onMouseMove={(e) => handleTooltipMouseMove(e, label, count, percentage, color, `Categorized files indexing under standard operational protocol definitions.`)}
                      onMouseLeave={() => {
                        setHoveredDocType(null)
                        handleTooltipMouseLeave()
                      }}
                    />
                  )
                })}
              </g>
            </svg>

            {/* Dynamic Center Text Details */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <AnimatePresence mode="wait">
                {filteredDocTypes.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center px-4"
                  >
                    <span className="text-[10px] text-amber-500/80 font-bold uppercase font-mono mb-1">No Matches</span>
                    <span className="text-[10px] text-slate-500 font-semibold max-w-[120px] leading-normal">Try adjusting search term</span>
                  </motion.div>
                ) : hoveredDocType ? (
                  <motion.div
                    key={hoveredDocType}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-col items-center px-6"
                  >
                    <span 
                      className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mb-1"
                      style={{ 
                        backgroundColor: `${TYPE_COLORS[hoveredDocType]}20`, 
                        color: TYPE_COLORS[hoveredDocType] 
                      }}
                    >
                      {TYPE_LABEL[hoveredDocType] || hoveredDocType}
                    </span>
                    <span className="text-2xl font-black text-white font-display">
                      {filteredDocTypes.find(d => d.doc_type === hoveredDocType)?.count || 0}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold font-mono">
                      {(((filteredDocTypes.find(d => d.doc_type === hoveredDocType)?.count || 0) / totalDocCount) * 100).toFixed(1)}%
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="total"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center"
                  >
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">Total Library</span>
                    <span className="text-3xl font-black text-slate-200 font-display">{totalDocCount}</span>
                    <span className="text-[10px] text-slate-500 font-semibold font-mono">Files Logged</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Legend Grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 mt-4 pt-4 border-t border-industrial-800/50">
            {filteredDocTypes.length === 0 && (
              <div className="col-span-2 text-center text-[10px] text-slate-600 font-mono py-2">
                No matching categories found
              </div>
            )}
            {filteredDocTypes.map((item) => {
              const color = TYPE_COLORS[item.doc_type] || '#fff'
              const label = TYPE_LABEL[item.doc_type] || item.doc_type
              const isHovered = hoveredDocType === item.doc_type
              const percentage = totalDocCount > 0 ? (item.count / totalDocCount) * 100 : 0
              
              return (
                <div
                  key={item.doc_type}
                  className={`flex items-center gap-2 transition-all cursor-pointer ${
                    isHovered ? 'scale-102 font-bold text-white' : 'text-slate-400'
                  }`}
                  onMouseEnter={() => setHoveredDocType(item.doc_type)}
                  onMouseMove={(e) => handleTooltipMouseMove(e, label, item.count, percentage, color, `Categorized files indexing under standard operational protocol definitions.`)}
                  onMouseLeave={() => {
                    setHoveredDocType(null)
                    handleTooltipMouseLeave()
                  }}
                >
                  <span 
                    className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform" 
                    style={{ 
                      backgroundColor: color,
                      boxShadow: isHovered ? `0 0 8px ${color}` : 'none'
                    }} 
                  />
                  <div className="min-w-0 flex-1 flex items-baseline justify-between gap-1">
                    <span className="text-[10px] truncate">{label}</span>
                    <span className="text-[10px] font-mono text-slate-600 shrink-0">({item.count})</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Packed Bubble Chart of Key Topics - D3 */}
        <div className="lg:col-span-3 bg-industrial-900 border border-industrial-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
              <Binary size={14} className="text-industrial-purple" />
              Dynamic Operational Topics
            </h3>
            <p className="text-xs text-slate-500 leading-normal mb-5">
              Visual weight representation of core domains classified dynamically based on semantic chunk frequencies.
            </p>
          </div>

          {/* D3 Packed Circle Canvas */}
          <div className="flex items-center justify-center relative min-h-[300px] border border-industrial-800/40 bg-industrial-950/30 rounded-xl overflow-hidden p-2">
            {filteredTopics.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-industrial-950/40">
                <Database className="text-slate-600 mb-2 animate-bounce" size={28} />
                <h4 className="text-xs font-bold text-slate-400 font-display uppercase tracking-wider">No Topic Matches</h4>
                <p className="text-[10px] text-slate-500 mt-1 max-w-[260px] leading-normal">
                  No operational domains match the filter keyword. Select a quick tag or reset search query.
                </p>
                <button
                  id="reset-empty-search-btn"
                  onClick={() => setSearchQuery('')}
                  className="mt-3 px-3 py-1.5 text-[9px] font-mono font-bold uppercase bg-industrial-900 border border-industrial-850 hover:border-industrial-accent/50 text-slate-300 rounded-lg transition"
                >
                  Reset Filter
                </button>
              </div>
            ) : (
              <svg width="100%" height="100%" viewBox={`0 0 ${packWidth} ${packHeight}`} className="max-w-full select-none">
                {/* Draw Connections/Halos for hovered or selected nodes */}
                {packedNodes.map((node, i) => {
                  const topicName = node.data.name
                  const isHovered = hoveredTopic === topicName
                  const isSelected = selectedTopic === topicName
                  const color = getTopicColor(i)

                  if (!isHovered && !isSelected) return null

                  return (
                    <circle
                      key={`halo-${i}`}
                      cx={node.x}
                      cy={node.y}
                      r={node.r + 8}
                      fill="none"
                      stroke={color}
                      strokeWidth={2}
                      strokeDasharray={isHovered ? "4,4" : "none"}
                      opacity={isHovered ? 0.3 : 0.6}
                      className="transition-all duration-300 animate-pulse"
                    />
                  )
                })}

                {/* Draw Topic Nodes */}
                {packedNodes.map((node, i) => {
                  const topicName = node.data.name
                  const isHovered = hoveredTopic === topicName
                  const isSelected = selectedTopic === topicName
                  const color = getTopicColor(i)
                  const radius = node.r
                  const count = node.data.count || 0
                  const percentage = totalTopicCount > 0 ? (count / totalTopicCount) * 100 : 0
                  const keywords = (INDUSTRIAL_TOPIC_KEYWORDS[topicName] || []).join(', ')

                  return (
                    <g
                      key={`node-${i}`}
                      transform={`translate(${node.x}, ${node.y})`}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredTopic(topicName)}
                      onMouseMove={(e) => handleTooltipMouseMove(e, topicName, count, percentage, color, keywords)}
                      onMouseLeave={() => {
                        setHoveredTopic(null)
                        handleTooltipMouseLeave()
                      }}
                      onClick={() => {
                        setSelectedTopic(selectedTopic === topicName ? null : topicName)
                      }}
                    >
                      <circle
                        r={radius}
                        fill={color}
                        opacity={hoveredTopic === null || isHovered ? 0.12 : 0.04}
                        stroke={color}
                        strokeWidth={isHovered || isSelected ? 2.5 : 1.2}
                        className="transition-all duration-300"
                      />

                      {/* Center point core */}
                      <circle r={3} fill={color} opacity={0.8} />

                      {/* Label */}
                      {radius > 22 && (
                        <text
                          dy="3"
                          textAnchor="middle"
                          fontSize={radius > 45 ? 10 : 8}
                          fontFamily="Space Grotesk"
                          fontWeight="bold"
                          fill={isHovered || isSelected ? '#ffffff' : '#94a3b8'}
                          className="pointer-events-none transition-all duration-200 select-none"
                        >
                          {topicName.split(' ')[0]}
                        </text>
                      )}
                    </g>
                  )
                })}
              </svg>
            )}

            {/* Bubble Chart Hover Info Overlay */}
            <div className="absolute top-3.5 right-3.5 pointer-events-none">
              <span className="flex items-center gap-1.5 bg-industrial-900 border border-industrial-800 px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold text-slate-400">
                <Sparkles size={11} className="text-industrial-purple animate-pulse" />
                <span>INTERACTIVE MAP</span>
              </span>
            </div>
          </div>

          {/* Dynamic interactive info text */}
          <div className="text-[11px] text-slate-400 text-center mt-3 font-semibold h-4">
            {hoveredTopic ? (
              <span>Topic: <code className="text-white font-bold font-mono">{hoveredTopic}</code> has <code className="text-industrial-accent font-mono">{filteredTopics.find(t => t.topic === hoveredTopic)?.count || 0}</code> matched content chunks</span>
            ) : selectedTopic ? (
              <span>Active Selection: <code className="text-industrial-accent font-bold font-mono">{selectedTopic}</code>. Click again to clear.</span>
            ) : (
              <span className="text-slate-500">Hover or click a bubble to analyze localized RAG vector density metrics</span>
            )}
          </div>
        </div>
      </div>

      {/* Real-time System Performance & Telemetry Heatmap */}
      <div className="bg-industrial-900 border border-industrial-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-industrial-800 pb-4 mb-5 gap-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Cpu className="text-industrial-accent animate-pulse" size={15} />
              Knowledge Server Telemetry & Load Matrix
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 font-sans leading-relaxed">
              Real-time resource utilization across the OpsBrain AI engine nodes. High-intensity semantic resolutions are clustered to monitor Graph-RAG latency performance.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[9px] font-mono font-bold shrink-0">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>LOW (&lt;40%)</span>
            </div>
            <div className="flex items-center gap-1.5 text-purple-400">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              <span>MEDIUM (41-65%)</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>HIGH (66-85%)</span>
            </div>
            <div className="flex items-center gap-1.5 text-red-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span>CRITICAL (&gt;85%)</span>
            </div>
          </div>
        </div>

        <div className="h-64 w-full bg-industrial-950/30 border border-industrial-800/40 rounded-xl p-3">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 15, right: 15, bottom: 5, left: 15 }}>
              <XAxis
                type="number"
                dataKey="x"
                name="time"
                domain={[0, 11]}
                tickFormatter={(val) => HEATMAP_TIMES[val]}
                ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]}
                stroke="#475569"
                fontSize={9}
                fontFamily="JetBrains Mono"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="node"
                domain={[-0.5, 3.5]}
                tickFormatter={(val) => HEATMAP_NODES[val] || ''}
                ticks={[0, 1, 2, 3]}
                stroke="#475569"
                fontSize={9}
                fontFamily="JetBrains Mono"
                tickLine={false}
                axisLine={false}
              />
              <ZAxis type="number" dataKey="value" range={[100, 100]} />
              <Tooltip content={<CustomHeatmapTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#1d2b3e' }} />
              <Scatter data={HEATMAP_DATA} shape={renderCustomCell} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Topics & Grounded Keywords Log */}
      {data && (
        <div className="bg-industrial-900 border border-industrial-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-industrial-800 pb-4 mb-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Database className="text-industrial-accent" size={15} />
              Semantic Ingestion Vocabulary Mapping
            </h3>
            <span className="text-[10px] font-mono bg-industrial-950 px-2.5 py-1 rounded-md text-slate-500 border border-industrial-850">
              IDF Semantic Anchors
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTopics.map((t, index) => {
              const isSelected = selectedTopic === t.topic
              const keywords = INDUSTRIAL_TOPIC_KEYWORDS[t.topic] || []
              const color = getTopicColor(index)
              
              return (
                <div
                  key={t.topic}
                  onClick={() => setSelectedTopic(selectedTopic === t.topic ? null : t.topic)}
                  className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                    isSelected 
                      ? 'bg-industrial-950 border-industrial-accent/40 shadow-inner' 
                      : 'bg-industrial-900/40 border-industrial-850 hover:border-industrial-800 hover:bg-industrial-900'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: color }} 
                      />
                      <h4 className="text-xs font-bold text-slate-200">{t.topic}</h4>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 bg-industrial-950 px-2 py-0.5 rounded border border-industrial-850 font-bold">
                      {t.count} Chunks
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-500 leading-normal mb-2">
                    Our AI models index content to this node when these key structural terms are identified:
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {keywords.map(kw => (
                      <span 
                        key={kw}
                        className="text-[9px] font-mono bg-industrial-950 border border-industrial-800 px-2 py-0.5 rounded text-slate-400"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Interactive Cyber Floating Tooltip */}
      <AnimatePresence>
        {tooltip.show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="pointer-events-none fixed z-50 min-w-[200px] bg-industrial-950/95 border border-industrial-800 backdrop-blur-md rounded-xl p-3.5 shadow-[0_12px_40px_rgba(0,0,0,0.7)] font-mono text-[10px] leading-normal"
            style={{
              left: tooltip.x + 220 > window.innerWidth ? tooltip.x - 220 : tooltip.x + 16,
              top: tooltip.y + 150 > window.innerHeight ? tooltip.y - 140 : tooltip.y + 16,
            }}
          >
            <div className="flex items-center gap-2 border-b border-industrial-800/60 pb-2 mb-2">
              {tooltip.color && (
                <span 
                  className="w-2.5 h-2.5 rounded-full shrink-0" 
                  style={{ 
                    backgroundColor: tooltip.color,
                    boxShadow: `0 0 10px ${tooltip.color}`
                  }} 
                />
              )}
              <span className="font-bold text-white tracking-tight text-xs font-display truncate max-w-[150px]">
                {tooltip.title}
              </span>
            </div>
            
            <div className="flex flex-col gap-1.5 text-slate-300">
              <div className="flex justify-between items-center gap-3">
                <span className="text-slate-500 font-medium font-mono uppercase text-[9px]">Matched Nodes:</span>
                <span className="font-bold text-slate-100 font-mono text-xs">{tooltip.count}</span>
              </div>
              
              {tooltip.percentage !== undefined && (
                <div className="flex justify-between items-center gap-3">
                  <span className="text-slate-500 font-medium font-mono uppercase text-[9px]">Distribution:</span>
                  <span className="font-bold text-industrial-accent font-mono text-xs">
                    {tooltip.percentage.toFixed(1)}%
                  </span>
                </div>
              )}

              {tooltip.extra && (
                <div className="mt-2 border-t border-industrial-800/40 pt-2">
                  <span className="text-[8px] text-slate-500 block mb-1 uppercase font-bold font-mono">Matched Anchors:</span>
                  <p className="text-[9px] text-slate-400 font-sans leading-relaxed italic max-w-[180px]">
                    {tooltip.extra}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
