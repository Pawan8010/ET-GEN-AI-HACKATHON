import { Bell, Command, Moon, Search, Sun, UserRound, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { SystemHealthIndicator } from './SystemHealthIndicator'
import { OpsBrainLogo } from '../brand/OpsBrainLogo'
import { api, type LessonAlert } from '../../lib/api'

const destinations = [
  ['copilot', '/copilot'], ['documents', '/documents'], ['assets', '/assets'],
  ['graph', '/graph'], ['rca', '/rca'], ['compliance', '/compliance'],
  ['lessons', '/lessons'], ['insights', '/insights'], ['architecture', '/rag-architecture'],
] as const

export function AppHeader() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [query, setQuery] = useState('')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [alerts, setAlerts] = useState<LessonAlert[]>([])

  useEffect(() => {
    api.getLessonsAlerts().then((response) => setAlerts(response.alerts)).catch(() => setAlerts([]))
  }, [])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const normalized = query.trim().toLowerCase()
    const destination = destinations.find(([label]) => label.includes(normalized))
    navigate(destination?.[1] || `/documents?search=${encodeURIComponent(query.trim())}`)
    setQuery('')
  }

  return (
    <header className="app-topbar sticky top-0 z-40 flex h-16 shrink-0 items-center gap-3 border-b border-industrial-800 bg-industrial-950/80 px-3 backdrop-blur-xl sm:px-5">
      <div className="flex min-w-0 items-center gap-2 md:hidden">
        <div className="brand-mark"><OpsBrainLogo size={28} /></div>
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-white">OpsBrain AI</div>
          <div className="truncate text-[9px] font-semibold uppercase tracking-[.13em] text-slate-500">Operations cloud</div>
        </div>
      </div>

      <form onSubmit={submit} className="mx-auto hidden w-full max-w-xl md:block" role="search">
        <label className="topbar-search flex items-center gap-3 rounded-2xl border border-industrial-800 bg-industrial-900/70 px-4 py-2.5 transition-all focus-within:border-industrial-accent/60 focus-within:ring-4 focus-within:ring-industrial-accent/10">
          <Search size={17} className="shrink-0 text-slate-500" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500" placeholder="Search pages and operational knowledge" aria-label="Search pages and operational knowledge" />
          <span className="hidden items-center gap-1 rounded-md border border-industrial-800 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500 lg:flex"><Command size={10}/> K</span>
        </label>
      </form>

      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        <div className="hidden sm:block"><SystemHealthIndicator /></div>
        <div className="relative">
          <button onClick={() => setNotificationsOpen((open) => !open)} className="icon-button" aria-label="Notifications" aria-expanded={notificationsOpen}><Bell size={17}/>{alerts.length > 0 && <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-industrial-danger px-1 text-[8px] font-black text-white">{Math.min(alerts.length, 9)}</span>}</button>
          {notificationsOpen && <div className="theme-elevated absolute right-0 top-12 z-50 w-[min(340px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-industrial-800 bg-industrial-950/95 shadow-2xl backdrop-blur-2xl">
            <div className="flex items-center justify-between border-b border-industrial-800 px-4 py-3"><div><p className="text-xs font-black text-white">Operational alerts</p><p className="text-[9px] text-slate-500">Connected to Lessons Learned</p></div><button onClick={() => setNotificationsOpen(false)} className="icon-button" aria-label="Close notifications"><X size={15}/></button></div>
            <div className="max-h-80 overflow-y-auto p-2">{alerts.length === 0 ? <p className="px-3 py-7 text-center text-xs text-slate-500">No active operational alerts.</p> : alerts.slice(0, 5).map((alert, index) => <button key={`${alert.title}-${index}`} onClick={() => { setNotificationsOpen(false); navigate('/lessons') }} className="mb-1 w-full rounded-xl border border-transparent px-3 py-3 text-left hover:border-industrial-accent/15 hover:bg-industrial-accent/[.05]"><div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${alert.severity.toLowerCase() === 'high' ? 'bg-red-400' : 'bg-amber-400'}`}/><p className="truncate text-xs font-bold text-slate-200">{alert.title}</p></div><p className="mt-1 line-clamp-2 text-[10px] leading-4 text-slate-500">{alert.description}</p></button>)}</div>
          </div>}
        </div>
        <button onClick={toggleTheme} className="icon-button" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>{theme === 'dark' ? <Sun size={17}/> : <Moon size={17}/>}</button>
        <div className="ml-1 hidden items-center gap-2 rounded-xl border border-industrial-800 bg-industrial-900/60 py-1.5 pl-1.5 pr-3 lg:flex">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-industrial-accent/12 text-industrial-accent"><UserRound size={15}/></span>
          <span className="max-w-28 truncate text-xs font-semibold text-slate-300">{user?.displayName || 'Demo Operator'}</span>
        </div>
      </div>
    </header>
  )
}
