// 업로드 파일 이름·갤러리 id에 쓰는 숫자열. 시각(ms)만 쓰면 한꺼번에 붙여 넣은 이미지 두 장이 같은 ms에
// 처리될 때 같은 이름이 되어 뒤 파일이 앞 파일을 덮어쓴다. 뒤에 프로세스 안에서 도는 순번 세 자리를 붙인다
// (앱은 한 프로세스로 돈다. 같은 ms에 1000개를 넘기지 않는 한 겹치지 않는다).
// 숫자만 쓰는 이유: 지도 사진 이름 규칙(lib/place-photos의 OWN_FILE, maps-<숫자>.<확장자>)을 그대로 지킨다.
let seq = 0

export function uniqueStamp(): string {
  seq = (seq + 1) % 1000
  return `${Date.now()}${String(seq).padStart(3, '0')}`
}
