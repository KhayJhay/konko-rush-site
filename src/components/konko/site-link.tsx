import type { ReactNode } from "react"

/** A link whose URL may not exist yet: real when set, flagged in development, hidden in production. */
export function SiteLink({ href, env, className, children }: { href: string; env: string; className?: string; children: ReactNode }) {
  if (href)
    return (
      <a href={href} className={className}>
        {children}
      </a>
    )
  if (process.env.NODE_ENV === "development")
    return (
      <span className={className} title={`Set ${env} to turn this into a link. Hidden in production until then.`}>
        <span className="underline decoration-dotted underline-offset-4">{children}</span>
      </span>
    )
  return null
}
