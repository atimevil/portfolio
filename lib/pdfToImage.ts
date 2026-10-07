import { execFile } from 'child_process'
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises'
import os from 'os'
import path from 'path'

export function isPdf(buffer: Buffer): boolean {
  return buffer.subarray(0, 5).toString('latin1') === '%PDF-'
}

// poppler의 pdftoppm으로 첫 페이지만 PNG로 렌더한다. 150dpi면 A4 포스터가 약 1240×1754px.
export async function pdfFirstPageToPng(pdf: Buffer): Promise<Buffer> {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'pdf2png-'))
  try {
    const input = path.join(dir, 'in.pdf')
    const outPrefix = path.join(dir, 'out')
    await writeFile(input, pdf)
    await new Promise<void>((resolve, reject) => {
      execFile(
        'pdftoppm',
        ['-png', '-r', '150', '-f', '1', '-l', '1', '-singlefile', input, outPrefix],
        { timeout: 30_000 },
        (err) => (err ? reject(err) : resolve()),
      )
    })
    return await readFile(`${outPrefix}.png`)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}
