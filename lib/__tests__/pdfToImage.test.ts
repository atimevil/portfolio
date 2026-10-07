import { describe, it, expect } from 'vitest'
import { execFileSync } from 'child_process'
import sharp from 'sharp'
import { isPdf, pdfFirstPageToJpeg } from '@/lib/pdfToImage'

// 페이지 2장짜리 최소 PDF (xref 없이도 poppler가 복구해서 읽는다)
const PDF = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
    '2 0 obj<</Type/Pages/Kids[3 0 R 4 0 R]/Count 2>>endobj\n' +
    '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 100]>>endobj\n' +
    '4 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 50 50]>>endobj\n' +
    'trailer<</Root 1 0 R>>\n%%EOF\n',
  'latin1',
)

const hasPdftoppm = (() => {
  try {
    execFileSync('pdftoppm', ['-v'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
})()

describe('isPdf', () => {
  it('PDF 시그니처로 판별한다', () => {
    expect(isPdf(PDF)).toBe(true)
    expect(isPdf(Buffer.from([0x89, 0x50, 0x4e, 0x47]))).toBe(false)
  })
})

describe.skipIf(!hasPdftoppm)('pdfFirstPageToJpeg', () => {
  it('첫 페이지만 JPEG로 만든다 (200×100pt → 150dpi에서 417×209px, poppler는 올림)', async () => {
    const jpeg = await pdfFirstPageToJpeg(PDF)
    const meta = await sharp(jpeg).metadata()
    expect(meta.format).toBe('jpeg')
    expect([meta.width, meta.height]).toEqual([417, 209])
  })

  it('대형 포스터는 긴 변을 4000px로 줄인다', async () => {
    // 24×72인치 세로 포스터: 150dpi면 3600×10800px
    const big = Buffer.from(PDF.toString('latin1').replace('[0 0 200 100]', '[0 0 1728 5184]'), 'latin1')
    const meta = await sharp(await pdfFirstPageToJpeg(big)).metadata()
    expect(meta.height).toBe(4000)
    expect(meta.width).toBeLessThan(1400)
  })

  it('깨진 PDF면 예외를 던진다', async () => {
    await expect(pdfFirstPageToJpeg(Buffer.from('%PDF-garbage'))).rejects.toThrow()
  })
})
