# MinorLab 공식 홈페이지

MinorLab의 공식 홈페이지입니다. 습관 관리와 개인 성장을 위한 앱과 서비스를 소개합니다.

## 🌟 특징

- **Jekyll 기반 정적 사이트**: 빠르고 안정적인 로딩
- **Supabase API 연동**: 동적 콘텐츠 관리 (앱 정보, 정책 등)
- **다국어 지원**: 한국어/영어 지원
- **반응형 디자인**: 모든 기기에서 최적화
- **다크/라이트 모드**: 사용자 선호에 따른 테마 전환
- **GitHub Pages 호스팅**: 무료 호스팅 및 자동 배포

## 🚀 사이트 URL

- **메인 사이트**: https://heyoom.github.io/minorlab_home
- **개인정보보호정책**: https://heyoom.github.io/minorlab_home/privacy.html
- **이용약관**: https://heyoom.github.io/minorlab_home/terms.html

## 🏗️ 기술 스택

- **사이트 생성**: Jekyll 4.x
- **스타일링**: CSS3 (CSS Variables, Grid, Flexbox)
- **JavaScript**: Vanilla JS (ES6+)
- **API**: Supabase REST API
- **호스팅**: GitHub Pages
- **다국어**: Jekyll 다국어 시스템

## 🗂️ 프로젝트 구조

```
minorlab_home/
├── _config.yml           # Jekyll 설정
├── _data/
│   └── translations.yml  # 다국어 번역
├── _includes/
│   ├── head.html         # HTML 헤드
│   ├── header.html       # 상단 네비게이션
│   └── footer.html       # 하단 푸터
├── _layouts/
│   └── default.html      # 기본 레이아웃
├── assets/
│   ├── css/
│   │   └── main.css      # 메인 스타일시트
│   └── js/
│       └── main.js       # 메인 JavaScript
├── en/                   # 영어 페이지
│   ├── index.html
│   ├── privacy.html
│   └── terms.html
├── index.html            # 메인 페이지 (한국어)
├── privacy.html          # 개인정보보호정책
└── terms.html            # 이용약관
```

## 🔧 로컬 개발

### 필요 조건

- Ruby 2.7+
- Jekyll 4.x
- Bundler

### 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/heyoom/minorlab_home.git
cd minorlab_home

# 의존성 설치
bundle install

# 로컬 서버 실행
bundle exec jekyll serve

# 브라우저에서 확인
# http://localhost:4000
```

## 📊 API 연동

이 사이트는 다음 Supabase API를 사용합니다:

### 패밀리 앱 정보
```
GET /family_apps?is_active=eq.true&order=sort_order.asc
```

### 개인정보보호정책
```
GET /policies?type=eq.privacy&is_active=eq.true&order=version.desc&limit=1
```

### 이용약관
```
GET /policies?type=eq.terms&is_active=eq.true&order=version.desc&limit=1
```

## 🌍 다국어 지원

- **한국어** (기본): `/`, `/privacy.html`, `/terms.html`
- **영어**: `/en/`, `/en/privacy.html`, `/en/terms.html`

번역은 `_data/translations.yml` 파일에서 관리됩니다.

## 🎨 테마 시스템

CSS Variables를 사용한 다크/라이트 모드 지원:

```css
:root {
  --bg-primary: #ffffff;
  --text-primary: #1e293b;
  /* ... */
}

[data-theme="dark"] {
  --bg-primary: #0f172a;
  --text-primary: #f1f5f9;
  /* ... */
}
```

## 🚀 배포

GitHub Pages로 자동 배포됩니다:

1. `main` 브랜치에 푸시
2. GitHub Actions가 Jekyll 빌드 실행
3. `gh-pages` 브랜치에 배포
4. https://heyoom.github.io/minorlab_home에서 확인

## 📝 콘텐츠 관리

정적 콘텐츠는 Jekyll 파일에서, 동적 콘텐츠는 Supabase에서 관리:

- **정적**: 회사 소개, 메인 콘텐츠
- **동적**: 앱 정보, 정책 문서, 공지사항

## 🔗 관련 프로젝트

- **어드민 웹**: [minorlab_admin](../minorlab_admin) - 콘텐츠 관리
- **북랩 앱**: [minorlab_book](../minorlab_book) - 독서 관리 앱
- **공통 라이브러리**: [minorlab_common](../minorlab_common) - 공통 컴포넌트

## 📞 연락처

- **이메일**: danny@minorlab.com
- **사업 문의**: danny@minorlab.com

---

© 2025 MinorLab. All rights reserved.