import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
  FileText, 
  Cpu, 
  Layers, 
  Network, 
  Share2, 
  MessageSquare, 
  Wrench, 
  Activity, 
  Play, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  CornerDownRight, 
  Info,
  ExternalLink,
  Table,
  Eye,
  Settings,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { Link } from 'react-router-dom'

interface PipelineDoc {
  id: string
  title: string
  type: 'manual' | 'inspection' | 'work_order'
  typeLabel: string
  sourceFilename: string
  size: string
  rawContent: string
  chunks: { id: string; header: string; text: string; tags: string[] }[]
  tags: string[]
  graphNodes: string[]
  graphEdges: { from: string; to: string; label: string }[]
}

const PIPELINE_DOCS: PipelineDoc[] = [
  {
    id: 'doc-sop',
    title: 'Reactor Bed Emergency Venting SOP (SOP-R-102)',
    type: 'manual',
    typeLabel: 'PDF Manual',
    sourceFilename: 'SOP-R102-VENTING-REV4.pdf',
    size: '1.4 MB',
    rawContent: 'SECTION 3.2: EMERGENCY INLET OVERPRESSURE DEPRESSURIZATION SYSTEM. When catalyst bed thermal readings exceed 380°C or shell internal pressure hits 135.0 bar, operator must actuate the emergency bypass loop. Actuate pneumatically controlled steam valves CV-101 and open bypass line to flare stack FS-501. Double block feed valves inside zone Hydrocracking A to prevent catalyst thermal runaway. Refer to OSHA 1910.119 Process Safety Management protocols.',
    chunks: [
      {
        id: 'chunk-sop-1',
        header: 'SECTION 3.2: Emergency Inlet Depressurization',
        text: 'When catalyst bed thermal readings exceed 380°C or shell internal pressure hits 135.0 bar, operator must actuate the emergency bypass loop.',
        tags: ['OSHA 1910.119', 'R-102', 'Venting']
      },
      {
        id: 'chunk-sop-2',
        header: 'Bypass Control Valves Actuation',
        text: 'Actuate pneumatically controlled steam valves CV-101 and open bypass line to flare stack FS-501. Double block feed valves inside zone Hydrocracking A.',
        tags: ['CV-101', 'FS-501', 'Safety Valve']
      }
    ],
    tags: ['OSHA 1910.119', 'R-102', 'CV-101', 'FS-501'],
    graphNodes: ['Reactor R-102', 'Control Valve CV-101', 'OSHA 1910.119 Code', 'Flare Stack FS-501'],
    graphEdges: [
      { from: 'Reactor R-102', to: 'Control Valve CV-101', label: 'governs heating' },
      { from: 'Control Valve CV-101', to: 'OSHA 1910.119 Code', label: 'compliance standard' },
      { from: 'Reactor R-102', to: 'Flare Stack FS-501', label: 'vents relief to' }
    ]
  },
  {
    id: 'doc-inspect',
    title: 'Thermal Imaging Drone Flight Log (IR-2026-042)',
    type: 'inspection',
    typeLabel: 'Inspection PDF',
    sourceFilename: 'DRONE_INFRARED_SCAN_SEC_B.pdf',
    size: '8.2 MB',
    rawContent: 'DRONE FLIGHT IR-SCAN LOG #42. Target: Refinery Sector B, Block 4. High-resolution FLIR optical scan performed over storage vessel V-101 refractory casing. Thermal imaging detects casing anomaly nearby primary burner tip V-101 with localized outer temperature at 420.0°C. Potential internal liner degradation. Companion compressor vibration analysis for C-301 indicates baseline normal lateral displacement (2.1 mm/s).',
    chunks: [
      {
        id: 'chunk-inspect-1',
        header: 'Vessel V-101 Thermal Profile Scan',
        text: 'Thermal imaging detects casing anomaly nearby primary burner tip V-101 with localized outer temperature at 420.0°C.',
        tags: ['V-101', 'Thermal Scan', 'Refractory Anomaly']
      },
      {
        id: 'chunk-inspect-2',
        header: 'Vibration Checklist C-301',
        text: 'Companion compressor vibration analysis for C-301 indicates baseline normal lateral displacement (2.1 mm/s).',
        tags: ['C-301', 'Vibration', 'Maintenance Baseline']
      }
    ],
    tags: ['V-101', 'C-301', 'Thermal Anomaly'],
    graphNodes: ['Vessel V-101', 'Compressor C-301', 'Drone IR-42 Scan', 'Thermal Anomaly'],
    graphEdges: [
      { from: 'Drone IR-42 Scan', to: 'Vessel V-101', label: 'audited casing temperature' },
      { from: 'Vessel V-101', to: 'Thermal Anomaly', label: 'identifies hot spot at' },
      { from: 'Drone IR-42 Scan', to: 'Compressor C-301', label: 'verified vibration metrics' }
    ]
  },
  {
    id: 'doc-wo',
    title: 'Hydrogen Seal Valve Recalibration (WO-91104)',
    type: 'work_order',
    typeLabel: 'Excel Work Order',
    sourceFilename: 'WO_91104_CV101_RECALIBRATE.xlsx',
    size: '340 KB',
    rawContent: 'WORK ORDER WO-91104: VALVES RE-CALIBRATION. Asset: Valve CV-101 on Reactor Heating loop. Technician reported persistent instrument air supply fluctuation in previous run. Replaced positioner seal gasket. Recalibrated electronic air actuator position feedback loops. Suction tests pass at 118.5 bar threshold to matches Compressor C-301 output.',
    chunks: [
      {
        id: 'chunk-wo-1',
        header: 'Valve CV-101 Positioner Maintenance',
        text: 'Technician reported persistent instrument air supply fluctuation in previous run. Replaced positioner seal gasket.',
        tags: ['CV-101', 'Instrument Air', 'Gasket']
      },
      {
        id: 'chunk-wo-2',
        header: 'Pressure Verification loop',
        text: 'Recalibrated electronic air actuator position feedback loops. Suction tests pass at 118.5 bar matching Compressor C-301 output.',
        tags: ['CV-101', 'C-301', 'Pressure Test']
      }
    ],
    tags: ['CV-101', 'C-301', 'Calibrate'],
    graphNodes: ['Control Valve CV-101', 'Compressor C-301', 'Work Order WO-91104', 'Actuator Positioner'],
    graphEdges: [
      { from: 'Work Order WO-91104', to: 'Control Valve CV-101', label: 'executed maintenance' },
      { from: 'Control Valve CV-101', to: 'Actuator Positioner', label: 'recalibrated loop component' },
      { from: 'Control Valve CV-101', to: 'Compressor C-301', label: 'matched suction pressure' }
    ]
  }
]

export function IngestionPipelineSimulator() {
  const [selectedDoc, setSelectedDoc] = useState<PipelineDoc>(PIPELINE_DOCS[0])
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState<number | null>(null) // null, 0, 1, 2, 3
  const [isExpanded, setIsExpanded] = useState(true)
  const [logs, setLogs] = useState<string[]>([])
  
  const consoleEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs])

  const runSimulation = () => {
    if (isPlaying) return
    setIsPlaying(true)
    setCurrentStep(0)
    setLogs([
      `[INGEST] Initializing ingestion workflow for: ${selectedDoc.sourceFilename}`,
      `[INGEST] Detected format: ${selectedDoc.typeLabel} (${selectedDoc.size})`,
      `[STEP 1: OCR] Mounting neural layout parser engine...`,
    ])

    // Timeline steps timing
    setTimeout(() => {
      setCurrentStep(1)
      setLogs(prev => [
        ...prev,
        `[OCR] Extracted ${selectedDoc.rawContent.length} raw text characters.`,
        `[OCR] Layout matching: identified key paragraphs and document header tags.`,
        `[OCR] Raw text stream cached inside local staging DB.`,
        `[STEP 2: CHUNKING] Initiating Smart Chunking Parser...`,
        `[CHUNKING] Context windows set to 150 tokens overlap.`,
      ])
    }, 2000)

    setTimeout(() => {
      setCurrentStep(2)
      setLogs(prev => [
        ...prev,
        ...selectedDoc.chunks.map(c => `[CHUNKING] Compiled chunk: "${c.header}" (${c.text.split(' ').length} words)`),
        `[CHUNKING] Extracted meta headers and associated tags: ${selectedDoc.tags.join(', ')}`,
        `[STEP 3: EMBEDDINGS] Requesting vector projections...`,
        `[EMBEDDINGS] Computing 1536-dimensional dense vector embeddings using text-embedding model...`,
        `[EMBEDDINGS] Storing vector points [${Array(5).fill(0).map(() => (Math.random() * 2 - 1).toFixed(4)).join(', ')}, ...] in vector index.`,
      ])
    }, 4500)

    setTimeout(() => {
      setCurrentStep(3)
      setLogs(prev => [
        ...prev,
        `[EMBEDDINGS] Multi-vector index commit successful. Cosine similarity thresholds loaded.`,
        `[STEP 4: GRAPH RESOLUTION] Triggering Entity Tag Resolver...`,
        ...selectedDoc.graphNodes.map(node => `[GRAPH] Extracted target tag node: "${node}"`),
        ...selectedDoc.graphEdges.map(edge => `[GRAPH] Linked edge: [${edge.from}] --(${edge.label})--> [${edge.to}]`),
        `[GRAPH] Cross-linking with active safety schemas and historic events completed.`,
        `[INGEST SUCCESS] ${selectedDoc.sourceFilename} successfully grounded & indexed. Ingestion pipeline complete!`,
        `[ROUTING] Data routed to AI Chatbot, Asset History timelines, and RCA Assistant database.`
      ])
    }, 7000)

    setTimeout(() => {
      setIsPlaying(false)
    }, 8500)
  }

  // Generate mock float array visually
  const mockEmbeddingValues = Array(12).fill(0).map(() => (Math.random() * 2 - 1).toFixed(3))

  return (
    <div className="bg-industrial-900 border border-industrial-800 rounded-3xl shadow-xl overflow-hidden mb-6 transition-all">
      
      {/* Header Banner */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-gradient-to-r from-industrial-950/80 via-industrial-900/60 to-industrial-950/80 px-5 py-4 border-b border-industrial-800 flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-industrial-accent/10 border border-industrial-accent/20 text-industrial-accent rounded-xl relative shrink-0">
            <Cpu className="animate-pulse" size={18} />
            <div className="absolute inset-0 bg-industrial-accent/20 rounded-xl blur-md -z-10" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
              Interactive Ingestion Pipeline Simulator
              <span className="text-[9px] font-mono font-bold bg-industrial-accent/10 text-industrial-accent border border-industrial-accent/25 px-2 py-0.5 rounded-md uppercase tracking-wider">
                RAG Grounding Engine
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
              Watch documents process through **OCR, Chunking, Embeddings, and Graph Traversals** into Cooperating Agents.
            </p>
          </div>
        </div>

        <button className="p-1.5 rounded-lg hover:bg-industrial-850 text-slate-400 hover:text-white transition-colors">
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-5 md:p-6 flex flex-col gap-6">
              
              {/* Simulator Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* 1. Document Source Picker - left */}
                <div className="lg:col-span-4 flex flex-col gap-3">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <FileText size={12} className="text-industrial-purple" />
                    1. Upload Source Document
                  </span>
                  
                  <div className="space-y-2">
                    {PIPELINE_DOCS.map((doc) => {
                      const isSelected = selectedDoc.id === doc.id
                      return (
                        <button
                          key={doc.id}
                          disabled={isPlaying}
                          onClick={() => {
                            setSelectedDoc(doc)
                            setCurrentStep(null)
                            setLogs([])
                          }}
                          className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex flex-col gap-1.5 relative ${
                            isSelected 
                              ? 'bg-industrial-950 border-industrial-accent/45 text-white shadow-[0_0_12px_rgba(0,240,255,0.05)]' 
                              : 'bg-industrial-950/20 border-industrial-850 hover:bg-industrial-950/40 hover:border-industrial-750 text-slate-400'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-[8px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                              doc.type === 'manual' ? 'bg-blue-950/20 text-blue-400 border-blue-900/30' :
                              doc.type === 'inspection' ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30' :
                              'bg-purple-950/20 text-purple-400 border-purple-900/30'
                            }`}>
                              {doc.typeLabel}
                            </span>
                            <span className="text-[9px] font-mono text-slate-500 font-bold">{doc.size}</span>
                          </div>

                          <div>
                            <h4 className={`text-xs font-bold leading-snug ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                              {doc.title}
                            </h4>
                            <p className="text-[9px] text-slate-500 font-mono mt-0.5">{doc.sourceFilename}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {/* Play trigger CTA */}
                  <button
                    onClick={runSimulation}
                    disabled={isPlaying}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-industrial-accent to-industrial-purple text-industrial-950 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider hover:brightness-110 active:scale-98 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(0,240,255,0.15)] cursor-pointer"
                  >
                    <Play size={13} fill="currentColor" />
                    {isPlaying ? 'Processing Neural Pipeline...' : 'Run Extraction Pipeline'}
                  </button>
                </div>

                {/* 2. Interactive Processing Pipeline Stepper - right */}
                <div className="lg:col-span-8 flex flex-col gap-4">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Cpu size={12} className="text-industrial-accent" />
                    2. AI Processing Pipeline State
                  </span>

                  {/* Horizontal Visual Pipeline Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    
                    {/* Step 1: OCR */}
                    <div className={`p-3 rounded-2xl border transition-all duration-300 flex flex-col justify-between h-32 relative ${
                      currentStep !== null && currentStep >= 0
                        ? 'bg-industrial-950 border-industrial-accent/40 shadow-md'
                        : 'bg-industrial-950/25 border-industrial-850 opacity-40'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-mono font-bold text-slate-500 bg-industrial-900 px-1.5 py-0.5 rounded">01. PARSE</span>
                        {currentStep === 0 && <span className="w-1.5 h-1.5 rounded-full bg-industrial-accent animate-ping" />}
                        {currentStep !== null && currentStep > 0 && <CheckCircle2 size={12} className="text-emerald-400" />}
                      </div>
                      <div className="space-y-1 mt-2">
                        <h5 className="text-[11px] font-bold text-slate-200">OCR &amp; Parse</h5>
                        <p className="text-[9px] text-slate-500 leading-normal line-clamp-3">
                          Extract physical characters from scanned PDF documents and tables.
                        </p>
                      </div>
                      {currentStep === 0 && (
                        <div className="absolute inset-x-2 bottom-2 h-1 bg-industrial-900 rounded overflow-hidden">
                          <motion.div className="h-full bg-industrial-accent" animate={{ x: ['-100%', '100%'] }} transition={{ repeat: Infinity, duration: 1 }} />
                        </div>
                      )}
                    </div>

                    {/* Step 2: Chunking */}
                    <div className={`p-3 rounded-2xl border transition-all duration-300 flex flex-col justify-between h-32 relative ${
                      currentStep !== null && currentStep >= 1
                        ? 'bg-industrial-950 border-industrial-purple/40 shadow-md'
                        : 'bg-industrial-950/25 border-industrial-850 opacity-40'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-mono font-bold text-slate-500 bg-industrial-900 px-1.5 py-0.5 rounded">02. CHUNK</span>
                        {currentStep === 1 && <span className="w-1.5 h-1.5 rounded-full bg-industrial-purple animate-ping" />}
                        {currentStep !== null && currentStep > 1 && <CheckCircle2 size={12} className="text-emerald-400" />}
                      </div>
                      <div className="space-y-1 mt-2">
                        <h5 className="text-[11px] font-bold text-slate-200">Smart Chunking</h5>
                        <p className="text-[9px] text-slate-500 leading-normal line-clamp-3">
                          Fragment large document sections into 150-token semantic chunks.
                        </p>
                      </div>
                      {currentStep === 1 && (
                        <div className="absolute inset-x-2 bottom-2 h-1 bg-industrial-900 rounded overflow-hidden">
                          <motion.div className="h-full bg-industrial-purple" animate={{ x: ['-100%', '100%'] }} transition={{ repeat: Infinity, duration: 1 }} />
                        </div>
                      )}
                    </div>

                    {/* Step 3: Embeddings */}
                    <div className={`p-3 rounded-2xl border transition-all duration-300 flex flex-col justify-between h-32 relative ${
                      currentStep !== null && currentStep >= 2
                        ? 'bg-industrial-950 border-emerald-500/40 shadow-md'
                        : 'bg-industrial-950/25 border-industrial-850 opacity-40'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-mono font-bold text-slate-500 bg-industrial-900 px-1.5 py-0.5 rounded">03. EMBED</span>
                        {currentStep === 2 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />}
                        {currentStep !== null && currentStep > 2 && <CheckCircle2 size={12} className="text-emerald-400" />}
                      </div>
                      <div className="space-y-1 mt-2">
                        <h5 className="text-[11px] font-bold text-slate-200">Neural Vector</h5>
                        <p className="text-[9px] text-slate-500 leading-normal line-clamp-3">
                          Map paragraph semantics to multi-dimensional vector search.
                        </p>
                      </div>
                      {currentStep === 2 && (
                        <div className="absolute inset-x-2 bottom-2 h-1 bg-industrial-900 rounded overflow-hidden">
                          <motion.div className="h-full bg-emerald-400" animate={{ x: ['-100%', '100%'] }} transition={{ repeat: Infinity, duration: 1 }} />
                        </div>
                      )}
                    </div>

                    {/* Step 4: Knowledge Graph */}
                    <div className={`p-3 rounded-2xl border transition-all duration-300 flex flex-col justify-between h-32 relative ${
                      currentStep !== null && currentStep >= 3
                        ? 'bg-industrial-950 border-amber-500/40 shadow-md'
                        : 'bg-industrial-950/25 border-industrial-850 opacity-40'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-mono font-bold text-slate-500 bg-industrial-900 px-1.5 py-0.5 rounded">04. RESOLVE</span>
                        {currentStep === 3 && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />}
                        {currentStep !== null && currentStep === 3 && !isPlaying && <CheckCircle2 size={12} className="text-emerald-400" />}
                      </div>
                      <div className="space-y-1 mt-2">
                        <h5 className="text-[11px] font-bold text-slate-200">Knowledge Graph</h5>
                        <p className="text-[9px] text-slate-500 leading-normal line-clamp-3">
                          Cross-reference tags to asset histories and standard codes.
                        </p>
                      </div>
                      {currentStep === 3 && isPlaying && (
                        <div className="absolute inset-x-2 bottom-2 h-1 bg-industrial-900 rounded overflow-hidden">
                          <motion.div className="h-full bg-amber-400" animate={{ x: ['-100%', '100%'] }} transition={{ repeat: Infinity, duration: 1 }} />
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Ingestion Data View Inspection */}
                  <div className="bg-industrial-950 border border-industrial-850 rounded-2xl p-4 min-h-36 flex flex-col justify-between">
                    <div className="flex items-center justify-between border-b border-industrial-850 pb-2.5">
                      <span className="text-[10px] font-mono font-bold text-slate-500">PIPELINE INTERNAL INSPECTION:</span>
                      <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-400">
                        {currentStep === null ? 'System Idle' :
                         currentStep === 0 ? 'Parsing Text Buffer' :
                         currentStep === 1 ? 'Viewing Compiled Chunks' :
                         currentStep === 2 ? 'Vector Node Projections' :
                         'Grounded Entity Mappings'}
                      </span>
                    </div>

                    <div className="py-3 flex-1 flex flex-col justify-center text-xs">
                      {currentStep === null && (
                        <div className="flex flex-col items-center justify-center text-center text-slate-500 py-4">
                          <Info size={18} className="text-slate-600 mb-1.5" />
                          <p className="text-[10px] font-mono leading-normal">
                            Click **Run Extraction Pipeline** above to process and inspect metadata flows.
                          </p>
                        </div>
                      )}

                      {currentStep === 0 && (
                        <div className="space-y-1 font-mono text-[10.5px] text-slate-400 leading-normal bg-industrial-900/60 p-2.5 rounded-xl border border-industrial-850/50">
                          <span className="text-industrial-accent font-bold font-mono">EXTRACTED STREAM:</span>
                          <p className="line-clamp-2">{selectedDoc.rawContent}</p>
                        </div>
                      )}

                      {currentStep === 1 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono">
                          {selectedDoc.chunks.map((c, idx) => (
                            <div key={idx} className="p-2 rounded-xl bg-industrial-900 border border-industrial-850 flex flex-col gap-1">
                              <span className="text-industrial-purple font-black truncate">{c.header}</span>
                              <p className="text-slate-400 leading-normal line-clamp-2">{c.text}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {currentStep === 2 && (
                        <div className="bg-industrial-900 p-2.5 rounded-xl border border-industrial-850 flex items-center justify-between gap-4 font-mono text-[10px]">
                          <div className="flex flex-col gap-1 shrink-0">
                            <span className="text-emerald-400 font-bold uppercase tracking-wider">DIMENSIONS: 1536 (FP32)</span>
                            <span className="text-slate-500">Similarity Metric: Cosine Dense</span>
                          </div>
                          <div className="flex flex-wrap gap-1 text-slate-400 line-clamp-2 select-none">
                            [ {mockEmbeddingValues.map((val, idx) => (
                              <span key={idx} className="bg-industrial-950/80 border border-industrial-850 px-1 py-0.5 rounded text-[8px] font-bold text-slate-300">
                                {val}
                              </span>
                            ))} ]
                          </div>
                        </div>
                      )}

                      {currentStep === 3 && (
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] font-mono font-bold text-slate-500">Cross-Referenced Tags:</span>
                            {selectedDoc.tags.map((tag, idx) => (
                              <span key={idx} className="bg-industrial-accent/15 border border-industrial-accent/30 text-industrial-accent px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold">
                                #{tag}
                              </span>
                            ))}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 mt-1 text-[10px] font-mono">
                            {selectedDoc.graphEdges.map((edge, idx) => (
                              <div key={idx} className="bg-industrial-900 border border-industrial-850 p-1.5 rounded-lg text-center flex flex-col gap-0.5">
                                <span className="text-slate-300 truncate font-semibold">{edge.from}</span>
                                <span className="text-slate-500 text-[8px] tracking-wider uppercase">{"--(" + edge.label + ")-->"}</span>
                                <span className="text-industrial-accent truncate font-semibold">{edge.to}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Footnote matching image target endpoints */}
                    <div className="border-t border-industrial-850/40 pt-2 mt-1.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-[9px] font-mono font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1">
                        <CornerDownRight size={10} className="text-industrial-purple" />
                        Piped to downstream Cooperating Modules:
                      </span>
                      
                      <div className="flex items-center gap-2.5 text-[9.5px] font-mono font-extrabold uppercase">
                        <Link to="/copilot" className="text-slate-400 hover:text-industrial-accent transition-colors flex items-center gap-1">
                          <MessageSquare size={10} />
                          <span>AI Chatbot</span>
                        </Link>
                        <Link to="/assets" className="text-slate-400 hover:text-industrial-accent transition-colors flex items-center gap-1">
                          <Activity size={10} />
                          <span>Asset History</span>
                        </Link>
                        <Link to="/rca" className="text-slate-400 hover:text-industrial-accent transition-colors flex items-center gap-1">
                          <Wrench size={10} />
                          <span>RCA Agent</span>
                        </Link>
                      </div>
                    </div>

                  </div>

                </div>

              </div>

              {/* Ingestion Real-time Scrolling Console Log */}
              <div className="bg-industrial-950 border border-industrial-850/70 rounded-2xl p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between border-b border-industrial-850 pb-2">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Share2 size={12} className="text-industrial-purple" />
                    Interactive Real-Time Processing Console Log
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-industrial-accent animate-pulse" />
                    <span className="text-[9px] font-mono font-bold text-slate-500 uppercase">SYS MONITOR LIVE</span>
                  </div>
                </div>

                <div className="h-28 overflow-y-auto pr-1 flex flex-col gap-1 text-[10.5px] font-mono text-slate-300 leading-normal selection:bg-industrial-accent/20">
                  {logs.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-slate-600 font-mono text-[10px] py-6">
                      [SYS_LOG] System ready. Trigger a document extraction run to monitor streaming node logs.
                    </div>
                  ) : (
                    logs.map((log, idx) => {
                      let colorClass = 'text-slate-400'
                      if (log.includes('[STEP') || log.includes('[INGEST SUCCESS]')) {
                        colorClass = 'text-industrial-accent font-bold'
                      } else if (log.includes('[OCR]')) {
                        colorClass = 'text-blue-300'
                      } else if (log.includes('[CHUNKING]')) {
                        colorClass = 'text-industrial-purple'
                      } else if (log.includes('[EMBEDDINGS]')) {
                        colorClass = 'text-emerald-400'
                      } else if (log.includes('[GRAPH]')) {
                        colorClass = 'text-amber-400 font-semibold'
                      }
                      return (
                        <div key={idx} className={`${colorClass} whitespace-pre-wrap`}>
                          {log}
                        </div>
                      )
                    })
                  )}
                  <div ref={consoleEndRef} />
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
