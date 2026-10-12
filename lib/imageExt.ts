import sharp from 'sharp'

// 업로드 파일의 확장자를 파일명이 아니라 실제 내용으로 정한다.
// 파일명을 믿으면 이미지로 위장한 .html/.svg가 /uploads에서 그대로 열려 스크립트가 실행된다.
// 브라우저가 띄울 수 있는 래스터 형식만 허용하고, 그 밖의 것은 null(거부)이다.
export async function detectImageExt(buffer: Buffer): Promise<string | null> {
  try {
    const { format, compression } = await sharp(buffer).metadata()
    switch (format) {
      case 'jpeg': return 'jpg'
      case 'png': return 'png'
      case 'gif': return 'gif'
      case 'webp': return 'webp'
      case 'heif': return compression === 'av1' ? 'avif' : null // HEIC는 대부분 브라우저가 못 띄운다
      default: return null
    }
  } catch {
    return null
  }
}
