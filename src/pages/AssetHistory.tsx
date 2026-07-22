import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
  Wrench, 
  Cpu, 
  Layers, 
  Network, 
  Database, 
  Activity, 
  Clock, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  ChevronRight, 
  ShieldAlert, 
  Search, 
  Thermometer, 
  Gauge, 
  Waves, 
  Settings, 
  Compass,
  ArrowRight,
  Info,
  Calendar
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

// List of industrial equipment assets modeled in the system
interface Asset {
  id: string
  tag: string
  name: string
  type: string
  criticality: 'Extreme' | 'High' | 'Medium' | 'Low'
  status: 'Active' | 'Maintenance' | 'Standby' | 'Calibrating'
  location: string
  manufacturer: string
  installedDate: string
  description: string
  parameters: {
    label: string
    unit: string
    currentValue: number
    icon: any
    color: string
  }[]
  timeline: {
    id: string
    date: string
    type: 'sop' | 'incident' | 'work_order' | 'inspection'
    title: string
    summary: string
    authorOrRef: string
    tags: string[]
  }[]
}

const ASSET_DATA: Asset[] = [
  {
    id: 'CMP-C301',
    tag: 'C-301',
    name: 'Hydrogen Compressor C-301',
    type: 'Compressor',
    criticality: 'High',
    status: 'Active',
    location: 'Refinery Sector B, Block 4',
    manufacturer: 'Dresser-Rand Heavy Industries',
    installedDate: '2021-04-18',
    description: 'Multi-stage reciprocating hydrogen supply compressor. Critical unit for boosting system feedback hydrogen pressure into Reactor R-102.',
    parameters: [
      { label: 'Suction Pressure', unit: 'bar', currentValue: 118.5, icon: Gauge, color: 'text-industrial-accent' },
      { label: 'Discharge Temp', unit: '°C', currentValue: 72.4, icon: Thermometer, color: 'text-amber-400' },
      { label: 'Vibration Amplitude', unit: 'mm/s', currentValue: 2.1, icon: Activity, color: 'text-emerald-400' },
      { label: 'Seal Gas Flow', unit: 'Nm³/h', currentValue: 45.2, icon: Waves, color: 'text-industrial-purple' },
    ],
    timeline: [
      {
        id: 'evt-1',
        date: '2026-07-15',
        type: 'work_order',
        title: 'WO-90218: Primary Seal Gas Filter Replacement',
        summary: 'Preventive filter replacement completed after differential pressure reached 0.85 bar. Line purged with nitrogen, tested under 120 bar pressure with zero leaks.',
        authorOrRef: 'TECH-502',
        tags: ['Maintenance', 'Seal Gas', 'LOTO']
      },
      {
        id: 'evt-2',
        date: '2026-07-12',
        type: 'sop',
        title: 'SOP-R-102: Emergency Shutdown Protocol',
        summary: 'Governs immediate isolation steps for reactor systems, including compressor C-301 power trip sequencing and double block valves closing.',
        authorOrRef: 'Process Safety Committee',
        tags: ['Safety', 'OSHA 1910.119', 'Shutdown']
      },
      {
        id: 'evt-3',
        date: '2026-05-15',
        type: 'incident',
        title: 'INC-2026-004: Transient Instrument Air Supply Fluctuation',
        summary: 'Fluctuation tripped secondary compressor bypass. Pressure relief system operated correctly. Restored within 40 minutes under supervisor approval.',
        authorOrRef: 'Lead Operator J. Miller',
        tags: ['Pressure', 'Exceedance', 'Venting']
      },
      {
        id: 'evt-4',
        date: '2026-04-10',
        type: 'inspection',
        title: 'Drone Thermography Log: Motor C-301-EP Check',
        summary: 'Thermal scan of electrical supply terminals. Terminal box junction running at a nominal 44.1°C, well below maximum 75.0°C thermal limit.',
        authorOrRef: 'DRONE-SCAN-04',
        tags: ['Thermal', 'Electrical', 'Drone']
      }
    ]
  },
  {
    id: 'RCT-R102',
    tag: 'R-102',
    name: 'Hydrogen Reactor R-102',
    type: 'Reactor',
    criticality: 'Extreme',
    status: 'Active',
    location: 'Refinery Sector A, Hydrocracking Unit',
    manufacturer: 'Mitsubishi Heavy Vessels',
    installedDate: '2019-11-02',
    description: 'High-pressure catalytic hydrogenation reactor running exothermic reactions. Subject to continuous monitoring and strict OSHA 1910.119 Process Safety Management.',
    parameters: [
      { label: 'Reactor Bed Temp', unit: '°C', currentValue: 385.1, icon: Thermometer, color: 'text-industrial-accent' },
      { label: 'Core Pressure', unit: 'bar', currentValue: 132.8, icon: Gauge, color: 'text-amber-400' },
      { label: 'Reactor Feed Flow', unit: 'm³/h', currentValue: 210.4, icon: Waves, color: 'text-emerald-400' },
      { label: 'Shell Stress index', unit: 'μS', currentValue: 14.5, icon: Activity, color: 'text-industrial-purple' },
    ],
    timeline: [
      {
        id: 'evt-5',
        date: '2026-07-14',
        type: 'sop',
        title: 'SOP-R-102: Catalytic Bed Emergency Venting',
        summary: 'Critical regulatory procedure for reactor overpressure mitigation, outlining proper venting pathways through PV-402 to Flare Stack FS-501.',
        authorOrRef: 'Process Safety Committee',
        tags: ['SOP', 'Overpressure', 'PSM']
      },
      {
        id: 'evt-6',
        date: '2026-06-22',
        type: 'inspection',
        title: 'IR-2026-042: Outer Vessel Ultrasonic Integrity Scan',
        summary: 'Non-destructive shell wall thickness mapping. Calculated corrosion rate 0.04 mm/year. Remaining operational wall margin is highly optimal (98.4%).',
        authorOrRef: 'Inspector D. Vance',
        tags: ['NDT', 'Ultrasonic', 'Corrosion']
      },
      {
        id: 'evt-7',
        date: '2026-03-12',
        type: 'work_order',
        title: 'WO-88741: Hydro-Catalytic Feed Inlet Nozzle Recalibration',
        summary: 'Exchanged standard pressure differential transducer. Verified zero point drift, calibrated to range 0-250 m³/h. Restored reaction feedback loops.',
        authorOrRef: 'TECH-108',
        tags: ['Calibration', 'Transducer', 'Reactor']
      }
    ]
  },
  {
    id: 'VES-V101',
    tag: 'V-101',
    name: 'Storage Vessel V-101',
    type: 'Vessel',
    criticality: 'High',
    status: 'Maintenance',
    location: 'Feedstock Area, Tank Farm A',
    manufacturer: 'Chicago Bridge & Iron Company',
    installedDate: '2017-08-14',
    description: 'High-volume feedstock surge and buffer vessel. Currently offline for refractory liner inspection and turn-around mechanical repairs.',
    parameters: [
      { label: 'Liner Temperature', unit: '°C', currentValue: 420.0, icon: Thermometer, color: 'text-industrial-danger animate-pulse' },
      { label: 'Vessel Pressure', unit: 'bar', currentValue: 4.2, icon: Gauge, color: 'text-emerald-400' },
      { label: 'Level Level Percent', unit: '%', currentValue: 15.2, icon: Waves, color: 'text-industrial-purple' },
      { label: 'Venting Rate', unit: 'kg/h', currentValue: 0.0, icon: Activity, color: 'text-slate-500' },
    ],
    timeline: [
      {
        id: 'evt-8',
        date: '2026-07-17',
        type: 'inspection',
        title: 'IR-2026-042: Flare Stack FS-501 Thermal Mapping',
        summary: 'Drone inspection detected minor refractory hot spot of 420°C on the vessel casing near secondary burner tip V-101, recommending turnaround maintenance.',
        authorOrRef: 'DRONE-SCAN-04',
        tags: ['Refractory', 'Drone', 'Turnaround']
      },
      {
        id: 'evt-9',
        date: '2026-05-15',
        type: 'incident',
        title: 'INC-2026-004: Reactor V-101 Pressure Excursion',
        summary: '4.2 bar overpressure event caused by steam control valve CV-101 failure. Mitigated successfully by automatic safety valves PRV-101 venting to low pressure header.',
        authorOrRef: 'Safety Lead',
        tags: ['Incident', 'Excursion', 'Venting']
      },
      {
        id: 'evt-10',
        date: '2026-01-20',
        type: 'work_order',
        title: 'WO-81014: Visual Internal Liner Walkthrough',
        summary: 'Minor scaling of interior refractory tiles detected. Slag accumulation cleared. Scheduled scheduled full repair for next site turnaround.',
        authorOrRef: 'TECH-440',
        tags: ['Inspection', 'Refractory', 'Liner']
      }
    ]
  },
  {
    id: 'VLV-CV101',
    tag: 'CV-101',
    name: 'Steam Control Valve CV-101',
    type: 'Valve',
    criticality: 'High',
    status: 'Calibrating',
    location: 'Reactor R-102 Outer Heating Jacket',
    manufacturer: 'Fisher Valves & Instruments',
    installedDate: '2022-09-12',
    description: 'Pneumatically-actuated modulatory steam control valve regulating heat input to Reactor R-102 outer jacket loop.',
    parameters: [
      { label: 'Actuator Position', unit: '%', currentValue: 34.8, icon: Settings, color: 'text-industrial-accent' },
      { label: 'Supply Pressure', unit: 'bar', currentValue: 3.8, icon: Gauge, color: 'text-amber-400' },
      { label: 'Steam Temperature', unit: '°C', currentValue: 148.5, icon: Thermometer, color: 'text-emerald-400' },
      { label: 'Response Latency', unit: 'ms', currentValue: 420.0, icon: Activity, color: 'text-industrial-purple' },
    ],
    timeline: [
      {
        id: 'evt-11',
        date: '2026-07-16',
        type: 'work_order',
        title: 'WO-91104: Air Actuator Seal & Positioner Calibration',
        summary: 'Replaced torn positioner seal. Cleaned air filtration nozzle to resolve supply air fluctuations. Performing feedback loop validation.',
        authorOrRef: 'TECH-502',
        tags: ['Calibration', 'Valve', 'Air Line']
      },
      {
        id: 'evt-12',
        date: '2026-05-15',
        type: 'incident',
        title: 'INC-2026-004: Instrument Air Supply Degradation',
        summary: 'CV-101 failed open due to air supply filter blockage, dumping excess steam into reactor heating jacket. Caused subsequent overpressure event in vessel V-101.',
        authorOrRef: 'Root Cause Investigation',
        tags: ['Failure', 'Instrument Air', 'Overpressure']
      }
    ]
  }
]

// Animated Pipeline Steps to match diagram (OCR -> chunking -> Embeddings -> knowledge graph)
const PIPELINE_STEPS = [
  {
    id: 'ocr',
    name: 'OCR & Parser',
    desc: 'Extract text characters and tables from complex PDF blueprints, Excel work orders, and scanned drone flight inspections.',
    icon: FileText,
    color: 'text-blue-400',
    bg: 'bg-blue-950/15',
    border: 'border-blue-900/30'
  },
  {
    id: 'chunking',
    name: 'Smart Chunking',
    desc: 'Break textual manuals into semantic sections (e.g. Isolation checkpoints, emergency shutdown tasks) while preserving metadata hierarchy.',
    icon: Layers,
    color: 'text-amber-400',
    bg: 'bg-amber-950/15',
    border: 'border-amber-900/30'
  },
  {
    id: 'embeddings',
    name: 'Neural Embeddings',
    desc: 'Project chunks into high-dimensional semantic vector spaces using multi-lingual encoders to support dense cosine search.',
    icon: Cpu,
    color: 'text-industrial-purple',
    bg: 'bg-industrial-purple/15',
    border: 'border-industrial-purple/30'
  },
  {
    id: 'graph',
    name: 'Knowledge Graph Resolver',
    desc: 'Parse and extract explicit cross-references (e.g. Asset tag C-301 is mentioned in SOP-R-102 and governed by OSHA standard) to build direct nodes/edges.',
    icon: Network,
    color: 'text-industrial-accent',
    bg: 'bg-industrial-accent/15',
    border: 'border-industrial-accent/30'
  }
]

// Telemetry graph simulation values
const getTelemetryData = (assetId: string) => {
  const data = []
  const baseTemp = assetId === 'RCT-R102' ? 380 : assetId === 'VES-V101' ? 415 : assetId === 'VLV-CV101' ? 145 : 70
  const basePress = assetId === 'RCT-R102' ? 130 : assetId === 'VES-V101' ? 4.0 : assetId === 'VLV-CV101' ? 3.5 : 115

  for (let i = 0; i < 12; i++) {
    const hour = `${i * 2}:00`
    const randTemp = (Math.sin(i / 1.5) * 4) + (Math.random() * 2)
    const randPress = (Math.cos(i / 2) * 2) + (Math.random() * 1.5)
    
    data.push({
      time: hour,
      Temperature: Number((baseTemp + randTemp).toFixed(1)),
      Pressure: Number((basePress + randPress).toFixed(1)),
    })
  }
  return data
}

export function AssetHistory() {
  const [selectedAsset, setSelectedAsset] = useState<Asset>(ASSET_DATA[0])
  const [searchQuery, setSearchQuery] = useState('')
  const [activePipelineStep, setActivePipelineStep] = useState<number>(3) // Default to Graph Resolver

  const telemetryHistory = useMemo(() => {
    return getTelemetryData(selectedAsset.id)
  }, [selectedAsset.id])

  // Filter asset options based on quick query search
  const filteredAssetsList = useMemo(() => {
    if (!searchQuery.trim()) return ASSET_DATA
    const query = searchQuery.toLowerCase()
    return ASSET_DATA.filter(
      a => a.name.toLowerCase().includes(query) || 
           a.tag.toLowerCase().includes(query) || 
           a.type.toLowerCase().includes(query) ||
           a.location.toLowerCase().includes(query)
    )
  }, [searchQuery])

  // Cycle pipeline animations purely as a visual UI element to simulate real-time processing
  useEffect(() => {
    const timer = setInterval(() => {
      setActivePipelineStep(prev => (prev + 1) % PIPELINE_STEPS.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="p-4 md:p-8 max-w-6xl mx-auto flex flex-col gap-6 font-sans pb-24"
    >
      {/* Title & Description Block */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-industrial-800 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-white font-display flex items-center gap-2">
            <Wrench className="text-industrial-accent glow-text-cyan" size={24} />
            Asset History &amp; Lifecycle Explorer
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Dynamic asset cross-referencing ledger. Select any industrial asset tag to retrieve indexed SOP rules, completed work orders, thermal drone maps, and active safety incident records.
          </p>
        </div>

        {/* Top Breadcrumb indicating integration path */}
        <div className="hidden lg:flex items-center gap-1 bg-industrial-900 border border-industrial-800 px-3 py-1.5 rounded-xl font-mono text-[9px] font-bold text-slate-400">
          <span>PIPELINE RAG</span>
          <ArrowRight size={10} className="text-industrial-accent" />
          <span>GRAPH SOLVER</span>
          <ArrowRight size={10} className="text-industrial-purple" />
          <span className="text-industrial-accent">ASSET LEDGER</span>
        </div>
      </div>

      {/* Main Structural split: Assets Selector Left, Detailed View Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Interactive Asset Finder list */}
        <div className="lg:col-span-4 bg-industrial-900 border border-industrial-800 rounded-2xl p-4.5 flex flex-col gap-4 shadow-xl">
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono">
              Active Plant Assets
            </h3>
            <p className="text-[11px] text-slate-500 leading-normal">
              Find and cross-reference registered plant machinery.
            </p>
          </div>

          {/* Local quick-filter Input */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
              <Search size={14} className="text-industrial-accent" />
            </span>
            <input
              type="text"
              placeholder="Filter by Tag, Name, Location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-industrial-950 border border-industrial-850 focus:border-industrial-accent/50 rounded-xl py-2 pl-9 pr-8 text-[11px] text-white placeholder-slate-500 focus:outline-none transition-all font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-white transition text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Scroller list of selectable Assets */}
          <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
            {filteredAssetsList.length === 0 ? (
              <div className="text-center py-8 bg-industrial-950/40 rounded-xl border border-industrial-850/50">
                <p className="text-[10px] text-slate-500 font-mono">No matching assets found</p>
              </div>
            ) : (
              filteredAssetsList.map((asset) => {
                const isSelected = selectedAsset.id === asset.id
                let statusColor = 'bg-emerald-500'
                if (asset.status === 'Maintenance') statusColor = 'bg-industrial-danger animate-pulse'
                else if (asset.status === 'Calibrating') statusColor = 'bg-industrial-warn'
                else if (asset.status === 'Standby') statusColor = 'bg-industrial-purple'

                return (
                  <button
                    key={asset.id}
                    onClick={() => setSelectedAsset(asset)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                      isSelected 
                        ? 'bg-industrial-800 border-industrial-accent/40 text-white shadow-[0_0_15px_rgba(0,240,255,0.06)]' 
                        : 'bg-industrial-950/30 border-industrial-850/60 hover:bg-industrial-950/70 hover:border-industrial-700 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black tracking-wider text-industrial-accent bg-industrial-950 border border-industrial-850/50 px-2 py-0.5 rounded-md">
                        {asset.tag}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${statusColor}`} />
                        <span className="text-[9px] font-mono font-bold uppercase tracking-wider">{asset.status}</span>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <h4 className={`text-xs font-bold leading-tight ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                        {asset.name}
                      </h4>
                      <p className="text-[9px] text-slate-500 font-mono mt-0.5 truncate">{asset.location}</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-industrial-800/40 pt-1.5 mt-0.5 text-[9px] font-mono">
                      <span className="text-slate-600">CRITICALITY:</span>
                      <span className={`font-bold ${
                        asset.criticality === 'Extreme' ? 'text-industrial-danger' : 
                        asset.criticality === 'High' ? 'text-industrial-warn' : 'text-slate-400'
                      }`}>{asset.criticality.toUpperCase()}</span>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Summary Stat card */}
          <div className="bg-industrial-950 border border-industrial-850/60 rounded-xl p-3.5 mt-2 flex items-center gap-3">
            <div className="p-2 bg-industrial-accent/10 border border-industrial-accent/20 rounded-lg text-industrial-accent shrink-0">
              <Database size={15} />
            </div>
            <div>
              <p className="text-[10px] font-mono text-slate-500 font-bold uppercase leading-none">INTEGRITY SCORES</p>
              <p className="text-xs text-slate-300 font-semibold mt-1 leading-snug">
                100% Core Cross-Referenced Nodes Grounded
              </p>
            </div>
          </div>

        </div>

        {/* Right Side: Primary Detailed Ledger & Graphs */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Section 1: Selected Asset Metadata Card */}
          <div className="bg-industrial-900 border border-industrial-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-industrial-accent via-industrial-purple to-emerald-500" />

            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                  Asset Spec Profile
                </span>
                <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  {selectedAsset.name}
                  <span className="text-[10px] font-mono font-bold bg-industrial-950 border border-industrial-800 text-industrial-accent px-2.5 py-0.5 rounded-lg">
                    {selectedAsset.id}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-2xl pt-1">
                  {selectedAsset.description}
                </p>
              </div>

              {/* Install Date badge */}
              <div className="flex flex-col bg-industrial-950 border border-industrial-850 rounded-xl p-2.5 min-w-[130px] shrink-0 font-mono text-[10px]">
                <span className="text-slate-500 uppercase font-bold text-[9px]">INSTALL DATE:</span>
                <span className="font-bold text-slate-200 mt-1 flex items-center gap-1.5">
                  <Calendar size={11} className="text-industrial-purple" />
                  {selectedAsset.installedDate}
                </span>
              </div>
            </div>

            {/* In-depth Spec tags row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-industrial-950/40 border border-industrial-850/50 rounded-xl p-3.5 mt-5 text-[10px] font-mono">
              <div className="space-y-0.5">
                <span className="text-slate-500 uppercase">Manufacturer:</span>
                <p className="text-slate-200 font-bold truncate">{selectedAsset.manufacturer}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-500 uppercase">Zone / Area:</span>
                <p className="text-slate-200 font-bold truncate">{selectedAsset.location}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-500 uppercase">Type classification:</span>
                <p className="text-slate-200 font-bold truncate">{selectedAsset.type}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-500 uppercase">RAG Resolution:</span>
                <p className="text-emerald-400 font-bold">100% Live Sync</p>
              </div>
            </div>

            {/* Asset Parameter Meters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              {selectedAsset.parameters.map((p, idx) => {
                const Icon = p.icon
                return (
                  <div key={idx} className="bg-industrial-950 border border-industrial-850 rounded-xl p-3 flex flex-col justify-between h-20">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="text-[9px] font-mono uppercase truncate max-w-[80px]">{p.label}</span>
                      <Icon size={12} className={p.color} />
                    </div>
                    <div className="mt-2.5 flex items-baseline gap-1">
                      <span className="text-base font-black text-slate-100 font-display">{p.currentValue}</span>
                      <span className="text-[9px] font-mono text-slate-500">{p.unit}</span>
                    </div>
                  </div>
                )
              })}
            </div>

          </div>

          {/* Section 2: Animated AI Processing Pipeline (Direct correlation to Diagram!) */}
          <div className="bg-industrial-900 border border-industrial-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono flex items-center gap-1.5">
                <Cpu size={14} className="text-industrial-accent" />
                AI Processing pipeline
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                OpsBrain ingest architecture tracking mapping resolution for <code className="text-industrial-accent">{selectedAsset.tag}</code>. Hover over steps below to see core backend logic.
              </p>
            </div>

            {/* Visual flow chart matching the handdrawn flow diagram! */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative mt-1">
              {PIPELINE_STEPS.map((step, idx) => {
                const Icon = step.icon
                const isActive = activePipelineStep === idx
                return (
                  <div
                    key={step.id}
                    onMouseEnter={() => setActivePipelineStep(idx)}
                    className={`p-3.5 rounded-xl border transition-all duration-300 flex flex-col justify-between h-32 relative group select-none cursor-pointer ${
                      isActive 
                        ? 'bg-industrial-950 border-industrial-accent/50 shadow-[0_0_15px_rgba(0,240,255,0.05)]' 
                        : 'bg-industrial-950/20 border-industrial-850/50 hover:border-industrial-700'
                    }`}
                  >
                    {/* Active highlight background glow */}
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-b from-industrial-accent/2 to-transparent rounded-xl pointer-events-none" />
                    )}

                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-lg ${step.bg} border ${step.border} ${step.color} shrink-0`}>
                        <Icon size={15} />
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-mono text-slate-600 font-bold">0{idx+1}</span>
                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-industrial-accent animate-ping" />}
                      </div>
                    </div>

                    <div className="mt-2.5">
                      <h5 className={`text-[11px] font-bold font-mono uppercase tracking-wide ${isActive ? 'text-white' : 'text-slate-400'}`}>
                        {step.name}
                      </h5>
                      <p className="text-[9px] text-slate-500 leading-normal line-clamp-2 mt-1 group-hover:line-clamp-none transition-all duration-300">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pipeline progress explanation */}
            <div className="bg-industrial-950/50 border border-industrial-850/50 rounded-xl p-3 flex items-center gap-2.5 text-[10px] text-slate-400">
              <Info size={13} className="text-industrial-purple shrink-0" />
              <p className="leading-normal">
                <strong>Pipeline status:</strong> The system parsed {selectedAsset.timeline.length} files mentioning <code className="text-slate-300">{selectedAsset.tag}</code>. Standard OCR models extracted manual structures, chunked paragraphs, injected vectors to the embedding space, and built operational graph nodes.
              </p>
            </div>
          </div>

          {/* Section 3: Diagnostic Telemetry Chart (Using Recharts) */}
          <div className="bg-industrial-900 border border-industrial-800 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-industrial-800 pb-4 mb-5 gap-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono flex items-center gap-1.5">
                  <Activity size={14} className="text-emerald-400" />
                  Live Diagnostic Telemetry
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Real-time operational load curves modeled for critical variables. Excursions trigger auto-warnings.
                </p>
              </div>

              {/* Legend with color dots */}
              <div className="flex items-center gap-3.5 text-[9px] font-mono font-bold">
                <div className="flex items-center gap-1 text-industrial-accent">
                  <span className="w-2 h-0.5 bg-industrial-accent" />
                  <span>TEMPERATURE (°C)</span>
                </div>
                <div className="flex items-center gap-1 text-amber-400">
                  <span className="w-2 h-0.5 bg-amber-400" />
                  <span>PRESSURE (BAR)</span>
                </div>
              </div>
            </div>

            {/* Recharts responsive container */}
            <div className="h-56 w-full bg-industrial-950/30 border border-industrial-800/30 rounded-xl p-2.5">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={telemetryHistory} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
                  <XAxis 
                    dataKey="time" 
                    stroke="#475569" 
                    fontSize={9} 
                    fontFamily="JetBrains Mono"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#475569" 
                    fontSize={9} 
                    fontFamily="JetBrains Mono"
                    tickLine={false}
                    axisLine={false}
                  />
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" opacity={0.4} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(6, 9, 14, 0.95)', 
                      borderColor: 'rgba(18, 27, 41, 0.8)',
                      borderRadius: '12px',
                      fontFamily: 'JetBrains Mono',
                      fontSize: '10px'
                    }}
                    itemStyle={{ color: '#cbd5e1' }}
                    labelStyle={{ color: '#64748b', fontWeight: 'bold' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Temperature" 
                    stroke="var(--industrial-accent)" 
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    activeDot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Pressure" 
                    stroke="var(--industrial-warn)" 
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Section 4: Chronological Cross-Referenced Timeline (RAG + Graph Output) */}
          <div className="bg-industrial-900 border border-industrial-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
            <div className="space-y-1 border-b border-industrial-800 pb-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono flex items-center gap-1.5">
                <Clock size={14} className="text-industrial-purple" />
                Operational Event Timeline
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Complete chronological map of files, incident reports, work orders, and compliance manuals mentioning <code className="text-industrial-accent">{selectedAsset.tag}</code> resolved by the RAG search engine.
              </p>
            </div>

            {/* Timeline Tree Component */}
            <div className="relative border-l border-industrial-800 pl-4.5 ml-2 space-y-6 py-2">
              {selectedAsset.timeline.map((event) => {
                let badgeColor = 'bg-blue-950/15 text-blue-400 border-blue-900/30'
                let badgeLabel = 'SOP'
                if (event.type === 'incident') {
                  badgeColor = 'bg-red-950/15 text-red-400 border-red-900/30 animate-pulse'
                  badgeLabel = 'INCIDENT'
                } else if (event.type === 'work_order') {
                  badgeColor = 'bg-industrial-purple/15 text-industrial-purple border-industrial-purple/30'
                  badgeLabel = 'WORK ORDER'
                } else if (event.type === 'inspection') {
                  badgeColor = 'bg-emerald-950/15 text-emerald-400 border-emerald-900/30'
                  badgeLabel = 'INSPECTION'
                }

                return (
                  <div key={event.id} className="relative group">
                    {/* Circle icon placement */}
                    <div className="absolute -left-[27.5px] top-1 w-3.5 h-3.5 rounded-full bg-industrial-900 border-2 border-industrial-800 group-hover:border-industrial-accent transition-colors flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-industrial-800 group-hover:bg-industrial-accent transition-colors" />
                    </div>

                    <div className="flex flex-col gap-1.5 bg-industrial-950/40 hover:bg-industrial-950/80 border border-industrial-850 hover:border-industrial-750 transition-all rounded-2xl p-4 shadow-sm">
                      
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-lg border text-[8px] font-mono font-black ${badgeColor}`}>
                            {badgeLabel}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 font-bold">{event.date}</span>
                        </div>
                        <span className="text-[9px] font-mono text-slate-500 font-bold uppercase">
                          REF: <span className="text-slate-400">{event.authorOrRef}</span>
                        </span>
                      </div>

                      <div>
                        <h5 className="text-xs font-bold text-slate-200 group-hover:text-industrial-accent transition-colors">
                          {event.title}
                        </h5>
                        <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                          {event.summary}
                        </p>
                      </div>

                      {/* Timeline Chip Tags */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {event.tags.map((tag, tIdx) => (
                          <span key={tIdx} className="bg-industrial-900 border border-industrial-850 px-2 py-0.5 rounded-md text-[9px] font-mono text-slate-500 font-semibold">
                            #{tag}
                          </span>
                        ))}
                      </div>

                    </div>
                  </div>
                )
              })}
            </div>

          </div>

        </div>

      </div>

    </motion.div>
  )
}
