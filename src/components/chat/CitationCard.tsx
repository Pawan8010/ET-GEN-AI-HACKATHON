import { FileText, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Citation } from '../../lib/api'
import type { Key } from 'react'

export function CitationCard({ citation, index }: { citation: Citation; index: number; key?: Key }) {
  return <Link to={`/documents?docId=${encodeURIComponent(citation.document_id)}`} className="group rounded-xl border border-white/[.08] bg-white/[.025] p-3.5 hover:border-industrial-accent/35 hover:bg-industrial-accent/[.035] transition-all" aria-label={`Open source ${citation.document_name}`}>
    <div className="flex items-center gap-2 text-xs"><span className="flex h-5 w-5 items-center justify-center rounded bg-industrial-accent/10 text-[10px] font-black text-industrial-accent">{index + 1}</span><FileText size={13} className="text-slate-500"/><span className="min-w-0 flex-1 truncate font-semibold text-slate-300">{citation.document_name}</span><ArrowUpRight size={13} className="text-slate-600 group-hover:text-industrial-accent"/></div>
    {citation.section && <div className="mt-1.5 text-[10px] uppercase tracking-wider text-slate-600">{citation.section}</div>}
    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{citation.excerpt}</p>
  </Link>
}
