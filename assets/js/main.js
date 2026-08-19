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
    this.setupLanguageDropdown();
    // 레거시 앱 목록이 있는 페이지에서만 로드합니다.
    if (document.getElementById('apps-content') && !document.body.classList.contains('homepage')) {
      this.loadFamilyAppsWithRetry();
    }
    this.setupSmoothScrolling();
    this.setupAnimations();
    this.setupAccountDeletion();
  }

  // 재시도가 포함된 앱 로딩
  loadFamilyAppsWithRetry() {
    console.log('=== loadFamilyAppsWithRetry started ===');

    // 즉시 기본 앱 표시 (테스트용)
    console.log('Showing default apps immediately for testing');
    this.showDefaultApps();

    // 동시에 API 호출도 시도
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

  // 언어 드롭다운 설정
  setupLanguageDropdown() {
    const langSelector = document.getElementById('langSelector');
    const langToggle = document.getElementById('langToggle');
    const langDropdown = document.getElementById('langDropdown');

    if (!langSelector || !langToggle || !langDropdown) return;

    // 저장된 언어 기본설정 확인 및 리디렉션
    this.checkSavedLanguagePreference();

    // 드롭다운 토글
    langToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      langSelector.classList.toggle('open');
    });

    // 외부 클릭 시 드롭다운 닫기
    document.addEventListener('click', (e) => {
      if (!langSelector.contains(e.target)) {
        langSelector.classList.remove('open');
      }
    });

    // 언어 옵션 클릭 이벤트 설정
    const langOptions = langDropdown.querySelectorAll('.lang-option');
    langOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        e.preventDefault();
        const selectedLang = option.getAttribute('data-lang');
        const targetUrl = option.getAttribute('href');

        // 언어 선택 저장
        localStorage.setItem('preferredLanguage', selectedLang);

        // 페이지 이동
        window.location.href = targetUrl;

        // 드롭다운 닫기
        langSelector.classList.remove('open');
      });
    });

    // ESC 키로 드롭다운 닫기
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        langSelector.classList.remove('open');
      }
    });
  }

  // 저장된 언어 기본설정 확인
  checkSavedLanguagePreference() {
    const savedLang = localStorage.getItem('preferredLanguage');
    const currentLang = document.documentElement.lang || 'ko';

    // 저장된 언어가 있고 현재 언어와 다르면 리디렉션
    if (savedLang && savedLang !== currentLang) {
      const currentPath = window.location.pathname;
      let targetPath = '';

      if (savedLang === 'ko') {
        // 한국어로 전환 - /en 제거
        if (currentPath.startsWith('/en')) {
          targetPath = currentPath.replace('/en', '') || '/';
        }
      } else if (savedLang === 'en') {
        // 영어로 전환 - /en 추가
        if (!currentPath.startsWith('/en')) {
          targetPath = '/en' + currentPath;
        }
      }

      // 리디렉션 필요한 경우
      if (targetPath && targetPath !== currentPath) {
        console.log(`언어 기본설정 복원: ${currentLang} → ${savedLang}, ${currentPath} → ${targetPath}`);
        window.location.replace(targetPath);
        return true;
      }
    }

    // 현재 언어를 기본설정으로 저장 (첫 방문 시)
    if (!savedLang) {
      localStorage.setItem('preferredLanguage', currentLang);
    }

    return false;
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
        console.log('About to call renderApps with apps:', apps);

        try {
          this.renderApps(apps);
          console.log('renderApps call completed successfully');
        } catch (renderError) {
          console.error('Error calling renderApps:', renderError);
          console.error('Render error stack:', renderError.stack);
          // 오류 발생 시 기본 앱 표시
          this.showDefaultApps();
          return;
        }

        const loadingEl = document.getElementById('apps-loading');
        const contentEl = document.getElementById('apps-content');

        console.log('Before hiding loading - loading element:', loadingEl);
        console.log('Before showing content - content element:', contentEl);
        console.log('Content element classes before:', contentEl ? contentEl.className : 'null');

        if (loadingEl) loadingEl.classList.add('hidden');
        if (contentEl) contentEl.classList.remove('hidden');

        console.log('Content element classes after:', contentEl ? contentEl.className : 'null');
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
    try {
      console.log('renderApps called with:', apps);
      const appsContainer = document.getElementById('apps-content');
      const currentLang = document.documentElement.lang || 'ko';

      console.log('Apps container:', appsContainer);
      console.log('Current language:', currentLang);

      if (!appsContainer) {
        console.error('Apps container not found!');
        return;
      }

      console.log('Starting to generate HTML for each app...');
      const html = apps.map((app, index) => {
        console.log(`Processing app ${index + 1}:`, app.name);
        return this.createAppCard(app, currentLang);
      }).join('');

      console.log('Generated HTML length:', html.length);
      console.log('Generated HTML preview:', html.substring(0, 200) + '...');

      appsContainer.innerHTML = html;
      console.log('HTML set successfully');
      console.log('Container content length:', appsContainer.innerHTML.length);
    } catch (error) {
      console.error('Error in renderApps:', error);
      console.error('Error stack:', error.stack);
    }
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
    if (app.ios_url || app.macos_url || app.android_url || app.web_url) {
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

    if (app.macos_url) {
      links.push(`<a href="${app.macos_url}" target="_blank" rel="noopener noreferrer" class="app-link app-link-macos" title="Mac App Store">💻 macOS</a>`);
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

  // 계정 삭제 폼 설정
  setupAccountDeletion() {
    console.log('setupAccountDeletion called');
    const deletionForm = document.getElementById('deletion-form');
    const confirmCheckbox = document.getElementById('confirm-deletion');
    const submitButton = document.getElementById('submit-button');

    console.log('Elements found:', {
      deletionForm: !!deletionForm,
      confirmCheckbox: !!confirmCheckbox,
      submitButton: !!submitButton
    });

    if (!deletionForm || !confirmCheckbox || !submitButton) {
      console.log('Some elements not found, exiting setup');
      return; // 계정 삭제 페이지가 아니면 리턴
    }

    console.log('Setting up account deletion form');

    // 체크박스 상태에 따라 버튼 활성화/비활성화
    confirmCheckbox.addEventListener('change', () => {
      console.log('Checkbox changed. Checked:', confirmCheckbox.checked);
      submitButton.disabled = !confirmCheckbox.checked;
      console.log('Button disabled:', submitButton.disabled);
    });

    // 폼 제출 처리
    deletionForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!confirmCheckbox.checked) {
        alert('계정 삭제에 동의해주세요.');
        return;
      }

      const formData = new FormData(deletionForm);
      const email = formData.get('email');
      const reason = formData.get('reason') || '';

      // 버튼 비활성화 및 로딩 상태
      submitButton.disabled = true;
      submitButton.innerHTML = `
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        요청 처리 중...
      `;

      try {
        // 계정 삭제 이메일 전송 (새로 구현된 Edge Function 사용)
        const response = await this.sendAccountDeletionEmail(email, reason);

        if (response.success) {
          this.showFormMessage('success', `${email}로 계정 삭제 확인 이메일을 발송했습니다. 이메일을 확인하시고 삭제를 확인해주세요.`);
          deletionForm.reset();
        } else {
          throw new Error(response.error || '요청 처리 중 오류가 발생했습니다.');
        }
      } catch (error) {
        console.error('Account deletion request failed:', error);
        this.showFormMessage('error', '요청 처리 중 오류가 발생했습니다. danny@minorlab.com으로 직접 연락해주세요.');
      } finally {
        // 버튼 상태 복원
        submitButton.disabled = false;
        submitButton.innerHTML = `
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z"></path>
          </svg>
          계정 삭제 요청하기
        `;
      }
    });
  }

  // 계정 삭제 이메일 전송 (새로 구현된 Edge Function 사용)
  async sendAccountDeletionEmail(email, reason) {
    try {
      const response = await fetch(`${this.SUPABASE_URL}/functions/v1/resend-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          to: email,
          subject: 'BookLab 계정 삭제 요청',
          html: `
            <h2>BookLab 계정 삭제 요청</h2>
            <p>안녕하세요,</p>
            <p>BookLab 계정 삭제 요청을 받았습니다.</p>
            <p><strong>계정 이메일:</strong> ${email}</p>
            ${reason ? `<p><strong>삭제 사유:</strong> ${reason}</p>` : ''}
            <p>계정 삭제를 확정하시려면 아래 링크를 클릭해주세요:</p>
            <p><a href="mailto:danny@minorlab.com?subject=BookLab 계정 삭제 확인&body=계정 이메일: ${encodeURIComponent(email)}%0A%0A위 계정의 삭제를 확인합니다." style="background: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">계정 삭제 확인</a></p>
            <p>또는 danny@minorlab.com으로 직접 연락해주세요.</p>
            <p>감사합니다.<br>MinorLab 팀</p>
          `
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to send deletion email:', error);
      return { success: false, error: error.message };
    }
  }

  // 폼 메시지 표시
  showFormMessage(type, message) {
    const messageEl = document.getElementById('form-message');
    if (!messageEl) return;

    messageEl.className = `mt-4 p-4 rounded-lg ${type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`;
    messageEl.innerHTML = `
      <div class="flex">
        <div class="flex-shrink-0">
          ${type === 'success'
            ? '<svg class="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>'
            : '<svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>'
          }
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium">${type === 'success' ? '요청이 성공적으로 전송되었습니다' : '요청 처리 중 오류가 발생했습니다'}</p>
          <p class="mt-1 text-sm">${message}</p>
        </div>
      </div>
    `;
    messageEl.classList.remove('hidden');

    // 성공 메시지는 5초 후 자동으로 숨김
    if (type === 'success') {
      setTimeout(() => {
        messageEl.classList.add('hidden');
      }, 5000);
    }
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
