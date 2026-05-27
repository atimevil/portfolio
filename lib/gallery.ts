import fs from 'fs'
import path from 'path'
import type { GalleryImage } from '@/types'

const META_FILE = path.join(process.cwd(), 'content/gallery.json')
const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads/gallery')

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

export function saveGalleryImage(
  buffer: Buffer,
  originalName: string,
  category: string,
  description: string,
): GalleryImage {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  const ext = path.extname(originalName)
  const id = Date.now().toString()
  const filename = `${id}${ext}`
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), buffer)
  const meta = readMeta()
  const image: GalleryImage = {
    id,
    filename,
    category,
    description,
    createdAt: new Date().toISOString(),
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
  writeMeta(meta.filter((i) => i.id !== id))
}
