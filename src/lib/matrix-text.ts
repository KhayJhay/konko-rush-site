import { digits, type Frame } from "@/components/ui/matrix"

const GLYPHS: Record<string, number[][]> = {
  "/": [[0,0,0,0,1],[0,0,0,1,0],[0,0,0,1,0],[0,0,1,0,0],[0,1,0,0,0],[0,1,0,0,0],[1,0,0,0,0]],
  P: [[1,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0]],
  G: [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,0],[1,0,1,1,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
  O: [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
  "!": [[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,0,0,0],[0,0,1,0,0]],
  K: [[1,0,0,0,1],[1,0,0,1,0],[1,0,1,0,0],[1,1,0,0,0],[1,0,1,0,0],[1,0,0,1,0],[1,0,0,0,1]],
  M: [[1,0,0,0,1],[1,1,0,1,1],[1,0,1,0,1],[1,0,1,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1]],
}

/** Sets digits, colons and a few letters in the ElevenLabs Matrix dot grid. */
export function matrixText(text: string): { frame: Frame; cols: number } {
  const rows: number[][] = Array.from({ length: 7 }, () => [])
  ;[...text].forEach((ch, i) => {
    if (i) rows.forEach((r) => r.push(0))
    if (ch === ":") rows.forEach((r, y) => r.push(y === 2 || y === 4 ? 1 : 0))
    else if (ch === ".") rows.forEach((r, y) => r.push(y === 6 ? 1 : 0))
    else if (ch === " ") rows.forEach((r) => r.push(0, 0, 0, 0, 0))
    else if (GLYPHS[ch]) GLYPHS[ch].forEach((row, y) => rows[y].push(...row))
    else digits[Number(ch)].forEach((row, y) => rows[y].push(...row))
  })
  return { frame: rows, cols: rows[0].length }
}
