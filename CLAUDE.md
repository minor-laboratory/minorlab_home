# CLAUDE.md - MinorLab 홈페이지

## 프로젝트 개요

MinorLab 공식 홈페이지 (Jekyll 기반)
- **URL**: https://minorlab.com
- **기술스택**: Jekyll, HTML, CSS, JavaScript
- **호스팅**: GitHub Pages / Netlify

## 🚀 개발 명령어

### 로컬 개발 서버
```bash
# 의존성 설치
bundle install

# 로컬 서버 실행
bundle exec jekyll serve

# 로컬 서버 실행 (자동 새로고침)
bundle exec jekyll serve --livereload

# 빌드만 실행
bundle exec jekyll build
```

### 배포
```bash
# GitHub Pages 자동 배포 (main 브랜치 push 시)
git push origin main

# 수동 빌드 (필요시)
bundle exec jekyll build --destination _site
```

## 📁 프로젝트 구조

```
minorlab_home/
├── _config.yml              # Jekyll 설정
├── _data/
│   └── translations.yml     # 다국어 번역 데이터
├── _includes/               # 공통 컴포넌트
├── _layouts/                # 페이지 레이아웃
├── _sass/                   # SCSS 스타일
├── assets/                  # 정적 자산 (이미지, CSS, JS)
├── en/                      # 영어 페이지
├── ko/                      # 한국어 페이지
├── index.html               # 메인 페이지
├── privacy.html             # 개인정보보호정책
├── terms.html               # 이용약관
├── account-deletion.html    # 계정삭제 페이지
└── CNAME                    # 도메인 설정
```

## 🌐 다국어 지원

### 번역 시스템
- **번역 파일**: `_data/translations.yml`
- **지원 언어**: 한국어(ko), 영어(en)
- **사용법**: `{% raw %}{{ t.섹션.키 }}{% endraw %}`

### 새 번역 추가
```yaml
# _data/translations.yml
ko:
  새섹션:
    새키: "한국어 텍스트"

en:
  새섹션:
    새키: "English text"
```

### 페이지에서 사용
```liquid
{% raw %}{%- assign t = site.data.translations[page.lang] -%}
<h1>{{ t.섹션명.키이름 }}</h1>{% endraw %}
```

## 📄 페이지 관리

### 새 페이지 추가
1. **루트에 HTML 파일 생성**
2. **Front Matter 설정**:
   ```yaml
   ---
   layout: default
   lang: ko  # 또는 en
   title: "페이지 제목"
   description: "페이지 설명"
   ---
   ```
3. **번역 키 추가** (`_data/translations.yml`)
4. **네비게이션 추가** (필요시)

### 기존 페이지 수정
- **개인정보보호정책**: `privacy.html`
- **이용약관**: `terms.html`
- **계정삭제**: `account-deletion.html`

## 🎨 스타일링

### CSS 클래스 규칙
- **Tailwind CSS** 기반 유틸리티 클래스 사용
- **컴포넌트별 스타일**: `<style>` 태그 내부 정의
- **공통 스타일**: `_sass/` 폴더 활용

### 반응형 디자인
- **모바일 우선** 접근법
- **브레이크포인트**: `md:`, `lg:`, `xl:` 등 Tailwind 클래스 활용

## 🔧 설정 및 배포

### Jekyll 설정
- **설정 파일**: `_config.yml`
- **플러그인**: `_config.yml`의 `plugins` 섹션
- **빌드 설정**: GitHub Pages 호환

### 도메인 설정
- **파일**: `CNAME`
- **도메인**: `minorlab.com`

### Favicon 설정
- **SVG 파일**: `assets/images/favicon.svg` (모던 브라우저 최우선)
- **ICO 파일**: `assets/images/favicon.ico` (구형 브라우저 호환)
- **PNG 파일들**: 16x16 ~ 512x512 다양한 크기 지원
- **Apple Touch Icon**: `favicon_180x180.png` (iOS Safari용)
- **설정 위치**: `_includes/head.html`의 Favicon 섹션

### SEO 최적화
- **메타 태그**: 각 페이지 Front Matter에서 설정
- **사이트맵**: Jekyll 자동 생성
- **구조화된 데이터**: 필요시 추가

## 📋 작업 가이드

### 계정삭제 페이지 특화 사항
- **URL**: `/account-deletion.html`
- **목적**: Google Play Store 요구사항 충족
- **기능**:
  - 앱 내 삭제 방법 안내
  - 이메일 삭제 요청 기능
  - 처리 절차 명시
  - 다국어 지원

### 콘텐츠 업데이트 절차
1. **로컬에서 수정**
2. **로컬 서버로 확인** (`bundle exec jekyll serve`)
3. **Git 커밋 및 푸시**
4. **자동 배포 확인** (GitHub Pages)

## ⚠️ 주의사항

### Jekyll 특화 규칙
- **Liquid 템플릿 문법** 사용
- **Front Matter** 필수 설정
- **빌드 타임에 정적 생성**

### 번역 관리
- **번역 키 일관성** 유지
- **한국어/영어 동시 업데이트**
- **특수문자 이스케이핑** 주의

### 성능 최적화
- **이미지 최적화** (WebP, 압축)
- **CSS/JS 최소화**
- **캐싱 활용**

---

## 📝 변경 이력

### 2025-09-26
- **Favicon 업데이트**: MinorLab 공식 로고로 favicon 전면 교체
  - SVG, ICO, 다양한 크기의 PNG 파일 생성
  - 모던 브라우저용 SVG favicon 우선 지원
  - 구형 브라우저 및 다양한 기기 호환성 보장

---

**프로젝트 오너**: danny@minorlab.com
**최종 업데이트**: 2025-09-26