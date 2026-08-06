import fs from 'fs/promises'
import path from 'path'
import { prisma } from '@/lib/prisma'

// 맛집/쇼핑 사진만 이 폴더에 저장된다(업로드 시 type=maps). 블로그·갤러리 이미지는
// 다른 폴더라 여기 스캔 대상에 들어오지 않는다.
const PHOTO_DIR = path.join(process.cwd(), 'public/uploads/maps')
const URL_PREFIX = '/uploads/maps/'

// 우리가 만든 파일명만 대상으로 삼는다(maps-<타임스탬프>.<확장자>).
// 손으로 넣어둔 다른 파일을 실수로 지우지 않기 위한 안전장치.
const OWN_FILE = /^maps-\d+\.[a-z0-9]+$/i

export type OrphanPhoto = { file: string; bytes: number }

/**
 * 어떤 장소에서도 참조하지 않는 사진 파일을 찾는다.
 * 취소한 등록, 교체한 사진, 삭제된 장소의 사진이 여기 해당한다.
 */
export async function findOrphanPhotos(): Promise<OrphanPhoto[]> {
  let files: string[]
  try {
    files = await fs.readdir(PHOTO_DIR)
  } catch (err) {
    // 아직 업로드가 한 번도 없으면 폴더가 없다 — 정리할 것도 없음
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw err
  }

  // 사용 중인 사진 목록 (photo가 null이 아닌 모든 장소)
  const used = new Set(
    (await prisma.place.findMany({ where: { photo: { not: null } }, select: { photo: true } }))
      .map((p) => p.photo)
      .filter((p): p is string => !!p)
      .map((p) => p.replace(URL_PREFIX, ''))
  )

  const orphans: OrphanPhoto[] = []
  for (const file of files) {
    if (!OWN_FILE.test(file)) continue // 우리가 만든 파일이 아니면 건드리지 않는다
    if (used.has(file)) continue
    const stat = await fs.stat(path.join(PHOTO_DIR, file))
    if (stat.isFile()) orphans.push({ file, bytes: stat.size })
  }
  return orphans
}

/**
 * 미사용 사진을 삭제한다. 삭제 직전에 다시 한 번 미사용 여부를 확인하므로,
 * 목록을 본 뒤 사이에 그 사진이 사용되기 시작했다면 건너뛴다.
 */
export async function deleteOrphanPhotos(): Promise<{ deleted: number; bytes: number }> {
  const orphans = await findOrphanPhotos()
  let deleted = 0
  let bytes = 0
  for (const o of orphans) {
    try {
      await fs.unlink(path.join(PHOTO_DIR, o.file))
      deleted++
      bytes += o.bytes
    } catch (err) {
      // 이미 지워진 파일은 성공으로 취급
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err
    }
  }
  return { deleted, bytes }
}
