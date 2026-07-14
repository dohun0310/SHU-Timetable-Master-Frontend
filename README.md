# SHU Timetable Master Frontend

신한대학교 학생들이 강좌를 찾고 시간표를 조합해 저장할 수 있도록 돕는 시간표 마법사의 프론트엔드입니다.

## 요구 환경

| 항목 | 버전 |
| --- | --- |
| Node.js | 24 이상 |
| 패키지 매니저 | Corepack으로 활성화한 Yarn 4 |

## 설치

```bash
corepack enable
yarn install --immutable
cp .env.example .env.local
```

## 환경변수

`.env.local`에 아래 값을 채워 넣습니다.

| 이름 | 설명 | 예시 |
| --- | --- | --- |
| `API_BASE_URL` | 백엔드 API 주소. 서버에서만 사용하며 브라우저에 노출되지 않는다. | `http://localhost:3000` |

## 실행

`.env.local`의 `API_BASE_URL`에 사용할 백엔드 주소를 넣은 뒤 개발 서버를 실행합니다.

```bash
yarn dev
```

## 화면 구성

| 경로 | 설명 |
| --- | --- |
| `/` | 강좌 찾기 |
| `/build` | 시간표 만들기 |
| `/my` | 내 시간표 |

## 품질 검사

```bash
yarn lint
```
