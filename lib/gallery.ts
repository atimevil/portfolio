import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { stripImageMetadata } from '@/lib/stripMetadata'
import { detectImageExt } from '@/lib/imageExt'
import { readJsonFile, readJsonFileOr, writeJsonAtomic } from '@/lib/jsonFile'
import type { GalleryImage } from '@/types'

const META_FILE = path.join(process.cwd(), 'content/gallery.json')
const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads/gallery')
const THUMB_DIR = path.join(UPLOAD_DIR, 'thumbs')

// 저장 경로용 — 깨진 파일이면 예외를 올려 빈 목록으로 덮어쓰지 않는다
function readMeta(): GalleryImage[] {
  return readJsonFile<GalleryImage[]>(META_FILE, [])
}

function writeMeta(data: GalleryImage[]): void {
  writeJsonAtomic(META_FILE, data)
}

// 화면 표시용 — 파일이 깨져도 /gallery가 500이 되지 않는다(빈 목록)
export function getGalleryImages(): GalleryImage[] {
  return readJsonFileOr<GalleryImage[]>(META_FILE, []).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

// 그리드용 작은 썸네일. 업로드 직후 만든 파일은 Next 서버가 모르므로(_next/image가 404)
// nginx가 바로 내줄 수 있게 정적 파일로 만들어 둔다. 짧은 변이 600px이라 정사각 크롭에도 충분하다.
export async function makeThumbnail(buffer: Buffer, id: string): Promise<string> {
  fs.mkdirSync(THUMB_DIR, { recursive: true })
  const name = `${id}.webp`
  await sharp(buffer)
    .rotate()
    .resize({ width: 600, height: 600, fit: 'outside', withoutEnlargement: true })
    .webp({ quality: 75 })
    .toFile(path.join(THUMB_DIR, name))
  return `thumbs/${name}`
}

// 브라우저가 띄울 수 없는 파일이면 null을 돌려준다(저장하지 않음).
export async function saveGalleryImage(
  original: Buffer,
  category: string,
  description: string,
): Promise<GalleryImage | null> {
  const buffer = await stripImageMetadata(original)
  const ext = await detectImageExt(buffer)
  if (!ext) return null
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  const id = Date.now().toString()
  const filename = `${id}.${ext}`
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), buffer)
  // 썸네일을 못 만들어도(드문 포맷 등) 업로드 자체는 살린다. 그리드는 원본으로 대신 보여준다.
  const thumbnail = await makeThumbnail(buffer, id).catch(() => undefined)
  const meta = readMeta()
  const image: GalleryImage = {
    id,
    filename,
    category,
    description,
    createdAt: new Date().toISOString(),
    ...(thumbnail && { thumbnail }),
  }
  writeMeta([...meta, image])
  return image
}

// 없는 id면 false (라우트가 404로 답한다)
export function deleteGalleryImage(id: string): boolean {
  const meta = readMeta()
  const image = meta.find((i) => i.id === id)
  if (!image) return false
  const filePath = path.join(UPLOAD_DIR, image.filename)
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  if (image.thumbnail) fs.rmSync(path.join(UPLOAD_DIR, image.thumbnail), { force: true })
  writeMeta(meta.filter((i) => i.id !== id))
  return true
}
