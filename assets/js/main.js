// MinorLab 홈페이지 메인 JavaScript
class MinorLabSite {
  constructor() {
    this.SUPABASE_URL = 'https://rfgljhekqxphguooidjj.supabase.co';
    this.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmZ2xqaGVrcXhwaGd1b29pZGpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1Njc0NjEsImV4cCI6MjA1MjE0MzQ2MX0.UdPVYMMF4vk8_rX634AzyWiSt4CYa05n3cPNaEPqt4I';

    this.init();
  }

  init() {
    console.log('MinorLabSite initializing...');
    this.setupThemeToggle();
    // 앱 로딩을 더 안정적으로 처리
    this.loadFamilyAppsWithRetry();
    this.setupSmoothScrolling();
    this.setupAnimations();
  }

  // 재시도가 포함된 앱 로딩
  loadFamilyAppsWithRetry() {
    // 즉시 시도
    this.loadFamilyApps();

    // 1초 후 재시도 (API 실패 시를 위해)
    setTimeout(() => {
      const appsContent = document.getElementById('apps-content');
      if (appsContent && appsContent.classList.contains('hidden')) {
        console.log('Apps still hidden, retrying...');
        this.loadFamilyApps();
      }
    }, 1000);

    // 3초 후 마지막 시도 (강제 표시)
    setTimeout(() => {
      const appsContent = document.getElementById('apps-content');
      if (appsContent && appsContent.classList.contains('hidden')) {
        console.log('Force showing default apps after 3 seconds');
        this.showDefaultApps();
      }
    }, 3000);
  }

  // 테마 토글 설정
  setupThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = themeToggle?.querySelector('.theme-icon');

    if (!themeToggle) return;

    // 저장된 테마 로드
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const currentTheme = savedTheme || (prefersDark ? 'dark' : 'light');

    this.setTheme(currentTheme);

    // 테마 토글 이벤트
    themeToggle.addEventListener('click', () => {
      const isCurrentlyDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const newTheme = isCurrentlyDark ? 'light' : 'dark';
      this.setTheme(newTheme);
      localStorage.setItem('theme', newTheme);
    });
  }

  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
      themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  }

  // Supabase API 호출 헬퍼
  async apiCall(endpoint, options = {}) {
    const url = `${this.SUPABASE_URL}/rest/v1${endpoint}`;
    const headers = {
      'apikey': this.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers
    };

    try {
      const response = await fetch(url, { ...options, headers });
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API call error:', error);
      throw error;
    }
  }

  // 패밀리 앱 로드
  async loadFamilyApps() {
    console.log('Starting to load family apps...');
    try {
      const apps = await this.apiCall('/family_apps?is_active=eq.true&order=sort_order.asc');
      console.log('Loaded apps:', apps);

      if (apps && apps.length > 0) {
        console.log('Rendering apps for language:', document.documentElement.lang);
        this.renderApps(apps);

        const loadingEl = document.getElementById('apps-loading');
        const contentEl = document.getElementById('apps-content');

        console.log('Before hiding loading - loading element:', loadingEl);
        console.log('Before showing content - content element:', contentEl);
        console.log('Content element classes before:', contentEl.className);

        loadingEl.classList.add('hidden');
        contentEl.classList.remove('hidden');

        console.log('Content element classes after:', contentEl.className);
        console.log('Apps rendered successfully and visibility toggled');
      } else {
        throw new Error('No apps found');
      }
    } catch (error) {
      console.error('Failed to load family apps:', error);
      console.error('Error details:', error.message, error.stack);

      // 네트워크 오류인 경우 기본 앱 정보 표시
      if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
        console.log('Network error detected, showing default apps');
        this.showDefaultApps();
      } else {
        document.getElementById('apps-loading').classList.add('hidden');
        document.getElementById('apps-error').classList.remove('hidden');
      }
    }
  }

  // 앱 목록 렌더링
  renderApps(apps) {
    console.log('renderApps called with:', apps);
    const appsContainer = document.getElementById('apps-content');
    const currentLang = document.documentElement.lang || 'ko';

    console.log('Apps container:', appsContainer);
    console.log('Current language:', currentLang);

    if (!appsContainer) {
      console.error('Apps container not found!');
      return;
    }

    const html = apps.map(app => this.createAppCard(app, currentLang)).join('');
    console.log('Generated HTML:', html);

    appsContainer.innerHTML = html;
    console.log('HTML set, container content:', appsContainer.innerHTML);
  }

  // 앱 카드 생성
  createAppCard(app, lang = 'ko') {
    console.log('Creating app card for:', app.name, 'in language:', lang);

    const statusClass = this.getStatusClass(app);
    const statusText = this.getStatusText(app, lang);
    const appIcon = this.getAppIcon(app);
    const appDescription = this.getAppDescription(app, lang);

    console.log('Card details:', { statusClass, statusText, appIcon, appDescription });

    const cardHtml = `
      <div class="app-card fade-in">
        <div class="app-icon">${appIcon}</div>
        <h3>${app.name}</h3>
        <p>${appDescription}</p>
        <div class="app-status">
          <span class="status-badge ${statusClass}">${statusText}</span>
        </div>
        ${this.createAppLinks(app)}
      </div>
    `;

    console.log('Generated card HTML:', cardHtml);
    return cardHtml;
  }

  // 앱 설명 가져오기
  getAppDescription(app, lang = 'ko') {
    console.log('getAppDescription called with app:', app.name, 'lang:', lang);

    if (app.description) {
      console.log('Using app.description:', app.description);
      return app.description;
    }

    // 기본 설명 - 더 간단한 로직
    if (lang === 'en') {
      if (app.name === '북랩' || app.target === 'books') {
        return 'Smart app for reading management and tracking';
      } else if (app.name === '루티' || app.target === 'rooty') {
        return 'Healthy living through habit improvement';
      }
    } else {
      // 한국어 기본값
      if (app.name === '북랩' || app.target === 'books') {
        return '독서 관리와 기록을 위한 스마트한 앱';
      } else if (app.name === '루티' || app.target === 'rooty') {
        return '생활 습관 개선으로 건강하게';
      }
    }

    console.log('Using fallback description for:', app.name);
    return lang === 'en' ? 'Innovative app service' : '혁신적인 앱 서비스';
  }

  // 앱 아이콘 결정
  getAppIcon(app) {
    if (app.icon_url) {
      return `<img src="${app.icon_url}" alt="${app.name}" class="app-icon-img">`;
    }

    // 기본 아이콘 (앱 이름 기반)
    const iconMap = {
      '북랩': '📚',
      'booklab': '📚',
      '루티': '🎯',
      'routine': '🎯',
      '드림텔러': '💭',
      'dreamteller': '💭'
    };

    const appName = app.name.toLowerCase();
    return iconMap[appName] || iconMap[app.target] || '📱';
  }

  // 상태 클래스 결정
  getStatusClass(app) {
    if (app.ios_url || app.android_url || app.web_url) {
      return 'status-live';
    } else if (app.target === 'rooty' || app.name.includes('루티')) {
      return 'status-upcoming';
    } else if (app.target === 'books' || app.name.includes('북랩')) {
      return 'status-upcoming'; // 북랩은 출시 예정으로 변경
    } else {
      return 'status-planning';
    }
  }

  // 상태 텍스트 결정
  getStatusText(app, lang) {
    const statusClass = this.getStatusClass(app);

    const statusTexts = {
      ko: {
        'status-live': '서비스 중',
        'status-upcoming': '출시 예정',
        'status-planning': '기획 중'
      },
      en: {
        'status-live': 'Live',
        'status-upcoming': 'Coming Soon',
        'status-planning': 'In Planning'
      }
    };

    return statusTexts[lang][statusClass] || statusTexts.ko[statusClass];
  }

  // 앱 링크 생성
  createAppLinks(app) {
    const links = [];

    if (app.ios_url) {
      links.push(`<a href="${app.ios_url}" target="_blank" rel="noopener noreferrer" class="app-link app-link-ios" title="App Store">🍎 iOS</a>`);
    }

    if (app.android_url) {
      links.push(`<a href="${app.android_url}" target="_blank" rel="noopener noreferrer" class="app-link app-link-android" title="Google Play">🤖 Android</a>`);
    }

    if (app.web_url) {
      links.push(`<a href="${app.web_url}" target="_blank" rel="noopener noreferrer" class="app-link app-link-web" title="Web">🌐 Web</a>`);
    }

    return links.length > 0 ? `<div class="app-links">${links.join('')}</div>` : '';
  }

  // 부드러운 스크롤링 설정
  setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  }

  // 스크롤 애니메이션 설정
  setupAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    // 애니메이션 대상 요소들 관찰
    document.querySelectorAll('.fade-in').forEach(el => {
      observer.observe(el);
    });
  }

  // 네트워크 오류 시 기본 앱 정보 표시
  showDefaultApps() {
    const defaultApps = [
      {
        id: '1',
        name: '북랩',
        description: '독서 관리와 기록을 위한 스마트한 앱',
        icon_url: null,
        ios_url: null,
        android_url: null,
        web_url: null,
        target: 'books',
        platforms: ['ios', 'android'],
        sort_order: 0,
        is_active: true
      },
      {
        id: '2',
        name: '루티',
        description: '생활 습관 개선으로 건강하게',
        icon_url: null,
        ios_url: null,
        android_url: null,
        web_url: null,
        target: 'rooty',
        platforms: ['ios', 'android'],
        sort_order: 1,
        is_active: true
      }
    ];

    console.log('Showing default apps:', defaultApps);
    this.renderApps(defaultApps);
    document.getElementById('apps-loading').classList.add('hidden');
    document.getElementById('apps-content').classList.remove('hidden');
  }
}

// DOM 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', () => {
  new MinorLabSite();
});

// 정책 페이지용 함수들 (전역)
window.MinorLabAPI = {
  // 정책 로드
  async loadPolicy(type) {
    const site = new MinorLabSite();
    try {
      const policies = await site.apiCall(`/policies?type=eq.${type}&is_active=eq.true&order=version.desc&limit=1`);
      return policies && policies.length > 0 ? policies[0] : null;
    } catch (error) {
      console.error(`Failed to load ${type} policy:`, error);
      return null;
    }
  },

  // 마크다운을 HTML로 변환
  convertMarkdownToHtml(markdown) {
    return markdown
      // 헤딩
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      // 굵은 글씨
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // 기울임
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // 링크
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      // 목록
      .replace(/^\- (.*$)/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\s*)+/gs, '<ul>$&</ul>')
      // 단락
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(?![<h123ul])/gm, '<p>')
      .replace(/(?<![>])$/gm, '</p>')
      // 정리
      .replace(/<p><\/p>/g, '')
      .replace(/<p>(<[h123ul])/g, '$1')
      .replace(/(<\/[h123ul]>)<\/p>/g, '$1');
  }
};