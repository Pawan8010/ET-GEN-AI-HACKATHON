import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, BarChart3, BookOpenCheck, Bot, Check, ChevronRight, Database,
  FileSearch, GitBranch, Menu, Network, Search, ShieldCheck, Sparkles, UploadCloud,
  Wrench, X, Zap,
} from 'lucide-react'
import { motion } from 'motion/react'
import { OpsBrainLogo } from '../components/brand/OpsBrainLogo'
import { api, type RAGStatusResponse } from '../lib/api'

const workflow = [
  { icon: UploadCloud, label: 'Ingest', detail: 'PDF, DOCX, sheets & scans', color: '#60a5fa' },
  { icon: FileSearch, label: 'Understand', detail: 'OCR, metadata & smart chunks', color: '#22d3ee' },
  { icon: Database, label: 'Index', detail: 'Vector, keyword & metadata', color: '#34d399' },
  { icon: Network, label: 'Connect', detail: 'Entities & knowledge graph', color: '#a78bfa' },
  { icon: Search, label: 'Retrieve', detail: 'Hybrid search & reranking', color: '#fbbf24' },
  { icon: Bot, label: 'Answer', detail: 'Grounded AI with citations', color: '#fb7185' },
]

const capabilities = [
  { icon: Bot, title: 'Knowledge Copilot', body: 'Ask operational questions in plain language and receive evidence-backed answers with document-level citations.' },
  { icon: GitBranch, title: 'Graph Intelligence', body: 'Trace relationships across assets, incidents, procedures, operators, regulations, and maintenance history.' },
  { icon: ShieldCheck, title: 'Compliance AI', body: 'Map evidence to controls, expose missing clauses, and prioritize corrective actions before the next audit.' },
  { icon: Wrench, title: 'Root Cause Analysis', body: 'Build structured 5-Why and evidence-led RCA reports from connected operating knowledge.' },
  { icon: BookOpenCheck, title: 'Living Knowledge Base', body: 'Every upload is parsed, chunked, indexed, and connected automatically—no manual training button.' },
  { icon: BarChart3, title: 'Operational Insights', body: 'Monitor corpus health, coverage, confidence, knowledge gaps, and system activity in one view.' },
]

function AnimatedWorkflow() {
  return (
    <div className="landing-workflow relative overflow-hidden rounded-[32px] border border-white/10 bg-[#0d1729]/85 p-4 shadow-2xl shadow-blue-950/30 backdrop-blur-xl sm:p-7">
      <div className="mb-7 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[.24em] text-cyan-300">Live knowledge flow</p>
          <p className="mt-1 text-sm font-semibold text-white">From raw evidence to trusted action</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-bold text-emerald-300">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> AUTOMATED
        </div>
      </div>

      <div className="relative grid gap-3 md:grid-cols-6 md:gap-2">
        <div className="absolute left-[8.5%] right-[8.5%] top-7 hidden h-px bg-white/10 md:block" />
        <motion.div
          className="absolute left-[8.5%] top-[25px] hidden h-[3px] w-20 rounded-full bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_16px_#22d3ee] md:block"
          animate={{ left: ['8%', '78%', '8%'] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
        {workflow.map(({ icon: Icon, label, detail, color }, index) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: .5 }}
            transition={{ delay: index * .08 }}
            className="relative z-10 flex items-center gap-4 rounded-2xl border border-white/[.07] bg-white/[.035] p-3 md:flex-col md:border-0 md:bg-transparent md:p-0 md:text-center"
          >
            <motion.div
              className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border bg-[#101d33] shadow-lg md:h-14 md:w-14"
              style={{ borderColor: `${color}55`, color }}
              animate={{ boxShadow: [`0 0 0px ${color}00`, `0 0 22px ${color}35`, `0 0 0px ${color}00`] }}
              transition={{ duration: 3, delay: index * .35, repeat: Infinity }}
            ><Icon size={20} /></motion.div>
            <div><p className="text-xs font-extrabold text-white">{label}</p><p className="mt-1 text-[10px] leading-4 text-slate-400">{detail}</p></div>
            {index < workflow.length - 1 && <ChevronRight className="ml-auto text-slate-600 md:hidden" size={16} />}
          </motion.div>
        ))}
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="rounded-2xl border border-white/[.07] bg-[#08111f] p-4">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500"><Sparkles size={12} className="text-cyan-300" /> Grounded response</div>
          <p className="mt-3 text-sm leading-6 text-slate-200">The PMP-101 near miss was caused by incomplete lockout/tagout verification before casing removal.</p>
          <div className="mt-3 flex flex-wrap gap-2 text-[9px] font-bold text-blue-200">
            <span className="rounded-full bg-blue-400/10 px-2.5 py-1">INC-2025-11-08-003</span>
            <span className="rounded-full bg-blue-400/10 px-2.5 py-1">OISD-STD-105 §5.2</span>
          </div>
        </div>
        <div className="flex min-w-32 items-center justify-center rounded-2xl border border-emerald-400/15 bg-emerald-400/[.06] p-4 text-center">
          <div><p className="text-2xl font-black text-emerald-300">68%</p><p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-emerald-200/60">Evidence confidence</p></div>
        </div>
      </div>
    </div>
  )
}

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [status, setStatus] = useState<RAGStatusResponse | null>(null)

  useEffect(() => { api.ragStatus().then(setStatus).catch(() => setStatus(null)) }, [])

  return (
    <div className="landing-page min-h-screen overflow-hidden bg-[#07101f] text-white">
      <div className="landing-orb landing-orb-one" /><div className="landing-orb landing-orb-two" />
      <header className="sticky top-0 z-50 border-b border-white/[.06] bg-[#07101f]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 lg:px-8">
          <a href="#top" className="flex items-center gap-3"><OpsBrainLogo size={38}/><div><p className="text-base font-black leading-none">OpsBrain AI</p><p className="mt-1 text-[8px] font-bold uppercase tracking-[.24em] text-slate-500">Operations intelligence</p></div></a>
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#workflow" className="text-xs font-semibold text-slate-400 hover:text-white">How it works</a>
            <a href="#capabilities" className="text-xs font-semibold text-slate-400 hover:text-white">Capabilities</a>
            <a href="#trust" className="text-xs font-semibold text-slate-400 hover:text-white">Why OpsBrain</a>
          </nav>
          <div className="hidden items-center gap-3 md:flex"><Link to="/copilot" className="text-xs font-bold text-slate-300 hover:text-white">Sign in</Link><Link to="/copilot" className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-xs font-extrabold shadow-lg shadow-blue-500/20 hover:bg-blue-400">Open platform <ArrowRight size={14}/></Link></div>
          <button aria-label="Toggle navigation" onClick={() => setMenuOpen(!menuOpen)} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 md:hidden">{menuOpen ? <X/> : <Menu/>}</button>
        </div>
        {menuOpen && <div className="border-t border-white/[.06] bg-[#091426] px-5 py-4 md:hidden"><div className="flex flex-col gap-4"><a href="#workflow" onClick={() => setMenuOpen(false)}>How it works</a><a href="#capabilities" onClick={() => setMenuOpen(false)}>Capabilities</a><a href="#trust" onClick={() => setMenuOpen(false)}>Why OpsBrain</a><Link to="/copilot" className="rounded-xl bg-blue-500 px-4 py-3 text-center font-bold">Open platform</Link></div></div>}
      </header>

      <main id="top" className="relative z-10">
        <section className="mx-auto grid max-w-7xl gap-14 px-5 pb-24 pt-16 lg:grid-cols-[1.03fr_.97fr] lg:items-center lg:px-8 lg:pb-32 lg:pt-24">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65 }}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/[.08] px-3.5 py-2 text-[10px] font-black uppercase tracking-[.2em] text-blue-200"><Zap size={12} /> Enterprise operational intelligence</div>
            <h1 className="max-w-3xl text-[2.8rem] font-black leading-[.98] tracking-[-.045em] sm:text-6xl lg:text-[4.7rem]">Turn scattered knowledge into <span className="landing-gradient-text">confident action.</span></h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">One grounded AI platform for procedures, incidents, assets, regulations, and maintenance history. Find the right evidence before the next decision matters.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row"><Link to="/copilot" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-500 px-6 py-3.5 text-sm font-black shadow-xl shadow-blue-500/20 hover:-translate-y-0.5 hover:bg-blue-400">Launch OpsBrain <ArrowRight size={17}/></Link><a href="#workflow" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[.04] px-6 py-3.5 text-sm font-bold text-slate-200 hover:bg-white/[.08]">Watch the workflow <ChevronRight size={16}/></a></div>
            <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] font-semibold text-slate-500"><span className="flex items-center gap-1.5"><Check size={13} className="text-emerald-400"/> Citation-first answers</span><span className="flex items-center gap-1.5"><Check size={13} className="text-emerald-400"/> Automatic indexing</span><span className="flex items-center gap-1.5"><Check size={13} className="text-emerald-400"/> Role-based access</span></div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .7, delay: .12 }}><AnimatedWorkflow /></motion.div>
        </section>

        <section className="border-y border-white/[.06] bg-white/[.025]">
          <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-white/[.06] px-5 sm:grid-cols-4 sm:divide-y-0 lg:px-8">
            {[
              [status?.indexed_documents ?? '—', 'Indexed documents'], [status?.total_chunks ?? '—', 'Searchable chunks'], [status?.entity_index_size ?? '—', 'Connected entities'], [status?.connected ? 'Live' : 'Checking', 'Grounded engine'],
            ].map(([value,label]) => <div key={String(label)} className="px-4 py-7 text-center"><p className="text-2xl font-black text-white">{value}</p><p className="mt-1 text-[9px] font-bold uppercase tracking-[.16em] text-slate-500">{label}</p></div>)}
          </div>
        </section>

        <section id="workflow" className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
          <div className="mx-auto mb-12 max-w-2xl text-center"><p className="text-[10px] font-black uppercase tracking-[.25em] text-cyan-300">Always learning, never guessing</p><h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">Knowledge flows automatically</h2><p className="mt-5 text-sm leading-7 text-slate-400 sm:text-base">Upload once. OpsBrain transforms source material into secure, searchable intelligence and refreshes every connected experience.</p></div>
          <AnimatedWorkflow />
        </section>

        <section id="capabilities" className="border-y border-white/[.06] bg-[#0a1425] py-24 lg:py-32">
          <div className="mx-auto max-w-7xl px-5 lg:px-8"><div className="mb-12 max-w-2xl"><p className="text-[10px] font-black uppercase tracking-[.25em] text-blue-300">One operational brain</p><h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">Built for work that cannot rely on guesses</h2></div><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{capabilities.map(({icon:Icon,title,body},i)=><motion.article key={title} initial={{opacity:0,y:18}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.06}} className="group rounded-3xl border border-white/[.07] bg-white/[.03] p-6 hover:-translate-y-1 hover:border-blue-400/25 hover:bg-white/[.05]"><div className="grid h-11 w-11 place-items-center rounded-2xl border border-blue-400/15 bg-blue-400/[.08] text-blue-300"><Icon size={20}/></div><h3 className="mt-6 text-lg font-extrabold">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-400">{body}</p></motion.article>)}</div></div>
        </section>

        <section id="trust" className="mx-auto grid max-w-7xl gap-12 px-5 py-24 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-32">
          <div><p className="text-[10px] font-black uppercase tracking-[.25em] text-emerald-300">Trust built into every answer</p><h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">See the evidence.<br/>Understand the confidence.</h2><p className="mt-6 max-w-xl text-base leading-7 text-slate-400">OpsBrain does not hide retrieval behind a chat bubble. Every response exposes its sources, confidence, related documents, and graph context so teams can verify before acting.</p><Link to="/copilot" className="mt-8 inline-flex items-center gap-2 text-sm font-black text-blue-300 hover:text-blue-200">Explore the grounded Copilot <ArrowRight size={16}/></Link></div>
          <div className="rounded-[32px] border border-white/10 bg-gradient-to-br from-blue-500/10 to-cyan-400/[.03] p-5 sm:p-7"><div className="rounded-2xl border border-white/[.07] bg-[#08111f] p-5"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-500 text-white"><Bot size={18}/></div><div><p className="text-xs font-extrabold">Grounded Copilot</p><p className="text-[9px] text-emerald-300">● Engine connected</p></div></div><p className="mt-5 text-sm leading-7 text-slate-200">Independent verification of VLV-204 closure was missing, and the unreliable position indicator was not communicated during shift handover.</p><div className="mt-5 grid gap-2 sm:grid-cols-2"><div className="rounded-xl bg-white/[.04] p-3"><p className="text-[9px] uppercase text-slate-500">Primary evidence</p><p className="mt-1 text-xs font-bold text-blue-200">PMP-101 near-miss report</p></div><div className="rounded-xl bg-white/[.04] p-3"><p className="text-[9px] uppercase text-slate-500">Control reference</p><p className="mt-1 text-xs font-bold text-blue-200">OISD-STD-105 §5.2</p></div></div></div></div>
        </section>

        <section className="px-5 pb-24 lg:px-8"><div className="mx-auto max-w-7xl overflow-hidden rounded-[36px] border border-blue-300/15 bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-12 text-center shadow-2xl shadow-blue-950/30 sm:px-12 sm:py-16"><h2 className="text-3xl font-black tracking-tight sm:text-5xl">Your operations already know the answer.</h2><p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">OpsBrain makes that knowledge connected, searchable, and ready when your team needs it.</p><Link to="/copilot" className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-black text-blue-700 shadow-lg hover:-translate-y-0.5">Get started <ArrowRight size={17}/></Link></div></section>
      </main>

      <footer className="border-t border-white/[.06] px-5 py-8"><div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left"><div className="flex items-center gap-2"><OpsBrainLogo size={28}/><span className="text-xs font-black">OpsBrain AI</span></div><p className="text-[10px] text-slate-600">Industrial knowledge intelligence · Built for trusted operational decisions</p></div></footer>
    </div>
  )
}
