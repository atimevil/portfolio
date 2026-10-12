import { describe, it, expect } from 'vitest'
import { excerptFromHtml, markdownExcerptSource } from '@/lib/excerpt'

describe('excerptFromHtml', () => {
  it('태그를 벗기고 공백을 정리한다', () => {
    expect(excerptFromHtml('<p>첫  문단\n<strong>강조</strong></p>')).toBe('첫 문단 강조')
  })

  it('코드 블록과 접기 버튼 글자는 빼고, HTML 엔티티는 글자로 되돌린다', () => {
    const html = '<p>소개 &amp; 개요</p><pre><code>from flask import Flask\napp = Flask(__name__)</code></pre><details><summary>더보기</summary><p>숨긴 &lt;내용&gt;</p></details>'
    expect(excerptFromHtml(html)).toBe('소개 & 개요 숨긴 <내용>')
  })

  it('최대 길이로 자른다', () => {
    expect(excerptFromHtml(`<p>${'가'.repeat(300)}</p>`)).toHaveLength(150)
  })
})

describe('제목 빼기', () => {
  it('HTML 요약은 제목을 뺀다', () => {
    expect(excerptFromHtml('<h2>Lazy Loading</h2><p>Lazy Loading은 필요할 때 읽는다</p>')).toBe('Lazy Loading은 필요할 때 읽는다')
  })

  it('마크다운은 목차 절과 제목 줄을 뺀다', () => {
    const md = '### **목차**\n\n-   **동적 계획법이란**\n-   **Knapsack**\n\n### **1\\. 동적계획법이란**\n\n**흔히 DP라 불리는**'
    expect(markdownExcerptSource(md).trim()).toBe('**흔히 DP라 불리는**')
  })

  it('목차가 없으면 제목 줄만 뺀다', () => {
    expect(markdownExcerptSource('## 개요\n본문').trim()).toBe('본문')
  })
})
