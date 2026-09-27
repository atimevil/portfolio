WHS(화이트햇 스쿨) 과정에서 풀었던 CTF 문제 두 개를 복기한다.

## Ascii? Unicode?

### 문제 개요

주어진 URL을 방문하는 웹 서비스에서 특정 조건을 만족하면 플래그를 반환하는 문제다.

### 제공된 파일 분석

```python
def get_host_length(url: str) -> int:
    parsed = urlparse(url)
    hostname = parsed.hostname or ""
    parts = hostname.split(".")
    if len(parts) >= 2:
        root_domain = ".".join(parts[-2:])
    else:
        root_domain = hostname
    return len(root_domain)
```

URL에서 **루트 도메인**(예: `example.com`)만 추출해 길이를 계산한다.

플래그 반환 조건은 다음과 같다.

```python
if initial_host_length == final_host_length:
    return jsonify({"message": "Successfully visited!"})
else:
    return jsonify({"flag": FLAG})
```

초기 URL의 루트 도메인 길이와 최종 URL(리다이렉트 후)의 루트 도메인 길이가 다르면 FLAG를 반환한다. 즉 "리다이렉트를 거치면서 도메인 길이가 바뀌는 경로"를 찾으면 된다.

리다이렉트 차단 로직도 걸려 있다.

```python
def route_handler(route):
    if route.request.redirected_from is not None:
        route.abort()
    else:
        route.continue_()
```

Playwright의 `redirected_from` 값이 있으면 요청을 막는다. 하지만 이 방식은 모든 리다이렉트 유형을 완벽히 차단하지 못한다.

### 공격 시나리오

**1. Data URL 시도**

```python
import base64
html = '''<html><script>window.location.href='http://a.co';</script></html>'''
encoded = base64.b64encode(html.encode()).decode()
data_url = f'data:text/html;base64,{encoded}'
```

결과: `is_valid_url()` 함수에서 data URL은 `netloc`이 없어 거부된다. 막힘.

**2. 도메인 길이 계산해보기**

```python
from urllib.parse import urlparse

def get_host_length(url):
    parsed = urlparse(url)
    hostname = parsed.hostname or ''
    parts = hostname.split('.')
    if len(parts) >= 2:
        root_domain = '.'.join(parts[-2:])
    else:
        root_domain = hostname
    return len(root_domain)

print('httpbin.org:', get_host_length('http://httpbin.org'))  # 11
print('example.com:', get_host_length('http://example.com'))  # 11
print('a.co:', get_host_length('http://a.co'))                # 4
print('google.com:', get_host_length('http://google.com'))    # 10
```

`httpbin.org`은 11자, `a.co`는 4자로 길이가 다르다. 이 둘을 리다이렉트로 잇기만 하면 조건을 만족시킬 수 있다.

**3. HTTP 리다이렉트 서비스 활용**

httpbin.org의 `redirect-to` 엔드포인트를 활용해 공격을 수행한다.

```bash
curl -X POST http://host8.dreamhack.games:21328/ \
  -d "url=http://httpbin.org/redirect-to?url=http://a.co" \
  -H "Content-Type: application/x-www-form-urlencoded"
```

처음 방문하는 URL은 `httpbin.org`(11자)지만, 서버가 그 안의 `redirect-to?url=` 파라미터를 따라 `a.co`(4자)로 리다이렉트되면서 최종 도메인 길이가 달라진다. `redirected_from` 체크는 최초 리다이렉트만 보고 있어서, httpbin이 자체적으로 처리하는 이 리다이렉트는 걸리지 않았다.

실행 결과: **flag{ab88a20edaf314453570bea685e08ce9}**

## tetoris

### 파일 분석

```python
import random
from 책 import 글

def 출력(데이터): print(데이터)
def 회전(리스트, 회전수): return {c: 리스트[(i+회전수)%len(리스트)] for i, c in enumerate(리스트)}
def 리스트화(문자열): return list(문자열)
def 난수(최소, 최대): return random.randint(최소, 최대)
def 저장(파일명, 데이터):
    with open(파일명, 'w', encoding='utf-8') as f:
        f.write(str(데이터))
def 길이(리스트): return len(리스트)
def 코드값(문자열): return ord(문자열)
def 문자(코드): return chr(코드)

초성_리스트 = 리스트화("ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ")
중성_리스트 = 리스트화("ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ")
종성_리스트 = [''] + 리스트화("ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ")

초성_회전수 = 난수(0, 길이(초성_리스트) - 1)
중성_회전수 = 난수(0, 길이(중성_리스트) - 1)
종성_회전수 = 난수(0, 길이(종성_리스트) - 1)

초성_치환 = 회전(초성_리스트, 초성_회전수)
중성_치환 = 회전(중성_리스트, 중성_회전수)
종성_치환 = 회전(종성_리스트, 종성_회전수)

def 분해(글자):
    if not ('가' <= 글자 <= '힣'):
        return 글자, '', ''
    코드 = 코드값(글자) - 코드값('가')
    초성 = 초성_리스트[코드 // (21*28)]
    중성 = 중성_리스트[(코드 % (21*28)) // 28]
    종성 = 종성_리스트[(코드 % 28)]
    return 초성, 중성, 종성

def 조합(초성, 중성, 종성):
    try:
        초성_위치 = 초성_리스트.index(초성)
        중성_위치 = 중성_리스트.index(중성)
        종성_위치 = 종성_리스트.index(종성)
        return 문자(코드값('가') + (초성_위치 * 21 * 28) + (중성_위치 * 28) + 종성_위치)
    except:
        return 초성 + 중성 + 종성

def 치환(문자열):
    결과 = ""
    for 글자 in 문자열:
        초, 중, 종 = 분해(글자)
        if 중 == '':
            결과 += 글자
        else:
            새_초 = 초성_치환.get(초, 초)
            새_중 = 중성_치환.get(중, 중)
            새_종 = 종성_치환.get(종, 종)
            결과 += 조합(새_초, 새_중, 새_종)
    return 결과

저장("결과", 치환(글))
```

### 인코딩 메커니즘 이해

스크립트를 분석한 결과, 다음과 같은 인코딩 방식을 사용함을 발견했다.

1. **한글 분해**: 한글 문자를 초성, 중성, 종성으로 분해
2. **회전 치환**: 각 구성 요소를 랜덤한 값으로 회전(시저 암호 방식)
3. **재조합**: 회전된 구성 요소를 다시 한글로 조합

암호화 특징:
- 초성 리스트: 19개 (ㄱ~ㅎ)
- 중성 리스트: 21개 (ㅏ~ㅣ)
- 종성 리스트: 28개 (공백 포함)
- 각각 독립적인 회전값을 사용

복호화 전략: 랜덤 회전값을 모르므로 브루트포스로 모든 가능한 조합을 시도해야 한다. 총 경우의 수는 19 × 21 × 28 = 11,172가지. 올바른 복호화인지는 자주 쓰이는 한국어 단어가 등장하는지, FLAG 패턴이 있는지, 문장 구조가 자연스러운지로 판별한다.

### 디코더 구현

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-

def 리스트화(문자열): return list(문자열)
def 코드값(문자): return ord(문자)
def 문자(코드): return chr(코드)

초성_리스트 = 리스트화("ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ")
중성_리스트 = 리스트화("ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ")
종성_리스트 = [''] + 리스트화("ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ")

def 분해(글자):
    if not ('가' <= 글자 <= '힣'):
        return 글자, '', ''
    코드 = 코드값(글자) - 코드값('가')
    초성 = 초성_리스트[코드 // (21*28)]
    중성 = 중성_리스트[(코드 % (21*28)) // 28]
    종성 = 종성_리스트[(코드 % 28)]
    return 초성, 중성, 종성

def 조합(초성, 중성, 종성):
    try:
        초성_위치 = 초성_리스트.index(초성)
        중성_위치 = 중성_리스트.index(중성)
        종성_위치 = 종성_리스트.index(종성)
        return 문자(코드값('가') + (초성_위치 * 21 * 28) + (중성_위치 * 28) + 종성_위치)
    except:
        return 초성 + 중성 + 종성

def 회전(리스트, 회전수):
    # 역회전을 위해 음수 회전 적용
    return {리스트[i]: 리스트[(i-회전수)%len(리스트)] for i in range(len(리스트))}

def 역치환(문자열, 초성_회전수, 중성_회전수, 종성_회전수):
    초성_치환 = 회전(초성_리스트, 초성_회전수)
    중성_치환 = 회전(중성_리스트, 중성_회전수)
    종성_치환 = 회전(종성_리스트, 종성_회전수)

    결과 = ""
    for 글자 in 문자열:
        초, 중, 종 = 분해(글자)
        if 중 == '':
            결과 += 글자
        else:
            새_초 = 초성_치환.get(초, 초)
            새_중 = 중성_치환.get(중, 중)
            새_종 = 종성_치환.get(종, 종)
            결과 += 조합(새_초, 새_중, 새_종)
    return 결과

# 파일 읽기
with open('결과', 'r', encoding='utf-8') as f:
    encoded_text = f.read()

# 올바른 텍스트 확인 함수
def check_korean_text(text):
    # 자주 사용되는 한국어 단어들
    common_words = ['이', '그', '저', '것', '수', '있', '하', '되', '않', '나',
                    '가', '는', '을', '를', '에', '의', '과', '와']
    # FLAG 패턴들
    flag_patterns = ['flag{', 'FLAG{', '플래그', '깃발']

    word_count = sum(1 for word in common_words if word in text)
    for pattern in flag_patterns:
        if pattern in text:
            return True, word_count

    # 중괄호 패턴 체크
    if '{' in text and '}' in text:
        start = text.find('{')
        end = text.find('}', start)
        if start != -1 and end != -1:
            potential_flag = text[start-10:end+1] if start >= 10 else text[:end+1]
            if any(c.isascii() and c.isalpha() for c in potential_flag):
                return True, word_count

    return False, word_count

# 브루트포스 시작
print("Trying all rotation combinations...")
best_score = 0
best_result = None
best_params = None

for 초 in range(len(초성_리스트)):
    for 중 in range(len(중성_리스트)):
        for 종 in range(len(종성_리스트)):
            decoded = 역치환(encoded_text, 초, 중, 종)
            has_flag, score = check_korean_text(decoded)

            if has_flag or score > best_score:
                best_score = score
                best_result = decoded
                best_params = (초, 중, 종)

                if has_flag:
                    print(f"\n초성 회전: {초}, 중성 회전: {중}, 종성 회전: {종}")
                    print("="*50)
                    print(decoded[:500])
                    print("="*50)

                    # FLAG 찾기
                    if '{' in decoded and '}' in decoded:
                        lines = decoded.split('\n')
                        for line in lines:
                            if '{' in line and '}' in line:
                                print(f"Potential flag found: {line.strip()}")

print(f"\nBest result with score {best_score} at rotations: {best_params}")
print("First 500 characters of best result:")
print(best_result[:500] if best_result else "No result")
```

### 실행 결과

브루트포스 실행 결과, 다음 파라미터에서 올바른 복호화를 발견했다.

- **초성 회전**: 8
- **중성 회전**: 15
- **종성 회전**: 19

복호화된 텍스트 일부는 이랬다.

> 반갑습니다. 본 글귀는 보기 불편합니다.
> 깔끔하게 보려는 목적 대신, 불편하고 쓸데도 전무하지만, 신기한 말놀기 쯤 되는 글귀라 봐 주시면 감사하겠습니다.
> 본 글귀는 그대가 자각한 그 닿소리가 모두 빠진 자기소개다. 저렇게 기괴한 술수로 소개를 하는 까닭? 간단하다.

텍스트 마지막 부분에서 다음 메시지를 발견했다.

> 너가 갖고 싶다한 플래그는 그거다. 에프엘에이지{엘아이피오지알에이엠_아이에스_에이치에이알디} (모두 소문자)

해석하면 **flag{lipogram_is_hard}**. "자음이 모두 빠진 자기소개"라는 힌트대로, 복호화된 문장 자체가 리포그램(특정 글자를 쓰지 않고 쓴 글)이었다.
