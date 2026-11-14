import { describe, it, expect } from 'vitest'
import { buildTemplateHtml, hasWrittenText, BODY_TEMPLATES, REVIEW_TEMPLATES } from '../postTemplates'

describe('buildTemplateHtml', () => {
  it('둘 다 안 고르면 빈 문자열', () => {
    expect(buildTemplateHtml('', '')).toBe('')
    expect(buildTemplateHtml('nope', 'nope')).toBe('')
  })

  it('본문 틀만: h2 소제목마다 빈 문단', () => {
    const html = buildTemplateHtml('activity', '')
    expect(html).toBe(
      '<h2>왜 시작했나</h2><p></p><h2>무엇을 했나</h2><p></p><h2>내가 맡은 부분</h2><p></p><h2>결과</h2><p></p>',
    )
  })

  it('회고 틀만: 구분 소제목 없이 h2', () => {
    const html = buildTemplateHtml('', 'kpt')
    expect(html).not.toContain('돌아보기')
    expect(html).toContain('<h2>잘돼서 계속할 것 (Keep)</h2>')
  })

  it('둘 다: 본문 뒤에 돌아보기 h2 + 회고 소제목은 h3', () => {
    const html = buildTemplateHtml('activity', 'kpt')
    expect(html.indexOf('<h2>결과</h2>')).toBeLessThan(html.indexOf('<h2>돌아보기</h2>'))
    expect(html).toContain('<h3>다음에 해 볼 것 (Try)</h3>')
  })

  it('모든 틀의 id는 고유하다', () => {
    const ids = [...BODY_TEMPLATES, ...REVIEW_TEMPLATES].map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('hasWrittenText', () => {
  it('빈 본문·템플릿 소제목만 있으면 false', () => {
    expect(hasWrittenText('')).toBe(false)
    expect(hasWrittenText('<p></p>')).toBe(false)
    expect(hasWrittenText(buildTemplateHtml('activity', 'kpt'))).toBe(false)
  })

  it('직접 쓴 글자가 있으면 true', () => {
    expect(hasWrittenText('<p>안녕</p>')).toBe(true)
    expect(hasWrittenText(buildTemplateHtml('activity', '').replace('<p></p>', '<p>내용</p>'))).toBe(true)
  })

  it('이미지·표·구분선·링크만 있어도 true (덮어쓰면 잃는다)', () => {
    expect(hasWrittenText('<img src="/uploads/blog/a.png">')).toBe(true)
    expect(hasWrittenText('<table><tbody><tr><td></td></tr></tbody></table>')).toBe(true)
    expect(hasWrittenText('<hr>')).toBe(true)
    expect(hasWrittenText('<p><a href="https://x.dev"></a></p>')).toBe(true)
  })

  it('소제목과 같은 단어라도 문단에 쓴 글은 true', () => {
    expect(hasWrittenText('<p>결과</p>')).toBe(true)
    expect(hasWrittenText('<p>돌아보기</p>')).toBe(true)
    expect(hasWrittenText('<p>상황 (Situation) 결과 마무리</p>')).toBe(true)
  })

  it('사용자가 고친 소제목은 글로 센다', () => {
    expect(hasWrittenText('<h2>내가 바꾼 제목</h2><p></p>')).toBe(true)
  })
})

describe('에디터·정제 왕복', () => {
  it('정제를 거쳐도 템플릿이 그대로다', async () => {
    const { sanitizeBlogHtml } = await import('../sanitizeHtml')
    const html = buildTemplateHtml('activity', 'kpt')
    expect(sanitizeBlogHtml(html)).toBe(html)
  })
})
