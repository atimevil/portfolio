import sharp from 'sharp'

// 휴대폰 사진의 EXIF에는 촬영 위치(GPS)·기기 정보가 들어 있다. 업로드 원본은 "원본 보기"로 누구나 받을 수 있으므로
// 저장 전에 메타데이터를 지운다. 메타데이터가 없으면 재인코딩하지 않고 그대로 둔다(화질 손실 없음).
// 색이 바뀌지 않게 ICC 프로필은 남기고, JPEG는 EXIF 회전값을 픽셀에 반영한 뒤 지운다(안 그러면 옆으로 누운다).
export async function stripImageMetadata(buffer: Buffer): Promise<Buffer> {
  try {
    const meta = await sharp(buffer).metadata()
    if (!meta.exif && !meta.xmp && !meta.iptc) return buffer
    switch (meta.format) {
      case 'jpeg':
        return await sharp(buffer).rotate().keepIccProfile().jpeg({ quality: 92, mozjpeg: true }).toBuffer()
      case 'png':
        return await sharp(buffer).keepIccProfile().png().toBuffer()
      case 'webp':
        return await sharp(buffer, { animated: true }).keepIccProfile().webp({ quality: 92 }).toBuffer()
      case 'heif':
        return await sharp(buffer).rotate().keepIccProfile().avif({ quality: 70 }).toBuffer()
      default:
        return buffer
    }
  } catch {
    // 이미지로 못 읽는 파일은 원래 동작대로 그대로 저장한다
    return buffer
  }
}
