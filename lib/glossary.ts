// 글 안 용어 풀이 사전. 글을 그릴 때 해당 글에서 용어가 처음 나오는 곳에 말풍선(abbr)을 붙인다.
// 저장된 글은 건드리지 않으므로 에디터에서 글을 고쳐 저장해도 말풍선이 유지된다.
// 글마다 따로 둔다 — 다른 글의 같은 단어(예: 알고리즘 글의 "시드")에는 붙지 않는다.

export interface GlossaryEntry {
  /** 본문에서 찾을 글자. 영문 용어는 단어 경계로 찾는다. */
  match: string
  /** 말풍선에 보일 뜻 */
  tip: string
}

const AI_PILOT: GlossaryEntry[] = [
  { match: '스위스', tip: '스위스 방식은 탈락 없이 비슷한 성적끼리 매 라운드 붙이는 대진 방식이다.' },
  { match: 'WEZ', tip: 'WEZ(Weapon Engagement Zone)는 상대에게 피해를 줄 수 있는 영역이다. 이 대회에서는 내 기수 앞 원뿔과 정해진 거리 안이다.' },
  { match: 'BT', tip: 'BT는 행동 트리(Behavior Tree). 정해 둔 규칙대로 상황을 보고 움직이는 조종 방식이다.' },
  { match: 'PFSP', tip: 'PFSP는 자기대국에서 가장 센 상대만 고르지 않고, 이길 여지가 있는 상대를 골라 붙이는 방식이다.' },
  { match: '하네스', tip: '하네스는 평가가 제대로 돌아가는지 자동으로 점검하는 도구 묶음이다.' },
  { match: 'PPO', tip: '강화학습 알고리즘의 하나(Proximal Policy Optimization).' },
  { match: '시드', tip: '경기마다 정해지는 무작위 시작 조건의 번호. 같은 시드면 같은 조건에서 다시 붙여 볼 수 있다.' },
  { match: '신뢰구간', tip: '측정값의 오차 범위. 95% 신뢰구간이 0을 포함하면 차이가 있다고 단정하기 어렵다.' },
  { match: '시저스', tip: '서로 상대의 뒤를 잡으려고 좌우로 교차하며 도는 기동.' },
  { match: '순이득', tip: '교전이 끝났을 때 내 잔여 체력에서 상대 잔여 체력을 뺀 값.' },
  { match: '시선 각속도', tip: '상대를 바라보는 방향이 1초에 몇 도 돌아가는지.' },
  { match: '오버슈트', tip: '상대를 지나쳐 앞으로 튀어 나가는 것.' },
  { match: '헤드온', tip: '헤드온(head-on)은 서로 정면으로 마주 보고 시작하는 교전이다.' },
]

const BY_SLUG: Record<string, GlossaryEntry[]> = {
  'ai-pilot-top-gun-retrospective': AI_PILOT,
}

export function glossaryFor(slug: string): GlossaryEntry[] {
  return BY_SLUG[slug] ?? []
}
