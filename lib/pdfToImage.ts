import { execFile } from 'child_process'
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises'
import os from 'os'
import path from 'path'
import sharp from 'sharp'

export function isPdf(buffer: Buffer): boolean {
  return buffer.subarray(0, 5).toString('latin1') === '%PDF-'
}

// poppler의 pdftoppm으로 첫 페이지만 150dpi로 렌더한 뒤 JPEG로 저장한다.
// 대형 포스터는 PNG로 두면 10MB 가까이 나와서 긴 변을 4000px로 줄인다(A4는 1240×1754px 그대로).
export async function pdfFirstPageToJpeg(pdf: Buffer): Promise<Buffer> {
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
    return await sharp(await readFile(`${outPrefix}.png`))
      .resize({ width: 4000, height: 4000, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer()
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}
