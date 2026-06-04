interface TriggrIconProps {
  size?: number
  className?: string
}

/** Triggr brand icon — uses the real app logo from public/favicon_io. */
export function TriggrIcon({ size = 32, className }: TriggrIconProps) {
  return (
    <img
      src="/favicon_io/android-chrome-192x192.png"
      alt="Triggr"
      width={size}
      height={size}
      className={`rounded-lg ${className ?? ''}`}
    />
  )
}

interface TriggrLogoProps {
  iconSize?: number
  className?: string
}

/** Triggr wordmark: icon + logotype, arranged horizontally. */
export function TriggrLogo({ iconSize = 28, className }: TriggrLogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ''}`}>
      <TriggrIcon size={iconSize} />
      <span className="text-foreground text-lg font-bold tracking-tight">
        Triggr
      </span>
    </div>
  )
}
