// mailto: 링크에 그대로 넣어도 안전한 형태일 때만 주소를 돌려준다.
// - 공백만 입력하면 빈 링크(mailto: )가 렌더되는 걸 막고
// - ?subject= / &body= 가 섞인 값이 헤더처럼 해석되는 걸 막는다.
// 값이 비정상이면 null → 호출부에서 링크 자체를 렌더하지 않는다.
export function cleanEmail(value?: string | null): string | null {
  const email = value?.trim() ?? ''
  return /^[^\s@?&]+@[^\s@?&]+\.[^\s@?&]+$/.test(email) ? email : null
}
