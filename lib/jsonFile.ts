import fs from 'fs'
import path from 'path'

// content/*.json 읽기·쓰기 공통.
//
// 예전엔 파싱에 실패하면 빈 값([]/{}/기본 설정)으로 읽고, 그 상태에서 한 번 저장하면
// 빈 내용으로 원본을 덮어썼다. 또 writeFileSync는 쓰는 도중 끊기면(디스크 가득·프로세스 종료)
// 반쯤 쓴 파일이 남는다 — views.json은 방문마다 통째로 다시 써서 그 기회가 많았다.
//  - 쓰기: 같은 폴더의 임시 파일에 쓰고 rename으로 바꿔치기한다(같은 파일시스템이면 원자적).
//  - 읽기: 파일이 없으면 기본값, 깨져 있으면 예외. 화면 표시용은 호출부가 잡아서 기본값을 쓰되,
//    저장 경로는 예외를 그대로 올려 깨진 파일 위에 덮어쓰지 않는다.

export class CorruptJsonError extends Error {
  constructor(file: string, cause: unknown) {
    super(`${path.basename(file)} 파싱 실패 — 파일을 확인하세요 (저장은 막았습니다): ${String(cause)}`)
    this.name = 'CorruptJsonError'
  }
}

export function readJsonFile<T>(file: string, fallback: T): T {
  let raw: string
  try {
    raw = fs.readFileSync(file, 'utf-8')
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return fallback
    throw err
  }
  try {
    return JSON.parse(raw) as T
  } catch (err) {
    throw new CorruptJsonError(file, err)
  }
}

// 화면 표시용: 깨진 파일 때문에 페이지 전체가 500이 되지 않도록 기본값으로 대신하고 로그만 남긴다.
export function readJsonFileOr<T>(file: string, fallback: T): T {
  try {
    return readJsonFile(file, fallback)
  } catch (err) {
    console.error(err)
    return fallback
  }
}

export function writeJsonAtomic(file: string, data: unknown): void {
  const dir = path.dirname(file)
  fs.mkdirSync(dir, { recursive: true })
  const tmp = path.join(dir, `.${path.basename(file)}.${process.pid}.${Date.now()}.tmp`)
  try {
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8')
    fs.renameSync(tmp, file)
  } catch (err) {
    fs.rmSync(tmp, { force: true })
    throw err
  }
}
