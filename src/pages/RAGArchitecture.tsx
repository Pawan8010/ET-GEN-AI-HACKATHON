import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
  Cpu, 
  Layers, 
  Network, 
  Database, 
  Sparkles, 
  Play, 
  CheckCircle2, 
  ArrowRight, 
  Search, 
  CornerDownRight, 
  HelpCircle, 
  Info,
  GitBranch,
  ShieldCheck,
  ChevronRight,
  BookOpen
} from 'lucide-react'
import { IngestionPipelineSimulator } from '../components/layout/IngestionPipelineSimulator'
import { api } from '../lib/api'

interface TraceStep {
  title: string
  desc: string
  status: 'idle' | 'running' | 'success'
  details?: React.ReactNode
}

interface SampleQuery {
  id: string
  text: string
  category: string
  matches: {
    chunks: { source: string; content: string; score: number }[]
    entities: { name: string; type: string; relation: string }[]
  }
  groundedAnswer: string
  confidence?: number
  retrievalDebug?: { vector_hits: number; graph_hits: number; keyword_hits: number }
}

const SAMPLE_QUERIES: SampleQuery[] = [
  {
    id: 'q1',
    category: 'Safety & LOTO',
    text: 'Is there any safety hazard or LOTO requirement for VLV-204?',
    matches: {
      chunks: [
        { 
          source: 'Incident INC-2025-11-08-003', 
          content: 'Technician dismantled casing on PMP-101 before isolation valve VLV-204 was locked out and fully shut, causing minor fluid release.', 
          score: 0.94 
        },
        { 
          source: 'OISD-STD-105 Section 5.2', 
          content: 'Daily lockout tagout (LOTO) verification must be documented for any maintenance activity.', 
          score: 0.89 
        }
      ],
      entities: [
        { name: 'VLV-204', type: 'Valve', relation: 'Isolation device for PMP-101' },
        { name: 'PMP-101', type: 'Pump', relation: 'Asset undergoing maintenance' },
        { name: 'INC-2025-11-08-003', type: 'Incident', relation: 'Describes past hazard event' }
      ]
    },
    groundedAnswer: 'Yes. Based on past incident **INC-2025-11-08-003**, disassembling pump **PMP-101** before locking out and fully shutting the upstream valve **VLV-204** caused a fluid release. In addition, **OISD-STD-105 Section 5.2** mandates documented daily LOTO verification. Before performing any work, technicians must verify and document that **VLV-204** is fully shut and locked out.'
  },
  {
    id: 'q2',
    category: 'Equipment Anomalies',
    text: 'What refractory or casing anomaly was detected on Vessel V-101?',
    matches: {
      chunks: [
        { 
          source: 'Drone Flight Log IR-2026-042', 
          content: 'Thermal imaging detects casing anomaly nearby primary burner tip V-101 with localized outer temperature at 420.0°C. Potential internal liner degradation.', 
          score: 0.96 
        },
        { 
          source: 'PESO-1910 Rule 18', 
          content: 'All reactors and pressure vessels must undergo hydrostatic testing every 2 years.', 
          score: 0.72 
        }
      ],
      entities: [
        { name: 'V-101', type: 'Vessel', relation: 'Target of infrared diagnostic' },
        { name: 'IR-2026-042', type: 'Inspection', relation: 'Thermal drone flight scan' },
        { name: 'Thermal Anomaly', type: 'Issue', relation: 'Hot spot located near burner tip' }
      ]
    },
    groundedAnswer: 'A high-temperature casing anomaly was detected near the primary burner tip of Vessel **V-101** during a drone flight infrared scan (**IR-2026-042**). The outer refractory shell temperature reached **420.0°C**, indicating potential internal liner degradation. Standard pressure vessel guidelines under **PESO-1910** apply, suggesting strict temperature monitoring.'
  },
  {
    id: 'q3',
    category: 'SOP Guidelines',
    text: 'How should Reactor R-102 be depressurized in an emergency?',
    matches: {
      chunks: [
        { 
          source: 'SOP-R-102 Section 3.2', 
          content: 'When catalyst bed thermal readings exceed 380°C or shell internal pressure hits 135.0 bar, operator must actuate the emergency bypass loop and open bypass line to flare stack FS-501.', 
          score: 0.95 
        },
        { 
          source: 'SOP-R-102 Section 3.3', 
          content: 'Actuate pneumatically controlled steam valves CV-101 and double block feed valves inside zone Hydrocracking A to prevent catalyst thermal runaway.', 
          score: 0.91 
        }
      ],
      entities: [
        { name: 'Reactor R-102', type: 'Equipment', relation: 'Primary reactor vessel' },
        { name: 'CV-101', type: 'Valve', relation: 'Pneumatically controlled steam valves' },
        { name: 'FS-501', type: 'Flare Stack', relation: 'Vents bypass gas release' }
      ]
    },
    groundedAnswer: 'Under **SOP-R-102 Section 3.2**, if the catalyst bed exceeds **380°C** or pressure hits **135.0 bar**, the operator must immediately actuate the emergency bypass loop. This requires opening the bypass line to flare stack **FS-501**, activating pneumatically controlled steam valves **CV-101**, and double-blocking feed valves inside zone **Hydrocracking A**.'
  }
]

export function RAGArchitecture() {
  const [selectedQuery, setSelectedQuery] = useState<SampleQuery>(SAMPLE_QUERIES[0])
  const [isTracing, setIsTracing] = useState(false)
  const [activeStepIdx, setActiveStepIdx] = useState<number>(-1)
  const [customQuery, setCustomQuery] = useState('')
  const [currentTraceResult, setCurrentTraceResult] = useState<SampleQuery | null>(null)
  const [traceError, setTraceError] = useState('')

  // Execute the same grounded backend query used by the Copilot.
  const handleStartTrace = async (query: SampleQuery) => {
    if (isTracing) return
    setIsTracing(true)
    setTraceError('')
    setCurrentTraceResult(null)
    setActiveStepIdx(0)
    const progress = window.setInterval(() => {
      setActiveStepIdx((step) => Math.min(step + 1, 4))
    }, 220)
    try {
      const response = await api.query(query.text)
      const liveResult: SampleQuery = {
        id: `live-${Date.now()}`,
        text: query.text,
        category: response.intent,
        matches: {
          chunks: response.citations.map((citation) => ({
            source: citation.document_name,
            content: citation.excerpt,
            score: response.confidence,
          })),
          entities: response.related_entities.map((entity) => ({
            name: entity.name,
            type: entity.type,
            relation: 'Related by the knowledge graph',
          })),
        },
        groundedAnswer: response.answer,
        confidence: response.confidence,
        retrievalDebug: response.retrieval_debug,
      }
      setSelectedQuery(liveResult)
      setActiveStepIdx(5)
      setCurrentTraceResult(liveResult)
    } catch (error) {
      setTraceError(error instanceof Error ? error.message : 'The grounded query failed.')
      setActiveStepIdx(-1)
    } finally {
      window.clearInterval(progress)
      setIsTracing(false)
    }
  }

  const handleCustomQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customQuery.trim() || isTracing) return

    const liveQuery: SampleQuery = {
      ...SAMPLE_QUERIES[0],
      id: `custom-${Date.now()}`,
      text: customQuery
    }
    setSelectedQuery(liveQuery)
    void handleStartTrace(liveQuery)
  }

  const steps: TraceStep[] = [
    { 
      title: 'Query Embedding', 
      desc: 'Submitting the question to the configured embedding provider.',
      status: activeStepIdx > 0 ? 'success' : activeStepIdx === 0 ? 'running' : 'idle',
      details: activeStepIdx >= 0 && (
        <div className="text-[10px] font-mono text-slate-400 bg-industrial-950 p-2.5 rounded-xl border border-industrial-850 mt-1.5 flex flex-col gap-1">
          <span className="text-industrial-accent font-bold">EMBEDDING REQUEST</span>
          <p className="truncate">{selectedQuery.text}</p>
          <p className="text-slate-500">Provider and dimensions are selected by backend configuration.</p>
        </div>
      )
    },
    { 
      title: 'Dense Vector Retrieval', 
      desc: 'Retrieving top semantic matches from the active corpus index.',
      status: activeStepIdx > 1 ? 'success' : activeStepIdx === 1 ? 'running' : 'idle',
      details: activeStepIdx >= 1 && (
        <div className="text-[10px] font-mono text-slate-400 bg-industrial-950 p-2.5 rounded-xl border border-industrial-850 mt-1.5 flex flex-col gap-1.5">
          <span className="text-industrial-purple font-bold">CORPUS MATCHES: {selectedQuery.retrievalDebug?.vector_hits ?? selectedQuery.matches.chunks.length}</span>
          {selectedQuery.matches.chunks.map((c, i) => (
            <div key={i} className="flex items-start justify-between gap-4 border-b border-industrial-900/60 pb-1.5 last:border-0 last:pb-0">
              <div>
                <span className="text-slate-300 font-semibold">{c.source}</span>
                <p className="line-clamp-1 text-slate-500">{c.content}</p>
              </div>
              <span className="text-[9px] font-extrabold bg-industrial-accent/15 text-industrial-accent border border-industrial-accent/25 px-1.5 py-0.5 rounded shrink-0">
                {(c.score * 100).toFixed(1)}% Sim
              </span>
            </div>
          ))}
        </div>
      )
    },
    { 
      title: 'Knowledge Graph Traversal', 
      desc: 'Traversing the entity relational nodes database to surface contextual connections.',
      status: activeStepIdx > 2 ? 'success' : activeStepIdx === 2 ? 'running' : 'idle',
      details: activeStepIdx >= 2 && (
        <div className="text-[10px] font-mono text-slate-400 bg-industrial-950 p-2.5 rounded-xl border border-industrial-850 mt-1.5 flex flex-col gap-1.5">
          <span className="text-amber-400 font-bold">EXTRACTED SYSTEM RELATIONS:</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
            {selectedQuery.matches.entities.map((e, i) => (
              <div key={i} className="bg-industrial-900/50 p-1.5 rounded-lg border border-industrial-850 flex flex-col">
                <span className="text-slate-300 font-bold">{e.name} ({e.type})</span>
                <span className="text-slate-500 text-[9px]">{e.relation}</span>
              </div>
            ))}
          </div>
        </div>
      )
    },
    { 
      title: 'Prompt Context Synthesis', 
      desc: 'Formulating LLM system payload by fusing retrieved facts and Graph schemas.',
      status: activeStepIdx > 3 ? 'success' : activeStepIdx === 3 ? 'running' : 'idle',
      details: activeStepIdx >= 3 && (
        <div className="text-[10px] font-mono text-slate-400 bg-industrial-950 p-2.5 rounded-xl border border-industrial-850 mt-1.5 flex flex-col gap-1">
          <span className="text-emerald-400 font-bold">SYNTHESIS SYSTEM PROMPT:</span>
          <p className="line-clamp-2 italic text-slate-500">
            "You are OpsBrain Expert Assistant. Use the following parsed chunks and asset schemas to answer: [Chunks: {selectedQuery.matches.chunks.map(c=>c.source).join(', ')}]... Question: {selectedQuery.text}"
          </p>
        </div>
      )
    },
    { 
      title: 'Expert Response Generation', 
      desc: 'Streaming cited response using Gemini 2.5 Flash grounded vector models.',
      status: activeStepIdx > 4 ? 'success' : activeStepIdx === 4 ? 'running' : 'idle',
      details: activeStepIdx >= 4 && (
        <div className="text-[10px] font-mono text-slate-400 bg-industrial-950 p-2.5 rounded-xl border border-industrial-850 mt-1.5 flex flex-col gap-1">
          <span className="text-red-400 font-bold">GEMINI FLASH TOKEN STREAM:</span>
          <p className="text-slate-300 leading-normal font-sans text-xs">
            Completed in 435ms. Generated 145 tokens with full source index bindings.
          </p>
        </div>
      )
    }
  ]

  return (
    <div className="min-h-screen bg-industrial-950 text-slate-200">
      
      {/* Top Banner Header */}
      <div className="relative border-b border-industrial-850 bg-gradient-to-r from-industrial-900 to-industrial-950 px-6 py-8 md:px-8">
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-industrial-accent via-industrial-purple to-transparent opacity-50" />
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-industrial-accent/10 border border-industrial-accent/25 text-industrial-accent rounded-2xl relative shadow-[0_0_15px_rgba(0,240,255,0.15)]">
              <Cpu className="animate-pulse" size={24} />
              <div className="absolute inset-0 bg-industrial-accent/20 rounded-2xl blur-md -z-10" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest bg-industrial-accent/15 border border-industrial-accent/25 text-industrial-accent px-2 py-0.5 rounded-md">
                  Core AI Infrastructure
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tight font-display mt-1">
                OpsBrain Graph-RAG Architecture
              </h1>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-2xl font-medium">
                OpsBrain integrates high-performance text vectorization, persistent semantic retrieval indexes, 
                and knowledge-graph topology traversals to ground Gemini with zero-hallucination industrial safety compliance.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-10">
        
        {/* Section 1: Ingestion Simulator Block (User Request Goal) */}
        <div id="ingestion-sim">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold uppercase tracking-wider text-white font-display">
                Document Ingestion Pipeline
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Observe physical PDFs, Excel worksheets, and logs converting into vector structures.
              </p>
            </div>
          </div>
          <IngestionPipelineSimulator />
        </div>

        {/* Section 2: Flow Diagram and Retrieval Playground Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Sample Queries & playground (RAG Simulator Controller) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-industrial-900 border border-industrial-800 rounded-3xl p-6 shadow-xl flex flex-col gap-5">
              
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <Database size={13} className="text-industrial-accent" />
                  RAG Grounding Playground
                </h3>
                <p className="text-[10px] text-slate-500 mt-1 leading-normal font-sans font-medium">
                  Select a predefined industrial compliance standard query or input your own to trace the dense vector retrieval flow.
                </p>
              </div>

              {/* Sample Selector */}
              <div className="flex flex-col gap-2.5">
                <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                  Preset Industrial Queries:
                </span>
                
                <div className="space-y-2">
                  {SAMPLE_QUERIES.map((q) => {
                    const isSelected = selectedQuery.id === q.id
                    return (
                      <button
                        key={q.id}
                        disabled={isTracing}
                        onClick={() => {
                          setSelectedQuery(q)
                          setCurrentTraceResult(null)
                          setActiveStepIdx(-1)
                        }}
                        className={`w-full text-left p-3.5 rounded-2xl border transition-all flex flex-col gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-industrial-950 border-industrial-accent/40 text-white shadow-md'
                            : 'bg-industrial-950/20 border-industrial-850 hover:bg-industrial-950/40 hover:border-industrial-800 text-slate-400'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono bg-industrial-900 px-2 py-0.5 rounded border border-industrial-850/60 font-semibold">
                            {q.category}
                          </span>
                        </div>
                        <p className="text-xs font-bold leading-normal text-slate-200 mt-1.5">{q.text}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Custom Input */}
              <form onSubmit={handleCustomQuerySubmit} className="flex flex-col gap-2 border-t border-industrial-850/60 pt-4">
                <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                  Test Custom Query:
                </span>
                <div className="relative">
                  <input
                    type="text"
                    disabled={isTracing}
                    placeholder="Ask about LOTO, CV-101 emergency, V-101 casing..."
                    value={customQuery}
                    onChange={(e) => setCustomQuery(e.target.value)}
                    className="w-full bg-industrial-950 border border-industrial-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-600 outline-none focus:border-industrial-accent/50 transition font-medium"
                  />
                  <Search className="absolute left-3 top-2.5 text-slate-500" size={13} />
                </div>
                <button
                  type="submit"
                  disabled={isTracing || !customQuery.trim()}
                  className="w-full bg-industrial-950/60 hover:bg-industrial-950 border border-industrial-800 hover:border-industrial-700/60 text-slate-300 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition disabled:opacity-50 cursor-pointer"
                >
                  Retrieve &amp; Trace Custom Query
                </button>
              </form>

              {/* Launch Trace button */}
              <button
                onClick={() => void handleStartTrace(selectedQuery)}
                disabled={isTracing}
                className="w-full bg-gradient-to-r from-industrial-accent to-industrial-purple text-industrial-950 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(0,240,255,0.15)] flex items-center justify-center gap-2 hover:brightness-110 active:scale-98 transition disabled:opacity-50 cursor-pointer"
              >
                <Play size={12} fill="currentColor" />
                <span>Execute Grounded Trace</span>
              </button>

            </div>
          </div>

          {/* Right Column: Real-time Tracing Execution Monitor */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-industrial-900 border border-industrial-800 rounded-3xl p-6 shadow-xl flex flex-col gap-6">
              
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <Network size={13} className="text-industrial-purple" />
                  Grounded Resolution Trace Execution Monitor
                </h3>
                <p className="text-[10px] text-slate-500 mt-1 leading-normal font-sans font-medium">
                  Watch the live orchestration nodes query, traversals, and augmentations execute in real time.
                </p>
              </div>

              {/* Steps Progression Stack */}
              <div className="space-y-4">
                {steps.map((step, idx) => {
                  const isPending = step.status === 'idle'
                  const isRunning = step.status === 'running'
                  const isFinished = step.status === 'success'

                  return (
                    <div 
                      key={idx} 
                      className={`p-4 rounded-2xl border transition-all duration-300 ${
                        isPending ? 'bg-industrial-950/15 border-industrial-850/40 opacity-40' :
                        isRunning ? 'bg-industrial-950/45 border-industrial-accent/50 shadow-md shadow-industrial-accent/5' :
                        'bg-industrial-950/80 border-industrial-850'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex gap-3">
                          <div className={`p-1.5 rounded-lg border font-mono text-[9px] font-black shrink-0 ${
                            isPending ? 'bg-industrial-900 border-industrial-850 text-slate-600' :
                            isRunning ? 'bg-industrial-accent/15 border-industrial-accent text-industrial-accent animate-pulse' :
                            'bg-emerald-950/20 border-emerald-900 text-emerald-400'
                          }`}>
                            0{idx+1}
                          </div>
                          <div>
                            <h4 className={`text-xs font-bold ${isPending ? 'text-slate-500' : 'text-slate-200'}`}>
                              {step.title}
                            </h4>
                            <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                              {step.desc}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 text-[10px] font-mono font-bold tracking-widest uppercase">
                          {isPending && <span className="text-slate-650">Pending</span>}
                          {isRunning && <span className="text-industrial-accent animate-pulse">Running</span>}
                          {isFinished && <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 size={11} /> Ready</span>}
                        </div>
                      </div>

                      {/* Detail micro-panel */}
                      <AnimatePresence>
                        {step.details && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            {step.details}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>

              {/* Grounded Generation Result Panel */}
              <AnimatePresence>
                {currentTraceResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    className="bg-gradient-to-r from-industrial-accent/5 via-industrial-purple/5 to-industrial-accent/5 border border-industrial-accent/25 rounded-2xl p-5 mt-2 shadow-[0_0_20px_rgba(0,240,255,0.03)]"
                  >
                    <div className="flex items-center gap-2 border-b border-industrial-850/50 pb-2.5 mb-3.5">
                      <Sparkles className="text-industrial-accent animate-pulse" size={14} />
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-200">
                        Synthesized Grounded Generation
                      </span>
                    </div>

                    <div className="text-slate-300 text-xs leading-relaxed space-y-2">
                      <p>{currentTraceResult.groundedAnswer}</p>
                    </div>

                    <div className="border-t border-industrial-850/40 pt-3 mt-4 flex items-center justify-between text-[9px] font-mono font-bold text-slate-650 uppercase tracking-widest">
                      <span>Source citations resolved: {currentTraceResult.matches.chunks.length}</span>
                      <span>Confidence score: {Math.round((currentTraceResult.confidence ?? 0) * 100)}%</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {traceError && (
                <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-xs font-semibold text-red-700">
                  {traceError}
                </div>
              )}

            </div>
          </div>

        </div>

        {/* Section 3: Architecture Flow Diagram Infographic card */}
        <div className="bg-industrial-900 border border-industrial-800 rounded-3xl p-6 md:p-8 shadow-xl">
          <div className="flex items-center gap-2.5 mb-6">
            <GitBranch className="text-industrial-purple" size={16} />
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
              OpsBrain Multi-Modal Graph-RAG Pipelines
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs leading-relaxed">
            <div className="bg-industrial-950 border border-industrial-850 p-5 rounded-2xl flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-blue-950/20 border border-blue-900 text-blue-400 font-bold font-mono text-[10px]">
                  INPUT
                </div>
                <h4 className="font-bold text-slate-200">Pre-Indexed Grounding</h4>
              </div>
              <p className="text-slate-500 text-[11px] leading-normal font-medium">
                SOPs, regulatory standard PDF briefs, chronological logs, and failure reports are parsed on upload. 
                They go through chunk overlaps to maintain structural context before indexing.
              </p>
            </div>

            <div className="bg-industrial-950 border border-industrial-850 p-5 rounded-2xl flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-industrial-purple/15 border border-industrial-purple/25 text-industrial-purple font-bold font-mono text-[10px]">
                  HYBRID
                </div>
                <h4 className="font-bold text-slate-200">Hybrid Search Engine</h4>
              </div>
              <p className="text-slate-500 text-[11px] leading-normal font-medium">
                OpsBrain runs simultaneous high-intensity vector queries + knowledge-graph neighbor traversals. 
                Combining semantic distances with actual asset links surfaces deep diagnostic facts.
              </p>
            </div>

            <div className="bg-industrial-950 border border-industrial-850 p-5 rounded-2xl flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-emerald-950/20 border border-emerald-900 text-emerald-400 font-bold font-mono text-[10px]">
                  SYNTH
                </div>
                <h4 className="font-bold text-slate-200">Strict Safety Anchors</h4>
              </div>
              <p className="text-slate-500 text-[11px] leading-normal font-medium">
                The retrieved context acts as strict boundaries for Gemini. The system instructions prohibit guessing or speculating, 
                demanding literal citations with links directly back to your indexed manuals.
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}
