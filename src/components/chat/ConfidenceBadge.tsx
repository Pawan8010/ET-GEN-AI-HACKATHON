interface Props {
  confidence: number
  reason: string
}

export function ConfidenceBadge({ confidence, reason }: Props) {
  const pct = Math.round(confidence * 100)
  const tier = confidence >= 0.8 ? 'high' : confidence >= 0.5 ? 'medium' : 'low'

  const styles: Record<string, string> = {
    high: 'bg-emerald-950 text-emerald-400 border-emerald-800',
    medium: 'bg-amber-950 text-amber-400 border-amber-800',
    low: 'bg-red-950 text-red-400 border-red-800',
  }

  return (
    <div className={`inline-flex flex-col gap-0.5 rounded-lg border px-3 py-1.5 text-xs ${styles[tier]}`}>
      <span className="font-semibold">{pct}% confidence</span>
      <span className="text-[11px] opacity-80 font-normal max-w-xs">{reason}</span>
    </div>
  )
}
