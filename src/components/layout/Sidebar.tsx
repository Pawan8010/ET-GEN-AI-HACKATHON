import { NavLink } from 'react-router-dom'
import { Bot, Files, Factory, Network, ScanSearch, ShieldCheck, Lightbulb, BarChart3, Workflow, LogOut, ChevronLeft, ChevronRight, MoreHorizontal, Moon, Sun, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { OpsBrainLogo } from '../brand/OpsBrainLogo'

const links = [
  ['/copilot', 'Copilot', Bot], ['/documents', 'Documents', Files], ['/assets', 'Assets', Factory],
  ['/graph', 'Graph', Network], ['/rca', 'RCA', ScanSearch], ['/compliance', 'Compliance', ShieldCheck],
  ['/lessons', 'Lessons', Lightbulb], ['/insights', 'Insights', BarChart3], ['/rag-architecture', 'Architecture', Workflow],
] as const

export function Sidebar() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [collapsed, setCollapsed] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1100)
  return <aside className={`hidden md:flex ${collapsed ? 'w-[76px]' : 'w-[248px]'} shrink-0 flex-col border-r border-industrial-800 bg-industrial-950/90 backdrop-blur-2xl relative z-30 transition-[width] duration-300`}>
    <div className="h-16 flex items-center gap-3 px-[17px] border-b border-industrial-800">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-industrial-accent/20 bg-industrial-accent/8 shadow-[0_8px_24px_rgba(26,115,232,.12)]"><OpsBrainLogo size={34}/></div>
      {!collapsed && <div className="min-w-0"><div className="font-black tracking-[-.03em] text-[15px] text-white">OpsBrain <b className="text-industrial-accent">AI</b></div><div className="text-[9px] uppercase tracking-[.18em] text-slate-600 font-bold">Operations cloud</div></div>}
    </div>
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Primary navigation">{!collapsed && <div className="px-3 pb-2 text-[9px] font-bold uppercase tracking-[.18em] text-slate-700">Workspace</div>}{links.map(([to,label,Icon]) =>
      <NavLink key={to} to={to} title={label} className={({isActive}) => `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-industrial-accent/15 to-industrial-accent/[.035] text-cyan-100 ring-1 ring-inset ring-industrial-accent/20 shadow-[0_8px_24px_rgba(34,211,238,.05)]' : 'text-slate-500 hover:text-slate-200 hover:bg-white/[.035]'}`}>
        {({isActive}) => <><span className={`absolute -left-3 h-5 w-0.5 rounded-r-full transition ${isActive ? 'bg-industrial-accent' : 'bg-transparent'}`}/><Icon size={18} className={`shrink-0 transition-transform group-hover:scale-105 ${isActive ? 'text-industrial-accent' : ''}`}/>{!collapsed && <span className="flex-1">{label}</span>}{isActive && !collapsed && <ChevronRight size={13} className="text-industrial-accent/70"/>}</>}
      </NavLink>)}</nav>
    <div className="p-3 border-t border-industrial-800 space-y-1"><button onClick={() => setCollapsed(value => !value)} className="group w-full flex items-center gap-3 rounded-xl px-2.5 py-2 text-slate-500 hover:text-industrial-accent hover:bg-industrial-accent/[.06] transition" title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/[.04]">{collapsed ? <ChevronRight size={15}/> : <ChevronLeft size={15}/>}</span>{!collapsed && <span className="text-xs font-semibold">Collapse sidebar</span>}</button><button onClick={toggleTheme} className="group w-full flex items-center gap-3 rounded-xl px-2.5 py-2 text-slate-500 hover:text-industrial-accent hover:bg-industrial-accent/[.06] transition" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/[.04]">{theme === 'dark' ? <Sun size={15}/> : <Moon size={15}/>}</span>{!collapsed && <span className="text-xs font-semibold">{theme === 'dark' ? 'Light appearance' : 'Dark appearance'}</span>}</button><button onClick={() => void logout()} className="group w-full flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/[.06] transition" title="Sign out"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/[.04]"><LogOut size={15}/></span>{!collapsed && <span className="min-w-0 text-left"><span className="block truncate text-xs font-semibold text-slate-300">{user?.displayName || 'Demo Operator'}</span><span className="block text-[9px] uppercase tracking-wider">Sign out</span></span>}</button></div>
  </aside>
}

export function MobileNav() {
  const { theme, toggleTheme } = useTheme()
  const [moreOpen, setMoreOpen] = useState(false)
  const primary = links.slice(0, 4)
  const secondary = links.slice(4)
  return <>
    {moreOpen && <div className="fixed inset-0 z-40 bg-slate-950/25 backdrop-blur-sm md:hidden" onClick={() => setMoreOpen(false)} aria-hidden="true" />}
    {moreOpen && <div className="theme-elevated fixed bottom-[82px] left-3 right-3 z-50 rounded-3xl border border-industrial-800 bg-industrial-950/95 p-3 shadow-2xl backdrop-blur-2xl md:hidden" role="dialog" aria-label="More navigation">
      <div className="mb-2 flex items-center justify-between px-2"><span className="text-xs font-bold text-white">More tools</span><button onClick={() => setMoreOpen(false)} className="icon-button" aria-label="Close more navigation"><X size={17}/></button></div>
      <div className="grid grid-cols-3 gap-2">{secondary.map(([to,label,Icon]) => <NavLink key={to} to={to} onClick={() => setMoreOpen(false)} className={({isActive}) => `flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border px-2 py-3 text-[10px] font-bold ${isActive ? 'border-industrial-accent/30 bg-industrial-accent/10 text-industrial-accent' : 'border-industrial-800 bg-industrial-900/60 text-slate-400'}`}><Icon size={19}/><span>{label}</span></NavLink>)}<button onClick={toggleTheme} className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-industrial-800 bg-industrial-900/60 px-2 py-3 text-[10px] font-bold text-slate-400" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>{theme === 'dark' ? <Sun size={19}/> : <Moon size={19}/>}<span>Theme</span></button></div>
    </div>}
    <nav className="theme-elevated md:hidden fixed bottom-[max(10px,env(safe-area-inset-bottom))] left-2.5 right-2.5 z-50 grid grid-cols-5 rounded-2xl border border-white/10 bg-[#0b1220]/95 p-1.5 shadow-[0_18px_60px_rgba(0,0,0,.45)] backdrop-blur-2xl" aria-label="Mobile navigation">{primary.map(([to,label,Icon]) =>
      <NavLink key={to} to={to} className={({isActive}) => `flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[9px] font-bold transition ${isActive ? 'bg-industrial-accent/10 text-industrial-accent' : 'text-slate-500 active:bg-white/5'}`}><Icon size={17}/><span className="truncate">{label}</span></NavLink>)}<button onClick={() => setMoreOpen(value => !value)} className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[9px] font-bold ${moreOpen ? 'bg-industrial-accent/10 text-industrial-accent' : 'text-slate-500'}`} aria-label="More navigation"><MoreHorizontal size={17}/><span>More</span></button></nav>
  </>
}
