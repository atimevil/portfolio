import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { stripImageMetadata } from '@/lib/stripMetadata'
import type { GalleryImage } from '@/types'

const META_FILE = path.join(process.cwd(), 'content/gallery.json')
const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads/gallery')
const THUMB_DIR = path.join(UPLOAD_DIR, 'thumbs')

function readMeta(): GalleryImage[] {
  if (!fs.existsSync(META_FILE)) return []
  return JSON.parse(fs.readFileSync(META_FILE, 'utf-8'))
}

function writeMeta(data: GalleryImage[]): void {
  const dir = path.dirname(META_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(META_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

export function getGalleryImages(): GalleryImage[] {
  return readMeta().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
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

export async function saveGalleryImage(
  original: Buffer,
  originalName: string,
  category: string,
  description: string,
): Promise<GalleryImage> {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  const buffer = await stripImageMetadata(original)
  const ext = path.extname(originalName)
  const id = Date.now().toString()
  const filename = `${id}${ext}`
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

export function deleteGalleryImage(id: string): void {
  const meta = readMeta()
  const image = meta.find((i) => i.id === id)
  if (!image) throw new Error(`Image not found: ${id}`)
  const filePath = path.join(UPLOAD_DIR, image.filename)
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  if (image.thumbnail) fs.rmSync(path.join(UPLOAD_DIR, image.thumbnail), { force: true })
  writeMeta(meta.filter((i) => i.id !== id))
}
