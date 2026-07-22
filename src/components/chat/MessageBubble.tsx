import React from 'react'
import { Bot, User } from 'lucide-react'
import type { QueryResponse } from '../../lib/api'
import { CitationCard } from './CitationCard'
import { ConfidenceBadge } from './ConfidenceBadge'

export type ChatMessage =
  | { role: 'user'; text: string }
  | { role: 'assistant'; response: QueryResponse }
  | { role: 'assistant-loading' }
  | { role: 'assistant-error'; error: string }

export function MessageBubble({ message }: { message: ChatMessage; key?: React.Key }) {
  if (message.role === 'user') {
    return (
      <div className="flex gap-2.5 sm:gap-3 justify-end">
        <div className="max-w-[88%] sm:max-w-[78%] rounded-2xl rounded-tr-md bg-gradient-to-br from-industrial-accent to-industrial-purple text-white px-4 py-3 text-sm font-semibold shadow-[0_8px_30px_rgba(26,115,232,.18)]">
          {message.text}
        </div>
        <div className="w-9 h-9 rounded-xl border border-white/10 bg-industrial-800 flex items-center justify-center shrink-0 shadow-lg">
          <User size={16} />
        </div>
      </div>
    )
  }

  if (message.role === 'assistant-loading') {
    return (
      <div className="flex gap-3">
        <BotAvatar />
        <div className="surface-glass rounded-2xl rounded-tl-md px-4 py-3 text-sm text-slate-400 animate-pulse">
          Searching documents and knowledge graph…
        </div>
      </div>
    )
  }

  if (message.role === 'assistant-error') {
    return (
      <div className="flex gap-3">
        <BotAvatar />
        <div className="rounded-2xl rounded-tl-sm bg-red-950 border border-red-900 px-4 py-3 text-sm text-red-300">
          {message.error}
        </div>
      </div>
    )
  }

  const { response } = message
  return (
    <div className="flex gap-2.5 sm:gap-3">
      <BotAvatar />
      <div className="flex flex-col gap-3 min-w-0 max-w-[calc(100%-46px)] sm:max-w-[88%]">
        <div className="surface-glass rounded-2xl rounded-tl-md px-4 sm:px-5 py-4 text-sm text-slate-200 whitespace-pre-wrap leading-7">
          {response.answer}
        </div>

        <ConfidenceBadge confidence={response.confidence} reason={response.confidence_reason} />

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-white/[.07] bg-black/20 px-3 py-2 text-[10px] font-mono text-slate-500" aria-label="Retrieval diagnostics">
          <span className="font-bold uppercase tracking-wider text-slate-600">Retrieval</span>
          <span><b className="text-industrial-accent">{response.retrieval_debug.vector_hits}</b> vector</span>
          <span><b className="text-industrial-purple">{response.retrieval_debug.graph_hits}</b> graph</span>
          <span><b className="text-emerald-400">{response.retrieval_debug.keyword_hits}</b> keyword</span>
        </div>

        {response.citations.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">Sources</span>
            {response.citations.map((c, i) => (
              <CitationCard key={i} citation={c} index={i} />
            ))}
          </div>
        )}

        {response.related_entities.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {response.related_entities
              .filter((e) => e.type === 'Equipment')
              .map((e) => (
                <span
                  key={e.id}
                  className="text-[11px] rounded-full border border-industrial-700 bg-industrial-800 px-2.5 py-1 text-slate-300"
                >
                  {e.name}
                </span>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

function BotAvatar() {
  return (
    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-industrial-accent/20 to-industrial-purple/10 border border-industrial-accent/25 flex items-center justify-center shrink-0 shadow-[0_8px_24px_rgba(34,211,238,.08)]">
      <Bot size={16} className="text-industrial-accent" />
    </div>
  )
}
