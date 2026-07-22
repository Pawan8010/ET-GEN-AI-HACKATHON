import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { api, type LessonAlert, type WorkOrderCreateResponse } from '../lib/api'
import {
  Lightbulb,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Bell,
  Sparkles,
  Calendar,
} from 'lucide-react'

export function LessonsLearned() {
  const [alerts, setAlerts] = useState<LessonAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [equipmentList, setEquipmentList] = useState<string[]>([])

  // Form State
  const [equipmentTag, setEquipmentTag] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('Preventive')
  const [technicianId, setTechnicianId] = useState('TECH-07')
  const [date, setDate] = useState('2026-07-16')
  const [submitting, setSubmitting] = useState(false)

  // Results / Warnings
  const [creationResult, setCreationResult] = useState<WorkOrderCreateResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadAlerts = () => {
    setLoading(true)
    api.getLessonsAlerts()
      .then((res) => setAlerts(res.alerts))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadAlerts()
    api.listEquipment()
      .then((list) => {
        setEquipmentList(list)
        if (list.length > 0) setEquipmentTag(list[0])
      })
      .catch((err) => console.error(err))

    const stream = new EventSource('/api/events')
    stream.addEventListener('work-order-warning', (event) => {
      const pushed = JSON.parse((event as MessageEvent).data)
      setCreationResult({ status: 'warning', work_order: pushed.work_order, warning_banner: pushed.warning_banner })
      loadAlerts()
    })
    return () => stream.close()
  }, [])

  const handleCreateWO = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!equipmentTag || !description.trim()) {
      setError('Please fill in all fields.')
      return
    }

    setSubmitting(true)
    setError(null)
    setCreationResult(null)

    try {
      const woPayload = {
        equipment_tag: equipmentTag,
        description: description.trim(),
        type,
        technician_id: technicianId,
        date,
      }
      const data = await api.createWorkOrder(woPayload)
      setCreationResult(data)
      setDescription('') // Clear description on success
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Failed to create work order.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-industrial-950 text-slate-200">
        <div className="flex flex-col items-center gap-3">
          <Bell className="text-industrial-accent animate-spin" size={40} />
          <h2 className="text-sm font-bold tracking-wider font-display uppercase">Mining historic failure logs...</h2>
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
      <div className="border-b border-industrial-800 pb-5">
        <h2 className="text-2xl font-bold text-white font-display flex items-center gap-2">
          <Lightbulb className="text-industrial-accent glow-text-cyan" size={24} />
          Lessons Learned &amp; Failure Intelligence
        </h2>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          Mine historic safety check sheets, standard logs, and near-miss manuals to discover hidden maintenance trends. 
          Auto-validate active schedules to prevent safety hazards before work commences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Failure Intelligence Alerts Feed */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1 flex items-center gap-1.5">
            <Sparkles size={12} className="text-industrial-purple" />
            Systemic Failure Patterns
          </h3>
          <div className="flex flex-col gap-4">
            {alerts.map((alert, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`bg-industrial-900 border rounded-2xl p-5 shadow-lg flex flex-col gap-3.5 relative overflow-hidden transition-all hover:border-industrial-700 ${
                  alert.severity === 'Critical'
                    ? 'border-red-900/50 shadow-red-950/5'
                    : 'border-industrial-800'
                }`}
              >
                {alert.severity === 'Critical' && (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-red-900/5 rounded-full filter blur-xl pointer-events-none"></div>
                )}

                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    {alert.severity === 'Critical' ? (
                      <ShieldAlert className="text-red-400 shrink-0" size={18} />
                    ) : (
                      <AlertTriangle className="text-industrial-warn shrink-0" size={18} />
                    )}
                    <h4 className="text-xs font-bold text-slate-200">{alert.title}</h4>
                  </div>
                  <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded ${
                    alert.severity === 'Critical' ? 'bg-red-950/60 text-red-400 border border-red-900/30' : 'bg-industrial-800 text-slate-400'
                  }`}>
                    {alert.severity}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  {alert.description}
                </p>

                <div className="flex flex-wrap gap-1.5 items-center mt-2 pt-2 border-t border-industrial-800/40">
                  <span className="text-[9px] text-slate-600 font-bold uppercase tracking-wider mr-1">Evidence Records:</span>
                  {alert.linked_incidents.map((ref) => (
                    <span
                      key={ref}
                      className="text-[9px] bg-industrial-950 border border-industrial-850 px-2 py-0.5 rounded text-slate-400 font-mono font-bold"
                    >
                      {ref}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Create Work Order with Proactive Warning */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
            Task Scheduling Terminal
          </h3>

          <AnimatePresence mode="wait">
            {/* Proactive Risk Warning Banner */}
            {creationResult?.warning_banner && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-red-950/30 border border-red-900/50 rounded-2xl p-5 flex flex-col gap-2.5 shadow-xl border-l-4 border-l-red-500 cyber-panel-glow"
              >
                <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider">
                  <Sparkles size={14} className="animate-pulse" />
                  <span>{creationResult.warning_banner.title}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  {creationResult.warning_banner.message}
                </p>
              </motion.div>
            )}

            {creationResult && !creationResult.warning_banner && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-950/15 border border-emerald-900/30 rounded-2xl p-4 flex items-center gap-3"
              >
                <CheckCircle2 className="text-emerald-400 shrink-0 animate-bounce" size={18} />
                <div>
                  <p className="text-xs text-slate-200 font-bold">WO {creationResult.work_order.wo_number} Generated</p>
                  <p className="text-[10px] text-slate-500 font-medium">Asset: {creationResult.work_order.equipment_tag} | Status: {creationResult.work_order.status}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleCreateWO} className="bg-industrial-900 border border-industrial-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Equipment Tag
              </label>
              <div className="relative">
                <select
                  value={equipmentTag}
                  onChange={(e) => setEquipmentTag(e.target.value)}
                  className="w-full appearance-none bg-industrial-950 border border-industrial-800 rounded-xl pl-3 pr-10 py-2.5 text-xs font-semibold text-slate-200 focus:border-industrial-accent/50 outline-none transition cursor-pointer"
                >
                  {equipmentList.map((tag) => (
                    <option key={tag} value={tag} className="bg-industrial-950 text-slate-200">{tag}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Work Order Type
              </label>
              <div className="relative">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full appearance-none bg-industrial-950 border border-industrial-800 rounded-xl pl-3 pr-10 py-2.5 text-xs font-semibold text-slate-200 focus:border-industrial-accent/50 outline-none transition cursor-pointer"
                >
                  <option value="Preventive">Preventive Maintenance</option>
                  <option value="Corrective">Corrective Action</option>
                  <option value="Inspection">Safety / Route Check</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Tech ID
                </label>
                <input
                  type="text"
                  value={technicianId}
                  onChange={(e) => setTechnicianId(e.target.value)}
                  className="w-full bg-industrial-950 border border-industrial-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-industrial-accent/50 transition"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-industrial-950 border border-industrial-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-industrial-accent/50 transition cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Work Description
              </label>
              <textarea
                placeholder="e.g. perform monthly PM checking bearings or disassemble pump casing"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full bg-industrial-950 border border-industrial-800 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-700 outline-none resize-none focus:border-industrial-accent/50 transition"
              />
              <p className="text-[10px] text-slate-500 leading-normal font-medium mt-1">
                💡 <span className="font-bold text-industrial-accent">Risk Test:</span> Type <code className="text-industrial-purple">casing maintenance</code> on asset <code className="text-industrial-purple">PMP-101</code> to activate predictive warning validations.
              </p>
            </div>

            {error && (
              <div className="text-[10px] text-red-400 bg-red-950/20 px-3 py-2 rounded-lg border border-red-900/30">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !description.trim()}
              className="w-full py-3 mt-1 rounded-xl bg-gradient-to-r from-industrial-accent to-industrial-purple hover:brightness-110 disabled:opacity-50 text-industrial-950 font-bold transition text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-industrial-accent/15"
            >
              {submitting ? 'Scheduling WO...' : 'Submit Work Order'}
              {!submitting && <ChevronRight size={14} />}
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  )
}
