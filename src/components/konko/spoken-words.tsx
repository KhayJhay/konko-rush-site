"use client"

import { Fragment } from "react"

import { cn } from "@/lib/utils"

/** A line of speech whose words light up as they are said. */
export function SpokenWords({ text, active, word, className }: { text: string; active: boolean; word: number; className?: string }) {
  return (
    <span className={className}>
      {text.split(" ").map((w, i) => (
        <Fragment key={i}>
          <span className={cn("whitespace-nowrap transition-opacity duration-200", active && i > word && "opacity-40")}>{w}</span>{" "}
        </Fragment>
      ))}
    </span>
  )
}
