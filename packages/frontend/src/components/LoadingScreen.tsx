/** Full-screen loading state with pulsing Triggr logo and wordmark. */
export function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex animate-pulse items-center gap-4">
        <img
          src="/favicon_io/android-chrome-192x192.png"
          alt="Triggr"
          width={44}
          height={44}
          className="rounded-xl"
        />
        <div className="bg-border h-8 w-px" />
        <span className="text-foreground text-xl font-bold tracking-tight">
          Triggr
        </span>
      </div>
    </div>
  )
}
