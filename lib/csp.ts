// 페이지 응답에 붙이는 CSP. 스크립트는 요청마다 만든 nonce가 붙은 것과 그 스크립트가 불러오는 것만 실행한다
// ('strict-dynamic'). 그래서 'unsafe-inline'·'unsafe-eval'은 넣지 않는다 — 글에 <script>가 섞여 들어와도 실행되지 않는다.
// 아래 네 지시어는 next.config.mjs의 기본 CSP와 같은 내용(페이지 응답엔 이 값이 쓰인다).
export function buildCsp(nonce: string): string {
  return [
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
}

// 요청마다 새로 만든다(추측할 수 없어야 한다). Edge 런타임에서도 되는 Web Crypto만 쓴다.
export function makeNonce(): string {
  return btoa(crypto.randomUUID())
}
