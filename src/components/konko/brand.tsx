/** The game icon and wordmark. */
export function Brand({ className }: { className?: string }) {
  return (
    <span className={className}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/img/icon.png" alt="" width={34} height={34} className="size-[1.9em] rounded-[0.45em]" />
      <span>
        KonKo <span className="text-signal">Rush</span>
      </span>
    </span>
  )
}
