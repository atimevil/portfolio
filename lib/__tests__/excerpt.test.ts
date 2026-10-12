import { describe, it, expect } from 'vitest'
import { excerptFromHtml } from '@/lib/excerpt'

describe('excerptFromHtml', () => {
  it('태그를 벗기고 공백을 정리한다', () => {
    expect(excerptFromHtml('<h2>제목</h2>\n<p>첫  문단 <strong>강조</strong></p>')).toBe('제목 첫 문단 강조')
  })

  it('코드 블록과 접기 버튼 글자는 빼고, HTML 엔티티는 글자로 되돌린다', () => {
    const html = '<p>소개 &amp; 개요</p><pre><code>from flask import Flask\napp = Flask(__name__)</code></pre><details><summary>더보기</summary><p>숨긴 &lt;내용&gt;</p></details>'
    expect(excerptFromHtml(html)).toBe('소개 & 개요 숨긴 <내용>')
  })

  it('최대 길이로 자른다', () => {
    expect(excerptFromHtml(`<p>${'가'.repeat(300)}</p>`)).toHaveLength(150)
  })
})
