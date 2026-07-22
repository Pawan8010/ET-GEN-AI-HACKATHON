interface Props {
  size?: number
  className?: string
  title?: string
}

export function OpsBrainLogo({ size = 40, className = '', title = 'OpsBrain AI' }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} role="img" aria-label={title}>
      <defs>
        <linearGradient id="opsbrain-mark" x1="7" y1="5" x2="42" y2="43" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8AB4F8" />
          <stop offset=".48" stopColor="#4285F4" />
          <stop offset="1" stopColor="#1A73E8" />
        </linearGradient>
      </defs>
      <path d="M24 4.5c10.77 0 19.5 8.73 19.5 19.5S34.77 43.5 24 43.5 4.5 34.77 4.5 24 13.23 4.5 24 4.5Z" stroke="url(#opsbrain-mark)" strokeWidth="2.2" opacity=".42"/>
      <path d="M14.5 28.2V20l7.2-4.2 6.6 3.8 5.2-3v8.1l-5.2 3-6.6-3.8-7.2 4.3Z" stroke="url(#opsbrain-mark)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21.7 15.8v8.1m6.6-4.3v8.1" stroke="url(#opsbrain-mark)" strokeWidth="2.1" strokeLinecap="round" opacity=".8"/>
      <circle cx="14.5" cy="20" r="2.7" fill="#1A73E8"/>
      <circle cx="14.5" cy="28.2" r="2.7" fill="#4285F4"/>
      <circle cx="21.7" cy="15.8" r="2.7" fill="#8AB4F8"/>
      <circle cx="21.7" cy="23.9" r="2.7" fill="#1A73E8"/>
      <circle cx="28.3" cy="19.6" r="2.7" fill="#4285F4"/>
      <circle cx="28.3" cy="27.7" r="2.7" fill="#8AB4F8"/>
      <circle cx="33.5" cy="16.6" r="2.7" fill="#1A73E8"/>
      <circle cx="33.5" cy="24.7" r="2.7" fill="#4285F4"/>
      <path d="M18 35.5h12" stroke="url(#opsbrain-mark)" strokeWidth="2.2" strokeLinecap="round"/>
    </svg>
  )
}
