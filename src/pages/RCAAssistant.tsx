import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { api, type RCAResponse } from '../lib/api'
import {
  Wrench,
  ShieldAlert,
  AlertTriangle,
  Calendar,
  FileText,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Activity,
  Sparkles,
  RefreshCw,
} from 'lucide-react'

const SUGGESTED_SYMPTOMS = ['high vibration', 'bearing temperature trending up', 'packing gland seepage', 'discharge pressure limit']

export function RCAAssistant() {
  const [equipmentList, setEquipmentList] = useState<string[]>([])
  const [selectedTag, setSelectedTag] = useState('')
  const [symptom, setSymptom] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<RCAResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.listEquipment()
      .then((list) => {
        setEquipmentList(list)
        if (list.length > 0) setSelectedTag(list[0])
      })
      .catch((err) => console.error('Failed to load equipment list:', err))
  }, [])

  const handleRunRCA = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!selectedTag || !symptom.trim()) {
      setError('Please select an asset and specify a symptom.')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const data = await api.getRCADetails(selectedTag, symptom.trim())
      setResult(data)
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Failed to analyze Root Cause.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 md:p-8 max-w-4xl mx-auto flex flex-col gap-6 font-sans pb-24"
    >
      {/* Title */}
      <div className="border-b border-industrial-800 pb-5">
        <h2 className="text-2xl font-bold text-white font-display flex items-center gap-2">
          <Wrench className="text-industrial-accent glow-text-cyan" size={24} />
          Root Cause Analysis (RCA) Assistant
        </h2>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          Traverse complex engineering guidelines, historic machine telemetry, and localized multi-agent connections to immediately map operational failure paths and suggest verified remediation paths.
        </p>
      </div>

      {/* Input Form Card */}
      <motion.form 
        onSubmit={handleRunRCA}
        layout
        className="bg-industrial-900 border border-industrial-800 rounded-2xl p-6 shadow-xl flex flex-col gap-5 relative overflow-hidden"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Target Operational Asset
            </label>
            <div className="relative">
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="w-full appearance-none bg-industrial-950 border border-industrial-800 rounded-xl pl-4 pr-10 py-3 text-xs font-semibold text-slate-200 focus:border-industrial-accent/50 outline-none transition cursor-pointer"
              >
                {equipmentList.map((tag) => (
                  <option key={tag} value={tag} className="bg-industrial-950 text-slate-200">
                    {tag} - {tag.startsWith('PMP') ? 'Centrifugal Pump' : tag.startsWith('VLV') ? 'Isolation Valve' : tag.startsWith('CMP') ? 'Air Compressor' : tag.startsWith('TNK') ? 'Receiver Tank' : 'Equipment'}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-slate-400">
                <ChevronDown size={14} />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Describe Operational Symptom
            </label>
            <input
              type="text"
              placeholder="e.g. vibration readings exceed 3.5 mm/s RMS"
              value={symptom}
              onChange={(e) => setSymptom(e.target.value)}
              className="w-full bg-industrial-950 border border-industrial-800 rounded-xl px-4 py-3 text-xs text-slate-200 placeholder:text-slate-700 focus:border-industrial-accent/50 outline-none transition"
            />
          </div>
        </div>

        {/* Suggestion tags */}
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mr-1 flex items-center gap-1">
            <Sparkles size={11} className="text-industrial-purple" />
            Quick Diagnostics:
          </span>
          {SUGGESTED_SYMPTOMS.map((sys) => (
            <button
              key={sys}
              type="button"
              onClick={() => setSymptom(sys)}
              className={`text-[11px] font-semibold rounded-full border px-3 py-1 transition-all ${
                symptom === sys 
                  ? 'border-industrial-accent bg-industrial-accent/15 text-industrial-accent' 
                  : 'border-industrial-800 bg-industrial-950 text-slate-400 hover:text-slate-200 hover:border-industrial-700'
              }`}
            >
              {sys}
            </button>
          ))}
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex gap-2 bg-red-950/20 border border-red-900/40 text-red-300 rounded-xl px-4 py-3 text-xs"
          >
            <ShieldAlert size={14} className="shrink-0 mt-0.5 text-red-400" />
            <span>{error}</span>
          </motion.div>
        )}

        <div className="flex justify-between items-center border-t border-industrial-800/60 pt-4 mt-2">
          <div className="text-[10px] font-mono text-slate-500 hidden sm:block">
            Connected to 4 failure classification engines
          </div>
          <button
            type="submit"
            disabled={loading || !symptom.trim()}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-industrial-accent to-industrial-purple text-industrial-950 font-bold hover:brightness-110 disabled:opacity-50 transition text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-industrial-accent/10"
          >
            {loading ? (
              <>
                <RefreshCw className="animate-spin" size={14} />
                <span>Generating Diagnostic Nodes...</span>
              </>
            ) : (
              <>
                <span>Execute Diagnostics</span>
                <ChevronRight size={14} />
              </>
            )}
          </button>
        </div>
      </motion.form>

      {/* Loading Skeleton */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-industrial-900/50 border border-industrial-800 rounded-2xl p-8 flex flex-col gap-6 animate-pulse"
          >
            <div className="h-4 w-1/4 bg-industrial-800 rounded"></div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="h-20 bg-industrial-800 rounded-xl"></div>
              <div className="h-20 bg-industrial-800 rounded-xl"></div>
              <div className="h-20 bg-industrial-800 rounded-xl"></div>
            </div>
            <div className="h-28 bg-industrial-800 rounded-xl"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Diagnostics Report */}
      <AnimatePresence>
        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 90 }}
            className="flex flex-col gap-6"
          >
            {/* Diagnostic Metrics Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-industrial-900 border border-industrial-800 rounded-2xl p-5 flex items-center justify-between shadow-md">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Criticality Rating</p>
                  <p className={`text-xl font-bold mt-2 font-display ${result.criticality === 'High' ? 'text-red-400' : 'text-amber-400'}`}>
                    {result.criticality}
                  </p>
                </div>
                <span className={`p-3 rounded-xl border ${result.criticality === 'High' ? 'bg-red-950/20 text-red-400 border-red-900/30' : 'bg-amber-950/20 text-amber-400 border-amber-900/30'}`}>
                  <ShieldAlert size={20} />
                </span>
              </div>

              <div className="bg-industrial-900 border border-industrial-800 rounded-2xl p-5 flex items-center justify-between shadow-md">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-sans">MTBF Estimate</p>
                  <p className="text-xl font-bold mt-2 font-display text-industrial-accent glow-text-cyan">{result.mtbf_days} Days</p>
                </div>
                <span className="p-3 rounded-xl bg-industrial-950 text-industrial-accent border border-industrial-800">
                  <Activity size={20} />
                </span>
              </div>

              <div className="bg-industrial-900 border border-industrial-800 rounded-2xl p-5 flex items-center justify-between shadow-md">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-sans">Next Route Check</p>
                  <p className="text-xl font-bold mt-2 font-display text-industrial-purple glow-text-purple">{result.next_inspection_date}</p>
                </div>
                <span className="p-3 rounded-xl bg-industrial-950 text-industrial-purple border border-industrial-800">
                  <Calendar size={20} />
                </span>
              </div>
            </div>

            {/* Root Causes probability match */}
            <div className="bg-industrial-900 border border-industrial-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-5 flex items-center gap-2">
                <AlertTriangle className="text-industrial-warn" size={15} />
                Identified Probabilities &amp; Graph Traces
              </h3>
              <div className="flex flex-col gap-4">
                {result.root_causes.map((rc, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="bg-industrial-950 border border-industrial-850 rounded-xl p-4.5 flex flex-col gap-3 group hover:border-industrial-700/60 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">{rc.cause}</p>
                      <span className="text-[10px] font-bold text-industrial-accent bg-industrial-accent/10 px-2.5 py-1 rounded-md border border-industrial-accent/20">
                        {Math.round(rc.probability * 100)}% Match
                      </span>
                    </div>
                    {/* Probability Bar with gradient */}
                    <div className="w-full bg-industrial-900 rounded-full h-2 overflow-hidden border border-industrial-850">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${rc.probability * 100}%` }}
                        transition={{ delay: 0.3 + i * 0.08, duration: 0.8 }}
                        className="bg-gradient-to-r from-industrial-accent to-industrial-purple h-full rounded-full" 
                      />
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                      <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider mr-1.5">Grounded Evidence:</span>
                      {rc.evidence}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Corrective Action Panel */}
            <motion.div 
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-industrial-900 border border-industrial-800 rounded-2xl p-6 shadow-xl relative overflow-hidden"
            >
              {/* Decorative green pulse dot in the corner */}
              <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-900/30 px-2.5 py-1 rounded-full text-emerald-400 text-[10px] font-semibold animate-pulse">
                <CheckCircle2 size={11} />
                <span>Verified System Action</span>
              </div>

              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                Recommended Remediation Task
              </h3>
              <div className="bg-emerald-950/15 border border-emerald-900/20 text-slate-200 text-xs font-semibold rounded-xl px-5 py-4 leading-relaxed tracking-wide shadow-inner">
                {result.recommended_action}
              </div>
            </motion.div>

            {/* Citations */}
            <div className="flex flex-col gap-3">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Grounded Context Records</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.citations.map((cit, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    className="bg-industrial-900 border border-industrial-800 rounded-2xl p-5 flex flex-col gap-3 hover:border-industrial-700/80 transition-all shadow-md group"
                  >
                    <div className="flex items-center gap-2 border-b border-industrial-800 pb-2">
                      <FileText size={14} className="text-industrial-purple" />
                      <span className="text-xs font-bold text-slate-300 truncate group-hover:text-white transition-colors">{cit.document_name}</span>
                    </div>
                    <p className="text-xs text-slate-400 italic leading-relaxed">
                      "{cit.excerpt}"
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
