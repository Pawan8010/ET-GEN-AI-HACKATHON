import { useState, KeyboardEvent } from 'react'
import { Send, Sparkles } from 'lucide-react'

interface Props {
  onSend: (text: string) => void
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState('')

  const submit = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="chat-composer group flex min-w-0 items-end gap-1.5 sm:gap-2 rounded-2xl border border-white/10 bg-industrial-850/95 p-1.5 sm:p-2 shadow-[0_16px_48px_rgba(0,0,0,.2)] transition focus-within:border-industrial-accent/45 focus-within:shadow-[0_0_0_3px_rgba(26,115,232,.08),0_16px_48px_rgba(0,0,0,.18)]">
      <div className="mb-1 hidden h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[.035] text-slate-500 group-focus-within:text-industrial-accent sm:grid"><Sparkles size={16}/></div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask about equipment history, compliance, or procedures…"
        rows={1}
        className="min-w-0 flex-1 resize-none bg-transparent text-sm leading-6 text-slate-100 placeholder:text-slate-600 outline-none px-2 py-2 max-h-32 min-h-10"
      />
      <button
        onClick={submit}
        disabled={disabled || !value.trim()}
        aria-label="Send message"
        className="mb-0.5 shrink-0 rounded-xl bg-gradient-to-br from-industrial-accent to-industrial-purple p-2.5 text-white shadow-[0_6px_20px_rgba(26,115,232,.22)] transition hover:brightness-110 active:scale-95 disabled:opacity-30 disabled:shadow-none disabled:cursor-not-allowed"
      >
        <Send size={16} />
      </button>
    </div>
  )
}
