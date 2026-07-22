import { useEffect, useState } from 'react'
import { Activity } from 'lucide-react'
import { api } from '../../lib/api'

export function SystemHealthIndicator() {
  const [state, setState] = useState<'healthy'|'degraded'|'offline'>('offline')
  const [latency, setLatency] = useState(0)
  useEffect(() => {
    let active = true
    const poll = async () => {
      const started = performance.now()
      try {
        const [health, rag] = await Promise.all([api.health(), api.ragStatus()])
        if (active) { setLatency(Math.round(performance.now() - started)); setState(health.status === 'ok' && rag.database_connected ? 'healthy' : 'offline') }
      } catch { if (active) setState('offline') }
    }
    void poll(); const timer = window.setInterval(poll, 15000)
    return () => { active = false; clearInterval(timer) }
  }, [])
  const color = state === 'healthy' ? 'bg-emerald-400' : state === 'degraded' ? 'bg-amber-400' : 'bg-red-400'
  return <div className="system-health flex items-center gap-2 rounded-full border border-industrial-800 bg-industrial-900/90 px-3 py-1.5 shadow-sm backdrop-blur-xl" title={`System ${state}`}>
    <Activity size={12} className="text-slate-500"/><span className={`h-2 w-2 rounded-full ${color} ${state === 'healthy' ? 'animate-pulse' : ''}`}/><span className="hidden sm:inline text-[10px] font-bold uppercase text-slate-400">{state}</span><span className="font-mono text-[10px] text-slate-600">{latency}ms</span>
  </div>
}
