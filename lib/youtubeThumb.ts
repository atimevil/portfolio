// 음악 목록은 커버를 32px로 보여준다. 저장된 유튜브 커버는 480×360(hqdefault, 약 20KB)이라
// 122곡이면 2MB가 넘는다. 목록에서는 같은 영상의 120×90(default, 약 3KB)으로 바꿔 쓴다.
// 직접 올린 이미지 등 유튜브 썸네일이 아니면 그대로 둔다.
export function smallYoutubeThumb(url: string): string {
  return url.replace(/^(https:\/\/(?:img\.youtube\.com|i\.ytimg\.com)\/vi\/[^/]+\/)(?:hq|mq|sd|maxres)default\.jpg$/, '$1default.jpg')
}
